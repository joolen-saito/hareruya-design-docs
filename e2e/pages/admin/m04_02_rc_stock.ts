/**
 * M04-02 在庫編集・M04-03 在庫一括編集の「他機能への反映」ケース（RC-*）で使う画面操作。セレクタはここにだけ書く。
 * - 在庫検索一覧: 商品コード・店舗（1店だけ）・在庫区分で検索し、行の商品名から在庫編集を開く／行を選んで「在庫一括編集」を押す。
 * - 在庫編集・在庫一括編集: 在庫変動区分・在庫変動理由・在庫増減数・仕入単価・承認通知先（メンバー選択）を入れて「登録」。
 *   承認通知先のメンバーの選択欄は、所属を選ばなければ承認できるメンバー全員を出す（画面のスクリプト）ので、正本が所属を書かない手順では所属を選ばない。
 * - 在庫編集承認一覧: 店舗・登録者（メンバー選択）などで検索し、承認対象「在庫編集」「在庫一括編集」の未承認の行を選んで一括承認する。
 * - 商品規格一覧: 商品マスターで商品名を検索し、商品登録編集の「規格設定」から開いて、商品コードの行の在庫数を読む。
 * - 商品規格登録編集: 取り込みで作られた規格を開き、部門・公開ステータスなどを選んで「商品規格を登録」（シード用）。
 * 画面のスクリプトが読み込まれる前に押すと、選択欄の連動や確認のポップアップが働かないので、読み込みを待ってから操作する。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { approveRows } from "./m04_17_seed_ops";
import { openClassListFromProductEdit } from "./m03_01_product_class";
import { ProductSearchPage } from "./product_search";
import { StockListPage } from "./stock_edit";

type Issue = (message: string) => void;
export const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** select2 の付いた選択欄（複数選択）で、いまの選択を外してから、表示名が一致する候補を1つずつ選ぶ */
async function chooseSelect2(page: Page, select: Locator, labels: string[], what: string): Promise<void> {
  const box = select.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
  await expect(box, `${what}の選択欄`).toBeVisible();
  for (let i = 0; i < 100 && await box.locator(".select2-selection__choice__remove").count() > 0; i++) {
    await box.locator(".select2-selection__choice__remove").first().click();
    await page.keyboard.press("Escape");
  }
  for (const label of labels) {
    await box.locator(".select2-selection").click();
    const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: exact(label) });
    await expect(option, `${what}の候補「${label}」は1件`).toHaveCount(1);
    await option.click();
    await page.keyboard.press("Escape");
  }
  const chosen = await select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, `${what}に選んだもの`).toEqual(labels);
}

// ---- 在庫検索一覧 ----

/**
 * 在庫検索一覧(検索入力)で、コードに商品コードを入れ、店舗に1店を選び、在庫区分のチェックを付けて「検索」を押す。
 * 店舗の欄の初期値はログイン中の管理者のデフォルト検索表示店舗なので、外してから選ぶ。
 */
export async function searchStockByCode(page: Page, v: { 商品コード: string; 店舗: string; 在庫区分: string }): Promise<StockListPage> {
  const list = new StockListPage(page);
  const res = await page.goto(adminUrl("/product/stock"));
  expect(res?.status(), "在庫検索一覧の応答").toBe(200);
  await expect(list.form, "在庫検索一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
  await list.form.locator("#admin_search_stock_list_product_code").fill(v.商品コード);
  await chooseSelect2(page, list.form.locator("#admin_search_stock_list_base_info"), [v.店舗], "在庫検索一覧の店舗");
  const zone = list.form.locator('input[name="admin_search_stock_list[stock_zone][]"]').and(page.getByLabel(v.在庫区分, { exact: true }));
  await expect(zone, `在庫区分「${v.在庫区分}」のチェック欄は1つ`).toHaveCount(1);
  await zone.check();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    list.form.locator('button[type="submit"]').first().click(),
  ]);
  return list;
}

