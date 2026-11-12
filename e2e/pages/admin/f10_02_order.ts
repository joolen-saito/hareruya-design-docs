/**
 * F10-02 購入完了の売上連携のケースが使う、管理画面の操作。セレクタはここだけに書く。
 * - 受注情報編集画面（受注IDを指定して開く）の「小計」（商品小計）を読む。画面: admin/Order/edit.twig
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** 受注情報編集画面を受注IDで開き、小計の欄の文を返す */
export async function 受注の小計を読む(page: Page, 受注ID: string): Promise<string> {
  await page.goto(adminUrl(`/order/${受注ID}/edit`), { waitUntil: "load", timeout: 60_000 });
  const row = page.locator("div.row").filter({ has: page.locator("span.align-middle", { hasText: /^\s*小計\s*$/ }) });
  await expect(row.first(), `受注ID ${受注ID} の受注情報編集画面の小計`).toBeVisible({ timeout: 30_000 });
  return ((await row.first().locator("span.h4").first().innerText()) ?? "").replace(/\s+/g, " ").trim();
}
