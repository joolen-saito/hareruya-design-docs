/** F08-05 の確認で使う、管理画面の買取一覧（会員IDでの検索）と買取詳細のステータス変更履歴 */
import { expect, Page } from "@playwright/test";
import { OtcListPage } from "./m06_otc_list";

const OPEN = 30_000;

/** 買取一覧で会員IDを入れて検索する（ほかの検索条件は初期値のまま） */
export async function 会員IDで検索する(list: OtcListPage, 会員ID: string): Promise<void> {
  await list.page.locator("#search_box__customer_id input").fill(会員ID, { timeout: OPEN });
  await list.検索する();
}

export type 履歴の行 = { 変更日時: string; ステータス: string; 変更者: string };

/** 買取詳細のステータス変更履歴の行 */
export async function ステータス変更履歴(page: Page): Promise<履歴の行[]> {
  const card = page.locator(".card").filter({ has: page.locator(".card-header", { hasText: "ステータス変更履歴" }) }).first();
  await expect(card, "買取詳細のステータス変更履歴の欄").toBeVisible({ timeout: OPEN });
  return card.locator("tbody tr").evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { 変更日時: td(0), ステータス: td(1), 変更者: td(2) };
  }));
}
