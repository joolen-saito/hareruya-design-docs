/**
 * o01-01 その他_MTGバイヤー_店頭買取（MTGバイヤーが店頭買取査定で叩くEC-CUBE側 admin JSON API 群）API/統合レイヤ E2E。
 *
 * area 判定＝**api**（画面を伴わない）。判断根拠: MTGバイヤー本体は本リポジトリ外の外部アプリで、画面・UI・ローカル保存は正本mdで仕様確定しない
 *   （正本md「本書で扱わないこと」L22-31／「フロント挙動」L79-87）。EC-CUBE側で観測できる入口は `App/MTGBuyer/V1/Admin/` の JSON API のみ
 *   （正本md「利用者視点の入口」L65-75）。したがって front/admin 画面specは無く、Playwright request（APIRequestContext）で観測する。
 *
 * 納品ケース表 integration_test/e2e/o01_01_other_mtg_buyer_mtg_buyer_store_purchase_e2e_cases.md（付帯表1 E2E可否＝実装の正）に対応。
 * 本specには「E2E自動化(API/統合)」ケースのみを残す（規約）。手動（同時更新/参照時点）・対象外（外部アプリUI/外部運用/DB内部・移行情報/別機能委譲=A06・M06・B06）はケース表で全量管理しspecに残さない。
 *
 * 期待結果は仕様（正本md／観点表・基本設計）由来（オラクル独立性）。実装のレスポンス形・FW既定値・DTO制約を期待値に流用しない。
 *  - 合否（成功）は HTTP200、（認証拒否）401、（対象なし）404、（入力不正）400 を仕様由来で判定する。
 *    検証失敗のHTTPコードは正本mdの 400 を期待する。実装 #[MapRequestPayload] 既定で 422 の可能性（付帯表4）→ 仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *  - 更新副作用（明細/在庫/在庫履歴の作り直し・買取合計金額の10円切上げ・ステータス変更履歴）は画面を持たないため
 *    一次オラクル＝API応答、DB副作用は永続化先テーブルの直接DB照合で補完（本リポでDBは実行しない）。
 * 本specは未実行雛形（ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成）。環境ガード O01_01_READY。
 */
import { expect, test, request, APIRequestContext } from "@playwright/test";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  PATH,
  updatePath,
  statusPath,
  freeCommentPath,
  identificationPath,
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
  buildDuplicateProductClassPayload,
  buildIndividualInputPayload,
  buildNonRoundedTotalPayload,
  buildStatusPayload,
  buildFreeCommentPayload,
  buildIdentificationPayload,
} from "../../../pages/api/o01/o01_01_other_mtg_buyer_mtg_buyer_store_purchase.api";

const HAS_API = !!process.env.O01_01_READY;

async function newCtx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
}

function expect200(status: number) {
  expect(status, "正常＝200（正本md: 更新API 成功／参照API JSON応答）").toBe(200);
}
function expect400(status: number) {
  // 正本md: 入力不正＝400。実装 422 の可能性は付帯表4。仕様の400で判定し違えば落として検出。
  expect(status, "入力不正＝400（正本md エラー処理 L266-267。実装422の可能性は付帯表4）").toBe(400);
}
function expect401(status: number) {
  expect(status, "認証拒否＝401（正本md 権限・認可 L245／エラー処理『認証不可』L263）").toBe(401);
}
function expect404(status: number) {
  expect(status, "対象受注なし＝404（正本md エッジケース L159／エラー処理 L265）").toBe(404);
}
function expectClientError(status: number) {
  expect(status, "異常＝4xx（更新が行われない）").toBeGreaterThanOrEqual(400);
  expect(status, "異常＝4xx").toBeLessThan(500);
}
async function expectErrorBodyContains(res: { json: () => Promise<unknown> }, message: string, why: string) {
  const body = (await res.json()) as unknown;
  expect(JSON.stringify(body), why).toContain(message);
}

