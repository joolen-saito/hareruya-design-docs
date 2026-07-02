/**
 * a15-04 デッキビルダー_他ユーザー取得（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_04_api_deck_builder_deck_user_other_get_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a15-04・正本md) 入出力記載のリクエスト仕様（deck_user_id クエリ指定）のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値を流用しない）:
 *  - 送信先は実装の実効パス `GET /api/user?deck_user_id={deckUserId}`（UserController.php:43,50）。
 *    設計書(正本md/pf-api)の `GET /user?deck_user_id={deckUserId}` とは `/api` プレフィクスで不一致（付帯表4#1）。
 *    送信先は実装の実効パスへ統一し、合否は設計書の意味（他ユーザー取得200／該当なし400）で判定する。
 *  - 他ユーザー分岐（deck_user_id 指定時）は token を検証しない（GetUserAction.php:41-42）。本分岐で401は発生しない（付帯表4#3）。
 *  - 合否（成功）は HTTPステータス200＋本文 code/user_name/profile/deck_user_id（型: code=integer(200)・他=string／未設定時null）を仕様由来で判定（spec側）。
 *  - 合否（該当なし）は 400＋本文 {code, message}（message=「Invalid request parameters」）。実メッセージは翻訳辞書次第＝要確認（付帯表4#2）、
 *    失敗時 code の具体値も要確認（付帯表4#6）。テストは仕様どおり期待し、違えば落ちて検出する（実装へ寄せない）。
 *  - SEED 期待値（既知 deck_user_id・user_name・profile）は env で供給し、未設定時の既定値は創作値（要実機確認）。
 *    トークン原値（無効値含む）はログ・本ファイルに記録しない（ログ・監査「JWTトークンの原値を出さない」）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_04_READY。
 */

/**
 * 他ユーザー取得API実効パス。
 * 由来: `#[Route('/api/user', name: 'api_deck_builder_user', methods: ['GET', 'OPTIONS'])]`（UserController.php:43）
 *        ＋ 他ユーザー分岐は `$request->query->get('deck_user_id')`（UserController.php:50）＝実効 `GET /api/user?deck_user_id={deckUserId}`。
 * 設計書(正本md/pf-api)の `GET /user?deck_user_id=...` とは `/api` プレフィクスで不一致（付帯表4#1）。
 */
export const USER_PATH = "/api/user";

/** クエリパラメータ名（他ユーザー分岐の検索キー・UserController.php:50）。 */
export const DECK_USER_ID_PARAM = "deck_user_id";

/** GET送信のクエリパラメータ（deck_user_id 指定）を組み立てる。 */
export function buildUserParams(deckUserId: string | number): Record<string, string> {
  return { [DECK_USER_ID_PARAM]: String(deckUserId) };
}

// ===== SEED 期待値（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/** SEED-A15-04-PLAYER-KNOWN 実在プレイヤーの既知 deck_user_id（要実機確認: env で供給）。 */
export const KNOWN_DECK_USER_ID = process.env.A15_04_KNOWN_DECK_USER_ID || "e2e_a15_04_known_user"; // 要実機確認
/** SEED-A15-04-PLAYER-KNOWN 既知プレイヤーの user_name（nickname 由来）。要実機確認: SEED投入値へ差し替える。 */
export const SEED_USER_NAME = process.env.A15_04_KNOWN_USER_NAME || "テストプレイヤー太郎"; // 要実機確認
/** SEED-A15-04-PLAYER-KNOWN 既知プレイヤーの profile。要実機確認: SEED投入値へ差し替える。 */
export const SEED_PROFILE = process.env.A15_04_KNOWN_PROFILE || "E2E用プロフィール"; // 要実機確認

/** SEED-A15-04-PLAYER-KNOWN（nickname・profile 未設定のプレイヤー）の deck_user_id（E2E-A15-04-040 null確認用）。 */
export const KNOWN_NULL_DECK_USER_ID = process.env.A15_04_NULL_DECK_USER_ID || "e2e_a15_04_null_user"; // 要実機確認

/** SEED-A15-04-PLAYER-NONE 一致するプレイヤーが存在しない deck_user_id（E2E-A15-04-010/011/012/013/016）。synthetic（未存在ID）。 */
export const NONE_DECK_USER_ID = process.env.A15_04_NONE_DECK_USER_ID || "e2e_a15_04_no_such_user_xyz"; // synthetic（未存在ID）

/** 該当なし時の仕様メッセージ（設計 入出力 レスポンス(失敗)）。実レンダリングは翻訳辞書次第＝要確認（付帯表4#2）。 */
export const INVALID_REQUEST_MESSAGE = "Invalid request parameters";

/** 想定外クエリ項目（E2E-A15-04-009）。サーバエラー(5xx)で停止しないことのみ判定。無視可否は要実機確認。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknown_field: "x", foo: "1" };

/**
 * 成功レスポンスのフィールド契約（オラクル＝設計書 入出力 レスポンス(成功)由来。E2E-A15-04-006）。
 * 由来: 成功本文 `['code'=>200,'user_name'=>...,'profile'=>...,'deck_user_id'=>...]`（UserController.php:70-75）。
 * code=integer(成功時200)・user_name/profile/deck_user_id=string（未設定時null）・snake_caseキー。
 * キー名・型の実装差異は付帯表4#2/#6 で検出する（期待値を実装へ寄せない）。
 */
export const SUCCESS_FIELDS = ["code", "user_name", "profile", "deck_user_id"] as const;
/** string 型（未設定時 null 許容）の成功フィールド。 */
export const STRING_OR_NULL_FIELDS = ["user_name", "profile", "deck_user_id"] as const;

// ===== 認証ヘッダ（本分岐は token を検証しない・E2E-A15-04-005／付帯表4#3） =====

/**
 * jwt-token ヘッダを付与しない（欠落）ヘッダ（E2E-A15-04-005）。
 * 本分岐は deck_user_id 指定時に認証を行わないため、トークン欠落でも200取得・401非発生（GetUserAction.php:41-42）。
 */
export function buildNoTokenHeaders(): Record<string, string> {
  return {};
}

/**
 * 無効な jwt-token を付与するヘッダ（E2E-A15-04-005）。原値は記録しない synthetic 値。
 * 無効トークンでも本分岐は認証を行わないため200取得・401非発生（認証・認可「deck_user_idを指定する限り認証は行わない」）。
 */
export function buildInvalidTokenHeaders(): Record<string, string> {
  const token = process.env.A15_04_INVALID_TOKEN || "invalid-jwt-token-e2e-a15-04-005";
  return { "jwt-token": token };
}
