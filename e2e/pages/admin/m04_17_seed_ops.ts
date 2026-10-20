/**
 * M04-17 のシードで使う画面操作。
 * グッズ商品CSV登録（正本の列の値で1行ずつ組む）・残っている商品コードの確かめ・在庫編集の登録・
 * 在庫編集承認一覧での承認（どの行が今回の登録かを、登録の前後の未承認の行の差で決める）・商品規格の価格の変更。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue, readExistingSellGroupName, readJapaneseLanguageId } from "./m03_01_goods_csv";
import { readGoodsProductId } from "./m03_01_goods_list_seed";
import { openClassListFromProductEdit } from "./m03_01_product_class";
import { goodsRootCategoryLink } from "./product_masters";
import { StockApprovalListPage, StockListPage, registerStockEdit } from "./stock_edit";

type Issue = (message: string) => void;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行に表示されたID（正本の「サプライ・グッズのカテゴリID」）。
 * 表示は「ID:2 サプライ・グッズ (12)」の形。
 */
export async function readSupplyGoodsCategoryId(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/category"));
  const link = goodsRootCategoryLink(page);
  await expect(link, "最上位のカテゴリに「サプライ・グッズ」が1件ある").toHaveCount(1);
  const text = (await link.innerText()).replace(/\s+/g, " ").trim();
  const m = /^ID:(\d+) サプライ・グッズ/.exec(text);
  if (!m) throw new Error(`「サプライ・グッズ」の行からIDを読めない: ${text}`);
  return m[1];
}

/** グッズ商品CSVの1行。正本が行ごとに定めた値（価格は正本に書かれた値） */
export type GoodsLine = { 商品コード: string; 商品名: string; 基準価格: string; 販売価格: string; 買取価格: string };

/**
 * 正本の列の値でグッズ商品CSVを組み、グッズ商品CSV登録画面からアップロードする。
 * - 全行共通: 商品IDは空・言語(ID)は日本語のID・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)はサプライ・グッズのID・
 *   購入グループ名称は既存の名称・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空。
 * - 商品公開ステータスは、正本が「2（公開）」と書くが、画面のCSV形式の説明は「1:公開 2:非公開 3:廃止」。
 *   正本の意図（公開）に合わせて、画面の説明で「公開」にあたる値を入れ、食い違いをシードの注記に残す。
 * - 正本は「表示された確認モーダルでアップロードを確定する」と書くが、いまの実装には確認モーダルが無い（設計書 M03-27 L0092 にはある。依頼者の判断待ち）。
 *   モーダルが出れば確定を押し、出なければそのまま進めて注記に残す。
 */
export async function uploadGoodsLines(page: Page, args: {
  what: string; fileName: string; categoryId: string; lines: GoodsLine[]; onIssue: Issue;
}): Promise<void> {
  const template = await downloadGoodsCsvTemplate(page);
  const japaneseLanguageId = await readJapaneseLanguageId(page);
  const sellGroupName = await readExistingSellGroupName(page);
  const published = publishedValue(template, "商品公開ステータス");
  if (published !== "2") {
    args.onIssue(`正本は商品公開ステータスを「2（公開）」と書くが、画面のCSV形式の説明では公開は「${published}」（2は公開ではない）。正本の意図の「公開」に合わせて ${published} を入れた`);
  }
  const branchPublished = publishedValue(template, "支店の商品公開ステータス");
  if (branchPublished !== "1") throw new Error(`正本は支店の商品公開ステータスを「1（公開）」と書くが、画面の説明では公開は「${branchPublished}」。どちらに合わせるか決められない`);
  const csv = buildGoodsCsv(template, args.lines.map((l) => ({
    "商品ID": "", "商品コード": l.商品コード, "商品名(日)": l.商品名, "商品名(英)": l.商品名,
    "言語(ID)": japaneseLanguageId, "商品公開ステータス": published, "支店の商品公開ステータス": branchPublished,
    "基準価格": l.基準価格, "販売価格": l.販売価格, "買取価格": l.買取価格,
    "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": args.categoryId, "購入グループ名称": sellGroupName,
    "原価単価": "10", "地域別販売制限": "0", "スマレジ連携フラグ": "0", "スマレジ商品コード": "", "部門ID": "",
  })));

  await page.goto(adminUrl("/product/product_goods_csv_upload"));
  await page.locator("#upload-form input[type=file]").setInputFiles({ name: args.fileName, mimeType: "text/csv", buffer: csv });
  const modal = page.locator(".modal.show").first();
  const navigated = page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }).then(() => "結果" as const);
  const confirmShown = modal.waitFor({ state: "visible", timeout: 180_000 }).then(() => "確認" as const);
  navigated.catch(() => undefined);
  confirmShown.catch(() => undefined);
  await page.locator("#upload-button").click();
  if ((await Promise.race([navigated, confirmShown])) === "確認") {
    await modal.locator("button.btn-ec-conversion, button[type=submit]").last().click();
    await navigated;
  } else {
    args.onIssue("グッズ商品CSVのアップロードで確認モーダルは出なかった（設計書 M03-27 L0092 にはあるが、いまの実装には無い。依頼者の判断待ち）。モーダルでの確定をせずに進めた");
  }
  for (const warning of await expectSaved(page, args.what)) args.onIssue(`${args.what}: ${warning}`);
}

