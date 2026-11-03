/**
 * M12-09 特集タグ編集CSVダウンロード(検索項目)のうち、集計結果のCSVを確かめるケース（008〜027）。正本: integration_test/casegen/cases/M12-09_test_cases.tsv
 * 画面の作り（ボタンが1つでその場にCSVが出る）と、正本の2段のボタンの食い違いは m12-09.spec.ts の冒頭を参照。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { UsedCardPage } from "../../pages/admin/m12_09_used_card";
import { M1209_ADMIN } from "../../seeds/m12-09";
import { 集計対象の記録 } from "../../db/m12_deck";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 二段目なし = "画面にはボタンが1つだけで、1段目のボタンを押した時点でCSVがダウンロードされた。「表示された〜ボタン」は画面に現れないので押せない（1段目で取得したCSVを使う）";

// ---- 集計結果のCSVを確かめるケース（008〜027） ----

type Csv = Awaited<ReturnType<UsedCardPage["CSVを取得する"]>>;
const 列 = (rows: string[][], name: string): string[] => {
  const i = rows[0]?.indexOf(name) ?? -1;
  if (i < 0) throw new Error(`CSVの見出しに「${name}」が無い（見出し: ${(rows[0] ?? []).join("、")}）`);
  return rows.slice(1).map((r) => r[i] ?? "");
};
const 数値 = (v: string) => Number(v.replace(/,/g, ""));
type 条件 = { from: string; to?: string; formats: string[]; 基本土地?: boolean };

const 日付を入れる = async (p: UsedCardPage, c: 条件) => { await p.入力する(p.集計日From, c.from); if (c.to) await p.入力する(p.集計日To, c.to); };
const 形式を入れる = async (p: UsedCardPage, c: 条件) => {
  await p.フォーマットを選ぶ(c.formats);
  if (c.基本土地 !== undefined) await p.基本土地.setChecked(c.基本土地, { timeout: 20_000 });
};
const 押す = async (p: UsedCardPage): Promise<Csv> => {
  const csv = await p.CSVを取得する();
  if (csv) note("画面にはボタンが1つだけで、押した時点でCSVがダウンロードされた");
  return csv;
};
/** 手順の「表示された〜ボタンを押す」。画面に無いので押せない旨を注記に残す（1段目で取得したCSVを使う） */
const 二段目を探す = async (p: UsedCardPage): Promise<number> => {
  const n = await p.CSVボタン.count();
  note(二段目なし);
  return n;
};
/** 取得したCSVの行。ダウンロードされなかったときは空 */
const CSVの行 = (csv: Csv): string[][] => csv?.rows ?? [[]];

