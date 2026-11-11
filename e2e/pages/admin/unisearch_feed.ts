/**
 * 商品管理「ユニサーチフィード作成」（/admin/product/unisearch/feed）と、公開側の検索への反映を待つ部品。
 *
 * - 「フィードファイルを更新する」は全商品を外部の商品検索サービス（ユニサーチ）へ裏で送る（unisearch:batch）。
 *   送っている最中に押すと「既に作成処理が実行中のため、今回の実行はスキップしました。」で送られない。
 *   画面で作った商品を確実に含めるため、「開始しました」が出るまで間を置いて押し直す。
 * - 開発環境では、送ってから公開側の検索に出るまで6分ほど（2026-11-11 夜に測った）。
 * - 管理画面は管理画面のホスト（adminUrl）で開く。フロントのホストで開くと、送信先が絶対アドレスのフォームが CSRF ではじかれる。
 * - 依頼者の決定（2026-11-11 夜）: 開発環境でユニサーチのフィード連携をしてよい。
 */
import { Browser, BrowserContext, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../../lib/session";

export const フィードの文言 = {
  開始: "ユニサーチフィードの作成を開始しました。",
  実行中: "既に作成処理が実行中のため、今回の実行はスキップしました。",
  失敗: "ユニサーチフィードの作成に失敗しました。",
} as const;

/** ログイン済みの管理画面のページで「フィードファイルを更新する」を押し、出た案内を返す */
export async function フィードを更新する(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/unisearch/feed"));
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: "フィードファイルを更新する" }).click(),
  ]);
  return (await page.locator(".alert").allInnerTexts()).join(" / ").replace(/\s+/g, " ").trim();
}

/** 送信が始まるまで（実行中なら間を置いて）押す。始まった時刻を返す。失敗の案内が出たら投げる */
export async function フィードを送る(browser: Browser, opts: { 待つ上限ミリ秒?: number; 間ミリ秒?: number } = {}): Promise<Date> {
  const limit = opts.待つ上限ミリ秒 ?? 40 * 60_000;
  const gap = opts.間ミリ秒 ?? 60_000;
  const t0 = Date.now();
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (;;) {
      const msg = await フィードを更新する(page);
      if (msg.includes(フィードの文言.開始)) return new Date();
      if (msg.includes(フィードの文言.失敗)) throw new Error(`ユニサーチフィードの作成に失敗した（案内: ${msg}）`);
      if (!msg.includes(フィードの文言.実行中)) throw new Error(`ユニサーチフィードの送信の案内が想定と違う（${msg}）`);
      if (Date.now() - t0 > limit) throw new Error(`ユニサーチフィードが ${Math.round(limit / 60000)} 分たっても実行中のまま（送れない）`);
      await page.waitForTimeout(gap);
    }
  });
}

/**
 * 公開側の検索で、判定 cond が真になるまで間を置いて確かめる（索引への反映を待つ）。
 * cond は新しいブラウザの場で毎回呼ぶ。上限を超えたら、最後の確かめの内容つきで投げる。
 */
export async function 索引への反映を待つ(
  browser: Browser,
  cond: (ctx: BrowserContext) => Promise<{ ok: boolean; 様子: string }>,
  opts: { 上限ミリ秒?: number; 間ミリ秒?: number; 何を?: string } = {},
): Promise<void> {
  const limit = opts.上限ミリ秒 ?? 30 * 60_000;
  const gap = opts.間ミリ秒 ?? 60_000;
  const t0 = Date.now();
  let last = "";
  for (;;) {
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx);
      const r = await cond(ctx);
      if (r.ok) return;
      last = r.様子;
    } finally {
      await ctx.close();
    }
    if (Date.now() - t0 > limit) throw new Error(`${opts.何を ?? "検索サービスの索引への反映"}が ${Math.round(limit / 60000)} 分たっても確かめられない（最後の様子: ${last}）`);
    await new Promise((r) => setTimeout(r, gap));
  }
}

/** よく使う形: フィードを送り、公開側の検索に cond が出るまで待つ */
export async function フィードを送って反映を待つ(
  browser: Browser,
  cond: (ctx: BrowserContext) => Promise<{ ok: boolean; 様子: string }>,
  何を = "検索サービスの索引への反映",
): Promise<void> {
  await フィードを送る(browser);
  await 索引への反映を待つ(browser, cond, { 何を });
}
