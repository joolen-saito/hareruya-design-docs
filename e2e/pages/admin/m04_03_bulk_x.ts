/**
 * M04-03 在庫一括編集の続き（-x）の画面操作。在庫検索一覧（店舗の複数選択・言語・状態の絞り込み・行の選択・在庫一括編集）と、
 * 在庫一括編集画面（明細の表示・在庫変動区分・承認通知先メンバー・行の入力・登録・在庫一覧リンク）。セレクタはここだけに書く。
 * 既存の部品（m04_02_rc_stock.ts・stock_edit.ts）は変えず、足りないものだけをここに足す。正本: cases/M04-03_test_cases.tsv
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 30_000;
const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** select2 の付いた複数選択の欄で、いまの選択を外してから、表示名が一致する候補を1つずつ選ぶ */
async function chooseSelect2(page: Page, select: Locator, labels: string[], what: string): Promise<void> {
  const box = select.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
  await expect(box, `${what}の選択欄`).toBeVisible({ timeout: T });
  for (let i = 0; i < 100 && await box.locator(".select2-selection__choice__remove").count() > 0; i++) {
    await box.locator(".select2-selection__choice__remove").first().click();
    await page.keyboard.press("Escape");
  }
  for (const label of labels) {
    await box.locator(".select2-selection").click();
    const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: exact(label) });
    await expect(option, `${what}の候補「${label}」は1件`).toHaveCount(1, { timeout: T });
    await option.click();
    await page.keyboard.press("Escape");
  }
}

// ---- 在庫検索一覧 ----

export type 在庫の検索 = { 商品コード?: string; 商品名?: string; 店舗: string[]; 言語?: string[]; 状態?: string[] };

/** 在庫検索一覧(検索入力)で条件を入れて検索する。在庫区分は EC-CUBE にチェックを付ける。状態は表示名（NM・ニアミントのどちらの表記でも当てる） */
export async function 在庫を検索する(page: Page, v: 在庫の検索): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock"));
  expect(res?.status(), "在庫検索一覧の応答").toBe(200);
  const form = page.locator("form#searchStockListForm");
  await expect(form, "在庫検索一覧の検索欄").toBeVisible({ timeout: T });
  await page.waitForLoadState("load");
  if (v.商品コード !== undefined) await form.locator("#admin_search_stock_list_product_code").fill(v.商品コード);
  if (v.商品名 !== undefined) await form.locator("#admin_search_stock_list_product_name").fill(v.商品名);
  await chooseSelect2(page, form.locator("#admin_search_stock_list_base_info"), v.店舗, "在庫検索一覧の店舗");
  const zone = form.locator('input[name="admin_search_stock_list[stock_zone][]"]').and(page.getByLabel("EC-CUBE", { exact: true }));
  if (await zone.count()) await zone.check({ force: true });
  const 詳細に入れる = (v.言語?.length ?? 0) + (v.状態?.length ?? 0) > 0;
  if (詳細に入れる && !(await page.locator("#searchDetailArea").isVisible())) {
    await page.locator('[href="#searchDetailArea"]').first().click();
    await expect(page.locator("#searchDetailArea"), "詳細検索の欄").toBeVisible({ timeout: T });
  }
  for (const l of v.言語 ?? []) await チェックを付ける(form, "language", [l]);
  for (const s of v.状態 ?? []) await チェックを付ける(form, "card_condition", s === "NM" ? ["NM", "ニアミント"] : s === "SP" ? ["SP", "スライトリープレイド"] : [s]);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), form.locator('button[type="submit"]').first().click()]);
  await page.waitForLoadState("load");
}

/** 検索欄のチェック欄（言語・状態）で、ラベルが候補のどれかに当たるものにチェックを付ける */
async function チェックを付ける(form: Locator, 欄: string, 候補: string[]): Promise<void> {
  const value = await form.locator(`input[name="admin_search_stock_list[${欄}][]"]`).evaluateAll((nodes, names) => {
    for (const n of nodes as HTMLInputElement[]) {
      const label = (n.id ? document.querySelector(`label[for="${n.id}"]`)?.textContent : n.closest("label")?.textContent) ?? "";
      if ((names as string[]).includes(label.trim())) return n.value;
    }
    return null;
  }, 候補);
  if (value === null) throw new Error(`在庫検索一覧の検索欄に「${候補.join("・")}」のチェック欄が無い`);
  await form.locator(`input[name="admin_search_stock_list[${欄}][]"][value="${value}"]`).check({ force: true });
}