/** 在庫検索一覧の行の在庫数 */
export async function stockInRow(row: Locator): Promise<number> {
  await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
  const text = (await row.locator("td.col-stock > div").first().innerText()).replace(/[,\s]/g, "");
  if (!/^-?\d+$/.test(text)) throw new Error(`在庫検索一覧の在庫数を読めない: 「${text}」`);
  return Number(text);
}

/** 在庫検索一覧(検索結果)で行のチェックを付け、「在庫一括編集」を押して在庫一括編集画面へ移る */
export async function openBulkEdit(page: Page, row: Locator): Promise<void> {
  await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
  await row.locator('input[name="productStockIds[]"]').check();
  const button = page.locator("#bulkEditBtn");
  await expect(button, "「在庫一括編集」が押せる").toBeEnabled();
  await Promise.all([page.waitForURL(/\/product\/stock\/stock-bulk-approval\/new/, { waitUntil: "load" }), button.click()]);
  await expect(page.locator("form#stock_bulk_approval_form"), "在庫一括編集の画面").toBeVisible();
  await page.waitForLoadState("load");
}

// ---- 在庫編集・在庫一括編集 ----

export type StockEditValues = {
  /** 在庫変動区分の表示名（先頭の印を除いた「区分/理由」の形。例: 入庫/その他） */
  在庫変動区分: string;
  在庫変動理由: string;
  在庫増減数: string;
  /** 正本が仕入単価を書かない手順では undefined（欄に触れない） */
  仕入単価?: string;
  承認通知先: string;
};

/** 在庫変動区分の選択欄で、表示名（先頭の入庫・廃棄の印を除いたもの）が一致する選択肢を選ぶ */
async function chooseChangeType(select: Locator, label: string): Promise<void> {
  const options = await select.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).filter((o) => o.value));
  const match = options.filter((o) => o.label.replace(/^[^\p{L}\p{N}]+/u, "") === label);
  if (match.length !== 1) throw new Error(`在庫変動区分「${label}」が1つではない: ${options.map((o) => o.label).join("、")}`);
  await select.selectOption(match[0].value);
}

/** 在庫編集の入力（承認通知先はメンバー選択だけ） */
export async function fillStockEdit(page: Page, v: StockEditValues): Promise<void> {
  const form = page.locator("form#stock_approval_form");
  await chooseChangeType(form.locator("#admin_stock_approval_new_stock_change_type_detail"), v.在庫変動区分);
  await form.locator("#admin_stock_approval_new_stock_change_reason").fill(v.在庫変動理由);
  await form.locator("#admin_stock_approval_new_stock_change_quantity").fill(v.在庫増減数);
  if (v.仕入単価 !== undefined) await form.locator("#admin_stock_approval_new_purchase_price").fill(v.仕入単価);
  await chooseSelect2(page, form.locator("#admin_stock_approval_new_approval_notification_target_members"), [v.承認通知先], "承認通知先（メンバー選択）");
}

/** 在庫編集の「登録」を押し、保存の結果を確かめる */
export async function submitStockEdit(page: Page, what: string, onIssue: Issue): Promise<void> {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.locator('button[type="submit"][form="stock_approval_form"]').click(),
  ]);
  for (const w of await expectSaved(page, what)) onIssue(`${what}: ${w}`);
}

