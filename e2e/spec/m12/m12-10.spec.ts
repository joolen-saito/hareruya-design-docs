/**
 * M12-10 特集タグ編集CSVダウンロード(検索項目)（IT-M12-10-006・008・013・015〜018）。ケースの正本: integration_test/casegen/cases/M12-10_test_cases.tsv
 * 画面は、出力条件の入力欄と「特集タグ編集CSVダウンロード」ボタン1つだけで、ボタンを押すとその場でCSVがダウンロードされる。
 * 正本の手順の2段のボタン（「出力条件を指定するための〜」と「表示された〜」）の2段目は画面に無いので、1段目で取得したCSVを使い、注記に残す。
 * 専用フォーマットの名前は、実行ごとの印を付けた値で作っている（rc）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { UsedCardPage } from "../../pages/admin/m12_09_used_card";
import { M1210_ADMIN } from "../../seeds/m12-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 二段目なし = "画面にはボタンが1つだけで、1段目のボタンを押した時点でCSVがダウンロードされた。「表示された〜ボタン」は画面に現れないので押せない（1段目で取得したCSVを使う）";

type Csv = Awaited<ReturnType<UsedCardPage["CSVを取得する"]>>;
const 列 = (rows: string[][], name: string): string[] => {
  const i = rows[0]?.indexOf(name) ?? -1;
  if (i < 0) throw new Error(`CSVの見出しに「${name}」が無い（見出し: ${(rows[0] ?? []).join("、")}）`);
  return rows.slice(1).map((r) => r[i] ?? "");
};
const 数値 = (v: string) => Number(v.replace(/,/g, ""));
const 押す = async (p: UsedCardPage): Promise<Csv> => {
  const csv = await p.CSVを取得する();
  if (csv) note("画面にはボタンが1つだけで、押した時点でCSVがダウンロードされた");
  return csv;
};
const 二段目を探す = async (p: UsedCardPage): Promise<number> => { const n = await p.CSVボタン.count(); note(二段目なし); return n; };
const CSVの行 = (csv: Csv): string[][] => csv?.rows ?? [[]];

caseTest("IT-M12-10-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  await step(1, async () => { await page.goto(adminUrl("/logout"), { waitUntil: "domcontentloaded" }); });
  await step(2, async () => { await page.goto(adminUrl("/analysis/used-card"), { waitUntil: "domcontentloaded" }); });
  await expected(async () => {
    expect.soft(await p.集計日From.count(), "特集タグ編集CSVダウンロード画面の集計日(From)欄の数（表示されない）").toBe(0);
    expect.soft(new URL(page.url()).pathname, "ログアウト後に開いた画面（ログイン画面へ移る）").toMatch(/\/login$/);
  });
});

caseTest("IT-M12-10-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    await p.入力する(p.集計日From, "2026/03/01");
    await p.入力する(p.集計日To, "2026/03/31");
    await p.フォーマットを選ぶ([rc("試験フォーマットB-013")]);
  });
  await step(3, async () => { csv = await 押す(p); });
  await step(4, async () => { await 二段目を探す(p); });
  await step(5, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(rows.length, "CSVの行数（ヘッダ行だけ）").toBe(1);
    expect.soft(rows[0]?.includes("商品ID"), "1行目がヘッダ行である").toBe(true);
  });
});
caseTest("IT-M12-10-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    await p.入力する(p.集計日From, "2026/06/01");
    await p.入力する(p.集計日To, "2026/06/30");
    await p.フォーマットを選ぶ([rc("試験フォーマットB-008")]);
    await p.基本土地.setChecked(true, { timeout: 20_000 });
  });
  await step(3, async () => { csv = await 押す(p); });
  await step(4, async () => { await 二段目を探す(p); });
  await step(5, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1210-008B〕"), notes.get("〔商品ID-M1210-008A〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([10, 6]);
  });
});
caseTest("IT-M12-10-015", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    await p.入力する(p.集計日From, "2026/06/01");
    await p.入力する(p.集計日To, "2026/06/30");
    await p.フォーマットを選ぶ([rc("試験フォーマットM1210-CB015-F")]);
    await p.基本土地.setChecked(false, { timeout: 20_000 });
  });
  await step(3, async () => { csv = await 押す(p); });
  await step(4, async () => { await 二段目を探す(p); });
  await step(5, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1210-CB015X〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([5]);
  });
});
caseTest("IT-M12-10-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    await p.入力する(p.集計日From, "2026/06/01");
    await p.入力する(p.集計日To, "2026/06/30");
    await p.フォーマットを選ぶ([rc("試験フォーマットM1210-CB016-F")]);
    await p.基本土地.setChecked(false, { timeout: 20_000 });
  });
  await step(3, async () => { csv = await 押す(p); });
  await step(4, async () => { await 二段目を探す(p); });
  await step(5, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1210-CB016Y〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([3]);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1210-CB016X〕")), "商品ID CB016X の行が出力されない").toBe(false);
  });
});
caseTest("IT-M12-10-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    await p.入力する(p.集計日From, "2026/06/01");
    await p.入力する(p.集計日To, "2026/06/30");
    await p.フォーマットを選ぶ([rc("試験フォーマットM1210-CB017-F")]);
    await p.基本土地.setChecked(true, { timeout: 20_000 });
  });
  await step(3, async () => { csv = await 押す(p); });
  await step(4, async () => { await 二段目を探す(p); });
  await step(5, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1210-CB017Y〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([4]);
  });
});
caseTest("IT-M12-10-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    await p.入力する(p.集計日From, "2026/06/01");
    await p.入力する(p.集計日To, "2026/06/30");
    await p.フォーマットを選ぶ([rc("試験フォーマットM1210-CB018-F")]);
    await p.基本土地.setChecked(false, { timeout: 20_000 });
  });
  await step(3, async () => { csv = await 押す(p); });
  await step(4, async () => { await 二段目を探す(p); });
  await step(5, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1210-CB018Y〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([3]);
    expect.soft(列(rows, "カード名(英)").some((n) => n.includes("M1210-CB018-CARD-Z")), "代表の商品が無いカード（カードID CB018Z）の行が出力されない").toBe(false);
  });
});
