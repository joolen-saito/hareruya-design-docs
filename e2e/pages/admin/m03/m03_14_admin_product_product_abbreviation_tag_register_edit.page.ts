import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 略称タグ登録／編集 Page Object（m03-14_admin_product_product_abbreviation_tag_register_edit）。
 * 対象は同一Twig上の登録（新規 mtb_storage_code 作成）・編集フォームと下部一覧（表示件数・編集/削除導線）。
 * CSV出力・CSVインポートの内部処理は別機能。本POMはリンク遷移の起点のみ扱う。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-14_admin_product_product_abbreviation_tag_register_edit.md /
 * messages.ja.yaml)由来（オラクル独立性）。設計源は pf-eccube3 のリバースで、DBは ec-cube-enterprise を正典。
 * セレクタは Twig＋Symfony Form の既定 block prefix=`storage_code`（StorageCodeType に getBlockPrefix 上書きなし＝
 * クラス名 StorageCodeType→"storage_code"）由来の位置情報のみ。
 *
 * URL（StorageCodeController.php）:
 *  - GET index(新規フォーム＋一覧)  : /%route%/product/storage                         (:69)
 *  - GET index(ページ送り)          : /%route%/product/storage/page/{page_no}          (:67)
 *  - GET index(編集フォーム＋一覧)  : /%route%/product/storage/{id}                    (:68 / 不存在id→404)
 *  - GET index(編集ページ送り)      : /%route%/product/storage/{id}/page/{page_no}     (:66)
 *  - POST store(新規/更新)          : /%route%/product/storage_code/store(/{id})       (:108)
 *  - DELETE delete                  : /%route%/product/storage_code/{id}/delete        (:138)
 *  - GET export / GET csv(取込画面) : /%route%/product/storage_code/export, /csv       (:166 / :224)
 *
 * DOM id 根拠（block prefix=storage_code）:
 *  - フォーム要素 #form_storage_code（storage_code.twig:71 form action=admin_product_storage_code_store）
 *  - _token(hidden) → #storage_code__token（storage_code.twig:73 form_widget(form._token)）
 *  - name(必須) → #storage_code_name（form_widget(form.name) storage_code.twig:84 / ラベル admin.setting.shop.trade_law.header.name=「名称」 :83）
 *  - rank(必須) → #storage_code_rank（form_widget(form.rank) storage_code.twig:91 / ラベル admin.product.format.format_rank=「並び順」 :90）
 *  - alphabetSortFlg(任意) → #storage_code_alphabetSortFlg（form_widget(form.alphabetSortFlg) storage_code.twig:100）
 *  - 送信ボタン「登録」(Twig固定文言・trans非経由) type=submit form=form_storage_code（storage_code.twig:194-196）
 *  - カード見出し .card-title「新規追加」admin.common.registration__add / 「編集」admin.common.edit（storage_code.twig:77 / messages.ja.yaml:1438,1439）
 *  - 「新規登録へ戻る」admin.common.back_to_new_registration（編集時のみ storage_code.twig:57-59 / messages.ja.yaml:1455）
 *  - CSV出力リンク admin.product.csv.export=「CSV出力」（storage_code.twig:61-63 / messages.ja.yaml:2149）
 *  - CSV入力リンク admin.product.csv.import=「CSV入力」（storage_code.twig:64-66 / messages.ja.yaml:2148）
 *  - 表示件数プルダウン .js-page-count（storage_code.twig:113 許容 [10,50,100,300,500,1000]）
 *  - 一覧 table（storage_code.twig:124）/ 行 編集リンク（:139,142,151）/ 削除リンク a[data-method=delete]（:156 admin.common.delete=「削除」）
 *  - 一覧 並び順列 ラベル「アルファベット」/「コレクター番号」（storage_code.twig:148 alphabetSortFlg 表示のみ）
 *  - 成功フラッシュ admin.register.complete=「登録が完了しました。」/ admin.common.delete_complete=「削除しました」→ .alert-success（alert.twig:22）
 *  - 失敗フラッシュ admin.register.failed=「登録できませんでした。」/ admin.storage.delete.failed=「商品で使用されているため…」→ .alert-danger（alert.twig:32,42）
 */
