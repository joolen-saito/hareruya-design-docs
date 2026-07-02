/**
 * a15-14 デッキビルダー_メタゲーム（指定フォーマットのアーキタイプ別大会デッキ件数と占有率を返す JSON API・GET参照系）API/統合レイヤ用 パス／クエリ／ヘルパ。
 * ケース表 integration_test/e2e/a15_14_api_deck_builder_deck_metagame_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a15-14) 入出力記載のリクエスト仕様（認証なし公開参照系の GET）のみを最小構成で組む未実行雛形。実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・エラーメッセージ文言を期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/metagame`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/api/metagame', name: 'api_deck_builder_metagame', methods: ['GET','OPTIONS'])]`（DeckController.php:556）
 *          ＋ App配下コントローラはプレフィクスなしで読み込まれる（app/config/eccube/routes.yaml:5-7）＝実効パス。
 *    正本md `GET /metagame` は `/api` プレフィクスを欠き不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - 認証属性（IsGranted 等）は当該メソッドに無く、認証なしで呼べる公開参照系（正本md「本APIは認証を行わない」と整合）。資格情報シードは不要（付帯表3）。
 *  - format_id は `$request->query->all()['format_id']`（DeckController.php:563-570）で単一/配列を受理。空なら 400（DeckController.php:571-576）。
 *    フォーマット取得 `findBy(['id'=>$formatIds])`（581）で0件なら 404（583-588）。count は `array_slice($archetypes,0,$limit)`（617-619、ctype_digit 判定 578-579）。
 *  - 合否（成功）は HTTP200＋応答 `{code, formats:[...]}`、（失敗）は format_id未指定=400／一致なし=404＋`{code,message}` を仕様（正本md）由来で判定する（spec側）。
 *  - エラーメッセージは正本md文言を期待値とする（400「invalid request parameter」・404「format not found」は実装文言と乖離＝付帯表4#2/#3）。実装文言へ固定しない。
 *  - from_date は集計範囲開始日時の `Y/m/d h:m:s` 書式文字列（入出力 レスポンス（成功））。書式トークン h/m の意味は要確認（付帯表4#4）。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。集計値（deck_count・公開/大会のみ絞り込み・既知件数照合）はDB照合（DB副作用観測）で判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。
 *  - SEED format_id・count・複数format_id は env 供給（要実機確認の暫定値）。原値はコミットしない（付帯表3）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_14_READY。
 */

/**
 * メタゲームAPI実効パス。
 * 由来: DeckController.php:556（Route `/api/metagame`）＋ routes.yaml:5-7（App配下プレフィクスなし）＝実効 `GET /api/metagame`。
 * 正本md `GET /metagame`（接頭辞 `/api` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export const METAGAME_PATH = "/api/metagame";

// ===== SEED format_id・count（env 供給・既定は要実機確認の暫定。HAS_API(A15_14_READY) ガード下でのみ送信される） =====

/**
 * SEED format_id（付帯表3）。env 供給・既定値は要実機確認のプレースホルダ。
 *  - METAGAME:     SEED-A15-14-FORMAT-METAGAME。集計対象の実在フォーマット（公開・大会デッキを件数分布既知で投入）。
 *  - METAGAME_2:   SEED-A15-14-FORMAT-METAGAME。複数format_id配列指定(047)用の別の実在フォーマット。
 *  - EMPTY:        SEED-A15-14-FORMAT-EMPTY。実在するが集計範囲内に公開・大会デッキが0件のフォーマット（200空archetypes・404と区別＝040）。
 *  - UNREGISTERED: SEED-A15-14-FORMAT-NONE。未登録のID（一致フォーマットなし→404＝005/025/033）。
 *  - NON_NUMERIC:  SEED-A15-14-FORMAT-NONE。非数値値（一致フォーマットなし→404＝005）。
 */
export const FORMAT_ID = {
  METAGAME: process.env.A15_14_FORMAT_ID || "1", // 要実機確認: SEED-A15-14-FORMAT-METAGAME
  METAGAME_2: process.env.A15_14_FORMAT_ID_2 || "2", // 要実機確認: SEED-A15-14-FORMAT-METAGAME（複数指定047）
  EMPTY: process.env.A15_14_FORMAT_EMPTY_ID || "3", // 要実機確認: SEED-A15-14-FORMAT-EMPTY（集計0件040）
  UNREGISTERED: process.env.A15_14_FORMAT_NONE_ID || "99999999", // 未登録ID（404＝005/025/033）
  NON_NUMERIC: process.env.A15_14_FORMAT_NON_NUMERIC || "not-a-number", // 非数値値（404＝005）
} as const;

/** count 絞り込み値（041：アーキタイプ数より小さい既知値）。env 供給・既定は要実機確認の暫定。 */
export const COUNT_LIMIT = Number(process.env.A15_14_COUNT_LIMIT || 2);

// ===== クエリ／パス組み立て（正本md 入出力 リクエスト記載のクエリのみ） =====

/** key/value 配列から `?a=b&...` クエリ文字列を組む（配列指定は `format_id[]` を複数 append）。 */
function toQueryString(parts: Array<[string, string]>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of parts) usp.append(key, value);
  const s = usp.toString();
  return s ? `?${s}` : "";
}

