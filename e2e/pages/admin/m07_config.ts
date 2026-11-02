/**
 * 基本設定（メニュー「設定」→「店舗設定」→「基本設定」）の高額商品閾値1〜3（M07 の戻しリストの商品仕訳の区切り）。共有の設定。
 * 書き換える前の値を読み、ケースが終わったら控えた値へ戻す。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const SHOP = "/setting/shop";
const field = (page: Page, n: number) => page.locator(`[name="shop_master[expensive_threshold${n}]"]`);

export type 閾値 = [string, string, string];

/** いまの高額商品閾値1〜3（空は ""。桁区切りは外す） */
export async function 閾値を読む(page: Page): Promise<閾値> {
  await page.goto(adminUrl(SHOP), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const out: string[] = [];
  for (const n of [1, 2, 3]) {
    await expect(field(page, n), `基本設定の高額商品閾値${n}`).toBeVisible({ timeout: 30_000 });
    out.push((await field(page, n).inputValue()).replace(/,/g, "").trim());
  }
  return out as 閾値;
}

/** 高額商品閾値1〜3を入れて「登録」する（ほかの項目は表示されている値のまま） */
export async function 閾値を設定する(page: Page, v: 閾値): Promise<void> {
  await page.goto(adminUrl(SHOP), { timeout: 60_000 });
  await page.waitForLoadState("load");
  for (const [i, n] of [1, 2, 3].entries()) await field(page, n).fill(v[i], { timeout: 30_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("form#point_form button[type=submit]").first().click({ timeout: 30_000 })]);
  await expectSaved(page, `高額商品閾値を ${v.map((x) => x || "未設定").join("/")} にする`);
  expect((await 閾値を読む(page)).join("/"), "登録後の高額商品閾値").toBe(v.join("/"));
}
