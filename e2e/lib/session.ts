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

/**
 * 1回の起動（プロセス）の中で、管理者ごとのログイン状態（Cookie）を覚えておく（依頼者決定 2026-11-11「シードの使い回しを進めて」）。
 * シードの準備は1件の中で管理画面に7回ほどログインし直し、1回あたり約7秒（ログイン画面＋送信＋ダッシュボード）かかっていた。
 * 覚えた状態で開くときは、軽い管理画面（新着情報管理の一覧。約1秒・画面上部にログイン中の名前が出る）を開き、
 * ログイン画面へ移されたら（自動ログアウト・パスワードの変更など）その場でこれまでどおりログインする。
 * ログインし直したときは続きの処理がダッシュボードから始まり、使い回したときは新着情報管理の一覧から始まる（どちらも管理画面のログイン後の画面）。
 * E2E_ADMIN_SESSION_REUSE=0 で、毎回ログインする元の動きに戻す。
 */
const adminStates = new Map<string, Awaited<ReturnType<BrowserContext["storageState"]>>>();
const reuseAdminSession = process.env.E2E_ADMIN_SESSION_REUSE !== "0";

/** シードを画面から作るための、別のブラウザセッション（ケースのセッションを汚さない） */
export async function withAdminSession<T>(browser: Browser, account: Account, fn: (page: Page, context: BrowserContext) => Promise<T>): Promise<T> {
  const saved = reuseAdminSession ? adminStates.get(account.loginId) : undefined;
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, ...(saved ? { storageState: saved } : {}) });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    let loggedIn = false;
    if (saved) {
      const res = await page.goto(adminUrl("/content/news"), { timeout: 60_000 }).catch(() => null);
      loggedIn = !!res && res.ok() && !/\/login/.test(new URL(page.url()).pathname)
        && (await page.locator("header, nav").first().innerText().catch(() => "")).includes("様");
    }
    if (!loggedIn) {
      if (saved) await context.clearCookies();
      await loginAdmin(page, account);
    }
    const out = await fn(page, context);
    if (reuseAdminSession) adminStates.set(account.loginId, await context.storageState());
    return out;
  } catch (e) {
    adminStates.delete(account.loginId);
    throw e;
  } finally {
    await context.close();
  }
}
