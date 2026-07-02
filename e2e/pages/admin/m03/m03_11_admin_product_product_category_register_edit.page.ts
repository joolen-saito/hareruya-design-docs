import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 カテゴリ登録・編集 Page Object（m03-11_admin_product_product_category_register_edit）。
 * 対象は同一Twig上の登録（新規子カテゴリ作成）・編集フォームのみ（兄弟一覧・並べ替え・削除・CSVは別機能m03-45）。
 * 期待結果は仕様(functions/pf-eccube3/m03-11_admin_product_product_category_register_edit.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_category`（CategoryType.php:159-162）由来の位置情報のみ。
 *
 * URL（CategoryController.php）:
 *  - GET show(新規フォーム)  : /%route%/product/category/{parent_id}  (:68)
 *  - GET edit(編集フォーム)  : /%route%/product/category/{id}/edit    (:92)
 *  - POST create            : 同 show パス                            (:115)
 *  - POST update            : 同 edit パス                            (:155)
 *  - GET root(ルート一覧)    : /%route%/product/category              (:67)
 *
 * DOM id 根拠（getBlockPrefix=admin_category）:
 *  - フォーム要素 #admin_category_form（category.twig:261）／登録カード #ex-category-register-form（category.twig:265）
 *  - name(必須) → #admin_category_name（form_row form.name category.twig:269）
 *  - category_name_en(任意) → #admin_category_category_name_en（category.twig:270）
 *  - front_search_hide_flg → #admin_category_front_search_hide_flg（category.twig:275）
 *  - branch_hide_flg → #admin_category_branch_hide_flg（category.twig:279）
 *  - banner_image_file(新規のみ) → #admin_category_banner_image_file（category.twig:296-297）
 *  - icon_image_file(新規のみ) → #admin_category_icon_image_file（category.twig:335-336）
 *  - html_ja → #admin_category_html_ja（category.twig:367）/ html_en → #admin_category_html_en（category.twig:368）
 *  - search_parameters → #admin_category_search_parameters（category.twig:369）
 *  - 送信ボタン「子カテゴリ作成」trans admin.product.category_submit_create_child（category.twig:527-528 / messages.ja.yaml:1968）
 *  - 送信ボタン「カテゴリ更新」trans admin.product.category_submit_update（category.twig:527-528 / messages.ja.yaml:1969）
 *  - フィールドエラー .invalid-feedback / .form-error-message（bootstrap_4_horizontal_layout.html.twig:55,58）
 *  - 成功フラッシュ「保存しました」trans admin.common.save_complete（messages.ja.yaml:1398 / CategoryController.php:212）
 *  - アップロードエラー「アップロードに失敗しました」trans admin.common.upload_error（messages.ja.yaml:1408 / CategoryController.php:232,254-277）
 */
export class ProductProductCategoryRegisterEditPage {
  readonly page: Page;
  readonly rootUrl: string; // ルート一覧（親null・登録フォームカードなし）

  readonly formCard: Locator; // #ex-category-register-form（category.twig:265）
  readonly nameInput: Locator; // カテゴリ名（日）必須
  readonly nameEnInput: Locator; // カテゴリ名（英）任意
  readonly frontHideCheck: Locator; // フロント非表フラグ
  readonly branchHideCheck: Locator; // 支店非表示フラグ
  readonly htmlJa: Locator; // 埋め込みHTML（日）
  readonly htmlEn: Locator; // 埋め込みHTML（英）
  readonly searchParams: Locator; // 検索パラメーター
  readonly bannerFile: Locator; // バナー画像file（新規のみ）
  readonly iconFile: Locator; // アイコン画像file（新規のみ）
  readonly createButton: Locator; // 「子カテゴリ作成」
  readonly updateButton: Locator; // 「カテゴリ更新」
  readonly fieldError: Locator; // .invalid-feedback（フィールドエラー）
  readonly formError: Locator; // .alert-danger（ルートフォームエラー＝アップロード失敗等）

  constructor(page: Page) {
    this.page = page;
    this.rootUrl = `/${ECCUBE_ADMIN_ROUTE}/product/category`;

    this.formCard = page.locator("#ex-category-register-form");
    this.nameInput = page.locator("#admin_category_name");
    this.nameEnInput = page.locator("#admin_category_category_name_en");
    this.frontHideCheck = page.locator("#admin_category_front_search_hide_flg");
    this.branchHideCheck = page.locator("#admin_category_branch_hide_flg");
    this.htmlJa = page.locator("#admin_category_html_ja");
    this.htmlEn = page.locator("#admin_category_html_en");
    this.searchParams = page.locator("#admin_category_search_parameters");
    this.bannerFile = page.locator("#admin_category_banner_image_file");
    this.iconFile = page.locator("#admin_category_icon_image_file");
    // 送信ボタンは type=submit form="admin_category_form"。文言は trans 由来（仕様）。
    this.createButton = page.getByRole("button", { name: "子カテゴリ作成" });
    this.updateButton = page.getByRole("button", { name: "カテゴリ更新" });
    this.fieldError = page.locator(".invalid-feedback");
    this.formError = page.locator(".alert-danger");
  }

  /** 親の子一覧（新規フォーム）を表示する。 */
  showUrl(parentId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/category/${parentId}`;
  }
  /** 編集フォームを表示する。 */
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/category/${id}/edit`;
  }

  async gotoShow(parentId: number | string) {
    await this.page.goto(this.showUrl(parentId));
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }
  async gotoRoot() {
    await this.page.goto(this.rootUrl);
  }

  /** 新規フォームでカテゴリ名（日）を入力して「子カテゴリ作成」を押下。 */
  async submitCreate(name: string) {
    await this.nameInput.fill(name);
    await this.createButton.click();
  }

  /** 編集フォームでカテゴリ名（日）を入力して「カテゴリ更新」を押下。 */
  async submitUpdate(name: string) {
    await this.nameInput.fill(name);
    await this.updateButton.click();
  }

  /** 新規フォームのUI部品が仕様どおり表示されること。 */
  async seeCreateForm() {
    await expect(this.formCard).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.nameEnInput).toBeVisible();
    await expect(this.frontHideCheck).toBeVisible();
    await expect(this.branchHideCheck).toBeVisible();
    await expect(this.htmlJa).toBeVisible();
    await expect(this.htmlEn).toBeVisible();
    await expect(this.searchParams).toBeVisible();
    await expect(this.createButton).toBeVisible();
  }

  /** 編集フォームのUI部品が仕様どおり表示されること。 */
  async seeEditForm() {
    await expect(this.formCard).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.updateButton).toBeVisible();
  }
}
