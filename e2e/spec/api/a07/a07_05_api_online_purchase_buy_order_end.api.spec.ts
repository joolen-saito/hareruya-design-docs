/**
 * a07-05 オンライン仕入_買取注文完了（買取アプリ=MTGバイヤーが、ネット買取受注の査定を終え明細とステータスを確定する更新系JSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a07_05_api_online_purchase_buy_order_end_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を `test(...)` で実装する。
 *  - 付帯表1で E2E可否＝「E2E自動化(API/統合)（要実機確認: JWT発行・会員紐づけ）」の認証行（010/011/012）は `test.fixme(...)`（要実機確認: JWT発行・会員紐づけの実方式が未確定のため）。
 *  - 副作用ケース（050-062・072）は E2E可否＝「E2E自動化(API/統合)（副作用＝DB観測）」のため `test(...)` でAPI応答を一次に確認し、DB反映は「DB照査で補完」（本リポでDBは実行しない）。
 *  - 手動（043 errors並び順未定義・070/071 更新例外500の実再現・080 想定外項目の扱い未定義・082 タイムアウト未定義）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない」）のためUI専用specは無い（付帯表2 自動化(UI) 0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・DTO制約を期待値に流用しない。
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/buyOrder/{id}.json`（付帯表1/付帯表4#1。正本md `PUT /admin/buyOrder/{id}.json` は `/api/v1` を欠き不一致）。
 *  - 認証は firewall（access_token・JwtTokenHandler／JwtTokenHeaderExtractor＝security.yaml:33-39・jwt.yaml:3,5）。ヘッダ名 `jwt-token`。欠落/署名不正/該当会員なし＝401。
 *  - 合否（成功）は HTTP200＋応答 `{code:200}`、（失敗）は 400＋`{code,errors}`、対象なしは 404 を仕様由来で判定する。
 *    検証失敗のHTTPステータスは正本mdの 400 を期待する。実装は `#[MapRequestPayload]` 既定で 422 を返す可能性（付帯表4#2）→ 仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *    検証メッセージは正本md文言を期待（末尾句点・マスタ非存在文言・name最大長は実装と乖離＝付帯表4#3/#4/#6）。errors 要素形は実装依存のため本文全体を文字列化して文言の存在で照合する。
 *  - 本APIはブラウザ向け画面を持たないため、更新副作用（受注・明細・合計額・担当者・更新日時・申込時買取価格・履歴）は永続化先テーブルを直接DB照合（DB副作用観測）して判定する想定。本specは一次オラクルとしてAPI応答を確認し、DB副作用は「DB照査で補完」。
 *  - 有効JWT原値・SEED ID は env で供給し原値はコミットしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_05_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildBuyOrderEndPath,
  buildJwtHeaders,
  buildNoAuthHeaders,
  JWT_NO_MEMBER,
  JWT_BAD_SIGNATURE,
  ORDER_ID,
  STATUS,
  NAME_OVER_MAX_LENGTH,
  SPEC_MESSAGE,
  statusNotInMasterMessage,
  buildValidPayload,
  buildMissingStatusPayload,
  buildUnknownStatusPayload,
  buildEmptyDetailsPayload,
  buildMissingNamePayload,
  buildNameLengthPayload,
  buildNonIntegerDetailPayload,
  buildMultipleErrorsPayload,
  buildIndividualInputNewPayload,
  buildIndividualInputExistingPayload,
  buildMainCardPayload,
  buildReplacedDetailsPayload,
  buildNonRoundedTotalPayload,
} from "../../../pages/api/a07/a07_05_api_online_purchase_buy_order_end.api";

const HAS_API = !!process.env.A07_05_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常な査定終了処理＝200（正本md: レスポンス成功 {code:200}）").toBe(200);
}
function expect400(status: number) {
  // 正本md: 入力不正＝400。実装は #[MapRequestPayload] 既定で 422 を返す可能性（付帯表4#2）。仕様の400で判定し違えば落として検出する。
  expect(status, "入力不正＝400（正本md: レスポンス失敗。実装422の可能性は付帯表4#2）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可／処理フロー#1）").toBe(401);
}
function expect404(status: number) {
  expect(status, "対象受注なし＝404（正本md: 処理フロー#2 受注取得）").toBe(404);
}
async function expectCode200Body(res: { json: () => Promise<unknown> }) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(body.code, "成功本文は code:200（integer型・値200）").toBe(200);
}
async function expectErrorsContain(res: { json: () => Promise<unknown> }, message: string, why: string) {
  const body = (await res.json()) as Record<string, unknown>;
  expect(Object.prototype.hasOwnProperty.call(body, "errors"), "失敗本文に errors を含む（正本md {code,errors}）").toBeTruthy();
  // errors 要素形（文字列/オブジェクト）は実装依存のため本文全体を文字列化して正本md文言の存在で照合する。
  expect(JSON.stringify(body), why).toContain(message);
}

test.describe("API > オンライン仕入_買取注文完了（査定終了処理）", { tag: ["@api", "@a07"] }, () => {
  // ===== 正常な査定終了処理（IT-09 / IT-10 / IT-32） =====

  test("E2E-A07-05-001 正常な明細・order_statusでPUTし200が返る", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-JWT-MEMBER/ORDER-OPEN/STATUS-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-002 成功レスポンス本文が{code:200}（integer型）と一致する", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await expectCode200Body(res); // 成功時の本文が {code:200}（code は integer・値200）。
    await ctx.dispose();
  });

  test("E2E-A07-05-003 正常処理で成功HTTPステータス200が返る", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-004 対象条件に該当する正常値で200が返る", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status()); // マスタ存在の order_status と整数項目を満たす明細で正常処理＝200。
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-09。JWT発行・会員紐づけの実方式は要実機確認＝付帯表1 010/011/012） =====

  test.fixme("E2E-A07-05-010 jwt-tokenヘッダ欠落で401となり更新されない", async () => {
    // 要実機確認（付帯表1 010）: JWT発行・会員紐づけの実方式が未確定。実機トークン整備後に test へ昇格する。
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildNoAuthHeaders(), data: buildValidPayload() });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401。受注が更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test.fixme("E2E-A07-05-011 署名不正のjwt-tokenで401となる", async () => {
    // 要実機確認（付帯表1 011）: HS256署名検証の実方式・会員紐づけが未確定。
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidPayload() });
    expect401(res.status()); // 署名検証失敗＝401。
    await ctx.dispose();
  });

  test.fixme("E2E-A07-05-012 該当する管理者会員が無いトークンで401となる", async () => {
    // 要実機確認（付帯表1 012）: 利用者IDから管理者会員を引く実方式が未確定（JWT発行・会員紐づけ）。
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-JWT-MEMBER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(JWT_NO_MEMBER), data: buildValidPayload() });
    expect401(res.status()); // 利用者IDから管理者会員を特定できず401。更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  // ===== データなし（IT-32） =====

  test("E2E-A07-05-030 存在しない受注IDで404となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.NONEXISTENT), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect404(res.status()); // 該当受注なし＝404（処理フロー#2）。
    await ctx.dispose();
  });

  // ===== バリデーション・エラー本文（IT-32 / IT-10。検証失敗時の400は付帯表4#2／文言は付帯表4#3,#4,#6で乖離記録） =====

  test("E2E-A07-05-031 order_status未指定で400となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildMissingStatusPayload() });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-032 マスタに存在しないorder_status(999)で400となる", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-STATUS-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status()); // マスタ非存在ステータス＝入力不正400（BuyOrderController.php:183-186）。
    await ctx.dispose();
  });

  test("E2E-A07-05-033 マスタ非存在order_statusのエラーメッセージが仕様文言となる", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-STATUS-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status());
    // 正本md文言「MtbBuyOrderStatusに(値)が見つかりません。」。実装は別文言（付帯表4#4）→ 仕様で照合し違えば落として検出。
    await expectErrorsContain(res, statusNotInMasterMessage(), "errors にマスタ非存在メッセージを含む（正本md文言・付帯表4#4）");
    await ctx.dispose();
  });

  test("E2E-A07-05-034 order_detailsが空配列で400となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildEmptyDetailsPayload() });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-035 order_details空のエラーメッセージが仕様文言となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildEmptyDetailsPayload() });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.DETAILS_REQUIRED, "errors に「1つ以上の商品を選んでください。」を含む（正本md文言・付帯表4#3）");
    await ctx.dispose();
  });

  test("E2E-A07-05-036 明細のname未指定で400となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildMissingNamePayload() });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-037 明細のnameが上限(65535)超過で400となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    // 正本mdの上限（最大65535）を超える長さ。実装の個別入力商品列長(255)との差は付帯表4#6（仕様で判定し違えば落として検出）。
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildNameLengthPayload(NAME_OVER_MAX_LENGTH) });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-038 明細のproduct_class_idが非整数で400となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("productClassId") });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-039 明細のquantityが非整数で400となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("quantity") });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-040 明細のpriceが非整数で400となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("price") });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-041 明細のpurchase_categoryが非整数で400となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("purchaseCategory") });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-05-042 複数の検証エラーをerrors配列に全件まとめて返す", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    // order_status未指定＋明細のname未指定＋quantity非整数を同時に与える。収集メッセージが1つの errors 配列へ集約される。
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildMultipleErrorsPayload() });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.STATUS_REQUIRED, "errors にステータス必須メッセージを含む（正本md文言・付帯表4#3）");
    await expectErrorsContain(res, SPEC_MESSAGE.INTEGER_QUANTITY, "errors に数量の整数形式メッセージを含む（収集の一括返却）");
    await ctx.dispose();
  });

  test("E2E-A07-05-044 失敗レスポンス本文が{code, errors}形式と一致する", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(body, "code"), "失敗本文に code を含む（正本md {code,errors}）").toBeTruthy();
    expect(Array.isArray(body.errors), "errors は検証メッセージの配列（正本md {code,errors}）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-A07-05-045 product_class_id非整数のエラーメッセージが仕様文言となる", async () => {
    test.skip(!HAS_API, "A07_05_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildNonIntegerDetailPayload("productClassId") });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.INTEGER_PRODUCT_CLASS_ID, "errors に「商品規格IDは、整数で入力してください。」を含む（正本md文言・付帯表4#6）");
    await ctx.dispose();
  });

  // ===== 副作用（DB観測。IT-09 / IT-33。一次オラクル＝API応答＋DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A07-05-050 査定終了処理で受注のステータス・合計額・担当者・更新日時が更新される", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-OPEN/会員A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.CHANGED }) });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order の買取受注ステータスID・合計額・更新担当者（会員A）・更新日時が指定値/算出値で更新。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-051 product_class_id=0かつ同名なしの明細が個別入力商品として新規登録される", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-WITH-DETAILS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.WITH_DETAILS), { headers: buildJwtHeaders(), data: buildIndividualInputNewPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order_indivisual_input_product に新規登録（同名既存なし）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-052 product_class_id=0かつ同名既存の明細は個別入力商品が更新される", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-WITH-DETAILS 同名個別入力商品既存) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.WITH_DETAILS), { headers: buildJwtHeaders(), data: buildIndividualInputExistingPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order_indivisual_input_product の同名既存が更新され、同名で重複した新規行が増えない。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-053 商品規格IDを持つ明細が買取代表カードとして登録・更新される", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-WITH-DETAILS) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.WITH_DETAILS), { headers: buildJwtHeaders(), data: buildMainCardPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_buy_main_card が同一条件の既存あれば更新・無ければ新規登録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-054 今回保持しない既存明細とその申込時買取価格が削除される", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-WITH-DETAILS 既存カード・申込時買取価格) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.WITH_DETAILS), { headers: buildJwtHeaders(), data: buildReplacedDetailsPayload() });
    expect200(res.status());
    // 一次オラクル: 今回保持しない dtb_buy_main_card・dtb_buy_order_indivisual_input_product と紐づく dtb_application_price が削除。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-055 まとめ買取商品は申込時買取価格のみ削除される", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-WITH-DETAILS/OPTION-BULK) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.WITH_DETAILS), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: まとめ買取商品（mtb_option BULK_PURCHASE_ID で識別）は dtb_application_price のみ削除対象。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-056 新規の買取代表カードへ既存明細から申込時買取価格が引き継がれる", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-WITH-DETAILS 引き継ぎ元の申込時買取価格) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.WITH_DETAILS), { headers: buildJwtHeaders(), data: buildMainCardPayload() });
    expect200(res.status());
    // 一次オラクル: 新規 dtb_buy_main_card へ既存明細から dtb_application_price が引き継ぎ登録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-057 合計額が10円単位で切り上げられて確定する", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-OPEN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildNonRoundedTotalPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order 合計額＝単価×数量と保持分の合算を10円単位で切上げ（例 1234→1240／roundUpPrice）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-058 サプライ・パック相当の明細は合計額へ加算して保持される", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-WITH-DETAILS カード詳細ID未設定の明細) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.WITH_DETAILS), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: カード詳細ID未設定の明細が削除されず保持され、その明細額が dtb_buy_order 合計額へ加算。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-059 査定終了処理で受注の更新対象外項目が変動しない", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-OPEN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: 更新範囲（ステータス・合計額・代表カード・個別入力商品・担当者・更新日時）以外の dtb_buy_order 他項目が更新前と不変。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-060 更新前後でステータスが変わった場合に履歴が1件登録される", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-OPEN 更新前ステータス既知) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.CHANGED }) });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order_status_histry に対象受注のステータス履歴が1件追加（UpdateBuyOrderAction.php:111-118）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-061 登録された履歴の内容が更新内容と一致し担当者が記録される", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-JWT-MEMBER 会員A/ORDER-OPEN 更新前ステータス既知) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.CHANGED }) });
    expect200(res.status());
    // 一次オラクル: 追加された dtb_buy_order_status_histry 行に受注ID・指定ステータスID・更新担当者（会員A）・登録日時が一致して記録。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-062 更新前後でステータスが変わらない場合は履歴が登録されない", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-OPEN 更新前ステータス既知) 未設定");
    const ctx = await newCtx();
    // 更新前と同一の order_status を指定（SEED の更新前ステータスに合わせる想定）。
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.UNCHANGED }) });
    expect200(res.status());
    // 一次オラクル: ステータス不変のため dtb_buy_order_status_histry に新規行が追加されない。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-05-072 検証エラー時に受注・明細・合計額・履歴が更新されない", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-OPEN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status());
    // 一次オラクル: 検証エラー400時は更新を行わず、dtb_buy_order のステータス・合計額・明細・dtb_buy_order_status_histry が更新前のまま不変。DB照査で補完。
    await ctx.dispose();
  });

  // ===== データ整合性・後勝ち（IT-09。排他なし・後勝ち＝正本md） =====

  test("E2E-A07-05-081 同一受注へ査定終了処理を再実行しても後勝ちで200となる", async () => {
    test.skip(!HAS_API, "A07_05_READY(SEED-A07-05-ORDER-OPEN) 未設定");
    const ctx = await newCtx();
    const first = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.VALID }) });
    expect200(first.status());
    const second = await ctx.put(buildBuyOrderEndPath(ORDER_ID.OPEN), { headers: buildJwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.CHANGED }) });
    expect200(second.status()); // 排他なし・後勝ちのため2回目も200で受け付けられる。
    await ctx.dispose();
  });
});
