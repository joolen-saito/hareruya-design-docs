/**
 * F04-04 の管理画面の読み取り。在庫検索一覧の在庫と総原価、在庫履歴検索一覧の行、会員登録編集画面の累計注文回数。
 * セレクタはここだけに書く。在庫検索一覧の検索は M04-02 の部品、在庫履歴検索一覧は M04-17 の部品を使う。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { searchStockByCode } from "./m04_02_rc_stock";
import { HistoryRow, StockHistoryPage } from "./m04_17_stock_history";
import { StockListPage } from "./stock_edit";

const 数 = (t: string): number => {
  const v = t.replace(/[,\s円]/g, "");
  if (!/^-?\d+$/.test(v)) throw new Error(`数を読めない: 「${t}」`);
  return Number(v);
};

/** 在庫検索一覧(検索入力)で、コード・店舗・在庫区分（EC-CUBE）を入れて検索する */
export async function 在庫を検索する(page: Page, 商品コード: string, 店舗: string): Promise<StockListPage> {
  return searchStockByCode(page, { 商品コード, 店舗, 在庫区分: "EC-CUBE" });
}

/** 在庫検索一覧(検索結果)の行（コード・店舗・EC-CUBE）の在庫と総原価 */
export async function 在庫と総原価(list: StockListPage, 商品コード: string, 店舗: string): Promise<{ 行の数: number; 在庫: number | null; 総原価: number | null }> {
  const row = list.row(商品コード, 店舗, "EC-CUBE");
  const n = await row.count();
  if (n !== 1) return { 行の数: n, 在庫: null, 総原価: null };
  const cells = (await row.locator("td.col-stock > div").allInnerTexts()).map((t) => t.trim());
  return { 行の数: 1, 在庫: 数(cells[0] ?? ""), 総原価: 数(cells[1] ?? "") };
}

/** select2 の付いた店舗の欄（複数選択）で、いまの選択を外してから1店を選ぶ */
async function 店舗を選ぶ(page: Page, select: Locator, 店舗: string): Promise<void> {
  const box = select.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
  await expect(box, "店舗の選択欄").toBeVisible();
  for (let i = 0; i < 100 && await box.locator(".select2-selection__choice__remove").count() > 0; i++) {
    await box.locator(".select2-selection__choice__remove").first().click();
    await page.keyboard.press("Escape");
  }
  await box.locator(".select2-selection").click();
  const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: new RegExp(`^\\s*${店舗.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
  await expect(option, `店舗の候補「${店舗}」は1件`).toHaveCount(1);
  await option.click();
  await page.keyboard.press("Escape");
  const chosen = await select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, "選んだ店舗").toEqual([店舗]);
}

/** 在庫履歴検索一覧(検索入力)を開き、商品名・カード名・商品コードと店舗（1店）を入れて検索する */
export async function 在庫履歴を検索する(page: Page, キーワード: string, 店舗: string): Promise<StockHistoryPage> {
  const h = new StockHistoryPage(page);
  await h.open();
  await h.fillKeyword(キーワード);
  await 店舗を選ぶ(page, h.form.locator("#admin_stock_history_base_info"), 店舗);
  expect(await h.submit(), "在庫履歴検索一覧の検索の応答").toBe(200);
  return h;
}

export type 履歴の値 = { 登録元: string; 登録元ID: string; 変更前在庫: number; 変更後在庫: number; 在庫増減数: number; 変更前総原価: number; 変更後総原価: number; 登録者: string };

/** 在庫履歴検索一覧(検索結果)の行を、業務の項目で読む（一覧の見出しの「在庫変動数」がケースの在庫増減数） */
export async function 履歴の行(h: StockHistoryPage): Promise<履歴の値[]> {
  const rows: HistoryRow[] = await h.rows();
  const key = (r: HistoryRow, 名前: string): string => {
    const k = Object.keys(r).find((x) => x === 名前) ?? Object.keys(r).find((x) => x.startsWith(名前));
    if (!k) throw new Error(`在庫履歴の一覧に「${名前}」の列が無い（列: ${Object.keys(r).join("、")}）`);
    return r[k];
  };
  return rows.map((r) => ({
    登録元: key(r, "登録元").trim(), 登録元ID: key(r, "登録元ID").trim(),
    変更前在庫: 数(key(r, "変更前在庫")), 変更後在庫: 数(key(r, "変更後在庫")), 在庫増減数: 数(key(r, "在庫変動数")),
    変更前総原価: 数(key(r, "変更前総原価")), 変更後総原価: 数(key(r, "変更後総原価")), 登録者: key(r, "登録者").trim(),
  }));
}

/** 会員登録編集画面の「累計注文回数」（「N回」の N） */
export async function 累計注文回数(page: Page, 会員ID: string): Promise<number> {
  const res = await page.goto(adminUrl(`/customer/${会員ID}/edit`), { timeout: 60_000 });
  expect(res?.status(), `会員ID ${会員ID} の会員登録編集画面の応答`).toBe(200);
  await page.waitForLoadState("load");
  const row = page.locator("div.row").filter({ has: page.locator("div.col-3 > span", { hasText: /^\s*累計注文回数\s*$/ }) }).last();
  await expect(row, "会員登録編集画面の累計注文回数の行").toHaveCount(1);
  const t = ((await row.locator("div.col").first().innerText()) ?? "").trim();
  const m = /(\d+)\s*回/.exec(t);
  if (!m) throw new Error(`累計注文回数を読めない: 「${t}」`);
  return Number(m[1]);
}
