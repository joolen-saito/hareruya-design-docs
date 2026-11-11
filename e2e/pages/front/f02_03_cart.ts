/**
 * F02-03 支店のカート表示のシード用: 新しいブラウザで支店サイトを開き、商品詳細画面で数量を入れて「カートに追加」を押す（入れた順）。
 * シード表の「ブラウザセッションをセッション識別子へ関連付ける」は DB で直接設定する作業だが、ここでは画面で作れる範囲で代える
 * （F02-02 と同じ。カートへ入れたブラウザの状態＝クッキーを、ケースのブラウザへ移して使う）。
 */
import { Browser, Cookie } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar } from "../../lib/session";
import { カートに入れる } from "./f04_shopping";

export type カートに入れる商品 = { 商品ID: string; 数量: number };
export type 試験カート = { cookies: Cookie[]; /** 支店トップのカートの商品数バッジ（入れた直後） */ 商品数: number };

export async function 支店のゲストカートを作る(browser: Browser, what: string, 支店URL: string, items: カートに入れる商品[]): Promise<試験カート> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await page.goto(`${BASE_URL}/ja/${支店URL}/`, { timeout: 60_000 });
    for (const it of items) await カートに入れる(page, `/${支店URL}`, it.商品ID, it.数量, `${what}: 商品ID ${it.商品ID}`);
    await page.goto(`${BASE_URL}/ja/${支店URL}/`, { timeout: 60_000 });
    await page.waitForLoadState("load");
    const badge = page.locator(".p-hareruya-header__nav-right-item--cart .p-hareruya-header__nav-right-badge").first();
    const text = (await badge.textContent({ timeout: 30_000 }).catch(() => null)) ?? "0";
    return { cookies: await context.cookies(), 商品数: Number(text.replace(/[^\d]/g, "")) };
  } finally { await context.close(); }
}
