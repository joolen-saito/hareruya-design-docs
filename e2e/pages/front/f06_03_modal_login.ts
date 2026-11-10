/**
 * F06-03 ログインの続き（-b）の画面操作。商品詳細の「入荷時に通知」「お気に入りに追加する」から開くログインモーダルでのログインと、
 * ログイン状態の保持（ブラウザを閉じて開き直した状態）の用意。セレクタはここだけに書く。正本: cases/F06-03_test_cases.tsv
 */
import { Browser, BrowserContext, Cookie, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar } from "../../lib/session";
import { LoginPage } from "./f06_03_login";

export type モーダルの種類 = "入荷時に通知" | "お気に入り";
const フォーム: Record<モーダルの種類, string> = { 入荷時に通知: "#notify-login-form", お気に入り: "#favorite-login-form" };

/**
 * ログインモーダルにメールアドレスとパスワードを入れて「ログイン」を押し、画面が移るのを待つ。
 * モーダルの送信は画面のスクリプトが受け、ログイン画面が返るとログイン画面へ移す作り。移らなければ待ちの上限で戻る。
 * 戻り値は、押したあとに移った先のパス（移らなければ商品詳細のまま）。
 */
export async function モーダルでログインを押す(page: Page, 種類: モーダルの種類, mail: string, password: string, waitMs = 30_000): Promise<string> {
  // お気に入りのログインモーダルはヘッダと商品詳細の両方に同じ名前で置かれるので、見えている方を使う
  const form = page.locator(`${フォーム[種類]}:visible`).first();
  await expect(form, `${種類}のログインモーダルの入力欄`).toBeVisible();
  await form.locator('input[name="login_email"]').fill(mail);
  await form.locator('input[name="login_pass"]').fill(password);
  const before = page.url();
  await form.locator('button[type="submit"]').click();
  await page.waitForURL((u) => u.toString() !== before, { timeout: waitMs }).catch(() => undefined);
  await page.waitForLoadState("load");
  return new URL(page.url()).pathname;
}

/** ログイン状態を保持する Cookie（名前で見分ける） */
export const 保持のCookieか = (c: { name: string }): boolean => /remember_?me/i.test(c.name);

/**
 * 「専用ブラウザで保持を有効にしてログインし、ブラウザを終了して同じプロファイルで開き直した」状態を、渡されたブラウザに作る。
 * 別のブラウザでログインしてそのブラウザを閉じ、ブラウザを閉じても残る Cookie（有効期限のあるもの）だけを、Cookie を消した渡されたブラウザへ移す。
 * 閉じると消える Cookie（有効期限の無いもの＝セッション）は移さない。保持の Cookie が無ければ落とす（事前準備の状態を作れない）。
 */
export async function 保持したまま開き直した状態にする(browser: Browser, target: BrowserContext, mail: string, password: string): Promise<{ 移した: string[]; 消えた: string[] }> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let cookies: Cookie[] = [];
  try {
    await hideDebugToolbar(ctx);
    const l = new LoginPage(await ctx.newPage());
    await l.ログイン画面を開く();
    await l.ログインする(mail, password);
    cookies = await ctx.cookies();
  } finally { await ctx.close(); }
  const 残る = cookies.filter((c) => c.expires > 0);
  const 消える = cookies.filter((c) => !(c.expires > 0));
  if (!残る.some(保持のCookieか)) {
    throw new Error(`保持を有効にしてログインしても、ログイン状態を保持する Cookie が発行されない（発行された Cookie: ${cookies.map((c) => c.name).join("、") || "なし"}）。事前準備の「保持Cookieあり」の状態を作れない`);
  }
  await target.clearCookies();
  await target.addCookies(残る);
  return { 移した: 残る.map((c) => c.name), 消えた: 消える.map((c) => c.name) };
}
