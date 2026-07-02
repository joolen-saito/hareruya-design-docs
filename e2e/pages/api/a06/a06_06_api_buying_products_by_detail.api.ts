/**
 * a06-06 店頭仕入_買取商品詳細取得（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_06_api_buying_products_by_detail_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-06) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答JSONの階層構造/フィールド/型」を仕様由来で判定する（オラクル独立性）。
 *  - 実装の応答型乖離（foilFlg=int／price・stock=int／フィールド名 productClassCode）はオラクルに固定しない（付帯表4#4/#5/#6）。
 *  - 既知SEED値・資格情報は env で供給し、未設定時の既定値は創作値（要実機確認）。資格情報の原値はログ・本ファイルに書かない。
 */

/**
 * 実効パスのプレフィクス／サフィックス。
 * 由来: `#[Route('/%eccube_api_v1_route%/buying/{cardDetailId}.json', name: 'api_buying', methods: ['GET'])]`
 *        （BuyingController.php:46）＋既定値 `api/v1`（eccube.yaml:6,55）＝実効 `GET /api/v1/buying/{cardDetailId}.json`。
 * 設計書パス `GET /buying/{detailId}`（言語/バージョンprefixなし・サフィックスなし・変数名 detailId）とは
 * `/api/v1` プレフィクス・`.json` サフィックス・パス変数名（detailId⇔cardDetailId）で不一致（付帯表4#1）。
 * 送信先は実装の実効パスへ統一し、合否は設計書の意味（正常取得200／該当なし404）で判定する。
 */
export const BUYING_PATH_PREFIX = "/api/v1/buying";
export const BUYING_PATH_SUFFIX = ".json";

/** GET送信先パスを組み立てる（cardDetailId は実装の必須パスパラメータ）。 */
export function buildBuyingPath(cardDetailId: string | number): string {
  return `${BUYING_PATH_PREFIX}/${cardDetailId}${BUYING_PATH_SUFFIX}`;
}

/**
 * パス変数 cardDetailId を欠いたパス（E2E-A06-06-007）。
 * 必須パス変数欠落時の具体ステータス（ルート不一致/404等）は要実機確認（仕様で固定される404は該当なし時のみ）。
 */
export const MISSING_CARD_DETAIL_PATH = `${BUYING_PATH_PREFIX}/${BUYING_PATH_SUFFIX}`;

/** SEED-A06-06-CARD-KNOWN 買取商品が紐づく実在カード詳細ID（要実機確認: env で供給）。 */
export const KNOWN_CARD_DETAIL_ID = process.env.A06_06_KNOWN_CARD_DETAIL_ID || "1";
/** SEED-A06-06-CARD-NONE 買取商品が紐づかない（リポジトリ取得結果が空となる）カード詳細ID（E2E-A06-06-010/015/016/019）。 */
export const NONE_CARD_DETAIL_ID = process.env.A06_06_NONE_CARD_DETAIL_ID || "999999";

/** detailId≦0 の異常パラメータ値（E2E-A06-06-011）。正しい買取商品が取得されない（具体ステータスは要実機確認）。 */
export const NON_POSITIVE_CARD_DETAIL_ID = "0";
export const NEGATIVE_CARD_DETAIL_ID = "-1";
/** 非数値（型不正）のカード詳細ID（E2E-A06-06-012）。int パス変数の型解決に不一致（具体ステータスは要実機確認）。 */
export const NON_NUMERIC_CARD_DETAIL_ID = "abc";

/** 想定外クエリ項目（E2E-A06-06-014）。サーバエラー(5xx)で停止しないことのみ判定。無視可否は要実機確認。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/**
 * SEED-A06-06-API-AUTH 認証済Member（MTGバイヤー）の資格情報ヘッダ。
 * 実装は `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（BuyingController.php:34）＋`getUser()` が Member 必須
 * （BuyingController.php:50-51）だが、設計書の認可方式（公開／IP制限／APIキー等）は確定できず要実機確認（付帯表4#2）。
 * 資格情報は env で供給し、未設定時はヘッダなし（環境ガード A06_06_READY と併用）。原値は本ファイルに固定しない。
 */
export function buildAuthHeaders(): Record<string, string> {
  const token = process.env.A06_06_API_AUTH_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 異常な資格情報（無効・欠落）のヘッダ（E2E-A06-06-008・負例）。
 * 無効・欠落した資格情報では許可せず正常取得200を返さないこと（拒否時の具体ステータスは要実機確認＝付帯表4#2）。
 */
export function buildInvalidAuthHeaders(): Record<string, string> {
  return { Authorization: "Bearer invalid-token-e2e-a06-06-008" };
}

/**
 * 成功レスポンスのフィールド契約（オラクル＝設計書 入出力 レスポンス(成功)由来。E2E-A06-06-006）。
 * 由来: BuyingCardsFormatter.php:74-120。型・フィールド名の実装差異は付帯表4#4/#5/#6で管理する。
 */
/** カード階層のフィールド。 */
export const CARD_LEVEL_FIELDS = ["cardNameJp", "cardNameEn", "imageFileName"] as const;
/** details 階層のフィールド。 */
export const DETAIL_LEVEL_FIELDS = [
  "cardsetCode",
  "cardsetName",
  "foilFlg",
  "cardNo",
  "promotionName",
  "productId",
  "productNameJp",
  "productNameEn",
  "rarityCode",
  "storageCodeName",
] as const;
/** conditionClasses 階層のフィールド（productCode は設計名・実装は productClassCode＝付帯表4#6）。 */
export const CONDITION_CLASS_FIELDS = [
  "productClassId",
  "productCode",
  "buyPrice",
  "price",
  "stock",
  "sectionId",
] as const;

/** 未設定時に null で返る任意フィールド（E2E-A06-06-041。設計 入出力 レスポンス(成功)の null 定義）。 */
export const NULLABLE_FIELDS = [
  "cardsetCode",
  "cardsetName",
  "promotionName",
  "storageCodeName",
  "buyPrice",
  "sectionId",
] as const;

/** 応答の入れ子順（E2E-A06-06-040。cards→details→languageClasses→conditionClasses）。 */
export const NESTING_ORDER = ["cards", "details", "languageClasses", "conditionClasses"] as const;
