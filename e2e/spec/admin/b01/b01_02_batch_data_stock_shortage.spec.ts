/**
 * 在庫切れバッチ（B01-02）UIレイヤ E2E。
 * 納品ケース表 integration_test/e2e/b01_02_batch_data_stock_shortage_e2e_cases.md に対応。
 *
 * ── ケース表対応 ───────────────────────────────────────────────
 *  本specには「E2E自動化(UI)」2ケース（付帯表2 内訳: 015(IT-30 在庫0観測), 016(IT-16 在庫1以上観測)）のみを実装する。
 *  API/統合(14)は spec/batch/b01/b01_02_batch_data_stock_shortage.batch.spec.ts、手動(7)・対象外(1)はケース表で全量管理する（規約）。
 *
 * ── オラクル独立性 ─────────────────────────────────────────────
 *  本バッチの抽出結果(CSV)はUIに反映されない。ここで確認するのは「抽出対象の入力条件（在庫数=0／≥1）の在庫検索一覧でのUI観測」であり、
 *  「バッチ結果のUI観測」ではない（ケース表 注記／付帯表1）。期待結果は仕様（抽出条件「在庫数0」＝正本md:117,123,133／IT-30,IT-16）由来。
 *
 * ── 未実行雛形・コマンド未特定(Ph2) ───────────────────────────
 *  在庫切れバッチ本体は刷新先に未特定（Ph2 対応・Ph1 未実装。付帯表4-1）。本UIケースはバッチ本体に依存せず在庫一覧の在庫数列のみを観測する。
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 *  既存の spec/admin/login.spec.ts も @playwright/test を直接使う。本specも踏襲し AdminLoginPage を直利用する。
 *  資格情報が無ければ走らないよう test.skip(!HAS_CREDS) でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 資格情報: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（環境変数。コミットしない。SEED-B01-02-ADMIN）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockShortageStockListPage } from "../../../pages/admin/b01/b01_02_batch_data_stock_shortage.page";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

/** SEED-B01-02-ADMIN でログインする（在庫検索一覧の参照権限あり）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden(); // 認証成功（ログイン画面から遷移）
}

test.describe("在庫切れバッチ > 抽出対象の在庫数UI観測", { tag: ["@admin", "@stock", "@b01"] }, () => {
  test("E2E-B01-02-015 在庫検索一覧に在庫数0の商品規格が表示され在庫数列が0と表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-B01-02-ADMIN）");
    // 前提: SEED-B01-02-STOCK-ZERO（在庫数=0 の公開商品規格）が存在すること。
    await login(page);
    const list = new StockShortageStockListPage(page);
    await list.goto();
    await list.searchByStockRange("0", "0"); // 抽出条件「在庫数0」(正本md:117,123,133)の入力条件をUIで観測
    // 期待（仕様由来）: 在庫数列に0が表示される＝抽出対象（在庫切れ）条件に該当することを確認。
    // 在庫0規格が存在する前提。1件以上ヒットし、表示在庫数が全て0であること。
    await expect(list.resultRows.first()).toBeVisible();
    const stocks = await list.readStockValues();
    expect(stocks.length).toBeGreaterThan(0);
    for (const s of stocks) {
      expect(s).toBe(0); // 在庫数=0（在庫切れ抽出の対象条件）
    }
  });

  test("E2E-B01-02-016 在庫検索一覧で在庫1以上の規格は在庫数1以上で表示され抽出対象(在庫0)に該当しない", async ({
    page,
  }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-B01-02-ADMIN）");
    // 前提: SEED-B01-02-NO-TARGET（在庫数≥1 の公開商品規格）が存在すること。
    await login(page);
    const list = new StockShortageStockListPage(page);
    await list.goto();
    await list.searchByStockRange("1", ""); // 在庫1以上で検索＝抽出対象外(在庫0)の入力条件をUIで観測（IT-16）
    // 期待（仕様由来）: 在庫数列が全て1以上で表示され、在庫切れ抽出の対象条件（在庫0）に該当しないことを確認。
    await expect(list.resultRows.first()).toBeVisible();
    const stocks = await list.readStockValues();
    expect(stocks.length).toBeGreaterThan(0);
    for (const s of stocks) {
      expect(s).toBeGreaterThanOrEqual(1); // 在庫数≥1（在庫0抽出の対象外）
    }
  });
});
