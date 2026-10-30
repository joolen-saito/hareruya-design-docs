/**
 * F03-08 お気に入り商品の試験で使う管理画面の操作。
 * - 店舗設定のお気に入り商品機能の有効・無効
 * - 在庫を入れる管理者（登録者）の用意
 * - 商品の公開ステータスを非公開にする
 * 公開側の部品は pages/front/f03_08_favorite.ts。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { ensureMember } from "./member";
import { openProductEdit } from "./product_edit";

const FAVORITE = '[name="shop_master[option_favorite_product]"]';

/** 店舗設定（基本設定）のお気に入り商品機能のいまの設定 */
export async function readFavoriteOption(page: Page): Promise<boolean> {
  await page.goto(adminUrl("/setting/shop"));
  await page.waitForLoadState("load");
  return page.locator(FAVORITE).isChecked();
}

/** 店舗設定のお気に入り商品機能を on にする。すでにその設定なら保存しない。変えたかを返す */
export async function setFavoriteOption(page: Page, on: boolean): Promise<boolean> {
  const now = await readFavoriteOption(page);
  if (now === on) return false;
  // 切り替えのスイッチは見た目の部品なので、ラベルを押す
  await page.locator(`label[for="shop_master_option_favorite_product"]`).click();
  expect(await page.locator(FAVORITE).isChecked(), "お気に入り商品機能のスイッチを切り替えた").toBe(on);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("form#point_form button[type=submit]").click()]);
  await expectSaved(page, `店舗設定のお気に入り商品機能を${on ? "有効" : "無効"}にする`);
  expect(await page.locator(FAVORITE).isChecked(), "登録後のお気に入り商品機能の設定").toBe(on);
  return true;
}

/** 在庫を入れる管理者（登録者）。システム管理者の権限・利用できる店舗の先頭（M03-01 の在庫の入れ方と同じ） */
export const STOCK_ADMIN = { loginId: "f0308_stock_admin", password: "Passw0rd!F0308S" };

export async function ensureStockAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
    .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
  if (stores.length === 0) throw new Error("F03-08 在庫登録管理者: メンバーに割り当てられる店舗が画面に無い");
  await ensureMember(page, {
    名前: "F03-08在庫登録管理者", 所属店舗: stores[0], ログインID: STOCK_ADMIN.loginId, メールアドレス: "f0308_stock_admin@example.test",
    パスワード: STOCK_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: stores[0], 編集可能店舗: [stores[0]],
  });
}

/** 商品登録編集画面で商品公開ステータスを「非公開」にして「商品を登録」を押す */
export async function setProductPrivate(page: Page, 商品ID: string, what: string, onIssue: (m: string) => void): Promise<void> {
  await openProductEdit(page, 商品ID);
  const form = page.locator("form#form1");
  const status = form.locator('[name="admin_product[Status]"]');
  await expect(status, `${what}: 商品公開ステータスの欄`).toHaveCount(1);
  const tag = await status.evaluate((n) => n.tagName);
  if (tag === "SELECT") {
    await status.selectOption({ label: "非公開" });
  } else {
    await form.getByLabel("非公開", { exact: true }).check();
  }
  // グッズCSVで取り込んだ商品は、割引率と販売制限が未選択で、そのままでは保存できない。未選択なら選択肢の先頭を選ぶ（正本は触れていない必須項目）
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if ((await discount.count()) === 1 && !(await discount.inputValue())) {
    const first = await discount.locator("option").evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLOptionElement).value, t: (n.textContent ?? "").trim() })).find((o) => o.v !== ""));
    if (first) { await discount.selectOption(first.v); onIssue(`${what}: 割引率は必須で未選択だったので「${first.t}」を選んだ`); }
  }
  const region = form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]');
  if ((await region.count()) > 0 && (await region.and(page.locator(":checked")).count()) === 0) {
    await region.first().check();
    onIssue(`${what}: 販売制限は必須で未選択だったので先頭を選んだ`);
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品を登録`)) onIssue(`${what}: 警告「${w}」`);
}
