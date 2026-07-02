/**
 * a02-02 ポップアップ用カード情報取得（GET参照系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a02_02_api_product_popup_card_e2e_cases.md に対応。
 * 期待結果は仕様（設計書 a02-02・観点表 IT-09/10/32）由来（オラクル独立性）。
 *  - 実装の応答型(int化)・追加フィールド(productUrl)・404本文形({code,errors})・言語フォールバックはオラクルにしない（付帯表4#2/#4/#5/#10）。
 *  - 送信先は実装の実効パス `GET /api/popup/card/{lang}/{cardId}`（付帯表4#1。設計書 `/popup/card/...` とは不一致）。
 * 本リポジトリでは未実行の雛形（コンパイル確認のみ）。
 *
 * 本specには「E2E自動化(API/統合)」を実装し、「（要実機確認）」修飾子付き(007/010/011/013/014/018/050/053)は test.fixme。
 * 手動・対象外（019 認可 等）はケース表で全量管理し本specには書かない（規約）。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildPopupCardPath,
  buildAuthzHeaders,
  LANG_JP,
  KNOWN_CARD_ID,
  NONE_CARD_ID,
  BOUNDARY_CARD_ID,
  POPUP_CARD_SUCCESS_FIELDS,
  POPUP_CARD_NUMERIC_STRING_FIELDS,
  UNKNOWN_QUERY_PARAMS,
} from "../../../pages/api/a02/a02_02_api_product_popup_card.api";

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

test.describe("API > ポップアップ用カード情報取得(GET参照系)", { tag: ["@api", "@a02"] }, () => {
  // ===== IT-10/IT-09 正常取得 =====

  test("E2E-A02-02-001 有効なカードID・言語で200と商品情報JSONが1件返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-02-CARD-PRODUCT/AUTHZ) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, KNOWN_CARD_ID), { headers: buildAuthzHeaders() });
    expect200(res.status());
    const body = await res.json();
    expect(body, "商品情報JSONが返る").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A02-02-002 正常通信で200応答が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, KNOWN_CARD_ID), { headers: buildAuthzHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-02-003 対象条件に該当する値で200・本文が商品規格1件と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, KNOWN_CARD_ID), { headers: buildAuthzHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body, "商品規格1件(productClassId)を持つ").toHaveProperty("productClassId");
    await ctx.dispose();
  });

  test("E2E-A02-02-004 取得値が参照時点と整合し副作用が無い(再取得で不変)", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const path = buildPopupCardPath(LANG_JP, KNOWN_CARD_ID);
    const first = await (await ctx.get(path, { headers: buildAuthzHeaders() })).text();
    const second = await (await ctx.get(path, { headers: buildAuthzHeaders() })).text();
    expect(second, "参照のみ＝呼び出し前後で不変").toBe(first);
    await ctx.dispose();
  });

  test("E2E-A02-02-005 条件合致時に商品規格が1件返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, KNOWN_CARD_ID), { headers: buildAuthzHeaders() });
    expect200(res.status());
    const body = await res.json();
    // findPopupProductByCardId LIMIT 1: 単一オブジェクト(配列でない)で1件返る。
    expect(Array.isArray(body), "配列でなく1件のオブジェクト").toBeFalsy();
    await ctx.dispose();
  });

  test("E2E-A02-02-006 正常取得時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, KNOWN_CARD_ID), { headers: buildAuthzHeaders() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== IT-09 外部取得(該当なし404) =====

  test("E2E-A02-02-008 該当する商品規格が無い場合に404が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-02-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, NONE_CARD_ID), { headers: buildAuthzHeaders() });
    expect404(res.status());
    await ctx.dispose();
  });

  // ===== IT-32 レスポンス・想定外項目・データなし(本文)・受信検証(境界) =====

  test("E2E-A02-02-009 成功応答に仕様の全フィールドが含まれる", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, KNOWN_CARD_ID), { headers: buildAuthzHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    for (const field of POPUP_CARD_SUCCESS_FIELDS) {
      expect(body, `成功レスポンスに ${field} が含まれる`).toHaveProperty(field);
    }
    await ctx.dispose();
  });

  test("E2E-A02-02-012 想定外のクエリ項目を加えても200で商品情報が返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, KNOWN_CARD_ID), {
      headers: buildAuthzHeaders(),
      params: UNKNOWN_QUERY_PARAMS, // パス変数のみ参照＝未知クエリは無視され200
    });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-02-051 価格・在庫・週間販売数が数値文字列(string)で返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, KNOWN_CARD_ID), { headers: buildAuthzHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    // 仕様: Doctrine decimal/SUM結果＝数値文字列(string)。実装のint化は付帯表4#10で落ちて検出。
    for (const field of POPUP_CARD_NUMERIC_STRING_FIELDS) {
      expect(typeof body[field], `${field} は数値文字列(string)`).toBe("string");
    }
    await ctx.dispose();
  });

  test("E2E-A02-02-052 画像が無い場合に subFileName・fileName が null で返る", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-02-NO-IMAGE) 未設定");
    const ctx = await newCtx();
    const noImageCardId = process.env.A02_02_NO_IMAGE_CARD_ID || KNOWN_CARD_ID; // 要実機確認: 画像無し規格のカードID
    const res = await ctx.get(buildPopupCardPath(LANG_JP, noImageCardId), { headers: buildAuthzHeaders() });
    expect200(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.subFileName, "画像無し時 subFileName=null").toBeNull();
    expect(body.fileName, "画像無し時 fileName=null").toBeNull();
    await ctx.dispose();
  });

  test("E2E-A02-02-054 境界cardId値でも500で停止せず該当なし404となる", async () => {
    test.skip(!HAS_API, "E2E_API_READY(SEED-A02-02-NONE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, BOUNDARY_CARD_ID), { headers: buildAuthzHeaders() });
    expect(res.status(), "5xxで停止しない").toBeLessThan(500);
    expect404(res.status());
    await ctx.dispose();
  });

  // ===== IT-10 異常系(該当なし) =====

  test("E2E-A02-02-015 異常リクエスト(該当なし)時のHTTPステータスが404である", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, NONE_CARD_ID), { headers: buildAuthzHeaders() });
    expect404(res.status());
    await ctx.dispose();
  });

  test("E2E-A02-02-016 異常系受信時の応答(404・Not Found)が処理結果と一致する", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(buildPopupCardPath(LANG_JP, NONE_CARD_ID), { headers: buildAuthzHeaders() });
    expect404(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(JSON.stringify(body), "本文に Not Found を含む").toContain("Not Found");
    await ctx.dispose();
  });

  test("E2E-A02-02-017 異常応答時も参照のみで状態不整合・二重処理が起きない", async () => {
    test.skip(!HAS_API, "E2E_API_READY 未設定");
    const ctx = await newCtx();
    const path = buildPopupCardPath(LANG_JP, NONE_CARD_ID);
    const res1 = await ctx.get(path, { headers: buildAuthzHeaders() });
    const res2 = await ctx.get(path, { headers: buildAuthzHeaders() });
    // 参照のみ＝繰返しても同一の異常応答（副作用・二重処理なし）。
    expect(res1.status(), "繰返しでも同一ステータス").toBe(res2.status());
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表4） =====

  test.fixme(
    "E2E-A02-02-007 foil_flg指定でフォイル区分の並び順が反映される（要実機確認: foil_flg反映／付帯表4#3）",
    async () => {
      // 期待は設計(真値降順/偽値昇順で先頭1件)由来。実装はメソッド引数に foil_flg を取らず並び固定の可能性＝要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-02-010 該当なし時に404・本文が {code, message}(Not Found) である（要実機確認: 失敗本文キー／付帯表4#4）",
    async () => {
      // 期待は設計の {code, message} 由来。実装は {code, errors} で本文キーが異なる＝要実機確認(404は一致見込み)。
    }
  );

  test.fixme(
    "E2E-A02-02-011 非整数・0以下のcardIdでは成功応答にならない（要実機確認: 異常cardId時の返却ステータス／付帯表4#11）",
    async () => {
      // 期待は「成功応答(200・商品情報)にならない」に一般化。正典は異常cardId時のステータスを定義せず要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-02-013 必須パスパラメータ欠落で成功応答にならない（要実機確認: 欠落時の返却ステータス／付帯表4#12）",
    async () => {
      // 期待は「成功応答(200・商品情報)にならない」に一般化。正典は欠落時のステータスを定義せず要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-02-014 想定外のlang値でも未定義500で停止しない（要実機確認: 200/404の確定・言語フォールバック／付帯表4#2）",
    async () => {
      // 期待は「未定義500で停止しない」。jp/en以外のlangで200か404かは正典未定義＝言語フォールバック挙動が要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-02-018 設計定義の404以外の未定義エラー(500)で停止しない（要実機確認: 500応答書式・誘発条件／付帯表4#7）",
    async () => {
      // 正典のエラー定義は該当なし404のみ。仕様に無い処理途中エラー(catch 500経路)は誘発契機が無く要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-02-050 lang=enで英語優先の商品情報が返る（要実機確認: 言語コード対応／付帯表4#2）",
    async () => {
      // 期待は設計(en=英語優先・code=英語)由来。実装は match で ja のみ JP・他は EN フォールバックの可能性＝要実機確認。
    }
  );

  test.fixme(
    "E2E-A02-02-053 price指定で販売価格の並び順が反映される（要実機確認: price反映／付帯表4#3）",
    async () => {
      // 期待は設計(high降順/その他昇順/未指定なしで先頭1件)由来。実装は price を引数に取らず並び固定の可能性＝要実機確認。
    }
  );
});
