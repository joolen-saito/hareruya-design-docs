/**
 * M11-03 権限管理の画面の読み取り。セレクタはここだけに書く。正本: cases/M11-03_test_cases.tsv
 * 権限管理画面は管理画面の設定 > システム設定の下にあり、権限（行）と権限URL（列）の表を持つ。
 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type 開いた結果 = { 応答: number; パス: string; ログイン画面か: boolean; 権限管理の表があるか: boolean };

/** 権限管理画面のURLをアドレス欄から直接開き、表示された画面を読む（ログインしていないときはログイン画面へ移る作り） */
export async function 権限管理画面のURLを開く(page: Page): Promise<開いた結果> {
  const res = await page.goto(adminUrl("/setting/system/authority"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  return {
    応答: res?.status() ?? 0,
    パス: new URL(page.url()).pathname,
    ログイン画面か: (await page.locator("#login_id").count()) > 0 && (await page.locator("#password").count()) > 0,
    権限管理の表があるか: (await page.locator("#table-authority").count()) > 0,
  };
}

/** 管理画面の左ナビゲーションの第1階層（ホーム以外の見出し）の表示名 */
export async function 左ナビの第1階層(page: Page): Promise<string[]> {
  const titles = await page.locator(".c-mainNavArea__navItemTitle span").allInnerTexts();
  return titles.map((t) => t.trim()).filter((t) => t.length > 0);
}

export type アドレスを開いた結果 = { 応答: number; パス: string; ログイン画面か: boolean };

/** 管理画面のパスをアドレス欄から直接開き、応答の状態と移った先を読む（画面の表示の有無は呼ぶ側が決める） */
export async function 管理画面のパスを開く(page: Page, パス: string): Promise<アドレスを開いた結果> {
  const res = await page.goto(adminUrl(パス), { timeout: 60_000 });
  await page.waitForLoadState("load");
  return {
    応答: res?.status() ?? 0,
    パス: new URL(page.url()).pathname,
    ログイン画面か: (await page.locator("#login_id").count()) > 0 && (await page.locator("#password").count()) > 0,
  };
}
