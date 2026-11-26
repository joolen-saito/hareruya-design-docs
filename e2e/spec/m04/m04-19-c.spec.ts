/**
 * M04-19 欠品履歴検索一覧の続き（038・039）。正本: cases/M04-19_test_cases.tsv。シード: seeds/m04-19-c.ts
 * 作りは spec/m04/m04-19-b.spec.ts（006）と同じ。商品コードには実行の印が付く（検索語も同じ値）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { ShortageHistoryPage, 数字だけ } from "../../pages/admin/m04_19_shortage_history";
import { M0419_ADMIN } from "../../seeds/m04-19";
import "../../seeds/m04-19-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(page: Page): Promise<ShortageHistoryPage> {
  await loginAdmin(page, M0419_ADMIN);
  return new ShortageHistoryPage(page);
}

async function clearAndSearch(h: ShortageHistoryPage, step: CaseCtx["step"], 語: string): Promise<void> {
  await step(1, () => h.openFromMenu());
  await step(2, () => h.clearConditions());
  await step(3, () => h.checkShortageList());
  await step(4, () => h.fillKeyword(語));
  await step(5, () => h.search());
}

caseTest("IT-M04-19-038", async ({ page, step, expected }) => {
  const h = await signIn(page);
  const code = rc("M0419-CB038-A");
  await clearAndSearch(h, step, code);
  await expected(async () => {
    const rows = await h.readRows();
    note(`行: ${JSON.stringify(rows)}`);
    expect.soft(rows.length, "欠品履歴検索一覧(検索結果)の行の数").toBe(1);
    expect.soft(rows[0]?.商品コード, "商品コード").toBe(code);
    expect.soft(数字だけ(rows[0]?.欠品時販売価格 ?? ""), `欠品時販売価格（表示「${rows[0]?.欠品時販売価格}」）が受注情報の販売価格1980`).toBe("1980");
  });
});

caseTest("IT-M04-19-039", async ({ page, step, expected }) => {
  const h = await signIn(page);
  const code = rc("M0419-CB039-A");
  await clearAndSearch(h, step, code);
  await expected(async () => {
    const rows = await h.readRows();
    note(`行: ${JSON.stringify(rows)}`);
    expect.soft(rows.length, "欠品履歴検索一覧(検索結果)に欠品履歴1行だけが表示される（入庫承認待ち在庫情報の行は表示されない）").toBe(1);
    expect.soft(rows[0]?.商品コード, "商品コード").toBe(code);
    expect.soft(数字だけ(rows[0]?.欠品時販売価格 ?? ""), `欠品時販売価格（表示「${rows[0]?.欠品時販売価格}」）が1980`).toBe("1980");
  });
});
