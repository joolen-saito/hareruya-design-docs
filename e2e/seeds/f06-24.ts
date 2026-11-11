/**
 * F06-24 お問い合わせ履歴詳細の画面シード。正本: cases/F06-24_seed_data.tsv
 *
 * 作り方:
 * - 会員（MEM-A・MEM-B）: 本店の新規会員登録画面で登録し、管理画面の会員登録/編集で本会員にする（pages/admin/member_activate.ts の「会員を登録して本会員にする」。
 *   共有の開発環境では本登録のメールを読めないため）。会員IDは管理画面の会員一覧で読む。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 * - お問い合わせ（INQ-A・INQ-B）: 会員でログインし、日本語版のお問い合わせ画面で送る。会員のお問い合わせ履歴画面の先頭の行のお問い合わせ番号を控える。
 *
 * DB での準備の扱い（PM 方針 2026-11-10。すべて「条件付き」として注記に残す）:
 * - ENV（画面定義の公開・表示用ファイルの配置）: 既にある設定なので書き換えず、本店ECTOP（日本語版・英語版）とお問い合わせ履歴（日本語版・英語版）が開けることを画面で確かめる。
 * - TYPE（お問い合わせ種別ID 624「商品について」「About Products」の投入）: 種別のマスタを作る画面が無い。お問い合わせ画面の件名の選択肢に「商品について」があればそれを、
 *   無ければ既にある「その他のお問い合わせ」を使う（種別の名称を確かめるケース 001・002 は実装しない）。
 * - INQ-A・INQ-B のお問い合わせ日時・電話番号の未設定・お問い合わせ詳細の未設定（DB へ直接設定）: 行わない。日時は送った時刻、電話番号は画面で入れた番号のまま
 *   （日時を確かめるケース 001・002 は実装しない）。
 * 作らないシード: NO-INQ（お問い合わせ番号999999の残りを DB で削除する。ケース 009 は実装しない）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar } from "../lib/session";
import { 会員を登録して本会員にする } from "../pages/admin/member_activate";
import { ContactDetailPage, お問い合わせを送る, 件名の選択肢 } from "../pages/front/f06_24_contact_detail";
import { markedMail } from "./f06-member";

type 会員 = { 前半: string; 名: string; メイ: string; パスワード: string };
const 会員A: 会員 = { 前半: "f0624-a", 名: "A", メイ: "エー", パスワード: "F0624Passw0rd!A" };
const 会員B: 会員 = { 前半: "f0624-b", 名: "B", メイ: "ビー", パスワード: "F0624Passw0rd!B" };

/** シード表のログインID（正本の値）に実行の印を付けたメールアドレスと、パスワード */
export const 試験会員A = (): { メール: string; パスワード: string } => ({ メール: markedMail(会員A.前半), パスワード: 会員A.パスワード });
export const 試験会員B = (): { メール: string; パスワード: string } => ({ メール: markedMail(会員B.前半), パスワード: 会員B.パスワード });
/** 試験会員のユーザ名（お名前の姓） */
export const 試験会員の姓 = "試験会員";

async function frontPage<T>(browser: Browser, fn: (page: import("@playwright/test").Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    return await fn(await context.newPage());
  } finally { await context.close(); }
}

// ---- 画面環境（確かめるだけ） ----

defineSeed("S-F06-24-ENV", async ({ browser, seed }) => {
  await frontPage(browser, async (page) => {
    for (const p of ["/ja/", "/en/", "/ja/contact/history", "/en/contact/history"]) {
      const res = await page.goto(`${BASE_URL}${p}`, { timeout: 60_000 });
      const s = res?.status() ?? 0;
      if (s >= 400) throw new Error(`${p.startsWith("/en") ? "英語版" : "日本語版"}の${p.includes("contact") ? "お問い合わせ履歴" : "本店ECTOP"}が開けない（応答 ${s}）`);
    }
  });
  reportSeedIssue(seed.シードID, "画面定義の公開・表示用ファイルの配置（DB での準備）は行わず、本店ECTOP とお問い合わせ履歴（日本語版・英語版。未ログインではログイン画面へ進む）が開けることを画面で確かめた（条件付き）");
});

// ---- 会員 ----

