/** F01-02 支店ECTOP（タイル）。正本: cases/F01-02_test_cases.tsv */
import { test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { 支店URL } from "../../seeds/f01-02";
import { タイルのタグ名 } from "../../seeds/f01-02-tile";

const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });

/** タイルの中に、出るはずの商品が出て、出ないはずの商品が出ないことを確かめる */
function タイルの商品(n: string, タグ: string, 出る: string[], 出ない: string[]): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new BranchTopPage(page);
    const タグ名 = タイルのタグ名(タグ);
    let タイル数 = -1;
    const 表示: Record<string, number> = {};
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); });
    await step(2, async () => {
      await expect(top.タイル(タグ名).first(), `タイル「${タグ}」`).toBeVisible({ timeout: 30_000 }).catch(() => note(`タイル「${タグ}」が支店ECTOPに見つからなかった`));
      タイル数 = await top.タイル(タグ名).count();
      for (const name of [...出る, ...出ない]) 表示[name] = await top.タイルの商品(タグ名, rc(name)).count();
    });
    await expected(async () => {
      expect.soft(タイル数, `タイル「${タグ}」の数（1つ）`).toBe(1);
      for (const name of 出る) expect.soft(表示[name] > 0, `「${name}」の表示`).toBe(true);
      for (const name of 出ない) expect.soft(表示[name], `「${name}」の表示数`).toBe(0);
    });
  };
}
caseTest("IT-F01-02-035", タイルの商品("035", "テストタイルA", ["テストタイル商品-035"], []));
caseTest("IT-F01-02-036", タイルの商品("036", "テストタイルA-036", ["タイル公開商品"], ["タイル非公開商品"]));
caseTest("IT-F01-02-037", タイルの商品("037", "テストタイルA-037", ["タイル在庫1商品"], ["タイル在庫0商品"]));
caseTest("IT-F01-02-039", タイルの商品("039", "テストタイルA", ["タイルNM価格1円商品"], ["タイルNM価格0円商品"]));
caseTest("IT-F01-02-041", タイルの商品("041", "テストタイルA", ["タイル高額コードなし商品"], ["タイル高額コードあり商品"]));
caseTest("IT-F01-02-040", タイルの商品("040", "テストタイルA", ["タイル非NM価格100円商品"], ["タイル非NM価格99円商品"]));
caseTest("IT-F01-02-043", タイルの商品("043", "テストタイルA-043", ["タイルNM基準あり商品"], ["タイルNM基準なし商品"]));

caseTest("IT-F01-02-044", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const タグ名 = タイルのタグ名("上限確認タイル-044");
  let 数 = -1;
  await step(1, async () => { await top.open(支店URL("044")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.タイル(タグ名).first(), "タイル「上限確認タイル-044」").toBeVisible({ timeout: 30_000 }).catch(() => note("タイル「上限確認タイル-044」が見つからなかった"));
    数 = await top.タイルの商品(タグ名).count();
  });
  await expected(async () => { expect.soft(数, "「上限確認タイル-044」に表示された商品の数").toBe(3); });
});

caseTest("IT-F01-02-049", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const タグ名 = タイルのタグ名("テストタイルA-049");
  const card = () => top.タイルの商品(タグ名, rc("タイル画像なし商品")).first();
  await step(1, async () => { await top.open(支店URL("049")); await top.開いている(); });
  await step(2, async () => { await expect(card(), "「タイル画像なし商品」のカード").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await card().locator("img.p-hareruya-product-card__img").first().getAttribute("src", { timeout: 15_000 }), "商品画像の表示（代替画像）").toContain("no_image_product");
  });
});

caseTest("IT-F01-02-052", async ({ page, notes, step, expected }) => {
  const top = new BranchTopPage(page);
  const タグ名 = タイルのタグ名("テストタイルA-052");
  const card = () => top.タイルの商品(タグ名, rc("テストタイル商品-052")).first();
  await step(1, async () => { await top.open(支店URL("052")); await top.開いている(); await expect(card()).toBeVisible({ timeout: 30_000 }); });
  await step(2, async () => { await Promise.all([page.waitForURL(/\/products\/detail\/\d+/, { timeout: 30_000 }).catch(() => undefined), card().locator("a.p-hareruya-product-card__name").first().click({ timeout: 20_000 })]); await page.waitForLoadState("load"); });
  await expected(async () => {
    const id = notes.get("〔商品ID-F0102-052〕");
    expect.soft(new URL(page.url()).pathname, "遷移先（商品詳細画面）").toMatch(new RegExp(`/products/detail/${id}$`));
  });
});

caseTest("IT-F01-02-055", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const タグ名 = タイルのタグ名("テストタイルA-055");
  let A = -1; let B = -1;
  await step(1, async () => { await top.open(支店URL("055")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.タイル(タグ名).first(), "タイル「テストタイルA-055」").toBeVisible({ timeout: 30_000 });
    await Promise.all([page.waitForLoadState("load"), top.タイル(タグ名).first().getByRole("link", { name: /もっと見る/ }).click({ timeout: 20_000 })]);
    await page.waitForLoadState("load");
    await expect(page.getByText(rc("F0102-055商品A")).first(), "商品一覧の「F0102-055商品A」").toBeVisible({ timeout: 30_000 }).catch(() => note("商品一覧に「F0102-055商品A」が見つからなかった"));
    A = await page.getByText(rc("F0102-055商品A")).count();
    B = await page.getByText(rc("F0102-055商品B")).count();
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（商品一覧画面）").toMatch(/\/products\/(list|search)/);
    expect.soft(A > 0, "専用タグのある「F0102-055商品A」の表示").toBe(true);
    expect.soft(B, "専用タグのない「F0102-055商品B」の表示数").toBe(0);
  });
});

caseTest("IT-F01-02-054", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const タグ名 = タイルのタグ名("テストタイルA-054");
  const card = () => top.タイルの商品(タグ名, rc("週間販売なしタイル商品-054")).first();
  await step(1, async () => { await top.open(支店URL("054")); await top.開いている(); });
  await step(2, async () => { await expect(card(), "「週間販売なしタイル商品-054」のカード").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await card().locator(".p-hareruya-product-card__sales").count(), "週間販売数の表示の数").toBe(0);
  });
});