/** 在庫検索一覧(検索結果)の行の選択欄（在庫ID） */
export function 行の選択欄(page: Page, 在庫ID: string): Locator {
  return page.locator(`input[name="productStockIds[]"][value="${在庫ID}"]`);
}

/** 在庫検索一覧(検索結果)に出ている在庫ID（行の選択欄の値。並び順） */
export async function 一覧の在庫ID(page: Page): Promise<string[]> {
  return page.locator('input[name="productStockIds[]"]').evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).value));
}

/** 在庫検索一覧(検索結果)で在庫IDの行にチェックを付ける */
export async function 行を選ぶ(page: Page, 在庫IDs: string[]): Promise<void> {
  for (const id of 在庫IDs) {
    const box = 行の選択欄(page, id);
    await expect(box, `在庫検索一覧に在庫ID ${id} の行がある`).toHaveCount(1, { timeout: T });
    await box.check();
  }
}

export const 在庫一括編集ボタン = (page: Page): Locator => page.locator("#bulkEditBtn");

export type 押した結果 = { 押せた: boolean; 警告: string[]; パス: string };

/** 「在庫一括編集」を押し、移る先（在庫一括編集画面・在庫一覧）まで待つ。警告のダイアログ（alert）は読み取って閉じる */
export async function 在庫一括編集を押す(page: Page): Promise<押した結果> {
  const 警告: string[] = [];
  const onDialog = (d: import("@playwright/test").Dialog) => { 警告.push(d.message()); d.accept().catch(() => undefined); };
  page.on("dialog", onDialog);
  try {
    const btn = 在庫一括編集ボタン(page);
    await expect(btn, "「在庫一括編集」のボタン").toHaveCount(1, { timeout: T });
    if (!(await btn.isEnabled())) return { 押せた: false, 警告, パス: new URL(page.url()).pathname };
    const before = page.url();
    await btn.click();
    await page.waitForURL((u) => u.toString() !== before, { timeout: 15_000 }).catch(() => undefined);
    await page.waitForLoadState("load");
    return { 押せた: true, 警告, パス: new URL(page.url()).pathname };
  } finally { page.off("dialog", onDialog); }
}

/** 在庫IDの行を選んで在庫一括編集画面を開く（在庫検索一覧で検索したあとに呼ぶ） */
export async function 一括編集を開く(page: Page, 在庫IDs: string[]): Promise<void> {
  await 行を選ぶ(page, 在庫IDs);
  const r = await 在庫一括編集を押す(page);
  if (!r.押せた) throw new Error("「在庫一括編集」が押せない（非活性）");
  await expect(一括編集の画面(page), `在庫一括編集の画面（${r.警告.join(" / ") || "警告なし"}）`).toBeVisible({ timeout: T });
}

// ---- 在庫一括編集 ----

export const 一括編集の画面 = (page: Page): Locator => page.locator("form#stock_bulk_approval_form");
export const 在庫一覧リンク = (page: Page): Locator => page.locator(".c-conversionArea a.c-baseLink").first();

export type 一括編集の行 = {
  商品規格ID: string; 画像: string; 商品名: string; 商品コード: string; 言語: string; 状態: string; Foil: string;
  店舗: string; 在庫区分: string; 在庫数: string; 原価単価: string; 総原価: string;
};

/** 在庫一括編集画面の明細の行（上から順） */
export async function 一括編集の行(page: Page): Promise<一括編集の行[]> {
  return 一括編集の画面(page).locator("table.table-bulk-approval tbody tr").evaluateAll((trs) => trs
    .filter((tr) => tr.querySelectorAll("td").length >= 10)
    .map((tr) => {
      const td = Array.from(tr.querySelectorAll("td"));
      const t = (i: number) => (td[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
      const div = (i: number, j: number) => (td[i]?.querySelectorAll("div")[j]?.textContent ?? "").replace(/\s+/g, " ").trim();
      const img = td[1]?.querySelector("img") as HTMLImageElement | null;
      return {
        商品規格ID: t(0), 画像: img ? img.getAttribute("src") ?? "" : "", 商品名: div(2, 0), 商品コード: div(2, 1), 言語: t(3), 状態: t(4), Foil: t(5),
        店舗: div(6, 0), 在庫区分: div(6, 1), 在庫数: t(7), 原価単価: t(8), 総原価: t(9),
      };
    }));
}

/** 在庫変動区分の選択肢（空の選択肢を除く。先頭の入庫・廃棄の印を除いた「区分/理由」の形） */
export async function 在庫変動区分の選択肢(page: Page): Promise<string[]> {
  return 一括編集の画面(page).locator(".js-bulk-stock-change-type-detail-global option").evaluateAll((os) => os
    .filter((o) => (o as HTMLOptionElement).value)
    .map((o) => (o.textContent ?? "").trim().replace(/^[^\p{L}\p{N}]+/u, "")));
}

/** 在庫変動区分を選ぶ（表示名の先頭の印を除いたものが一致する選択肢） */
export async function 在庫変動区分を選ぶ(page: Page, label: string): Promise<void> {
  const select = 一括編集の画面(page).locator(".js-bulk-stock-change-type-detail-global");
  const options = await select.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value));
  const match = options.filter((o) => o.label.replace(/^[^\p{L}\p{N}]+/u, "") === label);
  if (match.length !== 1) throw new Error(`在庫変動区分「${label}」が1つではない: ${options.map((o) => o.label).join("、")}`);
  await select.selectOption(match[0].value);
}

