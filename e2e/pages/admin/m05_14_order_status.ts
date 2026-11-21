/**
 * M05-14 対応状況設定の連携ケースの画面操作。セレクタはここにだけ書く（受注情報編集・受注情報検索の部品は M05-11・M05-01 のものを使う）。
 * - 受注情報編集画面の「入金日」の表示（日時の文字列）を読む。
 * - 受注情報検索 一覧(検索入力)画面で、店舗と注文番号を入れて検索し、一覧の注文番号のリンクから受注情報編集画面を開く。
 */
import { expect, Page } from "@playwright/test";
import { OrderSearchPage } from "./m05_01_order_search_k";

/** 受注情報編集画面の「入金日」の表示（無ければ空文字） */
export async function 入金日を読む(page: Page): Promise<string> {
  const 行 = page.locator("div.row", { has: page.locator("> div.col-3", { hasText: /^\s*入金日\s*$/ }) });
  await expect(行, "受注情報編集画面の入金日の欄").toHaveCount(1, { timeout: 60_000 });
  return ((await 行.locator("> div.col").first().textContent()) ?? "").replace(/\s+/g, " ").trim();
}

/** 受注情報検索 一覧(検索入力)画面を開き、店舗（店舗IDで選ぶ）と注文番号を入れて検索する。一覧の注文番号の行（注文番号が一致するもの）の数を返す */
export async function 店舗と注文番号で検索する(page: Page, 店舗ID: string, 注文番号: string): Promise<number> {
  const p = new OrderSearchPage(page);
  await p.open();
  await p.tenants.selectOption([店舗ID]);
  await p.orderNumber.fill(注文番号);
  await p.clickSearch();
  return 一覧の注文番号のリンク(page, 注文番号).count();
}

export function 一覧の注文番号のリンク(page: Page, 注文番号: string) {
  return page.locator("#search_result tbody tr td:nth-child(3) a").filter({ hasText: new RegExp(`^\\s*${注文番号.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
}

/** 一覧の注文番号のリンクを押して、受注情報編集画面を開く。リンクは新しいタブで開く（別のタブ）ので、開いたタブを返す */
export async function 一覧から受注情報編集を開く(page: Page, 注文番号: string): Promise<Page> {
  const リンク = 一覧の注文番号のリンク(page, 注文番号);
  await expect(リンク, `一覧の注文番号「${注文番号}」のリンク`).toHaveCount(1);
  const [新しいタブ] = await Promise.all([page.context().waitForEvent("page", { timeout: 60_000 }), リンク.click({ noWaitAfter: true })]);
  await 新しいタブ.waitForLoadState("load");
  await expect(新しいタブ, "開いたタブは受注情報編集画面").toHaveURL(/\/order\/\d+\/edit/);
  return 新しいタブ;
}