/**
 * 在庫検索一覧で、商品コードの行（どの店舗・在庫区分でも）の数を数える。
 * 正本に清掃の手順が無い固定の商品コードは、前の実行の商品が残っていれば作り直さずに止める（流し直すかは依頼者が決める）。
 */
export async function expectNoProductCodes(page: Page, codes: string[], seedId: string): Promise<void> {
  const stock = new StockListPage(page);
  const left: string[] = [];
  for (const code of codes) {
    await stock.searchByProductCode(code);
    const rows = stock.rows.filter({ has: page.locator("td.col-name .text-muted", { hasText: new RegExp(`^\\s*${escapeRe(code)}\\s*$`) }) });
    if ((await rows.count()) > 0) left.push(code);
  }
  if (left.length) {
    throw new Error(`${seedId}: 商品コード ${left.join("・")} の商品が前の実行から残っている。正本に清掃の手順が無いので作り直さずに止めた（流し直すかは依頼者の判断が要る）`);
  }
}

/** 在庫検索一覧で商品コードを検索し、店舗・在庫区分「EC-CUBE」の行の商品名から在庫編集を開いて、入庫/問屋仕入で登録する */
export async function registerStockIn(page: Page, v: {
  商品コード: string; 店舗: string; 在庫変動理由: string; 在庫増減数: string; 仕入単価: string; 承認する管理者: string; onIssue: Issue;
}): Promise<void> {
  const stock = new StockListPage(page);
  await stock.searchByProductCode(v.商品コード);
  await stock.openEdit(stock.row(v.商品コード, v.店舗, "EC-CUBE"));
  await registerStockEdit(page, {
    changeType: "入庫/問屋仕入", reason: v.在庫変動理由, quantity: v.在庫増減数, purchasePrice: v.仕入単価, approverName: v.承認する管理者,
  }, `${v.商品コード} の在庫編集（${v.在庫増減数}）`, v.onIssue);
}

/** 在庫編集承認一覧の未承認の行 */
export type PendingRow = Awaited<ReturnType<StockApprovalListPage["rowValues"]>>[number];

/**
 * 在庫編集承認一覧を店舗で絞って開き、1ページ1000件の表示にして、未承認の行を読む（承認する管理者のセッションで使う）。
 * 一覧は未承認の行が上に来るが、登録日の古い順に並ぶので、表示件数を広げて今回の行が2ページ目以降に隠れないようにする。
 */
export async function pendingApprovalRows(page: Page, shop: string): Promise<PendingRow[]> {
  const list = new StockApprovalListPage(page);
  await list.open(shop);
  const res = await page.goto(adminUrl("/product/stock/approval_list/page/1/count/1000"));
  expect(res?.status(), "在庫編集承認一覧（1000件表示）の応答").toBe(200);
  await expect(page.locator("#form_search_stock_approval_list_update"), "在庫編集承認一覧の結果").toBeVisible();
  await page.waitForLoadState("load");
  return (await list.rowValues()).filter((r) => r.status === "未承認");
}

/**
 * 在庫編集承認一覧（いま開いている1000件表示）で、行を選んで「一括承認」→「承認する」→「OK」を押す。
 * 共通の部品（在庫編集承認一覧の承認）は使わない。確認のモーダルは、開いたときに承認対象の明細を画面の裏で読み込み、
 * 読み込みが終わると明細のCSVダウンロードのリンクが押せるようになる。読み込みの途中で「承認する」→「OK」を押すと、
 * 読み込みの要求の終わりがログイン中の状態の記録を後から上書きし、承認の結果の「保存しました」が出ない
 * （2026-10-20 17:34 の012で起きた。承認そのものは行われていた）。
 * 人が明細を見てから押すのと同じく、明細の読み込みが終わってから押す。「OK」のあとは、移った先の一覧の読み込みを待ってから結果を確かめる。
 */
