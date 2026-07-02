/**
 * a06-03 店頭仕入_店頭買取注文更新（買取アプリ=MTGバイヤー向けに店頭買取受注の詳細をPUT更新するJSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a06_03_api_store_purchase_otc_buy_order_update_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。本機能の 付帯表1 に「E2E自動化（要実機確認）」修飾の行は無く（020-023 の要実機確認は根拠列のHS256署名方式の注記で、E2E可否＝E2E自動化）、test.fixme は無い。
 * 手動（009 想定外項目仕様未定義・060 並行送信・061 タイムアウト・126 成立/キャンセル日時・130 確認済みフラグ・150 保存例外）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（自動化(UI)0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・DTO制約を期待値に流用しない。
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/otcBuyOrder/{id}.json`（付帯表1/付帯表4#1。正本md `PUT /admin/otcBuyOrder/{id}.json` は `/api/v1` を欠き不一致）。
 *  - 認証は firewall app（access_token・JwtTokenHandler／JwtTokenHeaderExtractor＝security.yaml:33-39）。ヘッダ名 `jwt-token`。欠落/該当会員なし/署名不正＝401。
 *  - 合否（成功）は HTTP200＋応答 `{code:200}`、（失敗）は 400＋`{code,errors}`、対象なしは 404 を仕様由来で判定する。
 *    検証失敗のHTTPステータスは正本mdの 400 を期待する。実装は `#[MapRequestPayload]` 既定で 422 を返す可能性（付帯表4#2）→ 仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *    検証メッセージは正本md文言を期待（末尾句点・マスタ非存在文言は実装と乖離＝付帯表4#4/#5/#6）。errors 要素形は実装依存のため本文全体を文字列化して文言の存在で照合する。
 *  - 本APIはブラウザ向け画面を持たないため、更新副作用は永続化先テーブル（dtb_otc_buy_order 等）を直接DB照合（DB副作用観測）して判定する想定。本specは一次オラクルとしてAPI応答を確認し、DB副作用は「DB照査で補完」（本リポでDBは実行しない）。
 *  - 有効JWT原値・SEED ID は env で供給し原値はコミットしない。正本md未記載項目 smaregi_transaction_id（付帯表4#7）は送信・期待に含めない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_03_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildUpdatePath,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_NO_MEMBER,
  JWT_BAD_SIGNATURE,
  ORDER_ID,
  STATUS,
  NAME_MAX_LENGTH,
  NAME_OVER_MAX_LENGTH,
  SPEC_MESSAGE,
  statusNotInMasterMessage,
  buildValidPayload,
  buildMissingStatusPayload,
  buildUnknownStatusPayload,
  buildEmptyDetailsPayload,
  buildMissingNamePayload,
  buildNamedLengthPayload,
  buildNonIntegerDetailPayload,
  buildMultipleErrorsPayload,
  buildInvalidPayload,
  buildOptionalOmittedPayload,
  buildNonRoundedTotalPayload,
  buildReplacedDetailsPayload,
  buildDuplicateProductClassPayload,
  buildIndividualInputPayload,
  buildNonexistentSectionPayload,
} from "../../../pages/api/a06/a06_03_api_store_purchase_otc_buy_order_update.api";

const HAS_API = !!process.env.A06_03_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常更新＝200（正本md: レスポンス成功 {code:200}）").toBe(200);
}
function expect400(status: number) {
  // 正本md: 入力不正＝400。実装は #[MapRequestPayload] 既定で 422 を返す可能性（付帯表4#2）。仕様の400で判定し違えば落として検出する。
  expect(status, "入力不正＝400（正本md: レスポンス失敗。実装422の可能性は付帯表4#2）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可／UnauthenticatedException）").toBe(401);
}
function expect404(status: number) {
  expect(status, "対象受注なし＝404（正本md: NotFoundException）").toBe(404);
}
function expectClientError(status: number) {
  // 異常リクエストは成功扱いされない（4xx）。検証ステータスの 400/422 差異（付帯表4#2）を範囲で吸収する。
  expect(status, "異常＝4xx（更新が行われない）").toBeGreaterThanOrEqual(400);
  expect(status, "異常＝4xx").toBeLessThan(500);
}
async function expectCode200Body(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "成功本文は code:200（camelCase の code フィールド）").toBe(200);
}
async function expectErrorsContain(res: { json: () => Promise<unknown> }, message: string, why: string) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "errors"), "失敗本文に errors を含む（正本md {code,errors}）").toBeTruthy();
  // errors 要素形（文字列/オブジェクト）は実装依存のため本文全体を文字列化して正本md文言の存在で照合する。
  expect(JSON.stringify(body), why).toContain(message);
}

test.describe("API > 店頭仕入_店頭買取注文更新", { tag: ["@api", "@a06"] }, () => {
  // ===== 正常更新（IT-09 / IT-10 / IT-32） =====

  test("E2E-A06-03-001 正常パラメータでPUTし200が返る", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-JWT-ADMIN/ORDER/STATUS-MTB/SECTION) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-03-002 更新実行後の処理結果が一致する", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectCode200Body(res); // 処理結果（成功）が応答 {code:200} と一致。更新内容のDB反映はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-003 成功時のHTTPステータスが200である", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-03-004 成功レスポンス本文がcode=200を含む", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectCode200Body(res);
    await ctx.dispose();
  });

  test("E2E-A06-03-005 正常通信で200が返る", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // PUT通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A06-03-006 対象条件に該当する正常値で200が返る", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-03-007 成功レスポンス書式がcode:200と一致する", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectCode200Body(res); // 正本md: 成功書式は {code:200}（code フィールドのみ・camelCase）。
    await ctx.dispose();
  });

  test("E2E-A06-03-008 入力検証を満たすリクエストで更新成功200となる", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-SECTION) 未設定");
    const ctx = await newCtx();
    // 受注全体・明細各件の入力検証を満たす正常リクエスト。
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-10。HS256署名検証の実方式は要実機確認＝env供給トークンで判定） =====

  test("E2E-A06-03-020 有効なJWTで更新が成功する", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-JWT-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // 資格情報が有効＝200。
    await ctx.dispose();
  });

  test("E2E-A06-03-021 jwt-tokenヘッダ欠落で401となり更新されない", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildNoAuthHeaders(), data: buildValidPayload() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401（UnauthenticatedException）。受注が更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-022 該当する管理者会員が無いJWTで401となる", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-JWT-NO-MEMBER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(JWT_NO_MEMBER), data: buildValidPayload() });
    expect401(res.status()); // 利用者IDから管理者会員を特定できず401。更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-023 署名不正のJWTで401となり更新されない", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-JWT-BAD-SIGNATURE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidPayload() });
    expect401(res.status()); // 署名検証失敗＝401。HS256署名検証の実方式は要実機確認だが結果（401・非更新）で判定。
    await ctx.dispose();
  });

  // ===== データなし（IT-32） =====

  test("E2E-A06-03-030 存在しない受注IDで404となり更新されない", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.NONEXISTENT), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect404(res.status()); // 該当受注なし＝404（NotFoundException）。明細・在庫・受注の非更新はDB照査で補完。
    await ctx.dispose();
  });

  // ===== バリデーション・エラー本文（IT-10 / IT-32） =====

  test("E2E-A06-03-040 order_status未指定で400となりerrorsを含む", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildMissingStatusPayload() });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.STATUS_REQUIRED, "errors にステータス必須メッセージを含む（正本md文言・付帯表4#4）");
    await ctx.dispose();
  });

  test("E2E-A06-03-041 複数の検証エラーをerrors配列に全件まとめて返す", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildMultipleErrorsPayload() });
    expect400(res.status());
    // 受注全体（ステータス未指定）と明細各件（数量/単価/販売価格の整数形式）の全検証メッセージが errors にまとまる。
    await expectErrorsContain(res, SPEC_MESSAGE.STATUS_REQUIRED, "errors にステータス必須を含む");
    await expectErrorsContain(res, SPEC_MESSAGE.INTEGER_QUANTITY, "errors に数量の整数形式メッセージを含む");
    await ctx.dispose();
  });

  test("E2E-A06-03-042 ステータスマスタ照合エラーを含む検証結果をerrorsで返す", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-STATUS-MTB) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status());
    // マスタ非存在ステータスの DB照合エラーが errors に返る（正本md文言。実装は Choice の別文言＝付帯表4#5）。
    await expectErrorsContain(res, statusNotInMasterMessage(), "errors にステータスマスタ非存在メッセージを含む（正本md文言・付帯表4#5）");
    await ctx.dispose();
  });

  test("E2E-A06-03-043 異常リクエストで4xxとなり更新されない", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidPayload() });
    expectClientError(res.status()); // 削除・登録・保存が行われず受注が更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-044 入力不正時のHTTPステータスが400である", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildMissingStatusPayload() });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A06-03-045 order_details未指定で400となり必須メッセージを返す", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildEmptyDetailsPayload() });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.DETAILS_REQUIRED, "errors に明細必須メッセージを含む（正本md文言・付帯表4#4）");
    await ctx.dispose();
  });

  test("E2E-A06-03-046 整数でない明細項目を含むと400となる", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("quantity") });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.INTEGER_QUANTITY, "errors に該当項目の整数形式メッセージを含む");
    await ctx.dispose();
  });

  // ===== 区分整合・部分更新なし（IT-33。一次オラクル＝API応答＋DB副作用照合） =====

  test("E2E-A06-03-050 更新後に更新対象外の他受注・区分の在庫数量と金額が不変", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-ORDER 別受注/SECTION/M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: 別受注・対象外区分の在庫数量・買取合計金額が更新前と一致（不変）。DB副作用照合で判定＝DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-051 検証エラー時に明細・在庫・金額・履歴が部分更新されない", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildInvalidPayload() });
    expectClientError(res.status());
    // 一次オラクル: 検証エラー時は削除・登録・保存が行われず、明細・在庫・買取合計金額・ステータス変更履歴が受信前と一致。DB照査で補完。
    await ctx.dispose();
  });

  // ===== 入力検証（IT-22・設計書補完。検証失敗時の400は付帯表4#2／文言は付帯表4#4-6で乖離記録） =====

  test("E2E-A06-03-100 order_status未指定でステータス必須メッセージを返す", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildMissingStatusPayload() });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.STATUS_REQUIRED, "errors に「ステータスを選択してください。」を含む（実装は句点なし＝付帯表4#4）");
    await ctx.dispose();
  });

  test("E2E-A06-03-101 マスタに無いステータスIDでマスタ非存在メッセージを返す", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-STATUS-MTB) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status());
    // 実装は {成立,キャンセル} の Choice で `order_status is invalid` を返す（付帯表4#3/#5）。テストは正本md文言で照合し違えば落として検出する。
    await expectErrorsContain(res, statusNotInMasterMessage(), "errors に「MtbOtcBuyOrderStatusに{指定ID}が見つかりません。」を含む（付帯表4#5）");
    await ctx.dispose();
  });

  test("E2E-A06-03-102 order_details空で明細必須メッセージを返す", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildEmptyDetailsPayload() });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.DETAILS_REQUIRED, "errors に「1つ以上の商品を選んでください。」を含む（実装は句点なし＝付帯表4#4）");
    await ctx.dispose();
  });

  test("E2E-A06-03-103 明細の商品名未入力で商品名必須エラーとなる", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildMissingNamePayload() });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.NAME_REQUIRED_STABLE, "errors に商品名必須の検証メッセージを含む");
    await ctx.dispose();
  });

  test("E2E-A06-03-104 商品名が最大長(65535文字)では更新が成功する", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNamedLengthPayload(NAME_MAX_LENGTH) });
    expect200(res.status()); // 境界内（65535）はエラーとならず更新成功200。
    await ctx.dispose();
  });

  test("E2E-A06-03-105 商品名が最大長+1(65536文字)で最大長超過エラーとなる", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNamedLengthPayload(NAME_OVER_MAX_LENGTH) });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.NAME_MAX_LENGTH, "errors に「商品名は、 65535 以下で入力してください。」を含む（実装は別表記＝付帯表4#6）");
    await ctx.dispose();
  });

  test("E2E-A06-03-106 product_class_idが整数でない場合に整数形式エラーとなる", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("productClassId") });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.INTEGER_PRODUCT_CLASS_ID, "errors に「商品規格IDは、整数で入力してください。」を含む");
    await ctx.dispose();
  });

  test("E2E-A06-03-107 quantityが整数でない場合に整数形式エラーとなる", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("quantity") });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.INTEGER_QUANTITY, "errors に「数量は、整数で入力してください。」を含む");
    await ctx.dispose();
  });

  test("E2E-A06-03-108 priceが整数でない場合に整数形式エラーとなる", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("price") });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.INTEGER_PRICE, "errors に「単価は、整数で入力してください。」を含む");
    await ctx.dispose();
  });

  test("E2E-A06-03-109 sell_priceが整数でない場合に整数形式エラーとなる", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("sellPrice") });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.INTEGER_SELL_PRICE, "errors に「販売価格は、整数で入力してください。」を含む");
    await ctx.dispose();
  });

  test("E2E-A06-03-110 section_idが整数でない場合に整数形式エラーとなる", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-SECTION) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("sectionId") });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.INTEGER_SECTION_ID, "errors に「部門IDは、整数で入力してください。」を含む");
    await ctx.dispose();
  });

  test("E2E-A06-03-111 任意項目を未指定にしても更新が成功する", async () => {
    test.skip(!HAS_API, "A06_03_READY 未設定");
    const ctx = await newCtx();
    // 任意項目（数量・単価・販売価格・部門ID・確認済みフラグ）を未指定にしても検証エラーにならない（代表＝全任意同時未指定。付帯表5・要確認）。
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildOptionalOmittedPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== DB更新副作用（IT-26・設計書補完。一次オラクル＝DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A06-03-120 更新後に店頭買取受注のステータスが指定値へ更新される", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.COMPLETE }) });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order のステータスが指定値（成立1）へ更新。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-121 買取合計金額が明細から10円単位切り上げした額で更新される", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNonRoundedTotalPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order 買取合計金額＝単価×数量総和(333)を10円単位へ切上げ(340)。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-122 明細が送信内容で全置換され送信外の旧明細が残らない", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-ORDER 既存明細/M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildReplacedDetailsPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_detail が既存削除＋送信明細で全置換され旧明細が残らない。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-123 商品規格ごとに集計した数量で在庫が作り直される", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-SECTION/M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildDuplicateProductClassPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_stock が商品規格別集計数量(2+3=5)で作り直し（個別入力商品は集計外）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-124 在庫登録時に在庫履歴が1件追加される", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-SECTION/M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildDuplicateProductClassPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_stock_history に更新後数量・登録者・登録日時の履歴が1件追加。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-125 商品規格IDなしの明細が個別入力商品として登録される", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildIndividualInputPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_indivisual_input_product に個別入力商品として登録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-127 更新前後でステータスが異なる場合に変更履歴が1件登録される", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-ORDER 更新前ステータス既知/M01-ADMIN) 未設定");
    const ctx = await newCtx();
    // 更新前と異なるステータス（キャンセル2）を指定。
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.CANCEL }) });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_status_history に受注ID・更新後ステータス・更新担当者・登録日時の履歴が1件登録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-128 更新前後で同一ステータスでは変更履歴を登録せず明細は作り直す", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-ORDER 更新前ステータス既知/M01-ADMIN) 未設定");
    const ctx = await newCtx();
    // 更新前と同一のステータスを指定（SEED の更新前ステータスに合わせる想定＝要実機: 環境の既知値へ）。
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.COMPLETE }) });
    expect200(res.status());
    // 一次オラクル: ステータス変更履歴は登録されず、明細・在庫の作り直しと受注更新は実施。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-129 査定担当者に認証した管理者会員が記録される", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-JWT-ADMIN/M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order の査定担当者＝jwt-token から特定した認証管理者会員。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A06-03-131 該当部門が存在しないsection_idでは明細に部門が設定されない", async () => {
    test.skip(!HAS_API, "A06_03_READY(SEED-A06-03-SECTION/M01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildUpdatePath(ORDER_ID.TARGET), { headers: buildJwtHeaders(), data: buildNonexistentSectionPayload() });
    expect200(res.status()); // 該当部門なしでも更新自体は成功。
    // 一次オラクル: 明細・個別入力商品の部門が設定されない（処理フロー#5 非存在側分岐）。DB照査で補完。
    await ctx.dispose();
  });
});
