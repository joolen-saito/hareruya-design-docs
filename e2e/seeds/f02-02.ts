/**
 * F02-02 本店のスマホ版ナビゲーションの画面シード。正本: cases/F02-02_seed_data.tsv
 *
 * - S-F02-02-ENV（環境）: 作る操作が無い。シード表は、共有の開発環境では本店の基本設定・ページ管理・ユニサーチの接続設定を書き換えず、
 *   環境の値を使うと定めるので、何も書き換えない（最初の手順の画面が、各画面を開けることを確かめる）。
 * - S-F02-02-CARDSETS-002・003: 管理画面のカードセット詳細（登録）で2件ずつ登録し、URL の末尾のカードセットIDを控える
 *   （pages/admin/product_masters.ts の ensureCardset。リリース日は登録当日）。カードセット名・略称に実行の印を付ける（依頼者決定 2026-10-28。
 *   ケースはカードセット名の書式を確かめない）。登録後、スマホ表示の本店ECTOPのカードセット選択メニューに2件とも出ることを確かめる。
 * - S-F02-02-CBMEMBER-070: フロントの会員登録で登録し、本登録のメールのURLを開いて本会員にする（依頼者決定 2026-10-31。シード表の
 *   「管理画面で本会員にする」の代わりに本登録のメールで本会員にする。どちらも本会員になる）。メールの前半に実行の印。
 *   そのあとログインしてお気に入り商品一覧が0件であることを確かめ、ログアウトする。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, loginAdmin } from "../lib/session";
import { ensureCardset } from "../pages/admin/product_masters";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { SpNavPage } from "../pages/front/f02_02_sp_nav";
import { markedMail, 本会員を作る } from "./f06-member";

/** スマホの端末（spec の test.use と同じ値。シードの中で別に開くブラウザにも使う） */
export const スマホ = {
  viewport: { width: 390, height: 844 },
  screen: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

defineSeed("S-F02-02-ENV", async () => { /* 環境。共有の開発環境では書き換えない（シード表）。最初の手順の画面が確かめる */ });

/** カードセットの名前（正本の値に実行の印） */
export const カードセット名 = (正本の名前: string): string => rc(正本の名前);

/**
 * 管理画面を PC の画面で開いて操作する。spec の test.use（スマホの端末）はテストの中で作るブラウザにも引き継がれ、
 * 管理画面がスマホの画面幅で開いて「登録」ボタンが押せなかった（2026-11-10 の開発環境の流し）。管理画面は PC の画面・端末の印で開く。
 */
async function PCの管理画面で<T>(browser: Browser, account: Account, fn: (page: import("@playwright/test").Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext({
    baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    await loginAdmin(page, account);
    return await fn(page);
  } finally { await context.close(); }
}

async function スマホで開いて選択肢を読む(browser: Browser): Promise<string[]> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, ...スマホ });
  try {
    await hideDebugToolbar(ctx);
    const nav = new SpNavPage(await ctx.newPage());
    await nav.トップを開く("ja");
    await nav.押す(nav.カードセット選択メニュー(), "カードセット選択メニュー");
    return await nav.選択肢に出ているカードセット();
  } finally { await ctx.close(); }
}

for (const n of ["002", "003"]) {
  const seedId = `S-F02-02-CARDSETS-${n}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 組 = [["A", `テストセットA-${n}-F0202`, `SET-A-${n}-F0202`], ["B", `テストセットB-${n}-F0202`, `SET-B-${n}-F0202`]] as const;
    await PCの管理画面で(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const [k, 名前, 略称] of 組) {
        const id = await ensureCardset(page, カードセット名(名前), カードセット名(名前), rc(略称), issue);
        notes.set(`〔カードセットID-F0202-${n}${k}〕`, id);
      }
    });
    const 出ている = await スマホで開いて選択肢を読む(browser);
    for (const [, 名前] of 組) {
      if (!出ている.includes(カードセット名(名前))) throw new Error(`登録したカードセット「${カードセット名(名前)}」が、本店ECTOPのカードセット選択メニューに出ない`);
    }
  });
}

defineSeed("S-F02-02-CBMEMBER-070", async ({ browser }) => {
  const m = { 姓: "お気に入り0件会員", 名: "F0202-CB070", セイ: "オキニイリ", メイ: "ゼロケン", 前半: "cbf0202-070", パスワード: "Passw0rd-CBF0202070" };
  await 本会員を作る(browser, m);
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const fav = new FrontFavorite(await ctx.newPage());
    await fav.login(markedMail(m.前半), m.パスワード);
    await fav.openFavoriteList();
    const n = await fav.一覧のカード.count();
    if (n !== 0) throw new Error(`会員 ${markedMail(m.前半)} のお気に入り商品一覧に ${n} 件ある（0件のはず）`);
    await fav.logout();
  } finally { await ctx.close(); }
});
