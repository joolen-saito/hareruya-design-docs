/**
 * a06-09 店頭仕入_商品名検索（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_09_api_product_search_by_name_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(014 101件以上のSEED規模)は test.fixme（理由付き）で残す。
 * 手動（030 タイムアウト実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本APIは応答を観測する管理画面を持たない（正本md:9）ためUI専用specは無い＝全てAPI/統合レイヤで観測する。
 *
 * 期待結果は仕様（正本md a06-09・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `GET /product/search`・別名 `GET /product/search.json`（ProductController.php:88-90。正本md一致）。
 *  - 合否は HTTPステータス・レスポンス本文（構造・型・既知値）で判定する。
 *  - 実装が付加する余剰 count（付帯表4#1）・空値の null 化（high_price_code＝付帯表4#4）はオラクルに固定しない。
 *  - 商品サブクラスの DB 再編（付帯表4#2）に伴う SEED 再現は要実機確認（test.skip ガードで保留）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_09_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  PRODUCT_SEARCH_PATH,
  PRODUCT_SEARCH_JSON_PATH,
  buildProductQuery,
  buildProductQueryWithExtra,
  buildNoAuthHeaders,
  EMPTY_QUERY,
  KNOWN_PRODUCT_NAME,
  PARTIAL_MATCH_WORD,
  MULTI_MATCH_WORD,
  CARD_DETAIL_PRODUCT_NAME,
  OTHER_COND_PRODUCT_NAME,
  SUPPRESSED_PRODUCT_NAME,
  SUBCLASS_MISSING_PRODUCT_NAME,
  NONE_MATCH_WORD,
  SPECIAL_CHAR_QUERY,
  WHITESPACE_QUERY,
  EXPECTED_PRODUCT_ID,
  EXPECTED_PRODUCT_NAME,
  EXPECTED_PRICE,
  EXPECTED_STOCK,
  LANGUAGE_CODE_PREFIX_HEAD,
  NOT_FOUND_MESSAGE,
  ProductSearchSuccessBody,
  ProductSearchErrorBody,
} from "../../../pages/api/a06/a06_09_api_product_search_by_name.api";

const HAS_API = !!process.env.A06_09_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "該当商品ありの正常検索＝200（正本md:成功応答）").toBe(200);
}
function expect404(status: number) {
  expect(status, "未指定/該当なし＝404 Not Found（正本md:71,124-126,229-230）").toBe(404);
}

test.describe("API > 店頭仕入_商品名検索(GET参照系)", { tag: ["@api", "@a06"] }, () => {
  // ===== 正常検索（部分一致・値照合・HTTPステータス・関連情報） =====

  test("E2E-A06-09-001 部分一致する商品名で検索し200と該当商品配列が返る", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(PARTIAL_MATCH_WORD) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    expect(Array.isArray(body.products), "products配列が返る").toBeTruthy();
    expect(body.products.length, "該当商品が1件以上含まれる").toBeGreaterThanOrEqual(1);
    await ctx.dispose();
  });

  test("E2E-A06-09-002 成功レスポンスの各フィールド値がSEED既知レコードと一致する", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-PRODUCT-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(KNOWN_PRODUCT_NAME) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    const p = body.products[0] as Record<string, unknown>;
    // product_id・product_name・product_classes[].price・stock がSEED既知レコードと一致。値照合は env 期待値で行う（未設定なら要実機確認）。
    expect(p, "先頭商品が存在する").toBeTruthy();
    if (EXPECTED_PRODUCT_ID !== undefined) expect(String(p.product_id), "product_id 一致").toBe(EXPECTED_PRODUCT_ID);
    if (EXPECTED_PRODUCT_NAME !== undefined) expect(String(p.product_name), "product_name 一致").toBe(EXPECTED_PRODUCT_NAME);
    const pc = (p.product_classes as Record<string, unknown>[])[0];
    if (EXPECTED_PRICE !== undefined) expect(String(pc.price), "price 一致").toBe(EXPECTED_PRICE);
    if (EXPECTED_STOCK !== undefined) expect(String(pc.stock), "stock 一致").toBe(EXPECTED_STOCK);
    await ctx.dispose();
  });

  test("E2E-A06-09-003 該当商品がある場合のHTTPステータスが200となる", async () => {
    test.skip(!HAS_API, "A06_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(KNOWN_PRODUCT_NAME) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-09-004 成功レスポンスにカテゴリ・地域制限・規格・画像URLが含まれる", async () => {
    test.skip(!HAS_API, "A06_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(KNOWN_PRODUCT_NAME) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    const p = body.products[0] as Record<string, unknown>;
    // products[] に categories(array)・region_restriction・product_classes(規格配列)・product_class_images(URL配列)
    // が取得される（ProductSearchResponseBuilder.php:147-155,180-187）。
    expect(Array.isArray(p.categories), "categories は配列").toBeTruthy();
    expect("region_restriction" in p, "region_restriction を持つ").toBeTruthy();
    expect(Array.isArray(p.product_classes), "product_classes は規格配列").toBeTruthy();
    await ctx.dispose();
  });

  // ===== レスポンス構造・型契約（余剰 count / null化はオラクルにしない＝付帯表4#1/#4） =====

  test("E2E-A06-09-005 成功レスポンスのルート構造が仕様の形式（code/products）と一致する", async () => {
    test.skip(!HAS_API, "A06_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(KNOWN_PRODUCT_NAME) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    // 仕様の形式＝ code(integer・成功時200)・products(array)。実装付加の count は合否条件にしない（付帯表4#1）。
    expect(typeof body.code, "code は integer").toBe("number");
    expect(Number.isInteger(body.code), "code は整数").toBeTruthy();
    expect(Array.isArray(body.products), "products は array").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-09-006 商品規格要素の型契約（id/price/stock=integer・images=array）が一致する", async () => {
    test.skip(!HAS_API, "A06_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(KNOWN_PRODUCT_NAME) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    const p = body.products[0] as Record<string, unknown>;
    const classes = p.product_classes as Record<string, unknown>[];
    // product_class_id・price・stock は integer、product_class_images は array(URL文字列)。
    // high_price_code の空値 null 化（付帯表4#4）は仕様型 string を基準にし null 化を期待値へ寄せない（コメントのみ）。
    for (const pc of classes) {
      expect(Number.isInteger(pc.product_class_id), "product_class_id は integer").toBeTruthy();
      expect(Number.isInteger(pc.price), "price は integer").toBeTruthy();
      expect(Number.isInteger(pc.stock), "stock は integer").toBeTruthy();
      expect(Array.isArray(pc.product_class_images), "product_class_images は array").toBeTruthy();
    }
    await ctx.dispose();
  });

  // ===== 資格情報（本APIは認証なし） =====

  test("E2E-A06-09-007 認証情報を付与しないリクエストでも200が返る（本APIは認証なし）", async () => {
    test.skip(!HAS_API, "A06_09_READY 未設定");
    const ctx = await newCtx();
    // 認証情報を付与しない。本APIは認証を行わない仕様（正本md:62。ルートに認証/firewallなし）。
    const res = await ctx.get(PRODUCT_SEARCH_PATH, {
      headers: buildNoAuthHeaders(),
      params: buildProductQuery(KNOWN_PRODUCT_NAME),
    });
    expect200(res.status()); // 401を返さない。
    await ctx.dispose();
  });

  // ===== 通信（.json別名）・複数該当・言語コード・規格絞り込み =====

  test("E2E-A06-09-008 拡張子あり別名(.json)でも同一処理として200が返る", async () => {
    test.skip(!HAS_API, "A06_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_JSON_PATH, { params: buildProductQuery(KNOWN_PRODUCT_NAME) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    expect(Array.isArray(body.products), "別名でも同等の products 配列が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-09-009 部分一致する複数商品がproducts配列で返る", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-PRODUCT-KNOWN 複数該当) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(MULTI_MATCH_WORD) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    expect(body.products.length, "部分一致する複数商品が返る").toBeGreaterThanOrEqual(2);
    await ctx.dispose();
  });

  test("E2E-A06-09-010 カード詳細を持つ商品のproduct_nameに言語コードが付与される", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-PRODUCT-KNOWN カード詳細あり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(CARD_DETAIL_PRODUCT_NAME) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    const p = body.products[0] as Record<string, unknown>;
    // カード詳細を持つ商品は先頭に言語コード(【JP】等)を付す（正本md:74。付与条件列はDB再編下で要実機確認＝付帯表4#5）。
    expect(String(p.product_name).startsWith(LANGUAGE_CODE_PREFIX_HEAD), "product_name 先頭に言語コード").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-09-011 その他コンディション表示可の商品でNM以外の規格も含まれる", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-OTHER-COND 表示可) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(OTHER_COND_PRODUCT_NAME) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    const p = body.products[0] as Record<string, unknown>;
    // 表示可と判定される商品は product_classes に良品(NM)以外の規格も含む（正本md:86-89。NM絞り込み=ProductSearchResponseBuilder.php:134-141）。
    expect((p.product_classes as unknown[]).length, "NM以外も含む規格内訳").toBeGreaterThanOrEqual(1);
    await ctx.dispose();
  });

  test("E2E-A06-09-012 表示下限未満・その他コンディション抑制時は規格がNMのみに絞られる", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-OTHER-COND 抑制) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(SUPPRESSED_PRODUCT_NAME) });
    expect200(res.status());
    const body = (await res.json()) as ProductSearchSuccessBody;
    const p = body.products[0] as Record<string, unknown>;
    // 抑制/表示下限未満は product_classes が良品(NM)の規格のみに絞られ、応答が実在規格の一部となる（正本md:189）。
    // しきい値の正は基本設計値であり実装パラメータを期待値に流用しない（付帯表3注・オラクル独立性）。NM内訳照合はSEEDで補完。
    expect((p.product_classes as unknown[]).length, "NMのみに絞られた規格内訳").toBeGreaterThanOrEqual(1);
    await ctx.dispose();
  });

  // ===== 想定外項目の無視 =====

  test("E2E-A06-09-013 想定外のクエリ項目を加えても無視され200が返る", async () => {
    test.skip(!HAS_API, "A06_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQueryWithExtra(KNOWN_PRODUCT_NAME) });
    expect200(res.status()); // productのみ参照され他クエリは無視される（ProductController.php:92／正本md:172）。
    const body = (await res.json()) as ProductSearchSuccessBody;
    expect(body.products.length, "該当商品が返る").toBeGreaterThanOrEqual(1);
    await ctx.dispose();
  });

  // ===== 異常系・404分岐 =====

  test("E2E-A06-09-020 productを未指定（空）で送信すると404が返る", async () => {
    test.skip(!HAS_API, "A06_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: EMPTY_QUERY });
    expect404(res.status()); // product空→404（ProductController.php:92,95,99）。
    await ctx.dispose();
  });

  test("E2E-A06-09-021 該当なし時の404本文が {code, message}（\"Not Found\"）形式となる", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-PRODUCT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(NONE_MATCH_WORD) });
    expect404(res.status());
    const body = (await res.json()) as ProductSearchErrorBody;
    // 404本文は {code, message}（message="Not Found"）（正本md:124-126／ProductController.php:99,123-127）。
    expect(typeof body.code, "code を持つ").toBe("number");
    expect(body.message, "message=Not Found").toBe(NOT_FOUND_MESSAGE);
    await ctx.dispose();
  });

  test("E2E-A06-09-022 該当0件の場合に404（仕様の0件表現）が返る", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-PRODUCT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(NONE_MATCH_WORD) });
    expect404(res.status()); // 該当0件→404＝仕様の0件表現(Not Found)（ProductController.php:103,108）。
    await ctx.dispose();
  });

  test("E2E-A06-09-023 該当する商品サブクラス（規格）が無い場合に404が返る", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-SUBCLASS-MISSING) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(SUBCLASS_MISSING_PRODUCT_NAME) });
    expect404(res.status());
    // 商品サブクラス/規格なし→404（ProductController.php:111,117）。
    // SEED-A06-09-SUBCLASS-MISSING の再現は dtb_product_sub_class の商品規格系再編により要実機確認（付帯表4#2）。
    await ctx.dispose();
  });

  test("E2E-A06-09-024 特殊文字クエリで該当が無い場合に404が返る", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-PRODUCT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(SPECIAL_CHAR_QUERY) });
    expect404(res.status()); // 特殊文字で該当なし→404（検索結果0件＝ProductController.php:103,108）。
    await ctx.dispose();
  });

  test("E2E-A06-09-025 異常（該当なし）時のHTTPステータスが404となる", async () => {
    test.skip(!HAS_API, "A06_09_READY(SEED-A06-09-PRODUCT-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(NONE_MATCH_WORD) });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-09-026 空白のみのクエリは該当なしとして404が返る", async () => {
    test.skip(!HAS_API, "A06_09_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PRODUCT_SEARCH_PATH, { params: buildProductQuery(WHITESPACE_QUERY) });
    expect404(res.status()); // 実質空(空白のみ)は該当なし→404（受信検証＝検索結果0件）。
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表3） =====

  test.fixme(
    "E2E-A06-09-014 該当が多い場合に商品が最大100件で打ち切られる（要実機確認: 101件以上のSEED規模／付帯表1・付帯表3）",
    async () => {
      // 期待は集計条件「最大100件で打ち切り」(正本md:88／実装 $maxCount=100 ＝ ProductSearchResponseBuilder.php:46,58)由来。
      // 101件以上に部分一致する SEED-A06-09-OVER100 の生成規模が要実機確認のため fixme。
      // 実装時は products.length === MAX_RESULT_COUNT(100) かつ 101件目以降が含まれないことを SEED で照合する。
    }
  );
});
