import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理「買取・基準価格一括編集」Page Object。
 * 納品ケース表 integration_test/e2e/m03_10_admin_product_product_bulk_buy_standard_price_edit_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.md /
 * messages.ja.yaml)由来（オラクル独立性）。実装からはセレクタ・ルート（位置情報）のみを取る。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（src/Eccube/...・現行ソース行基準）:
 *  - 編集フォーム #product-class-form（edit_bulk_update_buy_price.twig:144、action=admin_product_bulk_update_buy_price）
 *  - 隠し productIds（edit_bulk_update_buy_price.twig:165）
 *  - 買取価格(NM) 入力 .js-buy-price（edit_bulk_update_buy_price.twig:212）
 *    name=bulk_update_product_price[product_classes][n][buy_price_nm]（Form getBlockPrefix=bulk_update_product_price）
 *  - 基準価格(NM) 入力 .js-base-price.js-base-price-nm（edit_bulk_update_buy_price.twig:290,292）
 *  - 基準価格(SP) 入力 .js-base-price-sp（edit_bulk_update_buy_price.twig:303、readonly: BulkUpdateProductPriceDetailType.php:50）
 *  - 価格比率(読み取り専用) .js-ratio-output（edit_bulk_update_buy_price.twig:281）
 *  - 隠し 商品ID #..._product_id（edit_bulk_update_buy_price.twig:196 / DetailType.php:59）
 *  - 隠し NM規格ID #..._product_class_id_nm（edit_bulk_update_buy_price.twig:291 / DetailType.php:42）
 *  - 登録ボタン trans admin.common.registration=「登録」（edit_bulk_update_buy_price.twig:368）
 *  - 商品一覧リンク trans admin.product.product_list=「商品一覧」（edit_bulk_update_buy_price.twig:357-360 / messages.ja.yaml:1724）
 *  - 成功フラッシュ .alert-success（alert.twig:22、eccube.admin.success）
 *  - エラーフラッシュ .alert-danger（alert.twig:42、eccube.admin.error）
 *  - 一覧の一括編集ボタン trans admin.product.standard_price_bulk_update（index.twig:477-479 / messages.ja.yaml:2048）
 *  - 一覧の商品チェック input[name^="ids"]（index.twig:144）
 */
export class ProductProductBulkBuyStandardPriceEditPage {
  readonly page: Page;
  readonly productListUrl: string; // 商品一覧（入口）
  readonly editUrl: string; // 編集表示 GET/POST

  readonly form: Locator; // #product-class-form
  readonly productIdsHidden: Locator; // input[name="productIds"]
  readonly buyPriceNm: Locator; // .js-buy-price（NM買取価格・各行先頭）
  readonly basePriceNm: Locator; // .js-base-price-nm（NM基準価格）
  readonly basePriceSp: Locator; // .js-base-price-sp（SP基準価格・readonly）
  readonly ratioOutput: Locator; // .js-ratio-output（読み取り専用）
  readonly registerButton: Locator; // 「登録」
  readonly productListLink: Locator; // 「商品一覧」リンク
  readonly successFlash: Locator; // .alert-success
  readonly errorFlash: Locator; // .alert-danger

  // 一覧（入口）側
  readonly bulkEditButton: Locator; // 「買取・基準価格一括編集」
  readonly listCheckboxes: Locator; // input[name^="ids"]

  constructor(page: Page) {
    this.page = page;
    this.productListUrl = `/${ECCUBE_ADMIN_ROUTE}/product`;
    this.editUrl = `/${ECCUBE_ADMIN_ROUTE}/product/edit_bulk_update_buy_price`;

    this.form = page.locator("#product-class-form");
    this.productIdsHidden = page.locator('input[name="productIds"]');
    this.buyPriceNm = page.locator(".js-buy-price");
    this.basePriceNm = page.locator(".js-base-price-nm");
    this.basePriceSp = page.locator(".js-base-price-sp");
    this.ratioOutput = page.locator(".js-ratio-output");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.productListLink = page.getByRole("link", { name: "商品一覧" });
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");

    this.bulkEditButton = page.getByRole("button", {
      name: "買取・基準価格一括編集",
    });
    this.listCheckboxes = page.locator('input[name^="ids"]');
  }

  /** 商品一覧（入口）を開く。 */
  async gotoList() {
    await this.page.goto(this.productListUrl);
  }

  /** 編集URLを ids クエリ付きで直接開く（ブックマーク相当）。ids 未指定なら空送信。 */
  async gotoEdit(ids: number[] = []) {
    const query = ids.map((id) => `ids[]=${id}`).join("&");
    await this.page.goto(query ? `${this.editUrl}?${query}` : this.editUrl);
  }

  /** 一覧で先頭商品をチェックし「買取・基準価格一括編集」ボタンを押下する。 */
  async openEditorFromList() {
    await this.listCheckboxes.first().check();
    await this.bulkEditButton.click();
  }

  /** 先頭行の買取価格(NM)・基準価格(NM)を入力する。 */
  async fillFirstRow(buyPriceNm: string, basePriceNm?: string) {
    await this.buyPriceNm.first().fill(buyPriceNm);
    if (basePriceNm !== undefined) {
      await this.basePriceNm.first().fill(basePriceNm);
    }
  }

  /** 「登録」ボタンを押下して確定する。 */
  async submit() {
    await this.registerButton.click();
  }

  /** 編集表のUI部品が仕様どおり表示されること。 */
  async seeEditForm() {
    await expect(this.form).toBeVisible();
    await expect(this.buyPriceNm.first()).toBeVisible();
    await expect(this.registerButton).toBeVisible();
    await expect(this.productListLink).toBeVisible();
  }
}
