/**
 * a15-08 デッキビルダー_カード検索（カード名・種別・色・マナ総量等の条件でカードを検索し一覧と総件数を返すJSON API・GET参照系）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_08_api_deck_builder_deck_card_search_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a15-08・正本md)入出力記載のリクエスト仕様（クエリ文字列の検索条件）のみを最小構成で組む未実行雛形。実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・Form制約を期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/cards`（付帯表1/付帯表4#1。
 *    `#[Route('/api/cards', name:'api_deck_builder_cards_search', methods:['GET','OPTIONS'])]` ＝CardController.php:71）。
 *    設計書(正本md/pf-api)の `GET /cards`（利用者視点の入口）とは `/api` プレフィクスで不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 *  - 入力はクエリ文字列（GET参照）。検索条件は全て任意で、未指定は既定値補完（論理AND・page=1・per_page=20・sort=color・order=asc／MtbCardRepository.php:546-549）。
 *  - 許容値検証は `isValidSearchParams`（CardController.php:98-112）で、各 `_condition`／`sort`／`order`／`illegal_condition`（CONDITION_FIELDS:35-45）と
 *    数値項目 format／各 `*_from`・`*_to`／page／per_page（NUMERIC_FIELDS:47-59）を検証し、いずれか不正で 400（CardController.php:79-84）。
 *  - 合否（成功）は HTTP200＋ラッパ `{code, total_count, cards}`（CardController.php:88-92）。
 *    型契約（正本md 入出力 レスポンス(成功)）: code/total_count/id/mana_value=integer、name_jp/name_en=string、cardtypes/colors=数値配列、
 *    is_attraction/is_sticker=該当1・非該当0のinteger、image_jp/image_en=string（画像なしはnull）。
 *    `mana_value` は設計=integer だが実装は float キャスト（MtbCardRepository.php:585）＝付帯表4#2。017は仕様の integer 型を期待し違えば落として検出する。
 *  - 合否（該当0件）は HTTP200＋ total_count=0・空 cards（MtbCardRepository.php:583-604／エラー処理）。
 *  - 合否（許容値違反）は HTTP400（単一メッセージ・bool判定＝CardController.php:79-84。複数エラー集約/ソート順は持たない＝付帯表4#5）。
 *  - 本APIは認証を行わない（CardController.php:71-93 に認証処理なし／付帯表4#4）。資格情報の欠落/不正でも401を返さず200となる（001）。
 *  - 配列クエリの符号化（`key[]=v` 形式）は設計に明記が無く 要実機確認（実装の受領形式に合わせ差し替える）。
 *  - SEED 期待値・既知カード値は env で供給し、未設定時の既定値は要実機確認の暫定（テスト環境固定値へ差し替える）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_08_READY。
 */

/**
 * カード検索API実効パス。
 * 由来: CardController.php:71（Route `/api/cards`・methods GET/OPTIONS）。
 * 設計書(正本md/pf-api)の `/cards` とは `/api` プレフィクスで不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 */
export const CARDS_PATH = "/api/cards";

/** 検索条件クエリの型（全任意・配列項目は複数値）。値の出所は設計書 入出力 リクエスト。 */
export type SearchParams = Record<string, string | number | boolean | Array<string | number>>;

/**
 * 検索条件を実効パスのクエリ文字列に符号化する（GET送信先）。
 * 配列は `key[]=v` 形式で展開する（PHP慣例。設計に明記なし＝要実機確認・実装の受領形式へ差し替える）。
 */
