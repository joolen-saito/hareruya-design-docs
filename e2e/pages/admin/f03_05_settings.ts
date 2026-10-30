/** F03-05 商品リコメンドの試験で使う管理画面の操作: 追加システム設定のレコメンド検索期間（日数）（共有の設定） */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const ADD_SYSTEM = "/setting/shop/additional_system";
const FIELD = '[name="add_system[recommend_search_days]"]';

/** 追加システム設定のレコメンド検索期間（日数）の、いまの値 */
export async function readRecommendDays(page: Page): Promise<string> {
  await page.goto(adminUrl(ADD_SYSTEM));
  await page.waitForLoadState("load");
  return page.locator(FIELD).inputValue();
}

/** 追加システム設定のレコメンド検索期間（日数）を設定して登録する */
export async function setRecommendDays(page: Page, value: string): Promise<void> {
  await page.goto(adminUrl(ADD_SYSTEM));
  await page.waitForLoadState("load");
  const input = page.locator(FIELD);
  await input.fill(value);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('form#point_form button[type="submit"]').click()]);
  await expectSaved(page, `追加システム設定のレコメンド検索期間を ${value} 日にする`);
  expect(await input.inputValue(), "登録後のレコメンド検索期間（日数）").toBe(value);
}
