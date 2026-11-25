/**
 * M12-10 特集タグ編集CSVダウンロード(検索項目)（IT-M12-10-001・002・005）。ケースの正本: integration_test/casegen/cases/M12-10_test_cases.tsv
 * 栗野さん分の巻き取り（2026-11-25）。画面は、出力条件の入力欄と「特集タグ編集CSVダウンロード」ボタン1つだけで、押すとその場でCSVがダウンロードされる。
 * 正本の手順の2段目のボタンは画面に無いので、1段目で取得したCSVを使う（m12-10.spec.ts と同じ読み方）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { scene, ダウンロードしたCSVの内容を撮る } from "../../lib/evidence_other";
import { UsedCardPage } from "../../pages/admin/m12_09_used_card";
import { M1210_ADMIN } from "../../seeds/m12-10";
import "../../seeds/m12-10-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
type Csv = Awaited<ReturnType<UsedCardPage["CSVを取得する"]>>;
const 列 = (rows: string[][], name: string): string[] => {
  const i = rows[0]?.indexOf(name) ?? -1;
  if (i < 0) throw new Error(`CSVの見出しに「${name}」が無い（見出し: ${(rows[0] ?? []).join("、")}）`);
  return rows.slice(1).map((r) => r[i] ?? "");
};
const 数値 = (v: string) => Number(v.replace(/,/g, ""));
const 二段目なし = "画面にはボタンが1つだけで、押した時点でCSVがダウンロードされた。「表示された〜ボタン」は画面に現れないので押せない（1段目で取得したCSVを使った）";


caseTest("IT-M12-10-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  supplement("本店の在庫の入庫と承認は行っていない（この確かめは在庫数を見ない）");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.入力する(p.集計日From, "2026/04/01"); await p.入力する(p.集計日To, "2026/04/30"); });
  await step(3, async () => { await p.フォーマットを選ぶ([rc("試験フォーマットA-001")]); });
  await step(4, async () => { const csv = await p.CSVを取得する(); note(`ボタンを押した結果: ${csv ? "CSVがダウンロードされた" : "ダウンロードされなかった"}`); });
  await step(5, async () => { await p.open(); });
  await expected(async () => {
    expect.soft(await p.集計日From.isVisible(), "検索フォーム（集計日(From)欄）が表示されている").toBe(true);
    expect.soft(await p.CSVボタン.isVisible(), "検索フォームの「特集タグ編集CSVダウンロード」ボタンが表示されている").toBe(true);
    expect.soft(await page.locator("table tbody tr").count(), "集計結果の表の行数（表示されない）").toBe(0);
  });
});

caseTest("IT-M12-10-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  let csv: Csv = null;
  supplement("本店の在庫の入庫と承認は行っていない（この確かめは在庫数を見ない）");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.入力する(p.集計日From, "2026/04/01"); await p.入力する(p.集計日To, "2026/04/30"); });
  await step(3, async () => { await p.フォーマットを選ぶ([rc("試験フォーマットA-002")]); });
  await step(4, async () => { csv = await p.CSVを取得する(); note(二段目なし); });
  await expected(async () => {
    const rows = csv?.rows ?? [[]];
    if (csv) await ダウンロードしたCSVの内容を撮る(page, rows, scene.stepLabel(4, "ダウンロードしたCSVの内容"));
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID（集計結果1件）").toEqual([notes.get("〔商品ID-M1210-002〕")]);
    expect.soft(列(rows, "採用枚数").map(数値), "採用枚数").toEqual([3]);
  });
});

caseTest("IT-M12-10-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1210_ADMIN);
  const p = new UsedCardPage(page);
  let csv: Csv = null;
  supplement("本店の在庫の入庫と承認は行っていない（この確かめは在庫数を見ない）");
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.入力する(p.集計日From, "2026/04/01"); await p.入力する(p.集計日To, "2026/04/30"); });
  await step(3, async () => { await p.フォーマットを選ぶ([rc("試験フォーマットA-005")]); });
  await step(4, async () => { csv = await p.CSVを取得する(); });
  await step(5, async () => { note(二段目なし); });
  await step(6, async () => { if (csv) await ダウンロードしたCSVの内容を撮る(page, csv.rows, scene.stepLabel(6, "ダウンロードしたCSVの内容")); });
  await expected(async () => {
    const rows = csv?.rows ?? [[]];
    expect.soft(csv !== null, "CSVがダウンロードされた").toBe(true);
    expect.soft(rows.length - 1, "データ行の数（集計結果1件）").toBe(1);
    expect.soft(rows[0]?.length, "見出しの項目数（商品IDからタグまで）").toBe(17);
    expect.soft(rows[0]?.[0], "先頭の項目").toBe("商品ID");
    expect.soft(rows[0]?.[16], "末尾の項目").toBe("タグ");
    expect.soft(rows[1]?.length, "データ行の項目数").toBe(17);
    expect.soft(列(rows, "商品ID"), "データ行の商品ID").toEqual([notes.get("〔商品ID-M1210-005〕")]);
  });
});
