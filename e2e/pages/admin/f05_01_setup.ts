/**
 * F05-01 ネット買取トップページの試験で使う管理画面の操作。
 * まとめて買取商品IDは、追加システム設定の画面（設定 > 店舗設定 > 追加システム設定）の欄で設定する
 * （アプリの Admin/Setting/Shop/additional_system.twig・AdditionalSystemFormType で確かめた。空も保存できる文字の欄）。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const ADD_SYSTEM = "/setting/shop/additional_system";
const BULK_FIELD = '[name="add_system[bulk_purchase_id]"]';

/** 追加システム設定を開き、まとめて買取商品IDの欄の、いまの値を返す（欄が無ければ落とす） */
export async function まとめて買取商品IDを読む(page: Page): Promise<string> {
  await page.goto(adminUrl(ADD_SYSTEM));
  await page.waitForLoadState("load");
  const input = page.locator(BULK_FIELD);
  await expect(input, "追加システム設定のまとめて買取商品IDの欄").toBeVisible();
  return input.inputValue();
}

/** 追加システム設定のまとめて買取商品IDに値を入れて登録し、保存の結果と登録後の値を確かめる。画面の警告を返す */
export async function まとめて買取商品IDを設定する(page: Page, 商品ID: string): Promise<string[]> {
  await まとめて買取商品IDを読む(page);
  const input = page.locator(BULK_FIELD);
  await input.fill(商品ID);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('form#point_form button[type="submit"]').click()]);
  const warnings = await expectSaved(page, `追加システム設定のまとめて買取商品IDを ${商品ID} にする`);
  expect(await page.locator(BULK_FIELD).inputValue(), "登録後のまとめて買取商品ID").toBe(商品ID);
  return warnings;
}

/** 店舗基本設定（設定 > 店舗設定 > 基本設定）を開き、いまの店名（ショップ名）を読む。読むだけで、書き換えない */
export async function 店名を読む(page: Page): Promise<string> {
  await page.goto(adminUrl("/setting/shop"));
  await page.waitForLoadState("load");
  const input = page.locator('[name="shop_master[shop_name]"]');
  await expect(input, "基本設定の店名の欄").toBeVisible();
  return (await input.inputValue()).trim();
}
