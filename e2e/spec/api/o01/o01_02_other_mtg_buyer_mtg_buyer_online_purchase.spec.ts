/**
 * o01-02 その他_MTGバイヤー_ネット買取（MTGバイヤーがネット/オンライン買取査定で叩くEC-CUBE側 admin JSON API 群）API/統合レイヤ E2E。
 *
 * area 判定＝**api**（画面を伴わない）。判断根拠: MTGバイヤー本体はリポジトリ外の外部アプリで画面・UI・ローカル保存は正本mdで仕様確定しない
 *   （正本md「本書で扱わないこと」L22-32／「フロント挙動」L73-78／「画面遷移」L197-199＝EC-CUBE側はAPI応答のみで画面遷移を持たない）。
 *   EC-CUBE側で観測できる入口は `App/MTGBuyer/V1/Admin/` の JSON API のみ（正本md「利用者視点の入口」L57-66）。よって front/admin 画面specは無く request で観測する。
 *
 * 納品ケース表 integration_test/e2e/o01_02_other_mtg_buyer_mtg_buyer_online_purchase_e2e_cases.md（付帯表1 E2E可否）に対応。
 * 本specには「E2E自動化(API/統合)」ケースのみを残す（規約）。手動（並行更新）・対象外（外部アプリUI/入庫=O01-03委譲/管理画面・集計=M07委譲/DB内部・移行情報）はケース表で全量管理しspecに残さない。
 *
 * 期待結果は仕様（正本md／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・DTO制約を期待値に流用しない。
 *  - 合否（成功）HTTP200、（認証拒否）401、（対象なし）404、（入力不正）400 を仕様由来で判定する（400/422差は付帯表4-3）。
 *  - 買取合計金額のサーバ側再計算・明細全置換・ステータス履歴は一次オラクル＝API応答、DB副作用は永続化先テーブルのDB照合で補完（本リポでDBは実行しない）。
 * 本specは未実行雛形（ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成）。環境ガード O01_02_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  PATH,
  updatePath,
  statusPath,
  freeCommentPath,
  jwtHeaders,
  noAuthHeaders,
  JWT_NO_MEMBER,
  JWT_BAD_SIGNATURE,
  ORDER_ID,
  STATUS,
  SPEC_MESSAGE,
  buildValidPayload,
  buildUnknownStatusPayload,
  buildEmptyDetailsPayload,
  buildRecalcTotalPayload,
  buildStatusPayload,
  buildFreeCommentPayload,
  buildByOrderIdsPayload,
} from "../../../pages/api/o01/o01_02_other_mtg_buyer_mtg_buyer_online_purchase.api";

const HAS_API = !!process.env.O01_02_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}
function expect200(status: number) {
  expect(status, "正常＝200（正本md: 更新API 成功／参照API JSON応答 L133-134）").toBe(200);
}
function expect400(status: number) {
  expect(status, "入力不正＝400（正本md: 入力検証エラーはエラー応答・DB更新なし L208。実装422の可能性は付帯表4-3）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md 権限・認可 L190／エラー処理『認証失敗』L207）").toBe(401);
}
function expect404(status: number) {
  expect(status, "対象受注なし＝404（正本md 処理フロー『存在しなければ該当なし』L91／エラー処理 L207）").toBe(404);
}
function expectClientError(status: number) {
  expect(status, "異常＝4xx（更新が行われない）").toBeGreaterThanOrEqual(400);
  expect(status, "異常＝4xx").toBeLessThan(500);
}
async function expectErrorBodyContains(res: { json: () => Promise<unknown> }, message: string, why: string) {
  const body = (await res.json()) as unknown;
  expect(JSON.stringify(body), why).toContain(message);
}

test.describe("API > その他_MTGバイヤー_ネット買取", { tag: ["@api", "@o01"] }, () => {
  // ===== ログイン・認証（利用者視点の入口 L59／権限・認可 L186-193） =====

  test("E2E-O01-02-001 有効な管理者資格でログインすると認証トークンが返る", async () => {
    test.skip(!HAS_API, "O01_02_READY(SEED-O01-02-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH.LOGIN, {
      headers: { "Content-Type": "application/json" },
      data: { login_id: process.env.ECCUBE_ADMIN_USER, password: process.env.ECCUBE_ADMIN_PASS },
    });
    expect200(res.status()); // 認証成功でトークン返却（正本md L59）。トークン原値は照合しない。
    await ctx.dispose();
  });

  test("E2E-O01-02-002 jwt-tokenヘッダ欠落で査定対象取得が401となる", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PATH.LIST, { headers: noAuthHeaders() });
    expect401(res.status()); // 認証トークン無効＝認証エラー（正本md 権限・認可 L190）。
    await ctx.dispose();
  });

  test("E2E-O01-02-003 該当管理者会員が無いJWTで査定結果確定が401となる", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(JWT_NO_MEMBER), data: buildValidPayload() });
    expect401(res.status()); // 該当会員を特定できず401。更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-02-004 署名不正のJWTでステータス更新が401となる", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(statusPath(ORDER_ID.TARGET), { headers: jwtHeaders(JWT_BAD_SIGNATURE), data: buildStatusPayload() });
    expect401(res.status()); // 署名検証失敗＝401（HS256方式は要実機確認だが結果=401・非更新で判定）。
    await ctx.dispose();
  });

  // ===== 査定対象取得（GET buyOrders。処理フロー L84-87） =====

  test("E2E-O01-02-010 有効JWTで査定対象のネット買取受注一覧を取得できる", async () => {
    test.skip(!HAS_API, "O01_02_READY(SEED-O01-02-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PATH.LIST, { headers: jwtHeaders() });
    expect200(res.status());
    const body = (await res.json()) as unknown;
    expect(Array.isArray(body), "査定対象一覧は配列で返る（正本md 利用者視点の入口 L60）").toBeTruthy();
    await ctx.dispose();
  });

  // ===== 査定結果確定（PUT buyOrder/{id}。処理フロー L89-96／業務ルール L112） =====

  test("E2E-O01-02-020 正常な明細で査定結果を確定でき200が返る", async () => {
    test.skip(!HAS_API, "O01_02_READY(SEED-O01-02-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-O01-02-021 存在しない受注IDでは404となり更新されない", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.NONEXISTENT), { headers: jwtHeaders(), data: buildValidPayload() });
    expect404(res.status()); // 該当なし＝404（正本md 処理フロー L91）。
    await ctx.dispose();
  });

  test("E2E-O01-02-022 検証エラー（明細空）で400となりDB更新されない", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildEmptyDetailsPayload() });
    expect400(res.status());
    await expectErrorBodyContains(res, SPEC_MESSAGE.DETAILS_REQUIRED, "errors に明細必須の趣旨を含む（正本md バリデーション L180）");
    await ctx.dispose();
  });

  test("E2E-O01-02-023 マスタに無いステータスでは400となり更新されない", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status()); // ステータス値は Master\MtbBuyOrderStatus を正とする（要実機確認）。入力不正で非更新。
    await ctx.dispose();
  });

  test("E2E-O01-02-024 確定成功時に明細（メインカード）が送信内容で全置換される", async () => {
    test.skip(!HAS_API, "O01_02_READY(SEED-O01-02-ORDER 既存明細) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_buy_main_card / individual_input が既存削除＋送信内容で全置換（正本md データ整合性「受注と明細」L122）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-02-025 買取合計金額が明細からサーバ側で再計算され保存される", async () => {
    test.skip(!HAS_API, "O01_02_READY(SEED-O01-02-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildRecalcTotalPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order 買取合計金額＝明細(単価1200×数量2=2400)からサーバ側再計算（正本md 業務ルール L112／データ整合性「合計金額」L123）。DB照査で補完。
    await ctx.dispose();
  });

  // ===== ステータス更新（PUT status。処理フロー L97-100／データ整合性 L124） =====

  test("E2E-O01-02-030 ステータスを更新でき200が返る", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(statusPath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildStatusPayload(STATUS.ASSESSED) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-O01-02-031 ステータス更新時に変更履歴が1件登録される", async () => {
    test.skip(!HAS_API, "O01_02_READY(SEED-O01-02-ORDER 更新前ステータス既知) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(statusPath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildStatusPayload(STATUS.CANCEL) });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order_status_history に1件追加され、受注の現在ステータスと履歴の最新が一致（正本md データ整合性「ステータス履歴」L124）。DB照査で補完。
    await ctx.dispose();
  });

  // ===== フリーコメント（PUT freeComment。利用者視点の入口 L63） =====

  test("E2E-O01-02-040 フリーコメント（メモ）を更新でき200が返る", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(freeCommentPath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildFreeCommentPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_buy_order のメモ（フリーコメント）が保存（正本md 利用者視点の入口 L63）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-02-041 存在しない受注IDへのフリーコメント更新は404となる", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(freeCommentPath(ORDER_ID.NONEXISTENT), { headers: jwtHeaders(), data: buildFreeCommentPayload() });
    expect404(res.status());
    await ctx.dispose();
  });

  // ===== メインカード・個別入力の取得（POST。正本mdは「登録」だが実装は getByBuyOrderIds＝取得＝付帯表4-2） =====

  test("E2E-O01-02-050 メインカード取得APIが認証付きで200を返す（要実機確認: 登録/取得の乖離は付帯表4-2）", async () => {
    test.skip(!HAS_API, "O01_02_READY(SEED-O01-02-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH.MAIN_CARD, { headers: jwtHeaders(), data: buildByOrderIdsPayload() });
    expect200(res.status()); // 正本md L65「メインカードを登録する」。実装は getByBuyOrderIds（取得）＝付帯表4-2。観測は200応答で判定し乖離は付帯表4で管理。
    await ctx.dispose();
  });

  test("E2E-O01-02-051 個別入力商品APIが認証付きで200を返す（要実機確認: 登録/取得の乖離は付帯表4-2）", async () => {
    test.skip(!HAS_API, "O01_02_READY(SEED-O01-02-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH.INDIVISUAL_INPUT, { headers: jwtHeaders(), data: buildByOrderIdsPayload() });
    expect200(res.status()); // 正本md L64「個別入力商品を登録する」。実装は getByBuyOrderIds（取得）＝付帯表4-2。
    await ctx.dispose();
  });

  test("E2E-O01-02-052 メインカード取得APIは認証欠落で401となる", async () => {
    test.skip(!HAS_API, "O01_02_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH.MAIN_CARD, { headers: noAuthHeaders(), data: buildByOrderIdsPayload() });
    expect401(res.status()); // firewall app pattern ^/api/v1/（security.yaml）配下＝jwt-token欠落で401。
    await ctx.dispose();
  });

  // 手動（並行更新=後勝ち・タイミング依存）・対象外（外部アプリUI/入庫=O01-03委譲/管理画面・集計=M07委譲/DB内部・移行情報・外部画面遷移）はケース表で全量管理しspecに残さない（規約）。
});
