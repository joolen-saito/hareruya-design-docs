/** M12-05 入荷通知依頼 一覧表示(検索項目)（IT-M12-05-002・003）。ケースの正本: integration_test/casegen/cases/M12-05_test_cases.tsv */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductRequestPage } from "../../pages/admin/m12_analysis";
import { M1205_ADMIN } from "../../seeds/m12-05";

caseTest("IT-M12-05-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  const 状態: boolean[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.検索枠ボタン.click({ timeout: 20_000 }); await page.waitForTimeout(800); 状態.push(await p.検索枠.isVisible()); });
  await step(3, async () => { await p.検索枠ボタン.click({ timeout: 20_000 }); await page.waitForTimeout(800); 状態.push(await p.検索枠.isVisible()); });
  await expected(async () => {
    expect.soft(状態[0], "1回目の押下のあと、識別ID 3〜13の検索枠が表示されている").toBe(false);
    expect.soft(状態[1], "2回目の押下のあと、識別ID 3〜13の検索枠が表示されている").toBe(true);
  });
});

caseTest("IT-M12-05-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1205_ADMIN);
  const p = new ProductRequestPage(page);
  let 初期: Record<string, string> = {};
  await step(1, async () => { await p.open(); 初期 = await p.値を読む(); });
  await step(2, async () => {
    await p.キーワード.fill("クリア確認", { timeout: 20_000 });
    await p.依頼日From.fill("2026-07-01", { timeout: 20_000 });
    await p.依頼日To.fill("2026-07-31", { timeout: 20_000 });
    await p.金額From.fill("1500", { timeout: 20_000 });
    await p.金額To.fill("1000", { timeout: 20_000 });
  });
  await step(3, async () => {
    await page.locator('input[name^="admin_analysis_product_request[language]"]').evaluateAll((ns) => ns.forEach((n) => { (n as HTMLInputElement).checked = false; }));
    await page.getByLabel("英語", { exact: true }).check({ timeout: 20_000 });
    const opts = await p.並び替え項目.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).filter(Boolean));
    const 初期の項目 = await p.並び替え項目.inputValue();
    await p.並び替え項目.selectOption(opts.find((v) => v !== 初期の項目)!, { timeout: 20_000 });
    await page.locator('input[name="admin_analysis_product_request[asc_desc]"][value="DESC"]').check({ timeout: 20_000 });
    await p.売上分析タグ.first().selectOption({ label: "タグT1" }, { timeout: 20_000 });
    await p.表示件数.selectOption({ label: "10" }, { timeout: 20_000 }).catch(async () => { await p.表示件数.selectOption("10", { timeout: 20_000 }); });
  });
  await step(4, async () => { await p.クリア.click({ timeout: 20_000 }); });
  await expected(async () => {
    const いま = await p.値を読む();
    for (const k of Object.keys(初期)) {
      expect.soft(いま[k], `${k}（手順1で記録した初期値へ戻る）`).toBe(初期[k]);
    }
  });
});
