/**
 * F06-07 購入履歴詳細の画面シード。正本: cases/F06-07_seed_data.tsv
 * 会員A: フロントの会員情報登録で登録し、本登録のメールのURLを開いて本会員にする。管理画面の会員一覧で会員IDを控える。
 * メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { registerFrontMember } from "../pages/front/member_entry";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;
export const passwordOf = (番号: string): string => `Passw0rd-F0607-${番号}!F0607A-${番号}`;

for (const n of ["003", "004"]) {
  defineSeed(`S-F06-07-CASE-${n}`, async ({ browser, notes }: { browser: Browser; notes: { set: (k: string, v: string) => void } }) => {
    const メール = mailOf(`f0607-a-${n}`);
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      await registerFrontMember(await context.newPage(), { 姓: "結合", 名: "花子", セイ: "ケツゴウ", メイ: "ハナコ", メール, パスワード: passwordOf(n) });
    } finally { await context.close(); }
    const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await searchCustomer(page, メール);
      return resultCustomerId(page, メール);
    });
    if (!id) throw new Error(`登録した会員 ${メール} を会員一覧で探せない`);
    notes.set(`〔会員ID-F0607-${n}〕`, id);
  });
}
