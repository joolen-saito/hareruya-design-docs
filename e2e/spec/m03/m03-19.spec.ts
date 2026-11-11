/**
 * M03-19 部門CSV出力。正本: cases/M03-19_test_cases.tsv
 * 実装したケースと解釈は記録 review/M03-19_progress_2026-11-11_dev.md。
 * 部門登録/編集画面の「CSV出力」を押し、ダウンロードしたファイルのバイト列を読む。
 * 部門は作らず、開発環境に既にある部門で読み替える（seeds/m03-19.ts）。期待結果の部門の値は、その部門の DB の値で読み替える。
 */
import { Download, Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { csvRecords, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { 部門の, 部門の一覧, 部門の値 } from "../../db/m03_19";
import { DepartmentPage } from "../../pages/admin/m03_18_department";
import { ダウンロードのバイト列 } from "../../pages/admin/m05_07_24_csv";
import { M0319_ADMIN } from "../../seeds/m03-19";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 番号の = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(呼び名);
const 見出し = ["ID", "部門名", "部門コード", "免税区分", "MTGBuyer表示フラグ"];
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

/** 「CSV出力」を押し、ダウンロードしたファイルのバイト列を返す */
async function CSV出力を押す(page: Page, d: DepartmentPage): Promise<{ ファイル名: string; バイト列: Buffer }> {
  await expect(d.CSV出力, "CSV出力ボタン").toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), d.CSV出力.click()]) as [Download, void];
  return { ファイル名: download.suggestedFilename(), バイト列: await ダウンロードのバイト列(download) };
}
const BOMを外した文字 = (b: Buffer) => new TextDecoder("utf-8", { fatal: true }).decode(b.subarray(0, 3).equals(BOM) ? b.subarray(3) : b);
const 行の値 = (r: Record<string, string>): 部門の値 => ({ ID: r["ID"] ?? "", 部門名: r["部門名"] ?? "", 部門コード: r["部門コード"] ?? "", 免税区分: r["免税区分"] ?? "", MTGBuyer表示フラグ: r["MTGBuyer表示フラグ"] ?? "" });

caseTest("IT-M03-19-003", async (ctx) => {
  const { page, step, expected } = ctx;
  const id = 番号の(ctx, "〔部門ID-M0319-003A〕");
  const 保存値 = 部門の(id);
  note(`部門ID ${id} の保存されている値（DB）: ${JSON.stringify(保存値)}`);
  supplement("正本の部門（M0319-003一般部門／M0319-C030-003／1／1）は作らず、開発環境に既にある部門で読み替え、期待結果はその部門の保存されている値（DB）と比べた");
  await loginAdmin(page, M0319_ADMIN);
  const d = new DepartmentPage(page);
  await step(1, async () => { await d.openNew(); });
  await step(2, async () => { await d.pressEdit(id); });
  let r!: { ファイル名: string; バイト列: Buffer };
  await step(3, async () => {
    await d.fill({ 部門名: "未保存部門", 部門コード: "UNSAVED", 免税区分: "消耗品" });
    note(`入力欄（登録しない）: ${JSON.stringify(await d.inputValues())}`);
    r = await CSV出力を押す(page, d);
    note(`ダウンロード: ${r.ファイル名}`);
  });
  let row: 部門の値 | undefined;
  await step(4, async () => {
    row = csvRecords(BOMを外した文字(r.バイト列)).map(行の値).find((x) => x.ID === id);
    note(`CSV の ID ${id} の行: ${JSON.stringify(row ?? null)}`);
  });
  await expected(async () => {
    expect.soft(row, `ID ${id} の行は未保存のフォームの値でなく、保存されている値`).toEqual(保存値);
    expect.soft(row?.部門名, "未保存の部門名は出ない").not.toBe("未保存部門");
    expect.soft(row?.部門コード, "未保存の部門コードは出ない").not.toBe("UNSAVED");
    expect.soft(部門の(id), "部門は保存されていない（DB の値は変わらない）").toEqual(保存値);
  });
});

