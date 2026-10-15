/** S-M03-01-DEPRECATED-007: 3商品をCSV登録し、廃止・高額の商品を画面で作る。 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingGoodsChildCategoryId, readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import {
  abolishedGoodsStatusValue, readGoodsProductIdByCode, setGoodsHighPriceCode,
} from "../pages/admin/m03_01_deprecated_007";
import { M0301_ADMIN } from "./m03-01";

defineSeed("S-M03-01-DEPRECATED-007", { needs: ["S-M03-01-ADM"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    const template = await downloadGoodsCsvTemplate(page);
    const languageId = await readJapaneseLanguageId(page);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const sellGroupName = await readExistingSellGroupName(page);
    const common = {
      "言語(ID)": languageId,
      "商品公開ステータス": publishedValue(template, "商品公開ステータス"),
      "支店の商品公開ステータス": publishedValue(template, "支店の商品公開ステータス"),
      "商品名(日)": "公開状態商品-007", "商品名(英)": "公開状態商品-007",
      "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId,
      "購入グループ名称": sellGroupName, "基準価格": "100", "販売価格": "100",
      "買取価格": "10", "原価単価": "10", "部門ID": "",
    };
    const codes = ["M0301S-007A", "M0301S-007B", "M0301S-007C"] as const;
    const newRows = codes.map((code) => ({ ...common, "商品ID": "", "商品コード": code }));
    await uploadGoodsCsv(page, buildGoodsCsv(template, newRows), "m03-01-007-goods.csv");
    for (const warning of await expectSaved(page, "S-M03-01-DEPRECATED-007 の3商品CSV登録"))
      reportSeedIssue(seed.シードID, warning);

    const ids: string[] = [];
    for (const [index, code] of codes.entries()) {
      const id = await readGoodsProductIdByCode(page, code, "公開状態商品-007");
      ids.push(id);
      notes.set(`〔商品ID-M0301-007${["A", "B", "C"][index]}〕`, id);
    }
    if (new Set(ids).size !== 3) throw new Error("3行のCSVがそれぞれ別の商品IDになっていない");

    await setGoodsHighPriceCode(page, ids[2], codes[2], "M0301HP-007C");
    for (const warning of await expectSaved(page, "S-M03-01-DEPRECATED-007 の高額商品設定"))
      reportSeedIssue(seed.シードID, warning);

    const abolished = {
      ...common,
      "商品ID": ids[1], "商品コード": codes[1],
      "商品公開ステータス": abolishedGoodsStatusValue(template),
    };
    await uploadGoodsCsv(page, buildGoodsCsv(template, abolished, "update"), "m03-01-007-abolished.csv");
    for (const warning of await expectSaved(page, "S-M03-01-DEPRECATED-007 の廃止商品CSV更新"))
      reportSeedIssue(seed.シードID, warning);
  });
});