test.describe("API > その他_MTGバイヤー_店頭買取", { tag: ["@api", "@o01"] }, () => {
  // ===== ログイン・認証（利用者視点の入口 L67／権限・認可 L238-245） =====

  test("E2E-O01-01-001 有効な管理者資格でログインすると認証トークンが返る", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-ADMIN) 未設定");
    const ctx = await newCtx();
    const res = await ctx.post(PATH.LOGIN, {
      headers: { "Content-Type": "application/json" },
      data: { login_id: process.env.ECCUBE_ADMIN_USER, password: process.env.ECCUBE_ADMIN_PASS },
    });
    expect200(res.status()); // 正本md 利用者視点の入口 L67「認証に成功すると認証トークンを返す」。トークン原値は照合しない（秘匿）。
    await ctx.dispose();
  });

  test("E2E-O01-01-002 jwt-tokenヘッダ欠落で査定対象取得が401となる", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PATH.LIST, { headers: noAuthHeaders() });
    expect401(res.status()); // 未認証＝データを返さない（正本md エッジケース「認証不可」L157）。
    await ctx.dispose();
  });

  test("E2E-O01-01-003 該当管理者会員が無いJWTで査定結果確定が401となる", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(JWT_NO_MEMBER), data: buildValidPayload() });
    expect401(res.status()); // 利用者IDから管理者会員を特定できず401。更新されないことはDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-01-004 署名不正のJWTでステータス更新が401となり更新されない", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(statusPath(ORDER_ID.TARGET), { headers: jwtHeaders(JWT_BAD_SIGNATURE), data: buildStatusPayload() });
    expect401(res.status()); // 署名検証失敗＝401（HS256検証方式は要実機確認だが結果=401・非更新で判定）。
    await ctx.dispose();
  });

  // ===== 査定対象取得（GET otcBuyOrders。業務ルール「査定対象の抽出」L133／「店舗絞り込み」L134／エッジ「0件」L158） =====

  test("E2E-O01-01-010 有効JWTで査定対象の店頭買取受注一覧を取得できる", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-ORDER) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PATH.LIST, { headers: jwtHeaders() });
    expect200(res.status());
    const body = (await res.json()) as unknown;
    expect(Array.isArray(body), "査定対象一覧は配列で返る（正本md 利用者視点の入口 L68）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-O01-01-011 査定対象が0件のとき空配列が返る", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-EMPTY 対象0件) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PATH.LIST, { headers: jwtHeaders() });
    expect200(res.status());
    const body = (await res.json()) as unknown[];
    expect(Array.isArray(body) && body.length === 0, "査定対象0件＝空配列（正本md エッジケース L158）").toBeTruthy();
    await ctx.dispose();
  });

  test("E2E-O01-01-012 抽出結果が商品到着/査定中/振込前/保留/査定再開の対象ステータスに限られる", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-STATUS 対象/対象外混在) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PATH.LIST, { headers: jwtHeaders() });
    expect200(res.status());
    // 一次オラクル: 一覧が査定対象ステータスの受注のみ（成立/キャンセル/データ出力済等は含まない＝正本md 業務ルール L133）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-01-013 所属店舗のある管理者では自店舗の受注のみ返る", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-JWT-STORE 店舗紐づき管理者) 未設定");
    const ctx = await newCtx();
    const res = await ctx.get(PATH.LIST, { headers: jwtHeaders(process.env.O01_01_JWT_STORE) });
    expect200(res.status());
    // 一次オラクル: 所属店舗に一致する受注のみ（正本md 業務ルール「店舗絞り込み」L134／権限・認可 L243）。DB照査で補完。
    await ctx.dispose();
  });

  // ===== 査定結果確定（PUT otcBuyOrder/{id}。処理フロー L107-118／業務ルール L135-139） =====

  test("E2E-O01-01-020 正常な明細で査定結果を確定でき200が返る", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-ORDER/SECTION) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-O01-01-021 存在しない受注IDでは404となり更新されない", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.NONEXISTENT), { headers: jwtHeaders(), data: buildValidPayload() });
    expect404(res.status()); // 該当なし＝404（正本md エッジ L159）。明細・在庫の非更新はDB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-01-022 明細が空の確定要求は400となる", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildEmptyDetailsPayload() });
    expect400(res.status());
    await expectErrorBodyContains(res, SPEC_MESSAGE.DETAILS_REQUIRED, "errors に明細必須の趣旨を含む（正本md バリデーション L233）");
    await ctx.dispose();
  });

  test("E2E-O01-01-023 明細が空のときは既存明細・在庫を削除しない", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-ORDER 既存明細/在庫あり) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildEmptyDetailsPayload() });
    expectClientError(res.status());
    // 一次オラクル: 入力不正時は削除・登録を開始しない＝既存明細/在庫が受信前と一致（正本md エッジ L160／エラー処理 L267）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-01-024 ステータスマスタに無いIDでは400となり更新されない", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-STATUS-MTB) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildUnknownStatusPayload() });
    expect400(res.status()); // ステータスがマスタ非存在＝入力不正（正本md バリデーション L232／エラー処理「ステータス不正」L266）。
    await ctx.dispose();
  });

  test("E2E-O01-01-025 確定成功時に明細が送信内容で全置換される", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-ORDER 既存明細) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildValidPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_detail 等が既存削除＋送信明細で作り直され送信外の旧明細が残らない（正本md 業務ルール「明細の全置換」L135）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-01-026 商品規格IDが空の明細は個別入力商品として登録される", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildIndividualInputPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_indivisual_input_product に登録（規格別在庫集計に含めない＝正本md 業務ルール L136）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-01-027 買取合計金額が明細から10円単位切上げした額で保存される", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildNonRoundedTotalPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order 買取合計金額＝買取単価×数量総和(333)を10円単位へ切上げ(340)（正本md 業務ルール「買取合計金額」L137）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-01-028 同一商品規格の数量を合算して在庫と在庫履歴が作り直される", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-SECTION) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildDuplicateProductClassPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_stock が規格別集計数量(2+3=5)で作り直され、dtb_otc_buy_order_stock_history が登録（正本md 業務ルール「在庫数量」L138／データ整合性 L172）。DB照査で補完。
    await ctx.dispose();
  });

  // ===== ステータス更新（PUT status。業務ルール「ステータス変更履歴」L139／ログ・監査 L283） =====

  test("E2E-O01-01-030 ステータスを更新でき200が返る", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(statusPath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildStatusPayload(STATUS.COMPLETE) });
    expect200(res.status());
    await ctx.dispose();
  });

  test("E2E-O01-01-031 更新前後でステータスが異なる場合に変更履歴が1件登録される", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-ORDER 更新前ステータス既知) 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(statusPath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildStatusPayload(STATUS.CANCEL) });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order_status_history に受注ID・更新後ステータス・更新担当者・登録日時が1件追加（正本md 業務ルール L139／ログ・監査 L283）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-01-032 同一ステータスへの詳細更新では変更履歴を登録しない", async () => {
    test.skip(!HAS_API, "O01_01_READY(SEED-O01-01-ORDER 更新前ステータス既知) 未設定");
    const ctx = await newCtx();
    // 更新前と同一のステータスを指定（環境の既知値へ＝要実機）。明細・在庫は作り直すがステータス変更履歴は追加しない。
    const res = await ctx.put(updatePath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildValidPayload({ orderStatus: STATUS.COMPLETE }) });
    expect200(res.status());
    // 一次オラクル: ステータス変更履歴は増えず、明細・在庫は作り直される（正本md エッジ「同じステータスで詳細更新」L161）。DB照査で補完。
    await ctx.dispose();
  });

  // ===== フリーコメント・本人確認（PUT freeComment/identification） =====

  test("E2E-O01-01-040 フリーコメントを更新でき200が返る", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(freeCommentPath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildFreeCommentPayload() });
    expect200(res.status());
    // 一次オラクル: dtb_otc_buy_order のフリーコメントが保存（正本md 利用者視点の入口 L71／入力項目 L150）。DB照査で補完。
    await ctx.dispose();
  });

  test("E2E-O01-01-041 存在しない受注IDへのフリーコメント更新は404となる", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(freeCommentPath(ORDER_ID.NONEXISTENT), { headers: jwtHeaders(), data: buildFreeCommentPayload() });
    expect404(res.status()); // 該当なし＝404（正本md エッジ「受注IDが存在しない」L159）。
    await ctx.dispose();
  });

  test("E2E-O01-01-042 本人確認状態を更新でき200が返る", async () => {
    test.skip(!HAS_API, "O01_01_READY 未設定");
    const ctx = await newCtx();
    const res = await ctx.put(identificationPath(ORDER_ID.TARGET), { headers: jwtHeaders(), data: buildIdentificationPayload() });
    expect200(res.status());
    // 一次オラクル: 受注に紐づく本人確認情報が更新（正本md 利用者視点の入口 L72／入力項目 L151）。DB照査で補完。
    await ctx.dispose();
  });

  // 手動（027/033 同時更新=並行/ロックなし、028 参照時点）・対象外（011/012 外部アプリUI、019/032/054 外部運用、010/047 A06委譲、
  // 029/031/037/056 M06/B06集計・管理画面委譲、041/042/043 DB内部・移行情報）はケース表で全量管理しspecに残さない（規約）。
});
