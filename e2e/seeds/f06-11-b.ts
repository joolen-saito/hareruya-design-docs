/**
 * F06-11 買取履歴一覧の画面シード（-b）。正本: cases/F06-11_seed_data.tsv
 *
 * - 会員: フロントの会員登録 → 本登録のメールのURL → 管理画面の会員一覧で会員IDを控える（依頼者決定 2026-10-31）。メールの前半に実行の印を付ける。
 * - ネット買取: 会員でフロントにログインして買取の申込みを繰り返す。買取番号は、申込みの完了画面に出る番号を控える
 *   （シード表は管理画面の買取一覧の行から控えると定める。完了画面の番号と一覧の番号は同じ番号）。
 *   申込みに使う商品は、シード表が「任意の商品」とするものは手元の環境の買取できる商品を使う。商品名を定めるもの（CBORD）は、その名前の商品を画面で登録して使う（実行の印つき）。
 * - 店頭買取: フロントの店頭買取査定申込（会員としてログイン）。店舗は管理画面の店舗登録画面で作る（あれば内容を確かめて使う）。査定番号は完了画面から控える。
 * - 依頼日をDBで直接設定する手順（OWNERS の⑦・ADMINCANCEL の⑤）は行わない。依頼日はいずれも申込みの日（登録した日）になる。
 *   これらのシードを使うケースのうち、依頼日を確かめるものは実装しない。
 * - 商品名は実行の印つきで作る（rc）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 商品IDをコードから, 買取できる商品の候補 } from "../db/m07";
import { available } from "../lib/db";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 表示件数の選択肢 } from "../db/f06_11";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { OtcDetailPage, OtcListPage } from "../pages/admin/m06_otc_list";
import { ensureStore } from "../pages/admin/m04_24_store";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { Account } from "../lib/session";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { applyAsMember } from "../pages/front/m06_otc_buy";
import { 申込む, ログインする, 買取する商品を選ぶ, 複数を申込む } from "../pages/front/m07_net_buy";
import { 買取状況を設定する } from "./m07-common";
import { storeInput, 申込者の } from "./m06-common";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);
/** 買取履歴一覧に表示される買取番号（7桁） */
export const 表示の番号 = (n: string): string => String(Number(n)).padStart(7, "0");

export const OWNERS_STORE = storeInput("晴れる屋テスト店", "ハレルヤテストテン", "Hareruya Test Store", "f0611owners", "FWN");
export const OWNERS_URL = "f0611owners";

/** 実行中に控える商品名（呼び名 → 画面で選んだ商品の表示名） */
export const 商品名 = new Map<string, string>();

async function 会員を作る(browser: Browser, notes: { set(l: string, v: string): void }, 前半: string, パスワード: string, 会員IDの呼び名: string, 名: string): Promise<void> {
  notes.set(会員IDの呼び名, await 本会員を作る(browser, { 姓: "F06-11", 名, セイ: "シケン", メイ: "カイイン", 前半, パスワード }));
}

async function フロントのページ(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  return { context, page };
}

/** 会員でログインしてネット買取の申込みを回数だけ行い、買取番号（7桁・作った順）を返す。商品IDを渡さなければ手元の環境の買取できる商品を使う */
export async function ネット買取を申込む(browser: Browser, 前半: string, パスワード: string, 商品IDs: (string | null)[]): Promise<string[]> {
  const { context, page } = await フロントのページ(browser);
  try {
    await ログインする(page, { メール: mailOf(前半), パスワード });
    const out: string[] = [];
    for (const id of 商品IDs) out.push(表示の番号(await 申込む(page, id ?? (await 買取する商品を選ぶ(page)))));
    return out;
  } finally { await context.close(); }
}

/**
 * 会員でログインして店頭買取の申込みを回数だけ行い、買取履歴一覧に表示される買取番号（査定番号。作った順）を返す。
 * 完了画面の査定番号は末尾の連番（0001 など）で、買取履歴一覧の買取番号は「日付-店舗ID-連番」の形のため、連番が末尾に一致する一覧の番号を控える。
 */
