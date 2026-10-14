/** 管理画面へのログイン。ケースの「新しいブラウザセッションで…ログイン」は、テストごとの新しいコンテキストで行う */
import { Browser, BrowserContext, Page, expect } from "@playwright/test";
import { ADMIN_ROUTE, BASE_URL } from "../config/env";

export type Account = { loginId: string; password: string };

export const adminUrl = (p = "") => `${BASE_URL}/${ADMIN_ROUTE}${p}`;

/**
 * 開発用のデバッグ表示（画面下のツールバー）は、ボタンを覆って押せなくする。試験の対象ではないので隠す。
 * 無い環境では何も起きない。
 */
export async function hideDebugToolbar(context: BrowserContext): Promise<void> {
  // ツールバーの中身は別の要求で読み込まれる。その要求を止めれば表示されない
  await context.route("**/_wdt/**", (route) => route.abort());
}

export async function loginAdmin(page: Page, account: Account): Promise<void> {
  await page.goto(adminUrl("/login"));
  await page.locator("#login_id").fill(account.loginId);
  await page.locator("#password").fill(account.password);
  const [res] = await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: "ログイン" }).click(),
  ]);
  const why = `管理画面にログインできない（${account.loginId}）`;
  expect(res?.status() ?? 0, `${why}: 応答が異常`).toBeLessThan(400);
  await expect(page, why).not.toHaveURL(/\/login/);
  // ログイン後の画面だけにある表示（画面上部の「○○ 様」）
  await expect(page.locator("header, nav").first(), why).toContainText("様");
}

/** シードを画面から作るための、別のブラウザセッション（ケースのセッションを汚さない） */
export async function withAdminSession<T>(browser: Browser, account: Account, fn: (page: Page, context: BrowserContext) => Promise<T>): Promise<T> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    await loginAdmin(page, account);
    return await fn(page, context);
  } finally {
    await context.close();
  }
}
