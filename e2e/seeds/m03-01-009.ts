/** S-M03-01-TEXT-009: 共有カテゴリ A/B の3商品を CSV 登録し、C だけ SP 規格にする。 */
import { expect } from "@playwright/test";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { replaceNmWithSpClass } from "../pages/admin/m03_01_product_class";
import { ProductSearchPage } from "../pages/admin/product_search";
import { M0301_ADMIN } from "./m03-01";

const NAME = "AND対象商品-009";
const products = [
  { code: "M0301S-009A", categoryNote: "〔カテゴリID-M0301-共有A〕", idNote: "〔商品ID-M0301-009A〕" },
  { code: "M0301S-009B", categoryNote: "〔カテゴリID-M0301-共有B〕", idNote: "〔商品ID-M0301-009B〕" },
  { code: "M0301S-009C", categoryNote: "〔カテゴリID-M0301-共有A〕", idNote: "〔商品ID-M0301-009C〕" },
] as const;

defineSeed("S-M03-01-TEXT-009", { needs: ["S-M03-01-ADM", "S-M03-01-MASTERS-READ"] }, async ({ browser, notes, seed }) => {
  const categoryA = notes.get("〔カテゴリID-M0301-共有A〕");
  const categoryB = notes.get("〔カテゴリID-M0301-共有B〕");
  if (!/^\d+$/.test(categoryA) || !/^\d+$/.test(categoryB) || categoryA === categoryB)
    throw new Error(`${seed.シードID}: 共有カテゴリ A/B の異なる採番 ID を画面から控えられていない`);

  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    const template = await downloadGoodsCsvTemplate(page);
    const japaneseLanguageId = await readJapaneseLanguageId(page);
    const sellGroupName = await readExistingSellGroupName(page);
    const common = {
      "商品ID": "", "言語(ID)": japaneseLanguageId,
      "商品公開ステータス": publishedValue(template, "商品公開ステータス"),
      "支店の商品公開ステータス": publishedValue(template, "支店の商品公開ステータス"),
      "サイズ": "1", "重量": "1", "購入グループ名称": sellGroupName,
      "基準価格": "100", "販売価格": "100", "買取価格": "10", "原価単価": "10", "部門ID": "",
    };
    const csv = buildGoodsCsv(template, products.map((product) => ({
      ...common,
      "商品コード": product.code, "商品名(日)": NAME, "商品名(英)": NAME,
      "商品カテゴリ(ID)": notes.get(product.categoryNote),
    })));
    await uploadGoodsCsv(page, csv, "m03-01-009-goods.csv");
    for (const warning of await expectSaved(page, `${seed.シードID} の3行グッズ商品CSV登録`))
      reportSeedIssue(seed.シードID, warning);

    const search = new ProductSearchPage(page);
    for (const product of products) {
      await search.open();
      await search.ensureDetailVisible();
      await search.field("product_code").fill(product.code);
      await search.form.locator(".admin-product-search-submit").click();
      const rows = page.locator('tr[id^="ex-product-"]');
      await expect(rows, `${product.code} の商品検索結果は1件`).toHaveCount(1);
      const row = rows.first();
      await expect(row.locator("td:nth-child(3) a"), "CSVで指定した商品名").toHaveText(NAME);
      await expect(row.locator("td:nth-child(4)"), "CSVで指定した商品コード").toHaveText(product.code);
      await expect(row.locator("td:nth-child(6)"), "CSVで作った元の規格は NM").toHaveText("NM");
      const id = (await row.locator("td:nth-child(2)").innerText()).trim();
      if (!/^\d+$/.test(id)) throw new Error(`${seed.シードID}: ${product.code} の採番商品IDを画面から読めない: ${id}`);
      await expect(row, "検索行と採番商品IDの対応").toHaveAttribute("id", `ex-product-${id}`);
      notes.set(product.idNote, id);
      if (product.code === "M0301S-009C") {
        await row.locator("td:nth-child(3) a").click();
        await replaceNmWithSpClass(page, {
          productId: id,
          nmCode: product.code,
          spCode: "M0301S-009C-SP",
          japaneseLanguageId,
          sectionId: notes.get("〔部門ID-M0301-共有〕"),
        }, (warning) => reportSeedIssue(seed.シードID, warning));
      }
    }
  });
});
