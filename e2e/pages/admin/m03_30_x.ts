/**
 * M03-30 基準価格変更CSV登録の続き（-x）の画面操作。セレクタはここだけに書く。正本: cases/M03-30_test_cases.tsv
 * - 開発者ツールの代わりに、取込のフォームのなりすまし対策トークンを消す・書き換える、未対応の項目を足す（画面の要素をスクリプトで書き換える）。
 * - 雛形ファイルの見出し行を読む。在庫検索一覧の行の基準価格・販売価格・買取価格を読む。
 */
import fs from "node:fs";
import path from "node:path";
import { Locator, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { PriceCsvUploadPage } from "./m03_30_price_csv";

/** 取込のフォームのなりすまし対策トークンを消す（開発者ツールでの削除の代わり）。消した数を返す */
export async function トークンを消す(page: Page): Promise<number> {
  return page.locator('form#upload-form input[name$="[_token]"]').evaluateAll((els) => { els.forEach((e) => e.remove()); return els.length; });
}

/** 取込のフォームのなりすまし対策トークンの値を書き換える（開発者ツールでの変更の代わり）。書き換えた数を返す */
export async function トークンを書き換える(page: Page, 値: string): Promise<number> {
  return page.locator('form#upload-form input[name$="[_token]"]').evaluateAll((els, v) => { els.forEach((e) => { (e as HTMLInputElement).value = v; }); return els.length; }, 値);
}

/** 取込のフォームへ、隠し項目を足す（開発者ツールでの追加の代わり） */
export async function 項目を足す(page: Page, 名前: string, 値: string): Promise<void> {
  await page.locator("form#upload-form").evaluate((f, a) => {
    const i = document.createElement("input");
    i.type = "hidden"; i.name = a.name; i.value = a.value;
    f.appendChild(i);
  }, { name: 名前, value: 値 });
}

/** 基準価格変更CSVアップロード画面（開いた状態）の「雛形ファイルダウンロード」で取った雛形の見出し行 */
export async function 雛形の見出し(page: Page, 置き場: string): Promise<string[]> {
  const upload = new PriceCsvUploadPage(page, "基準価格変更");
  const d = await upload.downloadTemplate();
  fs.mkdirSync(置き場, { recursive: true });
  const p = path.join(置き場, path.basename(d.suggestedFilename()));
  await d.saveAs(p);
  const rows = parseCsv(decodeCsvBytes(fs.readFileSync(p)));
  if (!rows.length) throw new Error("基準価格変更CSVの雛形に見出し行が無い");
  return rows[0];
}

/** 在庫検索一覧の行の基準価格・販売価格・買取価格（3桁区切りを外した数字） */
export async function 在庫の行の価格(row: Locator): Promise<{ 基準価格: string; 販売価格: string; 買取価格: string }> {
  return row.evaluate((tr) => {
    const cells = Array.from(tr.querySelectorAll("td.col-price"));
    const div = (c: Element | undefined, n: number) => ((c?.querySelectorAll("div")[n]?.textContent) ?? "").replace(/[,\s]/g, "");
    return { 基準価格: div(cells[0], 0), 販売価格: div(cells[0], 1), 買取価格: div(cells[1], 0) };
  });
}
