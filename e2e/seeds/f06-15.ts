/**
 * F06-15 買取履歴詳細の画面シード。正本: cases/F06-15_seed_data.tsv
 * 会員: フロントの会員登録で登録し本会員にする（シード表は管理画面で会員を新規登録すると定める。依頼者決定 2026-10-31 により画面の会員登録を使う）。パスワードは共通の「Passw0rd!F0615」。
 * ネット買取: シード表はグッズ商品CSVで「F0615-00N-商品」を作って申し込み、管理画面で買取状況を「査定中」にすると定める。商品は作らず、手元の環境の買取できる商品を使い、
 * 申込みまでを行って管理画面の状況変更はしない（正本の外の補い。条件付き）。申込みのあとマイページの買取履歴一覧に出る買取番号と、詳細のアドレスの番号を控える。
 * メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { Notes } from "../lib/notes";
import { getSeed } from "../lib/catalog";
import { defineSeed } from "../lib/seeds";
import { hideDebugToolbar } from "../lib/session";
import { 申込む, ログインする, 買取する商品を選ぶ } from "../pages/front/m07_net_buy";
import { 本会員を作る, markedMail } from "./f06-member";

export const PW = "Passw0rd!F0615";
export const mailOf = (前半: string): string => markedMail(前半);
/** 詳細のアドレスに入る番号（実行中に控える。呼び名 → 番号） */
export const 詳細の番号 = new Map<string, string>();

function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

async function 申込みをする(browser: Browser, メール: string): Promise<{ 買取番号: string; 詳細の番号: string }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await ログインする(page, { メール, パスワード: PW });
    const 商品 = await 買取する商品を選ぶ(page);
    const n = await 申込む(page, 商品);
    await page.goto(`${BASE_URL}/ja/mypage/purchase_history`, { timeout: 60_000 });
    await page.waitForLoadState("load");
    const href = await page.locator(".p-hareruya-history-list__box a.c-hareruya-link").first().getAttribute("href");
    const id = /\/net\/(\d+)/.exec(href ?? "")?.[1];
    if (!id) throw new Error(`買取履歴一覧の詳細のアドレスから番号を読めない（${href}）`);
    return { 買取番号: n, 詳細の番号: id };
  } finally { await context.close(); }
}

defineSeed("S-F06-15-COMMON", async () => { /* 共通パスワードの取り決め。会員の登録で入れる */ });

async function 会員と申込み(browser: Browser, notes: Notes, seedId: string, 前半: string, 会員IDの呼び名: string, 買取番号の呼び名: string | null, 申込む有無 = true): Promise<void> {
  const id = await 本会員を作る(browser, { 姓: "F0615", 名: 前半, セイ: "シケン", メイ: "カイイン", 前半, パスワード: PW });
  控える(notes, seedId, 会員IDの呼び名, id);
  if (!申込む有無 || !買取番号の呼び名) return;
  const r = await 申込みをする(browser, mailOf(前半));
  控える(notes, seedId, 買取番号の呼び名, r.買取番号);
  詳細の番号.set(買取番号の呼び名, r.詳細の番号);
}

defineSeed("S-F06-15-UNAUTH-001", async ({ browser, notes }) => { await 会員と申込み(browser, notes, "S-F06-15-UNAUTH-001", "f0615-001", "〔会員ID-F0615-001〕", "〔買取番号-F0615-001〕"); });
defineSeed("S-F06-15-OTHER-002", async ({ browser, notes }) => {
  await 会員と申込み(browser, notes, "S-F06-15-OTHER-002", "f0615-002-a", "〔会員ID-F0615-002A〕", null, false);
  await 会員と申込み(browser, notes, "S-F06-15-OTHER-002", "f0615-002-b", "〔会員ID-F0615-002B〕", "〔買取番号-F0615-002〕");
});
defineSeed("S-F06-15-NOTFOUND-003", async ({ browser, notes }) => { await 会員と申込み(browser, notes, "S-F06-15-NOTFOUND-003", "f0615-003", "〔会員ID-F0615-003〕", "〔買取番号-F0615-003〕"); });
defineSeed("S-F06-15-NOPARAM-004", async ({ browser, notes }) => { await 会員と申込み(browser, notes, "S-F06-15-NOPARAM-004", "f0615-004", "〔会員ID-F0615-004〕", "〔買取番号-F0615-004〕"); });
