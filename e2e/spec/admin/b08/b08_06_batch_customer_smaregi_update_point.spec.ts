/**
 * スマレジポイント更新バッチ（B08-06）UIレイヤ E2E。
 * 納品ケース表 integration_test/e2e/b08_06_batch_customer_smaregi_update_point_e2e_cases.md に対応。
 *
 * ── ケース表対応（付帯表1 E2E可否＝実装の正） ───────────────────
 *  本specには「E2E自動化(UI)」1ケース（020）を残す。API/統合(9: 001〜009)は spec/batch/b08 側、手動(010)はケース表で全量管理（規約）。
 *
 * ── 区分（real test／要実機確認なし） ──────────────────────────
 *  付帯表1で E2E-020 は「E2E自動化(UI)」（要実機確認 修飾なし）。受注編集画面「ポイントエラーメッセージ」欄のセレクタは
 *  Twig file:line（admin/Order/edit.twig:1798/1803/1805）で特定済みのため real test として構成する。
 *  ただし当該欄に連携エラー内容が現れるには事前に本バッチ（コンソール起動＝実機依存）が SEED-B08-06-FAIL の受注に対し
 *  失敗記録を行っている必要があり、対象受注IDは実行時環境で確定する。資格情報・受注IDが無ければ走らないよう test.skip でガードする。
 *
 * ── オラクル独立性 ─────────────────────────────────────────────
 *  期待は仕様（失敗時出力「受注サブへのエラーメッセージ記録」正本md:L102／DBカラム point_error_message:L114／IT-26）由来で判定し、
 *  エラーメッセージの json 構造・文言・smaregi_error_flg（DB内部・画面非表示＝IT層担保）はオラクル化しない。表示有無で判定する。
 *
 * ── 未実行雛形 ─────────────────────────────────────────────────
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *  AdminLoginPage を直利用し、資格情報が無ければ走らないよう test.skip(!HAS_CREDS) でガードする想定。
 *
 * 資格情報: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（環境変数。コミットしない。SEED-B08-06-ADMIN）。
 * 対象受注ID: ECCUBE_B08_06_FAIL_ORDER_ID（SEED-B08-06-FAIL の連携失敗受注。実行時環境で確定）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { SmaregiUpdatePointOrderEditPage } from "../../../pages/admin/b08/b08_06_batch_customer_smaregi_update_point.page";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const FAIL_ORDER_ID = process.env.ECCUBE_B08_06_FAIL_ORDER_ID || "";

/** SEED-B08-06-ADMIN でログインする（受注編集画面の参照権限あり）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe("スマレジポイント更新バッチ > 受注編集画面の連携エラー表示観測", { tag: ["@admin", "@order", "@b08"] }, () => {
  test("E2E-B08-06-020 連携失敗後に受注編集画面のポイントエラーメッセージにエラー内容が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS 未設定のためスキップ（SEED-B08-06-ADMIN）。");
    test.skip(!FAIL_ORDER_ID, "ECCUBE_B08_06_FAIL_ORDER_ID 未設定のためスキップ（SEED-B08-06-FAIL の連携失敗受注IDは実機で確定）。");
    // 前提: SEED-B08-06-FAIL（連携失敗で point_error_message を記録済みの受注）＋管理者ログイン。
    // 期待は失敗時出力「受注サブへのエラーメッセージ記録」正本md:L102／DBカラム point_error_message:L114／IT-26。
    // セレクタは admin/Order/edit.twig:1798/1803/1805 で特定済み（カードタイトル/パネル/エラーメッセージ欄）。
    await login(page);
    const editPage = new SmaregiUpdatePointOrderEditPage(page);
    await editPage.goto(FAIL_ORDER_ID);
    await expect(editPage.cardTitle).toBeVisible();
    await expect(editPage.pointErrorMessage).toBeVisible();
    // エラー内容の文言・json構造はオラクル化しない（表示有無で判定）。実エラー内容は本バッチ（実機起動）の失敗記録に依存する。
  });
});
