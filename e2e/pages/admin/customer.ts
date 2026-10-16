/** 会員管理（メニュー「会員管理」→「会員一覧」）で会員を探す（読むだけ） */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type 会員の状態 = "本会員" | "仮会員";

/** 会員一覧をメールアドレスで検索し、その会員の状態を返す。いなければ null。仮会員の行にだけ「仮会員メール再送」がある */
export async function customerStateByEmail(page: Page, メール: string): Promise<会員の状態 | null> {
  await page.goto(adminUrl("/customer"));
  await page.waitForLoadState("load");
  await page.locator('[name="admin_search_customer[multi]"]').fill(メール);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click(),
  ]);
  await page.waitForLoadState("load");
  const rows = page.locator('tr[id^="ex-customer-"]').filter({ has: page.locator("td", { hasText: new RegExp(`^\\s*${メール.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });
  const n = await rows.count();
  if (n === 0) return null;
  if (n > 1) throw new Error(`メールアドレス ${メール} の会員が ${n} 人いる`);
  return (await rows.locator('[data-bs-target^="#discontinuance_cus_"]').count()) > 0 ? "仮会員" : "本会員";
}
