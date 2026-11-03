/** M10-13 カスタムCSV出力設定（IT-M10-13-001・002・003・005）。ケースの正本: integration_test/casegen/cases/M10-13_test_cases.tsv */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { CustomCsvPage } from "../../pages/admin/m10_13_custom_csv";
import { M1013_ADMIN } from "../../seeds/m10-13";

caseTest("IT-M10-13-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { 選択肢 = await p.選択肢(p.CSV選択); });
  await expected(async () => {
    expect.soft(選択肢, "CSV選択の選択肢").toEqual(["商品CSV", "受注CSV", "配送CSV", "在庫CSV", "在庫移動・振替CSV", "在庫分割結合CSV"]);
  });
});

caseTest("IT-M10-13-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let 初期 = "";
  await step(1, async () => { await p.open(); });
  await step(2, async () => { 初期 = await p.選択中の表示名(p.CSV選択); });
  await expected(async () => { expect.soft(初期, "CSV選択の初期値").toBe("商品CSV"); });
});

caseTest("IT-M10-13-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  await step(1, async () => { await p.open(); });
  await expected(async () => {
    expect.soft(await p.選択中の表示名(p.追加されたCSV選択), "追加されたCSV選択の選択中の値").toBe("新規作成");
    expect.soft(await p.名前.inputValue(), "名前の欄（空）").toBe("");
  });
});

caseTest("IT-M10-13-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1013_ADMIN);
  const p = new CustomCsvPage(page);
  let 新規: number = -1, 既存: number = -1;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.定義を選ぶ("新規作成"); });
  await step(3, async () => { 新規 = await p.削除リンク.count(); });
  await step(4, async () => { await p.定義を選ぶ(rc("既存商品CSV-005")); });
  await step(5, async () => { 既存 = await p.削除リンク.count(); });
  await expected(async () => {
    expect.soft(新規, "「新規作成」の選択中の削除リンクの数（表示されない）").toBe(0);
    expect.soft(既存, "「既存商品CSV-005」の選択中の削除リンクの数（表示される）").toBe(1);
  });
});
