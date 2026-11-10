/**
 * M04-02 在庫編集の続き（-x）の画面操作。在庫IDで在庫編集画面を開く・在庫商品情報と在庫情報を読む・成功を確かめずに「登録」を押す・
 * 仕入単価の欄の状態・「在庫一覧に戻る」・店舗と在庫区分だけでの在庫検索。セレクタはここだけに書く。正本: cases/M04-02_test_cases.tsv
 * 入力は pages/admin/m04_02_rc_stock.ts の fillStockEdit を使う（同じ画面の部品を二重に作らない）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { StockListPage } from "./stock_edit";

const form = (page: Page) => page.locator("form#stock_approval_form");

/** 在庫IDの在庫編集画面を開く */
export async function 在庫編集画面を開く(page: Page, 在庫ID: string): Promise<number> {
  const res = await page.goto(adminUrl(`/product/stock/${在庫ID}/stock-approval/new`));
  await page.waitForLoadState("load");
  return res?.status() ?? 0;
}

export async function 在庫編集画面である(page: Page): Promise<boolean> {
  return (await form(page).count()) > 0 && (await form(page).isVisible());
}

/** 在庫商品情報・在庫情報の欄（項目名 → 表示の文字）。項目名は画面の見出しのまま */
export async function 在庫の表示(page: Page): Promise<Record<string, string>> {
  return form(page).evaluate((f) => {
    const out: Record<string, string> = {};
    for (const label of Array.from(f.querySelectorAll("label.form-label.fw-bold"))) {
      const row = label.closest(".row");
      const value = row?.querySelector(":scope > .col-7, :scope > div:nth-child(2)");
      const key = (label.textContent ?? "").replace(/\s+/g, " ").trim();
      if (key && value && !(key in out)) out[key] = (value.textContent ?? "").replace(/\s+/g, " ").trim();
    }
    return out;
  });
}

/** 「登録」を押す（成功を確かめない）。押したあとの画面のアドレスと、画面に出たエラー・成功の文を返す */
export async function 登録を押す(page: Page): Promise<{ path: string; エラー: string[]; 成功: string[] }> {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined),
    page.locator('button[type="submit"][form="stock_approval_form"]').click(),
  ]);
  await page.waitForLoadState("load");
  const texts = async (sel: string) => (await page.locator(sel).allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  return {
    path: new URL(page.url()).pathname,
    エラー: [...await texts(".invalid-feedback:visible"), ...await texts(".alert-danger:visible"), ...await texts(".form-error-message:visible")],
    成功: await texts(".alert-success:visible"),
  };
}

/** 在庫編集の入力欄の「仕入単価」 */
export const 仕入単価の欄 = (page: Page): Locator => form(page).locator("#admin_stock_approval_new_purchase_price");
/** 在庫編集の入力欄の「在庫変動区分」 */
export const 在庫変動区分の欄 = (page: Page): Locator => form(page).locator("#admin_stock_approval_new_stock_change_type_detail");

/** 在庫変動区分を表示名（先頭の入庫・廃棄の印を除いた「区分/理由」。m04_02_rc_stock.ts の fillStockEdit と同じ選び方）で選ぶ */
export async function 在庫変動区分を選ぶ(page: Page, 表示名: string): Promise<void> {
  const sel = 在庫変動区分の欄(page);
  const options = await sel.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).filter((o) => o.value));
  const match = options.filter((o) => o.label.replace(/^[^\p{L}\p{N}]+/u, "") === 表示名);
  if (match.length !== 1) throw new Error(`在庫変動区分「${表示名}」が1つではない: ${options.map((o) => o.label).join("、")}`);
  await sel.selectOption(match[0].value);
}

/** 「在庫一覧に戻る」のリンク */
export const 在庫一覧に戻る = (page: Page): Locator => page.locator("a").filter({ hasText: /在庫一覧に戻る/ }).first();

/** 在庫検索一覧で、店舗（1店）と在庫区分だけを指定して検索する（商品コードは入れない） */
export async function 店舗と在庫区分で検索する(page: Page, 店舗: string, 在庫区分: string): Promise<StockListPage> {
  const list = new StockListPage(page);
  const res = await page.goto(adminUrl("/product/stock"));
  expect(res?.status(), "在庫検索一覧の応答").toBe(200);
  await page.waitForLoadState("load");
  const box = list.form.locator("#admin_search_stock_list_base_info").locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
  for (let i = 0; i < 100 && await box.locator(".select2-selection__choice__remove").count() > 0; i++) {
    await box.locator(".select2-selection__choice__remove").first().click();
    await page.keyboard.press("Escape");
  }
  await box.locator(".select2-selection").click();
  const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: new RegExp(`^\\s*${店舗}\\s*$`) });
  await expect(option, `店舗の候補「${店舗}」は1件`).toHaveCount(1);
  await option.click();
  await page.keyboard.press("Escape");
  await list.form.locator('input[name="admin_search_stock_list[stock_zone][]"]').and(page.getByLabel(在庫区分, { exact: true })).check();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), list.form.locator('button[type="submit"]').first().click()]);
  return list;
}

/** 在庫検索一覧の検索欄で、いま選ばれている店舗と在庫区分 */
export async function 検索欄の店舗と在庫区分(page: Page): Promise<{ 店舗: string[]; 在庫区分: string[] }> {
  const f = new StockListPage(page).form;
  const 店舗 = await f.locator("#admin_search_stock_list_base_info").evaluate((s) => Array.from((s as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  const 在庫区分 = await f.locator('input[name="admin_search_stock_list[stock_zone][]"]:checked').evaluateAll((ns) => ns.map((n) => {
    const i = n as HTMLInputElement;
    return (i.labels?.[0]?.textContent ?? i.value).trim();
  }));
  return { 店舗, 在庫区分 };
}
