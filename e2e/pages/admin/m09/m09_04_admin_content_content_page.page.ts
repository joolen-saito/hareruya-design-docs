import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 コンテンツ管理 > ページ管理（M09-04）Page Object（一覧 / 新規・編集フォーム）。
 * 納品ケース表 integration_test/e2e/m09_04_admin_content_content_page_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m09-04_admin_content_content_page.md / 観点表）の挙動由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`main_edit`（MainEditType.php:278-280）由来の位置情報のみ。
 * 設計源は pf-eccube3 だが刷新先 ec-cube-enterprise（admin_content_page 系）が実在するためE2E化。乖離はケース表 付帯表4。
 *
 * DOM id / セレクタ 根拠（ec-cube-enterprise）。表示文言（i18nリソース語）はオラクル化せず、ルート/構造由来の
 * セレクタのみを使う（付帯表4 文言乖離を踏まえた独立性確保）:
 *  - 一覧 新規作成リンク href=admin_content_page_new（page.twig:33）→ `a[href*="content/page/new"]`（文言「新規作成」非依存）
 *  - 一覧 検索ボックス #search-page（page.twig:44。JS searchWord で table 行を絞り込み page.twig:21-23）
 *  - 一覧 5列ヘッダ ページ名/ルーティング名/URL/ファイル名/レイアウト名（page.twig:54-58。列構成は設計の入口節由来）
 *  - 一覧 ページ行 tr#ex-page-{id}（page.twig:62）／ページ名編集リンク admin_content_page_edit（page.twig:64）
 *  - 一覧 削除アイコン（EDIT_TYPE_USER のときのみ） data-bs-target #delete_{id}（page.twig:97）／削除確定 a data-method=delete（page.twig:116-117）
 *  - フォーム #content_page_form（page_edit.twig:96）／csrf #main_edit__token（page_edit.twig:98）
 *  - 名称 #main_edit_name（page_edit.twig:130）／URL #main_edit_url（page_edit.twig:149）／ファイル名 #main_edit_file_name（page_edit.twig:184）
 *  - 任意メタ項目（設計 入力項目表 author/description/keyword/robots/追加metaタグ）: getBlockPrefix=main_edit 由来で
 *    #main_edit_author / #main_edit_description / #main_edit_keyword / #main_edit_meta_robots / #main_edit_meta_tags（MainEditType.php:92-134）
 *  - 本文 hidden textarea #main_edit_tpl_data ＋ ACE エディタ #editor（page_edit.twig:205-206、送信時同期 page_edit.twig:69-71）
 *  - 登録ボタン: フォーム内 submit `#content_page_form button[type="submit"]`（page_edit.twig:366。文言「登録」非依存）
 *  - フィールドエラー .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:53-55。構造クラス＝サーバ側検証時のみ描画）
 */
export class ContentContentPagePage {
  readonly page: Page;
  readonly listUrl: string; // ページ管理一覧
  readonly newUrl: string; // 新規作成フォーム

  // 一覧
  readonly createNewButton: Locator; // 新規作成リンク
  readonly searchBox: Locator; // #search-page（クライアント側フィルタ）
  readonly listRows: Locator; // table tbody の各ページ行
  readonly pageNameLinks: Locator; // 一覧のページ名→編集リンク

  // フォーム（新規・編集 共通 id）
  readonly nameInput: Locator; // #main_edit_name
  readonly urlInput: Locator; // #main_edit_url
  readonly fileNameInput: Locator; // #main_edit_file_name
  readonly authorInput: Locator; // #main_edit_author（任意メタ）
  readonly descriptionInput: Locator; // #main_edit_description（任意メタ）
  readonly keywordInput: Locator; // #main_edit_keyword（任意メタ）
  readonly metaRobotsInput: Locator; // #main_edit_meta_robots（任意メタ robots）
  readonly metaTagsInput: Locator; // #main_edit_meta_tags（任意 追加metaタグ）
  readonly tplDataHidden: Locator; // #main_edit_tpl_data（hidden、ACEで保持）
  readonly aceEditor: Locator; // #editor
  readonly registerButton: Locator; // 登録ボタン（フォーム内 submit）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/content/page`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/content/page/new`;

