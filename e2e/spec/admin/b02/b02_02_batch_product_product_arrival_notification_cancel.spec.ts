/**
 * 入荷通知リクエストキャンセルバッチ（B02-02）UIレイヤ E2E。
 * 納品ケース表 integration_test/e2e/b02_02_batch_product_product_arrival_notification_cancel_e2e_cases.md に対応。
 *
 * ── ケース表対応（付帯表1 E2E可否＝実装の正） ───────────────────
 *  本specには「E2E自動化(UI)」1ケース（024）のみを実装する。API/統合(15)は spec/batch/b02 側、手動/対象外はケース表で全量管理（規約）。
 *
 * ── オラクル独立性 ─────────────────────────────────────────────
 *  論理削除の副作用（deleted_at 設定）を入荷待ち分析画面の「通知待ち（deleted_at IS NULL 集計）／削除」列で観測する。
 *  期待は仕様（副作用「入荷通知リクエストの論理削除」正本md:106／IT-05）由来。バッチ本体に依存せず、分析画面の集計列を観測する。
 *
 * ── 未実行雛形 ─────────────────────────────────────────────────
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *  AdminLoginPage を直利用し、資格情報が無ければ走らないよう test.skip(!HAS_CREDS) でガードする。
 *
 * 資格情報: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（環境変数。コミットしない。SEED-B02-02-ADMIN）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ArrivalNotificationAnalysisPage } from "../../../pages/admin/b02/b02_02_batch_product_product_arrival_notification_cancel.page";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

/** SEED-B02-02-ADMIN でログインする（入荷待ち分析画面の参照権限あり）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("入荷通知キャンセルバッチ > 論理削除副作用のUI観測", { tag: ["@admin", "@analysis", "@b02"] }, () => {
  test("E2E-B02-02-024 論理削除の副作用が入荷待ち分析画面（通知待ち／削除列）に反映される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-B02-02-ADMIN）");
    // 前提: SEED-B02-02-TARGET（論理削除対象の入荷通知リクエスト）が存在すること。
    await login(page);
    const analysis = new ArrivalNotificationAnalysisPage(page);
    await analysis.goto();
    await analysis.search(); // 既定条件で検索し集計表を表示
    // 期待（仕様由来）: 入荷待ち分析の集計表に「通知待ち（deleted_at IS NULL 集計）」「削除」列が現れ、
    //   論理削除の副作用が削除件数として観測できる（個別件数値はSEED依存・行特定は要実機確認）。
    await expect(analysis.pendingHeader.first()).toBeVisible();
    await expect(analysis.deletedHeader.first()).toBeVisible();
    await expect(analysis.summaryRows.first()).toBeVisible();
  });
});
