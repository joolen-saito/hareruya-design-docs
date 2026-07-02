/**
 * a02-05 更新商品規格の取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a02_05_api_product_updated_product_class_e2e_cases.md に対応。
 * 期待結果は仕様（設計書 a02-05・観点表 IT-09/10/32/33・基本設計）由来（オラクル独立性）。
 *  - 実装の不正日付時404/500・失敗本文形({code,errors})・フィールド綴り(storageCodeId)・stock/price02のint化・在庫取得元はオラクルにしない（付帯表4#2/#4/#7/#9/#10）。
 *  - 送信先は実効パス `GET /updateProducts/{strFromDate}/{strToDate}`（ProductController.php:204。設計書と一致）。
 * 本リポジトリでは未実行の雛形（コンパイル確認のみ）。
 *
 * 本specには「E2E自動化(API/統合)」を実装する（本機能に「（要実機確認）」修飾子付き＝test.fixme のケースは無い）。
 * 手動・対象外（030 認可／040 レート制限／041 タイムアウト 等）はケース表で全量管理し本specには書かない（規約）。
 * 不正日付(020-024)・必須欠落(025)は具体ステータスを正典が定義しないため「成功(200・count/result本体)とならない」に一般化して判定する（付帯表4#2）。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildUpdatedProductsPath,
  buildAuthHeaders,
  PERIOD_FROM,
  PERIOD_TO,
  EMPTY_FROM,
  EMPTY_TO,
  INVALID_DATE,
  OUT_OF_RANGE_DATE,
  UPDATED_PRODUCT_RESULT_FIELDS,
  UPDATED_PRODUCT_NUMERIC_STRING_FIELDS,
} from "../../../pages/api/a02/a02_05_api_product_updated_product_class.api";

const HAS_API = !!process.env.E2E_API_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（設計: 成功応答）").toBe(200);
}

/** 成功(200・count/result本体)の形であることを判定する。 */
function isSuccessShape(status: number, body: unknown): boolean {
  if (status !== 200 || typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(b, "count") && Object.prototype.hasOwnProperty.call(b, "result");
}

/** 不正入力時: 取得処理を実行せず商品規格本体(count/result)を返さない（具体ステータスは固定しない＝付帯表4#2）。 */
function expectNotSuccessBody(status: number, body: unknown) {
  expect(isSuccessShape(status, body), "成功(200・count/result本体)の応答とならない").toBeFalsy();
}

test.describe("API > 更新商品規格の取得(GET参照系)", { tag: ["@api", "@a02"] }, () => {
  // ===== IT-09 正常取得 =====

  test("E2E-A02-05-001 正常な期間指定で200・count/result を持つJSONが返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-05-PRODUCT-INPERIOD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body, "count を持つ").toHaveProperty("count");
    expect(body, "result を持つ").toHaveProperty("result");
    await ctx.dispose();
  });

  test("E2E-A02-05-002 正常取得時の実行結果が成功応答(200・count/result)と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    expect(isSuccessShape(res.status(), await res.json()), "成功応答形である").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A02-05-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-05-004 更新日時が期間内の商品規格がresultに取得される", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body.result), "result は array").toBeTruthy();
    // 期間内更新分が含まれる（SEED-A02-05-PRODUCT-INPERIOD の既知レコードが result に存在: 要SEED）。
    expect((body.result as unknown[]).length, "期間内更新分が1件以上").toBeGreaterThan(0);
    await ctx.dispose();
  });

  // ===== IT-10 正常/通信/件数整合 =====

  test("E2E-A02-05-005 対象条件に該当する正常値でcountとresult件数が一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as { count: number; result: unknown[] };
    expect(body.count, "count が result の要素数と一致").toBe(body.result.length);
    await ctx.dispose();
  });

  test("E2E-A02-05-006 正常通信で200が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== IT-32 レスポンス構造・各フィールド値・データなし =====

  test("E2E-A02-05-008 result[] 各フィールドが公開I/F契約(綴り・型)どおりにSEED既知値と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as { count: number; result: Array<Record<string, unknown>> };
    expect(typeof body.count, "count は integer").toBe("number");
    expect(Array.isArray(body.result), "result は array").toBeTruthy();
    const row = body.result[0];
    expect(row, "SEED既知レコードが result に存在").toBeTruthy();
    // 公開I/Fフィールドを仕様の綴りで持つ（実装綴り storageCodeId は付帯表4#7で落ちて検出）。
    for (const field of UPDATED_PRODUCT_RESULT_FIELDS) {
      expect(row, `result[] に ${field} が含まれる`).toHaveProperty(field);
    }
    // stock/price02 は数値文字列(string)契約（実装のint化は付帯表4#9で落ちて検出）。
    for (const field of UPDATED_PRODUCT_NUMERIC_STRING_FIELDS) {
      expect(typeof row[field], `${field} は数値文字列(string)`).toBe("string");
    }
    await ctx.dispose();
  });

  test("E2E-A02-05-010 該当0件の期間でcount=0・空配列が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-05-EMPTY-WINDOW) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(EMPTY_FROM, EMPTY_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as { count: number; result: unknown[] };
    expect(body.count, "count が0").toBe(0);
    expect(body.result, "result が空配列").toEqual([]);
    await ctx.dispose();
  });

  // ===== IT-10/IT-33 差分条件・区分整合・OR両側 =====

  test("E2E-A02-05-015 呼び出し時点で当該期間に更新された商品規格のみ返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-05-PRODUCT-INPERIOD/OUTPERIOD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as { result: Array<Record<string, unknown>> };
    // 期間外更新の商品規格(OUTPERIOD)が result に含まれない（productId で識別: 要SEED）。
    const outId = process.env.A02_05_OUTPERIOD_PRODUCT_ID;
    if (outId) {
      const ids = body.result.map((r) => String(r.productId));
      expect(ids, "期間外更新分が含まれない").not.toContain(String(outId));
    }
    await ctx.dispose();
  });

  test("E2E-A02-05-016 更新対象外(期間外更新)の商品規格がresultに混入しない", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-05-PRODUCT-INPERIOD/OUTPERIOD) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as { result: Array<Record<string, unknown>> };
    const outId = process.env.A02_05_OUTPERIOD_PRODUCT_ID;
    if (outId) {
      const ids = body.result.map((r) => String(r.productId));
      expect(ids, "更新対象外が混入しない").not.toContain(String(outId));
    }
    await ctx.dispose();
  });

  test("E2E-A02-05-017 商品情報の更新日時のみが期間内の商品規格がresultに取得される", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-05-PRODUCT-UPDATE-ONLY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as { result: Array<Record<string, unknown>> };
    // OR条件 商品情報側(dtb_product.update_date)成立分が含まれる（productId で識別: 要SEED）。
    const onlyId = process.env.A02_05_PRODUCT_UPDATE_ONLY_ID;
    if (onlyId) {
      const ids = body.result.map((r) => String(r.productId));
      expect(ids, "商品情報側更新分が含まれる").toContain(String(onlyId));
    }
    await ctx.dispose();
  });

  test("E2E-A02-05-018 商品規格の更新日時のみが期間内の商品規格がresultに取得される", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-05-CLASS-UPDATE-ONLY) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, PERIOD_TO), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as { result: Array<Record<string, unknown>> };
    // OR条件 商品規格側(dtb_product_class.update_date)成立分が含まれる（productId で識別: 要SEED）。
    const onlyId = process.env.A02_05_CLASS_UPDATE_ONLY_ID;
    if (onlyId) {
      const ids = body.result.map((r) => String(r.productId));
      expect(ids, "商品規格側更新分が含まれる").toContain(String(onlyId));
    }
    await ctx.dispose();
  });

  // ===== IT-32/IT-10 不正入力(具体ステータスは固定しない＝付帯表4#2) =====

  test("E2E-A02-05-020 不正な日付値では取得処理を実行せず商品規格本体を返さない", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(INVALID_DATE, PERIOD_TO), { headers: buildAuthHeaders() });
    expectNotSuccessBody(res.status(), await res.json().catch(() => null));
    await ctx.dispose();
  });

  test("E2E-A02-05-021 エラー誘発(不正期間値)時に商品規格本体を返さない", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(PERIOD_FROM, INVALID_DATE), { headers: buildAuthHeaders() });
    expectNotSuccessBody(res.status(), await res.json().catch(() => null));
    await ctx.dispose();
  });

  test("E2E-A02-05-022 異常系(不正期間値)で商品規格本体を返さない", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(OUT_OF_RANGE_DATE, PERIOD_TO), { headers: buildAuthHeaders() });
    expectNotSuccessBody(res.status(), await res.json().catch(() => null));
    await ctx.dispose();
  });

  test("E2E-A02-05-023 不正入力時は商品規格本体(result)を返さない", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath(INVALID_DATE, INVALID_DATE), { headers: buildAuthHeaders() });
    expectNotSuccessBody(res.status(), await res.json().catch(() => null));
    await ctx.dispose();
  });

  test("E2E-A02-05-024 日付形式の検証に失敗した入力は商品規格データを返さない", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildUpdatedProductsPath("2026/06/21", PERIOD_TO), { headers: buildAuthHeaders() });
    expectNotSuccessBody(res.status(), await res.json().catch(() => null));
    await ctx.dispose();
  });

  test("E2E-A02-05-025 パスパラメータ欠落では取得処理を実行せず本体を返さない", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    // strToDate を欠落させたパス（/updateProducts/{from}）。ルート不成立を含み成功(200・count/result)とならない。
    const res = await ctx.get(`/updateProducts/${PERIOD_FROM}`, { headers: buildAuthHeaders() });
    expectNotSuccessBody(res.status(), await res.json().catch(() => null));
    await ctx.dispose();
  });
});
