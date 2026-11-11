/** F01-02 支店ECTOP。正本: cases/F01-02_test_cases.tsv */
import { caseTest, expect } from "../../lib/case";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { 支店URL } from "../../seeds/f01-02";

caseTest("IT-F01-02-009", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let status = 0;
  await step(1, async () => { status = await top.open(支店URL("009")); await top.開いている(); });
  await step(2, async () => { await expect(page.locator("section.p-hareruya-branch-top__best-sellers").first()).toHaveCount(0); });
  await expected(async () => {
    expect.soft(status, "支店ECTOPの応答").toBe(200);
    expect.soft(await top.今週の売れ筋.count(), "今週の売れ筋商品の区画の数").toBe(0);
  });
});

caseTest("IT-F01-02-021", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let status = 0;
  await step(1, async () => { status = await top.open(支店URL("021")); await top.開いている(); });
  await step(2, async () => { await expect(top.SALE中).toHaveCount(0); });
  await expected(async () => {
    expect.soft(status, "支店ECTOPの応答").toBe(200);
    expect.soft(await top.SALE中.count(), "SALE中の商品の区画の数").toBe(0);
  });
});

caseTest("IT-F01-02-057", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 数 = -1;
  await step(1, async () => { await top.open(支店URL("057")); await top.開いている(); 数 = await top.link(/買取をご希望の方はこちら/).count(); });
  await step(2, async () => { await top.link(/買取をご希望の方はこちら/).first().click({ timeout: 20_000 }); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(数, "高額買取のバナーのリンク（画像の代替文字「買取をご希望の方はこちら 高価買取サービス」）の数").toBeGreaterThan(0);
    expect.soft(new URL(page.url()).pathname, "遷移先（ネット買取トップページ）").toMatch(/purchase/);
  });
});
