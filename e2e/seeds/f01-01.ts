/**
 * F01-01 本店ECTOP のシード。正本: cases/F01-01_seed_data.tsv
 * - 環境（ENV）・専用ブラウザ（BROWSER-*）: 作り方は無い（ブラウザは各ケースの新しい画面で、ログアウト・カート0件から始まる。表示の言語・幅は各ケースが開始時に設定する）。
 * - 会員（MEMBER-*）: フロントの新規会員登録画面で登録し（選手情報の英語氏名も入れる）、本登録のメールのURLを開いて本会員にし、管理画面の会員一覧で会員IDを控える。
 *   メールアドレスの前半には実行の印を付ける（lib/run_marker.ts）。パスワードには付けない。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { registerFrontMember } from "../pages/front/member_entry";
import { defineSeed } from "./current_seed";

export const 会員のメール = (n: string): string => `${rc(`f0101-member-${n}`)}@example.test`;
export const 会員のパスワード = (n: string): string => `Passw0rd-F0101-${n}!`;

/** 会員のログインID（メール）とパスワード。シード表が番号ごとに決めた形（印はメールの前半だけ） */
export function 会員の資格(n: string): { メール: string; パスワード: string } {
  if (["103", "104", "107"].includes(n)) return { メール: `${rc(`dpf0101-${n}`)}@example.test`, パスワード: `Passw0rd-F0101${n}` };
  if (/^12[3-8]$/.test(n)) return { メール: `${rc(`cbf0101-${n}`)}@example.test`, パスワード: `Passw0rd-CBF0101${n}` };
  return { メール: 会員のメール(n), パスワード: 会員のパスワード(n) };
}

export async function 会員を作る(browser: Browser, n: string): Promise<string> {
  const { メール, パスワード } = 会員の資格(n);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓: "試験", 名: `F0101-${n}`, セイ: "シケン", メイ: "エフゼロイチ", メール, パスワード, MTG姓: "Shiken", MTG名: "Member" });
  } finally { await context.close(); }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 共有の開発環境では、登録した直後の会員が会員一覧の検索にすぐ出ないことがある。見つからないときは間をおいて検索し直す
    let found: string | null = null;
    for (let i = 0; ; i++) {
      await searchCustomer(page, メール);
      found = await resultCustomerId(page, メール);
      if (found || i >= 5) break;
      await page.waitForTimeout(10_000);
    }
    return found;
  });
  if (!id) throw new Error(`登録した会員 ${メール} を会員一覧で探せない`);
  return id;
}

defineSeed("S-F01-01-ENV", async () => { /* 環境。最初の手順の画面が確かめる（本店の日本語版・英語版の本店TOPと言語区分なしのサイトルート） */ });
for (const n of ["001", "002", "003", "004", "005", "007", "031", "032"]) {
  defineSeed(`S-F01-01-BROWSER-${n}`, async () => { /* ログアウト・カート0件のブラウザ。ケースごとに新しいブラウザの画面で始まる */ });
}
for (const n of ["004", "005", "031"]) {
  defineSeed(`S-F01-01-MEMBER-${n}`, async ({ browser, notes }) => { notes.set(`〔会員ID-F0101-${n}〕`, await 会員を作る(browser, n)); });
}
