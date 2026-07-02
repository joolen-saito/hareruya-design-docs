/**
 * a15-03 デッキビルダー_ユーザー取得（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_03_api_deck_builder_deck_user_get_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a15-03) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答JSONのフィールド構成/型契約/既知値」を仕様由来で判定する（オラクル独立性）。
 *  - 実装の挙動乖離（該当なし時400・401/400メッセージ文言の英/日差異・claim名 aud/sub）はオラクルに固定しない
 *    （付帯表4#2/#3/#4/#5）。設計の意味（正常取得200／認証拒否401／認証後取得不可400）で判定する。
 *  - 既知SEED値・jwt-token は env で供給し、未設定時の既定値は創作値（// 要実機確認）。トークン原値はログ・本ファイルに書かない。
 */

/**
 * 実効パス。
 * 由来: `#[Route('/api/user', name: 'api_deck_builder_user', methods: ['GET','OPTIONS'])]`（UserController.php:43）
 *        ＋App コントローラはプレフィクスなしで読み込まれる（routes.yaml:6）＝実効 `GET /api/user`。
 * 設計書パス `GET /user`（`/api` プレフィクスなし）とは不一致（付帯表4#1）。
 * 送信先は実装の実効パスへ統一し、合否は設計書の意味（正常取得200／認証拒否401／入力不正400）で判定する。
 */
export const USER_PATH = "/api/user";

/**
 * SEED-A15-03-JWT-VALID 既知プレイヤー（SEED-A15-03-PLAYER-KNOWN）の顧客IDに対応する有効署名 jwt-token。
 * 認証は jwt-token ヘッダのJWTをHS256で検証（JwtTokenService.php:41,99-）し、payload の claim からプレイヤーを引く。
 * 設計は aud claim・実装は sub claim を用いるため claim 名は要実機確認（付帯表4#2）。原値は env で供給する。
 */
export const JWT_VALID = process.env.A15_03_JWT_VALID || ""; // 要実機確認: 有効署名トークン
/**
 * SEED-A15-03-JWT-VALID（PLAYER-NULLABLE 対応）。nickname・profile・deck_user_id 未設定プレイヤーの有効 jwt-token。
 * 未指定時は JWT_VALID を流用（null応答確認用＝E2E-040。実機では未設定プレイヤーの顧客IDに対応するトークンを供給）。
 */
export const JWT_NULLABLE = process.env.A15_03_JWT_NULLABLE || JWT_VALID; // 要実機確認: 未設定プレイヤーのトークン
/**
 * SEED-A15-03-JWT-NOPLAYER 署名は正当だが該当顧客にプレイヤーが存在しない jwt-token（E2E-010）。
 * 設計は該当プレイヤーなし→401・実装は PlayerNotFoundException→400（付帯表4#3）。
 */
export const JWT_NOPLAYER = process.env.A15_03_JWT_NOPLAYER || ""; // 要実機確認: 該当プレイヤー無しトークン

/** SEED-A15-03-JWT-INVALID 署名不正・改ざんの異常トークン（E2E-008/011/015/016/019）。原値は固定の無効値で良い。 */
export const JWT_INVALID = "invalid.jwt.token-e2e-a15-03";

/** 正常系 jwt-token ヘッダ（PLAYER-KNOWN・有効署名）。 */
export function buildValidHeaders(): Record<string, string> {
  return { "jwt-token": JWT_VALID };
}
/** 未設定プレイヤー（PLAYER-NULLABLE）の jwt-token ヘッダ（E2E-040）。 */
export function buildNullableHeaders(): Record<string, string> {
  return { "jwt-token": JWT_NULLABLE };
}
/** 該当プレイヤー無しの jwt-token ヘッダ（SEED-A15-03-JWT-NOPLAYER・E2E-010）。 */
export function buildNoPlayerHeaders(): Record<string, string> {
  return { "jwt-token": JWT_NOPLAYER };
}
/** 署名不正・改ざんの異常 jwt-token ヘッダ（E2E-008/011/015/016/019）。 */
export function buildInvalidHeaders(): Record<string, string> {
  return { "jwt-token": JWT_INVALID };
}
/** jwt-token ヘッダ欠落（E2E-007）。必須ヘッダを付与しない。 */
export function buildMissingHeaders(): Record<string, string> {
  return {};
}

/**
 * 想定外クエリ項目（E2E-014）。本APIが解釈しない項目（deck_user_id は他ユーザー参照分岐＝本書対象外のため除く）。
 * サーバエラー(5xx)で停止しないことのみ判定。無視可否は要実機確認（付帯表1）。
 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/**
 * 成功レスポンスのフィールド契約（オラクル＝設計書 入出力 レスポンス(成功)由来。E2E-006）。
 * 由来: 成功本文 `{code:200, user_name, profile, deck_user_id}`（UserController.php:70-75）。
 *  - code は integer（200）、user_name・profile・deck_user_id は string（未設定時null）・JSONキーは snake_case。
 */
export const SUCCESS_FIELDS = ["code", "user_name", "profile", "deck_user_id"] as const;
/** 未設定時 null で返る任意フィールド（E2E-040。serialize_null 有効・GetUserAction.php:50-52）。 */
export const NULLABLE_FIELDS = ["user_name", "profile", "deck_user_id"] as const;
/** 失敗レスポンスのフィールド契約（{code, message}・AbstractDeckBuilderController.php:44-50。E2E-015）。 */
export const ERROR_FIELDS = ["code", "message"] as const;

/**
 * SEED-A15-03-PLAYER-KNOWN 既知プレイヤーの応答既知値（E2E-001/013 の値照合用）。
 * env で供給し、未設定時は創作の既定値（// 要実機確認）。null許容のため null も取り得る。
 */
export const KNOWN_USER_NAME = process.env.A15_03_KNOWN_USER_NAME ?? "要実機確認-user_name";
export const KNOWN_PROFILE = process.env.A15_03_KNOWN_PROFILE ?? "要実機確認-profile";
export const KNOWN_DECK_USER_ID = process.env.A15_03_KNOWN_DECK_USER_ID ?? "要実機確認-deck_user_id";
