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

/**
 * ログインの送信のあと、アプリはダッシュボードへ移す。ダッシュボードは売上の集計などの重い処理をし、共有の開発環境では
 * 30秒以上返らないことがある（2026-11-12。ほかの管理画面は1秒以内）。テストはログインのたびにダッシュボードを開いていて、
 * それ自体が環境の負荷になりうる。そこでログインの間だけ、ダッシュボードへの移動をブラウザの中で新着情報管理の一覧へ差し替え、
 * サーバーにダッシュボードを要求しない（ログイン後にダッシュボードの中身を確かめるテストは無い）。
 * E2E_LOGIN_SKIP_DASHBOARD=0 で、ダッシュボードへ移る元の動きに戻す。
 */
const skipDashboard = process.env.E2E_LOGIN_SKIP_DASHBOARD !== "0";
const isLoginPost = (u: URL): boolean => u.toString().split("?")[0] === adminUrl("/login");
const isDashboardUrl = (loc: string): boolean => {
  const url = new URL(loc, adminUrl("/login"));
  const base = new URL(adminUrl(""));
  return url.host === base.host && url.pathname.replace(/\/+$/, "") === base.pathname.replace(/\/+$/, "");
};

export async function loginAdmin(page: Page, account: Account): Promise<void> {
  await page.goto(adminUrl("/login"));
  await page.locator("#login_id").fill(account.loginId);
  await page.locator("#password").fill(account.password);
  // ログインの送信の応答（ダッシュボードへの転送）を受け取り、転送先だけを新着情報管理の一覧に書き換えて返す（Cookie などの見出しはそのまま）。
  // ブラウザが自動でたどる転送の先は差し替えられないので、送信の応答の側で書き換える
  const toNews = async (route: import("@playwright/test").Route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const res = await route.fetch({ maxRedirects: 0 });
    const headers = res.headers();
    if (res.status() >= 300 && res.status() < 400 && headers.location && isDashboardUrl(headers.location)) {
      return route.fulfill({ response: res, headers: { ...headers, location: adminUrl("/content/news") } });
    }
    return route.fulfill({ response: res });
  };
  if (skipDashboard) await page.route(isLoginPost, toNews);
  try {
    const [res] = await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.getByRole("button", { name: "ログイン" }).click(),
    ]);
    const why = `管理画面にログインできない（${account.loginId}）`;
    expect(res?.status() ?? 0, `${why}: 応答が異常`).toBeLessThan(400);
    await expect(page, why).not.toHaveURL(/\/login/);
    // ログイン後の画面だけにある表示（画面上部の「○○ 様」）
    await expect(page.locator("header, nav").first(), why).toContainText("様");
  } finally {
    if (skipDashboard) await page.unroute(isLoginPost, toNews).catch(() => undefined);
  }
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
