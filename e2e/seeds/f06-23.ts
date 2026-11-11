/**
 * F06-23 お問い合わせ履歴の画面シード。正本: cases/F06-23_seed_data.tsv
 * 会員（CASE-…）: フロントの会員情報登録で本会員として登録し（仮会員機能の共有の設定は書き換えない）、管理画面の会員一覧で会員IDを控える。
 * メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 *
 * お問い合わせ（履歴のあるシード）: 会員でログインして日本語版のお問い合わせ画面から1件ずつ送り、会員の履歴画面の先頭の行で番号を控える。
 * 送信日時は画面で指定できないので、DBで実行の印つきのお問い合わせの送信日時を設定する（db/f06_23_prep.ts。書き込みは writeTestData 経由）。
 * お問い合わせ種別（SUBJECT）: 共有のマスタ（MTGマスターデータ）へは書かない。お問い合わせ画面の件名の選択肢にある「商品について」（無ければ「その他のお問い合わせ」）を使い、
 *   その選択肢の値を種別IDとして控え、日本語・英語の表示名称を読んで、ケースの期待の「商品について」「About products」の代わりに比べる（読み替え）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { お問い合わせがある } from "../db/f06_23";
import { 送信日時を設定する } from "../db/f06_23_prep";
import { available } from "../lib/db";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { hideDebugToolbar } from "../lib/session";
import { ContactDetailPage, お問い合わせを送る } from "../pages/front/f06_24_contact_detail";
import { 件名の種別一覧 } from "../pages/front/f06_23_contact_history";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);
const 記す = (m: string) => reportCurrentSeedIssue(`シード作成時の問題: ${m}`);

for (const [n, 区分, 文字] of [["001", "a", "A"], ["002", "a", "A"], ["003", "a", "A"], ["004", "a", "A"], ["010", "c", "C"], ["011", "c", "C"], ["022", "d", "D"], ["023", "d", "D"], ["024", "d", "D"]] as const) {
  defineSeed(`S-F06-23-CASE-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0623-${n}〕`, await 本会員を作る(browser, { 姓: "F06-23", 名: `会員${文字}${n}`, セイ: "シケン", メイ: "カイイン", 前半: `f0623_member_${区分}-${n}`, パスワード: `F0623Pass${文字}${n}` }));
  });
}

// ---- お問い合わせ種別（既にある件名を使う） ----
const 件名の候補 = ["商品について", "その他のお問い合わせ"];
export type 種別 = { 種別ID: string; 日本語: string; 英語: string };
let 使う種別: 種別 | null = null;
/** お問い合わせに使う種別（SUBJECT のシードが決める） */
export function 種別の名称(): 種別 {
  if (!使う種別) throw new Error("お問い合わせ種別を、このシードがまだ決めていない（S-F06-23-SUBJECT）");
  return 使う種別;
}
async function frontPage<T>(browser: Browser, fn: (page: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    return await fn(await context.newPage());
  } finally { await context.close(); }
}
defineSeed("S-F06-23-SUBJECT", async ({ browser, notes }) => {
  const r = await frontPage(browser, async (page) => ({ ja: await 件名の種別一覧(page, "ja"), en: await 件名の種別一覧(page, "en") }));
  const ja = 件名の候補.map((c) => r.ja.find((o) => o.名称 === c)).find(Boolean);
  if (!ja) throw new Error(`お問い合わせ画面の件名に「${件名の候補.join("」「")}」が無い（${r.ja.map((o) => o.名称).join("、")}）`);
  const en = r.en.find((o) => o.種別ID === ja.種別ID);
  if (!en) throw new Error(`英語版のお問い合わせ画面に、種別ID ${ja.種別ID} の件名が無い`);
  使う種別 = { 種別ID: ja.種別ID, 日本語: ja.名称, 英語: en.名称 };
  notes.set("〔お問い合わせ種別ID-F0623-共有〕", ja.種別ID);
  記す(`お問い合わせ種別のマスタ（共有）は書き換えず、お問い合わせ画面の件名の選択肢にある「${ja.名称}」（英語名称「${en.名称}」）を使った。ケースの期待の「商品について」「About products」は、この日本語・英語の名称に読み替えて比べる（種別ID ${ja.種別ID}）`);
});

// ---- お問い合わせの履歴を持つ会員 ----
type 履歴 = { 内容: string; 日時: string };
type 会員 = { 呼び名: string; 前半: string; パスワード: string; 名: string; 送る順: 履歴[] };

