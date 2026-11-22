/**
 * 保守用（ケースではない）。2026-11-22 依頼者了承「E2E の1,422件を却下してよい」。
 *
 * 開発環境の本店の在庫編集承認一覧に、E2E の試験管理者が登録して承認されずに残った未承認の行が溜まり（11/22 時点で 1,422件。人の登録は84件）、
 * 一覧は1,000件までしか出せないので、在庫を入れて承認するシードが今回の行を見つけられずに止まっていた。
 * E2E の試験管理者（メールアドレスが @example.test、または M04-02 の担当者 m0402_admin）が登録した本店の未承認の行だけを、
 * 一覧の「一括却下」で片付ける（在庫は増えない）。人の登録の行には触らない。
 * 対象は DB を読んで決め（参照だけ）、画面では一覧に出た行のうち対象の番号のものだけにチェックを付ける。
 *
 * 流し方: E2E_MAINT_APPLY=1 で却下する（無ければ、対象の件数を表示するだけ）。
 *   npx playwright test -c tools/maint/playwright.config.ts tools/maint/reject_stale_e2e_stock_edits.maint.ts
 */
import { expect, test } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { query } from "../../lib/db";
import { loginAdmin } from "../../lib/session";
import { StockApprovalListPage, StockListPage } from "../../pages/admin/stock_edit";
import { expectSaved } from "../../pages/admin/common";

const 対象の番号 = (): Set<string> => new Set(query(
  `select a.id::text as id from dtb_stock_approval_list a join dtb_member m on m.id = a.registered_member_id
    where a.approval_status = 1 and a.base_info_id = 1 and (m.email like '%@example.test' or m.login_id = 'm0402_admin')`,
).map((r) => String(r.id)));
const 人の未承認 = (): number => Number(query(
  `select count(*)::text as n from dtb_stock_approval_list a join dtb_member m on m.id = a.registered_member_id
    where a.approval_status = 1 and a.base_info_id = 1 and not (m.email like '%@example.test' or m.login_id = 'm0402_admin')`,
)[0]?.n ?? "0");

test("本店の在庫編集承認一覧の、E2E が登録した未承認の行を一括却下する", async ({ page }) => {
  test.setTimeout(6 * 60 * 60_000);
  const apply = process.env.E2E_MAINT_APPLY === "1";
  const 人の前 = 人の未承認();
  let 残り = 対象の番号();
  console.log(`対象（E2E が登録した本店の未承認）: ${残り.size} 件・人の登録の未承認: ${人の前} 件`);
  if (!apply) return;
  await loginAdmin(page, SETUP_ADMIN);
  page.setDefaultTimeout(120_000);
  const shop = await new StockListPage(page).shopNameById("1");
  const list = new StockApprovalListPage(page);
  for (let round = 0; round < 40 && 残り.size > 0; round++) {
    await list.openAll(shop);
    const onPage = (await list.rowValues()).filter((r) => r.status === "未承認" && 残り.has(r.id)).map((r) => r.id);
    if (onPage.length === 0) throw new Error(`一覧（1000件の表示）に対象の行が出ない（残り ${残り.size} 件）`);
    const batch = onPage.slice(0, 100);
    for (const id of batch) await page.locator(`#form_search_stock_approval_list_update input[name="approval_list_ids[]"][value="${id}"]`).check();
    const lineItems = page.waitForResponse((r) => r.request().method() === "POST" && /\/approval_list\/line_items$/.test(new URL(r.url()).pathname), { timeout: 300_000 });
    await page.locator("#btn_bulk_reject").click();
    const modal = page.locator("#stockApprovalListConfirmModal");
    await expect(modal, "却下の確認").toBeVisible();
    await lineItems;
    await modal.locator("#rejection_reason").fill("E2E の試験で残った未承認の行の片付け（2026-11-22 依頼者了承）");
    await modal.locator("#btn_bulk_reject_submit").click();
    const ok = modal.locator('.modal-footer-confirm button[type="submit"]');
    await expect(ok, "最終確認の「OK」").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 600_000 }), ok.click({ noWaitAfter: true })]);
    await expectSaved(page, `却下（${batch.length}件）`);
    const 前 = 残り.size;
    残り = 対象の番号();
    console.log(`${round + 1}回目: ${batch.length} 件を却下 → 残り ${残り.size} 件（前 ${前} 件）`);
    if (残り.size >= 前) throw new Error("却下しても対象が減らない");
  }
  const 人の後 = 人の未承認();
  console.log(`終わり: 対象の残り ${残り.size} 件・人の登録の未承認 ${人の後} 件（前 ${人の前} 件）`);
  expect(人の後, "人の登録の未承認の行は変わらない").toBe(人の前);
  expect(残り.size, "E2E が登録した本店の未承認は0件").toBe(0);
});
