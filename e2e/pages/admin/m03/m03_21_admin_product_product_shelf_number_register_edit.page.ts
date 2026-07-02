import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 棚番号登録/編集 Page Object（m03-21_admin_product_product_shelf_number_register_edit）。
 * 対象は同一Twig上の登録（新規 dtb_shelf_number 作成）・編集フォームと下部一覧（表示件数・編集/削除導線・CSV導線）。
 * CSV出力・CSV取込の内部処理は別機能。本POMはリンク遷移／ダウンロード発火の起点のみ扱う。
 *
 * 期待結果は仕様(設計書 functions/pf-eccube3/m03-21_admin_product_product_shelf_number_register_edit.md /
 * 観点表 integration-test-viewpoints.md / messages.ja.yaml)由来（オラクル独立性）。設計源は pf-eccube3 の
 * リバースで、刷新先 ec-cube-enterprise との乖離は付帯表4（不具合候補）に分離する。DBは ec-cube-enterprise を正典。
 * セレクタは Twig＋Symfony Form の既定 block prefix=`shelf_number`（ShelfNumberType に getBlockPrefix 上書きなし＝
 * クラス名 ShelfNumberType→"shelf_number"）由来の位置情報のみ。
 *
 * URL（ShelfNumberController.php）:
 *  - GET index(新規フォーム＋一覧)  : /%route%/product/shelf_number                       (:71)
 *  - GET index(ページ送り 新規)     : /%route%/product/shelf_number/page/{page_no}        (:69)
 *  - GET index(編集フォーム＋一覧)  : /%route%/product/shelf_number/{id}                  (:70 / 不存在id→404)
 *  - GET index(編集ページ送り)      : /%route%/product/shelf_number/{id}/page/{page_no}   (:68)
 *  - POST store(新規/更新)          : /%route%/product/shelf_number/store(/{id})          (:109)
 *  - DELETE delete                  : /%route%/product/shelf_number/{id}/delete           (:160)
 *  - GET export                     : /%route%/product/shelf_number/export                (:201)
 *  - GET csv(取込画面)              : /%route%/product/shelf_number/master_csv_upload     (:247)
 *  - GET csv(取込画面・後方互換)    : /%route%/product/shelf_number/csv                   (:248)
 *
 * DOM id 根拠（block prefix=shelf_number）:
 *  - フォーム要素 #form_storage_code（shelf_number.twig:71 form action=admin_product_shelf_number_store。id文言は流用）
 *  - _token(hidden) → #shelf_number__token（shelf_number.twig:72 form_widget(form._token)）
 *  - name(必須・Regex ^[A-Z][-][0-9]{3}$) → #shelf_number_name（form_widget(form.name) shelf_number.twig:86 /
 *    ラベル admin.setting.shop.trade_law.header.name=「名称」 :85 / messages.ja.yaml:2874）
 *  - sortNo(必須・整数) → #shelf_number_sortNo（form_widget(form.sortNo) shelf_number.twig:93 /
 *    ラベル admin.product.format.format_rank=「並び順」 :92 / messages.ja.yaml:4002）
 *  - 送信ボタン「登録」trans admin.common.registration（shelf_number.twig:180-182 / messages.ja.yaml:1436）type=submit form=form_storage_code
 *  - カード見出し .card-title 「新規追加」admin.common.registration__add / 「編集」admin.common.edit（shelf_number.twig:79 / messages.ja.yaml:1438,1439）
 *  - 「新規登録へ戻る」admin.common.back_to_new_registration（編集時のみ shelf_number.twig:57-59 / messages.ja.yaml:1455）
 *  - CSV出力リンク admin.product.csv.export=「CSV出力」（shelf_number.twig:61-63 / messages.ja.yaml:2149）
 *  - CSV入力リンク admin.product.csv.import=「CSV入力」（shelf_number.twig:64-66 / messages.ja.yaml:2148）
 *  - 表示件数プルダウン .js-page-count（shelf_number.twig:105 許容 [10,50,100,300,500,1000,2000,10000,12000]）
 *  - 一覧 table.table（shelf_number.twig:115）/ 行 編集リンク（:138-140 admin.common.edit=「編集」）
 *  - 一覧 削除リンク a[data-method=delete]（:143-145 admin.common.delete=「削除」/ data-message=admin.common.delete_modal__message）
 *  - 並び順列セル（shelf_number.twig:134-136 shelfNumber.sortNo）
 *  - 成功フラッシュ admin.register.complete=「登録が完了しました。」/ admin.common.delete_complete=「削除しました」→ .alert-success
 *  - 失敗フラッシュ admin.register.failed=「登録できませんでした。」/ admin.error.non_unique=「値が重複しています。」/
 *    admin.shelf_number.delete.failed=「商品で使用されているため…」→ .alert-danger
 *  - 名称フィールドエラー（Regex）→ form_errors(form.name)（shelf_number.twig:87）。出力クラスは要実機のため本文テキストで確認する。
 */
