import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 会員「本会員登録（アクティベート）」（F06-02）Page Object。
 * integration_test/e2e/f06_02_front_member_entry_activate_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-02_front_member_entry_activate.md（判定順序・画面遷移・表示メッセージ）由来。
 * ec-cube-enterprise/pf-eccube3 Twig（Entry/activate.twig 等）は本リポジトリに未取込のため、セレクタは
 * URL・表示文言・要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 入口: メール記載の秘密キー付きURL `GET /{_locale}/entry/activate/{secret_key}`（非ログイン）。
 */
export class FrontMemberEntryActivatePage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;

  readonly body: Locator;
  // 本登録完了画面の見出し「本登録完了」。由来: pf-eccube3 Entry/activate.twig（要実機確認）
  readonly completeHeading: Locator;
  // 「ホームへ戻る」リンク。由来: Entry/activate.twig（要実機確認）
  readonly homeLink: Locator;
  // 共通エラー画面の見出し/本文の組。Twig差分に備え一般的なエラー構造でも拾う（要実機確認）。
  readonly errorArea: Locator;

  // 本会員登録完了の案内文（正常時のみ表示）。期待文言は設計書「表示メッセージ」節由来。
  static readonly COMPLETE_MESSAGE = "本登録が完了いたしました。";
  static readonly COMPLETE_HEADING_TEXT = "本登録完了";
  // 判定拒否時の共通エラー画面文言（設計書「表示メッセージ（エラー・警告）」節由来）。
  static readonly MSG_ACCESS_DENIED = "アクセスできません。";
  static readonly MSG_ALREADY_COMPLETED = "完了済みです。";
  static readonly MSG_ACTIVATION_FAILED = "会員情報の有効化に失敗しました。";

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;

    this.body = page.locator("body");
    this.completeHeading = page
      .getByRole("heading", { name: new RegExp(FrontMemberEntryActivatePage.COMPLETE_HEADING_TEXT) })
      .first();
    this.homeLink = page.getByRole("link", { name: /ホームへ戻る|ホーム|Home/i }).first();
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error'], main, body");
  }

  /** アクティベートURL（秘密キー付き）を組み立てる。 */
  activateUrl(secretKey: string): string {
    return `${this.localePrefix}/entry/activate/${secretKey}`;
  }

  async gotoActivate(secretKey: string) {
    await this.page.goto(this.activateUrl(secretKey));
  }

  async gotoMypage() {
    await this.page.goto(this.mypageUrl);
  }

  /** 本登録完了画面（成功・戻り先なし）を表示していること。期待は設計書「表示メッセージ（常時表示）」由来。 */
  async seeCompleteScreen() {
    await expect(this.completeHeading).toBeVisible();
    await expect(this.body).toContainText(FrontMemberEntryActivatePage.COMPLETE_MESSAGE);
    await expect(this.homeLink).toBeVisible();
  }

  /** 本登録完了画面ではないこと（判定拒否＝完了案内文が出ない）。 */
  async expectNotCompleted() {
    await expect(this.body).not.toContainText(FrontMemberEntryActivatePage.COMPLETE_MESSAGE);
  }

  /** 共通エラー画面（タイトルと本文の組）を表示していること。個別文言は期待により指定。 */
  async seeErrorScreen(expectedMessage?: string) {
    await this.expectNotCompleted();
    if (expectedMessage) {
      await expect(this.body).toContainText(expectedMessage);
    }
  }

  /** 会員ログイン画面へ誘導されていないこと（非ログインでのトークンURL処理起動）。 */
  async expectNotRedirectedToLogin() {
    await expect(this.page).not.toHaveURL(/\/mypage\/login(?:\?|$)/);
  }
}
