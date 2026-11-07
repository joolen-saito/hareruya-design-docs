/**
 * F06-07 購入履歴詳細 の画面シード（-b）。正本: cases/F06-07_seed_data.tsv
 * 既存の seeds/f06-07.ts（003・004。流し終えたもの）は変えない。
 *
 * - 会員A: フロントの会員登録 → 本登録のメールのURL → 管理画面の会員一覧で会員IDを控える。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 * - 注文: 会員がフロントで販売中の商品1点を注文し（共通の注文の部品。M05 のフロント注文）、管理画面の受注情報編集で、支払方法・受注ステータス・単価・住所3を
 *   シード表のとおりに整える。注文番号と注文IDを控える。
 * - 共通参照データ（REFERENCE）は、店舗・商品などを指定IDでDBへ登録するシード。DBへは書き込まない決まりのため作らない。
 *   実装するケースは、注文の店舗名・商品名・商品の値を確かめないもの（注文の店舗は本店、商品は手元の販売中の商品1点に代える。各ケースに注記）。
 * - 注文日・出荷日をDBへ直接設定する作り方は行わない（実装するケースは、注文日・出荷日の値を確かめないもの）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 先頭明細の単価を変える, ステータスを変える, 受注を開く, 住所3を入れる, 支払方法を変える, 入金日をクリアする } from "../pages/admin/f06_07_order";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { 会員が注文する } from "../pages/front/m05_front_order";
import { registerFrontMember } from "../pages/front/member_entry";
import { mailOf, passwordOf } from "./f06-07";

export { mailOf, passwordOf };

defineSeed("S-F06-07-REFERENCE", async () => {
  reportSeedIssue("S-F06-07-REFERENCE", "店舗（晴れる屋本店ほか）・商品（日本語商品A・English Product B）をDBで指定IDで登録することは行っていない。注文の店舗は本店、商品は手元の販売中の商品1点で代えた");
});

async function 会員を作る(browser: Browser, メール: string, パスワード: string, 姓 = "結合", 名 = "花子"): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓, 名, セイ: "ケツゴウ", メイ: "ハナコ", メール, パスワード });
  } finally { await context.close(); }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, メール);
    return resultCustomerId(page, メール);
  });
  if (!id) throw new Error(`登録した会員 ${メール} を会員一覧で探せない`);
  return id;
}

/**
 * 「クレジットカード」の支払方法。受注情報編集でSPLINKSのクレジットカード決済（決済プラグインの方法）に変えると、決済の状態が無い注文の編集画面を開くときに
 * システムエラーになる（アプリの動き）。このため、プラグインを使わない「クレジットカード決済（GMO）」の支払方法で代える（正本の外の補い。領収書の対象外の支払方法ではない）。
 */
const クレジット = "クレジットカード決済（GMO）";
export type 注文の整え = {
  支払方法?: string;
  /** 入金済み・出荷完了（入金済み）・出荷完了（未払い）・出荷指示（入金済み） */
  状態?: "入金済み" | "出荷完了" | "出荷完了(未払い)" | "出荷指示";
  単価を変える?: boolean;
  住所3?: [string, string];
};

async function 注文を作って整える(browser: Browser, メール: string, パスワード: string, what: string, 整え: 注文の整え): Promise<{ 番号: string; ID: string; 単価?: { 前: string; 後: string } }> {
  const 番号 = await 会員が注文する(browser, { メール, パスワード }, what);
  const shop = await 本店の店名(browser);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const { p, 注文ID } = await 受注を開く(page, 番号, shop);
    let 単価: { 前: string; 後: string } | undefined;
    if (整え.支払方法) {
      await 支払方法を変える(page, p, 整え.支払方法);
      if (整え.支払方法 === クレジット) reportSeedIssue(what, "支払方法の「クレジットカード」は、SPLINKSのクレジットカード決済に変えると受注情報編集の画面がシステムエラーになるため、プラグインを使わない「クレジットカード決済（GMO）」で代えた");
    }
    if (整え.単価を変える) 単価 = await 先頭明細の単価を変える(page, 注文ID);
    if (整え.住所3) await 住所3を入れる(page, 注文ID, 整え.住所3[0], 整え.住所3[1]);
    const s = 整え.状態;
    if (s === "入金済み" || s === "出荷完了" || s === "出荷指示") await ステータスを変える(page, 注文ID, "入金済み");
    if (s === "出荷完了") await ステータスを変える(page, 注文ID, "出荷完了");
    if (s === "出荷指示") await ステータスを変える(page, 注文ID, "出荷指示");
    if (s === "出荷完了(未払い)") {
      await ステータスを変える(page, 注文ID, "出荷完了");
      await 入金日をクリアする(page, 注文ID);
    }
    return { 番号, ID: 注文ID, 単価 };
  });
}

