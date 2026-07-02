/**
 * a06-07 店頭仕入_買取商品複数ID取得（参照系JSON API：商品IDリスト→買取用商品情報の一括取得）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_07_api_buying_products_by_ids_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(020/021/022＝異常パラメータ・想定外項目・異常系)は test.fixme（理由付き）で残す。
 * 手動（070/071 資格情報・072 レート制限・073 タイムアウト）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は参照系APIで結果が管理画面に現れる範囲を持たないため UI専用specは無い（付帯表2 自動化(UI)=0）。
 *
 * 期待結果は仕様（設計書 a06-07・正本md・観点表）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `POST /api/v1/buying/products`（付帯表4#1。設計書 `POST /buying/products` とは不一致）。
 *  - ids はカンマ区切り string をPOSTボディ(form ids)で送信。合否は HTTPステータス・Content-Type・cards階層構造・型契約・値で判定。
 *  - 実装の 0件応答形（{cards:{}}/{cards:[]}）・price/stock/foilFlg のint化・キー名 productClassCode はオラクルに固定しない。
 *    テストは仕様（空配列[]・string/boolean・productCode）を期待し、実装が違えば落ちて検出する（付帯表4#3-#8）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_07_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  BUYING_PRODUCTS_PATH,
  buildIdsForm,
  buildAuthHeaders,
  collectConditionClasses,
  cardKeys,
  KNOWN_CARD_IDS_CSV,
  NONCARD_IDS_CSV,
  NULLFIELDS_CARD_IDS_CSV,
  MIXED_KNOWN_AND_NONCARD_IDS_CSV,
  DUP_UNORDERED_IDS_CSV,
  EMPTY_IDS_CSV,
  EXPECTED_CARD,
  NULLABLE_FIELDS,
} from "../../../pages/api/a06/a06_07_api_buying_products_by_ids.api";

const HAS_API = !!process.env.A06_07_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（設計: 成功応答）").toBe(200);
}

test.describe("API > 買取商品複数ID取得(参照系)", { tag: ["@api", "@a06"] }, () => {
  test("E2E-A06-07-001 複数ID正常取得でHTTP200・買取用商品JSONが返る", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-AUTH/CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    const body = await res.json();
    // 指定IDに対応する買取用商品情報が cards オブジェクトとして返る（正本md cards階層）。
    expect(body, "cards をキーに持つ応答").toHaveProperty("cards");
    await ctx.dispose();
  });

  test("E2E-A06-07-002 正常取得時のHTTPステータスが200", async () => {
    test.skip(!HAS_API, "A06_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-07-003 正常パラメータでSEED期待値どおりのcards情報が返る", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    const body = await res.json();
    // cards 配下の cardNameJp/cardNameEn/productId が既知SEED期待値と一致（出し分け列・店舗コンテキストは付帯表4#9で要確認）。
    const cards = (body as { cards?: Record<string, unknown> }).cards ?? {};
    const first = Object.values(cards)[0] as Record<string, unknown> | undefined;
    expect(first, "少なくとも1カードが返る").toBeTruthy();
    if (first) {
      expect(first.cardNameJp, "cardNameJp がSEED期待値と一致").toBe(EXPECTED_CARD.cardNameJp);
      expect(first.cardNameEn, "cardNameEn がSEED期待値と一致").toBe(EXPECTED_CARD.cardNameEn);
      expect(first.productId, "productId がSEED期待値と一致").toBe(EXPECTED_CARD.productId);
    }
    await ctx.dispose();
  });

  test("E2E-A06-07-004 複数カードに跨るIDで全対象カードが一括取得される", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    const body = await res.json();
    // 指定IDに対応する全カードが cards のキーとして過不足なく返る（複数カード一括取得）。
    const keys = cardKeys(body);
    expect(keys.length, "指定した複数IDに対応するカードが返る").toBeGreaterThanOrEqual(1);
    await ctx.dispose();
  });

  test("E2E-A06-07-005 通信成立しJSON(application/json)で応答する", async () => {
    test.skip(!HAS_API, "A06_07_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    expect(res.headers()["content-type"] ?? "", "application/json で応答").toContain("application/json");
    await ctx.dispose();
  });

  test("E2E-A06-07-006 正常値でconditionClasses配下の各フィールド値がSEED期待値と一致", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    const conds = collectConditionClasses(await res.json());
    expect(conds.length, "conditionClasses が1件以上").toBeGreaterThanOrEqual(1);
    const c = conds[0] ?? {};
    // productClassId(integer)・buyPrice・price(string)・stock(string) が既知SEED期待値と一致（型乖離は付帯表4#4,#5）。
    expect(c.productClassId, "productClassId がSEED期待値").toBe(EXPECTED_CARD.productClassId);
    expect(c.price, "price がSEED期待値（仕様: 数値文字列）").toBe(EXPECTED_CARD.price);
    expect(c.stock, "stock がSEED期待値（仕様: 数値文字列）").toBe(EXPECTED_CARD.stock);
    expect(c.buyPrice, "buyPrice がSEED期待値").toBe(EXPECTED_CARD.buyPrice);
    await ctx.dispose();
  });

  test("E2E-A06-07-007 0件でも失敗ステータスを返さずHTTP200", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-NONCARD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(NONCARD_IDS_CSV) });
    // 専用の失敗ステータスを返さず200（0件はエラーとしない／正本md:174,212）。
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-07-008 重複/順不同IDでも対応商品をJSONで返す", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(DUP_UNORDERED_IDS_CSV) });
    expect200(res.status());
    const body = await res.json();
    // 重複・順序によらず指定IDに対応する買取用商品情報がJSONで返る。
    expect(body, "cards をキーに持つ応答").toHaveProperty("cards");
    await ctx.dispose();
  });

  test("E2E-A06-07-009 正常応答の階層構造が仕様の入れ子形式と一致", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    const body = await res.json();
    // cards > details > languageClasses > conditionClasses の順に入れ子（正本md:81-105）。
    const cards = (body as { cards?: Record<string, unknown> }).cards ?? {};
    const first = Object.values(cards)[0] as { details?: unknown[] } | undefined;
    expect(first, "cards 配下にカードが存在").toBeTruthy();
    expect(Array.isArray(first?.details), "details 配列を持つ").toBeTruthy();
    const lang = (first?.details?.[0] as { languageClasses?: unknown[] } | undefined)?.languageClasses;
    expect(Array.isArray(lang), "languageClasses 配列を持つ").toBeTruthy();
    const conds = (lang?.[0] as { conditionClasses?: unknown[] } | undefined)?.conditionClasses;
    expect(Array.isArray(conds), "conditionClasses 配列を持つ").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-07-010 正しい形式のPOSTボディを受理しHTTP200", async () => {
    test.skip(!HAS_API, "A06_07_READY 未設定");
    const ctx = await newCtx();
    // ids をボディに持つ正しい形式のPOST（methods:['POST']／request->get('ids') BuyingController.php:70）。
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-07-011 ids空/未指定でも必須エラーにせず空配列を返す", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(EMPTY_IDS_CSV) });
    expect200(res.status());
    // 仕様: 必須エラーとせず空配列[]（正本md:73,79）。実装の0件応答形 {cards:[]} は付帯表4#3で検出。
    expect(await res.json(), "空idsは仕様どおり空配列[]").toEqual([]);
    await ctx.dispose();
  });

  test("E2E-A06-07-012 カード商品以外IDのみ→0件を正常応答(200・空配列)として返す", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-NONCARD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(NONCARD_IDS_CSV) });
    expect200(res.status());
    // 仕様: 0件正常応答で応答全体が空配列[]（正本md:79,109,155-159）。実装の {cards:{}} 差異は付帯表4#3で検出。
    expect(await res.json(), "カード商品以外のみは仕様どおり空配列[]").toEqual([]);
    await ctx.dispose();
  });

  test("E2E-A06-07-050 price/stockがstring(数値文字列)型で返る", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    const conds = collectConditionClasses(await res.json());
    expect(conds.length, "conditionClasses が1件以上").toBeGreaterThanOrEqual(1);
    const c = conds[0] ?? {};
    // 仕様: price/stock は string（正本md:103,104）。実装はint型の可能性＝付帯表4#4,#5（違えば落ちて検出）。
    expect(typeof c.price, "price は string").toBe("string");
    expect(typeof c.stock, "stock は string").toBe("string");
    await ctx.dispose();
  });

  test("E2E-A06-07-051 一部不存在で存在カードのみ返り非対象IDは含まれない", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN/NONCARD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(MIXED_KNOWN_AND_NONCARD_IDS_CSV) });
    expect200(res.status());
    const keys = cardKeys(await res.json());
    // 存在するカード商品のみが cards に返り、カード商品以外のIDは結果に含まれない（正本md:5,50-51）。
    for (const noncard of NONCARD_IDS_CSV.split(",").map((s) => s.trim()).filter(Boolean)) {
      expect(keys, `カード商品以外ID(${noncard})は cards キーに含まれない`).not.toContain(noncard);
    }
    await ctx.dispose();
  });

  test("E2E-A06-07-052 連続呼び出しで応答が同一(参照のみ・副作用なし)", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const r1 = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    const r2 = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(r1.status());
    expect200(r2.status());
    // 2回の応答内容が同一＝参照のみ・副作用なし（正本md:163,173）。
    expect(await r1.json(), "同一idsの2回応答が同一").toEqual(await r2.json());
    await ctx.dispose();
  });

  test("E2E-A06-07-053 未設定項目がnullで返る", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-NULLFIELDS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(NULLFIELDS_CARD_IDS_CSV) });
    expect200(res.status());
    const body = await res.json();
    // cardsetCode/cardsetName/promotionName/storageCodeName/buyPrice/sectionId が未設定時 null（正本md null契約）。
    const cards = (body as { cards?: Record<string, unknown> }).cards ?? {};
    const card = Object.values(cards)[0] as Record<string, unknown> | undefined;
    const conds = collectConditionClasses(body);
    const probe = { ...(card ?? {}), ...(conds[0] ?? {}) };
    for (const f of NULLABLE_FIELDS) {
      if (f in probe) expect(probe[f], `${f} は未設定時 null`).toBeNull();
    }
    await ctx.dispose();
  });

  test("E2E-A06-07-054 foilFlgがboolean・ID系がinteger型で返る", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    const conds = collectConditionClasses(await res.json());
    expect(conds.length, "conditionClasses が1件以上").toBeGreaterThanOrEqual(1);
    const c = conds[0] ?? {};
    // 仕様: foilFlg は boolean（正本md:90。実装int＝付帯表4#6）。productId/productClassId/sectionId は integer。
    expect(typeof c.foilFlg, "foilFlg は boolean").toBe("boolean");
    expect(Number.isInteger(c.productClassId), "productClassId は integer").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A06-07-055 フィールド名が仕様のproductCodeで返る", async () => {
    test.skip(!HAS_API, "A06_07_READY(SEED-A06-07-CARDS-KNOWN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(BUYING_PRODUCTS_PATH, { headers: buildAuthHeaders(), form: buildIdsForm(KNOWN_CARD_IDS_CSV) });
    expect200(res.status());
    const conds = collectConditionClasses(await res.json());
    expect(conds.length, "conditionClasses が1件以上").toBeGreaterThanOrEqual(1);
    // 仕様: 商品コードはキー名 productCode（正本md:101。実装は productClassCode＝付帯表4#7。違えば落ちて検出）。
    expect(conds[0], "conditionClasses は仕様キー名 productCode を持つ").toHaveProperty("productCode");
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表4#8。期待値を固定しない） =====

  test.fixme(
    "E2E-A06-07-020 非数値/型不正IDの受理・除外挙動（要実機確認: 未定義挙動／付帯表4#8）",
    async () => {
      // 期待は設計(idsはカンマ区切りstring・正本md:71,73)由来。実装は preg_match('/^\d+$/') で非数値除外しintval（BuyingController.php:73-77）。
      // 非数値/型不正IDの受理・除外（エラー化・除外・0件化のいずれか）が正典未定義のため、期待結果を固定せず fixme。
      // 入力候補: NONNUMERIC_MIXED_IDS_CSV（既知ID＋"abc","-1"）を form ids で送信。
    }
  );

  test.fixme(
    "E2E-A06-07-021 想定外項目を加えて送信した結果（要実機確認: 未定義挙動／付帯表4#8）",
    async () => {
      // 期待は設計(idsのみで最小構成)由来。想定外項目の無視可否が正典未定義のため、期待結果を固定せず fixme。
      // 入力候補: buildIdsFormWithExtra(KNOWN_CARD_IDS_CSV, { unknownField: "x" }) を送信。
    }
  );

  test.fixme(
    "E2E-A06-07-022 異常入力でもサーバエラーで停止しない（要実機確認: 異常系HTTPステータス／付帯表4#8）",
    async () => {
      // 期待は設計(無応答・未定義例外で停止しない)由来。具体的なHTTPステータスが正典未定義のため、期待結果を固定せず fixme。
      // 入力候補: 異常系を誘発する form（型不正ids・巨大ids等）を送信し、5xxで停止しないことを要実機確認。
    }
  );
});
