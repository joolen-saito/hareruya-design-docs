import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 コンテンツ管理 > キャッシュ管理 Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m09_08_admin_content_content_cache_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m09-08_admin_content_content_cache.md / messages.ja.yaml）由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。本リポジトリでは Playwright を実行しない（構造参考のもとの未実行雛形）。
 *
 * ルート: admin_content_cache = GET|POST /%eccube_admin_route%/content/cache（CacheController.php:29）。
 * フォームは名前無し FormType（CacheController.php:33）でなりすまし対策トークン _token のみを持つ。
 *
 * セレクタ根拠:
 *  - カード見出し .card-title trans admin.content.cache__card_title=「キャッシュ管理」（cache.twig:40 / messages.ja.yaml:2744）
 *  - 説明文 admin.content.cache_message（cache.twig:46 / messages.ja.yaml:2745）
 *  - 削除ボタン button.btn-ec-conversion trans admin.content.cache_delete=「キャッシュ削除」（cache.twig:51 / messages.ja.yaml:2746）
 *  - 成功フラッシュ .alert-success（alert.twig:21-28 app.flashes('eccube.admin.success')） テキスト admin.common.delete_complete=「削除しました」（messages.ja.yaml:1400）
 *  - なりすまし対策トークン hidden（form_widget(form._token) cache.twig:33。名前無しFormのため id は要実機確認 → name/type で特定）
 */
export class ContentContentCachePage {
  readonly page: Page;
  readonly url: string;

  readonly form: Locator; // 削除フォーム（cache.twig:32 action=admin_content_cache）
  readonly cardTitle: Locator; // .card-title「キャッシュ管理」（cache.twig:40）
  readonly deleteButton: Locator; // 「キャッシュ削除」（cache.twig:51）
  readonly successAlert: Locator; // .alert-success（alert.twig:21-28）
  readonly csrfToken: Locator; // 隠しトークン（cache.twig:33。id=_token は要実機確認）
  readonly userInputs: Locator; // 利用者入力欄（cache.twig には可視入力欄なし＝0件を期待）

  // 仕様（設計書「フロント挙動／表示メッセージ」節）が明記する文言＝オラクル。
  readonly descriptionText =
    "本番環境にFTPなどでTwigファイルをアップロードして入れ替えた場合、画面を反映させるにはTwigキャッシュを削除する必要があります。";
  readonly deleteButtonLabel = "キャッシュ削除";
  readonly successMessage = "削除しました"; // admin.common.delete_complete

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/content/cache`;

    this.form = page.locator('form[action*="content/cache"]');
    this.cardTitle = page.locator(".card-title");
    this.deleteButton = page.getByRole("button", { name: this.deleteButtonLabel });
    this.successAlert = page.locator(".alert-success");
    this.csrfToken = this.form.locator('input[type="hidden"]').first();
    // 可視の利用者入力欄のみを対象（hidden の _token は除外）。
    this.userInputs = this.form.locator(
      'input:not([type="hidden"]):not([type="submit"]), textarea, select'
    );
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 「キャッシュ削除」ボタンを押下して削除POSTを送る。 */
  async clickDelete() {
    await this.deleteButton.click();
  }

  /** 隠しトークン値を不正値へ書き換えてから削除POSTを送る（CSRFエラーパス）。 */
  async submitWithTamperedToken() {
    // 名前無しFormのため id 不確定。フォーム内の隠し input を直接書き換える（要実機確認）。
    await this.csrfToken.evaluate((el: HTMLInputElement) => {
      el.value = "invalid-csrf-token";
    });
    await this.deleteButton.click();
  }

  /** キャッシュ管理画面のUI部品が仕様どおり表示されること。 */
  async seeCacheForm() {
    await expect(this.cardTitle).toBeVisible();
    await expect(this.page.locator("body")).toContainText(this.descriptionText);
    await expect(this.deleteButton).toBeVisible();
  }

  /** 削除完了フラッシュ「削除しました」が表示されること。 */
  async seeDeleteSuccess() {
    await expect(this.successAlert).toContainText(this.successMessage);
  }

  /**
   * 仕様 エッジケース「メンテ設定無効」: メンテ許可設定が無効（既定）のとき、解除用の非同期メンテ解除要求を
   * 出力しない（cache.twig:19-26 の解除inline scriptは条件不成立で非出力）。
   * `waitForRequest` タイムアウトでの非発火判定は脆弱なため採らず、解除識別子 auto_maintenance を持つ
   * inline script がDOMに存在しないこと（決定的なDOM観測）で確認する。期待値は設計書「調査補助」由来の識別子。
   */
  async expectNoMaintenanceReleaseScript() {
    await expect(
      this.page.locator("script", { hasText: "auto_maintenance" })
    ).toHaveCount(0);
  }

  /** 仕様「モーダル・ポップアップ」: モーダル/確認ダイアログ/トーストを表示しないこと（DOM観点）。 */
  async expectNoModalOrToast() {
    // 表示状態のBootstrapモーダル・トーストが無いこと（非表示要素の有無ではなく可視状態で判定）。
    await expect(this.page.locator(".modal.show")).toHaveCount(0);
    await expect(this.page.locator(".toast.show")).toHaveCount(0);
  }
}
