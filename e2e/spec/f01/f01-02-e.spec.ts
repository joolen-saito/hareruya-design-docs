/** F01-02 支店ECTOP（タイルの商品規格の選ばれ方・SALE中の商品の絞り込み・カート）。正本: cases/F01-02_test_cases.tsv */
import { test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { rc } from "../../lib/run_marker";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { 支店URL } from "../../seeds/f01-02";
import { タイルのタグ名 } from "../../seeds/f01-02-tile";
import { Locator } from "@playwright/test";

const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
const yen = async (cards: Locator): Promise<string[]> => (await cards.locator(".p-hareruya-product-card__price").allInnerTexts()).map((t) => t.replace(/[¥,\s]/g, "")).sort();

/** タイルの中の1商品について、表示された商品規格（カード）の販売価格を確かめる */
function タイルの価格(n: string, タグ: string, 商品名: string, 表示する価格: string[], 出ない価格: string[]): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new BranchTopPage(page);
    const タグ名 = タイルのタグ名(タグ);
    let 価格: string[] = [];
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); });
    await step(2, async () => {
      await expect(top.タイル(タグ名).first(), `タイル「${タグ}」`).toBeVisible({ timeout: 30_000 }).catch(() => note(`タイル「${タグ}」が支店ECTOPに見つからなかった`));
      価格 = await yen(top.タイルの商品(タグ名, rc(商品名)));
    });
    await expected(async () => {
      expect.soft(価格, `「${商品名}」に表示された商品規格の販売価格`).toEqual([...表示する価格].sort());
      for (const p of 出ない価格) expect.soft(価格.includes(p), `販売価格${p}円の商品規格は表示されない`).toBe(false);
    });
  };
}
caseTest("IT-F01-02-042", タイルの価格("042", "テストタイルA", "タイル優先順位商品-042", ["300"], ["700", "200", "500"]));
caseTest("IT-F01-02-097", タイルの価格("CB097", "タイルF0102-CB097", "タイル商品F0102-CB097", ["800"], []));
caseTest("IT-F01-02-100", タイルの価格("CB100", "タイルF0102-CB100", "タイル商品F0102-CB100", ["300"], ["500", "700"]));
caseTest("IT-F01-02-101", タイルの価格("CB101", "タイルF0102-CB101", "タイル商品F0102-CB101", ["300"], ["500", "200"]));
caseTest("IT-F01-02-102", タイルの価格("CB102", "タイルF0102-CB102", "タイル在庫価格不足商品F0102-CB102", ["300"], ["500", "99"]));
caseTest("IT-F01-02-104", タイルの価格("CB104", "タイルF0102-CB104", "タイル商品F0102-CB104", ["500"], ["700"]));
caseTest("IT-F01-02-105", タイルの価格("CB105", "タイルF0102-CB105", "タイル商品F0102-CB105", ["250"], ["450"]));
caseTest("IT-F01-02-106", タイルの価格("CB106", "タイルF0102-CB106", "タイル商品F0102-CB106", ["300"], ["500", "200"]));
caseTest("IT-F01-02-107", タイルの価格("CB107", "タイルF0102-CB107", "タイル商品F0102-CB107", ["200"], ["500", "99", "700"]));

/** SALE中の商品に、見えるはずの商品が出て、見えないはずの商品が出ない（価格つき） */
function SALE(n: string, 出る: string[], 出ない: string[]): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new BranchTopPage(page);
    const 表示: Record<string, number> = {};
    let 区画 = -1;
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); });
    await step(2, async () => {
      区画 = await top.SALE中.count();
      for (const name of [...出る, ...出ない]) 表示[name] = await top.SALE中.getByText(rc(name), { exact: false }).count();
    });
    await expected(async () => {
      if (出る.length) expect.soft(区画, "SALE中の商品の区画の数（1つ）").toBe(1);
      for (const name of 出る) expect.soft(表示[name] > 0, `「${name}」の表示`).toBe(true);
      for (const name of 出ない) expect.soft(表示[name], `「${name}」の表示数`).toBe(0);
    });
  };
}
caseTest("IT-F01-02-083", SALE("083", [], ["最小状態非セール商品F0102-083"]));
caseTest("IT-F01-02-084", SALE("084", [], ["最小状態在庫なし商品F0102-084"]));
caseTest("IT-F01-02-095", SALE("CB095", ["セール全条件F0102-CB095"], []));
caseTest("IT-F01-02-096", SALE("CB096", ["セール公開F0102-CB096"], ["セール本店非公開F0102-CB096"]));