/** シード表が「控える」と書いた呼び名だけ控える */
function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

/** 注文を1件作るシード（会員A1人・注文1件）。単価を変えたシードは、前後の単価を注記用に返す */
export const 単価の変更 = new Map<string, { 前: string; 後: string }>();
function 注文のシード(seedId: string, 番号: string, 整え: 注文の整え): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const メール = mailOf(`f0607-a-${番号}`);
    const pw = passwordOf(番号);
    控える(notes, seedId, `〔会員ID-F0607-${番号}〕`, await 会員を作る(browser, メール, pw));
    const o = await 注文を作って整える(browser, メール, pw, seedId, 整え);
    控える(notes, seedId, `〔注文番号-F0607-${番号}〕`, o.番号);
    控える(notes, seedId, `〔注文ID-F0607-${番号}〕`, o.ID);
    if (o.単価) 単価の変更.set(seedId, o.単価);
  });
}
注文のシード("S-F06-07-CASE-002", "002", {});
注文のシード("S-F06-07-CASE-016", "016", {});
注文のシード("S-F06-07-CASE-017", "017", { 住所3: ["送主ビル3F", "届け先タワー8F"] });
注文のシード("S-F06-07-CASE-018", "018", {});
注文のシード("S-F06-07-CASE-019", "019", { 単価を変える: true });
注文のシード("S-F06-07-CASE-021", "021", { 支払方法: クレジット, 状態: "出荷完了(未払い)" });
注文のシード("S-F06-07-CASE-022", "022", { 支払方法: クレジット, 状態: "出荷指示" });
注文のシード("S-F06-07-CASE-024", "024", { 支払方法: クレジット, 状態: "出荷完了" });
注文のシード("S-F06-07-CASE-029", "029", {});
注文のシード("S-F06-07-SAMEPRICE-042", "042", {});
注文のシード("S-F06-07-CBRECEIPT-046", "046", { 支払方法: クレジット, 状態: "出荷完了" });

// 005: 会員Aだけ（注文ID 999999は未登録であることを、ケースがDBの参照で確かめる）
defineSeed("S-F06-07-CASE-005", async ({ browser, notes }) => {
  控える(notes, "S-F06-07-CASE-005", "〔会員ID-F0607-005〕", await 会員を作る(browser, mailOf("f0607-a-005"), passwordOf("005")));
});

// 023: 郵便振替・銀行振込・代金引換の注文3件
defineSeed("S-F06-07-CASE-023", async ({ browser, notes }) => {
  const メール = mailOf("f0607-a-023");
  const pw = passwordOf("023");
  控える(notes, "S-F06-07-CASE-023", "〔会員ID-F0607-023〕", await 会員を作る(browser, メール, pw));
  for (const [suf, 支払] of [["A", "郵便振替"], ["B", "銀行振込"], ["C", "代金引換"]] as const) {
    const o = await 注文を作って整える(browser, メール, pw, `S-F06-07-CASE-023${suf}`, { 支払方法: 支払, 状態: "出荷完了" });
    控える(notes, "S-F06-07-CASE-023", `〔注文番号-F0607-023${suf}〕`, o.番号);
    控える(notes, "S-F06-07-CASE-023", `〔注文ID-F0607-023${suf}〕`, o.ID);
  }
});

// 006: 会員A・会員Bの2会員。会員Bが注文する（会員Aが開く購入履歴詳細の注文）
export const 会員Bの注文: { ID?: string } = {};
defineSeed("S-F06-07-CASE-006", async ({ browser }) => {
  await 会員を作る(browser, mailOf("f0607-a-006"), passwordOf("006A"), "結合", "花子");
  const メールB = mailOf("f0607-b-006");
  const pwB = passwordOf("006B");
  await 会員を作る(browser, メールB, pwB, "結合", "太郎");
  const o = await 注文を作って整える(browser, メールB, pwB, "S-F06-07-CASE-006", {});
  会員Bの注文.ID = o.ID;
});
