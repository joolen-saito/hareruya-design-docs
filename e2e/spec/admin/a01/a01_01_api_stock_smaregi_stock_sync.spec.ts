/**
 * a01-01 スマレジ連携処理（Webhook受信→在庫更新）UIレイヤ E2E。
 * ケース表 integration_test/e2e/a01_01_api_stock_smaregi_stock_sync_e2e_cases.md（付帯表1 E2E自動化(UI) 050-056）に対応。
 * 本specには「E2E自動化(UI)」ケースのみ実装し、要実機確認/外部依存は test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理し本specには書かない（規約）。
 *
 * 期待結果は仕様（設計書 a01-01・基本設計 0202 別添資料_在庫変動時の履歴作成）由来（オラクル独立性）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。
 *
 * 連携の流れ: 管理ログイン → APIヘルパで Webhook を送信 → 在庫検索一覧/在庫変動履歴を観測。
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login fixture が無く、既存 spec/admin/login.spec.ts も
 *  @playwright/test を直接使う。本specも login.spec.ts 規約に倣い AdminLoginPage 直利用とする。
 *
 * 環境ガード:
 *  - HAS_CREDS              : ECCUBE_ADMIN_USER/PASS（SEED-M01-ADMIN・2FA OFF）が用意済み。
 *  - SMAREGI_WEBHOOK_ALLOWED: SEED-A01-01-IP-ALLOW（受信検証通過の資格情報/許可元）が用意済み。
 *  - SEED-A01-01-STOCK-KNOWN: 既知初期在庫N・スマレジ⇔EC-CUBE規格の紐づけ（env で供給。区分マッピングは付帯表4#5要実機確認）。
 */
import { test, expect, request } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminSmaregiStockSyncPage } from "../../../pages/admin/a01/a01_01_api_stock_smaregi_stock_sync.page";
import { E2E_BASE_URL } from "../../../config/default.config";
import {
  SMAREGI_WEBHOOK_PATH,
  buildStockWebhookPayload,
  buildSmaregiHeaders,
} from "../../../pages/api/a01/a01_01_api_stock_smaregi_stock_sync.api";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const HAS_API = !!process.env.SMAREGI_WEBHOOK_ALLOWED;
const READY = HAS_CREDS && HAS_API;

// SEED-A01-01-STOCK-KNOWN 由来の既知値（env 供給・要実機確認: スマレジ⇔EC-CUBE規格の紐づけ）。
const STOCK_PRODUCT_CODE = process.env.SMAREGI_STOCK_PRODUCT_CODE || ""; // 在庫一覧の行特定用検索条件
const INITIAL_STOCK_N = Number(process.env.SMAREGI_STOCK_INITIAL_N || "0"); // 既知初期在庫N
const SALES_QTY = Number(process.env.SMAREGI_SALES_QTY || "1");   // 売上(02)減算数量
const RETURN_QTY = Number(process.env.SMAREGI_RETURN_QTY || "1"); // 返品(12)加算数量

/** APIヘルパで Webhook を送信する（UI観測の前段）。 */
async function sendWebhook(transactionType: "02" | "12") {
  const ctx = await request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
  const res = await ctx.post(SMAREGI_WEBHOOK_PATH, {
    headers: buildSmaregiHeaders(),
    data: buildStockWebhookPayload({ transactionType }),
  });
  expect(res.status(), "Webhook受信が正常系(2xx)で受理されること").toBeLessThan(300);
  await ctx.dispose();
}

const searchQuery = () => (STOCK_PRODUCT_CODE ? { product_code: STOCK_PRODUCT_CODE } : undefined);

