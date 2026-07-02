/**
 * a02-01 ポップアップ用商品情報取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a02_01_api_product_popup_product_e2e_cases.md に対応。
 * 期待結果は仕様（設計書 a02-01・観点表 IT-09/10/32・基本設計）由来（オラクル独立性）。
 *  - 実装の応答型(int化)・追加フィールド(productUrl)・404本文形({code,errors})・言語コード`ja`はオラクルにしない（付帯表4#3/#4/#6/#7/#8）。
 *  - 送信先は実装の実効パス `GET /api/popup/product/{lang}/{productId}`（付帯表4#1。設計書 `/popup/product/...` とは不一致）。
 * 本リポジトリ(hareruya-design-docs)では未実行の雛形（コンパイル確認のみ）。
 *
 * 本specには「E2E自動化(API/統合)」を実装し、「（要実機確認）」修飾子付き(014)は test.fixme（理由＝付帯表4参照）。
 * 手動・対象外（008/030/031 等）はケース表で全量管理し本specには書かない（規約）。
 * SEED/環境は test.skip(!process.env.E2E_API_READY, ...) でガードする。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildPopupProductPath,
  buildApiAccessHeaders,
  LANG_JP,
  LANG_EN,
  KNOWN_PRODUCT_ID,
  NONE_PRODUCT_ID,
  UNKNOWN_QUERY_PARAMS,
  POPUP_PRODUCT_SUCCESS_FIELDS,
  POPUP_PRODUCT_FIELD_TYPES,
} from "../../../pages/api/a02/a02_01_api_product_popup_product.api";

const HAS_API = !!process.env.E2E_API_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常取得＝200（設計: 成功応答）").toBe(200);
}
function expect404(status: number) {
  expect(status, "該当なし/不正パラメータ＝404（設計: Not Found）").toBe(404);
}

/** 仕様型契約で各フィールドの存在と型を検証する（数値文字列=string。実装のint化に寄せない＝付帯表4#7）。 */
function assertSuccessContract(body: Record<string, unknown>) {
  for (const field of POPUP_PRODUCT_SUCCESS_FIELDS) {
    expect(body, `成功レスポンスに ${field} が含まれる`).toHaveProperty(field);
    const expectedType = POPUP_PRODUCT_FIELD_TYPES[field];
    const value = body[field];
    if (expectedType === "string|null") {
      expect(value === null || typeof value === "string", `${field} は string|null`).toBeTruthy();
    } else {
      expect(typeof value, `${field} は ${expectedType}`).toBe(expectedType);
    }
  }
}

