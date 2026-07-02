import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 システム情報設定 > メンバー登録・編集（new / {id}/edit）Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m11_02_admin_system_setting_setting_system_member_edit_e2e_cases.md に対応。
 *
 * 期待結果は仕様（正本 functions/pf-eccube3/m11-02_admin_system_setting_setting_system_member_edit.md / 観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（リバース）。刷新先 ec-cube-enterprise との乖離は付帯表4（不具合候補）で管理する。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_member`（MemberType.php:286-289）由来の位置情報のみ。
 * 本リポジトリでは Playwright を実行しない（構造参考のもとの未実行雛形）。
 *
 * ルート（MemberController.php）:
 *  - 新規 GET|POST  admin_setting_system_member_new    = /%eccube_admin_route%/setting/system/member/new（:91）
 *  - 編集 GET        admin_setting_system_member_edit    = /%eccube_admin_route%/setting/system/member/{id}/edit（:155）
 *  - 更新 POST       admin_setting_system_member_update  = /%eccube_admin_route%/setting/system/member/{id}/update（:189）
 *  - 一覧            admin_setting_system_member         = /%eccube_admin_route%/setting/system/member（:58）
 *  ※ 設計書(pf-eccube3)は編集POSTを /{id}/edit とするが刷新先は /{id}/update（付帯表4#4）。本POMはフォーム送信ボタンを押すため action 差分に依存しない。
 *
 * DOM id 根拠（getBlockPrefix=admin_member）:
 *  - name（名前）           → #admin_member_name（member_edit.twig:89 / MemberType:67-72 NotBlank+Length stext_len）
 *  - department（所属）     → #admin_member_department（member_edit.twig:115 / MemberType:73-83）
 *      ※ 正典(pf-eccube3)の入力種別は text・NotBlank（設計書L88/L264）。刷新先は EntityType Department=select（入力種別の乖離=付帯表4#8）。
 *        DOM id は getBlockPrefix 由来で widget 種別に依存しないため共通。検証は「空送信→所属欄直下の必須エラー」で観測し select/未選択を前提化しない。
 *  - login_id（ログインID） → #admin_member_login_id（member_edit.twig:129 / MemberType PRE_SET_DATA:194-224。編集時は disabled:216）
 *  - email（メールアドレス）→ #admin_member_email（member_edit.twig:143 / MemberType:138-147）※刷新先のみ（付帯表4#5）
 *  - plain_password.first（パスワード）   → #admin_member_plain_password_first（member_edit.twig:157 / MemberType:84-98）
 *  - plain_password.second（確認）        → #admin_member_plain_password_second（member_edit.twig:171）
 *  - Authority（権限）      → #admin_member_Authority（member_edit.twig:188 / MemberType:99-120 NotBlank=select）
 *  - baseInfo（所属店舗）   → #admin_member_baseInfo（member_edit.twig:103 / MemberType:121-129 required:false=select）
 *  - Work（稼働）           → radio #admin_member_Work_0.. （member_edit.twig:221 / MemberType:130-137 NotBlank expanded）
 *  - smaregiMemberFlg（スマレジ用アカウント）→ #admin_member_smaregiMemberFlg（member_edit.twig:251 / MemberType:171-174 checkbox mapped）
 *  - 登録ボタン type=submit trans admin.common.registration=「登録」（member_edit.twig:296 / messages.ja.yaml:1436）
 *  - 戻るリンク trans admin.setting.system.member_management=「メンバー管理」（member_edit.twig:286 / messages.ja.yaml:2788）
 *  - カード見出し trans admin.setting.system.member.member_registration=「メンバー登録」（member_edit.twig:71 / messages.ja.yaml:2998）
 *      ※ 設計書(pf-eccube3)はボックス見出し「メンバー登録・編集」。刷新先は「メンバー登録」（付帯表4#2）。
 *  - サブタイトル trans admin.setting.system（member_edit.twig:16）
 *  - 必須バッジ .badge trans admin.common.required=「必須」（member_edit.twig:84 ほか / messages.ja.yaml:1528）
 *  - フィールドエラー .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:53-63 form_errors / 非rootform）
 *  - 成功フラッシュ .alert-success（alert.twig:21-22 app.flashes('eccube.admin.success') / addSuccess admin.common.save_complete MemberController:129,218）
 *  - 失敗フラッシュ .alert-danger（alert.twig:31-42 app.flashes('eccube.admin.danger'/'error') / addError admin.common.save_error MemberController:131,219,223）
 *
 * 刷新先のみに存在（付帯表4#5・設計書「本書で扱わないこと」）: email / defaultSearchBaseInfo / editableBaseInfos /
 *   two_factor_auth_enabled / isAutoLogout は現行 pf-eccube3 画面に無い項目。現行画面項目の確認には用いない（オラクル独立性）。
 */
export class SystemSettingSettingSystemMemberEditPage {
  readonly page: Page;
  readonly newUrl: string; // 新規登録 URL
  readonly listUrl: string; // メンバー一覧 URL（戻り先）

  readonly name: Locator; // 名前（必須）
  readonly department: Locator; // 所属（正典=text・NotBlank／刷新先=select：付帯表4#8）
  readonly loginId: Locator; // ログインID（編集時 disabled）
  readonly passwordFirst: Locator; // パスワード
  readonly passwordSecond: Locator; // パスワード(確認)
  readonly authority: Locator; // 権限（select 必須）
  readonly baseInfo: Locator; // 所属店舗（select 任意）
  readonly smaregiMemberFlg: Locator; // スマレジ用アカウント（checkbox 任意）
  readonly registerButton: Locator; // 登録ボタン type=submit
  readonly backLink: Locator; // 戻るリンク「メンバー管理」
  readonly cardTitle: Locator; // カード見出し（.card-title）
  readonly requiredBadges: Locator; // 必須バッジ（.badge）
  readonly fieldErrors: Locator; // .invalid-feedback（フィールドエラー）
  readonly successAlert: Locator; // .alert-success（成功フラッシュ）
  readonly dangerAlert: Locator; // .alert-danger（失敗フラッシュ）

  constructor(page: Page) {
    this.page = page;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/system/member/new`;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/system/member`;

    this.name = page.locator("#admin_member_name");
    this.department = page.locator("#admin_member_department");
    this.loginId = page.locator("#admin_member_login_id");
    this.passwordFirst = page.locator("#admin_member_plain_password_first");
    this.passwordSecond = page.locator("#admin_member_plain_password_second");
    this.authority = page.locator("#admin_member_Authority");
    this.baseInfo = page.locator("#admin_member_baseInfo");
    this.smaregiMemberFlg = page.locator("#admin_member_smaregiMemberFlg");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.backLink = page.getByRole("link", { name: "メンバー管理" });
    this.cardTitle = page.locator(".card-title");
    this.requiredBadges = page.locator(".badge", { hasText: "必須" });
    this.fieldErrors = page.locator(".invalid-feedback");
    this.successAlert = page.locator(".alert-success");
    this.dangerAlert = page.locator(".alert-danger");
  }

  /** 編集画面 URL（{id}/edit）。 */
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/setting/system/member/${id}/edit`;
  }

  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  async submit() {
    await this.registerButton.click();
  }

  /**
   * 指定フィールド近傍（同一入力グループ列 div.col）内のフィールドエラーに限定した Locator を返す。
   * オラクル独立性のため、別項目のエラーや seed 不備による誤検知を避ける。
   * member_edit.twig は各 form_widget(form.x)/form_errors(form.x) を同一の col 列内に描画する。
   */
  fieldError(field: Locator): Locator {
    return field
      .locator("xpath=ancestor::div[contains(@class,'col')][1]")
      .locator(".invalid-feedback");
  }

  /**
   * 登録・編集フォームの基本要素が表示されること（仕様: 利用者視点の入口・フロント挙動「表示要素」）。
   * カード見出し（member_edit.twig:71）・登録ボタン・戻るリンクを観測する。
   * 見出し文言は設計書(正典)の「メンバー登録・編集」を仕様オラクルとしてアサートする（実装文言はオラクル化しない）。
   * 刷新先実装は「メンバー登録」のため本アサートは失敗し、見出し文言の乖離（付帯表4#2）を失敗で検出する。
   */
  async seeForm() {
    await expect(this.cardTitle.first()).toContainText("メンバー登録・編集");
    await expect(this.registerButton).toBeVisible();
    await expect(this.backLink).toBeVisible();
  }

  /**
   * 設計書「フロント挙動 / 入力項目」の9項目（名前・所属・ログインID・パスワード・確認・権限・所属店舗・稼働・スマレジ）が
   * 揃って表示されること。刷新先のみの追加項目（email 等）は本確認の対象にしない（オラクル独立性）。
   */
  async seeAllInputFields() {
    await expect(this.name).toBeVisible();
    await expect(this.department).toBeVisible();
    await expect(this.loginId).toBeVisible();
    await expect(this.passwordFirst).toBeVisible();
    await expect(this.passwordSecond).toBeVisible();
    await expect(this.authority).toBeVisible();
    await expect(this.baseInfo).toBeVisible();
    await expect(this.page.locator("input[name='admin_member[Work]']").first()).toBeVisible();
    await expect(this.smaregiMemberFlg).toBeVisible();
  }

  /**
   * 保存成功＝成功フラッシュが表示されること（仕様: 表示メッセージ・処理フロー POST検証成功・入出力 成功時出力）。
   * フラッシュ文言は設計書(正典)の「メンバーを保存しました。」を仕様オラクルとしてアサートする（実装文言はオラクル化しない）。
   * 刷新先実装は汎用「保存しました」のため本アサートは失敗し、文言の乖離（付帯表4#1）を失敗で検出する。
   */
  async seeSaveSuccess() {
    await expect(this.successAlert).toContainText("メンバーを保存しました。");
  }
}
