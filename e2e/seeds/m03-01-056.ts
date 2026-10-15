/** IT-M03-01-056: 9種類の表示件数と、検索結果を表示する1商品を画面から用意する。 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingGoodsChildCategoryId, readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { readGoodsProductId, removeProductsMatchingName } from "../pages/admin/m03_01_goods_list_seed";
import { PageCountConfigPage } from "../pages/admin/m03_01_page_count";
import { M0301_ADMIN } from "./m03-01";

defineSeed("S-M03-01-PAGECOUNT-056", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const config = new PageCountConfigPage(page);
    await config.ensureExactOptions(
      ["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000"],
      (message) => reportSeedIssue(seed.シードID, message),
    );
    await config.expectDefaultTen();
  });
});

defineSeed("S-M03-01-DISPLAY-056", { needs: ["S-M03-01-ADM"] }, async ({ browser, notes, seed }) => {
  const code = "M0301S-056";
  const name = "件数選択肢商品-056";
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    await removeProductsMatchingName(page, name);
    const template = await downloadGoodsCsvTemplate(page);
    const languageId = await readJapaneseLanguageId(page);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const sellGroupName = await readExistingSellGroupName(page);
    const csv = buildGoodsCsv(template, {
      "商品ID": "", "言語(ID)": languageId,
      "商品公開ステータス": publishedValue(template, "商品公開ステータス"),
      "支店の商品公開ステータス": publishedValue(template, "支店の商品公開ステータス"),
      "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId,
      "購入グループ名称": sellGroupName, "基準価格": "100", "販売価格": "100",
      "買取価格": "10", "原価単価": "10", "部門ID": "",
      "商品コード": code, "商品名(日)": name, "商品名(英)": name,
    });
    await uploadGoodsCsv(page, csv, "m03-01-056-goods.csv");
    for (const warning of await expectSaved(page, `${seed.シードID} の1行グッズ商品CSV登録`))
      reportSeedIssue(seed.シードID, warning);
    notes.set("〔商品ID-M0301-056〕", await readGoodsProductId(page, code, name));
  });
});
