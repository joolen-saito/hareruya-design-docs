/**
 * a05-02 受注_直接印刷（GetRequest/SetResponse の異常系・境界・認証）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a05_02_api_order_print_direct_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装し、要実機確認修飾(004/005/040/041)は test.fixme（理由付き）で残す。
 * 「E2E自動化(UI)」(050-053)は admin spec（spec/admin/a05/a05_02_api_order_print_direct.spec.ts）に実装。
 * 手動（060-063/070-072）はケース表で全量管理し本specには書かない（規約）。
 *
 * 期待結果は仕様（設計書 a05-02・処理フロー）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `POST /api/order/prints/direct/{base_info_id}`（付帯表4#1）。007のみ設計パスへGET送信しメソッド乖離(付帯表4#2)を検出。
 *  - 合否は HTTPステータス・Content-Type・応答本体(空)・副作用で判定。不一致時のHTTP400+text/plain(付帯表4#3)・印刷ログ未実装(付帯表4#4)はオラクルにしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A05_PRINT_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildDirectPrintPath,
  DESIGN_ORDER_DIRECT_PRINT_PATH,
  BASE_INFO_ID,
  buildGetRequestBody,
  buildSetResponseBody,
  buildUnknownConnectionTypeBody,
  buildValidResponseFileXml,
  MALFORMED_RESPONSE_FILE_XML,
  buildServerDirectPrintFalseXml,
  buildNoEposPrintXml,
  buildUnknownOrderResponseFileXml,
  buildMixedOrderResponseFileXml,
  TARGET_ORDER_ID,
} from "../../../pages/api/a05/a05_02_api_order_print_direct.api";

const HAS_API = !!process.env.A05_PRINT_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常＝200（設計: 成功応答）").toBe(200);
}

test.describe("API > 受注_直接印刷(異常系・境界・認証)", { tag: ["@api", "@a05"] }, () => {
  // ===== GetRequest 系 =====

  test("E2E-A05-02-001 GetRequestの正常受信で印刷情報XML本体が返る", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(SEED-A05-02-ORDER-PRINTABLE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    expect(await res.text(), "印刷情報XML本体（PrintRequestInfo）").toContain("PrintRequestInfo");
    await ctx.dispose();
  });

  test("E2E-A05-02-002 GetRequestで印刷対象が無い場合は空のデータを返す", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(対象0件SEED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status()); // 対象なしは200・空データ（OrderDirectPrintAction.php:50-52）。
    await ctx.dispose();
  });

  test("E2E-A05-02-003 GetRequest応答のContent-Typeがapplication/octet-streamである", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    expect(res.headers()["content-type"] ?? "", "octet-stream（OrderController.php:73）").toContain("application/octet-stream");
    await ctx.dispose();
  });

  test("E2E-A05-02-006 印刷対象受注の抽出が最大10件で打ち切られる", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(11件以上SEED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    expect((await res.text()).split("ePOSPrint").length - 1, "ePOSPrint要素数は最大10件まで").toBeLessThanOrEqual(10 * 2 + 1);
    await ctx.dispose();
  });

  test("E2E-A05-02-007 GETメソッドのGetRequest受理可否（設計はGET・POST双方／メソッド乖離検出）", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    // 設計は GetRequest を GET でも受け付ける（付帯表4#2）。実装は methods:['POST'] のみで GET 未対応＝405/404 で乖離検出。
    const res = await ctx.get(`${DESIGN_ORDER_DIRECT_PRINT_PATH}?ConnectionType=GetRequest`);
    expect(res.status(), "設計はGETで取得可（実装はPOST限定で405/404＝乖離検出・付帯表4#2）").toBe(200);
    await ctx.dispose();
  });

  // ===== SetResponse 系 =====

  test("E2E-A05-02-010 SetResponseの正常受信で空本文とtext/xmlが返る", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(SEED-A05-02-RESPONSEFILE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildValidResponseFileXml(TARGET_ORDER_ID)) });
    expect200(res.status());
    expect((await res.text()).length, "空本文（OrderController.php:86）").toBe(0);
    expect(res.headers()["content-type"] ?? "", "text/xml; charset=utf-8").toContain("text/xml");
    await ctx.dispose();
  });

  test("E2E-A05-02-020 ResponseFileの解析失敗時は更新せず空本文を返す", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(MALFORMED_RESPONSE_FILE_XML) });
    expect200(res.status());
    expect((await res.text()).length, "更新せず空本文（UpdatePrintedOrderStatusAction.php:48-54）").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A05-02-021 直接印刷結果が偽の場合は更新せず戻る", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildServerDirectPrintFalseXml()) });
    expect200(res.status());
    expect((await res.text()).length, "更新せず空本文").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A05-02-022 印刷結果要素が0件の場合は更新せず戻る", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildNoEposPrintXml()) });
    expect200(res.status());
    expect((await res.text()).length, "更新せず空本文").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A05-02-023 受注が見つからない印刷結果要素はスキップし応答は空本文", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildUnknownOrderResponseFileXml()) });
    expect200(res.status());
    expect((await res.text()).length, "スキップ・空本文（UpdatePrintedOrderStatusAction.php:81-86）").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A05-02-024 一部受注が見つからなくても存在する受注は更新が継続される", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildMixedOrderResponseFileXml()) });
    expect200(res.status()); // 不存在はスキップ・存在分は更新継続（一次オラクルはDB照査で補完）。
    await ctx.dispose();
  });

  test("E2E-A05-02-030 ConnectionTypeが想定値に一致しない場合は本文を返さない", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildUnknownConnectionTypeBody() });
    // 仕様: 分岐が発火せず更新が確定しない・本文を返さない。実装のHTTP400+text/plain(付帯表4#3)はステータス値を固定しない。
    expect((await res.text()).length, "本文を返さない（空本文を仕様判定）").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A05-02-031 ConnectionType未指定・想定外項目付与でも更新が確定しない", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: { foo: "x", bar: 1 } });
    expect((await res.text()).length, "ConnectionType未指定は分岐せず本文を返さない").toBe(0);
    // 更新が確定しないこと（副作用なし）はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A05-02-054 SetResponse更新後の再GetRequestで当該受注が抽出対象から外れる(DB更新の間接確認)", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(SEED-A05-02-ORDER-TARGET) 未設定");
    const ctx = await newCtx();
    // SetResponse でステータス更新（未確定→確定/ピック中）→ 再GetRequest抽出条件(未確定)から外れることを間接観測。
    const set = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildValidResponseFileXml(TARGET_ORDER_ID)) });
    expect200(set.status());
    const get = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(get.status());
    expect(await get.text(), "更新済み受注のprintjobidが再GetRequestに出現しない").not.toContain(`${TARGET_ORDER_ID}_`);
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A05-02-004 生成した印刷情報が空でない場合に印刷ログファイルが書き出される（要実機確認: 印刷ログ未実装／付帯表4#4）",
    async () => {
      // 期待は設計(空でなければ var/log/print_logs/ 配下へ書き出し)由来。実装は当該処理がコメントアウト(OrderController.php:57-67)で未実装。
      // ファイル生成の観測がサーバFS実機依存のため fixme（仕様どおり期待し未実装なら失敗検出）。
    }
  );

  test.fixme(
    "E2E-A05-02-005 GetRequestで対象が無い場合は印刷ログファイルを書き出さない（要実機確認: 印刷ログ未実装／付帯表4#4）",
    async () => {
      // 期待は設計(空なら書き出さない)由来。ログファイル非生成の観測がサーバFS実機依存のため fixme。
    }
  );

  test.fixme(
    "E2E-A05-02-040 認証なしでGetRequestを実行でき401を返さない（要実機確認: 認証・経路制御／付帯表4#7）",
    async () => {
      // 期待は設計(認証なしで実行可・401を返さない)由来。App配下ルートのfirewall/到達制御が要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A05-02-041 その他のクライアントも到達できればSetResponseを実行できる（要実機確認: 経路制御／付帯表4#7）",
    async () => {
      // 期待は設計(認証なしで実行可)由来。到達制御(経路/firewall)が要実機確認のため fixme。
    }
  );
});
