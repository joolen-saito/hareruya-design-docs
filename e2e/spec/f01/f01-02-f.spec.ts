/** F01-02 支店ECTOP（タイルの商品カード）。正本: cases/F01-02_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { 支店URL } from "../../seeds/f01-02";
import { タイルのタグ名 } from "../../seeds/f01-02-tile";

caseTest("IT-F01-02-087", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const タグ名 = タイルのタグ名("テストタイルF0102-087");
  const card = () => top.タイルの商品(タグ名, rc("タイル非カード商品F0102-087")).first();
  await step(1, async () => { await top.open(支店URL("087")); await top.開いている(); });
  await step(2, async () => { await expect(card(), "「タイル非カード商品F0102-087」のカード").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await card().locator(".p-hareruya-product-card__language-label").count(), "カード言語の表示の数").toBe(0);
    expect.soft((await card().innerText()).includes("JP"), "言語コードJPの表示").toBe(false);
  });
});

const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });

caseTest("IT-F01-02-064", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const 表示 = rc("支店表示カテゴリ-064");
  const 非表示 = rc("支店非表示カテゴリ-064");
  const count: Record<string, number> = {};
  await step(1, async () => { await top.open(支店URL("064")); await top.開いている(); });
  await step(2, async () => {
    count[表示] = await page.getByText(表示).filter({ visible: true }).count();
    count[非表示] = await page.getByText(非表示).filter({ visible: true }).count();
    if (count[表示] === 0) note("支店ECTOPのどこにも「支店表示カテゴリ-064」が見つからなかった");
  });
  await expected(async () => {
    expect.soft(count[表示] > 0, "支店表示フラグが表示の「支店表示カテゴリ-064」の表示").toBe(true);
    expect.soft(count[非表示], "非表示の「支店非表示カテゴリ-064」の表示数").toBe(0);
  });
});
