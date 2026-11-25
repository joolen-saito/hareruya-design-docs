/**
 * M03-41 カテゴリCSV登録（その2）。正本: cases/M03-41_test_cases.tsv
 * 実装したのは 004（登録済みカテゴリの更新。対象商品数は更新前の7のまま）。
 * 階層は CSV の 99 でなくアプリが計算した 1（親0＝最上位）。カテゴリの表に画像パス・検索パラメータ・非表示フラグの列がある（db/m03_41_category.ts）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { カテゴリの対象商品数, カテゴリの保存内容 } from "../../db/m03_41_category";
import { CategoryCsvUploadPage, describeUpload } from "../../pages/admin/m03_41_category_csv";
import { caseCsvFile, M0341_ADMIN } from "../../seeds/m03-41";
import { M0341_004 } from "../../seeds/m03-41-d";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(page: Page): Promise<CategoryCsvUploadPage> {
  await loginAdmin(page, M0341_ADMIN);
  return new CategoryCsvUploadPage(page);
}

caseTest("IT-M03-41-004", async ({ page, notes, step, expected }) => {
  const csv = await signIn(page);
  const id = notes.get("〔カテゴリID-M0341-004B〕");
  const before = カテゴリの保存内容(id);
  note(`開始時のDBのカテゴリID ${id}: ${JSON.stringify(before)}。対象商品数 ${カテゴリの対象商品数(id)}`);
  let after: カテゴリの保存内容 | null = null;
  let count = -1;
  await step(1, () => csv.open());
  await step(2, async () => {
    const file = caseCsvFile("update-004.csv");
    await test.info().attach("アップロードしたファイル update-004.csv", { body: file.bytes, contentType: "text/csv" });
    note(`update-004.csv の内容: ${JSON.stringify(file.内容)}`);
    note(`アップロードの結果: ${describeUpload(await csv.upload(file))}`);
  });
  await step(3, async () => {
    after = カテゴリの保存内容(id);
    count = カテゴリの対象商品数(id);
    note(`取込後のDBのカテゴリID ${id}: ${JSON.stringify(after)}。対象商品数 ${count}`);
  });
  await expected(async () => {
    const v = M0341_004;
    expect(after, `カテゴリID ${id} の行`).not.toBeNull();
    expect.soft(after!.名称, "名称がCSVの値").toBe(v.名称);
    expect.soft(after!.表示順, "表示ランクがCSVの値").toBe(v.表示ランク);
    expect.soft(after!.親カテゴリID, "親カテゴリがCSVの値（0＝最上位。親なし）").toBeNull();
    expect.soft(after!.フロント非表示, "フロント非表示フラグがCSVの値（1）").toMatch(/^(1|true)$/);
    expect.soft(after!.支店非表示, "支店非表示フラグがCSVの値（1）").toMatch(/^(1|true)$/);
    expect.soft(after!.検索パラメータ, "検索パラメータがCSVの値").toBe(v.検索);
    expect.soft(after!.バナー画像パス, "最新セット用バナー画像パスがCSVの値").toBe(v.バナー);
    expect.soft(after!.アイコン画像パス, "カテゴリアイコン画像パスがCSVの値").toBe(v.アイコン);
    expect.soft(after!.階層, "階層は1に再計算される（CSVの99ではない）").toBe("1");
    expect.soft(count, "対象商品数は更新前の7を継続する（CSVの999ではない）").toBe(v.更新前対象商品数);
  });
});