export function buildCardsPath(params: SearchParams): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) sp.append(`${key}[]`, String(item));
    } else {
      sp.append(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `${CARDS_PATH}?${qs}` : CARDS_PATH;
}

// ===== SEED-A15-08-CARDS-KNOWN（env供給・原値非コミット。既定値は要実機確認の暫定） =====

function parseIds(raw: string | undefined, fallback: number[]): number[] {
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
}

/** 既知カード名の部分語（部分一致で1件以上ヒット／030,001-004,009 等）。 */
export const KNOWN_NAME_PART = process.env.A15_08_KNOWN_NAME_PART || "Dragon"; // 要実機確認
/** 既知カード名の完全一致名（完全一致優先 037）。 */
export const KNOWN_NAME_EXACT = process.env.A15_08_KNOWN_NAME_EXACT || "Shivan Dragon"; // 要実機確認
/** 複数語のカード名（name_condition AND/OR/NOT の集合差確認 031／空白で語分割）。 */
export const KNOWN_NAME_WORDS = process.env.A15_08_KNOWN_NAME_WORDS || "Dragon Goblin"; // 要実機確認
/** 複数語のカードテキスト（text_condition AND/OR/NOT の集合差確認 046）。 */
export const KNOWN_TEXT_WORDS = process.env.A15_08_KNOWN_TEXT_WORDS || "flying haste"; // 要実機確認

/** 既知のカード種別ID配列（032,019）。 */
export const KNOWN_CARDTYPE = parseIds(process.env.A15_08_KNOWN_CARDTYPE, [1]); // 要実機確認
/** 既知の色ID配列（032,019,043）。 */
export const KNOWN_COLOR = parseIds(process.env.A15_08_KNOWN_COLOR, [1]); // 要実機確認
/** 除外色ID配列（exclude_color 033）。 */
export const EXCLUDE_COLOR = parseIds(process.env.A15_08_EXCLUDE_COLOR, [2]); // 要実機確認
/** 既知のサブタイプID配列（subtype 047）。 */
export const KNOWN_SUBTYPE = parseIds(process.env.A15_08_KNOWN_SUBTYPE, [1]); // 要実機確認
/** 既知のレアリティID配列（rarity 048）。 */
export const KNOWN_RARITY = parseIds(process.env.A15_08_KNOWN_RARITY, [1]); // 要実機確認

/** 既知のフォーマット識別子（format 035）。 */
export const KNOWN_FORMAT = process.env.A15_08_KNOWN_FORMAT || "1"; // 要実機確認

/** マナ総量の範囲下限・上限（mana_value_from/to 034）。 */
export const KNOWN_MANA_FROM = Number(process.env.A15_08_KNOWN_MANA_FROM || "3"); // 要実機確認
export const KNOWN_MANA_TO = Number(process.env.A15_08_KNOWN_MANA_TO || "6"); // 要実機確認
/** マナ総量の一致指定値（範囲とは別挙動の一致 049）。 */
export const KNOWN_MANA_VALUES = parseIds(process.env.A15_08_KNOWN_MANA_VALUES, [3, 4]); // 要実機確認
/** マナ総量の除外指定値（exclude_mana_value 050）。 */
export const EXCLUDE_MANA_VALUES = parseIds(process.env.A15_08_EXCLUDE_MANA_VALUES, [0]); // 要実機確認

/** ページング検証用の小さい per_page（038・SEEDは per_page超の件数を確保）。 */
export const SMALL_PER_PAGE = Number(process.env.A15_08_SMALL_PER_PAGE || "2"); // 要実機確認
/** 総ページ数を超えるページ番号（045）。 */
export const BIG_PAGE = Number(process.env.A15_08_BIG_PAGE || "9999"); // 要実機確認

// ===== SEED-A15-08-CARDS-NONE（該当0件を誘発する条件） =====

/** どのカードにも部分一致しないカード名（該当0件 018）。 */
export const NONE_NAME = process.env.A15_08_NONE_NAME || "____NO_SUCH_CARD_NAME____"; // 該当0件
/** どのカードも満たさない範囲外マナ総量（絞り込み0件 044）。 */
export const NOHIT_MANA_FROM = Number(process.env.A15_08_NOHIT_MANA_FROM || "999"); // 範囲外
export const NOHIT_MANA_TO = Number(process.env.A15_08_NOHIT_MANA_TO || "1000"); // 範囲外

// ===== 特殊文字（040,041）。原値は設計の挙動確認用で env 上書き可 =====

/** ダブルクォートで囲んだ一語扱いの検索語（040・空白/カンマは語分割）。 */
export const DQ_NAME = process.env.A15_08_DQ_NAME || '"Serra Angel"'; // ダブルクォートで一語扱い
/** SQLメタ文字・記号を含む検索語（041・% _ ' 等／5xxで停止しないこと）。 */
export const SPECIAL_NAME = process.env.A15_08_SPECIAL_NAME || "100% _x_ ' OR 1=1"; // 特殊文字

// ===== 想定外クエリ項目（006・要実機確認）。既知項目のみ検証走査＝検索条件に積まれない =====

/** 想定外クエリ項目のキー名（既知項目以外＝CardController.php:100-109 の走査対象外）。 */
export const UNKNOWN_QUERY_KEY = process.env.A15_08_UNKNOWN_QUERY_KEY || "unexpected_param";

// ===== 許容値違反（enum外/数値外）の入力値（005,007,010,015,042,043） =====

/** 各 `_condition` 許容語以外（005・例 XYZ）。許容語は AND/OR/NOT（色のみ AND/OR）。 */
export const INVALID_CONDITION = process.env.A15_08_INVALID_CONDITION || "XYZ";
/** format に数値以外（007・例 abc）。NUMERIC_FIELDS は数値のみ許容。 */
export const INVALID_FORMAT_VALUE = process.env.A15_08_INVALID_FORMAT_VALUE || "abc";
/** sort 許容外（010・例 unknown）。許容は color/mana_value/power/toughness。 */
export const INVALID_SORT = process.env.A15_08_INVALID_SORT || "unknown";
/** order 許容外（015・例 up）。許容は asc/desc。 */
export const INVALID_ORDER = process.env.A15_08_INVALID_ORDER || "up";
/** illegal_condition 許容外（042・例 yes）。許容は true/false。 */
export const INVALID_ILLEGAL_CONDITION = process.env.A15_08_INVALID_ILLEGAL_CONDITION || "yes";

// ===== 成功レスポンスの仕様フィールド（017・正本md 入出力 レスポンス(成功)） =====

/** ラッパ直下のフィールド（CardController.php:88-92）。 */
export const WRAPPER_FIELDS = ["code", "total_count", "cards"] as const;
/** cards[] 各要素のフィールド（MtbCardRepository.php:563-587）。 */
export const CARD_FIELDS = [
  "id",
  "name_jp",
  "name_en",
  "cardtypes",
  "colors",
  "mana_value",
  "is_attraction",
  "is_sticker",
  "image_jp",
  "image_en",
] as const;

// ===== 検索条件ビルダー（各テストID対応） =====

/** 既知カードに部分一致する基本の正常検索（001-004,009,011,012,017,020,030,045 等）。 */
export function buildKnownSearch(): SearchParams {
  return { name: KNOWN_NAME_PART };
}

/** クエリ無し＝既定値補完（016）。 */
export function buildEmptySearch(): SearchParams {
  return {};
}

/** どのカードにも一致しない検索（該当0件 018）。 */
export function buildNoneSearch(): SearchParams {
  return { name: NONE_NAME };
}

/** name_condition に許容語以外（005・400期待）。 */
export function buildInvalidNameCondition(): SearchParams {
  return { name: KNOWN_NAME_WORDS, name_condition: INVALID_CONDITION };
}

/** 正常条件＋想定外クエリ項目（006・要実機確認）。想定外項目は検索条件に積まれない。 */
export function buildExtraQuerySearch(): SearchParams {
  return { name: KNOWN_NAME_PART, [UNKNOWN_QUERY_KEY]: "x" };
}

/** format に数値以外（007・400期待）。 */
export function buildInvalidFormat(): SearchParams {
  return { format: INVALID_FORMAT_VALUE };
}

/** sort 許容外（010・400期待）。 */
export function buildInvalidSort(): SearchParams {
  return { sort: INVALID_SORT };
}

/** order 許容外（015・400期待）。 */
export function buildInvalidOrder(): SearchParams {
  return { order: INVALID_ORDER };
}

/** illegal_condition 許容外（042・400期待）。 */
export function buildInvalidIllegalCondition(): SearchParams {
  return { illegal_condition: INVALID_ILLEGAL_CONDITION };
}

/** color_condition に NOT（色は AND/OR のみ＝043・400期待）。 */
export function buildColorConditionNot(): SearchParams {
  return { color: KNOWN_COLOR, color_condition: "NOT" };
}

/** 種別・色の配列指定（019,032）。 */
export function buildTypeColorSearch(): SearchParams {
  return { cardtype: KNOWN_CARDTYPE, color: KNOWN_COLOR };
}

/** 複数語の name＋name_condition（031・AND/OR/NOT 切替）。 */
export function buildNameWords(condition: "AND" | "OR" | "NOT"): SearchParams {
  return { name: KNOWN_NAME_WORDS, name_condition: condition };
}

/** exclude_color（033・指定色を持つカードを除外）。 */
export function buildExcludeColorSearch(): SearchParams {
  return { exclude_color: EXCLUDE_COLOR };
}

/** マナ総量の範囲指定（034・from/to）。 */
export function buildManaRangeSearch(): SearchParams {
  return { mana_value_from: KNOWN_MANA_FROM, mana_value_to: KNOWN_MANA_TO };
}

/** format＋illegal_condition（035・true/false 切替）。 */
export function buildFormatSearch(illegal: "true" | "false"): SearchParams {
  return { format: KNOWN_FORMAT, illegal_condition: illegal };
}

/** sort=mana_value＋order（036・asc/desc 切替）。 */
export function buildSortSearch(order: "asc" | "desc"): SearchParams {
  return { sort: "mana_value", order };
}

/** 完全一致優先（037・name 完全一致名＋name_match_priority=true）。 */
export function buildNameMatchPrioritySearch(): SearchParams {
  return { name: KNOWN_NAME_EXACT, name_match_priority: "true" };
}

/** ページング（038・per_page 小・page 指定）。 */
export function buildPagingSearch(page: number): SearchParams {
  return { name: KNOWN_NAME_PART, per_page: SMALL_PER_PAGE, page };
}

/** per_page 上限超過（039・100に丸めて処理）。 */
export function buildPerPageOverSearch(): SearchParams {
  return { name: KNOWN_NAME_PART, per_page: 200 };
}

/** ダブルクォートで囲んだ一語扱いの name（040）。 */
export function buildDoubleQuoteNameSearch(): SearchParams {
  return { name: DQ_NAME };
}

/** SQLメタ文字を含む name（041・5xxで停止しない）。 */
export function buildSpecialCharNameSearch(): SearchParams {
  return { name: SPECIAL_NAME };
}

/** 絞り込み結果0件（044・範囲外マナ総量）。 */
export function buildNoHitFilterSearch(): SearchParams {
  return { mana_value_from: NOHIT_MANA_FROM, mana_value_to: NOHIT_MANA_TO };
}

/** 総ページ数を超えるページ番号（045）。 */
export function buildPageBeyondSearch(): SearchParams {
  return { name: KNOWN_NAME_PART, page: BIG_PAGE };
}

/** カードテキスト＋text_condition（046・AND/OR/NOT 切替）。 */
export function buildTextSearch(condition: "AND" | "OR" | "NOT"): SearchParams {
  return { text: KNOWN_TEXT_WORDS, text_condition: condition };
}

/** サブタイプ配列＋subtype_condition（047）。 */
export function buildSubtypeSearch(condition: "AND" | "OR" | "NOT"): SearchParams {
  return { subtype: KNOWN_SUBTYPE, subtype_condition: condition };
}

/** レアリティ配列＋rarity_condition（048）。 */
export function buildRaritySearch(condition: "AND" | "OR" | "NOT"): SearchParams {
  return { rarity: KNOWN_RARITY, rarity_condition: condition };
}

/** マナ総量の一致指定（049・配列）。 */
export function buildManaMatchSearch(): SearchParams {
  return { mana_value: KNOWN_MANA_VALUES };
}

/** マナ総量の除外指定（050・配列）。 */
export function buildExcludeManaSearch(): SearchParams {
  return { exclude_mana_value: EXCLUDE_MANA_VALUES };
}

// ===== 資格情報（本APIは認証なし＝001で「拒否されない・200」を確認）。原値は書かない =====

/** 資格情報を付与しないヘッダ（001 欠落ケース）。本APIは認証を行わない＝401を返さない。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

/** 不正な資格情報を付与したヘッダ（001 不正値ケース）。原値はSEED不要・無効値で再現。 */
export function buildInvalidAuthHeaders(): Record<string, string> {
  return { "jwt-token": process.env.A15_08_INVALID_JWT || "invalid.jwt.token.value" }; // 要実機確認（無効値）
}
