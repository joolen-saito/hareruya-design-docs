/**
 * フロントの会員ログイン（ログインの送信の応答で成否を見る。ログイン後に移るトップの画面の表示を待たない）。
 *
 * 開発環境では、フロントのトップ（/ja/）だけが60秒を超えても返らない時間帯がある（2026-11-11 4〜5時・14〜17時、2026-11-12 4時半〜）。
 * ログインの送信（302）は1〜2秒で返り、ログイン状態のクッキーもその応答で付くのに、シードがトップの表示を待って落ちていた
 * （M05-01-002・003、M07-03-101・102・110・111・113・124）。ログインの成否は送信の応答（転送先がログイン画面でないこと）で確かめ、
 * トップの表示は待たずに、呼び出し側が次の画面を開く。
 *
 * ログインの後のトップへの移動は、アプリへ送らずにブラウザの中で空の画面を返す（トップを止める）。
 * ブラウザで移動を取り消しても、アプリはトップを作り続け、作り終えたときに、作り始めに読んだ会員のセッションを書き戻す
 * （セッションは Redis で、同時の要求の書き込みを待ち合わせない）。そのあいだに次の画面で作られたセッションの中身
 * （CSRF のトークン・注文手続きへ進めたカートの指定）が消える疑いがある。2026-11-13 に、ログインの約15〜40秒後に、
 * 買取カートへの4件目の追加が 403（CSRF のトークンが無効。F06-11-023・043）、ご注文手続きで配送方法を変えると
 * メッセージの無い購入エラー（ShoppingController::redirectTo の「購入処理中の受注が存在しません」。M05-11-019・067・112・221・198、F06-06-002）になった。
 */
import { expect, Page, Response, Route } from "@playwright/test";
import { BASE_URL } from "../../config/env";

/** トップ（/・/ja/・/en/）への GET か */
const トップか = (u: URL): boolean => /^\/((ja|en)\/?)?$/.test(u.pathname) && !u.search;

/**
 * 送る（ログインの送信）のあいだ、トップへの移動をアプリへ送らずに空の画面で返す。送ったあと、空の画面へ移り終えてから止めるのをやめる。
 * ログイン後の移動先がトップでなければ、何もしない（その画面はアプリが返す）。
 */
export async function トップを止めて送る(page: Page, 送る: () => Promise<Response>): Promise<Response> {
  const origin = new URL(BASE_URL).origin;
  const 止める = (u: URL) => u.origin === origin && トップか(u);
  const handler = async (route: Route) => {
    if (route.request().method() !== "GET" || !route.request().isNavigationRequest()) return route.fallback();
    await route.fulfill({ status: 200, contentType: "text/html; charset=UTF-8", body: "<!DOCTYPE html><html><head><title>E2E: ログイン後のトップは開かない</title></head><body></body></html>" });
  };
  await page.route(止める, handler);
  try {
    const r = await 送る();
    // ログインの応答の転送でトップへ移るなら、空の画面へ移り終えるまで待つ（止めるのをやめた後に、本物のトップへ送られないように）
    const to = r.headers()["location"] ?? "";
    if (r.status() >= 300 && r.status() < 400 && to && 止める(new URL(to, r.url()))) {
      await page.waitForURL((u) => 止める(u), { waitUntil: "load", timeout: 30_000 }).catch(() => undefined);
    }
    return r;
  } finally {
    await page.unroute(止める, handler);
  }
}

export async function フロントにログインする(page: Page, m: { メール: string; パスワード: string }, 言語 = "ja"): Promise<void> {
  await page.goto(`${BASE_URL}/${言語}/mypage/login`, { timeout: 60_000 });
  await page.waitForLoadState("domcontentloaded");
  const form = page.locator("form#login_mypage");
  await expect(form, "フロントのログイン画面").toBeVisible({ timeout: 30_000 });
  await form.locator('input[name="login_email"]').fill(m.メール);
  await form.locator('input[name="login_pass"]').fill(m.パスワード);
  // ログインのボタンは動きのある表示で位置が定まらないことがあるので、押す操作をボタンに直接送る
  const res = await トップを止めて送る(page, async () => (await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && /\/mypage\/login$/.test(new URL(r.url()).pathname), { timeout: 60_000 }),
    form.locator('button[type="submit"]').dispatchEvent("click"),
  ]))[0]);
  const location = res.headers()["location"] ?? "";
  if (res.status() !== 302 || /\/mypage\/login/.test(location)) {
    throw new Error(`フロントにログインできない（${m.メール}）: ログインの送信の応答 ${res.status()}・転送先「${location || "なし"}」`);
  }
}