caseTest("IT-M12-09-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/04/01", to: "2026/04/30", formats: ["試験フォーマットA"] };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(rows.length, "CSVの行数（ヘッダ行1行と集計結果1行）").toBe(2);
    expect.soft(rows[0]?.includes("商品ID"), "1行目がヘッダ行である").toBe(true);
  });
});
caseTest("IT-M12-09-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/04/01", to: "2026/04/30", formats: ["試験フォーマットA"] };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(rows.length, "CSVの行数（ヘッダ行1行だけ）").toBe(1);
    expect.soft(rows[0]?.includes("商品ID"), "1行目がヘッダ行である").toBe(true);
  });
});
caseTest("IT-M12-09-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", to: "2026/06/30", formats: ["試験フォーマットC"], 基本土地: false };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); await 形式を入れる(p, c); });
  await step(3, async () => { csv = await 押す(p); });
  await step(4, async () => { await 二段目を探す(p); });
  await step(5, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1209-012A〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([4]);
  });
});
caseTest("IT-M12-09-016", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/10", to: "2026/06/20", formats: ["試験フォーマットA"], 基本土地: false };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID").length, "データ行の数").toBe(2);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-016C〕")), "商品ID 016C（集計日(To)の当日のデッキ）の行がある").toBe(true);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-016B〕")), "商品ID 016B（集計日(From)の当日のデッキ）の行がある").toBe(true);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-016A〕")), "集計日(From)の前日のデッキの商品の行が無い").toBe(false);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-016D〕")), "集計日(To)の翌日のデッキの商品の行が無い").toBe(false);
  });
});
caseTest("IT-M12-09-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/04/01", formats: ["試験フォーマットA"], 基本土地: false };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID").length, "データ行の数").toBe(2);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-018B〕")), "商品ID 018B（出力した日のデッキ）の行がある").toBe(true);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-018A〕")), "商品ID 018A の行がある").toBe(true);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-018C〕")), "出力した日の翌日のデッキの商品の行が無い").toBe(false);
  });
});
caseTest("IT-M12-09-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", to: "2026/06/30", formats: ["試験フォーマットA"], 基本土地: false };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（1行だけ）").toEqual([notes.get("〔商品ID-M1209-019〕")]);
    expect.soft(列(rows, "カード名(英)").some((n) => n.includes("M1209 Card 019 Y")), "代表の商品が無いカード（カードID 019B）の行が出力されない").toBe(false);
  });
});
caseTest("IT-M12-09-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", to: "2026/06/30", formats: ["試験フォーマットB", "試験フォーマットC"], 基本土地: false };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); await 形式を入れる(p, c); });
  await step(3, async () => { csv = await 押す(p); });
  await step(4, async () => { await 二段目を探す(p); });
  await step(5, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1209-020A〕"), notes.get("〔商品ID-M1209-020B〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([4, 3]);
  });
});
caseTest("IT-M12-09-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", to: "2026/06/30", formats: ["試験フォーマットC"], 基本土地: false };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); await 形式を入れる(p, c); });
  await step(3, async () => { csv = await 押す(p); });
  await step(4, async () => { await 二段目を探す(p); });
  await step(5, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1209-021A〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([5]);
  });
});
caseTest("IT-M12-09-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", to: "2026/06/30", formats: ["試験フォーマットA"], 基本土地: true };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1209-022X〕"), notes.get("〔商品ID-M1209-022Y〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([4, 3]);
  });
});
caseTest("IT-M12-09-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", formats: ["試験フォーマットB", "試験フォーマットC"], 基本土地: true };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1209-023X〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([7]);
  });
});
caseTest("IT-M12-09-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", formats: ["試験フォーマットA"], 基本土地: true };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1209-024X〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([5]);
  });
});
caseTest("IT-M12-09-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", to: "2026/06/30", formats: ["試験フォーマットC"], 基本土地: false };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1209-025Y〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([3]);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-025X〕")), "商品ID 025X の行が出力されない").toBe(false);
  });
});
caseTest("IT-M12-09-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", to: "2026/06/30", formats: ["試験フォーマットB"], 基本土地: false };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1209-026Y〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([3]);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-026Z〕")), "商品ID 026Z の行が出力されない").toBe(false);
  });
});
caseTest("IT-M12-09-027", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/06/01", to: "2026/06/30", formats: ["試験フォーマットC"], 基本土地: false };
  let csv: Csv = null;
  let rows: string[][] = [[]];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await 日付を入れる(p, c); });
  await step(3, async () => { await 形式を入れる(p, c); });
  await step(4, async () => { csv = await 押す(p); });
  await step(5, async () => { await 二段目を探す(p); });
  await step(6, async () => { rows = CSVの行(csv); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（順に）").toEqual([notes.get("〔商品ID-M1209-027Y〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "各行の採用枚数（数値）").toEqual([3]);
    expect.soft(列(rows, "商品ID").includes(notes.get("〔商品ID-M1209-027Z〕")), "商品ID 027Z の行が出力されない").toBe(false);
  });
});
caseTest("IT-M12-09-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  const c: 条件 = { from: "2026/04/01", to: "2026/04/30", formats: ["試験フォーマットA"] };
  const 記録 = () => 集計対象の記録([notes.get("〔デッキID-M1209-011〕")], [notes.get("〔カードID-M1209-011〕")], [notes.get("〔商品ID-M1209-011〕")]);
  let 前 = "", 後 = "";
  let csv: Csv = null;
  await step(1, async () => { 前 = 記録(); });
  await step(2, async () => { await p.open(); });
  await step(3, async () => { await 日付を入れる(p, c); });
  await step(4, async () => { await 形式を入れる(p, c); });
  await step(5, async () => { csv = await 押す(p); });
  await step(6, async () => { await 二段目を探す(p); });
  await step(7, async () => { 後 = 記録(); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(後 === 前, "ダウンロードの前後で集計対象データのレコードと値が変わらない").toBe(true);
  });
});
