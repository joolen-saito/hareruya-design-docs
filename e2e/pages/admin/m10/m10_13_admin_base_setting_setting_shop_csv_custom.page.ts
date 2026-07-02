import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 > カスタムCSV出力項目設定 Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m10_13_admin_base_setting_setting_shop_csv_custom_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m10-13_admin_base_setting_setting_shop_csv_custom.md / 観点表 / 基本設計）由来（オラクル独立性）。
 * pf-eccube3 のリバース設計であり、刷新先 ec-cube-enterprise との表示文言・選択肢の乖離はケース表「付帯表4 不具合候補」に出し、
 * テストは仕様どおりに書く（実装の現挙動を期待値へ写さない）。セレクタは Twig 由来の位置情報のみ。本リポジトリでは Playwright を実行しない。
 *
 * ルート（CustomerCsvController.php）:
 *  - 表示 GET    admin_setting_shop_csv_custom        = /%eccube_admin_route%/setting/shop/custom_csv/{csvTypeId}/{csvExtensionId}
 *                 defaults csvTypeId=CsvType::CSV_TYPE_PRODUCT(=1), csvExtensionId=null（CustomerCsvController.php:46）
 *  - 保存 POST   admin_setting_shop_csv_custom_update = 同一パス（CustomerCsvController.php:63）。$request->get('admin_custom_csv') 直読み・isValid() 不使用
 *  - 削除 DELETE admin_setting_shop_csv_custom_delete = /%eccube_admin_route%/setting/shop/custom_csv/delete/{csvExtensionId}（CustomerCsvController.php:90）
 *
 * セレクタ根拠（getBlockPrefix=admin_custom_csv：CustomCsvType.php:141-144。twig は明示 id 上書きを併用）:
 *  - CSV種別セレクト #csv-type name=admin_custom_csv[csv_type]（custom_csv.twig:97 id上書き / CustomCsvType.php:81）
 *  - カスタムCSVセレクト #admin_custom_csv_csv_extensions（custom_csv.twig:106 / CustomCsvType.php:94。placeholder「新規作成」:102）
 *  - 出力名テキスト #admin_custom_csv_name（custom_csv.twig:115 / CustomCsvType.php:105。placeholder「カスタムCSV名称」:111）
 *  - 左「出力しない項目」マルチセレクト #csv-not-output（custom_csv.twig:127 id上書き / CustomCsvType.php:115）
 *  - 右「出力する項目」マルチセレクト #csv-output（custom_csv.twig:166 id上書き / CustomCsvType.php:123）
 *  - 移送ボタン（div.btn・id付き）: #add 出力（custom_csv.twig:136）/ #remove 解除（:143）/ #add-all すべて出力（:150）/ #remove-all すべて解除（:157）
 *  - 順序ボタン（div.btn）: .move[data-value=up] ひとつ上へ（custom_csv.twig:175）/ [data-value=down] ひとつ下へ（:182）
 *                          .move-most[data-value=top] 一番上へ（:189）/ [data-value=bottom] 一番下へ（:196）
 *  - 設定（保存）ボタン button.btn-ec-conversion type=submit trans admin.common.registration=「登録」（custom_csv.twig:227 / messages.ja.yaml:1436）
 *  - 削除ボタン button.btn-ec-delete（csvExtensionId 有時のみ） trans admin.common.delete=「削除」（custom_csv.twig:214-220 / messages.ja.yaml:1444）
 *  - 削除モーダル #DeleteModal（custom_csv.twig:236）。文言 admin.setting.shop.csv.delete_modal__message（:248 / messages.ja.yaml:3904）
 *  - 見出しカード「CSV出力項目」trans admin.setting.shop.csv.csv_columns（custom_csv.twig:87 / messages.ja.yaml:2956）
 *  - CSRF hidden form._token #admin_custom_csv__token（custom_csv.twig:80）
 *  - title block trans admin.setting.shop.custom_csv=「カスタムCSV」（custom_csv.twig:5）/ sub_title admin.setting.basic_info=「基本情報設定」（:6）
 *  - 成功フラッシュ .alert-success（共通 alert.twig。文言の正は仕様＝付帯表4参照）
 */