const 履歴1: 履歴 = { 内容: "商品について\n確認したいです", 日時: "2026-08-01 09:05" };
const 履歴2: 履歴 = { 内容: "追加確認", 日時: "2026-08-03 11:20" };
const 履歴3: 履歴 = { 内容: "初回確認", 日時: "2026-08-02 10:10" };
const 履歴B: 履歴 = { 内容: "会員B確認", 日時: "2026-08-04 12:00" };

const A = (n: string, 送る順: 履歴[], 呼び名 = `〔会員ID-F0623-${n}〕`, 名 = "会員A"): 会員 => ({ 呼び名, 前半: `f0623_member_a-${n}`, パスワード: `F0623PassA${n}`, 名, 送る順 });
const B = (n: string, 送る順: 履歴[], 呼び名: string): 会員 => ({ 呼び名, 前半: `f0623_member_b-${n}`, パスワード: `F0623PassB${n}`, 名: "会員B", 送る順 });

/** 会員を登録し、お問い合わせを送る順に1件ずつ送って、送信日時を設定する */
async function 履歴のある会員(browser: Browser, notes: { set(l: string, v: string): void }, m: 会員, 種別名: string): Promise<void> {
  notes.set(m.呼び名, await 本会員を作る(browser, { 姓: "F06-23", 名: m.名, セイ: "シケン", メイ: "カイイン", 前半: m.前半, パスワード: m.パスワード }));
  const メール = mailOf(m.前半);
  await frontPage(browser, async (page) => {
    const h = new ContactDetailPage(page, "ja");
    await h.ログインする(メール, m.パスワード);
    if (/\/mypage\/login/.test(h.path)) throw new Error(`会員 ${メール} でログインできない`);
    for (const r of m.送る順) {
      await お問い合わせを送る(page, { 件名: 種別名, 姓: "試験", 名: m.名, 電話番号: ["090", "0000", "0623"], メール, 内容: r.内容 });
      await h.開く();
      const 番号 = await h.先頭の番号();
      if (!番号) throw new Error(`会員 ${メール} のお問い合わせ履歴画面に、送ったお問い合わせが出ない`);
      送信日時を設定する(番号, メール, r.日時);
    }
  });
}

function 履歴シード(seedId: string, 会員たち: 会員[], 追加?: () => void): void {
  defineSeed(seedId, { needs: ["S-F06-23-SUBJECT"] }, async ({ browser, notes }) => {
    if (!available) throw new Error("DB の接続が無い環境では、お問い合わせの送信日時を設定できない");
    追加?.();
    for (const m of 会員たち) await 履歴のある会員(browser, notes, m, 種別の名称().日本語);
    記す("送信日時は画面で指定できないので、DBで実行の印つきのお問い合わせの送信日時を、シード表の日時（日本時間）に設定した。お問い合わせは件名のマスタを書き換えず、既にある件名で送った");
    記す("仮会員機能（共有の設定）は書き換えず、会員は本会員として登録して作った（本登録のメールのURLは開かない）");
  });
}

for (const n of ["005", "008", "009"]) {
  履歴シード(`S-F06-23-CASE-${n}`, [A(n, [履歴3, 履歴2, 履歴1], `〔会員ID-F0623-${n}A〕`, n === "005" ? "会員" : "会員A"), B(n, [履歴B], `〔会員ID-F0623-${n}B〕`)]);
}
履歴シード("S-F06-23-CASE-006", [A("006", [履歴3, 履歴2, 履歴1])]);
for (const n of ["007", "012", "013", "014", "015", "017", "018", "019"]) 履歴シード(`S-F06-23-CASE-${n}`, [A(n, [履歴1])]);
履歴シード("S-F06-23-CASE-016", [A("016", [履歴1, 履歴2, 履歴3])]);
履歴シード("S-F06-23-CASE-020", [A("020", [履歴1])], () => {
  if (お問い合わせがある("999999")) throw new Error("お問い合わせ番号999999の行が既にある（共有のデータなので消さない。このケースの前提と違うので止める）");
});
履歴シード("S-F06-23-CASE-021", [
  A("021", [{ 内容: "会員A確認", 日時: "2026-08-01 09:05" }], "〔会員ID-F0623-021A〕"),
  B("021", [{ 内容: "会員B秘匿内容", 日時: "2026-08-04 12:00" }], "〔会員ID-F0623-021B〕"),
]);
履歴シード("S-F06-23-DPCASE-025", [{ 呼び名: "〔会員ID-F0623-025〕", 前半: "dpf0623-025-a", パスワード: "Passw0rd-F0623025", 名: "会員A", 送る順: [{ 内容: "確認をお願いします", 日時: "2026-08-01 09:05" }] }]);