/** 在庫一括編集の入力。行は1行（在庫検索一覧で選んだ1件）だけを入れる */
export async function fillBulkEdit(page: Page, v: StockEditValues & { 行の商品コード: string }): Promise<void> {
  const form = page.locator("form#stock_bulk_approval_form");
  await chooseChangeType(form.locator(".js-bulk-stock-change-type-detail-global"), v.在庫変動区分);
  await chooseSelect2(page, form.locator(".js-bulk-approval-members"), [v.承認通知先], "承認通知先（メンバー選択）");
  const reasons = form.locator(".js-bulk-stock-change-reason");
  await expect(reasons, "在庫一括編集の明細は1行").toHaveCount(1);
  const row = form.locator("tbody tr").filter({ has: page.locator(".js-bulk-stock-change-reason") });
  await expect(row, `在庫一括編集の明細の行は商品コード ${v.行の商品コード} の行`).toContainText(v.行の商品コード);
  await reasons.fill(v.在庫変動理由);
  await form.locator(".js-bulk-stock-change-quantity").fill(v.在庫増減数);
  if (v.仕入単価 !== undefined) await form.locator(".js-bulk-purchase-price").fill(v.仕入単価);
}

/** 在庫一括編集の「登録」を押し、保存の結果を確かめる */
export async function submitBulkEdit(page: Page, what: string, onIssue: Issue): Promise<void> {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.locator('button[type="submit"][form="stock_bulk_approval_form"]').click(),
  ]);
  for (const w of await expectSaved(page, what)) onIssue(`${what}: ${w}`);
}

// ---- 在庫編集承認一覧 ----

export type ApprovalRow = {
  id: string; 承認状態: string; 承認対象: string; 店舗在庫区分: string; 増減数: string; 在庫変動区分: string; 登録者: string; 承認者: string;
};

/**
 * 在庫編集承認一覧(検索入力)を開き、店舗（1店）・登録者（メンバー選択）を選ぶ。承認ステータスの「未承認」は、正本が書くときだけチェックする。
 * 「承認可能な在庫のみ表示」のチェックは初期のまま。所属は選ばない（登録者のメンバー選択は、所属を選ばなければ全員を出す）。
 */
export async function searchApprovals(page: Page, v: { 店舗: string; 登録者: string; 未承認?: boolean }): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock/approval_list"));
  expect(res?.status(), "在庫編集承認一覧の応答").toBe(200);
  const form = page.locator("form#form_search_stock_approval_list");
  await expect(form, "在庫編集承認一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
  await chooseSelect2(page, form.locator("#admin_search_stock_approval_list_base_info"), [v.店舗], "在庫編集承認一覧の店舗");
  if (v.未承認) await form.locator('input[name="admin_search_stock_approval_list[approval_status][]"]').and(page.getByLabel("未承認", { exact: true })).check();
  await chooseSelect2(page, form.locator("#admin_search_stock_approval_list_registered_member"), [v.登録者], "登録者（メンバー選択）");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), form.locator('button[type="submit"]').first().click()]);
  await expect(page.locator("#form_search_stock_approval_list_update"), "在庫編集承認一覧(検索結果)").toBeVisible();
}

/** 在庫編集承認一覧(検索結果)の行 */
export async function approvalRows(page: Page): Promise<ApprovalRow[]> {
  return page.locator("#form_search_stock_approval_list_update tbody tr").filter({ has: page.locator('input[name="approval_list_ids[]"]') })
    .evaluateAll((trs) => trs.map((tr) => {
      const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
      return {
        id: (tr.querySelector('input[name="approval_list_ids[]"]') as HTMLInputElement).value,
        承認状態: td(1), 承認対象: td(2), 店舗在庫区分: td(3), 増減数: td(5), 在庫変動区分: td(7), 登録者: td(9), 承認者: td(11),
      };
    }));
}

/**
 * 検索結果の、承認対象が target の未承認の行（1件であること）を選び、「一括承認」→「承認する」→確認の「OK」を押す。
 * 押す操作は、承認対象の明細の読み込みを待ってから押す共通の部品（M04-17 のシードの部品）を使う。
 */
export async function approveOne(page: Page, target: string, what: string, onIssue: Issue): Promise<ApprovalRow> {
  const rows = (await approvalRows(page)).filter((r) => r.承認対象 === target && r.承認状態 === "未承認");
  if (rows.length !== 1) {
    throw new Error(`${what}: 承認対象「${target}」の未承認の行が ${rows.length} 件（1件のはず）: ${JSON.stringify(await approvalRows(page))}`);
  }
  await approveRows(page, [rows[0].id], what, onIssue);
  return rows[0];
}

