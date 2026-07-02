import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 カテゴリ一覧 Page Object（list＋同一画面内CRUD）。
 * 納品ケース表 integration_test/e2e/m03_45_admin_product_product_category_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m03-45_admin_product_product_category_list.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_category`（CategoryType.php:159-162）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 根拠（getBlockPrefix=admin_category。入力カードは Parent is not null or isCategoryEdit のときのみ出力 category.twig:520）:
 *  - name             → #admin_category_name（category.twig:269 / CategoryType.php:46-54 NotBlank+Length）
 *  - category_name_en → #admin_category_category_name_en（category.twig:270 / CategoryType.php:55-63）
 *  - banner_image_file→ #admin_category_banner_image_file（category.twig:296 / CategoryType.php:93 mapped=false。allow_image_upload時のみ）
 *  - search_parameters→ #admin_category_search_parameters（category.twig:369 / CategoryType.php:131-139）
 *  - 変換ボタン「子カテゴリ作成」/「カテゴリ更新」 button[form=admin_category_form]
 *      （category.twig:527-528 / admin.product.category_submit_create_child messages.ja.yaml:1968 / category_submit_update :1969）
 *  - 入力カード #ex-category-register-form（category.twig:265）
 *  - CSVダウンロード a[href*=product/category/export]（category.twig:243 / admin.common.csv_download :1546）
 *  - CSV出力項目設定 a[href*=setting/shop/csv]（category.twig:247-248 / admin.setting.shop.csv_setting :2784）
 *  - 一覧コンテナ .sortable-container（category.twig:377）／行 .sortable-item（category.twig:390）
 *  - カテゴリ名リンク .sortable-item a[href*=product/category/]（show、category.twig:399 / Controller.php:68）
 *  - 編集アイコン a.action-edit（category.twig:416 / Controller.php:92）
 *  - 削除トリガ a[data-bs-target="#DeleteModal"][data-message]（category.twig:426-429 / delete_modal__message %name% :1593）
 *  - 削除モーダル #DeleteModal（category.twig:440）／メッセージ p.modal-message（category.twig:454, JS差替 :122）／削除確定 a.btn-ec-delete（category.twig:460-462）
 *  - パンくず「すべてのカテゴリ」 .breadcrumb a[href=admin_product_category]（category.twig:225-226 / admin.product.category_all :1955）
 *  - 右カラムツリー .c-directoryTree（category.twig:507）／ツリー見出し card-title「すべてのカテゴリ」（category.twig:503-504）
 *  - タイトル帯「商品管理」(title block category.twig:15 / :1723) /「カテゴリ一覧」(sub_title category.twig:16 / :1732) は
 *    default_frame 側の出力先クラスが要実機確認のため、専用セレクタを創作せず spec ではテキスト存在で確認する。
 */
export class ProductProductCategoryListPage {
  readonly page: Page;
  readonly url: string; // ルート直下一覧 GET /{admin_route}/product/category

  readonly csvDownloadButton: Locator; // 「CSVダウンロード」
  readonly csvSettingButton: Locator; // 「CSV出力項目設定」
  readonly tree: Locator; // 右カラム カテゴリツリー
  readonly treeTitle: Locator; // ツリー見出し「すべてのカテゴリ」
  readonly breadcrumb: Locator; // パンくず
  readonly breadcrumbRootLink: Locator; // パンくず「すべてのカテゴリ」
  readonly inputCard: Locator; // 入力カード（親あり/編集時のみ）
  readonly nameInput: Locator; // カテゴリ名（日）
  readonly nameEnInput: Locator; // カテゴリ名（英）任意・桁長Length
  readonly searchParametersInput: Locator; // 検索パラメーター 任意・桁長Length
  readonly bannerImageFile: Locator; // バナー画像ファイル（作成時のみ）
  readonly submitButton: Locator; // 変換ボタン（子カテゴリ作成/カテゴリ更新）
  readonly listContainer: Locator; // 兄弟一覧コンテナ
  readonly listItems: Locator; // 兄弟一覧の各行
  readonly firstNameLink: Locator; // 先頭行のカテゴリ名リンク（show）
  readonly firstEditLink: Locator; // 先頭行の編集アイコン
  readonly firstDeleteTrigger: Locator; // 先頭行の削除トリガ（モーダル起動）
  readonly deleteModal: Locator; // 削除確認モーダル
  readonly deleteModalMessage: Locator; // 削除確認メッセージ
  readonly deleteModalConfirm: Locator; // モーダル内 削除確定アンカー
  readonly formErrors: Locator; // フォームエラー領域

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/category`;

    this.csvDownloadButton = page.locator('a[href*="/product/category/export"]');
    this.csvSettingButton = page.getByRole("link", { name: "CSV出力項目設定" });
    this.tree = page.locator(".c-directoryTree");
    this.treeTitle = page.locator(".c-secondaryCol .card-title");
    this.breadcrumb = page.locator(".breadcrumb");
    this.breadcrumbRootLink = page.locator(
      `.breadcrumb a[href$="/product/category"]`
    );
    this.inputCard = page.locator("#ex-category-register-form");
    this.nameInput = page.locator("#admin_category_name");
    this.nameEnInput = page.locator("#admin_category_category_name_en");
    this.searchParametersInput = page.locator(
      "#admin_category_search_parameters"
    );
    this.bannerImageFile = page.locator("#admin_category_banner_image_file");
    this.submitButton = page.locator('button[form="admin_category_form"]');
    this.listContainer = page.locator(".sortable-container");
    this.listItems = page.locator(".sortable-item");
    // 名前リンク＝show（/product/category/{id}。編集リンクは /edit を含むため除外）。
    this.firstNameLink = page
      .locator('.sortable-item a[href*="/product/category/"]:not([href*="/edit"])')
      .first();
    this.firstEditLink = page.locator(".sortable-item a.action-edit").first();
    this.firstDeleteTrigger = page
      .locator('.sortable-item a[data-bs-target="#DeleteModal"]')
      .first();
    this.deleteModal = page.locator("#DeleteModal");
    this.deleteModalMessage = page.locator("#DeleteModal .modal-message");
    this.deleteModalConfirm = page.locator(
      '#DeleteModal a.btn-ec-delete[data-method="delete"]'
    );
    this.formErrors = page.locator(".invalid-feedback, .text-danger");
  }

  /** ルート直下一覧を開く（GET /{admin_route}/product/category）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 指定 parent_id の親配下一覧を開く（show）。 */
  async gotoParent(parentId: number | string) {
    await this.page.goto(`${this.url}/${parentId}`);
  }

  /** 先頭カテゴリ名リンクを押下して一段深い親配下一覧へ進む。 */
  async openFirstChild() {
    await this.firstNameLink.click();
  }

  /** 先頭行の編集アイコンを押下して編集画面を開く。 */
  async openFirstEdit() {
    await this.firstEditLink.click();
  }

  /** 入力カードにカテゴリ名を入力し変換ボタンを押下する（作成/更新共通）。 */
  async submitCategoryName(name: string) {
    await this.nameInput.fill(name);
    await this.submitButton.click();
  }

  /** カテゴリ名（日）は有効値とし、対象の任意桁長項目に値を入れて送信する（英名・検索パラメーターの桁長検証用）。 */
  async submitWithField(target: Locator, value: string) {
    await this.nameInput.fill(`e2e_cat_${Date.now()}`); // 日名は有効値で他項目の桁長のみを検証
    await target.fill(value);
    await this.submitButton.click();
  }

  /** 先頭行の削除トリガを押下して削除確認モーダルを開く。 */
  async openFirstDeleteModal() {
    await this.firstDeleteTrigger.click();
  }

  /** ルート一覧の主要UI部品（CSVボタン2件・ツリー）が仕様どおり表示されること。 */
  async seeCsvButtons() {
    await expect(this.csvDownloadButton).toBeVisible();
    await expect(this.csvSettingButton).toBeVisible();
  }

  /** ツリー見出し「すべてのカテゴリ」が表示されること。 */
  async seeTree() {
    await expect(this.tree).toBeVisible();
    await expect(this.treeTitle).toContainText("すべてのカテゴリ");
  }
}