export async function approveRows(page: Page, ids: string[], what: string, onIssue: Issue): Promise<void> {
  for (const id of ids) await page.locator(`#form_search_stock_approval_list_update input[name="approval_list_ids[]"][value="${id}"]`).check();
  const bulk = page.locator("#btn_bulk_approve");
  await expect(bulk, "「一括承認」").toBeVisible();
  await bulk.click();
  const modal = page.locator("#stockApprovalListConfirmModal");
  await expect(modal, "承認の確認").toBeVisible();
  await expect(modal.locator(".js-approval-line-items-csv-link"), "確認のモーダルの承認対象の明細を読み込み終えた（明細のCSVダウンロードが押せる）")
    .toHaveAttribute("aria-disabled", "false", { timeout: 120_000 });
  await modal.locator("#btn_bulk_approve_submit").click();
  const ok = modal.locator('.modal-footer-confirm button[type="submit"]');
  await expect(ok, "最終確認の「OK」").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), ok.click()]);
  for (const warning of await expectSaved(page, what)) onIssue(warning);
}

/**
 * 商品マスターで商品コードの商品を開き、「規格設定」から商品規格一覧を開いて、その商品コードの規格の編集画面を開く。
 * 編集画面の入力欄の入った画面の部分を返す。保存はしない。
 */
async function openClassEdit(page: Page, 商品コード: string, 商品名: string): Promise<Locator> {
  const productId = await readGoodsProductId(page, 商品コード, 商品名);
  await page.goto(adminUrl(`/product/product/${productId}/edit`));
  await openClassListFromProductEdit(page, productId);
  const row = page.locator("#ex-product_class tbody tr").filter({ has: page.getByRole("cell", { name: 商品コード, exact: true }) });
  await expect(row, `商品規格一覧に ${商品コード} の規格が1件`).toHaveCount(1);
  await row.getByRole("link", { name: "編集" }).click();
  await page.waitForURL(/\/product\/product\/class\/\d+\/edit\/\d+/);
  await page.waitForLoadState("load");
  return page.locator("form#form");
}

/**
 * 商品規格の編集画面で、いまの基準価格と販売価格（入力欄に入っている値）を読む。保存はしない。
 * 在庫履歴の「変更時販売価格」と比べる、商品規格の現在の販売価格を確かめるのに使う。
 */
export async function readClassPrices(page: Page, 商品コード: string, 商品名: string): Promise<{ 基準価格: string; 販売価格: string }> {
  const form = await openClassEdit(page, 商品コード, 商品名);
  return {
    基準価格: await form.locator("#admin_product_class_standard_price").inputValue(),
    販売価格: await form.locator("#admin_product_class_price02").inputValue(),
  };
}

/**
 * 商品マスターで商品コードの商品を開き、「規格設定」から商品規格一覧を開いて、その商品コードの規格の編集画面で
 * 基準価格と販売価格を変えて「商品規格を登録」を押す。保存後の編集画面の値を確かめる。
 * 商品規格の部門は画面で必須。グッズ商品CSVで部門IDを空にした規格は部門が無いので、選択肢の先頭を選んで注記に残す（正本に指定が無い）。
 */
export async function changeClassPrices(page: Page, v: { 商品コード: string; 商品名: string; 価格: string; onIssue: Issue }): Promise<void> {
  const form = await openClassEdit(page, v.商品コード, v.商品名);
  await form.locator("#admin_product_class_standard_price").fill(v.価格);
  await form.locator("#admin_product_class_price02").fill(v.価格);
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((nodes) => nodes
      .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).find((o) => o.value));
    if (!first) throw new Error("商品規格の部門の選択肢が無い");
    await section.selectOption(first.value);
    v.onIssue(`${v.商品コード} の商品規格は部門が空で、画面では部門が必須。正本に指定が無いので、選択肢の先頭の「${first.label}」を選んで保存した`);
  }
  // 送信のあと、移った先の画面の読み込みを待ってから結果を確かめる（開発用の設定では、どの画面にも出る赤い帯があり、
  // 結果の確かめが移る前の画面で済んでしまわないように）
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
    page.getByRole("button", { name: "商品規格を登録" }).click(),
  ]);
  for (const warning of await expectSaved(page, `${v.商品コード} の商品規格の価格の変更（${v.価格}）`)) v.onIssue(warning);
  await expect(form.locator("#admin_product_class_standard_price"), `${v.商品コード} の基準価格`).toHaveValue(new RegExp(`^${v.価格.replace(/\B(?=(\d{3})+$)/g, ",?")}$`));
  await expect(form.locator("#admin_product_class_price02"), `${v.商品コード} の販売価格`).toHaveValue(new RegExp(`^${v.価格.replace(/\B(?=(\d{3})+$)/g, ",?")}$`));
}
