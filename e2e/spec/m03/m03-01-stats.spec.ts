/**
 * M03-01 商品マスターの検索: 表示データ切り替え（販売数（支店））（028）。正本: cases/M03-01_test_cases.tsv
 * 商品名・商品コードには実行の印を付けた（seeds/m03-01-stats.ts）。検索の商品名も同じ印つきの値。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-stats";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-M03-01-028", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const id = notes.get("〔商品ID-M0301-028〕");
  let 期間の値: string[] = [];
  await step(1, async () => { await search.open(); });
  await step(2, async () => { await search.field("product_name").fill(rc("統計商品-028")); });
  await step(3, async () => {
    await search.submitAndWaitForResult();
    await expect(page.locator(`tr#ex-product-${id}`), `商品ID ${id} の行`).toHaveCount(1);
  });
  await step(4, async () => {
    const pulldown = page.locator("#display_pulldown");
    await expect(pulldown, "表示データ切り替え").toBeVisible();
    const before = page.url();
    await pulldown.selectOption({ label: "販売数（支店）" });
    await page.waitForURL((u) => u.toString() !== before);
    await page.waitForLoadState("load");
    await expect(page.locator("#display_pulldown option:checked"), "選ばれた表示データ").toHaveText(/販売数（支店）/);
    // 商品の行（1規格）の終わりのセルは操作の欄（rowspan）。その前の6つが当日・前日・3日間・1週間・1ヶ月・90日間の販売数
    const cells = (await page.locator(`tr#ex-product-${id} > td`).allInnerTexts()).map((t) => t.trim());
    期間の値 = cells.slice(-7, -1).map((t) => t.replace(/,/g, ""));
    note(`表示データ「販売数（支店）」の当日・前日・3日間・1週間・1ヶ月・90日間: ${期間の値.join("・")}（行のセル: ${cells.join("｜")}）`);
  });
  supplement("商品名・商品コードには実行ごとの印を付けた（検索の商品名も印つきの値）。期間別販売数は画面で指定できないので、E2E が作った規格へ DB で書き足した（販売数(支店)は試験支店の行）。入庫数は書き足していない（期待結果は販売数（支店）の表示だけを見る）");
  await expected(async () => {
    expect.soft(期間の値, "当日・前日・3日間・1週間・1ヶ月・90日間に 11・12・13・14・15・16 が表示される").toEqual(["11", "12", "13", "14", "15", "16"]);
    expect.soft(期間の値, "通販＋TC東京との合算値（12・14・16・18・20・22）は表示されない").not.toEqual(["12", "14", "16", "18", "20", "22"]);
  });
});