caseTest("IT-M03-19-007", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M0319_ADMIN);
  const d = new DepartmentPage(page);
  let before = "";
  await step(1, async () => { await d.openNew(); before = page.url(); note(`表示中のURL: ${before}`); });
  let r!: { ファイル名: string; バイト列: Buffer };
  await step(2, async () => { r = await CSV出力を押す(page, d); note(`ダウンロード: ${r.ファイル名}（${r.バイト列.length} バイト）`); });
  let after = "";
  await step(3, async () => { await page.waitForTimeout(1_000); after = page.url(); note(`ダウンロード後のURL: ${after}`); });
  await expected(async () => {
    expect.soft(r.バイト列.length, "CSVがダウンロードされた").toBeGreaterThan(0);
    expect.soft(after, "部門登録画面から画面遷移しない（URL が同じ）").toBe(before);
    await expect.soft(d.部門名, "部門登録画面のまま（部門名の欄が見える）").toBeVisible();
  });
});

caseTest("IT-M03-19-008", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M0319_ADMIN);
  const d = new DepartmentPage(page);
  await step(1, async () => { await d.openNew(); });
  let r!: { ファイル名: string; バイト列: Buffer };
  await step(2, async () => { r = await CSV出力を押す(page, d); });
  let 先頭 = ""; let 読めた = false; let 一行目: string[] = []; let 文 = "";
  await step(3, async () => {
    先頭 = r.バイト列.subarray(0, 3).toString("hex");
    try { 文 = BOMを外した文字(r.バイト列); 読めた = true; } catch { 読めた = false; }
    一行目 = 読めた ? (文.split(/\r?\n/)[0] ?? "").split(",") : [];
    note(`先頭の3バイト: ${先頭}・UTF-8 で読めた: ${読めた}・1行目をカンマで分けた値: ${一行目.join(" | ")}`);
  });
  await expected(async () => {
    expect.soft(先頭, "先頭に BOM（EF BB BF）がある").toBe("efbbbf");
    expect.soft(読めた, "BOM 以降を UTF-8 で読める").toBe(true);
    expect.soft(一行目, "各フィールドがカンマで区切られている（見出し行の5項目）").toEqual(見出し);
    const rows = 読めた ? parseCsv(文) : [];
    expect.soft(rows.slice(1).every((x) => x.length === 5), "データ行もカンマで5項目に区切られている").toBe(true);
  });
});

caseTest("IT-M03-19-010", async (ctx) => {
  const { page, step, expected } = ctx;
  const ids = ["A", "B", "C"].map((x) => 番号の(ctx, `〔部門ID-M0319-010${x}〕`));
  let before: 部門の値[] = []; let 件数前 = 0;
  await step(1, async () => {
    before = ids.map((id) => 部門の(id)).filter((x): x is 部門の値 => !!x); 件数前 = 部門の一覧().length;
    note(`出力前の DB: ${JSON.stringify(before)}・部門の件数 ${件数前}`);
    supplement("部門のマスタに更新日時の列が無いので、更新日時は確かめない。件数は開発環境の部門の全件で見る（ケースの3件だけにしていない）");
  });
  await loginAdmin(page, M0319_ADMIN);
  const d = new DepartmentPage(page);
  await step(2, async () => { await d.openNew(); });
  await step(3, async () => { const r = await CSV出力を押す(page, d); note(`ダウンロード: ${r.ファイル名}`); });
  let after: 部門の値[] = []; let 件数後 = 0;
  await step(4, async () => { after = ids.map((id) => 部門の(id)).filter((x): x is 部門の値 => !!x); 件数後 = 部門の一覧().length; note(`出力後の DB: ${JSON.stringify(after)}・部門の件数 ${件数後}`); });
  await expected(async () => {
    expect.soft(after, "部門ID 3件の値は CSV出力の前から変わらない").toEqual(before);
    expect.soft(件数後, "部門の件数は CSV出力の前から変わらない").toBe(件数前);
  });
});