    // 文言非依存（ルート由来）の構造セレクタ。href は admin_content_page_new で末尾 content/page/new。
    this.createNewButton = page.locator('a[href*="content/page/new"]');
    this.searchBox = page.locator("#search-page");
    this.listRows = page.locator("table.table tbody tr");
    this.pageNameLinks = page.locator('table.table tbody tr td:first-child a');

    this.nameInput = page.locator("#main_edit_name");
    this.urlInput = page.locator("#main_edit_url");
    this.fileNameInput = page.locator("#main_edit_file_name");
    this.authorInput = page.locator("#main_edit_author");
    this.descriptionInput = page.locator("#main_edit_description");
    this.keywordInput = page.locator("#main_edit_keyword");
    this.metaRobotsInput = page.locator("#main_edit_meta_robots");
    this.metaTagsInput = page.locator("#main_edit_meta_tags");
    this.tplDataHidden = page.locator("#main_edit_tpl_data");
    this.aceEditor = page.locator("#editor");
    // 文言非依存（フォーム内 submit）。「登録」i18n語をオラクル化しない。
    this.registerButton = page.locator('#content_page_form button[type="submit"]');
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }
  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/page/${id}/edit`);
  }

  /** 一覧の主要UI部品（新規作成・検索・5列ヘッダ）が仕様どおり表示されること。 */
  async seeListUi() {
    await expect(this.createNewButton).toBeVisible();
    await expect(this.searchBox).toBeVisible();
    // 5列ヘッダ（文言は i18n 由来＝位置確認のみ、合否は仕様の列構成）
    const headers = this.page.locator("table.table thead th");
    await expect(headers.nth(0)).toContainText("ページ名");
    await expect(headers.nth(1)).toContainText("ルーティング名");
    await expect(headers.nth(2)).toContainText("URL");
    await expect(headers.nth(3)).toContainText("ファイル名");
    await expect(headers.nth(4)).toContainText("レイアウト名");
  }

  /** 新規/編集フォームの主要部品が表示されること（名称・URL・ファイル名・本文・登録）。 */
  async seeFormParts() {
    await expect(this.nameInput).toBeVisible();
    await expect(this.aceEditor).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /**
   * 設計 入力項目表が定める任意メタ項目（author/description/keyword/robots/追加metaタグ）が
   * フォームに存在すること。値の検証は行わず存在のみ（任意項目＝Length 制約のみ）。
   */
  async seeMetaFields() {
    await expect(this.authorInput).toBeVisible();
    await expect(this.descriptionInput).toBeVisible();
    await expect(this.keywordInput).toBeVisible();
    await expect(this.metaRobotsInput).toBeVisible();
    await expect(this.metaTagsInput).toBeVisible();
  }

  /** 一覧の検索ボックスへ語を入力（JS searchWord による行フィルタを発火）。 */
  async typeSearch(word: string) {
    await this.searchBox.fill(word);
  }

  /**
   * 本文（tpl_data）を ACE エディタへ設定する。要実機確認（ACE グローバルの取得可否は環境依存）。
   * 送信時に #content_page_form の submit ハンドラが editor.getValue() を hidden textarea へ同期する。
   */
  async setTplData(value: string) {
    await this.page.evaluate((val) => {
      // @ts-ignore ACE はテンプレートでロードされるグローバル
      const ed = (window as any).ace?.edit("editor");
      if (ed) {
        ed.setValue(val, -1);
      }
    }, value);
  }

  /** 新規/編集フォームを送信。 */
  async submit() {
    await this.registerButton.click();
  }

  /** 指定フィールドの直近フィールドエラー（.invalid-feedback）。 */
  fieldError(field: Locator): Locator {
    // フィールドと同じ列ブロック内の .invalid-feedback を探す（horizontal layout）。
    return field.locator("xpath=ancestor::div[contains(@class,'col')][1]").locator(".invalid-feedback");
  }
}