test.describe("管理画面 > スマレジ連携(在庫反映観測)", { tag: ["@admin", "@smaregi"] }, () => {
  test("E2E-A01-01-050 売上(02)受信後に在庫検索一覧の在庫数が減算反映される", async ({ page }) => {
    test.skip(!READY, "ECCUBE_ADMIN_USER/PASS または SMAREGI_WEBHOOK_ALLOWED 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    await sendWebhook("02");
    const target = new AdminSmaregiStockSyncPage(page);
    await target.gotoStockList(searchQuery());
    // 設計書1-2: 売上(02)=出庫=減算。受信前N から減算数量分だけ減って表示されること。
    await target.seeStockEquals(INITIAL_STOCK_N - SALES_QTY);
  });

  test("E2E-A01-01-051 返品(12)受信後に在庫検索一覧の在庫数が加算反映される", async ({ page }) => {
    test.skip(!READY, "認証情報/SMAREGI_WEBHOOK_ALLOWED 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    await sendWebhook("12");
    const target = new AdminSmaregiStockSyncPage(page);
    await target.gotoStockList(searchQuery());
    // 設計書1-2: 返品(12)=入庫=加算。受信前N から加算数量分だけ増えて表示されること。
    await target.seeStockEquals(INITIAL_STOCK_N + RETURN_QTY);
  });

  test("E2E-A01-01-052 受信後に在庫変動履歴へ対象履歴行が作成される", async ({ page }) => {
    test.skip(!READY, "認証情報/SMAREGI_WEBHOOK_ALLOWED 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    const target = new AdminSmaregiStockSyncPage(page);
    await target.gotoStockHistory(searchQuery());
    const before = await target.historyRows.count();
    await sendWebhook("02");
    await target.gotoStockHistory(searchQuery());
    // 別添資料_在庫変動時の履歴作成(0202): 当該受信に対応する履歴行が作成されること（行数が増える）。
    // 連携元ID(スマレジ在庫変動履歴ID)付き紐づけ列の特定は要実機確認（付帯表4#6）。
    await expect(target.historyRows, "在庫変動履歴に新規行が作成されること").toHaveCount(before + 1);
  });

  test("E2E-A01-01-053 在庫変動履歴の変動数・区分が受信内容(売上=減算)と一致して表示される", async ({ page }) => {
    test.skip(!READY, "認証情報/SMAREGI_WEBHOOK_ALLOWED 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    await sendWebhook("02");
    const target = new AdminSmaregiStockSyncPage(page);
    await target.gotoStockHistory(searchQuery());
    // 別添資料(0202): 変動数・在庫変動区分が受信内容（売上=減算）と一致して表示されること。
    // 変動数(history.twig:680)/区分(history.twig:681)。減算量の表記は要実機確認のため数量文字列で照合する。
    await target.seeHistoryQuantity(String(SALES_QTY));
  });

  test("E2E-A01-01-055 02/12以外受信後は在庫数・在庫変動履歴が変化しない（負の確認）", async ({ page }) => {
    test.skip(!READY, "認証情報/SMAREGI_WEBHOOK_ALLOWED 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    const target = new AdminSmaregiStockSyncPage(page);
    await target.gotoStockHistory(searchQuery());
    const historyBefore = await target.historyRows.count();
    // 対象外区分（02/12以外）を送信（設計書1-2: 無視）。
    const ctx = await request.newContext({ baseURL: E2E_BASE_URL, ignoreHTTPSErrors: true });
    await ctx.post(SMAREGI_WEBHOOK_PATH, {
      headers: buildSmaregiHeaders(),
      data: { contractId: "TEST", event: "pos:transactions", action: "edited", ids: [], transactionType: "01" },
    });
    await ctx.dispose();
    // 在庫数は変化せず、在庫変動履歴に新規行が作成されないこと。
    await target.gotoStockList(searchQuery());
    await target.seeStockEquals(INITIAL_STOCK_N);
    await target.gotoStockHistory(searchQuery());
    await target.seeNoNewHistoryRow(historyBefore);
  });

  // ===== 要実機確認（test.fixme・理由＝ケース表 付帯表4） =====

  test.fixme(
    "E2E-A01-01-054 返品で在庫数・履歴の変動金額が現在金額基準の加算と一致（要実機確認: 在庫変動履歴の変動金額列セレクタ／付帯表1）",
    async () => {
      // 期待は設計書1-2(返品=現在数量・金額から計算した加算で数量・金額が戻る)由来。
      // 在庫変動履歴の変動金額列のセレクタが history.twig で未特定（要実機確認）のため fixme。
    }
  );

  test.fixme(
    "E2E-A01-01-056 連携エラー時は在庫数・履歴が変化しない（負の確認）（要実機確認: 外部連携失敗の誘発が実機依存／付帯表4）",
    async () => {
      // 期待は設計(例外処理: 連携失敗→片側更新なし・在庫不変)由来。外部連携失敗の安定再現が実機依存のため fixme。
    }
  );
});
