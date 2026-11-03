/** M09 で試験用に使うレイアウトの登録（レイアウト管理 → 新規作成） */
import { Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** レイアウトを登録して、登録後のレイアウトIDを返す */
export async function レイアウトを登録する(page: Page, v: { 名称: string; 端末種別: "PC" | "モバイル" | "スマートフォン" }): Promise<string> {
  await page.goto(adminUrl("/content/layout"), { waitUntil: "load" });
  await page.getByRole("link", { name: "新規作成" }).first().click({ timeout: 30_000 });
  await page.waitForLoadState("load");
  await page.locator("#admin_layout_name").fill(v.名称, { timeout: 30_000 });
  await page.locator("#admin_layout_DeviceType").selectOption({ label: v.端末種別 }, { timeout: 30_000 });
  await page.getByRole("button", { name: "登録", exact: true }).click({ timeout: 30_000 });
  await expect(page.locator(".alert-success"), `レイアウト「${v.名称}」の登録結果`).toBeVisible({ timeout: 60_000 });
  const m = /\/content\/layout\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`レイアウト「${v.名称}」を登録したが、編集画面に遷移しない（${page.url()}）`);
  return m[1];
}
