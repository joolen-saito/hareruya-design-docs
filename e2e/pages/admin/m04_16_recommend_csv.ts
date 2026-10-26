/**
 * M04-16 在庫リコメンドCSV出力の画面操作（在庫検索一覧の「在庫リコメンドCSV出力」）と、そのシードで使うグッズ商品CSV登録。
 * セレクタはここにだけ書く。
 *
 * 画面の作り（アプリの在庫検索一覧のテンプレートで確かめたこと）:
 * - 検索結果があるときだけ、一覧の上に CSV 出力のボタンの並び（在庫リコメンドCSV出力・在庫情報CSV出力・在庫情報カスタムCSV出力）が出る。
 * - 「在庫リコメンドCSV出力」はリンクで、直前の検索条件（画面が覚えている）で CSV をダウンロードさせる。検索結果のチェックは送らない。
 * - 店舗の欄の初期値は、ログイン中の管理者のデフォルト検索表示店舗。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue, readExistingSellGroupName } from "./m03_01_goods_csv";
import { StockListPage } from "./stock_edit";

type Issue = (message: string) => void;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---- 在庫検索一覧 ----

/** 在庫検索一覧(検索入力)画面を開く（メニューから開くのと同じ画面） */
export async function openStockList(page: Page): Promise<StockListPage> {
  const list = new StockListPage(page);
  const res = await page.goto(adminUrl("/product/stock"));
  expect(res?.status(), "在庫検索一覧の応答").toBe(200);
  await expect(list.form, "在庫検索一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
  return list;
}

/** コードの欄に入れて「検索」を押す（ほかの欄は画面の初期値のまま） */
export async function searchByCode(page: Page, code: string): Promise<void> {
  const list = new StockListPage(page);
  await list.form.locator("#admin_search_stock_list_product_code").fill(code);
  const button = list.form.locator('button[type="submit"]').first();
  await expect(button, "検索ボタン").toHaveText(/検索/);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), button.click()]);
}