test.describe("API > ポップアップ用商品情報取得(GET参照系)", { tag: ["@api", "@a02"] }, () => {
  // ===== IT-09 正常取得 =====

  test("E2E-A02-01-001 正常な商品ID・言語で200と商品情報JSONが1件返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-01-PRODUCT-KNOWN/API-ACCESS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    const body = await res.json();
    expect(body, "商品情報JSONが返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A02-01-002 正常取得時に値が加工(再計算/丸め)されず取得時点の値が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 業務ルール「計算処理を行わない」: price01/price02/stock が仕様型(数値文字列)で取得時点値のまま返る。
    expect(body, "price01 を保持").toHaveProperty("price01");
    expect(body, "stock を保持").toHaveProperty("stock");
    await ctx.dispose();
  });

  test("E2E-A02-01-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-01-004 商品ID・言語で該当する商品規格が1件取得され条件と整合する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 条件に合致する商品規格が1件。productId が指定条件と整合（findPopupProductByProductId LIMIT 1）。
    expect(String(body.productId), "productId が指定条件と整合").toBe(String(KNOWN_PRODUCT_ID));
    expect(body, "productClassId を持つ").toHaveProperty("productClassId");
    await ctx.dispose();
  });

  // ===== IT-32 資格情報(正常呼び出し)・レスポンス・必須条件・データなし・受信検証 =====

  test("E2E-A02-01-005 クライアントからの正常呼び出しで応答が処理結果(200)と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status()); // 認可を満たす呼び出し＝正常取得200（負例008は手動/要実機＝ケース表）
    await ctx.dispose();
  });

  test("E2E-A02-01-006 成功レスポンスが仕様のフィールド構成・型契約と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertSuccessContract(body); // 型は仕様契約(数値文字列=string)で判定。実装差異は付帯表4#6/#7/#8で検出
    await ctx.dispose();
  });

  test("E2E-A02-01-007 パス変数欠落(lang/productId)では取得されず404/ルート不一致となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    // productId を欠いたパス（lang のみ）。ルート不一致または404。
    const res = await ctx.get(`${buildPopupProductPath(LANG_JP, "").replace(/\/$/, "")}`, { headers: buildApiAccessHeaders() });
    expect(res.status(), "必須欠落は商品情報を返さない(404/ルート不一致)").not.toBe(200);
    await ctx.dispose();
  });

  test("E2E-A02-01-010 該当する商品規格が無い場合に404 Not Found が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, NONE_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect404(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 仕様の本文は {code, message}(message="Not Found")。実装の {code, errors} 差異は付帯表4#3で検出。
    expect(JSON.stringify(body), "本文に Not Found を含む").toContain("Not Found");
    await ctx.dispose();
  });

  test("E2E-A02-01-011 異常なパラメータ値(productId≦0)で404となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, "0"), { headers: buildApiAccessHeaders() });
    expect404(res.status()); // (int)productId < 1 → NotFoundException（ProductController.php:154-156）
    await ctx.dispose();
  });

  test("E2E-A02-01-012 非数値(型不正)の商品IDで404となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, "abc"), { headers: buildApiAccessHeaders() });
    expect404(res.status()); // preg_match('/^\d+$/') 不一致 → 404（productId は integer 必須）
    await ctx.dispose();
  });

  test("E2E-A02-01-013 想定外の言語コードで404となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath("fr", KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect404(res.status()); // 言語は想定値(jp/en)以外で該当なし→404
    await ctx.dispose();
  });

  test("E2E-A02-01-015 該当なしエラーで {code, message}(message=Not Found) のJSONが返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, NONE_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect404(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body, "エラー本文に code を持つ").toHaveProperty("code");
    expect(JSON.stringify(body), "本文に Not Found を含む").toContain("Not Found");
    await ctx.dispose();
  });

  test("E2E-A02-01-016 異常(該当なし)時のHTTPステータスが404と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, NONE_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-01-017 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-01-018 対象条件に該当する正常値で200と商品情報が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    const body = await res.json();
    expect(body, "商品情報が返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A02-01-019 異常系(不正値)受信時のHTTPステータスが404となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, "abc"), { headers: buildApiAccessHeaders() });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-01-020 同一GETの重複呼び出しで同一レスポンス(冪等参照)となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const path = buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID);
    const res1 = await ctx.get(path, { headers: buildApiAccessHeaders() });
    const res2 = await ctx.get(path, { headers: buildApiAccessHeaders() });
    expect(res1.status(), "1回目と2回目のステータス一致").toBe(res2.status());
    expect(await res1.text(), "1回目と2回目の本文一致(副作用なし)").toBe(await res2.text());
    await ctx.dispose();
  });

  // ===== IT-09 言語別取得・副作用なし・集計 =====

  test("E2E-A02-01-040 言語コード jp 指定で日本語の商品情報が200で返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    // 仕様 lang「jpまたはen」由来。実装は `jp` を未受理(`ja`受理)＝付帯表4#4で落ちて検出。
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-01-041 言語コード en 指定で英語の商品情報(nameEn/code)が200で返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_EN, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body, "英語応答に nameEn を持つ").toHaveProperty("nameEn");
    expect(body, "言語コード code を持つ").toHaveProperty("code");
    await ctx.dispose();
  });

  test("E2E-A02-01-042 weeklySold が週間販売数の集計(SUM)値として数値文字列で返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID), { headers: buildApiAccessHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 仕様: SUM結果を数値文字列(string)で返す。実装のint化は付帯表4#7で落ちて検出。
    expect(typeof body.weeklySold, "weeklySold は数値文字列(string)").toBe("string");
    await ctx.dispose();
  });

  test("E2E-A02-01-043 参照のみで副作用が無い(再取得で対象データ不変)", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const path = buildPopupProductPath(LANG_JP, KNOWN_PRODUCT_ID);
    const before = await (await ctx.get(path, { headers: buildApiAccessHeaders() })).text();
    await ctx.get(path, { headers: buildApiAccessHeaders() });
    const after = await (await ctx.get(path, { headers: buildApiAccessHeaders() })).text();
    // 副作用「無し（参照のみ）」: API呼び出し前後で対象データ(price01/price02/stock等)が不変。
    expect(after, "呼び出し前後で対象データ不変").toBe(before);
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表4） =====

  test.fixme(
    "E2E-A02-01-014 想定外クエリ項目を加えてもサーバエラー(5xx)で停止しない（要実機確認: 未知クエリの扱い／付帯表1 014）",
    async () => {
      // 期待は設計(指定ID/言語のみ参照)由来。想定外クエリの 200無視/拒否は正本に明記が無く、
      // 200固定や無視を本体期待値にできないため要実機確認。送信先＝buildPopupProductPath＋UNKNOWN_QUERY_PARAMS。
      void UNKNOWN_QUERY_PARAMS;
    }
  );
});
