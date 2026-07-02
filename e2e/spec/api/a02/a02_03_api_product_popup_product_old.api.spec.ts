/**
 * a02-03 ポップアップ用商品情報取得(旧)（GET参照系JSON API・言語指定なし）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a02_03_api_product_popup_product_old_e2e_cases.md に対応。
 * 期待結果は仕様（設計書 a02-03・観点表 IT-09/10/32/19）由来（オラクル独立性）。
 *  - 実装の応答フィールド差異(cardId欠落/追加列)・stockのint化・404本文形({code,errors})・500分岐はオラクルにしない（付帯表4#1/#2/#3/#4）。
 *  - 送信先は実効パス `GET /popup/old/{oldProductId}`（ProductController.php:317。設計書と一致）。
 * 本リポジトリでは未実行の雛形（コンパイル確認のみ）。
 *
 * 本specには「E2E自動化(API/統合)」を実装し、「（要実機確認）」修飾子付き(008/009/023/024/025)は test.fixme。
 * 手動・対象外（040/041/042 等）はケース表で全量管理し本specには書かない（規約）。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildPopupOldPath,
  buildClientAuthHeaders,
  KNOWN_OLD_PRODUCT_ID,
  KNOWN_OLD_EN_PRODUCT_ID,
  NONE_OLD_PRODUCT_ID,
  POPUP_OLD_SUCCESS_FIELDS,
  POPUP_OLD_NUMERIC_STRING_FIELDS,
} from "../../../pages/api/a02/a02_03_api_product_popup_product_old.api";

const HAS_API = !!process.env.E2E_API_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（設計: 成功応答）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし＝404（設計: Not Found）").toBe(404);
}

test.describe("API > ポップアップ用商品情報取得(旧・GET参照系)", { tag: ["@api", "@a02"] }, () => {
  // ===== IT-09 正常取得 =====

  test("E2E-A02-03-001 既存の旧商品IDで200・商品情報が1件取得できる", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-03-OLD-JP/CLIENT-AUTH) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(KNOWN_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect200(res.status());
    const body = await res.json();
    expect(body, "商品情報JSONが返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A02-03-002 成功応答に設計の商品情報フィールドが含まれる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(KNOWN_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 設計は cardId を含む。実装に cardId が無ければ付帯表4#1で落ちて検出。
    for (const field of POPUP_OLD_SUCCESS_FIELDS) {
      expect(body, `成功レスポンスに ${field} が含まれる`).toHaveProperty(field);
    }
    await ctx.dispose();
  });

  test("E2E-A02-03-003 取得成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(KNOWN_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-03-004 取得結果が紐づくDB値と整合して返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(KNOWN_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 旧商品IDに紐づく商品・規格・在庫の各値が応答に反映される（値はSEED既知値で照合: 要SEED）。
    expect(body, "productId を持つ").toHaveProperty("productId");
    expect(body, "stock を持つ").toHaveProperty("stock");
    await ctx.dispose();
  });

  test("E2E-A02-03-005 対象条件に該当する値で正しい1件のみ返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(KNOWN_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect200(res.status());
    const body = await res.json();
    expect(Array.isArray(body), "配列でなく1件のオブジェクト").toBeFalsy();
    await ctx.dispose();
  });

  test("E2E-A02-03-006 成功時のHTTPステータス200と応答本文が取得結果と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(KNOWN_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect200(res.status());
    expect(await res.json(), "応答本文を持つ").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A02-03-007 正常通信で200が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(KNOWN_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-03-010 レスポンス書式(JSON・camelCase・decimal文字列)が仕様と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(KNOWN_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect200(res.status());
    expect(res.headers()["content-type"], "JSON応答").toContain("json");
    const body = (await res.json()) as Record<string, unknown>;
    // price01/price02/stock は decimal の数値文字列(string)。実装のint化は付帯表4#2で落ちて検出。
    for (const field of POPUP_OLD_NUMERIC_STRING_FIELDS) {
      expect(typeof body[field], `${field} は数値文字列(string)`).toBe("string");
    }
    await ctx.dispose();
  });

  test("E2E-A02-03-011 旧英語商品IDでマッチして商品情報が200で取得できる", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-03-OLD-EN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(KNOWN_OLD_EN_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect200(res.status()); // 設計「旧商品IDまたは旧英語商品IDと突き合わせる」由来
    await ctx.dispose();
  });

  // ===== IT-32/IT-10 該当なし・必須条件 =====

  test("E2E-A02-03-020 該当が無い旧商品IDは404・Not Found となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-03-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(NONE_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect404(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(JSON.stringify(body), "本文に Not Found を含む").toContain("Not Found");
    await ctx.dispose();
  });

  test("E2E-A02-03-021 該当なし時のHTTPステータスが404である", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupOldPath(NONE_OLD_PRODUCT_ID), { headers: buildClientAuthHeaders() });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-03-022 旧商品IDを満たさないパスでは取得されず404となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    // oldProductId を欠落させたパス（/popup/old）。ルート不一致または404。
    const res = await ctx.get("/popup/old", { headers: buildClientAuthHeaders() });
    expect(res.status(), "必須欠落は商品情報を返さない").not.toBe(200);
    await ctx.dispose();
  });

  // ===== IT-10 冪等参照 =====

  test("E2E-A02-03-030 同一旧商品IDの繰返し取得が冪等で同一応答となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const path = buildPopupOldPath(KNOWN_OLD_PRODUCT_ID);
    const res1 = await ctx.get(path, { headers: buildClientAuthHeaders() });
    const res2 = await ctx.get(path, { headers: buildClientAuthHeaders() });
    expect(res1.status(), "繰返しで同一ステータス").toBe(res2.status());
    expect(await res1.text(), "繰返しで同一本文(副作用なし)").toBe(await res2.text());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表4） =====

  test.fixme(
    "E2E-A02-03-008 認可を満たす呼び出しで取得できる（要実機確認: 認可方式／付帯表4#7）",
    async () => {
      // 期待は設計(認可を満たすクライアント呼び出しで200)由来。App配下ルートの認可方式が確定できず要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-03-009 資格情報が不正な呼び出しは取得が拒否される（要実機確認: 認可方式／付帯表4#7）",
    async () => {
      // 期待は設計(不正資格情報→取得拒否)由来。拒否時の具体ステータス・認可方式が要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-03-023 異常な旧商品ID値では商品情報が取得されない（要実機確認: 型不正時ステータス／付帯表4#5）",
    async () => {
      // 期待は「正しい商品情報が取得されない(エラー応答)」に一般化。ルートは [^./]+ で任意文字列許容＝具体ステータス要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-03-024 想定外のクエリ項目付与時の挙動（要実機確認: 未知クエリ挙動／付帯表1 024）",
    async () => {
      // 処理対象はパスの旧商品IDのみ(処理フロー#1)。未知クエリの無視/拒否は正典未定義で本体期待値にせず要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-03-025 内部エラー時も未定義エラーで停止せずエラー応答となる（要実機確認: 500扱い／付帯表4#4）",
    async () => {
      // 期待は設計のエラー処理(該当なし404/その他エラー応答)由来。500応答の扱いは設計未記載で要実機確認。
    }
  );
});