/** 検索欄「店舗」でいま選ばれている店舗（表示名） */
export async function selectedShops(page: Page): Promise<string[]> {
  return new StockListPage(page).form.locator("#admin_search_stock_list_base_info").evaluate((n) =>
    Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
}

/** 検索結果の件数の表示（「検索結果：N件が該当しました」の N）。出ていなければ null */
export async function resultCount(page: Page): Promise<number | null> {
  const text = (await page.locator(".card-body p.mb-2").filter({ hasText: /検索結果/ }).allInnerTexts()).join(" ");
  const m = /(\d[\d,]*)\s*件/.exec(text);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

/** 検索結果の CSV 出力のボタンの並び（一覧の上の行） */
export function csvButtonGroup(page: Page): Locator {
  return page.locator("div.d-flex.flex-wrap").filter({ has: page.locator("#stock_csv_pulldown") });
}

/** 「在庫リコメンドCSV出力」ボタン */
export function recommendButton(page: Page): Locator {
  return csvButtonGroup(page).getByRole("link", { name: "在庫リコメンドCSV出力", exact: true });
}

/** 検索結果で、商品コードの行（店舗・在庫区分ごとの行）のチェックを付ける。付けた行の数を返す */
export async function checkRowsOfCode(page: Page, code: string): Promise<number> {
  const rows = new StockListPage(page).rows.filter({
    has: page.locator("td.col-name .text-muted", { hasText: new RegExp(`^\\s*${escapeRe(code)}\\s*$`) }),
  });
  const n = await rows.count();
  if (n === 0) throw new Error(`検索結果に商品コード ${code} の行が無い`);
  for (let i = 0; i < n; i++) await rows.nth(i).locator('input[name="productStockIds[]"]').check();
  return n;
}

/** 検索結果でチェックが付いている行の商品コード */
export async function checkedCodes(page: Page): Promise<string[]> {
  return new StockListPage(page).rows.filter({ has: page.locator('input[name="productStockIds[]"]:checked') })
    .locator("td.col-name .text-muted").allInnerTexts().then((t) => t.map((x) => x.trim()));
}

/** 検索結果の行の商品コード（重複を除く） */
export async function listedCodes(page: Page): Promise<string[]> {
  const codes = (await new StockListPage(page).rows.locator("td.col-name .text-muted").allInnerTexts()).map((t) => t.trim());
  return [...new Set(codes)];
}

/** 「在庫リコメンドCSV出力」を押してダウンロードを待つ */
export async function downloadRecommendCsv(page: Page): Promise<Download> {
  const button = recommendButton(page);
  await expect(button, "「在庫リコメンドCSV出力」ボタン").toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  return download;
}

/** ダウンロードした CSV を行と列に分ける（文字コードは UTF-8 で読めなければ Shift_JIS） */
export async function readCsvRows(download: Download): Promise<string[][]> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return parseCsv(decodeCsvBytes(Buffer.concat(chunks)));
}

// ---- シード: グッズ商品CSV登録 ----

/** 商品マスター(検索入力)の言語の選択肢から、表示名（日本語・英語）の言語IDを読む */
export async function readLanguageId(page: Page, label: string): Promise<string> {
  await page.goto(adminUrl("/product"));
  const choices = await page.locator('input[name^="admin_search_product[language]"]').evaluateAll((inputs) => inputs.map((node) => {
    const input = node as HTMLInputElement;
    return { id: input.value, label: input.labels?.item(0)?.textContent?.trim() ?? "" };
  }));
  const hit = choices.filter((c) => c.label === label && /^\d+$/.test(c.id));
  if (hit.length !== 1) throw new Error(`言語「${label}」の言語IDを画面から一意に読めない: ${JSON.stringify(choices)}`);
  return hit[0].id;
}

export type GoodsLine = { 商品コード: string; 商品名: string; 言語ID: string };

/**
 * グッズ商品CSV登録で、雛形の列に正本の値を入れた行を取り込む。
 * - 正本が値を定める列: 商品ID（空）・商品コード・言語(ID)・商品公開ステータス（公開を表す値。画面のCSV形式の説明から読む）・商品名(日)。
 * - 正本が「埋めた」とだけ書く必須列（支店の商品公開ステータス・商品名(英)・サイズ・重量・商品カテゴリ(ID)・購入グループ名称・
 *   基準価格・販売価格・買取価格・原価単価）: 支店の商品公開ステータスは公開を表す値、商品名(英)は商品名(日)と同じ、サイズ1・重量1、
 *   商品カテゴリ(ID)はサプライ・グッズのID、購入グループ名称は既存の名称、基準価格100・販売価格100・買取価格10・原価単価10。
 *   地域別販売制限・スマレジ連携フラグは雛形にあれば0（M04-17 の部品と同じ）。部門IDは空。
 * - 正本は「確認モーダルで実行する」と書くが、いまの実装には確認モーダルが無い（設計書 M03-27 L0092 にはある）。
 *   モーダルが出れば確定を押し、出なければそのまま進めて報告に残す。
 */
export async function uploadGoods(page: Page, args: { what: string; fileName: string; categoryId: string; lines: GoodsLine[]; onIssue: Issue }): Promise<void> {
  const template = await downloadGoodsCsvTemplate(page);
  const sellGroupName = await readExistingSellGroupName(page);
  const published = publishedValue(template, "商品公開ステータス");
  const branchPublished = publishedValue(template, "支店の商品公開ステータス");
  const optional: Record<string, string> = {};
  for (const col of ["地域別販売制限", "スマレジ連携フラグ"]) if (template.headers.includes(col)) optional[col] = "0";
  if (template.headers.includes("スマレジ商品コード")) optional["スマレジ商品コード"] = "";
  const csv = buildGoodsCsv(template, args.lines.map((l) => ({
    "商品ID": "", "商品コード": l.商品コード, "商品名(日)": l.商品名, "商品名(英)": l.商品名, "言語(ID)": l.言語ID,
    "商品公開ステータス": published, "支店の商品公開ステータス": branchPublished,
    "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": args.categoryId, "購入グループ名称": sellGroupName,
    "基準価格": "100", "販売価格": "100", "買取価格": "10", "原価単価": "10", "部門ID": "", ...optional,
  })));
  await page.goto(adminUrl("/product/product_goods_csv_upload"));
  await page.waitForLoadState("load");
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
    args.onIssue("グッズ商品CSVのアップロードで確認モーダルは出なかった（設計書 M03-27 L0092 にはあるが、いまの実装には無い）。モーダルでの確定をせずに進めた");
  }
  await page.waitForLoadState("load");
  for (const warning of await expectSaved(page, args.what)) args.onIssue(`${args.what}: ${warning}`);
}
