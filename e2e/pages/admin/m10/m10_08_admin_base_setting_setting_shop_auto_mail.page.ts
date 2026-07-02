import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 — 自動送信メールテンプレート編集 Page Object。
 * 画面タイプ: edit（register_edit/crud。テンプレ選択セレクト＋名称・件名・ヘッダー・フッターの更新）。
 *
 * 期待結果（合否）は仕様（正本md functions/pf-eccube3/m10-08_admin_base_setting_setting_shop_auto_mail.md・
 * 観点表 integration-test-viewpoints.md）由来とする（オラクル独立性）。本ファイルが実装から取るのは
 * セレクタ（位置情報）のみであり、必須/最大長/制約は期待結果に流用しない。
 * 設計源は pf-eccube3（旧システムのリバース）であり、刷新先 ec-cube-enterprise との乖離は
 * ケース表の不具合候補表に出す（ラベル文言・404条件・null行POST・名称必須/最大長 等）。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src 基準）:
 *  - ルート: admin_mall_auto_mail = /%admin_route%/mall/auto_mail（GET/POST）/
 *    admin_mall_auto_mail_edit = /%admin_route%/mall/auto_mail/{Mail}（GET/POST）
 *    （MallAutoMailController.php:48-49）。
 *  - フォームDOM id は Symfony Form の getBlockPrefix='mail'（AutoMailType.php:104-107）由来。
 *    template→#mail_template（detail.twig:24 name="mail[template]" で確定） /
 *    name→#mail_name / mail_subject→#mail_mail_subject / header→#mail_header /
 *    footer→#mail_footer / tpl_data→#mail_tpl_data / _token→#mail__token。
 *  - テンプレ選択候補は isAutoSend=SEND_AUTO の行のみ・id昇順（AutoMailType.php:49-54）。
 *    選択変更で location.href により /mall/auto_mail/{id} へ遷移（detail.twig:30-37）。
 *  - 名称・件名・ヘッダー・フッター・登録ボタンは {% if Mail and Mail.id %} の編集状態でのみ描画
 *    （detail.twig:71,167-171）。識別子なし初期表示はテンプレ選択のみ。
 *  - メイン見出し card-title trans admin.setting.shop.mail.mail_template_edit（detail.twig:58 /
 *    messages.ja.yaml:2933）。件名必須バッジ admin.common.required（detail.twig:92）。
 *  - 登録ボタン trans admin.common.registration（detail.twig:169 / messages.ja.yaml:1436）。
 *  - 成功メッセージ admin.common.save_complete（MallAutoMailController.php:104 / messages.ja.yaml:1398）。
 */
export class BaseSettingSettingShopAutoMailPage {
  readonly page: Page;
  readonly url: string; // 識別子なし初期表示（テンプレ選択のみ）

  readonly templateSelect: Locator; // #mail_template（detail.twig:24）
  readonly name: Locator; // #mail_name（編集状態のみ）
  readonly mailSubject: Locator; // #mail_mail_subject（編集状態のみ）
  readonly header: Locator; // #mail_header
  readonly footer: Locator; // #mail_footer
  readonly tplData: Locator; // #mail_tpl_data 本文プレビューボックス（detail.twig:113-117）
  readonly token: Locator; // #mail__token（detail.twig:53）
  readonly registerButton: Locator; // button[type=submit] trans 登録（detail.twig:169）
  readonly cardTitle: Locator; // .card-title メイン見出し（detail.twig:58）
  readonly subjectRequiredBadge: Locator; // 件名の必須バッジ（detail.twig:92）
  readonly subjectError: Locator; // 件名行のフォームエラー .invalid-feedback（detail.twig:95）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/mall/auto_mail`;

    this.templateSelect = page.locator("#mail_template");
    this.name = page.locator("#mail_name");
    this.mailSubject = page.locator("#mail_mail_subject");
    this.header = page.locator("#mail_header");
    this.footer = page.locator("#mail_footer");
    this.tplData = page.locator("#mail_tpl_data");
    this.token = page.locator("#mail__token");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.cardTitle = page.locator(".card-title");
    // 件名行の必須バッジ（detail.twig:92 の .badge）。名称側バッジは仕様(任意)と乖離のため対象にしない。
    this.subjectRequiredBadge = page
      .locator(".row", { has: page.locator("#mail_mail_subject") })
      .locator(".badge");
    // 件名行のフォームエラー（detail.twig:95 form_errors → .invalid-feedback）。
    // 必須エラーの「文言」は実装由来のためオラクル化せず、エラー要素の存在のみで判定する。
    this.subjectError = page
      .locator(".row", { has: page.locator("#mail_mail_subject") })
      .locator(".invalid-feedback");
  }

  /** 識別子なし初期表示（テンプレ選択のみ）を開く。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 識別子付き編集表示を直接開く。 */
  async gotoEdit(id: string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/mall/auto_mail/${id}`);
  }

  /**
   * テンプレ選択の先頭（空でない）候補を選び、change ハンドラ（detail.twig:30-37）の
   * location.href 遷移で識別子付き編集表示へ移動する。id をハードコードしない。
   * @returns 遷移先 URL から抽出したテンプレID（取得できなければ空文字）。
   */
  async selectFirstTemplate(): Promise<string> {
    const value = await this.templateSelect
      .locator("option")
      .nth(1)
      .getAttribute("value");
    await this.templateSelect.selectOption(value ?? "");
    await this.page.waitForURL(/\/mall\/auto_mail\/\d+(\?|$)/);
    const m = this.page.url().match(/\/mall\/auto_mail\/(\d+)/);
    return m ? m[1] : "";
  }

  /** 編集状態の入力欄を埋めて「登録」を押す（破壊的: DBを更新する）。 */
  async fillAndRegister(values: { name?: string; mailSubject?: string }) {
    if (values.name !== undefined) await this.name.fill(values.name);
    if (values.mailSubject !== undefined)
      await this.mailSubject.fill(values.mailSubject);
    await this.registerButton.click();
  }

  /** 識別子なし初期表示でテンプレ選択セレクトが表示されること（仕様: 入口・フロント挙動）。 */
  async seeTemplateSelect() {
    await expect(this.templateSelect).toBeVisible();
  }

  /** 編集状態で名称・件名・ヘッダー・フッター・登録ボタンが表示されること（仕様: UI部品 IT-25）。 */
  async seeEditForm() {
    await expect(this.name).toBeVisible();
    await expect(this.mailSubject).toBeVisible();
    await expect(this.header).toBeVisible();
    await expect(this.footer).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
}
