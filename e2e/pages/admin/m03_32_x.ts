/**
 * M03-32 高額商品価格変更CSV登録の続き（-x）のシードが使う、商品規格登録編集画面の操作。セレクタはここだけに書く。
 * - 登録済みの規格の商品コードを書き換えて「商品規格を登録」する（同じ商品コードの規格を2件作る。シード表「登録時にはエラーにならない」）。
 * - 登録済みの規格の公開状態を「廃止」にして「商品規格を登録」する（規格を削除済みにする）。
 * - 高額商品価格変更CSVアップロード画面の雛形の見出し行を読む。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { chooseByLabel, expectSaved } from "./common";
import { HighPriceCsvUploadPage } from "./m03_32_high_price_csv";
import { openClassEdit, openClassList } from "./m03_30_products";

type Issue = (m: string) => void;

/** 商品規格登録編集画面（開いた状態）で「商品規格を登録」を押し、保存の成功を確かめる */
async function 登録を押す(page: Page, what: string, onIssue: Issue): Promise<void> {
  await expect(page.locator('form#form input[name="admin_product_class[smaregi_alignment_flg]"]:checked'), `${what}: スマレジ連携フラグが「連携しない」`).toHaveValue("0");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.getByRole("button", { name: "商品規格を登録", exact: true }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) onIssue(`${what}: 警告「${w}」`);
}

/** 商品規格一覧から規格を開き、商品コードを書き換えて「商品規格を登録」する。登録後の画面で書き換わったことを確かめる */
export async function 規格の商品コードを変える(page: Page, 商品ID: string, 商品規格ID: string, 商品コード: string, what: string, onIssue: Issue): Promise<void> {
  await openClassList(page, 商品ID);
  await openClassEdit(page, 商品ID, 商品規格ID);
  const code = page.locator("form#form #admin_product_class_code");
  await code.fill(商品コード);
  await 登録を押す(page, what, onIssue);
  await expect(page.locator("form#form #admin_product_class_code"), `${what}: 登録後の商品コード`).toHaveValue(商品コード);
}

/** 商品規格一覧から規格を開き、公開状態を「廃止」にして「商品規格を登録」する */
export async function 規格を廃止にする(page: Page, 商品ID: string, 商品規格ID: string, what: string, onIssue: Issue): Promise<void> {
  await openClassList(page, 商品ID);
  await openClassEdit(page, 商品ID, 商品規格ID);
  await chooseByLabel(page.locator("form#form #admin_product_class_Status"), "廃止");
  await 登録を押す(page, what, onIssue);
}

/** 高額商品価格変更CSVアップロード画面を開き、「雛形ファイルダウンロード」で取った雛形の見出し行を返す */
export async function 高額の雛形の見出し(page: Page, 置き場: string): Promise<string[]> {
  const upload = new HighPriceCsvUploadPage(page, "高額商品価格変更");
  await upload.open();
  const d = await upload.downloadTemplate();
  fs.mkdirSync(置き場, { recursive: true });
  const p = path.join(置き場, path.basename(d.suggestedFilename()));
  await d.saveAs(p);
  const rows = parseCsv(decodeCsvBytes(fs.readFileSync(p)));
  if (!rows.length) throw new Error("高額商品価格変更CSVの雛形に見出し行が無い");
  return rows[0];
}
