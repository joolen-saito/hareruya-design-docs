/**
 * 週間在庫履歴更新バッチ（B02-07）UIレイヤ E2E。
 * 納品ケース表 integration_test/e2e/b02_07_batch_product_product_weekly_stock_history_update_e2e_cases.md に対応。
 *
 * ── ケース表対応（付帯表1 E2E可否＝実装の正） ───────────────────
 *  本specには「E2E自動化(UI)」1ケース（021）のみを実装する。API/統合(14)は spec/batch/b02 側、手動/対象外はケース表で全量管理（規約）。
 *
 * ── オラクル独立性 ─────────────────────────────────────────────
 *  週間在庫履歴の更新結果はUIに反映されない。ここで確認するのは「集計対象である商品在庫の在庫数の在庫検索一覧でのUI観測」であり、
 *  「バッチ結果のUI観測」ではない（付帯表1注記）。期待は仕様（集計対象「商品在庫の在庫数」正本md:99,147／IT-30）由来。
 *
 * ── 未実行雛形 ─────────────────────────────────────────────────
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *  既存 spec/admin と同様 AdminLoginPage を直利用し、資格情報が無ければ走らないよう test.skip(!HAS_CREDS) でガードする。
 *
 * 資格情報: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（環境変数。コミットしない。SEED-B02-07-ADMIN）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { WeeklyStockHistoryStockListPage } from "../../../pages/admin/b02/b02_07_batch_product_product_weekly_stock_history_update.page";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

/** SEED-B02-07-ADMIN でログインする（在庫検索一覧の参照権限あり）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("週間在庫履歴更新バッチ > 集計対象の在庫数UI観測", { tag: ["@admin", "@stock", "@b02"] }, () => {
  test("E2E-B02-07-021 集計対象の在庫を在庫検索一覧でUI確認（在庫数列が表示される）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-B02-07-ADMIN）");
    // 前提: SEED-B02-07-STOCK-HIST（集計対象の商品在庫）が存在すること。
    await login(page);
    const list = new WeeklyStockHistoryStockListPage(page);
    await list.goto();
    // 期待（仕様由来）: 在庫検索一覧に商品在庫の在庫数列が表示される＝週間在庫履歴の集計対象（商品在庫の在庫数）の入力条件を観測できる。
    await expect(list.resultRows.first()).toBeVisible();
    const stocks = await list.readStockValues();
    expect(stocks.length).toBeGreaterThan(0);
    for (const s of stocks) {
      expect(Number.isFinite(s)).toBe(true); // 在庫数が数値として表示される（集計対象の在庫の入力条件観測）
    }
  });
});
