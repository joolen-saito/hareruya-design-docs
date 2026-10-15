/** M03-01 のグッズ商品 CSV を、管理画面で取得した雛形と選択値から組み立てる。 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { goodsRootCategoryLink } from "./product_masters";

type CsvColumn = { label: string; description: string; required: boolean };
export type GoodsCsvTemplate = { headers: string[]; columns: CsvColumn[] };

/** CSV の先頭1行を、引用符と BOM を考慮して読み取る。 */
function readHeader(csv: string): { headers: string[]; rest: string } {
  const text = csv.replace(/^\uFEFF/, "");
  const headers: string[] = [];
  let cell = "", quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
    } else if (ch === "," || ch === "\r" || ch === "\n") {
      headers.push(cell);
      const end = ch === "\r" && text[i + 1] === "\n" ? i + 2 : i + 1;
      return ch === "," ? readNext(text, end, headers) : { headers, rest: text.slice(end) };
    } else if (ch === '"' && cell === "" && !closed) {
      quoted = true;
    } else if (closed || ch === '"') {
      throw new Error("グッズ商品 CSV 雛形の見出しが CSV 形式ではない");
    } else {
      cell += ch;
    }
  }
  if (quoted) throw new Error("グッズ商品 CSV 雛形の引用符が閉じていない");
  headers.push(cell);
  return { headers, rest: "" };
}

/** 先頭セル以降を同じ CSV 規則で読む。 */
function readNext(text: string, start: number, headers: string[]): { headers: string[]; rest: string } {
  let cell = "", quoted = false, closed = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
    } else if (ch === ",") {
      headers.push(cell); cell = ""; closed = false;
    } else if (ch === "\r" || ch === "\n") {
      headers.push(cell);
      const end = ch === "\r" && text[i + 1] === "\n" ? i + 2 : i + 1;
      return { headers, rest: text.slice(end) };
    } else if (ch === '"' && cell === "" && !closed) {
      quoted = true;
    } else if (closed || ch === '"') {
      throw new Error("グッズ商品 CSV 雛形の見出しが CSV 形式ではない");
    } else {
      cell += ch;
    }
  }
  if (quoted) throw new Error("グッズ商品 CSV 雛形の引用符が閉じていない");
  headers.push(cell);
  return { headers, rest: "" };
}

function decodeTemplate(bytes: Buffer): string[] {
  for (const encoding of ["utf-8", "shift_jis"]) {
    try {
      const decoded = new TextDecoder(encoding, { fatal: true }).decode(bytes);
      const parsed = readHeader(decoded);
      if (parsed.rest.trim() === "" && parsed.headers.includes("商品ID") && parsed.headers.includes("商品コード"))
        return parsed.headers;
    } catch { /* UTF-8 でなければ画面の SJIS-win 雛形を試す */ }
  }
  throw new Error("画面からダウンロードしたグッズ商品 CSV 雛形を読み取れない");
}

/** 正本どおり、管理画面の雛形を毎回ダウンロードして全列・列順を確定する。 */
export async function downloadGoodsCsvTemplate(page: Page): Promise<GoodsCsvTemplate> {
  await page.goto(adminUrl("/product/product_goods_csv_upload"));
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#download-template-button").click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const headers = decodeTemplate(Buffer.concat(chunks));
  const columns = await page.locator("table.table-striped.table-bordered:not(#csv_import_history_table) tbody tr").evaluateAll((rows) => rows.map((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length !== 2) throw new Error("グッズ商品 CSV の画面列定義を読めない");
    return {
      label: [...cells[0].childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? "").join("").trim(),
      description: cells[1].textContent?.trim() ?? "",
      required: cells[0].querySelector(".badge") !== null,
    };
  }));
  expect(headers, "ダウンロードした雛形の列名と画面のCSV形式・列順が一致").toEqual(columns.map((c) => c.label));
  if (headers.length !== new Set(headers).size) throw new Error("グッズ商品 CSV 雛形に重複列がある");
  return { headers, columns };
}

/** 日本語の言語 ID を商品検索画面の選択肢から読む。 */
export async function readJapaneseLanguageId(page: Page): Promise<string> {
  await page.goto(adminUrl("/product"));
  const choices = await page.locator('input[name^="admin_search_product[language]"]').evaluateAll((inputs) => inputs.map((node) => {
    const input = node as HTMLInputElement;
    return { id: input.value, label: input.labels?.item(0)?.textContent?.trim() ?? "" };
  }));
  const matches = choices.filter((choice) => choice.label === "日本語" && /^\d+$/.test(choice.id));
  if (matches.length !== 1) throw new Error(`日本語の言語 ID を画面から一意に読めない: ${JSON.stringify(choices)}`);
  return matches[0].id;
}

