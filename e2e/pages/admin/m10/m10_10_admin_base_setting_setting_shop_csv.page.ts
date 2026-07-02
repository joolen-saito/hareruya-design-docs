import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 > CSV出力項目設定 Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m10_10_admin_base_setting_setting_shop_csv_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m10-10_admin_base_setting_setting_shop_csv.md / 観点表 / 基本設計）由来（オラクル独立性）。
 * pf-eccube3 のリバース設計であり、刷新先 ec-cube-enterprise との表示文言の乖離はケース表「付帯表4 不具合候補」に出し、
 * テストは仕様どおりに書く（実装の現挙動を期待値へ写さない）。セレクタは Twig 由来の位置情報のみ。本リポジトリでは Playwright を実行しない。
 *
 * ルート: admin_setting_shop_csv = GET|POST /%eccube_admin_route%/setting/shop/csv/{id}
 *   （CsvController.php:46。requirements id=\d+、defaults id=CsvType::CSV_TYPE_ORDER=受注CSV）。
 * フォームは createFormBuilder()（ブロックプレフィックス form）。POST は isValid() を呼ばず $request->get('form') を直読みする
 *   （CsvController.php:124-125）。token は個別に isTokenValid() で検証（CsvController.php:124）。
 *
 * セレクタ根拠（csv.twig は明示 id 上書きを多用）:
 *  - CSV種別セレクト #csv-type name=form[csv_type]（csv.twig:99 / :25。Master CsvType getBlockPrefix=csv_type CsvType.php:40-42）
 *  - 左「出力しない項目」マルチセレクト #csv-not-output（csv.twig:107）/ 右「出力する項目」#csv-output（csv.twig:146）
 *  - 移送ボタン（div.btn）: #add 出力（csv.twig:116）/ #remove 解除（:123）/ #add-all すべて出力（:130）/ #remove-all すべて解除（:137）
 *  - 順序ボタン（div.btn）: .move[data-value=up] ひとつ上へ（csv.twig:155）/ [data-value=down] ひとつ下へ（:162）
 *                          .move-most[data-value=top] 一番上へ（:169）/ [data-value=bottom] 一番下へ（:176）
 *  - 保存ボタン button.btn-ec-conversion type=submit trans admin.common.registration=「登録」（csv.twig:200 / messages.ja.yaml:1436）
 *  - 見出しカード「CSV出力項目」trans admin.setting.shop.csv.csv_columns（csv.twig:87 / messages.ja.yaml:2956）
 *  - 操作説明文 trans admin.setting.shop.csv.how_to_use（csv.twig:184 / messages.ja.yaml:2970）
 *  - CSRF hidden input[name=_token]（csv.twig:80）
 *  - 成功フラッシュ .alert-success（共通 alert.twig。テキストの正は仕様＝付帯表4参照）
 *  - タイトル block title trans admin.setting.shop.csv_setting=「CSV出力項目設定」（csv.twig:15 / messages.ja.yaml:2784）
 */
export class BaseSettingSettingShopCsvPage {
  readonly page: Page;

  // 確認値（参考。設計書「CSV種別の確認値」より）。種別ID→マスタ名の例。
  static readonly CSV_TYPE_PRODUCT = 1; // 商品CSV
  static readonly CSV_TYPE_CUSTOMER = 2; // 会員CSV
  static readonly CSV_TYPE_ORDER = 3; // 受注CSV（既定）
  static readonly CSV_TYPE_SHIPPING = 4; // 配送CSV
  static readonly CSV_TYPE_CATEGORY = 5; // カテゴリCSV

  readonly csvType: Locator; // #csv-type 種別セレクト（csv.twig:99）
  readonly notOutput: Locator; // #csv-not-output 左リスト（csv.twig:107）
  readonly output: Locator; // #csv-output 右リスト（csv.twig:146）
  readonly notOutputOptions: Locator; // 左 option 群
  readonly outputOptions: Locator; // 右 option 群

