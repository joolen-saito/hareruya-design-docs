/**
 * M12-09 特集タグ編集CSVダウンロード(検索項目)。ケースの正本: integration_test/casegen/cases/M12-09_test_cases.tsv
 *
 * 画面は、出力条件の入力欄と「特集タグ編集CSVダウンロード」ボタン1つ、「検索条件をクリア」リンクだけで作られている。
 * ボタンを押すとその場でCSVがダウンロードされる。正本の手順にある「出力条件を指定するための〜ボタン」と
 * 「表示された〜ボタン」の2段（現行仕様の節）は画面に無い。1段目のボタンを押してCSVを取得し、2段目は押せない旨を注記に残す。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { UsedCardPage, 今日 } from "../../pages/admin/m12_09_used_card";
import { M1209_ADMIN } from "../../seeds/m12-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 二段目なし = "画面にはボタンが1つだけで、1段目のボタンを押した時点でCSVがダウンロードされた。「表示された〜ボタン」は画面に現れないので押せない（1段目で取得したCSVを使う）";

const 当月1日 = () => 今日().slice(0, 8) + "01";

caseTest("IT-M12-09-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  await step(1, async () => { await p.open(); });
  await expected(async () => {
    const v = (await p.集計日From.inputValue()).replace(/-/g, "/");
    expect(v, "集計日(From)の初期表示（実行日の属する月の1日のはず）").toBe(当月1日());
  });
});

caseTest("IT-M12-09-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  await step(1, async () => { await p.open(); });
  let 選択肢: string[] = [];
  await step(2, async () => { 選択肢 = await p.フォーマットの選択肢(); });
  await expected(async () => {
    for (const n of ["試験フォーマットA", "試験フォーマットB", "試験フォーマットC"]) {
      expect.soft(選択肢.includes(n), `フォーマットの選択肢に「${n}」がある`).toBe(true);
    }
  });
});

caseTest("IT-M12-09-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  await step(1, async () => { await p.open(); });
  await expected(async () => {
    const 略式 = page.locator("#search_form").locator("button, a, input[type=submit]").filter({ hasText: /略式/ });
    expect(await 略式.count(), "採用枚数略式CSVダウンロードの操作入口の数").toBe(0);
    expect(await page.getByText("採用枚数略式").count(), "画面内の「採用枚数略式」の文字の数").toBe(0);
  });
});

caseTest("IT-M12-09-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  await step(1, async () => { await p.open(); });
  await expected(async () => {
    expect(await p.CSVボタン.count(), "出力条件を指定していない状態で表示されている、集計結果CSVを取得するボタンの数").toBe(0);
  });
});

async function 条件を入れて押す(p: UsedCardPage, from: string, to: string, formats: string[], 基本土地: boolean | null) {
  await p.入力する(p.集計日From, from);
  await p.入力する(p.集計日To, to);
  await p.フォーマットを選ぶ(formats);
  if (基本土地 !== null) await p.基本土地.setChecked(基本土地, { timeout: 20_000 });
}

caseTest("IT-M12-09-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.入力する(p.集計日From, "2026/04/01"); await p.入力する(p.集計日To, "2026/04/30"); });
  await step(3, async () => { await p.フォーマットを選ぶ(["試験フォーマットA", "試験フォーマットB"]); });
  await step(4, async () => { await p.基本土地.setChecked(true, { timeout: 20_000 }); });
  let csv: Awaited<ReturnType<UsedCardPage["CSVを取得する"]>> = null;
  await step(5, async () => { csv = await p.CSVを取得する(); if (csv) note("画面にはボタンが1つだけで、押した時点でCSVがダウンロードされた（出力条件を保持して入力欄を固定する中間の状態にならない）"); });
  await expected(async () => {
    expect.soft(await p.集計日From.isEditable(), "集計日(From)が編集できない状態").toBe(false);
    expect.soft(await p.集計日To.isEditable(), "集計日(To)が編集できない状態").toBe(false);
    expect.soft(await p.フォーマット.isEditable(), "フォーマットが編集できない状態").toBe(false);
    expect.soft(await p.基本土地.isEditable(), "基本土地項目追加が編集できない状態").toBe(false);
    expect.soft((await p.選ばれたフォーマット()).join("、"), "表示されている2件のフォーマット").toBe("試験フォーマットA、試験フォーマットB");
    expect.soft(await p.CSVボタン.isVisible(), "集計結果CSVを取得する操作入口が表示されている").toBe(true);
  });
});

caseTest("IT-M12-09-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.入力する(p.集計日From, "2000/01/01"); await p.入力する(p.集計日To, "2000/01/31"); });
  await step(3, async () => { await p.フォーマットを選ぶ(["試験フォーマットA", "試験フォーマットB"]); });
  await step(4, async () => { await p.基本土地.setChecked(true, { timeout: 20_000 }); });
  await step(5, async () => { const csv = await p.CSVを取得する(); if (csv) note("画面にはボタンが1つだけで、押した時点でCSVがダウンロードされた"); });
  await step(6, async () => { await p.open(); });
  await expected(async () => {
    expect.soft(await p.集計日To.inputValue(), "集計日(To)（手順2の値が保持されていない）").toBe("");
    expect.soft((await p.選ばれたフォーマット()).length, "選ばれているフォーマットの数（保持されていない）").toBe(0);
    expect.soft(await p.基本土地.isChecked(), "基本土地項目追加（保持されていない）").toBe(false);
    expect.soft((await p.集計日From.inputValue()).replace(/-/g, "/"), "集計日(From)（実行日の属する月の1日のはず）").toBe(当月1日());
  });
});

caseTest("IT-M12-09-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.入力する(p.集計日From, "2026/04/01"); await p.入力する(p.集計日To, "2026/04/30"); await p.フォーマットを選ぶ(["試験フォーマットA"]); });
  await step(3, async () => { const csv = await p.CSVを取得する(); if (csv) note("画面にはボタンが1つだけで、押した時点でCSVがダウンロードされた"); });
  await step(4, async () => {
    const 変更 = page.getByText("CSV出力条件を変更する", { exact: true });
    const n = await 変更.count();
    if (n === 0) note("「CSV出力条件を変更する」の操作入口が画面に無いので押せない");
    else await 変更.first().click({ timeout: 20_000 });
  });
  await expected(async () => {
    expect.soft(await p.集計日From.isEditable(), "出力条件の入力欄が編集できる状態").toBe(true);
    expect.soft((await p.選ばれたフォーマット()).includes("試験フォーマットA"), "フォーマットに「試験フォーマットA」が選択されている").toBe(false);
    expect.soft(await p.CSVボタン.count(), "集計結果CSVを取得する操作入口の数（表示されないはず）").toBe(0);
  });
});

caseTest("IT-M12-09-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  let 開いた日 = "";
  await step(1, async () => { 開いた日 = 今日(); await p.open(); });
  await expected(async () => {
    const v = await p.集計日From.inputValue();
    expect.soft(/^\d{4}-\d{2}-\d{2}$/.test(v), "集計日(From)の値が年月日の形である").toBe(true);
    const 基準 = new Date(`${開いた日.replace(/\//g, "-")}T00:00:00Z`);
    基準.setUTCDate(基準.getUTCDate() - 14);
    expect.soft(v.replace(/-/g, "/"), "集計日(From)（画面を開いた日の14日前）").toBe(基準.toISOString().slice(0, 10).replace(/-/g, "/"));
  });
});

caseTest("IT-M12-09-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1209_ADMIN);
  const p = new UsedCardPage(page);
  let 開いた日 = "";
  await step(1, async () => { 開いた日 = 今日(); await p.open(); });
  await step(2, async () => { await p.入力する(p.集計日From, "2026/04/01"); await p.入力する(p.集計日To, "2026/04/30"); await p.フォーマットを選ぶ(["試験フォーマットA"]); });
  await step(3, async () => { await p.クリアリンク.click({ timeout: 20_000 }); });
  await expected(async () => {
    const 基準 = new Date(`${開いた日.replace(/\//g, "-")}T00:00:00Z`);
    基準.setUTCDate(基準.getUTCDate() - 14);
    expect.soft((await p.集計日From.inputValue()).replace(/-/g, "/"), "集計日(From)（画面を開いた日の14日前）").toBe(基準.toISOString().slice(0, 10).replace(/-/g, "/"));
    expect.soft(await p.集計日To.inputValue(), "集計日(To)（空）").toBe("");
    expect.soft((await p.選ばれたフォーマット()).includes("試験フォーマットA"), "フォーマットに「試験フォーマットA」が選択されている").toBe(false);
  });
});