export async function 店頭買取を申込む(browser: Browser, 支店URL: string, 前半: string, パスワード: string, 回数: number): Promise<string[]> {
  const 連番: string[] = [];
  // 申込みのあとは会員としてログインしたままになり、次の申込前ログイン画面がログアウトして開き直されるので、1回ごとに新しいブラウザセッションで申込む
  for (let i = 0; i < 回数; i++) {
    const { context, page } = await フロントのページ(browser);
    try {
      // 店舗を登録した直後は申込前ログイン画面が開けないことがあるので、ログイン欄が出るまで開き直して待つ
      for (let t = 0; t < 12; t++) {
        await page.goto(`${BASE_URL}/ja/otcbuy/${支店URL}/entry`, { timeout: 60_000 });
        await page.waitForLoadState("load");
        if ((await page.locator("form#login_otc_buy").count()) > 0) break;
        await page.waitForTimeout(5_000);
      }
      連番.push(await applyAsMember(page, 支店URL, { メール: mailOf(前半), パスワード }, 申込者の("F06-11", "店頭", "シケン", "テントウ")));
    } finally { await context.close(); }
  }
  const { context, page } = await フロントのページ(browser);
  try {
    await ログインする(page, { メール: mailOf(前半), パスワード });
    await page.goto(`${BASE_URL}/ja/mypage/purchase_history?pageSize=100`, { timeout: 60_000 });
    await page.waitForLoadState("load");
    const 一覧 = (await page.locator(".p-hareruya-history-list__box a.c-hareruya-link").allInnerTexts()).map((t) => t.trim());
    return 連番.map((q) => {
      const hit = 一覧.filter((t) => t.includes("-") && t.endsWith(`-${q}`));
      if (hit.length !== 1) throw new Error(`店頭買取の査定番号 ${q} に対応する買取履歴一覧の買取番号が1件に定まらない（${hit.join(", ")}）`);
      return hit[0];
    });
  } finally { await context.close(); }
}

/** 店舗を編集できる管理者（メンバー管理で登録。権限はシステム管理者。あれば内容を確かめて使う）。店頭買取のステータス変更は、買取店舗を編集できる管理者でしか保存できない */
export async function 店舗の管理者を用意する(browser: Browser, 店舗ID: string, ログインID: string): Promise<Account> {
  const account: Account = { loginId: ログインID, password: "Passw0rd-StoreAdm1" };
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMemberByStoreIds(page, { 名前: `${ログインID} 店舗管理者`, ログインID, メールアドレス: `${ログインID}@example.test`, パスワード: account.password, 権限: "システム管理者", 所属店舗ID: 店舗ID, デフォルト検索表示店舗ID: 店舗ID, 編集可能店舗ID: [店舗ID] });
  });
  return account;
}

export async function 店頭買取のステータスを変える(browser: Browser, 査定番号: string, 変更後: string, 管理者: Account = SETUP_ADMIN): Promise<void> {
  await withAdminSession(browser, 管理者, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new OtcListPage(page);
    await list.open();
    await list.日時を空にする();
    await list.買取店舗を選ぶ("");
    await list.査定IDを入れる(査定番号);
    await list.検索する();
    await list.詳細を開く(査定番号);
    await new OtcDetailPage(page).ステータスを変える(変更後);
  });
}

export async function 店舗を用意する(browser: Browser, v: ReturnType<typeof storeInput>, seedId: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureStore(page, v, (m) => reportSeedIssue(seedId, m));
  });
}

// ---- 共有: 会員A・会員B・店舗（依頼日のDB設定は行わない） ----
defineSeed("S-F06-11-OWNERS", async ({ browser, notes, seed }) => {
  await 会員を作る(browser, notes, "f0611-a", "F0611PwdOwnersA", "〔会員ID-F0611-共有A〕", "会員A");
  await 会員を作る(browser, notes, "f0611-b", "F0611PwdOwnersB", "〔会員ID-F0611-共有B〕", "会員B");
  notes.set("〔店舗ID-F0611-共有〕", await 店舗を用意する(browser, OWNERS_STORE, seed.シードID));
  notes.set("〔買取番号-F0611-共有A〕", (await ネット買取を申込む(browser, "f0611-a", "F0611PwdOwnersA", [null]))[0]);
  notes.set("〔買取番号-F0611-共有B〕", (await 店頭買取を申込む(browser, OWNERS_URL, "f0611-a", "F0611PwdOwnersA", 1))[0]);
  notes.set("〔買取番号-F0611-共有C〕", (await ネット買取を申込む(browser, "f0611-b", "F0611PwdOwnersB", [null]))[0]);
});

