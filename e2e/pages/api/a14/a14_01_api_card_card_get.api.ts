/**
 * a14-01 カード取得（GET参照系JSON API・カードIDからカードマスタ情報）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a14_01_api_card_card_get_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a14-01) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様由来で判定する（オラクル独立性）。
 *  - 応答キーは仕様の camelCase を期待（付帯表4#4 実装 snake_case 乖離）／公開対象外フィールド非混入を期待（付帯表4#5）。
 *  - 404本文メッセージは仕様「Not Found」を期待（付帯表4#3 実装「見つかりません」乖離はオラクルへ寄せない）。
 *  - 既知SEED値・期待値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 *  - 本エンドポイントには認可属性が無い（公開／CORS制御のみ・AbstractDeckBuilderController.php:51-72／付帯表4#2）。
 */

/**
 * 実効パス（ベース）。
 * 由来: `#[Route('/api/cards/{id}', name: 'api_deck_builder_card', methods: ['GET','OPTIONS'], requirements: ['id'=>'\d+'])]`
 *       （src/Eccube/Controller/App/DeckBuilder/CardController.php:142）＝メソッド getCard（同:148）。
 * 設計書パス `GET /cards/{id}` と実装 `/api/cards/{id}` は `/api` プレフィクスで乖離（付帯表4#1）。
 * 送信先は実装の実効パスへ統一し、合否は設計書の意味で判定する。
 */
export const CARD_GET_PATH_BASE = "/api/cards";

/** カードID（パス変数）を付与した実効パスを組み立てる。 */
export function buildCardPath(id: string | number): string {
  return `${CARD_GET_PATH_BASE}/${id}`;
}

/** 想定外クエリ項目（E2E-A14-01-014）。パス変数 id のみ参照され他クエリは未参照（CardController.php:148-149）。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** 本エンドポイントは認可属性を持たない（公開／CORS制御のみ・付帯表4#2）。負例008は手動・要実機確認のため本specには無い。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== SEED値（SEED-A14-01-*）。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A14-01-CARD-KNOWN 既知の実在カードID（整数）。path に渡すため数値文字列。 */
export const KNOWN_CARD_ID = process.env.A14_01_KNOWN_CARD_ID || "1"; // 要実機確認: 実在カードID
/** SEED-A14-01-CARD-KNOWN（配列/オブジェクトフィールドを持つ）実在カードID（E2E-A14-01-040）。 */
export const ARRAY_FIELD_CARD_ID = process.env.A14_01_ARRAY_FIELD_CARD_ID || KNOWN_CARD_ID; // 要実機確認
/** SEED-A14-01-CARD-KNOWN（power/toughness/loyalty/colorSequence 未設定）実在カードID（E2E-A14-01-041）。 */
export const NULL_FIELD_CARD_ID = process.env.A14_01_NULL_FIELD_CARD_ID || KNOWN_CARD_ID; // 要実機確認

/** SEED-A14-01-CARD-NONE カードマスタに存在しないカードID（未登録の整数）（E2E-A14-01-010/015/016/019）。 */
export const NONE_CARD_ID = process.env.A14_01_NONE_CARD_ID || "999999999";

/** 異常パラメータ（id≦0）。id=0（E2E-A14-01-011）。 */
export const ZERO_CARD_ID = process.env.A14_01_ZERO_CARD_ID || "0";
/** 異常パラメータ（負値）。要件 `\d+` 不一致（E2E-A14-01-011/019）。 */
export const NEGATIVE_CARD_ID = process.env.A14_01_NEGATIVE_CARD_ID || "-1";
/** 形式不正（非数値）。要件 `\d+` 不一致（E2E-A14-01-012）。 */
export const NON_NUMERIC_CARD_ID = process.env.A14_01_NON_NUMERIC_CARD_ID || "abc";

// ===== 既知レコード期待値（E2E-A14-01-002/004/013 値照合）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====

/** カード id の期待値（SEED既知レコード。004/013 で指定IDとの一致を確認するためのベースは KNOWN_CARD_ID）。 */
export const EXPECTED_NAME_JP = process.env.A14_01_EXPECTED_NAME_JP;
/** nameEn の期待値（SEED既知レコード）。 */
export const EXPECTED_NAME_EN = process.env.A14_01_EXPECTED_NAME_EN;
/** manaCost の期待値（SEED既知レコード）。 */
export const EXPECTED_MANA_COST = process.env.A14_01_EXPECTED_MANA_COST;

/** 404失敗応答の message（正本md 入出力 レスポンス(失敗)「Not Found」）。実装は「見つかりません」（付帯表4#3）だが期待値は仕様へ寄せる。 */
export const NOT_FOUND_MESSAGE = "Not Found";

/**
 * 仕様の string 型フィールド群（正本md 入出力 レスポンス(成功)。型契約 E2E-A14-01-006）。
 * 命名は仕様の camelCase（付帯表4#4 実装 snake_case 乖離はオラクルへ寄せない）。
 */
export const STRING_FIELDS = [
  "nameJp",
  "nameEn",
  "arenaFormatNameJp",
  "arenaFormatNameEn",
  "textJp",
  "textEn",
  "manaCost",
  "oldProductId",
  "oldEnProductId",
  "updateDate",
  "createDate",
] as const;

/** 仕様の array 型フィールド群（正本md 入出力 レスポンス(成功)。E2E-A14-01-006/040）。 */
export const ARRAY_FIELDS = [
  "cardtypes",
  "subtypes",
  "specialtypes",
  "colors",
  "cardDetails",
  "cardFormats",
] as const;

/**
 * 公開対象外フィールド（正本md 入出力 レスポンス(成功)「公開対象外で応答に含まれない」。E2E-A14-01-040）。
 * 実装は全プロパティ出力で混入し得る（付帯表4#5）。テストは非混入を期待し、混入すれば落ちて検出する。
 */
export const PUBLIC_EXCLUDED_FIELDS = ["cardtags", "keywordAbilities", "articles", "deckCards"] as const;

/** null 許容フィールド（power/toughness/loyalty／未設定時 null。E2E-A14-01-041）。 */
export const NULLABLE_FIELDS = ["power", "toughness", "loyalty"] as const;

/** 成功レスポンスのルート型（正本md 入出力 レスポンス(成功)）。命名は仕様 camelCase。 */
export type CardGetSuccessBody = {
  id: number;
  cmc: number;
  colorSequence: Record<string, unknown> | null;
  [key: string]: unknown;
};

/** 404失敗レスポンスのルート型（正本md 入出力 レスポンス(失敗)）。 */
export type CardGetErrorBody = {
  code: number;
  message: string;
};
