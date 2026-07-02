/**
 * a15-16 デッキビルダー_直近イベント（直近に開催された大会の一覧〔大会日・フォーマット・大会名・参加者数〕を返す参照系 GET JSON API）API/統合レイヤ用 パス／ヘッダ／クエリ／オラクル。
 * ケース表 integration_test/e2e/a15_16_api_deck_builder_deck_recent_event_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a15-16) 入出力記載のリクエスト仕様（入力パラメータを持たない公開 GET）のみを最小構成で組む未実行雛形。実環境（デッキビルダーアプリ）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・日時整形を期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/recent_event`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/api/recent_event', name: 'api_deck_builder_recent_event', methods: ['GET','OPTIONS'])]`（DeckController.php:643）＝実効パス。
 *          正本md `GET /recent_event` は `/api` プレフィクスを欠き不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - 認証は不要（当該メソッドに認証属性〔IsGranted〕なし＝DeckController.php:643-665）。設計「本APIは認証を行わない・jwt-token検証なし・誰でも呼び出せる公開参照系」と整合。
 *    jwt-token ヘッダ欠落でも 401 とならず 200 取得が正例（E2E-A15-16-005）。呼び出しクライアント限定の制御手段の有無は付帯表4#4 要確認（拒否応答は固定しない）。
 *  - 抽出は `getRecentEventsForDeckBuilder()`（DeckController.php:650／MtbLatestEventDeckRepository.php:53）。`eventDate IS NOT NULL` かつ `eventNameJp != ''` かつ `eventNameEn != ''` の行を `id ASC` で抽出し、
 *    `mtb_format` を結合して event_date/format_id/format_name_jp/format_name_en/event_name_jp/event_name_en/participants を選択（MtbLatestEventDeckRepository.php:55-69）。
 *  - 応答本体は `{code, events}` の連想配列（snake_case）でHTTP200（DeckController.php:661-664）。該当なしは events＝空配列＋200（エラー処理）。
 *  - event_date は仕様では日時文字列（ISO8601形式）を期待値とする。実装は `$eventDate->format('Y-m-d')` で日付のみ整形（DeckController.php:654-656）＝乖離（付帯表4#2）。
 *    テストは仕様のISO8601日時文字列を期待し、実装が日付のみを返せば落として検出する（実装の `Y-m-d` へ寄せない）。
 *  - 本APIは入力パラメータを持たないため、必須欠落・型不正の検証対象が無い。異常パラメータ値（011）・想定外項目（014）は 5xx で停止しないことのみ判定し、200無視は正本未記載のため要実機確認（付帯表1/付帯表4）。
 *  - 副作用は無し（参照系・検索のみ）。再取得不変・冪等参照は永続化先（mtb_latest_event_deck）を直接DB照合して判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。
 *  - SEED（KNOWN/INVALID/NONE）は env で供給（付帯表3）。結果キャッシュ（Doctrine 結果キャッシュ TTL1800秒）の反映遅延は付帯表4#5 要確認。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_16_READY。
 */

/**
 * 直近イベント取得エンドポイント実効パス。
 * 由来: DeckController.php:643（Route `/api/recent_event`・methods GET,OPTIONS）。
 * 正本md `GET /recent_event`（接頭辞 `/api` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export const RECENT_EVENT_PATH = "/api/recent_event";

/** 直近イベント取得エンドポイント実効パスを返す（本APIはパスパラメータを持たない）。 */
export function buildRecentEventPath(): string {
  return RECENT_EVENT_PATH;
}

/** 認証ヘッダ名（参考。本APIは認証不要のため通常は付与しない）。由来: 設計 認証・認可（jwt-token）。 */
export const JWT_HEADER_NAME = "jwt-token";

/**
 * 任意のJWT（env 供給・原値非コミット）。本APIは認証不要のため通常は使用しないが、
 * 「資格情報の有無によらず同一結果」（E2E-A15-16-020）の比較で資格情報あり側として付与する用途に備える。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える。未設定時は付与しない。
 */
export const ANY_JWT = process.env.A15_16_JWT || "";

/** jwt-token を一切付与しないヘッダ（認証不要の正例 005／比較の資格情報なし側 020）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { Accept: "application/json" };
}

/**
 * jwt-token ヘッダを付与したヘッダ（020 の資格情報あり側）。token 未指定なら ANY_JWT。空文字なら付与しない。
 * 本APIは認証不要のため結果は無認証時と同一（公開参照系）であることを比較で確認する。
 */