/** グッズ直下の既存カテゴリだけを選ぶ。無い場合に推測 ID や新規カテゴリは補わない。 */
export async function readExistingGoodsChildCategoryId(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/category"));
  const goods = goodsRootCategoryLink(page);
  await expect(goods, "グッズ親カテゴリが画面に1件ある").toHaveCount(1);
  await goods.click();
  await expect(page.locator('nav[aria-label="breadcrumb"] li[aria-current="page"] a').last()).toHaveText("サプライ・グッズ");
  const children = page.locator('li.sortable-item[data-id][id^="ex-category-"]');
  if (await children.count() === 0) throw new Error("グッズ配下の既存カテゴリが画面に無い");
  const id = await children.first().getAttribute("data-id");
  if (!id || !/^\d+$/.test(id)) throw new Error("グッズ子カテゴリの ID を画面から読めない");
  return id;
}

/** 購入グループは CSV 取込の照合キーである日本語名称を画面から読む。 */
export async function readExistingSellGroupName(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/sell_group"));
  const names = (await page.locator(".sell-group-master-list tbody tr td:first-child a").allInnerTexts())
    .map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) throw new Error("既存の購入グループ名称を管理画面から読めない");
  return names[0];
}

/** CSV形式欄の「1:公開」等を読み、公開に対応する値を決める。 */
export function publishedValue(template: GoodsCsvTemplate, columnName: string): string {
  const description = template.columns.find((column) => column.label === columnName)?.description;
  if (!description) throw new Error(`${columnName} の公開状態の説明が画面に無い`);
  const entries = [...description.matchAll(/(\d+)\s*:\s*([^\d:]+)/g)]
    .map((match) => ({ value: match[1], label: match[2].trim() }));
  const matches = entries.filter((entry) => entry.label === "公開");
  if (matches.length !== 1) throw new Error(`${columnName} の公開値を画面から一意に読めない: ${description}`);
  return matches[0].value;
}

function csvLine(values: string[]): string {
  return values.map((value) => /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value).join(",");
}

/** 指定値以外の列は空にする。商品IDは新規行では空、明示した更新行では採番済みIDを要求する。 */
export function buildGoodsCsv(template: GoodsCsvTemplate, values: Record<string, string>, mode?: "create" | "update"): Buffer;
export function buildGoodsCsv(template: GoodsCsvTemplate, values: Record<string, string>[], mode?: "create" | "update"): Buffer;
export function buildGoodsCsv(
  template: GoodsCsvTemplate,
  values: Record<string, string> | Record<string, string>[],
  mode: "create" | "update" = "create",
): Buffer {
  const rows = Array.isArray(values) ? values : [values];
  if (rows.length === 0) throw new Error("グッズ商品 CSV のデータ行が無い");
  const labels = new Set(template.headers);
  const csvRows: string[] = [];
  for (const values of rows) {
    for (const key of Object.keys(values)) if (!labels.has(key)) throw new Error(`雛形に正本指定列「${key}」が無い`);
    for (const column of template.columns) {
      if (column.required && !values[column.label]) throw new Error(`正本に値がない必須列「${column.label}」を推測できない`);
    }
    for (const key of ["言語(ID)", "商品公開ステータス", "支店の商品公開ステータス", "サイズ", "重量", "商品カテゴリ(ID)", "基準価格", "販売価格", "買取価格", "原価単価"])
      if (!/^\d+$/.test(values[key] ?? "")) throw new Error(`${key} は正本指定の非負整数か画面で得た数値 ID でなければならない`);
    if (mode === "create" && values["商品ID"] !== "") throw new Error("新規行の商品IDは正本どおり空にする");
    if (mode === "update" && !/^\d+$/.test(values["商品ID"] ?? ""))
      throw new Error("更新行の商品IDは画面で控えた数値IDでなければならない");
    if (values["部門ID"] !== "" && !/^\d+$/.test(values["部門ID"] ?? ""))
      throw new Error("部門IDは正本指定の空欄か画面で控えた数値 ID でなければならない");
    csvRows.push(csvLine(template.headers.map((header) => values[header] ?? "")));
  }
  return Buffer.from(`${csvLine(template.headers)}\n${csvRows.join("\n")}\n`, "utf8");
}

export async function uploadGoodsCsv(page: Page, csv: Buffer, name: string): Promise<void> {
  await page.goto(adminUrl("/product/product_goods_csv_upload"));
  await page.locator("#upload-form input[type=file]").setInputFiles({ name, mimeType: "text/csv", buffer: csv });
  await page.locator("#upload-button").click();
}
