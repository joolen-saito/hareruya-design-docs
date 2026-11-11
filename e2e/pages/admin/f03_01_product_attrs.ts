/**
 * F03-01 で既存の商品の属性（状態・言語・セールフラグ・高額商品コード）を管理画面で確かめるための読み取り。
 * 書き換えはしない（商品規格一覧と商品規格登録編集画面を開いて読むだけ）。
 */
import { Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type 規格の行 = { 規格ID: string; 公開状態: string; 言語: string; 状態: string; 商品コード: string; 在庫: string };

/** 商品規格一覧（廃止でない商品規格の表）を開いて行を読む */
export async function 商品規格の一覧を読む(page: Page, 商品ID: string): Promise<規格の行[]> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}`));
  await page.waitForLoadState("load");
  const table = page.locator("#ex-product_class table");
  await expect(table, `商品ID ${商品ID} の商品規格一覧の表`).toBeVisible();
  return page.locator("#ex-product_class tbody tr").evaluateAll((trs) => trs.map((tr) => {
    const td = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { 規格ID: (tr.getAttribute("id") ?? "").replace("ex-product_class-", ""), 公開状態: td(1), 言語: td(2), 状態: td(3), 商品コード: td(5), 在庫: td(6) };
  }));
}

/** 商品規格登録編集画面を開いて、セールフラグと高額商品コードを読む */
export async function 商品規格の属性を読む(page: Page, 商品ID: string, 規格ID: string): Promise<{ セール: boolean; 高額商品コード: string }> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  const sale = page.locator('input[type="checkbox"][name$="[sale_flg]"]').first();
  const code = page.locator('[name$="[high_price_code]"]').first();
  await expect(code, `商品規格ID ${規格ID} の商品規格登録編集画面の高額商品コードの欄`).toBeAttached();
  return { セール: (await sale.count()) > 0 ? await sale.isChecked() : false, 高額商品コード: (await code.inputValue()).trim() };
}

/** 状態の表示が NM（ニアミント）か */
export const NMか = (状態: string): boolean => /^(NM|ニアミント)\b/.test(状態.trim()) || 状態.includes("ニアミント");
