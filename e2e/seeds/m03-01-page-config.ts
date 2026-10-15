/** S-M03-01-PAGE-CONFIG: 表示件数マスタを管理画面から整える。 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { PageCountConfigPage } from "../pages/admin/m03_01_page_count";

defineSeed("S-M03-01-PAGE-CONFIG", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const config = new PageCountConfigPage(page);
    await config.ensureOptions((message) => reportSeedIssue(seed.シードID, message));
    await config.expectDefaultTen();
  });
});
