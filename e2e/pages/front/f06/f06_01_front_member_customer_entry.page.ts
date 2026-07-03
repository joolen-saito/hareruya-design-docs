import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 会員「仮会員登録（新規会員登録）」（F06-01）Page Object。
 * integration_test/e2e/f06_01_front_member_customer_entry_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-01_front_member_customer_entry.md
 * （利用者視点の入口・フロント挙動・処理フロー・判定順序・表示メッセージ・画面遷移）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは
 * URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontMemberEntryPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly shopSegment: string;
  readonly entryUrl: string;
  readonly completeUrl: string;
  readonly registErrorUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  // 入力フォーム項目（name/label の意味で寄せる。id/name は要実機確認）。
  readonly nameInput: Locator; // 由来: Entry/index.twig お名前(name[name01]) 要実機確認
  readonly emailInput: Locator; // 由来: メールアドレス(email[first]) 要実機確認
  readonly emailConfirmInput: Locator; // 由来: メールアドレス(確認)(email[second]) 要実機確認
  readonly passwordInput: Locator; // 由来: パスワード(password[first]) 要実機確認
  readonly passwordConfirmInput: Locator; // 由来: パスワード(確認)(password[second]) 要実機確認
  readonly countrySelect: Locator; // 由来: 国(country) 要実機確認
  readonly zipInput: Locator; // 由来: 郵便番号(zip/zipcode) 要実機確認
  readonly prefSelect: Locator; // 由来: 都道府県(pref) 要実機確認
  readonly requiredMark: Locator; // 由来: 必須項目のチェック画像 alt="必須" 要実機確認
  readonly agreeButton: Locator; // 由来: 「同意する」ボタン(mode=confirm) 要実機確認
  readonly registerButton: Locator; // 由来: 「登録する」/「会員登録をする」ボタン(mode=complete) 要実機確認
  readonly backButton: Locator; // 由来: 確認画面「戻る」ボタン(mode=back) 要実機確認
  readonly topLink: Locator; // 由来: トップへ戻るリンク 要実機確認
  readonly errorArea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shopSegment = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${this.shopSegment}`;
    this.entryUrl = `${this.localePrefix}/entry`;
    this.completeUrl = `${this.localePrefix}/entry/complete`;
    this.registErrorUrl = `${this.localePrefix}/entry/regist_error`;

    // 入力画面見出し「会員情報登録」（英語表示は「Registration」）。確認画面見出しは別。
    this.heading = page.getByRole("heading", { name: /会員情報登録|Registration/ }).first();
    this.body = page.locator("body");
    this.nameInput = page.locator('input[name*="name"]').first();
    this.emailInput = page
      .locator('input[name*="email"][name*="first"], input[type="email"], input[name*="email"]')
      .first();
    this.emailConfirmInput = page.locator('input[name*="email"][name*="second"]').first();
    this.passwordInput = page
      .locator('input[name*="password"][name*="first"], input[type="password"][name*="first"], input[type="password"]')
      .first();
    this.passwordConfirmInput = page
      .locator('input[name*="password"][name*="second"], input[type="password"][name*="second"]')
      .first();
    this.countrySelect = page.locator('select[name*="country"]').first();
    this.zipInput = page.locator('input[name*="zip"], input[name*="postal"]').first();
    this.prefSelect = page.locator('select[name*="pref"]').first();
    this.requiredMark = page.locator('img[alt="必須"]');
    this.agreeButton = page.getByRole("button", { name: /同意する|確認|Confirm/i }).first();
    this.registerButton = page.getByRole("button", { name: /会員登録をする|登録する|Register/i }).first();
    this.backButton = page.getByRole("button", { name: /戻る|Back/i }).first();
    this.topLink = page.getByRole("link", { name: /トップへ|トップ|Top/i }).first();
    // 検証エラー枠。Twig差分に備え文言と一般的なエラークラスの双方で拾う。
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  async gotoEntry() {
    await this.page.goto(this.entryUrl);
  }

  /** 言語別パスで会員登録画面を開く（英語表示確認用）。 */
  async gotoEntryLocale(locale: string) {
    await this.page.goto(`/${locale}${this.shopSegment}/entry`);
  }

  /** 支店からの遷移を模したクエリ shop 付きで会員登録画面を開く。 */
  async gotoEntryWithShop(shopName: string) {
    await this.page.goto(`${this.entryUrl}?shop=${encodeURIComponent(shopName)}`);
  }

  async gotoComplete() {
    await this.page.goto(this.completeUrl);
  }

  async gotoRegistError() {
    await this.page.goto(this.registErrorUrl);
  }

  /** 会員登録画面の初期表示（見出し＋主要入力欄）。期待は「フロント挙動（表示要素）」由来。 */
  async seeEntryScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  /** 会員登録フォームの主要項目ラベルが表示されていること。期待は表示メッセージ節（入力フォーム項目）由来。 */
  async seeEntryFormFields() {
    for (const label of ["お名前", "メールアドレス", "パスワード", "生年月日", "郵便番号"]) {
      await expect(this.body).toContainText(label);
    }
  }
}
