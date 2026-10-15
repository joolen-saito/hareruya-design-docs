/** S-M03-01-DEPRECATED-019: 通常商品と高額商品を CSV・商品規格画面から用意する。 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { readGoodsProductIdByCode } from "../pages/admin/m03_01_deprecated_007";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingGoodsChildCategoryId, readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { set019HighPriceCode } from "../pages/admin/m03_01_high_price_019";
import { M0301_ADMIN } from "./m03-01";

defineSeed("S-M03-01-DEPRECATED-019", { needs: ["S-M03-01-ADM"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    const template = await downloadGoodsCsvTemplate(page);
    const languageId = await readJapaneseLanguageId(page);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const sellGroupName = await readExistingSellGroupName(page);
    const common = {
      "商品ID": "", "言語(ID)": languageId,
      "商品公開ステータス": publishedValue(template, "商品公開ステータス"),
      "支店の商品公開ステータス": publishedValue(template, "支店の商品公開ステータス"),
      "商品名(日)": "高額条件商品-019", "商品名(英)": "高額条件商品-019",
      "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId,
      "購入グループ名称": sellGroupName, "基準価格": "100", "販売価格": "100",
      "買取価格": "10", "原価単価": "10", "部門ID": "",
    };
    const codes = ["M0301S-019A", "M0301S-019B"] as const;
    const rows = codes.map((code) => ({ ...common, "商品コード": code }));
    await uploadGoodsCsv(page, buildGoodsCsv(template, rows), "m03-01-019-goods.csv");
    for (const warning of await expectSaved(page, "S-M03-01-DEPRECATED-019 の2商品CSV登録"))
      reportSeedIssue(seed.シードID, warning);

    const ids: string[] = [];
    for (const [index, code] of codes.entries()) {
      // 初期条件の検索結果に現れることで、公開・NM・通常商品を確認してからIDを控える。
      const id = await readGoodsProductIdByCode(page, code, "高額条件商品-019");
      ids.push(id);
      notes.set(`〔商品ID-M0301-019${["A", "B"][index]}〕`, id);
    }
    if (new Set(ids).size !== 2) throw new Error("019 の2行の CSV が別々の商品IDになっていない");

    // 最後の B の検索結果行から、正本指定の画面遷移で NM 規格だけを編集する。
    for (const warning of await set019HighPriceCode(page, ids[1], codes[1], "M0301HP-019B"))
      reportSeedIssue(seed.シードID, warning);
  });
});