function defineMemberSeed(seedId: string, label: string, m: 会員): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const id = await 会員を登録して本会員にする(browser, {
      姓: 試験会員の姓, 名: m.名, セイ: "シケンカイイン", メイ: m.メイ, メール: markedMail(m.前半), パスワード: m.パスワード,
    }, (msg) => reportSeedIssue(seedId, msg));
    notes.set(label, id);
  });
}
defineMemberSeed("S-F06-24-MEM-A", "〔会員ID-F0624-共有A〕", 会員A);
defineMemberSeed("S-F06-24-MEM-B", "〔会員ID-F0624-共有B〕", 会員B);

// ---- お問い合わせ種別（既にある件名を使う） ----

const 件名の候補 = ["商品について", "その他のお問い合わせ"];
let 使う件名 = "";

/** お問い合わせに使う件名（TYPE のシードが決める） */
async function 件名を決める(browser: Browser): Promise<{ 件名: string; ある: string[] }> {
  const ある = await frontPage(browser, (page) => 件名の選択肢(page, "ja"));
  const 件名 = 件名の候補.find((c) => ある.includes(c));
  if (!件名) throw new Error(`お問い合わせ画面の件名に「${件名の候補.join("」「")}」が無い（${ある.join("、")}）`);
  return { 件名, ある };
}

defineSeed("S-F06-24-TYPE", async ({ browser, seed }) => {
  const r = await 件名を決める(browser);
  使う件名 = r.件名;
  reportSeedIssue(seed.シードID, r.件名 === "商品について"
    ? "お問い合わせ種別は DB で投入せず、お問い合わせ画面の件名に既にある「商品について」を使った（種別IDと英語名称は確かめていない。条件付き）"
    : `お問い合わせ種別「商品について」（種別ID 624）は DB で投入する作り方で、種別を作る画面が無い。お問い合わせ画面の件名に既にある「${r.件名}」で代えた（条件付き。件名の選択肢: ${r.ある.join("、")}）`);
});

// ---- お問い合わせ ----

function defineInquirySeed(seedId: string, o: { 会員: 会員; 会員シード: string; 番号: string; 姓: string; 名: string; 内容: string; 電話番号: [string, string, string] }): void {
  defineSeed(seedId, { needs: [o.会員シード, "S-F06-24-TYPE"] }, async ({ browser, notes }) => {
    if (!使う件名) 使う件名 = (await 件名を決める(browser)).件名;
    const メール = markedMail(o.会員.前半);
    const 番号 = await frontPage(browser, async (page) => {
      const h = new ContactDetailPage(page, "ja");
      await h.ログインする(メール, o.会員.パスワード);
      if (/\/mypage\/login/.test(h.path)) throw new Error(`会員 ${メール} でログインできない`);
      await お問い合わせを送る(page, { 件名: 使う件名, 姓: o.姓, 名: o.名, 電話番号: o.電話番号, メール, 内容: o.内容 });
      await h.開く();
      const n = await h.先頭の番号();
      if (!n) throw new Error(`会員 ${メール} のお問い合わせ履歴画面に、送ったお問い合わせが出ない`);
      return n;
    });
    notes.set(o.番号, 番号);
    reportSeedIssue(seedId, `お問い合わせを件名「${使う件名}」で送った（お問い合わせ番号 ${番号}）。シード表のお問い合わせ日時の指定・電話番号とお問い合わせ詳細の未設定（DB へ直接設定）は行っていない。日時は送った時刻、電話番号は画面で入れた ${o.電話番号.join("-")}（条件付き）`);
  });
}
defineInquirySeed("S-F06-24-INQ-A", {
  会員: 会員A, 会員シード: "S-F06-24-MEM-A", 番号: "〔お問い合わせ番号-F0624-共有A〕", 姓: "山田", 名: "太郎", 内容: "第一行\n第二行", 電話番号: ["090", "0000", "0624"],
});
defineInquirySeed("S-F06-24-INQ-B", {
  会員: 会員B, 会員シード: "S-F06-24-MEM-B", 番号: "〔お問い合わせ番号-F0624-共有B〕", 姓: "鈴木", 名: "花子", 内容: "会員B秘匿内容", 電話番号: ["090", "0000", "0625"],
});
