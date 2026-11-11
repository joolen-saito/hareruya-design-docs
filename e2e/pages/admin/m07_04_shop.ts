/**
 * 追加システム設定（メニュー「設定」→「基本情報設定」→「追加システム設定」）。M07-04 が買取用メール送信元アドレスを設定・復元するための操作。
 * 画面の全項目の値を読み、画面から書き戻す。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const ADD_SYSTEM = "/setting/shop/additional_system";
export type 設定値 = Record<string, string>;

async function 開く(page: Page): Promise<void> {
  await page.goto(adminUrl(ADD_SYSTEM));
  await page.waitForLoadState("load");
  await expect(page.locator('[name="add_system[purchase_mail_address]"]'), "追加システム設定の買取用メール送信元アドレス欄").toBeVisible({ timeout: 30_000 });
}

/** 画面の全項目（トークンを除く）の値 */
export async function 追加システム設定を読む(page: Page): Promise<設定値> {
  await 開く(page);
  return page.evaluate(() => {
    const out: Record<string, string> = {};
    for (const e of Array.from(document.querySelectorAll<HTMLInputElement>("form#point_form input, form#point_form select, form#point_form textarea"))) {
      if (!e.name || e.name.endsWith("[_token]")) continue;
      out[e.name] = e.value;
    }
    return out;
  });
}

/** 指定した項目（画面の項目名 → 値）を入れて登録する。全項目を書き戻すときは全部渡す */
export async function 追加システム設定を書く(page: Page, v: 設定値, what: string): Promise<void> {
  await 開く(page);
  for (const [name, val] of Object.entries(v)) await page.locator(`[name="${name}"]`).fill(val, { timeout: 30_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('form#point_form button[type="submit"]').click({ timeout: 30_000 })]);
  await expectSaved(page, what);
}

export const 買取用メール送信元の項目 = "add_system[purchase_mail_address]";
