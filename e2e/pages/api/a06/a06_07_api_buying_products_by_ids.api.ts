/**
 * a06-07 店頭仕入_買取商品複数ID取得（参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_07_api_buying_products_by_ids_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-07) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文（cards階層・型契約・値）」を仕様由来で判定する（オラクル独立性）。
 *  - 実装の 0件応答形（{cards:{}}/{cards:[]}）・型のint化（price/stock/foilFlg）・キー名 productClassCode は
 *    オラクルに固定しない。テストは仕様（空配列[]・string/boolean・productCode）を期待し、実装が違えば落ちて検出する（付帯表4#3-#8）。
 *  - 既知SEED値（商品ID・期待フィールド値）は env で供給し、未設定時の既定値は創作値（要実機確認）。原値はコミットしない。
 */

/**
 * 実効パス。
 * 由来: `#[Route('/%eccube_api_v1_route%/buying/products', name: 'api_buying_products', methods: ['POST'])]`
 *       （BuyingController.php:67）＋ `eccube_api_v1_route` 既定値 `api/v1`（eccube.yaml:6,55）。
 * 設計書パス `POST /buying/products` とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 */
export const BUYING_PRODUCTS_PATH = "/api/v1/buying/products";

/**
 * ids は実装の `$request->get('ids')`（BuyingController.php:70）で受け、カンマ区切りの string（正本md:71,73）。
 * 非数値は `preg_match('/^\d+$/')` で除外し intval（BuyingController.php:73-77。設計未記載＝付帯表4#8）。
 * 送信は POST ボディ（form フィールド ids）で行う。
 */
export function buildIdsForm(idsCsv: string): Record<string, string> {
  return { ids: idsCsv };
}

/** ids に加えて想定外項目を付与した form（E2E-A06-07-021。無視可否は正典未定義＝要実機確認）。 */
export function buildIdsFormWithExtra(idsCsv: string, extra: Record<string, string>): Record<string, string> {
  return { ids: idsCsv, ...extra };
}

/** SEED-A06-07-CARDS-KNOWN 既知の買取対象カード商品ID（複数カードに跨る。要実機確認: env で供給）。 */
export const KNOWN_CARD_IDS_CSV = process.env.A06_07_KNOWN_CARD_IDS || "1,2";
/** SEED-A06-07-NONCARD カード商品以外の商品ID（買取対象外）。 */
export const NONCARD_IDS_CSV = process.env.A06_07_NONCARD_IDS || "999998,999999";
/** SEED-A06-07-NULLFIELDS 未設定項目（NULL）を持つ買取用カード商品ID。 */
export const NULLFIELDS_CARD_IDS_CSV = process.env.A06_07_NULLFIELDS_IDS || "3";

/** 既知カード＋カード商品以外を混在（E2E-A06-07-051 一部不存在）。 */
export const MIXED_KNOWN_AND_NONCARD_IDS_CSV = `${KNOWN_CARD_IDS_CSV},${NONCARD_IDS_CSV}`;
/** 同一ID重複・順不同（E2E-A06-07-008）。先頭IDを末尾に重複付与し逆順化。 */
export const DUP_UNORDERED_IDS_CSV = (() => {
  const ids = KNOWN_CARD_IDS_CSV.split(",").map((s) => s.trim()).filter(Boolean);
  return [...ids].reverse().concat(ids[0] ?? "").join(",");
})();
/** 既知IDに非数値/型不正値を混在（E2E-A06-07-020。受理・除外挙動は正典未定義＝要実機確認）。 */
export const NONNUMERIC_MIXED_IDS_CSV = `${KNOWN_CARD_IDS_CSV},abc,-1`;
/** ids 空（E2E-A06-07-011 空/未指定）。 */
export const EMPTY_IDS_CSV = "";

/**
 * SEED-A06-07-CARDS-KNOWN 期待値（仕様の型・キー名で期待値化。要実機確認: env で供給、既定は創作値）。
 * cards 配下: cardNameJp/cardNameEn/productId。conditionClasses 配下: productClassId/buyPrice/price/stock/productCode/foilFlg。
 * 型契約は仕様（price/stock=string・foilFlg=boolean・productCode キー名・ID系=integer。正本md:81-105）に固定する。
 */
export const EXPECTED_CARD = {
  cardNameJp: process.env.A06_07_EXPECTED_CARD_NAME_JP || "テストカード", // 要実機確認
  cardNameEn: process.env.A06_07_EXPECTED_CARD_NAME_EN || "Test Card", // 要実機確認
  productId: Number(process.env.A06_07_EXPECTED_PRODUCT_ID || "1"), // integer（正本md）
  productClassId: Number(process.env.A06_07_EXPECTED_PRODUCT_CLASS_ID || "1"), // integer
  buyPrice: process.env.A06_07_EXPECTED_BUY_PRICE ?? null, // 未設定時 null（正本md:90系 null契約）
  price: process.env.A06_07_EXPECTED_PRICE || "100", // string（正本md:103。実装int＝付帯表4#4）
  stock: process.env.A06_07_EXPECTED_STOCK || "1", // string（正本md:104。実装int＝付帯表4#5）
  productCode: process.env.A06_07_EXPECTED_PRODUCT_CODE || "TESTCODE", // キー名 productCode（正本md:101。実装 productClassCode＝付帯表4#7）
} as const;

/** 未設定時 null を期待するフィールド名（E2E-A06-07-053。正本md null契約）。 */
export const NULLABLE_FIELDS = [
  "cardsetCode",
  "cardsetName",
  "promotionName",
  "storageCodeName",
  "buyPrice",
  "sectionId",
] as const;

/**
 * 認可ヘッダ。実装は `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（BuyingController.php:34＝要ログイン）だが、
 * 正典は認可方式（トークン/IP/セッション）未特定（正本md:204／付帯表4#2）。
 * env で資格情報を供給し、未設定なら付与しない（資格情報の負例070/071は手動＝本specには載せない）。
 */
export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  const name = process.env.A06_07_AUTH_HEADER; // 要実機確認: 認可ヘッダ名
  const value = process.env.A06_07_AUTH_VALUE;
  if (name && value) headers[name] = value;
  const cookie = process.env.A06_07_AUTH_COOKIE; // セッションCookie（要ログイン）
  if (cookie) headers["Cookie"] = cookie;
  return { ...headers, ...(extra ?? {}) };
}

/**
 * 応答 cards 階層（cards>details>languageClasses>conditionClasses。正本md:81-105）から
 * conditionClasses を平坦化して収集する。構造が未確定でも壊れないよう optional 走査する。
 */
export function collectConditionClasses(body: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const cards = (body as { cards?: unknown })?.cards;
  if (!cards || typeof cards !== "object") return out;
  for (const cardKey of Object.keys(cards as Record<string, unknown>)) {
    const card = (cards as Record<string, unknown>)[cardKey] as { details?: unknown[] };
    for (const d of card?.details ?? []) {
      for (const l of (d as { languageClasses?: unknown[] })?.languageClasses ?? []) {
        for (const c of (l as { conditionClasses?: unknown[] })?.conditionClasses ?? []) {
          out.push(c as Record<string, unknown>);
        }
      }
    }
  }
  return out;
}

/** cards オブジェクトのキー集合（E2E-A06-07-004/051）。 */
export function cardKeys(body: unknown): string[] {
  const cards = (body as { cards?: unknown })?.cards;
  if (!cards || typeof cards !== "object") return [];
  return Object.keys(cards as Record<string, unknown>);
}
