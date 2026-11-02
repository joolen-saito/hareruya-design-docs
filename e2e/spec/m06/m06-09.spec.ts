/**
 * M06-09 買取集計データCSV出力。正本: cases/M06-09_test_cases.tsv
 *
 * 画面だけで準備できる 002 だけを実装した（記録 review/M06-09_progress_2026-11-01.md）。ほかのケースは買取集計データをDBへ直接設定するシードを使う。
 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { SummaryPage } from "../../pages/admin/m06_09_summary";
import { M0609_ADMIN_002 } from "../../seeds/m06-09";

// 集計が0件の日はCSVダウンロードボタンが出ない
caseTest("IT-M06-09-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M0609_ADMIN_002);
  const s = new SummaryPage(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.集計日を入れる("2099-01-01", "2099-01-01"); await s.検索する(); });
  await step(3, async () => { await expect(s.日別の欄(), "日別の集計結果欄").toBeVisible(); });
  await expected(async () => {
    expect.soft(await s.日別の表の行().count(), "日別の集計の件数").toBe(0);
    expect.soft(await s.日別の文(), "日別の集計欄の案内文").toContain("日別の集計データがありませんでした");
    await expect.soft(s.CSVダウンロードのボタン(), "CSVダウンロードボタンが表示されない").toHaveCount(0);
  });
});
