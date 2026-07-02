/**
 * a07-04 オンライン仕入_買取注文ステータス（買取アプリ=MTGバイヤーがネット買取受注のステータスをPUT更新するJSON API）API/統合レイヤ E2E。
 * ケース表 integration_test/e2e/a07_04_api_online_purchase_buy_order_status_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」を実装する。付帯表1 で「E2E自動化(API/統合)（要実機確認: JWT発行・会員紐づけ）」修飾の 010/011/012 は test.fixme（spec-oracleは記すが実機トークン整備まで未実行）。
 * 手動（035 想定外項目仕様未定義・050 保存例外500の実再現・051 タイムアウト実再現）はケース表で全量管理し本specには書かない（規約）。
 * 本機能は画面なしAPI（正本md「ブラウザ向けの画面を持たない／画面はスコープ外」）のためUI専用specは無い（付帯表2 自動化(UI)=0件）。
 *
 * 期待結果は仕様（正本md＝pf-api挙動／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・ステータスマスタ定義を期待値に流用しない。
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/buyOrder/{id}/status.json`（付帯表1／付帯表4#1。正本md `PUT /admin/buyOrder/{id}/status.json` は接頭辞 `/api/v1` を欠くが移行節で接頭辞配下配置を明記）。
 *  - 認証は firewall app（access_token・JwtTokenHeaderExtractor＝security.yaml:33-39／JwtTokenHeaderExtractor.php:29,34）。ヘッダ名 `jwt-token`。欠落/該当会員なし/署名不正＝401。
 *  - 合否（成功）は HTTP200＋応答 `{code:200}`（code integer・値200）、（失敗）は 400＋`{code,errors}`、対象なしは 404 を仕様由来で判定する。
 *    検証失敗のHTTPステータスは正本mdの 400 を期待する。実装422の可能性は仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *    判定メッセージは正本md文言を期待（マスタ非存在「正しい店頭買取ステータスIDを入力してください」の「店頭」表記は付帯表4#4／占有・査定終了文言は付帯表4#5/#6/#8）。errors 要素形は実装依存のため本文全体を文字列化して文言の存在で照合する。
 *  - ステータス区分は正本md定義（査定中=10・査定再開=12・査定終了={4,5,6,7,8,9,13}）をオラクルとし、実装のマスタ値定義差・遷移許可表・同一ステータス時の占有判定スキップは付帯表4#5/#6/#8で記録（実装の現挙動を期待へ写さない＝016/018は仕様の占有拒否400を期待し落ちて検出）。
 *  - 本APIはブラウザ向け画面を持たないため、更新副作用は永続化先テーブル（dtb_buy_order／dtb_buy_order_status_histry）を直接DB照合（DB副作用観測）して判定する想定。本specは一次オラクルとしてAPI応答を確認し、DB副作用は「DB照査で補完」（本リポでDBは実行しない）。
 *  - 有効JWT原値・SEED ID は env で供給し原値はコミットしない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_04_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  buildStatusPath,
  buildJwtHeaders,
  buildNoAuthHeaders,
  MEMBER_JWT,
  OTHER_JWT,
  JWT_NO_MEMBER,
  JWT_BAD_SIGNATURE,
  ORDER_ID,
  STATUS,
  SPEC_MESSAGE,
  buildValidPayload,
  buildMissingStatusPayload,
  buildUnknownStatusPayload,
  buildNonIntegerStatusPayload,
} from "../../../pages/api/a07/a07_04_api_online_purchase_buy_order_status.api";

const HAS_API = !!process.env.A07_04_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常更新＝200（正本md: レスポンス成功 {code:200}）").toBe(200);
}
function expect400(status: number) {
  // 正本md: 入力不正／占有拒否／査定終了拒否＝400。実装の検証ステータス差異は付帯表4で管理。仕様の400で判定し違えば落として検出する。
  expect(status, "入力不正＝400（正本md: レスポンス失敗）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md: 認証・認可／jwt-token照合の拒否）").toBe(401);
}
function expect404(status: number) {
  expect(status, "対象受注なし＝404（正本md: 処理フロー#2 受注取得・BuyOrderController.php:130）").toBe(404);
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

test.describe("API > オンライン仕入_買取注文ステータス", { tag: ["@api", "@a07"] }, () => {
  // ===== 正常更新（IT-09 / IT-10 / IT-32） =====

  test("E2E-A07-04-001 未終了受注へstatus=10をPUTし200が返る", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-INTERMEDIATE/STATUS-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-04-002 成功レスポンス本文がcode=200を含む", async () => {
    test.skip(!HAS_API, "A07_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    await expectCode200Body(res); // 成功本文の型契約＝{code:200}（code integer・値200）。
    await ctx.dispose();
  });

  test("E2E-A07-04-003 正常通信で200が返る", async () => {
    test.skip(!HAS_API, "A07_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status()); // PUT通信成立・成功＝200。
    await ctx.dispose();
  });

  test("E2E-A07-04-004 マスタに存在する正常値で200が返る", async () => {
    test.skip(!HAS_API, "A07_04_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    await ctx.dispose();
  });

  // ===== 認証・認可（IT-32 / IT-09。JWT発行・会員紐づけは要実機確認＝付帯表1 → test.fixme） =====

  test.fixme("E2E-A07-04-010 jwt-tokenヘッダ欠落で401となり更新されない", async () => {
    test.skip(!HAS_API, "A07_04_READY 未設定");
    // 要実機確認: JWT発行・会員紐づけ（付帯表1）。spec-oracle＝ヘッダ欠落で認証拒否401。
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildNoAuthHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect401(res.status()); // ヘッダ欠落＝認証拒否401。受注が更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test.fixme("E2E-A07-04-011 署名不正のJWTで401となり更新されない", async () => {
    test.skip(!HAS_API, "A07_04_READY 未設定");
    // 要実機確認: HS256署名検証の実方式（付帯表1）。spec-oracle＝署名検証失敗で401。
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(JWT_BAD_SIGNATURE), data: buildValidPayload(STATUS.ASSESSING) });
    expect401(res.status());
    await ctx.dispose();
  });

  test.fixme("E2E-A07-04-012 該当する管理者会員が無いJWTで401となる", async () => {
    test.skip(!HAS_API, "A07_04_READY 未設定");
    // 要実機確認: 会員紐づけ（署名は正当だが対応会員なし＝付帯表1）。spec-oracle＝会員特定不可で401（BuyOrderController.php:147）。
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(JWT_NO_MEMBER), data: buildValidPayload(STATUS.ASSESSING) });
    expect401(res.status());
    await ctx.dispose();
  });

  // ===== 占有判定（IT-10。処理フロー#6 査定担当者≠認証会員。UpdateStatusAction.php:96／同一値占有スキップは付帯表4#8） =====

  test("E2E-A07-04-013 他担当者が査定中受注を査定再開(10→12)へ更新すると400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-OTHER/ORDER-INPROGRESS-A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), { headers: buildJwtHeaders(OTHER_JWT), data: buildValidPayload(STATUS.RESUMPTION) });
    expect400(res.status()); // 担当者本人以外＝占有拒否400。
    await ctx.dispose();
  });

  test("E2E-A07-04-014 占有拒否のerrorsが査定担当者名を含む仕様文言となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-OTHER/ORDER-INPROGRESS-A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), { headers: buildJwtHeaders(OTHER_JWT), data: buildValidPayload(STATUS.RESUMPTION) });
    expect400(res.status());
    // 正本md: 「この受注は「（査定担当者名）」が査定中です。」。査定担当者名は環境依存のため安定部分で照合。
    await expectErrorsContain(res, SPEC_MESSAGE.OCCUPIED_STABLE, "errors に占有拒否メッセージ（…が査定中です。）を含む（正本md文言・付帯表4#8）");
    await ctx.dispose();
  });

  test("E2E-A07-04-015 査定担当者本人は査定中受注を査定再開(10→12)へ更新でき200となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-INPROGRESS-A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), { headers: buildJwtHeaders(MEMBER_JWT), data: buildValidPayload(STATUS.RESUMPTION) });
    expect200(res.status()); // 本人＝更新可200（占有拒否⇔本人可の対）。
    await ctx.dispose();
  });

  test("E2E-A07-04-016 他担当者が査定中受注を同値(10→10)へ更新しても占有拒否400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-OTHER/ORDER-INPROGRESS-A) 未設定");
    const ctx = await newCtx();
    // 正本md: #6占有判定→#7同一no-opの順で他担当者の10→10は400拒否。実装は同一値で先にreturnし200を返す不具合候補（付帯表4#8）→仕様の400を期待し落ちて検出。
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), { headers: buildJwtHeaders(OTHER_JWT), data: buildValidPayload(STATUS.ASSESSING) });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-04-017 他担当者が査定再開受注を査定中(12→10)へ更新すると占有拒否400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-OTHER/ORDER-RESUMED-A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.RESUMED_A), { headers: buildJwtHeaders(OTHER_JWT), data: buildValidPayload(STATUS.ASSESSING) });
    expect400(res.status()); // 12→10 は別値で早期returnに当たらず占有拒否400（付帯表4#8の影響外）。
    await ctx.dispose();
  });

  test("E2E-A07-04-018 他担当者が査定再開受注を同値(12→12)へ更新しても占有拒否400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-OTHER/ORDER-RESUMED-A) 未設定");
    const ctx = await newCtx();
    // 正本md: #6占有→#7同一no-opの順で他担当者の12→12は400拒否。実装は同一値で先にreturnし200を返す不具合候補（付帯表4#8）→仕様の400を期待し落ちて検出。
    const res = await ctx.put(buildStatusPath(ORDER_ID.RESUMED_A), { headers: buildJwtHeaders(OTHER_JWT), data: buildValidPayload(STATUS.RESUMPTION) });
    expect400(res.status());
    await ctx.dispose();
  });

  // ===== 査定終了の更新不可（IT-10。処理フロー#5／UpdateStatusAction.php:78・メッセージ分岐） =====

  test("E2E-A07-04-020 査定終了(振込完了7)の受注を査定中(10)へ更新すると400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-FINISHED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-04-021 査定終了→査定中のerrorsが「開くことができません」文言となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-FINISHED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.FINISHED_CANNOT_OPEN, "errors に「この査定はすでに終了しているため開くことができません。」を含む（正本md文言・処理フロー#5）");
    await ctx.dispose();
  });

  test("E2E-A07-04-022 査定終了→それ以外(商品到着2)のerrorsが「更新に失敗しました」文言となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-FINISHED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.PRODUCT_ARRIVAL) });
    expect400(res.status());
    await expectErrorsContain(res, SPEC_MESSAGE.FINISHED_UPDATE_FAILED, "errors に「この査定はすでに終了しているためステータスの更新に失敗しました。」を含む（正本md文言・処理フロー#5）");
    await ctx.dispose();
  });

  test("E2E-A07-04-023 査定終了(査定同意4)の受注を査定中(10)へ更新すると400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-FINISHED-AGREE) 未設定");
    const ctx = await newCtx();
    // 査定終了集合 下限代表ID（査定同意4）でも更新不可＝400。
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED_AGREE), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-04-024 査定終了(連絡済み13)の受注を商品到着(2)へ更新すると400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-FINISHED-CONTACTED) 未設定");
    const ctx = await newCtx();
    // 査定終了集合 上限代表ID（連絡済み13）でも更新不可＝400。
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED_CONTACTED), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.PRODUCT_ARRIVAL) });
    expect400(res.status());
    await ctx.dispose();
  });

  test("E2E-A07-04-025 査定終了→査定再開(12)でも「開くことができません」分岐となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-FINISHED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.RESUMPTION) });
    expect400(res.status());
    // 指定先が査定再開(12)でも査定中・査定再開分岐＝「開くことができません」。
    await expectErrorsContain(res, SPEC_MESSAGE.FINISHED_CANNOT_OPEN, "errors に「この査定はすでに終了しているため開くことができません。」を含む（正本md文言・処理フロー#5）");
    await ctx.dispose();
  });

  // ===== データなし（IT-32） =====

  test("E2E-A07-04-030 存在しない受注IDで404となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.NONEXISTENT), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect404(res.status()); // 該当受注なし＝404（BuyOrderController.php:130）。
    await ctx.dispose();
  });

  // ===== バリデーション・エラー本文（IT-32 / IT-10） =====

  test("E2E-A07-04-031 status未指定で400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-ORDER-INTERMEDIATE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildMissingStatusPayload() });
    expect400(res.status()); // status必須＝400（BuyOrderController.php:135）。必須エラー文言は正本md未規定のため400のみ判定（付帯表4#3）。
    await ctx.dispose();
  });

  test("E2E-A07-04-032 マスタに存在しないstatus(999)で400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-STATUS-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status()); // マスタ存在判定＝400（BuyOrderController.php:141）。
    await ctx.dispose();
  });

  test("E2E-A07-04-033 マスタ非存在statusのerrorsが仕様文言となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-STATUS-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status());
    // 正本md・実装とも「正しい店頭買取ステータスIDを入力してください」（ネット買取APIだが「店頭」表記＝付帯表4#4）。
    await expectErrorsContain(res, SPEC_MESSAGE.STATUS_NOT_IN_MASTER, "errors に「正しい店頭買取ステータスIDを入力してください」を含む（正本md文言・付帯表4#4）");
    await ctx.dispose();
  });

  test("E2E-A07-04-034 非整数statusで400となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-ORDER-INTERMEDIATE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildNonIntegerStatusPayload() });
    expect400(res.status()); // 非整数・空文字のstatus形式不正＝400（BuyOrderController.php:135）。
    await ctx.dispose();
  });

  test("E2E-A07-04-036 失敗レスポンス本文が{code, errors}形式である", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-STATUS-MASTER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status());
    // 失敗本文の型契約＝{code, errors}（errors に該当メッセージ）。
    await expectErrorsContain(res, SPEC_MESSAGE.STATUS_NOT_IN_MASTER, "失敗本文が {code,errors} 形式で errors に該当メッセージを含む（正本md）");
    await ctx.dispose();
  });

  // ===== 副作用＝DB観測（IT-09 / IT-33。一次オラクル＝API応答＋DB副作用照合。本specはAPI応答を確認しDB照査で補完） =====

  test("E2E-A07-04-040 更新後ステータスが受注テーブルに反映される", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-ORDER-INTERMEDIATE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order.buy_order_status_id が査定中(10)へ更新。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-04-041 認証した管理者会員が更新担当者として記録される", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-INTERMEDIATE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(MEMBER_JWT), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order.member_id＝jwt-token から特定した認証会員（会員A）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-04-042 更新時にステータス変更履歴が1件登録される", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-ORDER-INTERMEDIATE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order_status_histry に対象受注の履歴が1件追加。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-04-043 登録された履歴の内容が更新内容と一致する", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-INTERMEDIATE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(MEMBER_JWT), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    // 一次オラクル: 履歴行の更新後ステータスID(10)・更新担当者ID(会員A)・登録日時(create_date)が更新内容と一致。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-04-044 ステータス更新で受注の他項目が変動しない", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-ORDER-INTERMEDIATE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order の他項目（買取合計金額・成立日時・明細等）が更新前と不変。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-04-045 査定終了拒否時に受注ステータスが更新されない", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-ORDER-FINISHED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect400(res.status());
    // 一次オラクル: 拒否時 dtb_buy_order.buy_order_status_id が振込完了(7)のまま不変。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-04-046 更新拒否時にステータス変更履歴が登録されない", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-ORDER-FINISHED) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.FINISHED), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect400(res.status());
    // 一次オラクル: 拒否時 dtb_buy_order_status_histry に新規行が追加されない。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-04-047 更新前後が同一ステータス(10→10・本人)でも200となる", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-INPROGRESS-A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), { headers: buildJwtHeaders(MEMBER_JWT), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status()); // 本人・同一ステータスは更新なしで200（no-op）。
    await ctx.dispose();
  });

  test("E2E-A07-04-048 同一ステータス(10→10・本人)では履歴が登録されない", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-JWT-MEMBER/ORDER-INPROGRESS-A) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INPROGRESS_A), { headers: buildJwtHeaders(MEMBER_JWT), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    // 一次オラクル: 同一ステータスは dtb_buy_order_status_histry に新規行が追加されない。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-A07-04-049 更新時に受注の更新日時が更新時刻へ更新される", async () => {
    test.skip(!HAS_API, "A07_04_READY(SEED-A07-04-ORDER-INTERMEDIATE) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(buildStatusPath(ORDER_ID.INTERMEDIATE), { headers: buildJwtHeaders(), data: buildValidPayload(STATUS.ASSESSING) });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order.update_date が更新前の値から更新時点の日時へ更新。DB照査で補完。
    await ctx.dispose();
  });
});