  readonly addButton: Locator; // #add 出力（csv.twig:116）
  readonly removeButton: Locator; // #remove 解除（csv.twig:123）
  readonly addAllButton: Locator; // #add-all すべて出力（csv.twig:130）
  readonly removeAllButton: Locator; // #remove-all すべて解除（csv.twig:137）
  readonly moveUp: Locator; // .move[data-value=up]（csv.twig:155）
  readonly moveDown: Locator; // .move[data-value=down]（csv.twig:162）
  readonly moveTop: Locator; // .move-most[data-value=top]（csv.twig:169）
  readonly moveBottom: Locator; // .move-most[data-value=bottom]（csv.twig:176）

  readonly saveButton: Locator; // 保存ボタン「登録」（csv.twig:200）
  readonly columnsCard: Locator; // 見出し「CSV出力項目」（csv.twig:87）
  readonly helpArea: Locator; // 操作説明文を内包する #csv-form 内 .card-body（how_to_use は csv.twig:184 に bare 出力）
  readonly csrfToken: Locator; // hidden _token（csv.twig:80）
  readonly successAlert: Locator; // .alert-success（共通フラッシュ）
  readonly pageTitleArea: Locator; // タイトル帯（block sub_title=csv.twig:16 を含むページ見出し領域。領域セレクタは要実機確認）

  // 仕様（設計書/観点表）由来の表示文言＝オラクル。実装に合わせて変えない。
  readonly title = "CSV出力項目設定"; // 設計書「フロント挙動／表示要素」＋ admin.setting.shop.csv_setting
  readonly subTitle = "システム設定"; // 設計書「フロント挙動／表示要素＝タイトル帯『システム設定／CSV出力項目設定』」。実装は「基本情報設定」（付帯表4#3）
  readonly saveLabel = "設定"; // 設計書「利用者視点の入口＝『設定』を押す」。実装は「登録」（付帯表4#2）
  readonly columnsLabel = "CSV出力項目"; // admin.setting.shop.csv.csv_columns

  constructor(page: Page) {
    this.page = page;
    this.csvType = page.locator("#csv-type");
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
    this.columnsCard = page.locator("#csv-form .card-header");
    this.helpArea = page.locator("#csv-form .card-body");
    this.csrfToken = page.locator('input[name="_token"]');
    this.successAlert = page.locator(".alert-success");
    // 要実機確認: default_frame のページ見出し領域（block title/sub_title の描画先）。
    // 左ナビの「システム設定」メニューと取り違えないよう見出し領域に限定する。
    this.pageTitleArea = page.locator(".c-pageTitle");
  }

  url(id: number = BaseSettingSettingShopCsvPage.CSV_TYPE_ORDER): string {
    return `/${ECCUBE_ADMIN_ROUTE}/setting/shop/csv/${id}`;
  }

  async goto(id: number = BaseSettingSettingShopCsvPage.CSV_TYPE_ORDER) {
    await this.page.goto(this.url(id));
  }

  /** 画面の主要UI部品が仕様どおり表示されること。 */
  async seeForm() {
    await expect(this.csvType).toBeVisible();
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

  /** 左リストの先頭 option を選択して「出力」ボタンで右へ移す（DOM移動のみ・保存しない）。 */
  async transferFirstToOutput() {
    const first = this.notOutputOptions.first();
    await first.evaluate((el: HTMLOptionElement) => {
      el.selected = true;
    });
    await this.addButton.click();
  }

  /** 「すべて出力」で左の全項目を右へ移す（DOM移動のみ）。 */
  async transferAllToOutput() {
    await this.addAllButton.click();
  }

  /** 「すべて解除」で右の全項目を左へ移す（DOM移動のみ）。 */
  async releaseAllToNotOutput() {
    await this.removeAllButton.click();
  }

  /** 種別セレクトを変更し、JS により当該種別IDの画面へ遷移する。 */
  async changeType(id: number) {
    await this.csvType.selectOption(String(id));
  }

  /** 「設定（登録）」を押下して保存する（POST＝破壊的・dtb_csv を更新）。 */
  async save() {
    await this.saveButton.click();
  }

  /** 成功フラッシュが表示されること（テキストの正は仕様。乖離は付帯表4参照）。 */
  async seeSaveSuccess() {
    await expect(this.successAlert).toBeVisible();
  }
}
