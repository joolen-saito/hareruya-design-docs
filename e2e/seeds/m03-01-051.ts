/** S-M03-01-TEXT-051: 正本指定の英語名が異なる商品2件を、画面の雛形から CSV 登録する。 */
import { expect } from "@playwright/test";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingGoodsChildCategoryId, readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { expectGoodsEnglishName051 } from "../pages/admin/m03_01_goods_english_name_051";
import { readGoodsProductId, removeProductsMatchingName } from "../pages/admin/m03_01_goods_list_seed";
import { ProductSearchPage } from "../pages/admin/product_search";
import { M0301_ADMIN } from "./m03-01";

defineSeed("S-M03-01-TEXT-051", { needs: ["S-M03-01-ADM"] }, async ({ browser, notes, seed }) => {
  const products = [
    { code: "M0301S-051A", nameJa: "英名照合甲-051", nameEn: "M0301-051-AzureWing", label: "〔商品ID-M0301-051A〕" },
    { code: "M0301S-051B", nameJa: "英名照合乙-051", nameEn: "M0301-051-CrimsonOwl", label: "〔商品ID-M0301-051B〕" },
  ] as const;
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    // B は正本の AzureWing 検索・削除の対象外。前回分が残るまま A だけを消すと、
    // 新規 CSV の B 行が固定コード重複で失敗するため、A の削除前に画面で止める。
    const preflight = new ProductSearchPage(page);
    await preflight.open();
    await preflight.ensureDetailVisible();
    for (const field of ["status", "card_condition", "expensive"]) {
      for (const option of await preflight.choiceOptions(field)) {
        if (option.checked) await preflight.setChecked(field, option.value, false);
      }
    }
    await preflight.field("product_code").fill("M0301S-051B");
    await preflight.form.locator(".admin-product-search-submit").click();
    const existing = page.locator('tr[id^="ex-product-"]');
    if (await existing.count() > 0) {
      const codes = (await existing.locator("td:nth-child(4)").allInnerTexts()).map((code) => code.trim());
      throw new Error(`S-M03-01-TEXT-051: B の固定商品コード M0301S-051B の検索結果が既にある（${codes.join("、")}）。A を削除せず停止する`);
    }
    await expect(page.getByText("検索条件に合致するデータが見つかりませんでした", { exact: true }),
      "B の固定商品コードは検索画面に既存行が無い").toBeVisible();

    // 正本の事前検索語は英語名。検索結果の日本語名だけで削除対象を判定しない。
    await removeProductsMatchingName(page, "M0301-051-AzureWing", true);
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
    const csv = buildGoodsCsv(template, products.map(({ code, nameJa, nameEn }) => ({
      ...common, "商品コード": code, "商品名(日)": nameJa, "商品名(英)": nameEn,
    })));
    await uploadGoodsCsv(page, csv, "m03-01-051-goods.csv");
    for (const warning of await expectSaved(page, `${seed.シードID} の2行グッズ商品CSV登録`))
      reportSeedIssue(seed.シードID, warning);
    for (const product of products) {
      const id = await readGoodsProductId(page, product.code, product.nameJa);
      await expectGoodsEnglishName051(page, id, product.nameEn);
      notes.set(product.label, id);
    }
  });
});