export class BaseSettingSettingShopCsvCustomPage {
  readonly page: Page;

  // CsvType マスタ確認値（Master/CsvType.php:32-87。位置情報＝URLパラメータ生成にのみ使用）。
  static readonly CSV_TYPE_PRODUCT = 1; // 商品CSV（既定）
  static readonly CSV_TYPE_CUSTOMER = 2; // 会員CSV（※設計は選択肢非掲載だが刷新先は掲載＝付帯表4 不具合候補#1）
  static readonly CSV_TYPE_ORDER = 3; // 受注CSV
  static readonly CSV_TYPE_SHIPPING = 4; // 配送CSV

  readonly csvType: Locator; // #csv-type 種別セレクト
  readonly csvExtensions: Locator; // #admin_custom_csv_csv_extensions カスタムCSVセレクト
  readonly name: Locator; // #admin_custom_csv_name 出力名
  readonly notOutput: Locator; // #csv-not-output 左リスト
  readonly output: Locator; // #csv-output 右リスト
  readonly notOutputOptions: Locator; // 左 option 群
  readonly outputOptions: Locator; // 右 option 群

  readonly addButton: Locator; // #add 出力
  readonly removeButton: Locator; // #remove 解除
  readonly addAllButton: Locator; // #add-all すべて出力
  readonly removeAllButton: Locator; // #remove-all すべて解除
  readonly moveUp: Locator; // .move[data-value=up]
  readonly moveDown: Locator; // .move[data-value=down]
  readonly moveTop: Locator; // .move-most[data-value=top]
  readonly moveBottom: Locator; // .move-most[data-value=bottom]

  readonly saveButton: Locator; // 設定（登録）button.btn-ec-conversion
  readonly deleteButton: Locator; // 削除 button.btn-ec-delete（既存定義時のみ）
  readonly deleteModal: Locator; // #DeleteModal
  readonly columnsCard: Locator; // 見出し「CSV出力項目」card-header
  readonly csrfToken: Locator; // hidden _token
  readonly successAlert: Locator; // .alert-success
  readonly errorAlert: Locator; // .alert-danger

  // 仕様（設計書「フロント挙動／表示要素」）由来の表示文言＝オラクル。実装の現挙動に合わせて変えない。
  readonly subTitleSpec = "カスタムCSV出力項目設定"; // 設計書サブタイトル（刷新先は別文言＝付帯表4 #2）
  readonly pageTitleSpec = "システム設定"; // 設計書「フロント挙動／表示要素」ページタイトル（刷新先 title block は「カスタムCSV」＝付帯表4 #2）
  readonly columnsLabel = "CSV出力項目"; // admin.setting.shop.csv.csv_columns

  constructor(page: Page) {
    this.page = page;
    this.csvType = page.locator("#csv-type");
    this.csvExtensions = page.locator("#admin_custom_csv_csv_extensions");
    this.name = page.locator("#admin_custom_csv_name");
    this.notOutput = page.locator("#csv-not-output");
    this.output = page.locator("#csv-output");
    this.notOutputOptions = page.locator("#csv-not-output option");
    this.outputOptions = page.locator("#csv-output option");

    this.addButton = page.locator("#add");
    this.removeButton = page.locator("#remove");
    this.addAllButton = page.locator("#add-all");
    this.removeAllButton = page.locator("#remove-all");
    this.moveUp = page.locator('.move[data-value="up"]');
    this.moveDown = page.locator('.move[data-value="down"]');
    this.moveTop = page.locator('.move-most[data-value="top"]');
    this.moveBottom = page.locator('.move-most[data-value="bottom"]');

    this.saveButton = page.locator('button[type="submit"].btn-ec-conversion');
    this.deleteButton = page.locator("button.btn-ec-delete");
    this.deleteModal = page.locator("#DeleteModal");
    this.columnsCard = page.locator(".card-header");
    this.csrfToken = page.locator("#admin_custom_csv__token");
    this.successAlert = page.locator(".alert-success");
    this.errorAlert = page.locator(".alert-danger");
  }

