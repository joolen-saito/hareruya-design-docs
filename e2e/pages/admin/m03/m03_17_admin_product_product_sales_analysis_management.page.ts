import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 売上分析タグ登録/編集 Page Object（m03-17_admin_product_product_sales_analysis_management）。
 * 同一Twig上に「登録/編集フォーム（上半分・名称/並び順の2欄）」＋「一覧・表示件数・ページャ・編集/削除（下半分）」を配置する CRUD 画面。
 * 期待結果は仕様(functions/pf-eccube3/m03-17_admin_product_product_sales_analysis_management.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form のブロックプレフィックス `tag_sales_analysis`（TagSalesAnalysisType は getBlockPrefix() 未定義のため
 * Symfony 既定＝クラス名 TagSalesAnalysis のスネーク化由来。TagSalesAnalysisType.php:28-65）の位置情報のみ。
 * Form/Type の制約値(NotBlank/Length=64/Range=1..65535)・検証文言は期待結果に流用しない（制約の正は設計書・観点表）。
 *
 * URL（TagSalesAnalysisController.php）:
 *  - GET 新規(空フォーム＋一覧)  : /%route%/product/tag_sales_analysis                     (Controller.php:54)
 *  - GET 編集(当該行＋一覧)      : /%route%/product/tag_sales_analysis/{id}                (Controller.php:53)
 *  - GET ページ(新規時)         : /%route%/product/tag_sales_analysis/page/{page_no}      (Controller.php:52)
 *  - GET ページ(編集時)         : /%route%/product/tag_sales_analysis/{id}/page/{page_no} (Controller.php:51)
 *  - POST 登録/更新             : /%route%/product/tag_sales_analysis/store(/{id})        (Controller.php:93)
 *  - DELETE 削除                : /%route%/product/tag_sales_analysis/{id}/delete         (Controller.php:151 isTokenValid()=CSRF必須 :154)
 *
 * DOM id 根拠（ブロックプレフィックス=tag_sales_analysis。Symfony 既定のクラス名由来。送信キー tag_sales_analysis[name]/[rank] は設計書「入力項目」と一致）:
 *  - name(必須・最大64) → #tag_sales_analysis_name（form_widget(form.name) tag_sales_analysis.twig:66 / label form.name.vars.label tag_sales_analysis.twig:65）
 *  - rank(必須・整数) → #tag_sales_analysis_rank（form_widget(form.rank) tag_sales_analysis.twig:73 / IntegerType=input[type=number] attr min/max TagSalesAnalysisType.php:52-54）
 *  - CSRF → #tag_sales_analysis__token（form_widget(form._token) tag_sales_analysis.twig:55）
 *  - 上半分フォーム要素 #form_tag_sales_analysis（tag_sales_analysis.twig:54 action は id 有無で store / store/{id} 切替。Controller.php:93）
 *  - カード見出し h4.card-title：新規=admin.common.registration__add「新規追加」(messages.ja.yaml:1438)／編集=admin.common.edit「編集」(:1439)（tag_sales_analysis.twig:59）
 *  - 送信ボタン「登録」trans admin.common.registration（tag_sales_analysis.twig:160-161 type=submit form=form_tag_sales_analysis / messages.ja.yaml:1436）
 *  - 表示件数セレクト .js-page-count（tag_sales_analysis.twig:85 選択肢10/50/100/300/500/1000/2000/10000/12000。change で page_count クエリ付与しフル遷移 :37-44）
 *  - 一覧テーブル table.table-striped（tag_sales_analysis.twig:95）／ヘッダ ID(admin.common.id messages.ja.yaml:1612)／名称(form.name.vars.label)／並び順(form.rank.vars.label)（:98-100）
 *  - 一覧行 編集リンク a[href$="/tag_sales_analysis/{id}"]（admin.common.edit「編集」 tag_sales_analysis.twig:118-120 / messages.ja.yaml:1439）
 *  - 一覧行 削除リンク a[data-method="delete"]（data-message=admin.common.delete_modal__message「…「%name%」を削除してよろしいですか？」 tag_sales_analysis.twig:123 / messages.ja.yaml:1593）
 *  - フィールド検証エラー .invalid-feedback（form_errors → bootstrap_4_horizontal_layout.html.twig:55。rootform時は .alert-danger）
 *  - 成功フラッシュ .alert-success「登録が完了しました。」(admin.register.complete messages.ja.yaml:1773 / Controller.php:138) / 削除完了「削除しました」(admin.common.delete_complete :1400 / Controller.php:176)（alert.twig:22）
 *  - 失敗/エラー フラッシュ .alert-danger（登録できませんでした。 admin.register.failed :1774 / Controller.php:109 ・ 値が重複しています。 admin.error.non_unique :1777 / Controller.php:126 ・ 商品/購入済 削除拒否 admin.tag.delete.failed :1423 / admin.order_tag.delete.failed :1424 / Controller.php:158,167）（alert.twig:32,42）
 */
export class ProductProductSalesAnalysisManagementPage {
  readonly page: Page;
  readonly newUrl: string; // 新規（空フォーム＋一覧）

  readonly formEl: Locator; // #form_tag_sales_analysis
  readonly cardTitle: Locator; // h4.card-title（新規追加/編集）
  readonly nameInput: Locator; // 名称 必須・最大64
  readonly rankInput: Locator; // 並び順 必須・整数1..65535（input[type=number]）
  readonly registerButton: Locator; // 「登録」
  readonly pageCountSelect: Locator; // 表示件数セレクト
  readonly listTable: Locator; // 一覧テーブル
  readonly listRows: Locator; // 一覧行
  readonly editLinks: Locator; // 一覧の編集リンク
  readonly deleteLinks: Locator; // 一覧の削除リンク（data-method=delete）
  readonly fieldError: Locator; // .invalid-feedback（フィールド検証エラー）
  readonly flashSuccess: Locator; // .alert-success（成功フラッシュ）
  readonly flashDanger: Locator; // .alert-danger（失敗・重複・削除拒否フラッシュ）

  constructor(page: Page) {
    this.page = page;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis`;

    this.formEl = page.locator("#form_tag_sales_analysis");
    this.cardTitle = page.locator("#form_tag_sales_analysis h4.card-title");
    this.nameInput = page.locator("#tag_sales_analysis_name");
    this.rankInput = page.locator("#tag_sales_analysis_rank");
    // 送信ボタンは type=submit form="form_tag_sales_analysis"。文言は trans admin.common.registration 由来（仕様）。
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.pageCountSelect = page.locator(".js-page-count");
    this.listTable = page.locator("table.table-striped");
    this.listRows = page.locator("table.table-striped tbody tr");
    this.editLinks = page.locator('a[href*="/product/tag_sales_analysis/"]:not([data-method])');
    this.deleteLinks = page.locator('a[data-method="delete"]');
    this.fieldError = page.locator(".invalid-feedback");
    this.flashSuccess = page.locator(".alert-success");
    this.flashDanger = page.locator(".alert-danger");
  }

  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/${id}`;
  }
  pageUrl(pageNo: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/page/${pageNo}`;
  }

  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  /** 一覧から当該行の「編集」リンクを実クリックして編集モードへ遷移する（操作起点の確認）。 */
  async clickEditLink(id: number | string) {
    const link = this.listTable.locator(`a[href$="/tag_sales_analysis/${id}"]`);
    await link.first().click();
  }

  /** 名称・並び順を入力して「登録」を押下。空文字を渡した欄は未入力扱い（HTML5 required の挙動は実機で確認）。 */
  async submit(name: string, rank: string) {
    if (name !== undefined) await this.nameInput.fill(name);
    if (rank !== undefined) await this.rankInput.fill(rank);
    await this.registerButton.click();
  }

  /** 新規フォームの必須UI部品（名称・並び順・登録）が仕様どおり表示されること。 */
  async seeForm() {
    await expect(this.formEl).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.rankInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 一覧領域（テーブル・表示件数セレクト）が仕様どおり表示されること。 */
  async seeList() {
    await expect(this.listTable).toBeVisible();
    await expect(this.pageCountSelect).toBeVisible();
  }
}
