/** S-M03-01-TEXT-013: 正本の1行を管理画面雛形から実行時に作る。 */
import { expect } from "@playwright/test";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingGoodsChildCategoryId, readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { ProductSearchPage } from "../pages/admin/product_search";
import { M0301_ADMIN } from "./m03-01";

defineSeed("S-M03-01-TEXT-013", { needs: ["S-M03-01-ADM"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    const template = await downloadGoodsCsvTemplate(page);
    const languageId = await readJapaneseLanguageId(page);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const sellGroupName = await readExistingSellGroupName(page);
    const csv = buildGoodsCsv(template, {
      "商品ID": "", "商品コード": "M0301S-013", "言語(ID)": languageId,
      "商品公開ステータス": publishedValue(template, "商品公開ステータス"),
      "支店の商品公開ステータス": publishedValue(template, "支店の商品公開ステータス"),
      "商品名(日)": "ID完全一致商品-013", "商品名(英)": "ID完全一致商品-013",
      "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId,
      "購入グループ名称": sellGroupName, "基準価格": "100", "販売価格": "100",
      "買取価格": "10", "原価単価": "10", "部門ID": "",
    });
    await uploadGoodsCsv(page, csv, "m03-01-013-goods.csv");
    for (const warning of await expectSaved(page, "S-M03-01-TEXT-013 のグッズ商品CSV登録"))
      reportSeedIssue(seed.シードID, warning);

    // 正本の指定どおり、登録後に商品コードで探して画面に表示された商品IDを控える。
    const search = new ProductSearchPage(page);
    await search.open();
    await search.ensureDetailVisible();
    await search.field("product_code").fill("M0301S-013");
    await search.form.locator(".admin-product-search-submit").click();
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect(rows, "商品コード M0301S-013 の商品が1件だけ表示される").toHaveCount(1);
    const row = rows.first();
    await expect(row.locator("td:nth-child(4)"), "登録した商品コード").toHaveText("M0301S-013");
    await expect(row.locator("td:nth-child(3) a"), "登録した商品名").toHaveText("ID完全一致商品-013");
    await expect(row.locator("td:nth-child(6)"), "グッズ商品の規格状態").toHaveText("NM");
    const id = (await row.locator("td:nth-child(2)").innerText()).trim();
    if (!/^\d+$/.test(id)) throw new Error(`S-M03-01-TEXT-013: 画面の採番商品IDを読めない: ${id}`);
    await expect(row, "結果行の商品IDと採番IDが一致する").toHaveAttribute("id", `ex-product-${id}`);
    notes.set("〔商品ID-M0301-013〕", id);
  });
});