// ---- 参照マスタ（表示件数。初期データが正本の9行のままなら変更は要らない。作り方は無く、手元の環境がその状態であることを確かめる） ----
defineSeed("S-F06-11-PAGE-MASTER", async () => {
  if (!available) return;
  const 実際 = 表示件数の選択肢().join(",");
  const 正本 = "10,50,100,300,500,1000,2000,10000,12000";
  if (実際 !== 正本) throw new Error(`表示件数のマスタが ${実際}（シード表は ${正本}。マスタの書き換えはしない）`);
});

// ---- ページ送り（11件・5件） ----
for (const [n, 件数] of [["028", 11], ["029", 11], ["030", 11], ["031", 11], ["037", 5]] as const) {
  defineSeed(`S-F06-11-PAGELINK-${n}`, async ({ browser, notes, seed }) => {
    await 会員を作る(browser, notes, `f0611-${n}`, `F0611PwdCase${n}`, `〔会員ID-F0611-${n}〕`, `会員${n}`);
    const 番号 = await ネット買取を申込む(browser, `f0611-${n}`, `F0611PwdCase${n}`, Array.from({ length: 件数 }, () => null));
    // シード表は「〔…A〕〜〔…K〕」と範囲で書くので、書かれている呼び名（先頭と最後）だけを控える
    const 約束 = Notes.labelsIn(seed["状態・属性"] + seed.投入方法);
    番号.forEach((v, i) => { const l = `〔買取番号-F0611-${n}${String.fromCharCode(65 + i)}〕`; if (約束.includes(l)) notes.set(l, v); });
  });
}

// ---- 買取依頼内容 ----
async function 商品名を読む(browser: Browser, 商品ID: string): Promise<string> {
  const { context, page } = await フロントのページ(browser);
  try {
    await page.goto(`${BASE_URL}/ja/purchase/detail/${商品ID}`, { timeout: 60_000 });
    await page.waitForLoadState("load");
    return ((await page.locator("h1.p-hareruya-product-detail__title-text").first().innerText({ timeout: 30_000 })) ?? "").replace(/\s+/g, " ").trim();
  } finally { await context.close(); }
}
async function 商品IDを選ぶ(browser: Browser, 除く?: string): Promise<string> {
  const { context, page } = await フロントのページ(browser);
  try {
    const first = await 買取する商品を選ぶ(page);
    if (!除く) return first;
    for (const id of 買取できる商品の候補(30)) {
      if (id === 除く) continue;
      const res = await page.goto(`${BASE_URL}/ja/purchase/detail/${id}`, { timeout: 60_000 });
      await page.waitForLoadState("load");
      if ((res?.status() ?? 0) < 400 && (await page.locator("button.addCart.detail").count()) > 0) return id;
    }
    throw new Error("買取価格500円以上で、もう1件の買取できる商品が見つからない");
  } finally { await context.close(); }
}

defineSeed("S-F06-11-ITEM1-033", async ({ browser, notes }) => {
  await 会員を作る(browser, notes, "f0611-033", "F0611PwdCase033", "〔会員ID-F0611-033〕", "会員033");
  const 商品ID = await 商品IDを選ぶ(browser);
  商品名.set("〔商品名-F0611-033〕", await 商品名を読む(browser, 商品ID));
  notes.set("〔商品名-F0611-033〕", 商品名.get("〔商品名-F0611-033〕")!);
  notes.set("〔買取番号-F0611-033〕", (await ネット買取を申込む(browser, "f0611-033", "F0611PwdCase033", [商品ID]))[0]);
});

defineSeed("S-F06-11-ITEM2-034", async ({ browser, notes }) => {
  await 会員を作る(browser, notes, "f0611-034", "F0611PwdCase034", "〔会員ID-F0611-034〕", "会員034");
  const a = await 商品IDを選ぶ(browser);
  const b = await 商品IDを選ぶ(browser, a);
  notes.set("〔商品名-F0611-034A〕", await 商品名を読む(browser, a));
  notes.set("〔商品名-F0611-034B〕", await 商品名を読む(browser, b));
  // 1回の申込みに2商品を入れる
  const { context, page } = await フロントのページ(browser);
  try {
    await ログインする(page, { メール: mailOf("f0611-034"), パスワード: "F0611PwdCase034" });
    notes.set("〔買取番号-F0611-034〕", 表示の番号(await 複数を申込む(page, [{ 商品ID: a }, { 商品ID: b }])));
  } finally { await context.close(); }
});