/**
 * ケースの手順「承認対象「…」の行のチェックボックスにチェックを付け、「一括承認」ボタンを押す」。
 * 承認対象が target の未承認の行が1件であることを確かめてチェックし、「一括承認」を押して確認のモーダルを開く。
 * モーダルは開いたあと承認対象の明細を画面の裏で読み込むので、読み込みが終わる（明細のCSVダウンロードが押せる）まで待つ
 * （読み込みの途中で承認すると結果のメッセージが消えることがある。M04-17 の記録）。
 */
export async function checkAndOpenBulkApprove(page: Page, target: string, what: string): Promise<ApprovalRow> {
  const all = await approvalRows(page);
  const rows = all.filter((r) => r.承認対象 === target && r.承認状態 === "未承認");
  if (rows.length !== 1) throw new Error(`${what}: 承認対象「${target}」の未承認の行が ${rows.length} 件（1件のはず）: ${JSON.stringify(all)}`);
  await page.locator(`#form_search_stock_approval_list_update input[name="approval_list_ids[]"][value="${rows[0].id}"]`).check();
  const bulk = page.locator("#btn_bulk_approve");
  await expect(bulk, "「一括承認」").toBeVisible();
  await bulk.click();
  const modal = page.locator("#stockApprovalListConfirmModal");
  await expect(modal, "承認の確認").toBeVisible();
  await expect(modal.locator(".js-approval-line-items-csv-link"), "確認のモーダルの承認対象の明細を読み込み終えた")
    .toHaveAttribute("aria-disabled", "false", { timeout: 120_000 });
  return rows[0];
}

/** ケースの手順「確認モーダルの「承認する」ボタンを押し、「本当に承認してもよろしいですか？」の確認でOKを押す」 */
export async function confirmBulkApprove(page: Page, what: string, onIssue: Issue): Promise<string> {
  const modal = page.locator("#stockApprovalListConfirmModal");
  await modal.locator("#btn_bulk_approve_submit").click();
  const confirm = modal.locator(".modal-footer-confirm");
  await expect(confirm, "「本当に承認してもよろしいですか？」の確認").toBeVisible();
  const body = modal.locator(".modal-body-confirm");
  await expect(body, "確認の文").toBeVisible();
  const text = (await body.innerText()).replace(/\s+/g, " ").trim();
  const ok = confirm.locator('button[type="submit"]');
  await expect(ok, "確認の「OK」").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), ok.click()]);
  for (const w of await expectSaved(page, what)) onIssue(`${what}: ${w}`);
  return text;
}

// ---- 商品規格一覧 ----

/**
 * 商品マスター(検索入力)で商品名を入れて検索し、検索結果の商品名から商品登録編集画面を開き、「規格設定」から商品規格一覧を開く。
 * 「規格設定」は移動の確認（保存して移動／保存せずに移動）を出すので、何も変えていない商品登録編集は「保存せずに移動」を選ぶ。
 */
export async function openClassListByName(page: Page, 商品名: string): Promise<void> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.field("product_name").fill(商品名);
  await search.submitAndWaitForResult();
  const link = page.locator('tr[id^="ex-product-"] td:nth-child(3) a').filter({ hasText: exact(商品名) });
  await expect(link, `商品マスターの検索結果に商品「${商品名}」が1件`).toHaveCount(1);
  const productId = ((await link.locator("xpath=ancestor::tr[1]").getAttribute("id")) ?? "").replace("ex-product-", "");
  await Promise.all([page.waitForURL(adminUrl(`/product/product/${productId}/edit`)), link.click()]);
  await openClassListFromProductEdit(page, productId);
}

