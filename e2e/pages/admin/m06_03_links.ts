/**
 * M06-03 の連携ケース（094・095）で使う、在庫履歴検索一覧・在庫検索一覧の画面操作の補い。セレクタはここにだけ書く。
 * 一覧の読み取り・検索の部品は pages/admin/m04_17_stock_history.ts（在庫履歴検索一覧）を使い、ここでは足りないもの
 * （店舗の選択、在庫検索一覧の行の在庫・原価単価・総原価の読み取り）だけを書く。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 在庫検索一覧の行は、店舗名の下に在庫区分（EC-CUBE・スマレジ）、「買取価格」の下に「原価単価」、「在庫」の下に「総原価」を2段で出す。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** 複数選択の選択欄（サジェスト欄で包まれているもの）を、選択肢の表示名でそろえる */
export async function 表示名で選ぶ(select: Locator, labels: string[], what: string): Promise<void> {
  await expect(select, what).toHaveCount(1);
  const missing = await select.evaluate((el, ls) => {
    const s = el as HTMLSelectElement;
    const opts = Array.from(s.options);
    const miss = ls.filter((l) => !opts.some((o) => (o.textContent ?? "").trim() === l));
    for (const o of opts) o.selected = ls.includes((o.textContent ?? "").trim());
    s.dispatchEvent(new Event("change", { bubbles: true }));
    return miss;
  }, labels);
  if (missing.length) throw new Error(`${what}の選択肢に「${missing.join("・")}」が無い`);
}

/** 在庫履歴検索一覧の店舗の欄 */
export const 在庫履歴の店舗の欄 = (page: Page): Locator => page.locator("#admin_stock_history_base_info");

export type 在庫の行 = { 商品コード: string; 店舗: string; 在庫区分: string; 在庫: string; 原価単価: string; 総原価: string };

/** 在庫検索一覧を開く（メニューから開くのと同じ、検索条件の指定の無いアドレス） */
export async function 在庫検索一覧を開く(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock"), { timeout: 60_000 });
  expect(res?.status() ?? 0, "在庫検索一覧の応答").toBeLessThan(400);
  await expect(page.locator("form#searchStockListForm"), "在庫検索一覧の検索欄").toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState("load");
}

/** 開いている在庫検索一覧で、店舗を選び、コードに入れて検索する（結果の画面の読み込みまで待つ） */
export async function 在庫検索をする(page: Page, 店名: string, 商品コード: string): Promise<void> {
  const form = page.locator("form#searchStockListForm");
  await expect(form, "在庫検索一覧の検索欄").toBeVisible({ timeout: 30_000 });
  await 表示名で選ぶ(form.locator("#admin_search_stock_list_base_info"), [店名], "在庫検索一覧の店舗");
  await form.locator("#admin_search_stock_list_product_code").fill(商品コード, { timeout: 30_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), form.locator("button.btn-ec-conversion[type=submit]", { hasText: "検索" }).first().click({ timeout: 30_000, noWaitAfter: true })]);
  await page.waitForLoadState("load");
  await expect(page.locator("p", { hasText: /検索結果：[\d,]+件|見つかりませんでした/ }).first(), "在庫検索一覧の検索結果の件数の表示").toBeVisible({ timeout: 60_000 });
}

/** 在庫検索一覧の結果の行（在庫・原価単価・総原価つき） */
export async function 在庫検索の行(page: Page): Promise<在庫の行[]> {
  return page.locator("table tbody tr").filter({ has: page.locator("td.col-stock") }).evaluateAll((trs) => trs.map((tr) => {
    const t = (el: Element | null | undefined) => ((el?.textContent) ?? "").replace(/\s+/g, " ").trim();
    const prices = Array.from(tr.querySelectorAll("td.col-price"));
    const stock = tr.querySelector("td.col-stock");
    return {
      商品コード: t(tr.querySelector("td.col-name .text-muted")), 店舗: t(tr.querySelector("td.col-shop > div:first-child")), 在庫区分: t(tr.querySelector("td.col-shop > div.text-muted")),
      在庫: t(stock?.querySelector(":scope > div:nth-child(1)")), 総原価: t(stock?.querySelector(":scope > div:nth-child(2)")),
      原価単価: t(prices[1]?.querySelector(":scope > div:nth-child(2)")),
    };
  }));
}
