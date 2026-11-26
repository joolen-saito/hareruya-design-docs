/**
 * M03-41 カテゴリCSV登録（その3）。正本: cases/M03-41_test_cases.tsv。032（商品が紐付く最上位カテゴリの削除）・061（商品が紐付く階層2のカテゴリの削除）。
 * 既存の spec/m03/m03-41.spec.ts・m03-41-b.spec.ts は変えない（判定済みのケースの指紋を変えないため、別のファイルにした）。
 * - カテゴリの表に削除済みの印の列は無いので、行が無いことを削除済みとみなす（db/m03_41_category.ts）。
 * - 雛形の見出しに削除フラグの列が無いあいだは、シードがカテゴリを作らずに合否未判定（スキップ）で止める（031・060 と同じ）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { カテゴリの保存内容 } from "../../db/m03_41_category";
import { CategoryCsvUploadPage, describeUpload, UploadResult } from "../../pages/admin/m03_41_category_csv";
import { caseCsvFile, M0341_ADMIN } from "../../seeds/m03-41";
import "../../seeds/m03-41-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const show = (r: カテゴリの保存内容 | null) => (r ? JSON.stringify(r) : "行なし（削除済み）");

async function signIn(page: Page): Promise<CategoryCsvUploadPage> {
  await loginAdmin(page, M0341_ADMIN);
  return new CategoryCsvUploadPage(page);
}

async function uploadCase(csv: CategoryCsvUploadPage, name: string): Promise<UploadResult> {
  const file = caseCsvFile(name);
  await test.info().attach(`アップロードしたファイル ${name}`, { body: file.bytes, contentType: "text/csv" });
  note(`${name}（${file.文字コード}・改行${file.改行}）の内容: ${JSON.stringify(file.内容)}`);
  const r = await csv.upload(file);
  note(`${name} のアップロードの結果: ${describeUpload(r)}`);
  return r;
}

const readCategory = (id: string): カテゴリの保存内容 | null => { const r = カテゴリの保存内容(id); note(`DBのカテゴリID ${id}: ${show(r)}`); return r; };
const 上部の文 = (r: UploadResult | null) => [...(r?.上部のエラー ?? []), ...(r?.上部の成功 ?? [])];

caseTest("IT-M03-41-032", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const id = notes.get("〔カテゴリID-M0341-032〕");
  let after: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { await uploadCase(csv, "delete_with_product-032.csv"); });
  await step(3, async () => { after = readCategory(id); });
  await expected(async () => {
    expect.soft(after ? "行がある" : "行なし（削除済み）", `商品が紐付くカテゴリID ${id} が削除済みにならない（行が残る）`).toBe("行がある");
  });
});

caseTest("IT-M03-41-061", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const a = notes.get("〔カテゴリID-M0341-061A〕");
  const b = notes.get("〔カテゴリID-M0341-061B〕");
  let r: UploadResult | null = null;
  let top: string[] = [];
  let afterB: カテゴリの保存内容 | null = null;
  await step(1, () => csv.open());
  await step(2, async () => { r = await uploadCase(csv, "delete_product_depth2-M0341-CB061.csv"); });
  await step(3, async () => {
    top = 上部の文(r);
    note(`管理画面上部の表示: ${top.join(" / ") || "なし"}`);
    afterB = readCategory(b);
  });
  await expected(async () => {
    expect.soft(top, "管理画面上部に「関連するデータがあるため「削除子M0341-CB061B」を削除できませんでした」が表示される")
      .toEqual(expect.arrayContaining([expect.stringContaining("関連するデータがあるため「削除子M0341-CB061B」を削除できませんでした")]));
    expect.soft(afterB ? "行がある" : "行なし（削除済み）", `商品が紐付く階層2のカテゴリID ${b} が削除済みにならない`).toBe("行がある");
    expect.soft(afterB?.親カテゴリID, `カテゴリID ${b} の親カテゴリIDが ${a} のまま`).toBe(a);
    expect.soft(afterB?.階層, `カテゴリID ${b} の階層が 2 のまま`).toBe("2");
  });
});
