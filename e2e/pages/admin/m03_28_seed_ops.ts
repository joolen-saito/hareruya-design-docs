/**
 * M03-28 のシードで使う、商品マスター(検索)とタグ登録/編集画面の読み取り。
 * - 商品マスター(検索入力)で商品IDを入れて検索し、該当が無いことを確かめる（既定の絞り込み（公開状態・状態・高額商品）は外す）。
 * - タグ登録/編集画面の一覧（件数欄で12000件を選んで全件）から、名称の行のIDと、使われていない並び順を読む。
 */
import { expect, Page } from "@playwright/test";
import { ProductSearchPage } from "./product_search";
import { TagPage, TagRow } from "./m03_13_tag";

/** 一覧の全件を1ページに出す表示件数（タグ登録/編集画面の件数欄の最大） */
const ALL = "12000";

/** 商品マスター(検索入力)の、既定でチェックされている絞り込み（公開状態・状態・高額商品）を外す */
async function clearDefaultFilters(search: ProductSearchPage): Promise<void> {
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), "商品マスターの既定の絞り込みを外す").toEqual([]);
  }
}

/** 商品マスター(検索入力)で商品IDを入れて検索し、該当する商品が無いことを確かめる。あれば止める */
export async function expectNoProductWithId(page: Page, 商品ID: string, what: string): Promise<void> {
  const search = new ProductSearchPage(page);
  await search.open();
  await clearDefaultFilters(search);
  await search.field("product_id").fill(商品ID);
  await search.submitAndWaitForResult();
  const none = page.getByText(/^検索条件に合致するデータが見つかりませんでした$/);
  if (!(await none.first().isVisible())) throw new Error(`${what}: 商品マスターの検索で、商品ID ${商品ID} の商品が見つかった（未登録のはず）`);
}

/** タグ登録/編集画面の一覧の全件（件数欄で12000件を選ぶ） */
export async function allTagRows(page: Page): Promise<TagRow[]> {
  const tag = new TagPage(page);
  await tag.showFirstPageWith(ALL);
  const rows = await tag.allRows();
  if (rows.length >= Number(ALL)) throw new Error(`タグが${ALL}件以上あり、一覧の1ページで全件を見られない`);
  return rows;
}

/** 一覧の並び順で使われていない最小の正の整数（「他のタグと重ならない値」） */
export function unusedSortNo(rows: TagRow[]): string {
  const used = new Set(rows.map((r) => Number(r.並び順)));
  for (let n = 1; ; n++) if (!used.has(n)) return String(n);
}
