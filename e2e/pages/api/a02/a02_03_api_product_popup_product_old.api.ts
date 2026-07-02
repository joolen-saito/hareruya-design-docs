/**
 * a02-03 ポップアップ用商品情報取得(旧)（GET参照系JSON API・言語指定なし）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a02_03_api_product_popup_product_old_e2e_cases.md（付帯表3 SEED）に対応。
 * 本ファイルは設計書(a02-03) 入出力・処理フロー記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋レスポンス構造/型/値」を仕様由来で判定する。
 *  - 実装の応答フィールド差異(cardId欠落/追加列)・stockのint化・404本文形({code,errors})はオラクルにしない（付帯表4#1/#2/#3）。
 *  - 既知SEED値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 */

/**
 * 実効パス（言語指定なし）。
 * 由来: `GET /popup/old/{oldProductId}`（src/Eccube/Controller/App/ProductController.php:317、ルート名 popup_card_by_old_product_id）
 *       ＋ App群 prefix無し（app/config/eccube/routes.yaml:5-7）＝実効 `GET /popup/old/{oldProductId}`（設計書と一致）。
 * 実装ルート名/メソッド名が `..._card_...` 系で設計の「商品情報取得」と名称が食い違う（付帯表4#6・要確認）。
 */
export const POPUP_OLD_PATH_PREFIX = "/popup/old";

/** GET送信先パスを組み立てる（パス変数 oldProductId は設計書 入出力 必須）。 */
export function buildPopupOldPath(oldProductId: string | number): string {
  return `${POPUP_OLD_PATH_PREFIX}/${oldProductId}`;
}

/** SEED-A02-03-OLD-JP 既知の旧商品ID（日本語）。要実機確認: テスト環境固定値。 */
export const KNOWN_OLD_PRODUCT_ID = process.env.A02_03_OLD_PRODUCT_ID || "1";

/** SEED-A02-03-OLD-EN 既知の旧英語商品ID。要実機確認: テスト環境固定値。 */
export const KNOWN_OLD_EN_PRODUCT_ID = process.env.A02_03_OLD_EN_PRODUCT_ID || "1";

/** SEED-A02-03-NONE 該当なし旧商品ID（存在しないID＝後始末不要）。 */
export const NONE_OLD_PRODUCT_ID = process.env.A02_03_NONE_OLD_PRODUCT_ID || "999999999";

/**
 * 成功レスポンスの仕様フィールド（設計書 入出力 レスポンス(成功)由来・E2E-A02-03-002）。
 * 設計は cardId を含む。実装応答に cardId が無く追加列を返す可能性＝付帯表4#1で落ちて検出。
 */
export const POPUP_OLD_SUCCESS_FIELDS = [
  "productId",
  "name",
  "productClassId",
  "price01",
  "price02",
  "stock",
  "nameEn",
  "fileName",
  "cardId",
] as const;

/** 数値文字列(string)契約のフィールド（実装のstock int化はオラクルにしない＝付帯表4#2）。 */
export const POPUP_OLD_NUMERIC_STRING_FIELDS = ["price01", "price02", "stock"] as const;

export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** クライアント認可資格情報（SEED-A02-03-CLIENT-AUTH）。認可方式は要実機確認（付帯表4#7）。 */
export function buildClientAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const name = process.env.A02_API_AUTH_HEADER;
  const value = process.env.A02_API_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return headers;
}
