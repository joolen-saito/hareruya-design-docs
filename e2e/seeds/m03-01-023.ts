/** S-M03-01-RANGE-023: 部門未設定と共有部門の商品を2行のグッズ商品 CSV で登録する。 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { M0301_ADMIN } from "./m03-01";

defineSeed("S-M03-01-RANGE-023", { needs: ["S-M03-01-ADM", "S-M03-01-MASTERS-READ"] }, async ({ browser, notes, seed }) => {
  const sectionId = notes.get("〔部門ID-M0301-共有〕");
  if (!/^\d+$/.test(sectionId)) throw new Error(`${seed.シードID}: 共有部門の採番 ID を画面から控えていない`);
  // グッズ配下の既存カテゴリは、共有マスタが画面で照合して控えた「M03カテゴリA」を使う（並び順の先頭は退避カテゴリになりうる）
  const categoryId = notes.get("〔カテゴリID-M0301-共有A〕");
  if (!/^\d+$/.test(categoryId)) throw new Error(`${seed.シードID}: 共有カテゴリ A の採番 ID を画面から控えていない`);
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    const template = await downloadGoodsCsvTemplate(page);
    const languageId = await readJapaneseLanguageId(page);
    const sellGroupName = await readExistingSellGroupName(page);
    const common = {
      "商品ID": "", "言語(ID)": languageId,
      "商品公開ステータス": publishedValue(template, "商品公開ステータス"),
      "支店の商品公開ステータス": publishedValue(template, "支店の商品公開ステータス"),
      "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId,
      "購入グループ名称": sellGroupName, "基準価格": "100", "販売価格": "100",
      "買取価格": "10", "原価単価": "10",
      "商品名(日)": "部門商品-023", "商品名(英)": "部門商品-023",
    };
    const csv = buildGoodsCsv(template, [
      { ...common, "商品コード": "M0301S-023A", "部門ID": "" },
      { ...common, "商品コード": "M0301S-023B", "部門ID": sectionId },
    ]);
    await uploadGoodsCsv(page, csv, "m03-01-023-goods.csv");
    for (const warning of await expectSaved(page, `${seed.シードID} の2行グッズ商品CSV登録`))
      reportSeedIssue(seed.シードID, warning);
    const idA = await readGoodsProductId(page, "M0301S-023A", "部門商品-023");
    const idB = await readGoodsProductId(page, "M0301S-023B", "部門商品-023");
    if (idA === idB) throw new Error(`${seed.シードID}: 商品 A/B の採番 ID が同一`);
    notes.set("〔商品ID-M0301-023A〕", idA);
    notes.set("〔商品ID-M0301-023B〕", idB);
  });
});
