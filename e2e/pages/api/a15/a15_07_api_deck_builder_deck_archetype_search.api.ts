/**
 * a15-07 デッキビルダー_アーキタイプ検索（フォーマットIDに紐づくアーキタイプ一覧を返すJSON API・GET参照系）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_07_api_deck_builder_deck_archetype_search_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a15-07・正本md)入出力記載のリクエスト仕様（パス変数 formatId のみ）を最小構成で組む未実行雛形。実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・ルート制約を期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/archetypes/{formatId}`（付帯表1/付帯表4#1。
 *    `#[Route('/api/archetypes/{formatId}', name:'api_deck_builder_archetypes', methods:['GET','OPTIONS'], requirements:['formatId'=>'\d+'])]` ＝ArchetypeController.php:38）。
 *    設計書(正本md/pf-api)の `GET /archetypes/{formatId}` とは `/api` プレフィクスで不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 *  - 合否（成功）は HTTP200＋本文 `{code, archetypes:[{id, name_jp, name_en}]}`（型: code/id=integer・name_jp/name_en=string・配列要素キーはsnake_case）を仕様由来で判定（spec側）。
 *    由来: ArchetypeController.php:55-58／DtbArchetypeRepository.php:138-143,134（`a.id`・`a.nameJp AS name_jp`・`a.nameEn AS name_en`、明示orderByなし＝既定順）。
 *  - 合否（フォーマット不存在）は HTTP404＋本文 `{code, message}`（message は仕様の「The format does not exist」）。
 *    実装は `createErrorResponse(404, trans('api.deck_builder.common.not_found'))`＝message文言が翻訳キー値（"Not Found"/"見つかりません"）で設計と乖離（付帯表4#2）。仕様文言を期待し違えば落として検出する（実装文言へ寄せない）。
 *  - 本APIは認証を行わない（認証・認可処理が実装に存在しない・ArchetypeController.php全体）。資格情報(jwt-token)欠落/不正でも401を返さず200となる（005）。
 *  - 必須欠落(007)・不正値(016)・非数値(041)の具体ステータス（ルート不一致/404/405等）は設計に明記が無く要実機確認（付帯表4#4）。テストは「正常取得200とならない」のみを判定する。
 *  - SEED 期待値・既知formatId/アーキタイプ値は env で供給し、未設定時の既定値は要実機確認の暫定（テスト環境固定値へ差し替える）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_07_READY。
 */

/**
 * アーキタイプ検索API実効パスの基底。
 * 由来: ArchetypeController.php:38（Route `/api/archetypes/{formatId}`・methods GET/OPTIONS・requirements formatId=\d+）。
 * 設計書(正本md/pf-api)の `/archetypes/{formatId}` とは `/api` プレフィクスで不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 */
export const ARCHETYPE_BASE_PATH = "/api/archetypes";

/** パス変数 formatId を埋めた実効パスを組み立てる（GET送信先）。 */
export function buildArchetypePath(formatId: string): string {
  return `${ARCHETYPE_BASE_PATH}/${formatId}`;
}

/**
 * formatId を欠いたパス（E2E-A15-07-007）。
 * 必須パス変数 formatId 欠落＝ルート不一致で正常取得200とならない（具体ステータスは要実機確認・付帯表4#4）。
 */
export const MISSING_FORMAT_PATH = `${ARCHETYPE_BASE_PATH}/`;

// ===== SEED 由来の formatId（env 供給・既定値は要実機確認の暫定。requirements \d+ に合わせ数値文字列） =====

/** SEED-A15-07-FORMAT-KNOWN アーキタイプが1件以上紐づく実在フォーマットID（001-007,009,011,014,015,017,040,041）。 */
export const KNOWN_FORMAT_ID = process.env.A15_07_KNOWN_FORMAT_ID || "1"; // 要実機確認

/** SEED-A15-07-FORMAT-EMPTY 実在するがアーキタイプ0件のフォーマットID（E2E-A15-07-010）。 */
export const EMPTY_FORMAT_ID = process.env.A15_07_EMPTY_FORMAT_ID || "2"; // 要実機確認

