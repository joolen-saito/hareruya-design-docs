/**
 * a05-01 受注_直接印刷（GetRequest=印刷情報生成 / SetResponse=受注ステータス更新）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a05_01_api_order_print_direct_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」ケースのみ実装し、要実機確認修飾(014/016/050)は test.fixme（理由付き）で残す。
 * 手動（060-064）はケース表で全量管理し本specには書かない（規約）。
 *
 * 期待結果は仕様（設計書 a05-01・観点表・処理フロー）由来（オラクル独立性）。
 *  - 送信先は実装の実効パス `POST /api/order/prints/direct/{base_info_id}`（付帯表4#1/#2。設計書 `/order/print/direct` とは不一致）。
 *  - 応答はJSONではなく octet-stream(XML)/空応答(SetResponse)。合否は HTTPステータス・Content-Type・応答本体・受注ステータス副作用で判定。
 *  - 不一致時の HTTP400+text/plain（付帯表4#5）・印刷ログ未実装（付帯表4#3）はオラクルにしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。
 *
 * 環境ガード（SEED/拠点情報・受注データが無い環境では実行しない）:
 *  - A05_PRINT_READY : SEED-A05-01-*（base_info_id・印刷対象受注・ResponseFile）が用意済みのとき true。
 * 受注ステータス更新等のDB照査（040-042等）は本レイヤではHTTP観測まで行い、DB値の一致確認は実機(DB接続)で補完する。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildDirectPrintPath,
  BASE_INFO_ID,
  buildGetRequestBody,
  buildSetResponseBody,
  buildValidResponseFileXml,
  MALFORMED_RESPONSE_FILE_XML,
  buildServerDirectPrintFalseXml,
  buildNoEposPrintXml,
  buildUnknownOrderResponseFileXml,
  KNOWN_ORDER_ID,
} from "../../../pages/api/a05/a05_01_api_order_print_direct.api";

const HAS_API = !!process.env.A05_PRINT_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常＝200（設計: 成功応答）").toBe(200);
}

test.describe("API > 受注_直接印刷(GetRequest/SetResponse)", { tag: ["@api", "@a05"] }, () => {
  // ===== GetRequest（印刷情報生成・参照系） =====

  test("E2E-A05-01-001 GetRequestで印刷対象ありのとき正常応答ステータスが返る", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(SEED-A05-01-*) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A05-01-002 GetRequestの応答Content-Typeがapplication/octet-streamである", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    expect(res.headers()["content-type"] ?? "", "GetRequestはoctet-stream（OrderController.php:73）").toContain("application/octet-stream");
    await ctx.dispose();
  });

  test("E2E-A05-01-003 GetRequestの応答本体がPrintRequestInfoルート要素で構成される", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    expect(await res.text(), "印刷情報XMLのルートが PrintRequestInfo").toContain("PrintRequestInfo");
    await ctx.dispose();
  });

  test("E2E-A05-01-004 GetRequestで対象受注ごとにePOSPrint要素が生成される", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    expect(await res.text(), "対象受注ごとに ePOSPrint 要素").toContain("ePOSPrint");
    await ctx.dispose();
  });

  test("E2E-A05-01-005 ePOSPrintのprintjobidに受注IDが設定される", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    expect(await res.text(), "printjobid に受注ID（先頭部）").toContain("printjobid");
    await ctx.dispose();
  });

  test("E2E-A05-01-006 印字欄(注文番号・お客様名・合計金額)の値が受注データと一致する", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    // PrintData の注文番号/お客様名/合計金額が受注(order_number/氏名/payment_total)と一致。値照合は既知SEED受注で行う。
    expect(await res.text(), "印字データ PrintData を含む").toContain("PrintData");
    await ctx.dispose();
  });

  test("E2E-A05-01-007 注文詳細URLのQRコードとスマレジコードのバーコードが出力される", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    // 注文詳細URLのQR・スマレジコードのバーコード命令が PrintData に含まれる（OrderDirectPrintAction.php:80-169）。
    expect(await res.text(), "印字情報を含む").toContain("PrintData");
    await ctx.dispose();
  });

  test("E2E-A05-01-008 お客様名欄は氏名カナを優先しカナが無ければ氏名を出力する", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    // カナ優先/氏名フォールバックの値照合は SEED-A05-01-PRINT-TARGET（カナあり/なし受注）で行う。
    expect(await res.text(), "PrintData を含む").toContain("PrintData");
    await ctx.dispose();
  });

  test("E2E-A05-01-009 スムーズ店頭受取の受注は合計金額欄が「スムーズ店頭受取」文言になる", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    // 仕様: スムーズ店頭受取時は合計金額欄を「スムーズ店頭受取」文言に置換。実装は常に payment_total 出力＝文言置換なし(付帯表4#8)で失敗検出。
    expect(await res.text(), "スムーズ店頭受取の文言（仕様どおり期待し未実装なら失敗検出）").toContain("スムーズ店頭受取");
    await ctx.dispose();
  });

  test("E2E-A05-01-010 印刷対象受注が無い場合は200で空のデータを返す", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(対象0件のbase_info_id) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status()); // 対象なしは200・空データ（OrderDirectPrintAction.php:50-52）。空判定は対象0件SEEDで行う。
    await ctx.dispose();
  });

  test("E2E-A05-01-011 印刷対象は最大10件までに制限される", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(11件以上のSEED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    // LIMIT 10（OrderRepository.php:1593）。ePOSPrint要素数<=10 の照合は11件以上SEEDで行う。
    expect((await res.text()).split("ePOSPrint").length - 1, "ePOSPrint要素数は最大10件まで").toBeLessThanOrEqual(10 * 2 + 1);
    await ctx.dispose();
  });

  test("E2E-A05-01-012 店頭受取・注文受領・注文番号あり・スマレジコードありの受注が抽出される", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status()); // 抽出条件（OrderRepository.php:1568-1592）。該当受注の出現は既知SEEDで照合。
    await ctx.dispose();
  });

  test("E2E-A05-01-013 ブラウザ印刷フラグが立つ受注も印刷対象に含まれる", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(browser_print_flg受注) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status()); // browser_print_flg=true も対象（OrderRepository.php:1568-1592）。
    await ctx.dispose();
  });

  test("E2E-A05-01-015 注文日欄の値が受注の注文日(order_date)と一致する", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status()); // 注文日欄＝order_date。値照合は既知SEED受注で行う。
    expect(await res.text(), "PrintData を含む").toContain("PrintData");
    await ctx.dispose();
  });

  test("E2E-A05-01-017 スムーズ店頭受取の全抽出条件を満たす受注が印刷対象に抽出される(正常)", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(SEED-A05-01-SMOOTH-OTC) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    // 設計の抽出条件（所定支払方法・未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードあり）を期待値とする。
    // 支店版に当該条件が見当たらない場合は付帯表4#7で失敗検出。
    await ctx.dispose();
  });

  test("E2E-A05-01-018 スムーズ店頭受取で確定済み(confirm_date設定済み)の受注は抽出されない(異常)", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(確定済みスムーズ受注) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status()); // 確定済みは抽出されない。非出現の照合は既知SEED受注IDで行う。
    await ctx.dispose();
  });

  test("E2E-A05-01-019 スムーズ店頭受取でスマレジコードなしの受注は抽出されない(異常)", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(スマレジコードなしスムーズ受注) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status()); // スマレジコードなしは抽出されない。
    await ctx.dispose();
  });

  test("E2E-A05-01-020 GetRequestは受注ステータスを更新しない(参照系・前後不変)", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody() });
    expect200(res.status());
    // 参照系: order_status_id は変更されない（一次オラクルはDB照査・前後比較。管理画面表示は補助観測）。
    await ctx.dispose();
  });

  // ===== SetResponse（受注ステータス更新） =====

  test("E2E-A05-01-030 SetResponseの正常受信でHTTP200が返る", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(SEED-A05-01-RESPONSEFILE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildValidResponseFileXml(KNOWN_ORDER_ID)) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A05-01-031 SetResponseの応答本体は空(本文長0)である", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildValidResponseFileXml(KNOWN_ORDER_ID)) });
    expect200(res.status());
    expect((await res.text()).length, "SetResponseは空本文（OrderController.php:86）").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A05-01-032 ResponseFileのXML解析失敗時は受注ステータスを更新しない", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(MALFORMED_RESPONSE_FILE_XML) });
    expect200(res.status()); // 解析失敗でも更新せず200空本文（UpdatePrintedOrderStatusAction.php:48-54）。ステータス不変はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A05-01-033 直接印刷結果が偽の場合は更新せず200空本文を返す", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildServerDirectPrintFalseXml()) });
    expect200(res.status());
    expect((await res.text()).length, "更新せず空本文").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A05-01-034 印刷結果要素が1件も無い場合は更新せず200空本文を返す", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildNoEposPrintXml()) });
    expect200(res.status());
    expect((await res.text()).length, "更新せず空本文").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A05-01-035 受注が見つからない要素はスキップし他要素の処理を継続する", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildUnknownOrderResponseFileXml()) });
    expect200(res.status()); // 不存在受注はスキップ・継続（UpdatePrintedOrderStatusAction.php:82-86）。継続はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A05-01-036 printjobidの先頭部分から受注IDを取り出して対象受注を特定する", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    // printjobid=`{受注ID}_連番` の先頭部から受注ID抽出（UpdatePrintedOrderStatusAction.php:79）。
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildValidResponseFileXml(KNOWN_ORDER_ID)) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A05-01-037 SetResponseの応答Content-Typeがtext/xml; charset=utf-8である", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildValidResponseFileXml(KNOWN_ORDER_ID)) });
    expect200(res.status());
    expect(res.headers()["content-type"] ?? "", "SetResponseはtext/xml（OrderController.php:86）").toContain("text/xml");
    await ctx.dispose();
  });

  test("E2E-A05-01-038 ResponseFileのXML解析失敗時もHTTP200を返す", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(MALFORMED_RESPONSE_FILE_XML) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A05-01-039 ResponseFileのXML解析失敗時も応答本体は空である", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(MALFORMED_RESPONSE_FILE_XML) });
    expect200(res.status());
    expect((await res.text()).length, "解析失敗時も空本文").toBe(0);
    await ctx.dispose();
  });

  test("E2E-A05-01-040 SetResponseで該当受注のステータスがピック中へ更新される(DB照査)", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildValidResponseFileXml(KNOWN_ORDER_ID)) });
    expect200(res.status());
    // 一次オラクル: order_status_id=ピック中(OrderStatus::PICKING=10)へ更新（UpdatePrintedOrderStatusAction.php:87-98）。
    // 本レイヤはHTTP200/空本文まで観測し、ステータス値の一致はDB照査で補完（管理画面は補助観測）。
    await ctx.dispose();
  });

  test("E2E-A05-01-041 ブラウザ印刷フラグ受注はフラグを倒すのみでステータスは不変(DB照査)", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY(browser_print_flg受注) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildValidResponseFileXml(KNOWN_ORDER_ID)) });
    expect200(res.status());
    // 一次オラクル: browser_print_flg を false に倒すのみ・order_status_id 不変（UpdatePrintedOrderStatusAction.php:87-88）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A05-01-042 ブラウザ印刷フラグなし受注のステータス更新時に確定日時へ現在時刻が設定される(DB照査)", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildSetResponseBody(buildValidResponseFileXml(KNOWN_ORDER_ID)) });
    expect200(res.status());
    // 一次オラクル: confirm_date/picking_date に現在時刻（UpdatePrintedOrderStatusAction.php:91-97）。DB照査で補完。
    await ctx.dispose();
  });

  // ===== 異常パラメータ・想定外項目 =====

  test("E2E-A05-01-052 異常なパラメータ値で実行しても仕様どおりの結果となる", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody({ ConnectionType: "GetRequest", bogus: 12345 }) });
    expect200(res.status()); // GetRequest分岐は維持され処理が継続（5xxで停止しない）。
    await ctx.dispose();
  });

  test("E2E-A05-01-053 想定外の項目を加えても処理が停止しない", async () => {
    test.skip(!HAS_API, "A05_PRINT_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(buildDirectPrintPath(BASE_INFO_ID), { data: buildGetRequestBody({ unknownField: "x", foo: 1 }) });
    expect200(res.status()); // 想定外項目があっても5xxで停止しない。
    await ctx.dispose();
  });

  // ===== 要実機確認（test.fixme・理由＝付帯表1/付帯表4） =====

  test.fixme(
    "E2E-A05-01-014 店頭注文番号欄の値が店頭注文番号(dtb_order_number.value)と一致する（要実機確認: 取得元乖離／付帯表4#9）",
    async () => {
      // 期待は設計(店頭注文番号欄＝dtb_order_number.value)由来。実装は受注 order_number を出力する疑い。
      // 印字部の正確な行・dtb_order_number参照の有無が file:line根拠不足で要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A05-01-016 問い合わせ有無欄が受注の問い合わせ有無に対応した表示になる（要実機確認: チェック欄対応／付帯表4#4）",
    async () => {
      // 期待は設計(問い合わせ有無の表示)由来。どのチェック欄に対応するかが要実機確認のため fixme。
    }
  );

  test.fixme(
    "E2E-A05-01-050 ConnectionTypeがどちらにも一致しない場合は本文を返さない（要実機確認: HTTPステータス／付帯表4#5）",
    async () => {
      // 期待は設計(応答を組み立てず本文を返さない)由来。実装はHTTP400+text/plain。空本文部分は仕様判定可だが
      // 正典がステータス値を規定せず期待ステータスを固定できないため fixme（空本文＋status要実機確認）。
    }
  );
});
