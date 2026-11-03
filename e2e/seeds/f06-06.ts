/**
 * F06-06 購入履歴一覧の画面シード。正本: cases/F06-06_seed_data.tsv
 *
 * - 会員: フロントの会員情報登録で登録し、本登録のメールのURLを開いて本会員にする。管理画面の会員検索一覧で会員IDを控える。
 *   メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 * - 注文（SORT・PAGE-11・NONE）: 会員が1件ずつフロントで注文し（販売中で在庫のある手元の商品1点）、管理画面の受注情報編集で「入金済み」へ変更する。注文番号と注文IDを控える。
 *   正本の外の補い: シード表は配送方法「ゆうパック」・支払方法「銀行振込」を選ぶと定めるが、手元の環境の共通の注文の部品（M05 のフロント注文）は銀行振込以外で
 *   外部の決済画面へ移らない支払方法（代金引換など）を選ぶ。購入履歴一覧に出る項目（注文番号・件数・並び）はこの違いに依らない。
 * - 注文が51件のシード（PAGE-51）と、商品・在庫を作る再購入のシード（REPURCHASE・OTHER-CUSTOMER）は、このセッションでは実装しない。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { OrderEditPage } from "../pages/admin/m05_11_order_edit";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { 会員が注文する } from "../pages/front/m05_front_order";
import { registerFrontMember } from "../pages/front/member_entry";
import { getSeed } from "../lib/catalog";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

async function 会員を作る(browser: Browser, メール: string, パスワード: string): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓: "試験会員", 名: "購入履歴", セイ: "シケンカイイン", メイ: "コウニュウリレキ", メール, パスワード });
  } finally { await context.close(); }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, メール);
    return resultCustomerId(page, メール);
  });
  if (!id) throw new Error(`登録した会員 ${メール} を会員一覧で探せない`);
  return id;
}

/** 注文を n 件、1件ずつ作る。それぞれ管理画面で入金済みへ変更する。(注文番号, 注文ID) を作った順に返す */
async function 注文を作る(browser: Browser, メール: string, パスワード: string, n: number, what: string): Promise<{ 番号: string; ID: string }[]> {
  const shop = await 本店の店名(browser);
  const out: { 番号: string; ID: string }[] = [];
  for (let i = 1; i <= n; i++) {
    const 番号 = await 会員が注文する(browser, { メール, パスワード }, `${what}の${i}件目`);
    const ID = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const p = new OrderEditPage(page);
      await p.openByOrderNo(番号, shop);
      const id = /\/order\/(\d+)\/edit/.exec(page.url())?.[1] ?? "";
      await p.ステータスを選ぶ("入金済み");
      await p.ステータスを変更する(() => undefined);
      return id;
    });
    out.push({ 番号, ID });
  }
  return out;
}

/** シード表が「控える」と書いた呼び名だけ控える */
function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

function 履歴のシード(seedId: string, 番号: string, 前半: string, パスワード: string, 件数: number, 呼び名: (i: number) => { 番号: string; ID: string }): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const メール = mailOf(前半);
    notes.set(`〔会員ID-F0606-${番号}〕`, await 会員を作る(browser, メール, パスワード));
    const orders = await 注文を作る(browser, メール, パスワード, 件数, seedId);
    orders.forEach((o, i) => {
      const n = 呼び名(i);
      控える(notes, seedId, n.番号, o.番号);
      控える(notes, seedId, n.ID, o.ID);
    });
  });
}

const abc = ["A", "B", "C"];
履歴のシード("S-F06-06-SORT-003", "003", "sort-f0606-003", "Pw-F0606-003!", 3, (i) => ({ 番号: `〔注文番号-F0606-003${abc[i]}〕`, ID: `〔注文ID-F0606-003${abc[i]}〕` }));
履歴のシード("S-F06-06-SORT-023", "023", "sort-f0606-023", "Pw-F0606-023!", 3, (i) => ({ 番号: `〔注文番号-F0606-023${abc[i]}〕`, ID: `〔注文ID-F0606-023${abc[i]}〕` }));
for (const n of ["004", "005", "006"]) {
  履歴のシード(`S-F06-06-PAGE-11-${n}`, n, `page11-f0606-${n}`, `Pw-F0606-${n}!`, 11, (i) => {
    const k = String(i + 1).padStart(2, "0");
    return { 番号: `〔注文番号-F0606-${n}-${k}〕`, ID: `〔注文ID-F0606-${n}-${k}〕` };
  });
}
defineSeed("S-F06-06-NONE-018", async ({ browser, notes }) => {
  notes.set("〔会員ID-F0606-018〕", await 会員を作る(browser, mailOf("none-f0606-018"), "Pw-F0606-018!"));
});
