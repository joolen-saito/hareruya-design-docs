import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 店頭買取「査定申込前ログイン」（F08-01）Page Object。
 * integration_test/e2e/f08_01_front_store_purchase_otc_buy_entry_login_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f08-01_front_store_purchase_otc_buy_entry_login.md
 * （利用者視点の入口・処理フロー・表示メッセージ・画面遷移・入力項目）由来。
 *
 * 本画面は店舗ごとのURL `/otcbuy/{name}/entry` で開く（{name}=店舗識別子＝HTMLクラス名。英数字とアンダースコア）。
 * 店舗識別子は環境変数 ECCUBE_FRONT_SHOP を流用する（現行=htmlClassName／移行先=dtb_base_info.html_class_name）。
 * pf-eccube3 の Twig（OtcBuy/entry.twig）は本リポジトリに未取込のため、セレクタはフォーム意味・URL・
 * 表示文言で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontStorePurchaseOtcBuyEntryLoginPage {
  readonly page: Page;
  readonly store: string;
  readonly localePrefix: string;
  readonly entryUrl: string;
  readonly requestFormUrl: string;
  readonly invalidStoreEntryUrl: string;

  readonly requestHeading: Locator; // 由来: OtcBuy/entry.twig 見出し「査定申込み」(要実機確認)
  readonly loginHeading: Locator; // 由来: 「ログイン」見出し(要実機確認)
  readonly body: Locator;
  readonly emailInput: Locator; // 由来: フォームキー login_email（設計書 入力項目）
  readonly passwordInput: Locator; // 由来: フォームキー login_pass（設計書 入力項目・パスワード種別）
  readonly csrfToken: Locator; // 由来: なりすまし対策トークン hidden(要実機確認)
  readonly submitButton: Locator; // 由来: 「査定申込み開始」ボタン(要実機確認)
  readonly guestLink: Locator; // 由来: 「アカウントをお持ちでない方はこちら」リンク(要実機確認)
  readonly langSwitch: Locator; // 由来: 言語切替（JP／EN）(要実機確認)
  readonly errorArea: Locator; // 由来: ログインエラー表示枠(要実機確認)

  constructor(page: Page) {
    this.page = page;
    this.store = ECCUBE_FRONT_SHOP || "";
    // otcbuy ルートは管理プレフィックスを持たないフロントページ。locale は環境により付く場合があるため保持のみ。
    this.localePrefix = ECCUBE_FRONT_LOCALE ? `/${ECCUBE_FRONT_LOCALE}` : "";
    this.entryUrl = `/otcbuy/${this.store}/entry`;
    this.requestFormUrl = `/otcbuy/${this.store}`;
    // 店舗識別子が不正・該当なしのケース（404 期待）。実在しない店舗名を用いる。
    this.invalidStoreEntryUrl = `/otcbuy/__e2e_no_such_store__/entry`;

    this.requestHeading = page.getByRole("heading", { name: /査定申込み|Selling Request/i }).first();
    this.loginHeading = page.getByRole("heading", { name: /ログイン|Login/i }).first();
    this.body = page.locator("body");
    this.emailInput = page
      .locator('input[name*="login_email"], input[type="email"], input[name*="email"]')
      .first();
    this.passwordInput = page
      .locator('input[name*="login_pass"], input[type="password"], input[name*="password"]')
      .first();
    this.csrfToken = page
      .locator('input[type="hidden"][name="_csrf_token"], input[type="hidden"][name*="csrf"]')
      .first();
    this.submitButton = page.getByRole("button", { name: /査定申込み開始|Selling Request|ログイン|Login/i }).first();
    this.guestLink = page.getByRole("link", { name: /アカウントをお持ちでない|don't have an account/i }).first();
    this.langSwitch = page.getByRole("link", { name: /^(JP|EN)$/ }).first();
    // ログインエラー表示枠。Twig差分に備え文言と一般的なエラークラスの双方で拾う。
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  async gotoEntry() {
    await this.page.goto(this.entryUrl);
  }

  async gotoInvalidStoreEntry() {
    await this.page.goto(this.invalidStoreEntryUrl);
  }

  async fillAndSubmit(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginWithConfiguredCreds() {
    await this.gotoEntry();
    await this.fillAndSubmit(ECCUBE_FRONT_USER, ECCUBE_FRONT_PASS);
  }

  /** 査定申込前ログイン画面の主要UI部品が表示されていること。期待は設計書「フロント挙動／表示メッセージ」節由来。 */
  async seeEntryScreen() {
    await expect(this.loginHeading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