caseTest("IT-F01-02-086", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const cards = () => top.SALE中.locator(".p-hareruya-product-card").filter({ hasText: rc("最小状態言語違い商品F0102-086") });
  let 価格: string[] = [];
  await step(1, async () => { await top.open(支店URL("086")); await top.開いている(); });
  await step(2, async () => {
    await expect(cards().first(), "「最小状態言語違い商品F0102-086」のカード").toBeVisible({ timeout: 30_000 }).catch(() => note("SALE中の商品に「最小状態言語違い商品F0102-086」が見つからなかった"));
    価格 = await yen(cards());
  });
  await expected(async () => {
    expect.soft(価格, "「最小状態言語違い商品F0102-086」に表示された商品規格の販売価格").toEqual(["500", "700"]);
    expect.soft(価格.includes("300"), "販売価格300円の規格Cは表示されない").toBe(false);
  });
});

caseTest("IT-F01-02-030", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const 数: Record<string, number> = {};
  await step(1, async () => { await top.open(支店URL("030")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.SALE中, "SALE中の商品の区画").toHaveCount(1);
    await Promise.all([page.waitForLoadState("load"), top.SALE中.getByRole("link", { name: /もっと見る/ }).locator("visible=true").first().click({ timeout: 20_000 })]);
    await page.waitForLoadState("load");
    await expect(page.getByText(rc("F0102-030商品A")).first(), "商品一覧の「F0102-030商品A」").toBeVisible({ timeout: 30_000 }).catch(() => note("商品一覧に「F0102-030商品A」が見つからなかった"));
    for (const x of ["A", "B", "C"]) 数[x] = await page.getByText(rc(`F0102-030商品${x}`)).count();
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（商品一覧画面）").toMatch(/\/products\/(list|search)/);
    expect.soft(数["A"] > 0, "セールタグあり・セールフラグ1の「F0102-030商品A」の表示").toBe(true);
    expect.soft(数["B"], "セールタグなしの「F0102-030商品B」の表示数").toBe(0);
    expect.soft(数["C"], "セールフラグ0の「F0102-030商品C」の表示数").toBe(0);
  });
});

/** SALE中の商品のカードで数量を増減し、カートに入れてカートを開く */
function カート(n: string, 商品名: string, 目標: number): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new BranchTopPage(page);
    const card = () => top.SALE中.locator(".p-hareruya-product-card").filter({ hasText: rc(商品名) }).first();
    const qty = () => card().locator("input.p-hareruya-product-card__quantity-input").first();
    const plus = () => card().locator("button.c-hareruya-btn-quantity").nth(1);
    const minus = () => card().locator("button.c-hareruya-btn-quantity").first();
    let 数量 = "";
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); await expect(card()).toBeVisible({ timeout: 30_000 }); });
    await step(2, async () => {
      for (let i = 0; i < 8 && Number(await qty().inputValue({ timeout: 15_000 })) !== 目標; i++) {
        if (Number(await qty().inputValue({ timeout: 15_000 })) > 目標) await minus().click({ timeout: 10_000 }); else await plus().click({ timeout: 10_000 });
      }
    });
    await step(3, async () => { await card().locator("button.add-cart").click({ timeout: 20_000 }); await page.waitForTimeout(1500); });
    await step(4, async () => {
      const link = page.locator(".p-hareruya-cart-popup__link").first();
      const 押せた = await link.isVisible().catch(() => false)
        ? await Promise.all([page.waitForURL(/\/cart/, { timeout: 30_000 }).catch(() => undefined), link.click({ timeout: 10_000 })]).then(() => true, () => false)
        : false;
      if (!押せた) { note("カートに入れた後の案内の画面が見えない、または押せなかったので、カートを直接開いた"); await page.goto(`${BASE_URL}/cart`); }
      await page.waitForLoadState("load");
      const item = page.locator(".p-hareruya-cart-item").filter({ hasText: rc(商品名) }).first();
      await expect(item, `カートの「${商品名}」`).toBeVisible({ timeout: 30_000 }).catch(() => note(`カートに「${商品名}」が見つからなかった`));
      数量 = (await item.locator("[data-quantity-input]").inputValue({ timeout: 15_000 }).catch(() => "")) ?? "";
    });
    await expected(async () => { expect.soft(数量, `カートの「${商品名}」の数量`).toBe(String(目標)); });
  };
}
caseTest("IT-F01-02-089", カート("089", "セール基準商品-089", 1));
caseTest("IT-F01-02-090", カート("090", "セール基準商品-090", 5));
