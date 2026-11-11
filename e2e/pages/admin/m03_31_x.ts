/**
 * M03-31 セール用価格変更CSV登録の続き（-x）の画面操作。正本: cases/M03-31_test_cases.tsv
 * - セール用価格変更CSVアップロード画面（開いた状態）の「雛形ファイルダウンロード」で取った雛形の見出し行を読む。
 * - 商品規格登録編集画面のセールフラグ・基準価格・販売価格・買取価格の表示を読む。
 * セレクタは pages/admin/m03_30_price_csv.ts・m03_09_class_edit.ts にあるものを使う。
 */
import fs from "node:fs";
import path from "node:path";
import { Locator, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { ClassEditPage } from "./m03_09_class_edit";
import { PriceCsvUploadPage } from "./m03_30_price_csv";

/** セール用価格変更CSVアップロード画面（開いた状態）の「雛形ファイルダウンロード」で取った雛形の見出し行 */
export async function セール用の雛形の見出し(page: Page, 置き場: string): Promise<string[]> {
  const upload = new PriceCsvUploadPage(page, "セール用価格変更");
  const d = await upload.downloadTemplate();
  fs.mkdirSync(置き場, { recursive: true });
  const p = path.join(置き場, path.basename(d.suggestedFilename()));
  await d.saveAs(p);
  const rows = parseCsv(decodeCsvBytes(fs.readFileSync(p)));
  if (!rows.length) throw new Error("セール用価格変更CSVの雛形に見出し行が無い");
  return rows[0];
}

export type 規格の表示 = { セールフラグ: "チェックあり" | "チェックなし"; 基準価格: string; 販売価格: string; 買取価格: string };

/** 商品規格登録編集画面（開いた状態）のセールフラグ・基準価格・販売価格・買取価格（金額は3桁区切りを外した数字） */
export async function 規格の表示を読む(page: Page): Promise<規格の表示> {
  const e = new ClassEditPage(page);
  const n = async (l: Locator) => (await l.inputValue()).replace(/[,\s￥円]/g, "");
  return {
    セールフラグ: (await e.セールフラグ.isChecked()) ? "チェックあり" : "チェックなし",
    基準価格: await n(e.基準価格), 販売価格: await n(e.販売価格), 買取価格: await n(e.買取価格),
  };
}
