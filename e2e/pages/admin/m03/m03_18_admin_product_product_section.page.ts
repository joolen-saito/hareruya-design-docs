import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 部門登録／編集 Page Object（m03-18_admin_product_product_section）。
 * 同一Twig上の上部フォーム（新規登録／編集）と下部の部門一覧（コード昇順）を対象とする。
 * CSV出力・CSV取込・削除はリンク/挙動の観測のみ（取込画面本体・CSV内容は別機能/手動）。
 * 期待結果は仕様(functions/pf-eccube3/m03-18_admin_product_product_section.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`product_department`（ProductDepartmentType、明示override無し→クラス名のsnake_case）由来の位置情報のみ。
 *
 * URL（SectionController.php）:
 *  - GET index(新規フォーム＋一覧) : /%route%/product/section            (:64)
 *  - GET edit(編集フォーム＋一覧)  : /%route%/product/section/{id}        (:63, id=\d+)
 *  - POST store(登録/更新)         : /%route%/product/section/store/{id}  (:92, id省略可)
 *  - DELETE delete               : /%route%/product/section/{id}/delete (:134)
 *  - GET export(CSV出力)          : /%route%/product/section/export      (:199)
 *  - GET csvUpload(CSV取込画面)    : /%route%/product/section/master_csv_upload (:260)
 *
 * DOM id 根拠（getBlockPrefix=product_department）:
 *  - name(必須)              → #product_department_name（form.name section.twig:66）
 *  - code(必須)              → #product_department_code（form.code section.twig:73）
 *  - tax_free_division(必須) → #product_department_tax_free_division（form.tax_free_division section.twig:80 / 選択肢0/1/2 ProductDepartmentType:64-73）
 *  - visible(任意 checkbox)  → #product_department_visible（form.visible section.twig:86）
 *  - CSRF hidden            → #product_department__token（form._token section.twig:55）
 *  - フォーム本体            → #form_section（section.twig:54）
 *  - 登録ボタン「登録」trans admin.common.registration（section.twig:155 / messages.ja.yaml:1436）
 *  - 「新規登録に戻る」link（設計書文言）= href=path('admin_product_section')（編集時のみ section.twig:39-42）。
 *    実装trans admin.common.back_to_new_registration は「新規登録へ戻る」（助詞差は付帯表4#3）。文言オラクル混入を避け btn-csv かつ /product/section 終端の href で構造特定。
 *  - CSV出力 link trans admin.product.csv.export（section.twig:44-45 / messages.ja.yaml:2149「CSV出力」）→ href で特定（文言は仕様乖離候補のため位置はhref）
 *  - CSV取込 link trans admin.product.csv.import（section.twig:47-48 / messages.ja.yaml:2148「CSV入力」）→ href で特定
 *  - 一覧テーブル            → section.twig:97（thead列: ID/部門名/部門コード/免税区分/MTGBuyer表示フラグ）
 *  - 行の編集 link「編集」trans admin.common.edit（section.twig:128-130 / messages.ja.yaml:1439）
 *  - 行の削除 link「削除」 data-method=delete data-message（section.twig:133-135 / admin.common.delete messages.ja.yaml:1444）
 *  - カード見出し card-title（新規 admin.common.registration__add / 編集 admin.common.edit、section.twig:59）
 *  - 成功フラッシュ「保存しました」admin.common.save_complete（alert.twig:22 .alert-success / messages.ja.yaml:1398 / Controller:122）
 *  - 失敗フラッシュ「登録できませんでした。」admin.register.failed（alert.twig:42 .alert-danger / messages.ja.yaml:1774 / Controller:105）
 *  - フィールドエラー .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:55）
 */
export class ProductProductSectionPage {
  readonly page: Page;
  readonly indexUrl: string;
  readonly exportUrl: string;
  readonly csvUploadUrl: string;

  readonly pageTitle: Locator; // h2「部門登録/編集」（default_frame.twig:196）
  readonly cardTitle: Locator; // 主カード見出し（section.twig:59）
  readonly formSection: Locator; // #form_section（section.twig:54）
  readonly nameInput: Locator; // 部門名（必須）
  readonly codeInput: Locator; // 部門コード（必須）
  readonly taxFreeSelect: Locator; // 免税区分（選択 0/1/2）
  readonly visibleCheck: Locator; // MTGBuyer表示フラグ（任意 checkbox）
  readonly registerButton: Locator; // 「登録」
  readonly backToNewLink: Locator; // 「新規登録に戻る」（編集時のみ・href構造特定）
  readonly csvExportLink: Locator; // CSV出力（href特定）
  readonly csvImportLink: Locator; // CSV取込（href特定）
  readonly listTable: Locator; // 部門一覧テーブル
  readonly editLinks: Locator; // 行の「編集」
  readonly deleteLinks: Locator; // 行の「削除」（data-method=delete）
  readonly successFlash: Locator; // .alert-success
  readonly errorFlash: Locator; // .alert-danger
  readonly fieldError: Locator; // .invalid-feedback

  constructor(page: Page) {
    this.page = page;
    this.indexUrl = `/${ECCUBE_ADMIN_ROUTE}/product/section`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/product/section/export`;
    this.csvUploadUrl = `/${ECCUBE_ADMIN_ROUTE}/product/section/master_csv_upload`;

    this.pageTitle = page.locator("h2.c-pageTitle__title");
    this.cardTitle = page.locator(".card-title");
    this.formSection = page.locator("#form_section");
    this.nameInput = page.locator("#product_department_name");
    this.codeInput = page.locator("#product_department_code");
    this.taxFreeSelect = page.locator("#product_department_tax_free_division");
    this.visibleCheck = page.locator("#product_department_visible");
    // 文言は trans 由来（admin.common.registration＝「登録」）。
    this.registerButton = page.getByRole("button", { name: "登録" });
    // 編集時のみ表示の「新規登録に戻る」リンク。実装/設計で文言差（に戻る/へ戻る・付帯表4#3）があるため
    // オラクル混入回避で文言ではなく href（path('admin_product_section')=…/product/section 終端）＋ btn-csv で構造特定。
    // export(/export)・import(/master_csv_upload) の btn-csv とは href 終端で区別される。
    this.backToNewLink = page.locator('a.btn-csv[href$="/product/section"]');
    // CSVボタン文言は仕様乖離候補（設計書「CSV 出力」「CSV 取込」 vs 実装「CSV出力」「CSV入力」）のため href で位置特定。
    this.csvExportLink = page.locator('a[href$="/product/section/export"]');
    this.csvImportLink = page.locator('a[href$="/product/section/master_csv_upload"]');
    this.listTable = page.locator("table");
    this.editLinks = page.getByRole("link", { name: "編集" });
    this.deleteLinks = page.locator('a[data-method="delete"]');
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
    this.fieldError = page.locator(".invalid-feedback");
  }

  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/section/${id}`;
  }

  async gotoIndex() {
    await this.page.goto(this.indexUrl);
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }
  async gotoCsvUpload() {
    await this.page.goto(this.csvUploadUrl);
  }

  /** 上部フォームへ値を入れて「登録」を押下（新規・編集共通。store POSTへ送信）。 */
  async submit(opts: { name?: string; code?: string; taxFree?: string; visible?: boolean }) {
    if (opts.name !== undefined) await this.nameInput.fill(opts.name);
    if (opts.code !== undefined) await this.codeInput.fill(opts.code);
    if (opts.taxFree !== undefined) await this.taxFreeSelect.selectOption(opts.taxFree);
    if (opts.visible !== undefined) {
      if (opts.visible) await this.visibleCheck.check();
      else await this.visibleCheck.uncheck();
    }
    await this.registerButton.click();
  }

  /** 新規フォームの入力欄が仕様どおり表示されること（4項目＋登録ボタン）。 */
  async seeNewForm() {
    await expect(this.formSection).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.codeInput).toBeVisible();
    await expect(this.taxFreeSelect).toBeVisible();
    await expect(this.visibleCheck).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 下部の部門一覧テーブルが表示されること。 */
  async seeList() {
    await expect(this.listTable).toBeVisible();
  }
}