/** SEED-A15-07-FORMAT-NONE フォーマットマスタに存在しない formatId（未登録の整数値・008,012,013,016）。 */
export const NONE_FORMAT_ID = process.env.A15_07_NONE_FORMAT_ID || "999999999"; // 未存在ID（要実機確認）

/** 非数値（型不正）の formatId（E2E-A15-07-041）。requirements \d+ にルート不一致で正常取得200とならない。 */
export const NON_NUMERIC_FORMAT_ID = process.env.A15_07_NON_NUMERIC_FORMAT_ID || "abc"; // 形式不正

// ===== 資格情報（本APIは認証なし＝005で「拒否されない・200」を確認）。原値は書かない =====

/** 資格情報(jwt-token)を付与しないヘッダ（E2E-A15-07-005 欠落ケース）。本APIは認証を行わない＝401を返さない。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

/** 無効な jwt-token を付与したヘッダ（E2E-A15-07-005 無効値ケース）。原値はSEED不要・無効値で再現（付帯表3注）。 */
export function buildInvalidAuthHeaders(): Record<string, string> {
  return { "jwt-token": process.env.A15_07_INVALID_JWT || "invalid.jwt.token.value" }; // 要実機確認（無効値）
}

// ===== 想定外クエリ項目（E2E-A15-07-009・要実機確認）。パス変数のみ参照＝サーバエラーで停止しないことのみ判定 =====

/** 想定外クエリ項目（formatIdはパス変数で受領・クエリは未参照＝ArchetypeController.php:38-39）。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

// ===== 既知アーキタイプ期待値（値照合・絞り込み確認）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====

/** SEED-A15-07-FORMAT-KNOWN 既知アーキタイプの id（E2E-A15-07-002/004/040）。未設定なら値照合をスキップ。 */
export const EXPECTED_ARCHETYPE_ID = process.env.A15_07_EXPECTED_ARCHETYPE_ID;
/** SEED-A15-07-FORMAT-KNOWN 既知アーキタイプの name_jp（E2E-A15-07-002/040）。 */
export const EXPECTED_ARCHETYPE_NAME_JP = process.env.A15_07_EXPECTED_ARCHETYPE_NAME_JP;
/** SEED-A15-07-FORMAT-KNOWN 既知アーキタイプの name_en（E2E-A15-07-002/040）。 */
export const EXPECTED_ARCHETYPE_NAME_EN = process.env.A15_07_EXPECTED_ARCHETYPE_NAME_EN;

/**
 * 別フォーマットに属するアーキタイプの id（E2E-A15-07-011 絞り込み確認）。
 * 指定フォーマット以外のアーキタイプが混在しないこと（混在＝NG）の検証用。未設定なら混在チェックをスキップ。
 */
export const OTHER_FORMAT_ARCHETYPE_ID = process.env.A15_07_OTHER_FORMAT_ARCHETYPE_ID;

/**
 * 404失敗応答の message（仕様の「The format does not exist」・正本md 入出力 レスポンス(失敗)／エラー処理）。
 * 実装は trans('api.deck_builder.common.not_found')＝"Not Found"/"見つかりません" で乖離（付帯表4#2）。仕様文言を期待し違えば落として検出。
 */
export const NOT_FOUND_MESSAGE = "The format does not exist";

/** アーキタイプ要素の型（正本md 入出力 レスポンス(成功)・snake_caseキー）。name型のnull可否は付帯表4#5。 */
export type Archetype = {
  id: number;
  name_jp: string;
  name_en: string;
};

/** 成功レスポンスのルート型（ArchetypeController.php:55-58／正本md レスポンス(成功)）。 */
export type ArchetypeSuccessBody = {
  code: number;
  archetypes: Archetype[];
};

/** 404失敗レスポンスのルート型（`{code, message}`・正本md レスポンス(失敗)）。 */
export type ArchetypeErrorBody = {
  code: number;
  message: string;
};
