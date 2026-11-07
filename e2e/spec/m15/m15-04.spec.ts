/** M15-04 デッキ一括編集（管理画面だけで確かめる連鎖）。正本: cases/M15-04_test_cases.tsv。前面の確認が要るケースは実装しない */
import { Page } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1504RJ_ADMIN, 語RJ } from "../../seeds/m15-04";

const 入力欄 = (page: Page) => page.locator('[name="admin_search_archetype[multi]"]');
const 結果表 = (page: Page) => page.locator(".archetype-result-table");

async function アーキタイプを検索する(page: Page, 検索語: string): Promise<void> {
  await page.goto(adminUrl("/archetype"));
  await page.waitForLoadState("load");
  await 入力欄(page).fill(検索語);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#admin_search_archetype button[type=submit]").click()]);
  await expect(結果表(page), "アーキタイプ管理(検索結果)の表").toBeVisible({ timeout: 30_000 });
}
/** 検索結果で、アーキタイプ名の行の登録デッキ数 */
async function 登録デッキ数(page: Page, 名日: string): Promise<string> {
  const 行 = 結果表(page).locator("tr").filter({ has: page.locator("td a", { hasText: `${名日} /` }) }).first();
  await expect(行, `アーキタイプ「${名日}」の行`).toBeVisible();
  return ((await 行.locator("td").nth(5).innerText()) ?? "").trim();
}

caseTest("IT-M15-04-006", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  const 基 = 語RJ(), 甲 = `${基}-型甲`, 乙 = `${基}-型乙`, id = notes.get("〔デッキID-M1504-RJ001〕");
  const l = new デッキ一覧(page);
  let 前 = { 甲: "", 乙: "" }, 後 = { 甲: "", 乙: "" };
  await step(1, async () => { await loginAdmin(page, M1504RJ_ADMIN); });
  await step(2, async () => { await アーキタイプを検索する(page, `${基}-型`); });
  await step(3, async () => { 前 = { 甲: await 登録デッキ数(page, 甲), 乙: await 登録デッキ数(page, 乙) }; expect.soft(前, "一括編集前の登録デッキ数（型甲=1・型乙=0）").toEqual({ 甲: "1", 乙: "0" }); });
  await step(4, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); });
  await step(5, async () => { await l.選択(id).check(); await l.一括編集.click(); await expect(l.一括編集パネル, "一括編集のアコーディオン").toBeVisible(); });
  await step(6, async () => {
    await page.locator('input.toggle_bulk_update_check[name="change_flgs[archetype]"]').check();
    await page.locator('#bulk_edit_panel [name="admin_deck_bulk_update[archetype]"]').selectOption({ label: 乙 });
  });
  await step(7, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#bulk_update_execute").click()]); });
  await step(8, async () => { await アーキタイプを検索する(page, `${基}-型`); 後 = { 甲: await 登録デッキ数(page, 甲), 乙: await 登録デッキ数(page, 乙) }; });
  await expected(async () => {
    expect.soft(後.甲, "アーキタイプ「型甲」の登録デッキ数").toBe("0");
    expect.soft(後.乙, "アーキタイプ「型乙」の登録デッキ数").toBe("1");
  });
});