export class ProductProductShelfNumberRegisterEditPage {
  readonly page: Page;
  readonly indexUrl: string; // 新規フォーム＋一覧（一覧トップ）
  readonly exportUrl: string; // CSV出力
  readonly csvUploadUrl: string; // CSV取込画面（master_csv_upload）
  readonly csvCompatUrl: string; // CSV取込画面（後方互換 /csv）

  readonly form: Locator; // #form_storage_code（shelf_number.twig:71）
  readonly nameInput: Locator; // 名称（必須・Regex）
  readonly sortNoInput: Locator; // 並び順（必須・整数）
  readonly submitButton: Locator; // 「登録」trans admin.common.registration
  readonly cardTitle: Locator; // .card-title（新規追加 / 編集）
  readonly backToNewLink: Locator; // 「新規登録へ戻る」（編集時のみ）
  readonly csvExportLink: Locator; // 「CSV出力」
  readonly csvImportLink: Locator; // 「CSV入力」
  readonly pageCountSelect: Locator; // .js-page-count
  readonly listTable: Locator; // 一覧 table
  readonly listRows: Locator; // 一覧 tbody tr
  readonly editLinks: Locator; // 一覧 編集リンク（行→ /product/shelf_number/{id}）
  readonly deleteLinks: Locator; // 一覧 削除リンク a[data-method=delete]
  readonly successFlash: Locator; // .alert-success（成功フラッシュ）
  readonly errorFlash: Locator; // .alert-danger（失敗フラッシュ）

  constructor(page: Page) {
    this.page = page;
    this.indexUrl = `/${ECCUBE_ADMIN_ROUTE}/product/shelf_number`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/product/shelf_number/export`;
    this.csvUploadUrl = `/${ECCUBE_ADMIN_ROUTE}/product/shelf_number/master_csv_upload`;
    this.csvCompatUrl = `/${ECCUBE_ADMIN_ROUTE}/product/shelf_number/csv`;

    this.form = page.locator("#form_storage_code");
    this.nameInput = page.locator("#shelf_number_name");
    this.sortNoInput = page.locator("#shelf_number_sortNo");
    this.submitButton = page.getByRole("button", { name: "登録" });
    this.cardTitle = page.locator(".card-title");
    this.backToNewLink = page.getByRole("link", { name: "新規登録へ戻る" });
    this.csvExportLink = page.getByRole("link", { name: "CSV出力" });
    this.csvImportLink = page.getByRole("link", { name: "CSV入力" });
    this.pageCountSelect = page.locator(".js-page-count");
    this.listTable = page.locator("table.table");
    this.listRows = page.locator("table.table tbody tr");
    // 行内の編集導線（admin.common.edit=「編集」リンク。shelf_number.twig:138-140）。
    this.editLinks = page.locator("table.table tbody tr").getByRole("link", { name: "編集" });
    this.deleteLinks = page.locator('a[data-method="delete"]');
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
  }

  /** 一覧トップ（新規フォーム）。 */
  async gotoIndex() {
    await this.page.goto(this.indexUrl);
  }
  /** 編集フォーム（対象 id）。不存在 id は HTTP404 を仕様とする。 */
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/shelf_number/${id}`;
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  /** 上部フォームに名称・並び順を入力して「登録」を押下。 */
  async submitForm(opts: { name?: string; sortNo?: string }) {
    if (opts.name !== undefined) {
      await this.nameInput.fill(opts.name);
    }
    if (opts.sortNo !== undefined) {
      await this.sortNoInput.fill(opts.sortNo);
    }
    await this.submitButton.click();
  }

  /** 表示件数プルダウンで件数を選び、page_count クエリ付きで再読込させる。 */
  async changePageCount(count: string) {
    await this.pageCountSelect.selectOption(count);
  }

  /** 新規登録フォームのUI部品が仕様どおり表示されること（上部フォーム＋下部一覧）。 */
  async seeRegisterForm() {
    await expect(this.form).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.sortNoInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.listTable).toBeVisible();
  }
}
