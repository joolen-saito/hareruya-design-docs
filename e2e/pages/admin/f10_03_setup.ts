/**
 * F10-03 閲覧商品の連携のシードとケースが使う、管理画面の操作。セレクタはここだけに書く。正本: cases/F10-03_seed_data.tsv・F10-03_test_cases.tsv
 * - 買い物かご画面（ページ管理の URL が「cart」のページ）のPCのレイアウトを読み、その先頭部（<head></head>タグ内）のブロックと、
 *   ブロックのコードを読む（書き換えない）。画面: admin/Content/page.twig・page_edit.twig・layout.twig・layout_block.twig
 * - 商品マスターを商品名で検索して商品登録編集画面を開き、公開状態と商品規格の表（言語・状態・在庫・販売価格）を読む。画面: admin/Product/product.twig
 * 期待値はここに書かない。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { 商品名で商品IDを読む } from "./f03_02_seed_ops";
import { ブロック管理 } from "./m09_07_block";

const T = 30_000;
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// 買い物かご画面のレイアウト（読むだけ）
// ---------------------------------------------------------------------------

/** ページ管理(一覧)で、URL の欄が url のページのページIDと名前。ちょうど1件でなければ落とす */
export async function URLでページを探す(page: Page, url: string): Promise<{ ページID: string; ページ名: string }> {
  await page.goto(adminUrl("/content/page"), { waitUntil: "load", timeout: 60_000 });
  const rows = page.locator("table.table tr[id^='ex-page-']");
  await expect(rows.first(), "ページ管理(一覧)の行").toBeVisible({ timeout: T });
  const hit = await rows.evaluateAll((trs, u) => trs
    .filter((tr) => (tr.querySelector("td:nth-child(2)")?.textContent ?? "").replace(/\s+/g, " ").trim() === u)
    .map((tr) => ({ ページID: tr.id.replace("ex-page-", ""), ページ名: (tr.querySelector("td:nth-child(1)")?.textContent ?? "").replace(/\s+/g, " ").trim() })), url);
  if (hit.length !== 1) throw new Error(`ページ管理(一覧)に、URL が「${url}」のページが ${hit.length} 件ある（1件のはず）`);
  return hit[0];
}

/** ページ登録/編集画面の、PCのレイアウトの選択（レイアウトIDと名称）。未選択なら null */
export async function ページのPCのレイアウト(page: Page, ページID: string): Promise<{ レイアウトID: string; 名称: string } | null> {
  await page.goto(adminUrl(`/content/page/${ページID}/edit`), { waitUntil: "load", timeout: 60_000 });
  const sel = page.locator("#main_edit_PcLayout");
  await expect(sel, `ページID ${ページID} のページ登録/編集画面のPCのレイアウトの欄`).toHaveCount(1, { timeout: T });
  const v = await sel.inputValue();
  if (!v) return null;
  return { レイアウトID: v, 名称: norm(await sel.locator("option:checked").textContent()) };
}

/** レイアウト管理(編集)画面の先頭部（<head></head>タグ内）に置いてあるブロック（上から順。ブロックIDと名前） */
export async function 先頭部のブロック(page: Page, レイアウトID: string): Promise<{ ブロックID: string; 名前: string }[]> {
  await page.goto(adminUrl(`/content/layout/${レイアウトID}/edit`), { waitUntil: "load", timeout: 60_000 });
  await expect(page.locator("#position_1"), "レイアウト管理(編集)画面の先頭部の欄").toBeVisible({ timeout: T });
  return page.locator('#position_1 > [id^="detail_box__layout_item--"]').evaluateAll((items) => items.map((it) => ({
    ブロックID: it.id.replace("detail_box__layout_item--", ""),
    名前: (it.querySelector(".view_readme")?.textContent ?? "").replace(/\s+/g, " ").trim(),
  })));
}

/** ブロック管理(編集)画面を開き、ブロックのコードを読む。開けなければ null */
export async function ブロックのコード(page: Page, ブロックID: string): Promise<string | null> {
  const res = await page.goto(adminUrl(`/content/block/${ブロックID}/edit`), { waitUntil: "load", timeout: 60_000 });
  if (!res || res.status() >= 400) return null;
  const b = new ブロック管理(page);
  await b.エディタを待つ();
  return b.コードを読む();
}

// ---------------------------------------------------------------------------
// 商品登録編集画面（読むだけ）
// ---------------------------------------------------------------------------

/** 商品マスター(検索入力)で商品名を検索し、検索結果の商品名のリンクから商品登録編集画面を開く。商品IDを返す */
export async function 商品名で検索して編集を開く(page: Page, 商品名: string): Promise<string> {
  const id = await 商品名で商品IDを読む(page, 商品名);
  const link = page.locator(`tr#ex-product-${id} td:nth-child(3) a`).first();
  await Promise.all([page.waitForURL((u) => u.pathname.endsWith(`/product/product/${id}/edit`), { timeout: 60_000 }), link.click({ timeout: T })]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), `商品「${商品名}」の商品登録編集画面`).toBeVisible({ timeout: T });
  return id;
}

/** 商品登録編集画面の、商品の公開状態の選択（表示名） */
export async function 商品の公開状態(page: Page): Promise<string> {
  const sel = page.locator('select[name="admin_product[Status]"]');
  if ((await sel.count()) === 0) return "";
  return norm(await sel.locator("option:checked").textContent());
}

/** 商品登録編集画面の商品規格の表（公開状態・言語・状態・商品コード・在庫・販売価格の文） */
export async function 商品規格の表(page: Page): Promise<{ 公開状態: string; 言語: string; 状態: string; 商品コード: string; 在庫: string; 価格: string }[]> {
  return page.locator("table.product_class_table_ tbody tr").evaluateAll((trs) => trs.map((tr) => {
    const t = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { 公開状態: t(1), 言語: t(2), 状態: t(3), 商品コード: t(4), 在庫: t(5), 価格: t(6) };
  }));
}