/** 単一 format_id でのメタゲーム取得パスを組む（001-004,024,026,027,032,036,037,043,044,046）。 */
export function buildMetagamePath(formatId: string | number): string {
  return `${METAGAME_PATH}${toQueryString([["format_id", String(formatId)]])}`;
}

/**
 * 複数 format_id（配列）でのメタゲーム取得パスを組む（047）。
 * 由来: `$request->query->all()['format_id']` は単一/配列を受理（DeckController.php:563-570）。Symfony は `format_id[]=..` を配列として解釈する。
 */
export function buildMetagamePathMulti(formatIds: Array<string | number>): string {
  return `${METAGAME_PATH}${toQueryString(formatIds.map((id) => ["format_id[]", String(id)]))}`;
}

/** format_id ＋ count を指定したメタゲーム取得パスを組む（041 上位 count 件絞り込み）。 */
export function buildMetagamePathWithCount(formatId: string | number, count: number): string {
  return `${METAGAME_PATH}${toQueryString([
    ["format_id", String(formatId)],
    ["count", String(count)],
  ])}`;
}

/** format_id を一切付与しないパス（008/030/031 未指定→400）。 */
export function buildMetagamePathNoFormatId(): string {
  return METAGAME_PATH;
}

/**
 * 正常 format_id ＋想定外クエリ項目（count に非数値を含む）を付与したパス（006）。
 * 由来: count は ctype_digit 判定（DeckController.php:578-579）で追加検証なし。想定外クエリの無視可否は正本に明記が無く要実機確認。
 */
export function buildMetagamePathWithUnknownQuery(formatId: string | number): string {
  return `${METAGAME_PATH}${toQueryString([
    ["format_id", String(formatId)],
    ["count", "not-a-number"], // count 非数値（追加検証なし仕様）
    ["unexpected_param", "x"], // 想定外クエリ項目
  ])}`;
}

// ===== 認証ヘッダ（公開参照系のため認証なし。利用者状態違いの冪等観測用に2種を用意＝037） =====

/** 認証ヘッダを付与しないヘッダ（公開参照系の標準呼び出し）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { Accept: "application/json" };
}

/**
 * 別の利用者状態を表すヘッダ（037：利用者状態によらず同一結果＝冪等参照の比較用）。
 * 本APIは認証を行わないため認可は変わらないが、状態差分（任意ヘッダ）を付けても同一結果となることを観測する。
 */
export function buildAltClientHeaders(): Record<string, string> {
  return { Accept: "application/json", "X-Client": "alt" };
}

// ===== 正本md由来のオラクル（レスポンス構造・型契約・エラー文言）。実装の乖離は付帯表4で記録（テストは正本md由来で照合し違えば落として検出） =====

/** 成功レスポンス トップレベルのフィールド（正本md 入出力 レスポンス（成功）：code・formats）。 */
export const SUCCESS_TOP_FIELDS = ["code", "formats"] as const;

/** formats[] 要素のフィールド（正本md：id・name_jp・name_en・from_date・archetypes）。 */
export const FORMAT_FIELDS = ["id", "name_jp", "name_en", "from_date", "archetypes"] as const;

/** archetypes[] 要素のフィールド（正本md：id・name_jp・name_en・card_image・deck_count・rate）。 */
export const ARCHETYPE_FIELDS = ["id", "name_jp", "name_en", "card_image", "deck_count", "rate"] as const;

/**
 * 正本md由来の型契約（032）。
 *  - code・id・deck_count は integer、name_jp・name_en・from_date は string、card_image は string（未設定時null）、rate は number（百分率・小数第2位）。JSONキーは snake_case。
 */
export const TYPE_ORACLE = {
  INTEGER_FIELDS: ["id", "deck_count"] as const, // archetype の integer 型フィールド
  STRING_FIELDS: ["name_jp", "name_en"] as const, // archetype の string 型フィールド（card_image は null 許容で別扱い）
} as const;

/**
 * from_date 書式オラクル（045・付帯表4#4）。正本md「Y/m/d h:m:s」文字列・サンプル「2026/05/04 00:05:00」。
 * テストはこの書式（数値で構成された Y/m/d h:m:s 文字列）であることを期待し、h/m トークンの意味の妥当性は要実機確認。
 */
export const FROM_DATE_PATTERN = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/;

/**
 * 正本md由来のエラーメッセージ文言（オラクル）。実装文言の乖離は付帯表4で記録（テストは正本md文言で照合し違えば落として検出）。
 *  - FORMAT_ID_REQUIRED: format_id未指定時の 400 message（正本md「invalid request parameter」。実装は「フォーマットIDは必須です／format_id is required」＝付帯表4#2）。
 *  - FORMAT_NOT_FOUND:    一致フォーマットなし時の 404 message（正本md「format not found」。実装は「フォーマットが見つかりません／The format does not exist」＝付帯表4#3）。
 */
export const SPEC_ERROR_MESSAGE = {
  FORMAT_ID_REQUIRED: "invalid request parameter",
  FORMAT_NOT_FOUND: "format not found",
} as const;
