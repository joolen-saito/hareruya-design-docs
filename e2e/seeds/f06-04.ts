/**
 * F06-04 パスワード再発行の画面シード。正本: cases/F06-04_seed_data.tsv
 *
 * - 会員（REG-A-…・REG-B-…）: 仮会員機能（共有の設定）を有効にして、フロントの会員登録で登録し、本登録のメールのURLを開いて本会員にする。
 *   管理画面の会員検索一覧で会員IDを控える。パスワード再発行は申し込まない。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 * - 仮会員（PROVISIONAL-…）: 同じ登録で、メールのURLを開かない。
 * - メール受信環境（MAILBOX）: 手元の環境のメール受け口を使う（メールアドレスの前半に実行の印を付けるので、開始時に宛先ごとの受信メールは0件）。
 *   受け口に届いているかを読むだけで、書き換えない。
 * - リセットキーを画面で指定できないシード（RESET-A-…・RESET-EXPIRED・RESET-PROVISIONAL・RESET-EQUAL・NOKEY）は、DBへ直接設定する作り方のため実装しない。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 仮会員機能が有効か } from "../db/f06_01";
import { available } from "../lib/db";
import { mailIds } from "../lib/mail";
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { readTempMember, setTempMember } from "../pages/admin/f06_masters";
import { EntryPage } from "../pages/front/f06_01_entry";
import { registerFrontMember } from "../pages/front/member_entry";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

// ---- 共有の設定: 仮会員機能（書き換える前の値を控え、ケースが終わるたびに戻す） ----
let 前の仮会員機能: boolean | null = null;
async function 仮会員機能を有効にする(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (前の仮会員機能 === null) 前の仮会員機能 = await readTempMember(page);
    await setTempMember(page, true);
  });
}
export async function 仮会員機能を戻す(browser: Browser): Promise<string> {
  if (前の仮会員機能 === null) return "";
  const 値 = 前の仮会員機能;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await setTempMember(page, 値); });
  if (!available) return "";
  const now = 仮会員機能が有効か();
  return now === 値 ? "" : `仮会員機能を ${値 ? "有効" : "無効"} に戻したが、DBの値は ${now ? "有効" : "無効"}`;
}

defineSeed("S-F06-04-MAILBOX", async () => {
  await mailIds(); // メールの受け口が読めること
});

/** 会員を登録し、管理画面で会員IDを控える。本会員にする（本登録のメールのURLを開く）かは registerFrontMember が仮会員機能の状態で決める */
async function 会員を作る(browser: Browser, 前半: string, パスワード: string, 仮会員のまま: boolean): Promise<string> {
  const mail = mailOf(前半);
  await 仮会員機能を有効にする(browser);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    if (仮会員のまま) await 仮会員で登録する(page, mail, パスワード);
    else await registerFrontMember(page, { 姓: "試験会員", 名: "再発行", セイ: "シケンカイイン", メイ: "サイハッコウ", メール: mail, パスワード });
  } finally { await context.close(); }
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, mail);
    const id = await resultCustomerId(page, mail);
    if (!id) throw new Error(`会員 ${mail} が管理画面の会員検索一覧で1件に定まらない`);
    return id;
  });
}

async function 仮会員で登録する(page: Page, mail: string, パスワード: string): Promise<void> {
  const e = new EntryPage(page);
  await e.open();
  await e.fill({
    姓: "試験会員", 名: "再発行", セイ: "シケンカイイン", メイ: "サイハッコウ", 生年月日: ["1990", "1", "1"], メール: mail, パスワード,
    国: "Japan", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話番号: "09062040000",
  });
  const r = await e.同意する();
  if (!r.sent) throw new Error(`会員 ${mail} の登録: 「同意する」を押しても確認画面へ進めない`);
  await e.登録する();
  if (!e.完了画面か) throw new Error(`会員 ${mail} の登録が仮会員登録完了画面にならない（${e.path}）`);
}

export const 本会員のパスワード = (番号: string): string => `BeforeMail!604A-${番号}`;

for (const n of ["004", "006", "014", "015", "016", "017", "061", "062"]) {
  defineSeed(`S-F06-04-REG-A-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0604-${n}〕`, await 会員を作る(browser, `f0604-a-${n}`, 本会員のパスワード(n), false));
  });
}
for (const n of ["009", "011"]) {
  defineSeed(`S-F06-04-PROVISIONAL-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0604-${n}〕`, await 会員を作る(browser, `f0604-temp-${n}`, `ProvPass!604-${n}`, true));
  });
}