export class ProductProductAbbreviationTagRegisterEditPage {
  readonly page: Page;
  readonly indexUrl: string; // 新規フォーム＋一覧（一覧トップ）

  readonly form: Locator; // #form_storage_code（storage_code.twig:71）
  readonly nameInput: Locator; // 名称（必須）
  readonly rankInput: Locator; // 並び順（必須・0〜32767）
  readonly alphabetCheck: Locator; // アルファベット順ソートフラグ（任意）
  readonly submitButton: Locator; // 「登録」（Twig固定文言）
  readonly cardTitle: Locator; // .card-title（新規追加 / 編集）
  readonly backToNewLink: Locator; // 「新規登録へ戻る」（編集時のみ）
  readonly csvExportLink: Locator; // 「CSV出力」
  readonly csvImportLink: Locator; // 「CSV入力」
  readonly pageCountSelect: Locator; // .js-page-count
  readonly listTable: Locator; // 一覧 table
  readonly listRows: Locator; // 一覧 tbody tr
  readonly successFlash: Locator; // .alert-success（成功フラッシュ）
  readonly errorFlash: Locator; // .alert-danger（失敗フラッシュ）

  constructor(page: Page) {
    this.page = page;
    this.indexUrl = `/${ECCUBE_ADMIN_ROUTE}/product/storage`;

    this.form = page.locator("#form_storage_code");
    this.nameInput = page.locator("#storage_code_name");
    this.rankInput = page.locator("#storage_code_rank");
    this.alphabetCheck = page.locator("#storage_code_alphabetSortFlg");
    // type=submit form=form_storage_code。文言は Twig 固定の「登録」（trans非経由＝設計確認値）。
    this.submitButton = page.getByRole("button", { name: "登録" });
    this.cardTitle = page.locator(".card-title");
    this.backToNewLink = page.getByRole("link", { name: "新規登録へ戻る" });
    this.csvExportLink = page.getByRole("link", { name: "CSV出力" });
    this.csvImportLink = page.getByRole("link", { name: "CSV入力" });
    this.pageCountSelect = page.locator(".js-page-count");
    this.listTable = page.locator("table.table");
    this.listRows = page.locator("table.table tbody tr");
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
  }

  /** 一覧トップ（新規フォーム）。 */
  async gotoIndex() {
    await this.page.goto(this.indexUrl);
  }
  /** 編集フォーム（対象 id）。不存在 id は HTTP404 を仕様とする。 */
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/storage/${id}`;
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }
  /** 一覧ページ送りルート（GET …/product/storage/page/{page_no}）。 */
  async gotoListPage(pageNo: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/storage/page/${pageNo}`);
  }
  /** 一覧で当該 id 行の編集導線（id/名称/「変更」いずれも同一 path=admin_product_storage_code_edit）。 */
  editLinkById(id: number | string): Locator {
    return this.page
      .locator(`a[href$="/product/storage/${id}"]`)
      .first();
  }
  /** 一覧で当該名称を含む行（永続化・並び順列の間接確認用）。 */
  rowByName(name: string): Locator {
    return this.listRows.filter({ hasText: name });
  }

  /** 上部フォームに名称・並び順・フラグを入力して「登録」を押下。 */
  async submitForm(opts: { name?: string; rank?: string; alphabet?: boolean }) {
    if (opts.name !== undefined) {
      await this.nameInput.fill(opts.name);
    }
    if (opts.rank !== undefined) {
      await this.rankInput.fill(opts.rank);
    }
    if (opts.alphabet) {
      await this.alphabetCheck.check();
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
    await expect(this.rankInput).toBeVisible();
    await expect(this.alphabetCheck).toBeAttached();
    await expect(this.submitButton).toBeVisible();
    await expect(this.listTable).toBeVisible();
  }
}
