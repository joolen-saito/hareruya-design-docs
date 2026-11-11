/**
 * F06 の画面シードが共有して使う、試験会員の作り方（フロントの会員情報登録 → 本登録のメールのURL → 管理画面の会員一覧で会員IDを控える）。
 * メールアドレスの前半には呼び出し側が実行の印を付ける（依頼者決定 2026-10-28）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { registerFrontMember } from "../pages/front/member_entry";

/** メールアドレス（前半に実行の印を付ける） */
export const markedMail = (前半: string): string => `${rc(前半)}@example.test`;

export type 試験会員 = { 姓: string; 名: string; セイ: string; メイ: string; 前半: string; パスワード: string };

/** 会員を登録して本会員にし、会員IDを返す */
export async function 本会員を作る(browser: Browser, m: 試験会員): Promise<string> {
  const メール = markedMail(m.前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, メール, パスワード: m.パスワード });
  } finally { await context.close(); }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 共有の開発環境では、フロントで登録した直後の会員が会員一覧の検索にすぐ出ないことがある。見つからないときは間をおいて検索し直す（最大で約1分）
    let found: string | null = null;
    for (let i = 0; ; i++) {
      await searchCustomer(page, メール);
      found = await resultCustomerId(page, メール);
      if (found || i >= 5) break;
      await page.waitForTimeout(10_000);
    }
    return found;
  });
  if (!id) throw new Error(`登録した会員 ${メール} を会員一覧で探せない（約1分おいて検索し直しても同じ）`);
  return id;
}

// ---- 仮会員のまま登録し、本登録のメールのURLは開かず、管理画面で本会員にする（スマレジ会員番号を設定させない作り方） ----
import { EntryPage } from "../pages/front/f06_01_entry";
import { 仮会員機能が有効か } from "../db/f06_01";
import { available } from "../lib/db";
import { readTempMember, setTempMember } from "../pages/admin/f06_masters";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { openEditFromResult } from "../pages/admin/f06_customer";

/**
 * 仮会員機能（共有の設定）を有効にして会員を仮会員として登録し、管理画面で本会員にする。仮会員機能は登録のあいだだけ有効にし、元の値へ戻してDBの参照で確かめる。
 * 本登録のメールのURLは開かない。
 */
export async function 仮登録から本会員にする(browser: Browser, m: 試験会員 & { 電話番号: string }): Promise<string> {
  const メール = markedMail(m.前半);
  const 前 = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const v = await readTempMember(page);
    await setTempMember(page, true);
    return v;
  });
  try {
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      const e = new EntryPage(await context.newPage());
      await e.open();
      await e.fill({
        姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, 生年月日: ["1990", "1", "1"], メール, パスワード: m.パスワード,
        国: "Japan", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話番号: m.電話番号,
      });
      if (!(await e.同意する()).sent) throw new Error(`会員 ${メール} の登録: 「同意する」を押しても確認画面へ進めない`);
      await e.登録する();
      if (!e.完了画面か) throw new Error(`会員 ${メール} の登録が仮会員登録完了画面にならない（${e.path}）`);
    } finally { await context.close(); }
  } finally {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await setTempMember(page, 前); });
    if (available && 仮会員機能が有効か() !== 前) throw new Error(`仮会員機能を元の値（${前 ? "有効" : "無効"}）へ戻せていない`);
  }
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, メール);
    const id = await resultCustomerId(page, メール);
    if (!id) throw new Error(`会員 ${メール} が管理画面の会員一覧で1件に定まらない`);
    await openEditFromResult(page, メール);
    const ed = new M08CustomerEditPage(page);
    await ed.選ぶ("status", "本会員");
    await ed.登録する();
    if (!(await ed.成功メッセージ())) throw new Error(`会員 ${メール} を本会員にする保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
    return id;
  });
}
