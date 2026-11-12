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

export type 試験会員 = { 姓: string; 名: string; セイ: string; メイ: string; 前半: string; パスワード: string;
  /** 省略すると 0300000000。ハイフンなしの10桁（市外局番2桁・局番4桁・番号4桁に分けて入れる） */
  電話番号?: string };

/** 会員を登録して本会員にし、会員IDを返す */
export async function 本会員を作る(browser: Browser, m: 試験会員): Promise<string> {
  const メール = markedMail(m.前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), {
      姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, メール, パスワード: m.パスワード,
      ...(m.電話番号 ? { 詳細: { 郵便番号1: "100", 郵便番号2: "0001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1",
        電話: [m.電話番号.slice(0, 2), m.電話番号.slice(2, 6), m.電話番号.slice(6)] as [string, string, string] } } : {}),
    });
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

import { 選手のスマレジ連携 } from "../db/f06_21";
import { スマレジ連携を外す } from "../db/f06_21_prep";
import { available } from "../lib/db";

export const スマレジ番号を外した注記 = "本会員として登録するとスマレジ会員番号が付くため、DBで実行の印つきの会員の選手情報のスマレジ会員番号を未設定に設定した（シード表は「スマレジ会員番号未設定」。仮会員機能の共有の設定は書き換えず、本会員として登録して作った。シード表の「仮会員機能を有効にして」は読み替え）";

/**
 * 本会員を作り、選手情報のスマレジ会員番号が付いていればDBで外す（スマレジ会員番号が「未設定」の会員が要るとき）。
 * 共有の設定（仮会員機能）は書き換えない。外したときは true を返す（呼び出し側が注記に残す）。DBを参照できない環境では外さない。
 */
export async function スマレジ会員番号なしの本会員を作る(browser: Browser, m: 試験会員): Promise<{ 会員ID: string; 外した: boolean }> {
  const 会員ID = await 本会員を作る(browser, m);
  if (!available) return { 会員ID, 外した: false };
  const メール = markedMail(m.前半);
  const s = 選手のスマレジ連携(メール);
  if (!s) throw new Error(`会員 ${メール} の選手情報が見つからない`);
  if (s.番号 === "" && s.存在フラグ !== "t") return { 会員ID, 外した: false };
  スマレジ連携を外す(メール);
  return { 会員ID, 外した: true };
}
