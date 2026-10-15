/** S-M03-01-DISPLAY-030/031/033: 正本指定の同名商品清掃後、各1行のグッズ商品 CSV を登録する。 */
import { expect, type Page } from "@playwright/test";
import { defineSeed, reportSeedIssue, type SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue,
  readExistingGoodsChildCategoryId, readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { readGoodsProductId, removeProductsMatchingName } from "../pages/admin/m03_01_goods_list_seed";
import { ProductSearchPage } from "../pages/admin/product_search";
import { M0301_ADMIN } from "./m03-01";

/** 031 の新規商品コードが別の商品に使われていないことを画面から確認する。 */
async function assertCodeUnused(page: Page, code: string): Promise<void> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
  }
  await search.field("product_code").fill(code);
  await search.form.locator(".admin-product-search-submit").click();
  const count = page.locator(".c-outsideBlock__contents.mb-5.text-center .fw-bold");
  await expect(count, `${code} の商品コード検索結果は0件`).toHaveText("検索結果：0件が該当しました");
  await expect(page.locator('tr[id^="ex-product-"]'), `${code} を使う別の商品が画面にない`).toHaveCount(0);
}

async function createDisplayGoods(ctx: SeedCtx, no: "030" | "031" | "033"): Promise<void> {
  const { browser, notes, seed } = ctx;
  const code = `LST3402-${no}`;
  const name = `一覧表示商品-${no}`;
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    await removeProductsMatchingName(page, name);
    if (no === "031") await assertCodeUnused(page, code);
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
    await uploadGoodsCsv(page, csv, `m03-01-${no}-goods.csv`);
    for (const warning of await expectSaved(page, `${seed.シードID} の1行グッズ商品CSV登録`))
      reportSeedIssue(seed.シードID, warning);
    notes.set(`〔商品ID-M0301-${no}〕`, await readGoodsProductId(page, code, name));
  });
}

defineSeed("S-M03-01-DISPLAY-030", { needs: ["S-M03-01-ADM"] }, (ctx) => createDisplayGoods(ctx, "030"));
defineSeed("S-M03-01-DISPLAY-031", { needs: ["S-M03-01-ADM"] }, (ctx) => createDisplayGoods(ctx, "031"));
defineSeed("S-M03-01-DISPLAY-033", { needs: ["S-M03-01-ADM"] }, (ctx) => createDisplayGoods(ctx, "033"));
