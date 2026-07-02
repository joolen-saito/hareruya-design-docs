/**
 * a07-01 オンライン仕入_一括買取ID（買取アプリ=MTGバイヤー向けに、オプションマスタの「まとめ買取商品ID」設定値を返す参照系JSON API）API/統合レイヤ用 パス／ヘッダ／期待値ヘルパ。
 * ケース表 integration_test/e2e/a07_01_api_online_purchase_bulk_purchase_id_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a07-01) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き GET・パラメータなし）のみを最小構成で組む未実行雛形。実環境（買取アプリ＝MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・HTTPライブラリ既定値・`?? ''` 既定を期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/v1/admin/optionBulkPurchaseId.json`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/%eccube_api_v1_route%/admin/optionBulkPurchaseId.json', name: 'api_admin_option_bulk_purchase_id', methods: ['GET'])]`（OptionController.php:35）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1` ＝実効パス。正本md `GET /admin/optionBulkPurchaseId.json` は `/api/v1` を欠き不一致（付帯表4#1）。
 *  - 認証はクラス属性 `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（OptionController.php:25）。ヘッダ名は `jwt-token`（設計書／JWT認証機構＝App/MTGBuyer ファイアウォール側）。
 *    JWT（HS256）検証の実体・拒否時の具体ステータス（401/403）は本コントローラから確定できず要実機確認（付帯表4#2）。
 *  - 取得は `findOneBy(['option_key' => MtbOption::BULK_PURCHASE_ID])`（OptionController.php:38-39）、応答は `new JsonResponse($value)`（OptionController.php:44）＝ラッパを持たない単一string値。
 *  - 合否（成功）は HTTPステータス200＋設定値文字列（SEED投入値と一致）を仕様（正本md）由来で判定する。
 *  - 設定未設定（E2E-010）の期待値は正本md「挙動は現行pf-apiを正」に従い HTTP 500相当の失敗とする。
 *    実装は `$Option?->getOptionValue() ?? ''`（OptionController.php:42）で 200＋空文字列を返す可能性（付帯表4#3）→ 仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *  - jwt-token原値・署名シークレットは env で供給し原値はコミットしない（付帯表3）。SEED投入のまとめ買取商品ID値も env 供給（要実機確認の暫定値）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_01_READY。
 */

/** API実効パス接頭辞。由来: %eccube_api_v1_route% 既定値 `api/v1`。 */
export const API_V1_PREFIX = "/api/v1";

/**
 * まとめ買取商品ID取得エンドポイント実効パス。
 * 由来: OptionController.php:35（Route）＋ %eccube_api_v1_route% 既定 `api/v1` ＝実効 `GET /api/v1/admin/optionBulkPurchaseId.json`。
 * 正本md `GET /admin/optionBulkPurchaseId.json`（接頭辞 `/api/v1` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export const BULK_PURCHASE_ID_PATH = `${API_V1_PREFIX}/admin/optionBulkPurchaseId.json`;

/** 想定外クエリ項目を付与した実効パス（E2E-011・本APIはパラメータ未使用）。 */
export function buildPathWithUnknownQuery(): string {
  return `${BULK_PURCHASE_ID_PATH}?unexpected_param=foo`;
}

/** 認証ヘッダ名。由来: 設計書／JWT認証機構（jwt-token ヘッダ・付帯表4#2 要実機確認）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A07-01-API-AUTH／管理者会員）。HS256・有効署名・該当会員の利用者IDを含む。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える。
 */
export const ADMIN_JWT = process.env.A07_01_JWT_ADMIN || "";

/** 署名不正トークン（SEED-A07-01-API-AUTH 派生／署名改ざん。E2E-A07-01-008/016）。署名シークレットを持たずに合成。実装は認証拒否となることを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A07_01_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当管理者会員が存在しない利用者IDのトークン（SEED-A07-01-API-AUTH 派生／E2E-A07-01-008）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として認証拒否となる）でフォールバック。
 */
export const JWT_NO_MEMBER =
  process.env.A07_01_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** jwt-token ヘッダを組む。token 省略時は ADMIN_JWT。token が空文字列なら jwt-token ヘッダを付けない（欠落系007/015）。 */
export function buildJwtHeaders(token: string | undefined = ADMIN_JWT): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A07-01-007/015 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== SEED 期待値（付帯表3・env 供給・既定は要実機確認の暫定プレースホルダ） =====

/**
 * SEED投入のまとめ買取商品ID設定値（付帯表3 SEED-A07-01-OPTION-SET／例 `2000001`）。
 * 値オラクル: 応答本体（単一string値）が SEED で投入した既知の設定値と一致することを判定する（E2E-004 ほか）。
 * env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A07_01_READY) ガード下でのみ突き合わせる。
 * キー文字列（MtbOption::BULK_PURCHASE_ID）の移行同一性は要確認（付帯表4#5）。
 */
export const BULK_PURCHASE_ID = process.env.A07_01_BULK_PURCHASE_ID || "2000001";
