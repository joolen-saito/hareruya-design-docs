/** S-M03-01-DISPLAY-034: 同名商品の画面清掃後、履歴メニュー確認用の商品を CSV 登録する。 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingGoodsChildCategoryId, readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { readGoodsProductId, removeProductsMatchingName } from "../pages/admin/m03_01_goods_list_seed";
import { M0301_ADMIN } from "./m03-01";

defineSeed("S-M03-01-DISPLAY-034", { needs: ["S-M03-01-ADM"] }, async ({ browser, notes, seed }) => {
  const code = "LST3402-034";
  const name = "一覧表示商品-034";
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
    await uploadGoodsCsv(page, csv, "m03-01-034-goods.csv");
    for (const warning of await expectSaved(page, `${seed.シードID} の1行グッズ商品CSV登録`))
      reportSeedIssue(seed.シードID, warning);
    notes.set("〔商品ID-M0301-034〕", await readGoodsProductId(page, code, name));
  });
});
