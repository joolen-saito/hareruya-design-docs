import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 タグ登録/編集 Page Object（m03-13_admin_product_product_tag）。
 * 同一Twig上に「登録/編集フォーム（上半分）」＋「タグ一覧・表示件数・ページャ（下半分）」を配置する画面。
 * 期待結果は仕様(functions/pf-eccube3/m03-13_admin_product_product_tag.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form のブロックプレフィックス `tag`（TagType は getBlockPrefix() を未定義のため
 * Symfony 既定＝クラス名 Tag のスネーク化由来。TagType.php:29）の位置情報のみ。制約値・検証文言は期待結果に流用しない。
 *
 * URL（TagController.php）:
 *  - GET 新規(空フォーム＋一覧)  : /%route%/product/tag                       (TagController.php:64)
 *  - GET 編集(当該タグ＋一覧)    : /%route%/product/tag/{id}                  (:63)
 *  - GET ページ(新規時)         : /%route%/product/tag/page/{page_no}        (:62)
 *  - GET ページ(編集時)         : /%route%/product/tag/{id}/page/{page_no}   (:61)
 *  - POST 登録/更新             : /%route%/product/tag/store(/{id})          (:104)
 *  - DELETE 削除                : /%route%/product/tag/{id}/delete           (:165)
 *
 * DOM id 根拠（ブロックプレフィックス=tag。Symfony 既定のクラス名由来）:
 *  - name(必須) → #tag_name（form_widget(form.name) tag.twig:83 / label tag.twig:81-82）
 *  - nameEn(必須) → #tag_nameEn（tag.twig:89）
 *  - sortNo(必須・整数) → #tag_sortNo（tag.twig:95）
 *  - freeAreaJp/freeAreaEn → #tag_freeAreaJp/#tag_freeAreaEn（折りたたみ内 form_row tag.twig:118,121）
 *  - priorityProducts(任意) → #tag_priorityProducts（tag.twig:124 placeholder「商品コード(product_code)を改行区切りで入力」TagType.php:100）
 *  - titleJp/descriptionJp/titleEn/descriptionEn → #tag_titleJp 等（tag.twig:127-136）
 *  - hideNormalProductsFlg → #tag_hideNormalProductsFlg（TagType.php:103-111。当Twigでは form_row されず画面に出ない＝不具合候補#1）
 *  - CSRF → #tag__token（form_widget(form._token) tag.twig:65）
 *  - 上半分フォーム要素 #add_new_product_tag（tag.twig:63）
 *  - カード見出し h3.card-title：新規=admin.common.registration__add「新規追加」(messages.ja.yaml:1438)／編集=admin.common.edit「編集」(:1439)（tag.twig:73-75）
 *  - 送信ボタン「登録」trans admin.common.registration（tag.twig:226-227 type=submit form=add_new_product_tag / messages.ja.yaml:1436）
 *  - 表示件数セレクト .js-page-count（tag.twig:149 選択肢10/50/100/300/500/1000/2000/10000/12000）
 *  - 一覧テーブル table.table（tag.twig:159）／一覧行 tr.sortable-item（tag.twig:171）／編集リンク btn-ec-conversion「編集」(tag.twig:186-189)
 *  - 一覧ヘッダ ID(admin.common.id messages.ja.yaml:1612)／名称(日)(admin.product.tag.name_ja :1972)／名称(英)(:1973)／並び順(admin.common.sort_order :1670)
 *  - フィールドエラー .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:55）
 *  - 成功フラッシュ .alert-success「登録が完了しました。」(admin.register.complete messages.ja.yaml:1773 / Controller.php:150)
 *  - 失敗フラッシュ .alert-danger「登録できませんでした。」(admin.register.failed :1774 / Controller.php:120)
 *  - 優先コード解決失敗 .alert-danger（admin.error.not_exist_code :1422 / TagStoreAction.php:62）
 *  - タグ削除拒否 .alert-danger（admin.tag.delete.failed :1423 / Controller.php:172）
 */
export class ProductProductTagPage {
  readonly page: Page;
  readonly newUrl: string; // 新規（空フォーム＋一覧）

  readonly formEl: Locator; // #add_new_product_tag
  readonly cardTitle: Locator; // h3.card-title（新規追加/編集）
  readonly nameInput: Locator; // 名称(日) 必須
  readonly nameEnInput: Locator; // 名称(英) 必須
  readonly sortNoInput: Locator; // 並び順 必須・整数
  readonly freeAreaJpInput: Locator; // フリーエリア(日)（任意）
  readonly freeAreaEnInput: Locator; // フリーエリア(英)（任意）
  readonly priorityProductsInput: Locator; // 優先表示商品（任意・改行区切り）
  readonly titleJpInput: Locator; // タイトル(日)
  readonly titleEnInput: Locator; // タイトル(英)
  readonly descriptionJpInput: Locator; // 説明(日)
  readonly descriptionEnInput: Locator; // 説明(英)
  readonly hideNormalFlg: Locator; // hideNormalProductsFlg（当画面には出ない想定＝不具合候補#1）
  readonly accordionToggle: Locator; // 「その他の設定 (クリックで展開)」
  readonly registerButton: Locator; // 「登録」
  readonly pageCountSelect: Locator; // 表示件数セレクト
  readonly pageCountOptions: Locator; // 表示件数セレクトの選択肢（設計: 10/50/100/300/500/1000/2000/10000/12000）
  readonly listTable: Locator; // 一覧テーブル
  readonly listRows: Locator; // 一覧行
  readonly sortNoCells: Locator; // 一覧の「並び順」列セル（tag.twig:181 sort_no 表示）
  readonly editLinks: Locator; // 一覧の編集リンク
  readonly fieldError: Locator; // .invalid-feedback（フィールド検証エラー）
  readonly flashSuccess: Locator; // .alert-success（成功フラッシュ）
  readonly flashDanger: Locator; // .alert-danger（失敗・例外フラッシュ）

  constructor(page: Page) {
    this.page = page;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/product/tag`;

    this.formEl = page.locator("#add_new_product_tag");
    this.cardTitle = page.locator("#add_new_product_tag h3.card-title");
    this.nameInput = page.locator("#tag_name");
    this.nameEnInput = page.locator("#tag_nameEn");
    this.sortNoInput = page.locator("#tag_sortNo");
    this.freeAreaJpInput = page.locator("#tag_freeAreaJp");
    this.freeAreaEnInput = page.locator("#tag_freeAreaEn");
    this.priorityProductsInput = page.locator("#tag_priorityProducts");
    this.titleJpInput = page.locator("#tag_titleJp");
    this.titleEnInput = page.locator("#tag_titleEn");
    this.descriptionJpInput = page.locator("#tag_descriptionJp");
    this.descriptionEnInput = page.locator("#tag_descriptionEn");
    this.hideNormalFlg = page.locator("#tag_hideNormalProductsFlg");
    this.accordionToggle = page.locator(".accordion-toggle");
    // 送信ボタンは type=submit form="add_new_product_tag"。文言は trans admin.common.registration 由来（仕様）。
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.pageCountSelect = page.locator(".js-page-count");
    this.pageCountOptions = this.pageCountSelect.locator("option");
    this.listTable = page.locator("table.table");
    this.listRows = page.locator("tr.sortable-item");
    // 並び順は一覧行の第4列（ID・名称(日)・名称(英)・並び順・編集 の順。tag.twig:161-191）。
    this.sortNoCells = page.locator("tr.sortable-item td:nth-child(4)");
    this.editLinks = page.locator("tr.sortable-item a.btn-ec-conversion");
    this.fieldError = page.locator(".invalid-feedback");
    this.flashSuccess = page.locator(".alert-success");
    this.flashDanger = page.locator(".alert-danger");
  }

  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/tag/${id}`;
  }
  pageUrl(pageNo: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/tag/page/${pageNo}`;
  }

  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  /** 一覧から当該タグ行の「編集」リンクを実クリックして編集モードへ遷移する（操作起点の確認）。 */
  async clickEditLink(id: number | string) {
    const link = this.listTable.locator(`a.btn-ec-conversion[href$="/product/tag/${id}"]`);
    await link.first().click();
  }

  /** 必須3項目（名称日・名称英・並び順）を入力して「登録」を押下。空文字を渡した欄は未入力扱い。 */
  async submitRequired(name: string, nameEn: string, sortNo: string) {
    if (name !== undefined) await this.nameInput.fill(name);
    if (nameEn !== undefined) await this.nameEnInput.fill(nameEn);
    if (sortNo !== undefined) await this.sortNoInput.fill(sortNo);
    await this.registerButton.click();
  }

  /** 新規フォームの必須UI部品が仕様どおり表示されること。 */
  async seeForm() {
    await expect(this.formEl).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.nameEnInput).toBeVisible();
    await expect(this.sortNoInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 一覧領域（テーブル・表示件数セレクト）が仕様どおり表示されること。 */
  async seeList() {
    await expect(this.listTable).toBeVisible();
    await expect(this.pageCountSelect).toBeVisible();
  }
}