// ---- 並び順（ネット買取2件） ----
function 並びのネット(seedId: string, n: string, 承諾にする: boolean): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const 前半 = `cbf0611-${n}`, パス = `Passw0rd-CBF0611${n}`;
    await 会員を作る(browser, notes, 前半, パス, `〔会員ID-F0611-${n}〕`, `会員${n}`);
    const コード = rc(`F0611-CB${n}-P1`), 名前 = rc(`F0611-CB${n}-Prod`);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await サプライ品を登録する(page, [{ コード, 名前, 基準価格: "1000", 買取価格: "1000" }], (m) => reportSeedIssue(seedIdOf(n), m));
    });
    const id = 商品IDをコードから(コード);
    if (!id) throw new Error(`申込みに使う商品 ${名前} が見つからない`);
    const 番号 = await ネット買取を申込む(browser, 前半, パス, [id, id]);
    notes.set(`〔買取番号-F0611-${n}A〕`, 番号[0]);
    notes.set(`〔買取番号-F0611-${n}B〕`, 番号[1]);
    if (承諾にする) await 買取状況を設定する(browser, [[番号[1], "査定内容承諾"]]);
  });
}
const seedIdOf = (n: string): string => `S-F06-11-CBORD-${n}`;
並びのネット("S-F06-11-CBORD-048", "048", true);
並びのネット("S-F06-11-CBORD-049", "049", false);

// ---- 店頭買取 ----
defineSeed("S-F06-11-STORE-032", { needs: ["S-F06-11-OWNERS"] }, async ({ browser, notes }) => {
  await 会員を作る(browser, notes, "f0611-032", "F0611PwdCase032", "〔会員ID-F0611-032〕", "会員032");
  notes.set("〔買取番号-F0611-032〕", (await 店頭買取を申込む(browser, OWNERS_URL, "f0611-032", "F0611PwdCase032", 1))[0]);
});

defineSeed("S-F06-11-ADMINCANCEL-024", async ({ browser, notes, seed }) => {
  await 会員を作る(browser, notes, "f0611-024", "F0611PwdCase024", "〔会員ID-F0611-024〕", "会員024");
  const v = storeInput("F0611-024-テスト店", "エフゼロロクイチイチゼロニヨンテストテン", "Case Twenty Four Store", "f0611case024", "FZ4");
  notes.set("〔店舗ID-F0611-024〕", await 店舗を用意する(browser, v, seed.シードID));
  const 番号 = await 店頭買取を申込む(browser, "f0611case024", "f0611-024", "F0611PwdCase024", 2);
  notes.set("〔買取番号-F0611-024A〕", 番号[0]);
  notes.set("〔買取番号-F0611-024B〕", 番号[1]);
  const 管理者 = await 店舗の管理者を用意する(browser, notes.get("〔店舗ID-F0611-024〕"), "f0611adm024");
  await 店頭買取のステータスを変える(browser, 番号[1], "管理者取消", 管理者);
});

for (const [n, 変える] of [["052", true], ["053", false]] as const) {
  defineSeed(`S-F06-11-CBORD-${n}`, { needs: ["S-F06-11-OWNERS"] }, async ({ browser, notes }) => {
    const 前半 = `cbf0611-${n}`, パス = `Passw0rd-CBF0611${n}`;
    await 会員を作る(browser, notes, 前半, パス, `〔会員ID-F0611-${n}〕`, `会員${n}`);
    const 番号 = await 店頭買取を申込む(browser, OWNERS_URL, 前半, パス, 2);
    notes.set(`〔買取番号-F0611-${n}A〕`, 番号[0]);
    notes.set(`〔買取番号-F0611-${n}B〕`, 番号[1]);
    if (変える) await 店頭買取のステータスを変える(browser, 番号[1], "査定中", await 店舗の管理者を用意する(browser, notes.get("〔店舗ID-F0611-共有〕"), "f0611admown"));
  });
}
