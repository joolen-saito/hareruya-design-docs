import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品規格 登録/編集 Page Object（M03-09）。
 * 納品ケース表 integration_test/e2e/m03_09_admin_product_product_class_edit_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-09_admin_product_product_class_edit.md / 観点表)由来（オラクル独立性）。
 * セレクタは ec-cube-enterprise の Twig＋Symfony Form の getBlockPrefix=`admin_product_class`
 * （ProductClassType.php getBlockPrefix）由来の位置情報のみ。挙動の正否は仕様で判定する。
 *
 * 画面・ルート（ec-cube-enterprise 実装。pf-eccube3 設計とパス形が異なる＝付帯表4 #5）:
 *  - 新規: GET/POST  /<route>/product/product/class/{id}/new        (admin_product_product_class_new)
 *  - 保存: POST      /<route>/product/product/class/{id}/store       (admin_product_product_class_store)
 *  - 編集: GET       /<route>/product/product/class/{id}/edit/{pcId} (admin_product_product_class_edit)
 *  - 更新: POST      /<route>/product/product/class/{id}/update/{pcId}(admin_product_product_class_update)
 *  - 削除: DELETE    /<route>/product/product/class/{id}/delete/{pcId}(admin_product_product_class_delete)
 *
 * DOM id 根拠（@admin/Product/ProductClass/edit.twig、行番号は現行ソース）:
 *  - フォーム: form#form action=formAction（edit.twig:226）
 *  - 商品ID: 'admin.product.product_id'|trans + {{ Product.id }}（edit.twig:250-254）
 *  - 商品規格ID行: ProductClass.id のときのみ（edit.twig:258-269）
 *  - 言語: #admin_product_class_Language（edit.twig:298-302。編集時は disabled+hidden＝読み取り表示）
 *  - 状態(カード状態): #admin_product_class_CardCondition（edit.twig:314-318。編集時は disabled+hidden）
 *  - 商品コード: #admin_product_class_code（edit.twig:354）
 *  - 販売制限数: #admin_product_class_sale_limit（edit.twig:381）
 *  - 販売価格: #admin_product_class_price02（edit.twig:392 / label 'admin.product.sale_price'=販売価格）
 *  - セールフラグ: #admin_product_class_sale_flg（edit.twig:401）
 *  - 基準価格: #admin_product_class_standard_price（edit.twig:412）
 *  - 買取価格: #admin_product_class_buy_price（edit.twig:423）
 *  - 代表画像: #admin_product_class_ProductClassImages（edit.twig:434 select multiple / label 代表画像）
 *  - 帯URL: #admin_product_class_belt_url（edit.twig:456）
 *  - 高額商品コード: #admin_product_class_high_price_code（edit.twig:467）
 *  - 下代: #admin_product_class_wholesale_price（edit.twig:478）
 *  - 状態別称(memo): #admin_product_class_memo（edit.twig:490）
 *  - 部門: #admin_product_class_Section（edit.twig:500）
 *  - 棚番号: #admin_product_class_ShelfNumber（edit.twig:511）
 *  - 商品状態(Status): #admin_product_class_Status（edit.twig:550 conversion area）
 *  - 登録ボタン: button[type=submit][form=form] trans admin.common.registration=「登録」（edit.twig:555-556 / messages.ja.yaml:1436）
 *  - 商品規格一覧リンク: trans admin.product.product_class_list=「商品規格一覧」（edit.twig:538-539 / :1726）
 *  - 削除ボタン: a.btn-ec-delete trans admin.common.delete=「削除」（edit.twig:572 / :1444。ProductClass.id のときのみ）
 *  - 削除確認モーダル: #deleteConfirmModal（edit.twig:576-595。message admin.common.delete_modal__message）
 *  - 期間別販売数カード: card-title trans admin.product.sales_quantity__card_title=「期間別販売数」（edit.twig:647 / :2051）
 *  - フォームエラー: form_errors（.invalid-feedback / .text-danger 相当）。フラッシュは default_frame のアラート領域。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductClassEditPage {
  readonly page: Page;

  readonly form: Locator; // form#form（edit.twig:226）
  readonly cardHeader: Locator; // カード見出し「商品規格登録」（edit.twig:235）
  readonly submitButton: Locator; // 登録ボタン（edit.twig:555）
  readonly classListLink: Locator; // 商品規格一覧リンク（edit.twig:538）
  readonly deleteButton: Locator; // 削除ボタン（edit.twig:572。編集時のみ）
  readonly deleteModal: Locator; // 削除確認モーダル（edit.twig:576）
  readonly salesQuantityCard: Locator; // 期間別販売数カード（edit.twig:643-）

  // 入力欄（blockPrefix=admin_product_class）
  readonly language: Locator; // #admin_product_class_Language
  readonly cardCondition: Locator; // #admin_product_class_CardCondition
  readonly code: Locator; // #admin_product_class_code
  readonly saleLimit: Locator; // #admin_product_class_sale_limit
  readonly price02: Locator; // 販売価格 #admin_product_class_price02
  readonly buyPrice: Locator; // 買取価格 #admin_product_class_buy_price
  readonly standardPrice: Locator; // 基準価格 #admin_product_class_standard_price
  readonly productClassImages: Locator; // 代表画像 #admin_product_class_ProductClassImages
  readonly beltUrl: Locator; // #admin_product_class_belt_url
  readonly highPriceCode: Locator; // #admin_product_class_high_price_code
  readonly wholesalePrice: Locator; // #admin_product_class_wholesale_price
  readonly memo: Locator; // #admin_product_class_memo
  readonly section: Locator; // 部門 #admin_product_class_Section
  readonly shelfNumber: Locator; // 棚番号 #admin_product_class_ShelfNumber

  // 商品規格ID 行（編集時のみ表示。ラベル「商品規格ID」）
  readonly productClassIdRow: Locator;

  constructor(page: Page) {
    this.page = page;

    this.form = page.locator("#form");
    this.cardHeader = page.locator(".card-header").first();
    this.submitButton = page.getByRole("button", { name: "登録" });
    this.classListLink = page.getByRole("link", { name: "商品規格一覧" });
    this.deleteButton = page.locator("a.btn-ec-delete").first();
    this.deleteModal = page.locator("#deleteConfirmModal");
    this.salesQuantityCard = page.locator("#salesQuantity");

    this.language = page.locator("#admin_product_class_Language");
    this.cardCondition = page.locator("#admin_product_class_CardCondition");
    this.code = page.locator("#admin_product_class_code");
    this.saleLimit = page.locator("#admin_product_class_sale_limit");
    this.price02 = page.locator("#admin_product_class_price02");
    this.buyPrice = page.locator("#admin_product_class_buy_price");
    this.standardPrice = page.locator("#admin_product_class_standard_price");
    this.productClassImages = page.locator("#admin_product_class_ProductClassImages");
    this.beltUrl = page.locator("#admin_product_class_belt_url");
    this.highPriceCode = page.locator("#admin_product_class_high_price_code");
    this.wholesalePrice = page.locator("#admin_product_class_wholesale_price");
    this.memo = page.locator("#admin_product_class_memo");
    this.section = page.locator("#admin_product_class_Section");
    this.shelfNumber = page.locator("#admin_product_class_ShelfNumber");

    // 「商品規格ID」ラベルを持つ行（edit.twig:261）。新規では描画されない。
    this.productClassIdRow = page.locator(".row", { hasText: "商品規格ID" });
  }

  newUrl(productId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/product/class/${productId}/new`;
  }

  editUrl(productId: number | string, productClassId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/product/class/${productId}/edit/${productClassId}`;
  }

  async gotoNew(productId: number | string) {
    await this.page.goto(this.newUrl(productId));
  }

  async gotoEdit(productId: number | string, productClassId: number | string) {
    await this.page.goto(this.editUrl(productId, productClassId));
  }

  /** 登録/編集フォームの基本UI部品が仕様どおり表示されること（見出し・登録ボタン・一覧リンク）。 */
  async seeForm() {
    await expect(this.cardHeader).toContainText("商品規格登録"); // messages.ja.yaml:1727
    await expect(this.submitButton).toBeVisible();
    await expect(this.classListLink).toBeVisible();
  }

  /** 規格固有の主要入力欄が表示されること（仕様「入力項目」由来の項目群）。 */
  async seeMainInputs() {
    await expect(this.code).toBeVisible(); // 商品コード
    await expect(this.saleLimit).toBeVisible(); // 販売制限数（設計「入力項目」:161）
    await expect(this.price02).toBeVisible(); // 販売価格
    await expect(this.buyPrice).toBeVisible(); // 買取価格
    await expect(this.productClassImages).toBeVisible(); // 代表画像
    await expect(this.section).toBeVisible(); // 部門
    await expect(this.shelfNumber).toBeVisible(); // 棚番号
    await expect(this.beltUrl).toBeVisible(); // 帯URL
    await expect(this.wholesalePrice).toBeVisible(); // 下代
    await expect(this.highPriceCode).toBeVisible(); // 高額商品コード
    await expect(this.memo).toBeVisible(); // 備考（設計「入力項目」:171）
  }

  /** 登録ボタンを押下する（POST 送信）。 */
  async submit() {
    await this.submitButton.click();
  }
}
