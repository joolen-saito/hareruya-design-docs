/**
 * M07-03 買取情報編集 のうち、あとから足したケース（023）。正本: cases/M07-03_test_cases.tsv
 * 既存の spec は変えず、同じ部品で書き足した（シードは seeds/m07-06-e.ts）。
 * 実装していないケース（018・143）: 理由は記録 review/M07_unwritten_2026-11-24_dev.md。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVの内容を画面の枠に出す, CSVの枠のセル } from "../../lib/evidence_other";
import { CSVを読む } from "../../pages/admin/m07_buy";
import { 一覧から編集を開く } from "../../pages/admin/m07_03_edit";
import { 編集画面からCSVを出す } from "../../pages/admin/m07_06";
import { M0703B_ADMIN } from "../../seeds/m07-03-b";
import { コード023, 名前023, 読んだ前提E } from "../../seeds/m07-06-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 見出し9 = ["商品コード", "在庫増減数", "商品名", "販売価格", "買取価格", "言語ID", "略称タグ", "レアリティ", "状態"];
void (null as unknown as Page);

caseTest("IT-M07-03-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0703B_ADMIN);
  const 番号 = notes.get("〔買取番号-M0703-023〕");
  let file: import("@playwright/test").Download | null = null;
  let csv: Awaited<ReturnType<typeof CSVを読む>> | null = null;
  let ファイル名 = "";
  await step(1, async () => { await 一覧から編集を開く(page, 番号); });
  await step(2, async () => { file = await 編集画面からCSVを出す(page); });
  await step(3, async () => {
    expect(file, "買取商品一覧CSVのダウンロード").not.toBeNull();
    csv = await CSVを読む(file!);
    ファイル名 = file!.suggestedFilename();
    await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${ファイル名}`, 行: [csv.見出し, ...csv.行.map((r) => csv!.見出し.map((k) => r[k] ?? ""))] }]);
  });
  const p = 読んだ前提E();
  await expected(async () => {
    const 行 = csv!.行.findIndex((r) => r["商品コード"] === コード023());
    expect.soft(csv!.見出し, "見出し行の9項目（買取商品一覧CSV出力項目の順）").toEqual(見出し9);
    expect.soft(csv!.行.length, "データ行の数（売却する明細1件）").toBe(1);
    await expect.soft(CSVの枠のセル(page, 0, 行, "商品コード"), "商品コード").toHaveText(コード023());
    await expect.soft(CSVの枠のセル(page, 0, 行, "在庫増減数"), "在庫増減数（2）").toHaveText(/^2(\.0+)?$/);
    await expect.soft(CSVの枠のセル(page, 0, 行, "商品名"), "商品名").toHaveText(名前023());
    await expect.soft(CSVの枠のセル(page, 0, 行, "販売価格"), "販売価格（1500）").toHaveText(/^1500(\.0+)?$/);
    await expect.soft(CSVの枠のセル(page, 0, 行, "買取価格"), "買取価格（700）").toHaveText(/^700(\.0+)?$/);
    await expect.soft(CSVの枠のセル(page, 0, 行, "言語ID"), "言語ID（日本語）").toHaveText(p.言語ID.JP);
    await expect.soft(CSVの枠のセル(page, 0, 行, "略称タグ"), "略称タグ（CSV23）").toHaveText(p.略称タグ[0]);
    await expect.soft(CSVの枠のセル(page, 0, 行, "レアリティ"), "レアリティ（R）").toHaveText("R");
    await expect.soft(CSVの枠のセル(page, 0, 行, "状態"), "状態（NM）").toHaveText("NM");
  });
  note(`略称タグ「CSV23」は新しく作らず、略称タグの一覧の先頭の既存「${p.略称タグ[0]}」で代えた。商品はグッズ商品CSV登録（開発環境のカテゴリIDの不具合 ECCUBE_HARERUYA-3966）の代わりにカード商品CSV登録で作った。商品コード・商品名は実行の印つき`);
});