  /** 表示・保存の機能URL（csvExtensionId 省略可）。 */
  url(
    csvTypeId: number = BaseSettingSettingShopCsvCustomPage.CSV_TYPE_PRODUCT,
    csvExtensionId?: number
  ): string {
    const base = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv/${csvTypeId}`;
    return csvExtensionId != null ? `${base}/${csvExtensionId}` : base;
  }

  /** 削除URL（DELETE）。 */
  deleteUrl(csvExtensionId: number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv/delete/${csvExtensionId}`;
  }

  async goto(
    csvTypeId: number = BaseSettingSettingShopCsvCustomPage.CSV_TYPE_PRODUCT,
    csvExtensionId?: number
  ) {
    await this.page.goto(this.url(csvTypeId, csvExtensionId));
  }

  /** 画面の主要UI部品が仕様どおり表示されること（CSV種別/カスタムCSV/出力名/左右リスト/設定ボタン）。 */
  async seeForm() {
    await expect(this.csvType).toBeVisible();
    await expect(this.csvExtensions).toBeVisible();
    await expect(this.name).toBeVisible();
    await expect(this.notOutput).toBeVisible();
    await expect(this.output).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  /** 4つの移送ボタンと4つの順序ボタンが表示されること。 */
  async seeOperationButtons() {
    for (const b of [this.addButton, this.removeButton, this.addAllButton, this.removeAllButton]) {
      await expect(b).toBeVisible();
    }
    for (const b of [this.moveUp, this.moveDown, this.moveTop, this.moveBottom]) {
      await expect(b).toBeVisible();
    }
  }

  /** 種別セレクトで現在選択されている値（種別ID）。 */
  async selectedTypeValue(): Promise<string> {
    return this.csvType.inputValue();
  }

  /** CSV種別セレクトの選択肢に存在する value 群（仕様の3種限定検証に使用）。 */
  async typeOptionValues(): Promise<string[]> {
    return this.csvType.locator("option").evaluateAll((els) =>
      els.map((e) => (e as HTMLOptionElement).value).filter((v) => v !== "")
    );
  }

  /** 種別セレクトを変更し、JS により当該種別IDのGETへ遷移する。 */
  async changeType(id: number) {
    await this.csvType.selectOption(String(id));
  }

  /** カスタムCSVセレクトで既存定義を選び、JS により定義ID付きGETへ遷移する。 */
  async changeExtension(extensionId: number) {
    await this.csvExtensions.selectOption(String(extensionId));
  }

  /** 左リスト先頭 option を選択し「出力」で右へ移す（DOM移動のみ・保存しない）。 */
  async transferFirstToOutput() {
    await this.notOutputOptions.first().evaluate((el: HTMLOptionElement) => {
      el.selected = true;
    });
    await this.addButton.click();
  }

  /** 右リスト先頭 option を選択し「解除」で左へ戻す（DOM移動のみ・保存しない）。 */
  async releaseFirstToNotOutput() {
    await this.outputOptions.first().evaluate((el: HTMLOptionElement) => {
      el.selected = true;
    });
    await this.removeButton.click();
  }

  /** 右リストの指定 index の option を単一選択する（順序ボタン検証用）。 */
  async selectOutputOption(index: number) {
    await this.output.locator("option").nth(index).evaluate((el: HTMLOptionElement) => {
      const sel = el.parentElement as HTMLSelectElement;
      Array.from(sel.options).forEach((o) => (o.selected = false));
      el.selected = true;
    });
  }

  /** 「すべて出力」で左の全項目を右へ移す（DOM移動のみ）。 */
  async transferAllToOutput() {
    await this.addAllButton.click();
  }

  /** 「すべて解除」で右の全項目を左へ移す（DOM移動のみ）。 */
  async releaseAllToNotOutput() {
    await this.removeAllButton.click();
  }

  /** 出力名を入力する。 */
  async fillName(value: string) {
    await this.name.fill(value);
  }

  /** 「設定（登録）」を押下して保存する（POST＝破壊的・dtb_csv_extension 等を更新）。 */
  async save() {
    await this.saveButton.click();
  }

  /** 成功フラッシュが表示されること（文言の正は仕様。乖離は付帯表4参照）。 */
  async seeSaveSuccess() {
    await expect(this.successAlert).toBeVisible();
  }
}
