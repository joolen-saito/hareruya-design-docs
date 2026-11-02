/** M06-04 の試験で使う、会員一覧（メニュー「会員管理」）で会員IDを読む操作 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** 会員一覧でメールアドレスを検索し、その行の会員IDを返す。無ければ null */
export async function customerIdByEmail(page: Page, メール: string): Promise<string | null> {
  await page.goto(adminUrl("/customer"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await page.locator('[name="admin_search_customer[multi]"]').fill(メール, { timeout: 30_000 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click({ timeout: 30_000 }),
  ]);
  await page.waitForLoadState("load");
  const rows = page.locator('tr[id^="ex-customer-"]').filter({ has: page.locator("td", { hasText: new RegExp(`^\\s*${メール.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });
  const n = await rows.count();
  if (n === 0) return null;
  if (n > 1) throw new Error(`メールアドレス ${メール} の会員が ${n} 人いる`);
  return ((await rows.first().getAttribute("id")) ?? "").replace("ex-customer-", "");
}