/** 承認通知先メンバーを選ぶ（複数可） */
export async function 承認通知先メンバーを選ぶ(page: Page, 名前: string[]): Promise<void> {
  await chooseSelect2(page, 一括編集の画面(page).locator(".js-bulk-approval-members"), 名前, "承認通知先（メンバー選択）");
}

/** 明細の行（上から i 番目。0 から）の入力欄 */
export const 行の在庫変動理由 = (page: Page, i: number): Locator => 一括編集の画面(page).locator(`.js-bulk-stock-change-reason[data-index="${i}"], [name="stock_bulk_approval[item_${i}][stock_change_reason]"]`).first();
export const 行の在庫増減数 = (page: Page, i: number): Locator => 一括編集の画面(page).locator(`.js-bulk-stock-change-quantity[data-index="${i}"], [name="stock_bulk_approval[item_${i}][stock_change_quantity]"]`).first();
export const 行の仕入単価 = (page: Page, i: number): Locator => 一括編集の画面(page).locator(`.js-bulk-purchase-price[data-index="${i}"], [name="stock_bulk_approval[item_${i}][purchase_price]"]`).first();

/** 明細の行（商品コードで探す）の位置（0 から） */
export async function 行の位置(page: Page, 商品コード: string): Promise<number> {
  const rows = await 一括編集の行(page);
  const i = rows.findIndex((r) => r.商品コード === 商品コード);
  if (i < 0) throw new Error(`在庫一括編集の明細に商品コード ${商品コード} の行が無い（${rows.map((r) => r.商品コード).join("、")}）`);
  return i;
}

/** 行の入力（在庫変動理由・在庫増減数・仕入単価。仕入単価が undefined なら触れない） */
export async function 行を入れる(page: Page, i: number, v: { 在庫変動理由: string; 在庫増減数: string; 仕入単価?: string }): Promise<void> {
  await 行の在庫変動理由(page, i).fill(v.在庫変動理由, { timeout: T });
  await 行の在庫増減数(page, i).fill(v.在庫増減数, { timeout: T });
  if (v.仕入単価 !== undefined) await 行の仕入単価(page, i).fill(v.仕入単価, { timeout: T });
}

/** 「登録」を押し、移った先まで待つ（移らなければそのまま）。移った先のパスと、画面の成功・エラーの表示を返す */
export async function 一括編集を登録する(page: Page): Promise<{ パス: string; 表示: string }> {
  const before = page.url();
  await page.locator('button[type="submit"][form="stock_bulk_approval_form"]').click({ timeout: T });
  await page.waitForURL((u) => u.toString() !== before, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForLoadState("load");
  const 表示 = ((await page.locator(".alert, .invalid-feedback:visible, .form-error-message").allInnerTexts().catch(() => [])) as string[])
    .map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean).join(" / ");
  return { パス: new URL(page.url()).pathname, 表示 };
}

/** 在庫編集画面（在庫IDの在庫）を開く。在庫一括編集の前の入庫のシードで使う */
export async function 在庫編集を開く(page: Page, 在庫ID: string): Promise<void> {
  const res = await page.goto(adminUrl(`/product/stock/${在庫ID}/stock-approval/new`));
  expect(res?.status() ?? 0, `在庫ID ${在庫ID} の在庫編集画面の応答`).toBeLessThan(400);
  await expect(page.locator("form#stock_approval_form"), "在庫編集の画面").toBeVisible({ timeout: T });
  await page.waitForLoadState("load");
}
