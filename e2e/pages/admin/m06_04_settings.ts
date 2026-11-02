/** M06-04 の試験で使う管理画面の操作: 追加システム設定の固定価格商品部門ID（共有の設定） */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const ADD_SYSTEM = "/setting/shop/additional_system";
const FIELD = '[name="add_system[fixed_price_section]"]';

/** 追加システム設定の固定価格商品部門IDの、いまの値 */
export async function readFixedPriceSection(page: Page): Promise<string> {
  await page.goto(adminUrl(ADD_SYSTEM), { timeout: 60_000 });
  await page.waitForLoadState("load");
  return page.locator(FIELD).inputValue({ timeout: 30_000 });
}

/** 追加システム設定の固定価格商品部門IDを設定して登録する（ほかの項目は表示されている値のまま） */
export async function setFixedPriceSection(page: Page, value: string): Promise<string> {
  await page.goto(adminUrl(ADD_SYSTEM), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const input = page.locator(FIELD);
  await input.fill(value, { timeout: 30_000 });
  const t0 = new Date();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('form#point_form button[type="submit"]').click({ timeout: 30_000 })]);
  await expectSaved(page, `追加システム設定の固定価格商品部門IDを ${value} にする`);
  const t1 = new Date();
  expect(await input.inputValue(), "登録後の固定価格商品部門ID").toBe(value);
  const f = (d: Date) => d.toLocaleTimeString("ja-JP", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
  return `保存の前後の時刻 ${f(t0)}〜${f(t1)}（${t0.toLocaleDateString("ja-JP")}）`;
}