export function buildJwtHeaders(token: string | undefined = ANY_JWT): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

// ===== 異常クエリ（本APIは入力パラメータを非参照。5xx で停止しないことのみ判定する＝011/014・要実機確認） =====

/** 異常な値を持つ想定外パラメータ（011）。本APIは非参照のため 5xx にならないことのみ判定（200無視は要実機確認）。 */
export function buildAbnormalParamQuery(): Record<string, string> {
  return { limit: "-1", sort: "';--", "%invalid%": "<script>" };
}

/** 想定外の項目（項目名とパラメータ値のセット）（014）。本APIは非参照のため 5xx にならないことのみ判定（200無視は要実機確認）。 */
export function buildUnknownItemQuery(): Record<string, string> {
  return { unknown_field: "x", foo: "bar" };
}

// ===== シード識別（env 供給・既定は要実機確認の暫定。GET 自体はパラメータを持たず、SEED は環境状態で切替える） =====

/**
 * SEED セット選択用の説明（付帯表3）。本APIは入力パラメータを持たないため、抽出結果は環境のシード状態で決まる。
 *  - KNOWN:   抽出条件を満たす有効大会が複数件（id 昇順検証・フォーマット結合検証用の既知値）。SEED-A15-16-EVENT-KNOWN。
 *  - INVALID: 大会日NULL行・大会名空文字行を含み、これらが events に含まれないことを確認。SEED-A15-16-EVENT-INVALID。
 *  - NONE:    抽出条件を満たす行が0件（events が空配列）。SEED-A15-16-EVENT-NONE。
 */
export const SEED = {
  KNOWN: process.env.A15_16_SEED_KNOWN || "SEED-A15-16-EVENT-KNOWN", // 要実機確認: 環境の既知データセットへ
  INVALID: process.env.A15_16_SEED_INVALID || "SEED-A15-16-EVENT-INVALID", // 要実機確認: 抽出除外確認用データセットへ
  NONE: process.env.A15_16_SEED_NONE || "SEED-A15-16-EVENT-NONE", // 要実機確認: 0件状態のデータセットへ
} as const;

// ===== 正本md由来のオラクル（応答フィールド・型契約・HTTPステータス）。実装の乖離は付帯表4で記録（テストは仕様で照合し違えば落として検出） =====

/** 正常取得のHTTPステータス（正本md: 入出力 レスポンス(成功)HTTP200）。 */
export const EXPECTED_HTTP_STATUS = 200;

/** 応答ラッパの code 値（正本md: 処理フロー#3 コード200で返却）。 */
export const EXPECTED_CODE = 200;

/** 応答ラッパ（snake_case）のフィールド（正本md: {code, events}・DeckController.php:661-664）。 */
export const WRAPPER_FIELDS = ["code", "events"] as const;

/**
 * events[] 各要素のフィールド（正本md: 入出力 レスポンス(成功)・MtbLatestEventDeckRepository.php:56-64・snake_case）。
 * event_date は ISO8601 日時文字列（付帯表4#2 で実装の Y-m-d 乖離を記録）。
 */
export const EVENT_FIELDS = [
  "event_date",
  "format_id",
  "format_name_jp",
  "format_name_en",
  "event_name_jp",
  "event_name_en",
  "participants",
] as const;

/** events[] 各フィールドの仕様型契約（正本md）。string=文字列／integer=整数。 */
export const EVENT_FIELD_TYPES = {
  event_date: "string", // ISO8601 日時文字列（付帯表4#2: 実装は Y-m-d の日付のみ）
  format_id: "integer",
  format_name_jp: "string",
  format_name_en: "string",
  event_name_jp: "string",
  event_name_en: "string",
  participants: "integer",
} as const;

/**
 * event_date の仕様型契約（ISO8601 日時文字列・例 `2026-05-30T00:00:00+09:00`）の検証パターン（付帯表4#2）。
 * 実装は `Y-m-d`（例 `2026-05-30`）で時刻・タイムゾーンを持たないため本パターンに一致せず落ちて検出する（期待値を実装へ寄せない）。
 */
export const ISO8601_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** 値が整数（JSON number かつ整数）か。format_id・participants の型契約照合に使う。 */
export function isInteger(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value);
}
