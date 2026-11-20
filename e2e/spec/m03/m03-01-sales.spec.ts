/**
 * M03-01 商品マスターの検索: 販売数の範囲（020・021・054）と規格更新日（022・055）。正本: cases/M03-01_test_cases.tsv
 * 商品名・商品コードには実行の印を付けた（seeds/m03-01-sales.ts）。規格更新日の欄は日付の入力欄（html5 の date）なので、カレンダーの操作の代わりに日付を入れた。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-sales";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 印の補い = "商品名・商品コードには実行ごとの印を付けた（検索の商品名も印つきの値）。期間別販売数・規格更新日時は画面で指定できないので E2E が作った規格へ DB で書き足した";

async function 期間別の販売数を指定する(search: ProductSearchPage, 期間: string | null, from: string, to: string): Promise<void> {
  await search.ensureDetailVisible();
  if (期間) {
    const sel = search.field("order_date");
    const label = (await sel.locator("option").allInnerTexts()).map((t) => t.trim()).find((t) => t.includes(期間));
    if (!label) throw new Error(`販売期間に「${期間}」が無い`);
    await sel.selectOption({ label });
  }
  await search.field("order_quantity_from").fill(from);
  await search.field("order_quantity_to").fill(to);
}
const 表示された商品ID = (page: import("@playwright/test").Page) => page.locator('tr[id^="ex-product-"]').evaluateAll((trs) => trs.map((t) => t.id.replace("ex-product-", "")));

caseTest("IT-M03-01-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  let ids: string[] = [];
  await step(1, async () => { await search.open(); });
  await step(2, async () => { await search.field("product_name").fill(rc("販売期間商品")); });
  await step(3, async () => { await 期間別の販売数を指定する(search, "1週間", "4", "6"); });
  await step(4, async () => { await search.form.locator(".admin-product-search-submit").click(); await page.waitForLoadState("load"); ids = await 表示された商品ID(page); note(`表示された商品ID: ${ids.join("、")}`); });
  supplement(印の補い);
  await expected(async () => {
    expect.soft(ids, "1週間の販売数が4以上6以下のID 〔共有B〕だけが表示される").toEqual([notes.get("〔商品ID-M0301-共有B〕")]);
  });
});

caseTest("IT-M03-01-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  let ids: string[] = [];
  await step(1, async () => { await search.open(); });
  await step(2, async () => { await search.field("product_name").fill(rc("販売期間商品")); });
  await step(3, async () => { await 期間別の販売数を指定する(search, null, "4", "6"); });
  await step(4, async () => { await search.form.locator(".admin-product-search-submit").click(); await page.waitForLoadState("load"); ids = await 表示された商品ID(page); note(`表示された商品ID: ${ids.join("、")}`); });
  supplement(印の補い);
  await expected(async () => {
    const want = ["〔商品ID-M0301-共有A〕", "〔商品ID-M0301-共有B〕", "〔商品ID-M0301-共有C〕"].map((l) => notes.get(l)).sort();
    expect.soft([...ids].sort(), "販売数の下限と上限では絞り込まれず、〔共有A〕〔共有B〕〔共有C〕が表示される").toEqual(want);
  });
});

caseTest("IT-M03-01-054", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  let ids: string[] = [];
  await step(1, async () => { await search.open(); });
  await step(2, async () => { await search.field("product_name").fill(rc("販売数対象商品-054")); });
  await step(3, async () => { await 期間別の販売数を指定する(search, "1週間", "4", "6"); });
  await step(4, async () => { await search.form.locator(".admin-product-search-submit").click(); await page.waitForLoadState("load"); ids = await 表示された商品ID(page); note(`表示された商品ID: ${ids.join("、")}`); });
  supplement(印の補い);
  await expected(async () => {
    expect.soft(ids, "販売数(通販+TC東京)が4以上6以下の〔054A〕だけが表示され、販売数(支店)だけが範囲内の〔054B〕は表示されない").toEqual([notes.get("〔商品ID-M0301-054A〕")]);
  });
});

caseTest("IT-M03-01-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  let ids: string[] = [];
  await step(1, async () => { await search.open(); });
  await step(2, async () => { await search.field("product_name").fill(rc("更新日境界商品-022")); });
  await step(3, async () => { await search.ensureDetailVisible(); await search.field("update_date_from").fill("2026-09-03"); await search.field("update_date_to").fill("2026-09-03"); });
  await step(4, async () => { await search.form.locator(".admin-product-search-submit").click(); await page.waitForLoadState("load"); ids = await 表示された商品ID(page); note(`表示された商品ID: ${ids.join("、")}`); });
  supplement(印の補い);
  await expected(async () => {
    const a = notes.get("〔商品ID-M0301-022A〕"), b = notes.get("〔商品ID-M0301-022B〕"), c = notes.get("〔商品ID-M0301-022C〕");
    expect.soft([...ids].sort(), "2026/09/03 00:00:00 更新の〔022A〕と 23:59:59 更新の〔022B〕が表示される").toEqual([a, b].sort());
    expect.soft(ids, "2026/09/04 00:00:00 更新の〔022C〕は表示されない").not.toContain(c);
  });
});

caseTest("IT-M03-01-055", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => { await search.open(); await search.ensureDetailVisible(); });
  await step(2, async () => { supplement("規格更新日(From)は日付の入力欄（html5 の date）で、カレンダーの操作はできないため、2026年9月3日を入力して選んだ"); await search.field("update_date_from").fill("2026-09-03"); });
  await step(3, async () => { await search.field("update_date_to").fill("2026-09-03"); });
  await expected(async () => {
    expect.soft(await search.field("update_date_from").inputValue(), "規格更新日(From)に 2026/09/03 が入る").toBe("2026-09-03");
    expect.soft(await search.field("update_date_to").inputValue(), "規格更新日(To)に 2026/09/03 が入る").toBe("2026-09-03");
  });
});