/** 商品規格一覧の、商品コードの行の在庫数（見出し「在庫」の列） */
export async function classStock(page: Page, 商品コード: string): Promise<number> {
  const table = page.locator("#ex-product_class").first();
  const heads = (await table.locator("thead th").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  const col = heads.findIndex((h) => /^在庫(数)?$/.test(h));
  if (col < 0) throw new Error(`商品規格一覧の見出しに在庫の列が無い: ${heads.join("、")}`);
  const row = table.locator("tbody tr").filter({ has: page.getByRole("cell", { name: 商品コード, exact: true }) });
  await expect(row, `商品規格一覧に商品コード ${商品コード} の行が1件`).toHaveCount(1);
  const text = (await row.locator("td").nth(col).innerText()).replace(/[,\s]/g, "");
  if (!/^-?\d+$/.test(text)) throw new Error(`商品規格一覧の ${商品コード} の在庫数を読めない: 「${text}」`);
  return Number(text);
}

// ---- 商品規格登録編集（シード） ----

/**
 * 商品規格一覧（開いている画面）で、商品コードの規格の行から商品規格登録編集画面を開き、販売種別は既定のまま・高額商品コードは空のまま、
 * スマレジ連携フラグは「連携しない」、部門は選択肢の先頭、公開ステータスは「公開」にして「商品規格を登録」を押す。
 */
export async function publishImportedClass(page: Page, 商品コード: string, what: string, onIssue: Issue): Promise<void> {
  const row = page.locator("#ex-product_class tbody tr").filter({ has: page.getByRole("cell", { name: 商品コード, exact: true }) });
  await expect(row, `${what}: 商品規格一覧に ${商品コード} の規格が1件`).toHaveCount(1);
  await row.getByRole("link", { name: "編集" }).click();
  await page.waitForURL(/\/product\/product\/class\/\d+\/edit\/\d+/);
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  if (!(await form.locator("#admin_product_class_sale_type").inputValue())) throw new Error(`${what}: 販売種別が既定で選ばれていない`);
  const highPrice = form.locator("#admin_product_class_high_price_code");
  if ((await highPrice.count()) && (await highPrice.inputValue())) throw new Error(`${what}: 高額商品コードが空でない`);
  const smaregi = form.locator('[name="admin_product_class[smaregi_alignment_flg]"]');
  if ((await smaregi.first().evaluate((n) => n.tagName)) === "SELECT") await chooseByLabel(smaregi.first(), "連携しない");
  else await form.getByLabel("連携しない", { exact: true }).check();
  const section = form.locator("#admin_product_class_Section");
  const first = await section.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).find((o) => o.value));
  if (!first) throw new Error(`${what}: 部門の選択肢が無い`);
  await section.selectOption(first.value);
  onIssue(`${what}: 部門は選択肢の先頭「${first.label}」を選んだ`);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
    page.getByRole("button", { name: "商品規格を登録" }).click(),
  ]);
  for (const w of await expectSaved(page, what)) onIssue(`${what}: ${w}`);
}

// ---- 在庫履歴検索一覧 ----

/**
 * 在庫履歴検索一覧(検索入力)で、店舗（1店だけ）と在庫区分（在庫場所）を選ぶ。キーワード・検索条件をクリアは M04-17 の部品で行う。
 * 店舗の欄の初期値はログイン中の管理者のデフォルト検索表示店舗なので、外してから選ぶ。
 */
export async function chooseHistoryShopAndZone(page: Page, v: { 店舗: string; 在庫区分: string }): Promise<void> {
  const form = page.locator("form#search_form");
  await chooseSelect2(page, form.locator("#admin_stock_history_base_info"), [v.店舗], "在庫履歴検索一覧の店舗");
  const zone = form.locator('input[name="admin_stock_history[stock_location_id][]"]').and(page.getByLabel(v.在庫区分, { exact: true }));
  await expect(zone, `在庫区分「${v.在庫区分}」のチェック欄は1つ`).toHaveCount(1);
  await zone.check();
}
