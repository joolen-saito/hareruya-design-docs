/** M03-01 の2行グッズ商品CSVシード。正本: M03-01_seed_data.tsv の TEXT-010/TEXT-012。 */
import { expect } from "@playwright/test";
import { defineSeed, reportSeedIssue, type SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingGoodsChildCategoryId, readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { ProductSearchPage } from "../pages/admin/product_search";
import { M0301_ADMIN } from "./m03-01";

type ProductRow = { code: string; name: string; note: string };

async function createTwoGoodsProducts(ctx: SeedCtx, products: readonly [ProductRow, ProductRow], filename: string): Promise<void> {
  const { browser, notes, seed } = ctx;
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    const template = await downloadGoodsCsvTemplate(page);
    const languageId = await readJapaneseLanguageId(page);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const sellGroupName = await readExistingSellGroupName(page);
    const common = {
      "商品ID": "", "言語(ID)": languageId,
      "商品公開ステータス": publishedValue(template, "商品公開ステータス"),
      "支店の商品公開ステータス": publishedValue(template, "支店の商品公開ステータス"),
      "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId,
      "購入グループ名称": sellGroupName, "基準価格": "100", "販売価格": "100",
      "買取価格": "10", "原価単価": "10", "部門ID": "",
    };
    const csv = buildGoodsCsv(template, products.map(({ code, name }) => ({
      ...common, "商品コード": code, "商品名(日)": name, "商品名(英)": name,
    })));
    await uploadGoodsCsv(page, csv, filename);
    for (const warning of await expectSaved(page, `${seed.シードID} の2行グッズ商品CSV登録`))
      reportSeedIssue(seed.シードID, warning);

    const search = new ProductSearchPage(page);
    for (const product of products) {
      await search.open();
      await search.ensureDetailVisible();
      await search.field("product_code").fill(product.code);
      await search.form.locator(".admin-product-search-submit").click();
      const rows = page.locator('tr[id^="ex-product-"]');
      await expect(rows, `${product.code} の検索結果は1件だけ`).toHaveCount(1);
      const row = rows.first();
      await expect(row.locator("td:nth-child(3) a"), `${product.code} の商品名`).toHaveText(product.name);
      await expect(row.locator("td:nth-child(4)"), `${product.code} の商品コード`).toHaveText(product.code);
      await expect(row.locator("td:nth-child(6)"), `${product.code} の規格状態`).toHaveText("NM");
      const id = (await row.locator("td:nth-child(2)").innerText()).trim();
      if (!/^\d+$/.test(id)) throw new Error(`${seed.シードID}: ${product.code} の採番商品IDを画面から読めない: ${id}`);
      await expect(row, `${product.code} の採番IDと結果行`).toHaveAttribute("id", `ex-product-${id}`);
      notes.set(product.note, id);
    }
  });
}

defineSeed("S-M03-01-TEXT-010", { needs: ["S-M03-01-ADM"] }, async (ctx) => {
  await createTwoGoodsProducts(ctx, [
    { code: "M0301S-010A", name: "青空テスト商品-010", note: "〔商品ID-M0301-010A〕" },
    { code: "M0301S-010B", name: "青空テストのみ-010", note: "〔商品ID-M0301-010B〕" },
  ], "m03-01-010-goods.csv");
});

defineSeed("S-M03-01-TEXT-012", { needs: ["S-M03-01-ADM"] }, async (ctx) => {
  await createTwoGoodsProducts(ctx, [
    { code: "M03ALPHABETA-012", name: "コード検索商品甲012", note: "〔商品ID-M0301-012A〕" },
    { code: "M03ALPHAONLY-012", name: "コード検索商品乙012", note: "〔商品ID-M0301-012B〕" },
  ], "m03-01-012-goods.csv");
});
