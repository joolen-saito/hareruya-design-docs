import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 システム設定 > 権限管理（権限×機能アクセス権マトリクス）Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m11_03_admin_system_setting_setting_system_authority_e2e_cases.md に対応。
 *
 * 期待結果は仕様（基本設計＝権限マトリクスUIのリニューアル後仕様 ＋ 観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（リバース＝旧「権限＋拒否URL」行ベースフォーム）だが、刷新先 ec-cube-enterprise は
 * 基本設計どおり「機能（URL）×権限のマトリクス（チェックボックス）UI」を実装している。SKILL 手順どおり
 * 基本設計・観点表を上位オラクルとし、設計md本文（旧行ベース）との差はケース表 付帯表4（不具合候補/要確認）で管理する。
 * セレクタは Twig 由来の位置情報のみ（authority.twig / messages.ja.yaml）。本リポジトリでは Playwright を実行しない（未実行雛形）。
 *
 * ルート: admin_setting_system_authority = GET|POST /%eccube_admin_route%/setting/system/authority
 *        （AuthorityController.php:53）。フォームは AuthorityMatrixType（getBlockPrefix=admin_authority_matrix、
 *        フィールドは _token のみ。チェックボックスは生HTML name=authority[authorityId][permissionId]）。
 *
 * セレクタ根拠（authority.twig / messages.ja.yaml）:
 *  - カードタイトル「権限設定」 .card-title（authority.twig:273 / trans admin.setting.system.authority__card_title messages.ja.yaml:3034）
 *  - マトリクス表 #table-authority（authority.twig:278）
 *  - 列見出し「機能名」（:281 / authority.function_name :3035）「権限名」（:289 / permission_name :3036）
 *    「優先度」（:298 / priority :3037）「操作」（:295 / operation :3038）
 *  - アクセス許可チェックボックス .permission-checkbox name=authority[authId][permId] value=true（:315-324。checked=許可/未checked=拒否）
 *  - 複製ボタン .btn-copy trans admin.common.copy「複製」（:329-331 / messages.ja.yaml:1440）
 *  - 登録ボタン button[type=submit] form=form1 trans admin.common.registration「登録」（:351 / messages.ja.yaml:1436）
 *  - 複製で生成される新規権限名入力 input.authority-name-input name=new_authority_name[...] placeholder「権限名を入力」（:182 JS生成）
 *  - 複製で生成される削除ボタン .btn-delete「削除」（:196-198 JS生成 / messages.ja.yaml:1444）
 *  - 既存権限行の権限名 #table-authority tbody tr > th:first-child = Authority.name（:308-310）
 *  - 成功フラッシュ .alert-success（alert.twig:22。addSuccess admin.common.save_complete「保存しました」messages.ja.yaml:1398）
 *  - エラーフラッシュ .alert-danger（alert.twig:42。addError 例外文言＋admin.common.save_error「保存に失敗しました」messages.ja.yaml:1399）
 */
export class AdminSystemSettingSettingSystemAuthorityPage {
  readonly page: Page;
  readonly url: string;

  readonly cardTitle: Locator; // カードタイトル「権限設定」
  readonly table: Locator; // 権限マトリクス表 #table-authority
  readonly tableHeader: Locator; // thead（列見出し）
  readonly authorityRows: Locator; // tbody の各権限行
  readonly firstRowName: Locator; // 先頭権限行の権限名（th:first-child）
  readonly permissionCheckboxes: Locator; // アクセス許可チェックボックス
  readonly copyButtons: Locator; // 複製ボタン
  readonly registerButton: Locator; // 登録ボタン
  readonly newAuthorityNameInput: Locator; // 複製で生成される新規権限名入力欄
  readonly deleteButtons: Locator; // 複製行の削除ボタン
  readonly successAlert: Locator; // 成功フラッシュ
  readonly errorAlert: Locator; // エラーフラッシュ

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/system/authority`;

    this.cardTitle = page.locator(".card-title");
    this.table = page.locator("#table-authority");
    this.tableHeader = page.locator("#table-authority thead");
    this.authorityRows = page.locator("#table-authority tbody tr");
    this.firstRowName = page.locator("#table-authority tbody tr").first().locator("th").first();
    this.permissionCheckboxes = page.locator(".permission-checkbox");
    this.copyButtons = page.locator(".btn-copy");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.newAuthorityNameInput = page.locator("input.authority-name-input");
    this.deleteButtons = page.locator(".btn-delete");
    this.successAlert = page.locator(".alert-success");
    this.errorAlert = page.locator(".alert-danger");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 権限設定（マトリクス）画面の基本要素が表示されること（仕様: フロント挙動・表示要素）。 */
  async seeMatrix() {
    await expect(this.cardTitle).toContainText("権限設定");
    await expect(this.table).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 列見出し（機能名/権限名/優先度/操作）が表示されること（仕様: 表の列）。 */
  async seeColumnHeaders() {
    await expect(this.tableHeader).toContainText("機能名");
    await expect(this.tableHeader).toContainText("権限名");
    await expect(this.tableHeader).toContainText("優先度");
    await expect(this.tableHeader).toContainText("操作");
  }

  /** 先頭権限行の権限名（既存の権限マスタ名）を読む。重複名エラーの入力に使う。 */
  async readFirstAuthorityName(): Promise<string> {
    return (await this.firstRowName.innerText()).trim();
  }

  /** 先頭権限行の「複製」を押し、新規権限行（権限名入力欄付き）を末尾へ追加する。 */
  async clickCopyFirstRow() {
    await this.copyButtons.first().click();
  }

  /** 無変更のまま「登録」を押す（冪等な正常系保存。現状のチェック状態＝望ましい状態のため副作用最小）。 */
  async submit() {
    await this.registerButton.click();
  }

  /**
   * 複製で追加した新規権限行の権限名に値を入力して登録する。
   * 既存権限名を渡すと重複エラー（保存されない）の異常系になる。
   */
  async submitWithNewAuthorityName(name: string) {
    await this.newAuthorityNameInput.fill(name);
    await this.registerButton.click();
  }
}
