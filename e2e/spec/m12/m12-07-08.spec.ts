/**
 * M12-07 フォーマット売上分析 集計一覧表示（IT-M12-07-001・002）と M12-08 フォーマット売上分析 CSVダウンロード（IT-M12-08-002・003）。
 * ケースの正本: integration_test/casegen/cases/M12-07_test_cases.tsv・M12-08_test_cases.tsv
 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { FormatSalesPage } from "../../pages/admin/m12_analysis";
import { M1207_ADMIN } from "../../seeds/m12-07";
import { M1208_ADMIN } from "../../seeds/m12-08";

caseTest("IT-M12-07-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1207_ADMIN);
  const p = new FormatSalesPage(page);
  await step(1, async () => { await p.open(); });
  await expected(async () => {
    expect.soft(await p.通販.isChecked(), "集計対象(通販)がチェックON").toBe(true);
    expect.soft(await p.店舗.isChecked(), "集計対象(店舗)がチェックON").toBe(true);
  });
});

caseTest("IT-M12-07-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1207_ADMIN);
  const p = new FormatSalesPage(page);
  await step(1, async () => { await p.open(); });
  await expected(async () => {
    expect.soft(await p.集計結果.count(), "集計結果の表示の数（初期表示では出ない）").toBe(0);
  });
});

caseTest("IT-M12-08-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const p = new FormatSalesPage(page);
  await step(1, async () => { await p.open(); });
  await expected(async () => {
    expect.soft(await p.CSVリンク.count(), "CSVダウンロードの操作の入口の数（集計結果が無い状態では出ない）").toBe(0);
  });
});

caseTest("IT-M12-08-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1208_ADMIN);
  const p = new FormatSalesPage(page);
  await step(1, async () => { await p.openCsvUrl(); });
  await expected(async () => {
    await expect.soft(p.エラー.first(), "管理画面上部にエラーが表示される").toBeVisible();
    expect.soft(new URL(page.url()).pathname, "フォーマット売上分析 集計一覧表示画面へ遷移する").toMatch(/\/analysis\/format-sales$/);
  });
});
