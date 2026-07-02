import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../config/default.config";

/**
 * 管理画面 コンテンツ管理 JavaScript管理（customize.js 編集）Page Object。
 * 期待結果は仕様(m09-06_admin_content_content_js.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Content/js.twig）。
 *
 * DOM/セレクタ根拠（js.twig）:
 *  - フォーム要素 id=content_js_form は js.twig:68 の <form> 明示 id（block prefix 由来ではない）。
 *    子フィールド id は無名ルートFormType(FormType::class／JsController.php:48)の block prefix=form 由来（#form_js / #form__token）。
 *  - コード入力 textarea #form_js（hidden、form.js／js.twig:98 form_widget(form.js)・js.twig:63 で editor 値を書戻し）
 *  - CSRFトークン form._token → #form__token（js.twig:69）
 *  - Aceエディタ領域 #editor（高さ480px／js.twig:97。JS無効textareaを覆う）
 *  - 登録ボタン #save-button trans admin.common.registration=「登録」（js.twig:122 / messages.ja.yaml:1436）
 *  - カード見出し .card-title trans admin.content.js__card_title=「JavaScript設定」（js.twig:78 / messages.ja.yaml:2738）
 *  - コードラベル trans admin.content.page_source_code=「コード」（js.twig:92 / messages.ja.yaml:2714）
 *  - 必須バッジ .badge.bg-primary trans admin.common.required=「必須」（js.twig:94 / messages.ja.yaml:12,1436近傍）
 *  - ツールチップ title=tooltip.content.js_source_code（js.twig:91 / messages.ja.yaml:3443）
 *  - 戻る導線 a.c-baseLink href=admin_content_page（js.twig:113）text=「JavaScript管理」（js.twig:115）
 *  - 見出し h2.c-pageTitle__title=「JavaScript管理」/ サブ span.c-pageTitle__subTitle=「コンテンツ管理」（default_frame.twig:196）
 *  - 入力エラー form_errors(form.js)→ .invalid-feedback（js.twig:99）
 *  - 案内メッセージ admin.common.restrict_file_upload_info（JsController.php:45 addInfoOnce / messages.ja.yaml:1602）
 *  - 保存成功 admin.common.save_complete=「保存しました」（JsController.php:63 / messages.ja.yaml:1398）
 *  - 保存失敗 admin.common.save_error=「保存に失敗しました」（JsController.php:74-75 / messages.ja.yaml:1399）
 */
export class ContentContentJsPage {
  readonly page: Page;
  readonly url: string;
  readonly backTarget: string;

  readonly pageTitle: Locator; // h2.c-pageTitle__title 「JavaScript管理」
  readonly pageSubTitle: Locator; // span.c-pageTitle__subTitle 「コンテンツ管理」
  readonly cardTitle: Locator; // .card-title 「JavaScript設定」
  readonly codeLabel: Locator; // 「コード」ラベル
  readonly requiredBadge: Locator; // .badge.bg-primary 「必須」
  readonly tooltipAnchor: Locator; // [data-bs-toggle=tooltip] title属性
  readonly editor: Locator; // #editor（Ace領域）
  readonly jsTextarea: Locator; // #form_js（hidden textarea）
  readonly form: Locator; // #content_js_form
  readonly saveButton: Locator; // #save-button 「登録」
  readonly backLink: Locator; // 戻る導線（content/page へ）
  readonly error: Locator; // .invalid-feedback

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/content/js`;
    this.backTarget = `/${ECCUBE_ADMIN_ROUTE}/content/page`;

    this.pageTitle = page.locator("h2.c-pageTitle__title");
    this.pageSubTitle = page.locator("span.c-pageTitle__subTitle");
    this.cardTitle = page.locator(".card-title");
    this.codeLabel = page.locator(".card-body").getByText("コード", { exact: true });
    this.requiredBadge = page.locator(".badge.bg-primary", { hasText: "必須" });
    this.tooltipAnchor = page.locator('[data-bs-toggle="tooltip"]');
    this.editor = page.locator("#editor");
    this.jsTextarea = page.locator("#form_js");
    this.form = page.locator("#content_js_form");
    this.saveButton = page.locator("#save-button");
    this.backLink = page.locator(`a.c-baseLink[href$="/content/page"]`);
    this.error = page.locator(".invalid-feedback");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** Aceエディタの現在値を取得する（送信前は #form_js に未反映なので Ace から読む）。 */
  async readEditorValue(): Promise<string> {
    return await this.page.evaluate(() => {
      // @ts-expect-error ace はテンプレートが読み込むグローバル
      return window.ace.edit("editor").getValue() as string;
    });
  }

  /** Aceエディタへ値を設定する（送信時に #form_js へ書き戻される）。 */
  async setEditorValue(code: string) {
    await this.page.evaluate((v) => {
      // @ts-expect-error ace はグローバル
      window.ace.edit("editor").setValue(v);
    }, code);
  }

  /** 登録ボタンを押下して送信する（submit ハンドラが editor 値を #form_js へ書戻す）。 */
  async submit() {
    await this.saveButton.click();
  }

  /** 現在のエディタ内容をそのまま登録する（冪等＝既存 customize.js を変更しない）。 */
  async submitUnchanged() {
    await this.saveButton.click();
  }

  /** JavaScript管理画面の主要UI部品が仕様どおり表示されること。 */
  async seeForm() {
    await expect(this.pageTitle).toContainText("JavaScript管理");
    await expect(this.editor).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }
}
