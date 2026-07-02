/**
 * a02-04 ポップアップ用カード情報取得(旧)（GET参照系JSON API・言語付き旧商品ID）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a02_04_api_product_popup_card_old_e2e_cases.md に対応。
 * 期待結果は仕様（設計書 a02-04・観点表 IT-09/10/32/19）由来（オラクル独立性）。
 *  - 実装の応答型(int化)・追加フィールド・404本文形({code,errors})・言語フォールバック(jp→EN)はオラクルにしない（付帯表4#1/#2/#3）。
 *  - 送信先は実効パス `GET /popup/old/{lang}/{oldProductId}`（ProductController.php:361。設計書と一致）。
 * 本リポジトリでは未実行の雛形（コンパイル確認のみ）。
 *
 * 本specには「E2E自動化(API/統合)」を実装し、「（要実機確認）」修飾子付き(007/010/011/013/016/017)は test.fixme。
 * 手動・対象外（018/019 等）はケース表で全量管理し本specには書かない（規約）。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildPopupCardOldPath,
  buildAuthHeaders,
  LANG_JP,
  LANG_EN,
  KNOWN_OLD_PRODUCT_ID_JP,
  KNOWN_OLD_PRODUCT_ID_EN,
  NONE_OLD_PRODUCT_ID,
  INVALID_OLD_PRODUCT_ID,
  POPUP_CARD_OLD_SUCCESS_FIELDS,
  POPUP_CARD_OLD_NUMERIC_STRING_FIELDS,
  UNKNOWN_QUERY_PARAMS,
} from "../../../pages/api/a02/a02_04_api_product_popup_card_old.api";

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

test.describe("API > ポップアップ用カード情報取得(旧・GET参照系)", { tag: ["@api", "@a02"] }, () => {
  // ===== IT-09/IT-10 正常取得 =====

  test("E2E-A02-04-001 日本語指定＋該当する旧商品IDで200・商品情報が1件返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-04-PRODUCT-JP) 未設定");
    const ctx = await newCtx();
    // 仕様 lang「jp=日本語」由来。実装は match で jp→default(EN)＝付帯表4#1で落ちて検出。
    const res = await ctx.get(buildPopupCardOldPath(LANG_JP, KNOWN_OLD_PRODUCT_ID_JP), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = await res.json();
    expect(body, "商品情報JSONが返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A02-04-002 英語指定＋該当する旧英語商品IDで200・商品情報が1件返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-04-PRODUCT-EN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardOldPath(LANG_EN, KNOWN_OLD_PRODUCT_ID_EN), { headers: buildAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-04-003 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardOldPath(LANG_JP, KNOWN_OLD_PRODUCT_ID_JP), { headers: buildAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-04-004 正常取得時の本文が取得対象の商品規格と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardOldPath(LANG_JP, KNOWN_OLD_PRODUCT_ID_JP), { headers: buildAuthHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body, "productId を持つ").toHaveProperty("productId");
    expect(body, "productClassId を持つ").toHaveProperty("productClassId");
    await ctx.dispose();
  });

  test("E2E-A02-04-005 旧商品ID・言語からデータが取得され応答に反映される", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardOldPath(LANG_JP, KNOWN_OLD_PRODUCT_ID_JP), { headers: buildAuthHeaders() });
    expect200(res.status());
    expect(await res.json(), "応答本文が取得結果と一致").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A02-04-006 正常通信で200が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardOldPath(LANG_JP, KNOWN_OLD_PRODUCT_ID_JP), { headers: buildAuthHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== IT-32 想定外項目 / IT-10 冪等参照 =====

  test("E2E-A02-04-008 想定外のクエリ項目を加えても200で取得できる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardOldPath(LANG_JP, KNOWN_OLD_PRODUCT_ID_JP), {
      headers: buildAuthHeaders(),
      params: UNKNOWN_QUERY_PARAMS, // パスパラメータのみ使用＝未知クエリは無視され200
    });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-04-009 同一リクエスト連続送信で取得時点の値が返り副作用が無い", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const path = buildPopupCardOldPath(LANG_JP, KNOWN_OLD_PRODUCT_ID_JP);
    const res1 = await ctx.get(path, { headers: buildAuthHeaders() });
    const res2 = await ctx.get(path, { headers: buildAuthHeaders() });
    expect(await res1.text(), "2回とも同一(参照系・副作用なし)").toBe(await res2.text());
    await ctx.dispose();
  });

  // ===== IT-32/IT-10 該当なし・異常パラメータ・必須条件 =====

  test("E2E-A02-04-012 異常取得(該当なし)時のHTTPステータスが404である", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-04-NOTFOUND) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardOldPath(LANG_JP, NONE_OLD_PRODUCT_ID), { headers: buildAuthHeaders() });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-04-014 非整数など異常なoldProductIdは該当なし扱いで404となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardOldPath(LANG_JP, INVALID_OLD_PRODUCT_ID), { headers: buildAuthHeaders() });
    // 異常パラメータ値に該当する商品規格が無い→200の商品情報を返さず404。
    expect(res.status(), "200の商品情報を返さない").not.toBe(200);
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-04-015 必須パスパラメータ欠落のリクエストは正常取得とならない", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    // oldProductId を欠落させたURL（/popup/old/jp/）。正常な商品情報取得(200)とならない。
    const res = await ctx.get(`${buildPopupCardOldPath(LANG_JP, "")}`, { headers: buildAuthHeaders() });
    expect(res.status(), "必須欠落は正常取得(200)とならない").not.toBe(200);
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表4） =====

  test.fixme(
    "E2E-A02-04-007 成功レスポンスが設計の応答フィールド・型契約を備える（要実機確認: 応答フィールド差異／付帯表4#3）",
    async () => {
      // 期待は設計の10フィールド＋型契約(price01/price02/stock/weeklySold=string・subFileName/fileName=null許容)由来。
      // 実装は int 化・追加列・subFileName/fileName 同一値の可能性＝要実機確認。
      void POPUP_CARD_OLD_SUCCESS_FIELDS;
      void POPUP_CARD_OLD_NUMERIC_STRING_FIELDS;
    }
  );

  test.fixme(
    "E2E-A02-04-010 該当なし時に404・本文が {code, message}(Not Found) である（要実機確認: 応答本文形／付帯表4#2）",
    async () => {
      // 期待は設計の {code, message} 由来。実装は {code, errors} で本文構造が異なる＝要実機確認(404は一致見込み)。
    }
  );

  test.fixme(
    "E2E-A02-04-011 該当なし時のエラー応答が仕様通り {code, message} となる（要実機確認: 応答本文形／付帯表4#2）",
    async () => {
      // 期待は設計のエラー処理(404・{code, message}) 由来。本文キー(message/errors)は要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-04-013 異常系(該当なし)のレスポンスが仕様 {code, message} と一致する（要実機確認: 応答本文形／付帯表4#2）",
    async () => {
      // 期待は設計のエラー処理 {code, message}(Not Found) 由来。本文構造の差異は要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-04-016 呼び出し元の資格情報(認可)が認可方針どおりに扱われる（要実機確認: 認可方式／付帯表4#4）",
    async () => {
      // 期待は設計(許可→200/不許可→拒否)由来。App firewall は ^/api/v1/ に非該当で認可方式が確定できず要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-04-017 受信検証を満たさないリクエストは商品情報を返さない（要実機確認: 受信検証方式／付帯表4#4）",
    async () => {
      // 期待は設計(受信検証不成立→拒否)由来。受信検証の実装方式が確定できず要実機確認。
    }
  );
});
