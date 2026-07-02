import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 コンテンツ管理 > CSS管理（M09-05）Page Object。
 * 納品ケース表 integration_test/e2e/m09_05_admin_content_content_css_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m09-05_admin_content_content_css.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * フォームは FormType::class（getBlockPrefix なし＝既定 "form"）＋フィールド `css`(TextareaType, required:false)。
 *  CssController.php:45-50。DOM id は接頭辞 form_ を付与する（css.twig:66 の $('#form_css') で確認）。
 *
 * DOM 根拠（css.twig）:
 *  - フォーム本体 #content_css_form（css.twig:71 form action=admin_content_css）
 *  - CSRFトークン hidden #form__token（css.twig:72 form._token）
 *  - 隠しtextarea(送信値) #form_css（css.twig:101 form_widget(form.css) / css.twig:66 で id 確認）
 *  - Aceエディタ表示領域 #editor（css.twig:30,100）— 送信直前に editor 値が #form_css へ同期(css.twig:65-67)
 *  - カード見出し「CSS設定」 .card-title（css.twig:81 trans admin.content.css__card_title）
 *  - 必須バッジ「必須」 .badge.bg-primary（css.twig:97 trans admin.common.required）
 *  - コード見出し+ツールチップ（css.twig:94-95 trans tooltip.content.css_source_code / admin.content.page_source_code）
 *  - 登録ボタン #save-button（css.twig:125 trans admin.common.registration="登録"）
 *  - 戻り導線リンク（css.twig:116 href=admin_content_page。表示文言は admin.content.css_management="CSS管理"だが遷移先はページ管理）
 *
 * 文言の正は仕様(設計書「表示メッセージ」)。i18n リソース値はオラクルにせず、設計書明記の文言・観測で判定する。
 *  - 成功フラッシュ「保存しました」（admin.common.save_complete / messages.ja.yaml:1398）
 *  - 失敗フラッシュ「保存に失敗しました」（admin.common.save_error / messages.ja.yaml:1399）
 *  - 情報案内「…ECCUBE_RESTRICT_FILE_UPLOAD を 1 に設定…」（admin.common.restrict_file_upload_info / messages.ja.yaml:1602）
 */
export class ContentContentCssPage {
  readonly page: Page;
  readonly url: string; // GET/POST /<route>/content/css
  readonly pageManagementUrl: string; // 戻り導線の遷移先 /<route>/content/page

  readonly form: Locator; // #content_css_form
  // 注: CSRFトークン(#form__token)の存在確認は Form 実装由来オラクル混入のため Page Object から除外（設計書「本書で扱わない」）。
  readonly hiddenCss: Locator; // #form_css (送信値を持つ隠しtextarea)
  readonly editor: Locator; // #editor (Ace表示領域)
  readonly cardTitle: Locator; // .card-title 「CSS設定」
  readonly requiredBadge: Locator; // .badge.bg-primary 「必須」
  readonly saveButton: Locator; // #save-button 「登録」
  readonly backLink: Locator; // 戻り導線リンク（href=admin_content_page）
  readonly tooltip: Locator; // コード見出しのツールチップ要素（css.twig:94 data-bs-toggle=tooltip の title 属性に文言）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/content/css`;
    this.pageManagementUrl = `/${ECCUBE_ADMIN_ROUTE}/content/page`;

    this.form = page.locator("#content_css_form");
    this.hiddenCss = page.locator("#form_css");
    this.editor = page.locator("#editor");
    this.cardTitle = page.locator(".card-title");
    this.requiredBadge = page.locator(".badge.bg-primary");
    this.saveButton = page.locator("#save-button");
    // 遷移先で位置を確定。表示文言「CSS管理」はタイトルと重複するため href で特定する。
    this.backLink = page.locator(`a[href$="/${ECCUBE_ADMIN_ROUTE}/content/page"]`);
    // ツールチップ要素。文言は title 属性に格納（css.twig:94）。設計書「表示メッセージ」のツールチップ文言を観測。
    this.tooltip = page.locator('[data-bs-toggle="tooltip"]').first();
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** Aceエディタへ値を流し込む（送信直前に #form_css へ同期される=css.twig:65-67）。 */
  async fillCode(text: string) {
    await this.page.evaluate((t) => {
      // ace はグローバル（css.twig:29-33）。表示領域 id=editor。
      // @ts-expect-error ace はページ側グローバル
      window.ace.edit("editor").setValue(t, -1);
    }, text);
  }

  /** 「登録」ボタンを押下して保存する。 */
  async submit() {
    await this.saveButton.click();
  }

  /** 送信値（隠しtextarea）の現在値を読む（保存後の間接永続化確認に使う）。 */
  async readHiddenCss(): Promise<string> {
    return await this.hiddenCss.inputValue();
  }

  /** Aceエディタの表示値を読む（保存後の初期表示=エディタへ流し込まれたことの確認に使う）。 */
  async readEditorValue(): Promise<string> {
    return await this.page.evaluate(() => {
      // @ts-expect-error ace はページ側グローバル
      return window.ace.edit("editor").getValue();
    });
  }

  /** CSS管理画面のUI部品が仕様どおり表示されること。 */
  async seeForm() {
    await expect(this.cardTitle).toContainText("CSS設定");
    await expect(this.editor).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }
}
