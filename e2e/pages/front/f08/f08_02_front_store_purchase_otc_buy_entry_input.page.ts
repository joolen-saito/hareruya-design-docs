import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 店頭買取受付「査定申込情報入力」（F08-02）Page Object。
 * integration_test/e2e/f08_02_front_store_purchase_otc_buy_entry_input_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f08-02_front_store_purchase_otc_buy_entry_input.md
 * （利用者視点の入口・フロント挙動・処理フロー・表示メッセージ・画面遷移・バリデーション）由来（オラクル独立性）。
 * pf-eccube3 の Twig（OtcBuy/entry.twig・OtcBuy/index.twig・OtcBuy/register_customer.twig と *.en.twig）は
 * 本リポジトリに未取込のため、セレクタは URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠は取得不能＝要実機確認）。未実行雛形。
 *
 * 到達前提: 申込フォーム・会員登録フォームは有効な店舗識別名（dtb_base_info.html_class_name）と
 * エントリー開始状態（セッションのエントリーフラグ／申込フォーム送信）を要する。存在しない店舗→404 のみ creds/シード不要。
 */
export class FrontOtcBuyEntryInputPage {
  readonly page: Page;
  readonly localePrefix: string;
  /** 存在しない店舗識別名。404 ガードの live 検証に用いる。 */
  readonly noSuchStore = "__e2e_no_such_store__";

  readonly body: Locator;
  readonly heading: Locator; // 由来: 見出し「査定申込み」(要実機確認: OtcBuy/entry.twig・index.twig)
  readonly guestLink: Locator; // 由来: 「アカウントをお持ちでない方はこちら」(要実機確認: entry.twig)
  readonly loginEmail: Locator; // 由来: エントリーのログインフォーム メール欄(要実機確認)
  readonly loginPassword: Locator; // 由来: エントリーのログインフォーム パスワード欄(要実機確認)
  readonly loginStartButton: Locator; // 由来: 「査定申込み開始」ボタン(要実機確認)
  readonly errorArea: Locator; // 由来: フォームエラー枠(要実機確認)

  readonly countrySelect: Locator; // 由来: 申込フォーム 国セレクト(要実機確認: index.twig)
  readonly lastNameInput: Locator; // 由来: お名前（姓）(要実機確認)
  readonly firstNameInput: Locator; // 由来: お名前（名）(要実機確認)
  readonly lastNameKanaInput: Locator; // 由来: お名前カナ（姓）(要実機確認)
  readonly firstNameKanaInput: Locator; // 由来: お名前カナ（名）(要実機確認)
  readonly zip01Input: Locator; // 由来: 郵便番号 zip01(数値3桁)(要実機確認)
  readonly zip02Input: Locator; // 由来: 郵便番号 zip02(数値4桁)(要実機確認)
  readonly zipSearchLink: Locator; // 由来: 郵便番号検索リンク(要実機確認)
  readonly zipAutoFillButton: Locator; // 由来: 郵便番号自動入力ボタン(要実機確認)
  readonly qualifiedIssuerRadio: Locator; // 由来: 適格請求書発行事業者ですか（はい/いいえ）(要実機確認)
  readonly qualifiedIssuerCodeInput: Locator; // 由来: 登録番号(要実機確認)
  readonly privacyAgreeCheck: Locator; // 由来: 個人情報の取り扱い・利用規約に同意(要実機確認)
  readonly submitButton: Locator; // 由来: 申込フォーム送信ボタン(要実機確認)

  readonly regEmail: Locator; // 由来: 会員登録フォーム メール(要実機確認: register_customer.twig)
  readonly regPassword: Locator; // 由来: 会員登録フォーム パスワード(要実機確認)

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;

    this.body = page.locator("body");
    // 表示文言は設計書「表示メッセージ」節由来（Twig 差分に備え文言で寄せる）。
    this.heading = page.getByRole("heading", { name: /査定申込み|Selling Request|Assessment Form/i }).first();
    this.guestLink = page.getByRole("link", { name: /アカウントをお持ちでない方はこちら|don't have an account/i }).first();
    this.loginEmail = page.locator('input[type="email"], input[name*="email"], input[name*="login"]').first();
    this.loginPassword = page.locator('input[type="password"], input[name*="password"], input[name*="pass"]').first();
    this.loginStartButton = page.getByRole("button", { name: /査定申込み開始|開始|Start/i }).first();
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");

    this.countrySelect = page.locator('select[name*="country"]').first();
    this.lastNameInput = page.locator('input[name*="last_name"]:not([name*="kana"])').first();
    this.firstNameInput = page.locator('input[name*="first_name"]:not([name*="kana"])').first();
    this.lastNameKanaInput = page.locator('input[name*="last_name_kana"], input[name*="kana"][name*="last"]').first();
    this.firstNameKanaInput = page.locator('input[name*="first_name_kana"], input[name*="kana"][name*="first"]').first();
    this.zip01Input = page.locator('input[name*="zip01"], input[name*="zipcode"][name*="01"]').first();
    this.zip02Input = page.locator('input[name*="zip02"], input[name*="zipcode"][name*="02"]').first();
    this.zipSearchLink = page.getByRole("link", { name: /郵便番号|住所検索|zip/i }).first();
    this.zipAutoFillButton = page.getByRole("button", { name: /自動入力|住所検索|検索/ }).first();
    this.qualifiedIssuerRadio = page.locator('input[type="radio"][name*="qualified"], input[type="radio"][name*="invoice"]').first();
    this.qualifiedIssuerCodeInput = page.locator('input[name*="qualified_invoice_issuer_code"], input[name*="issuer_code"]').first();
    this.privacyAgreeCheck = page.locator('input[type="checkbox"][name*="privacy"], input[type="checkbox"][name*="agree"]').first();
    this.submitButton = page.getByRole("button", { name: /次のページへ進む|確認|送信|次へ|進む/ }).first();

    this.regEmail = page.locator('input[type="email"], input[name*="email"]').first();
    this.regPassword = page.locator('input[type="password"], input[name*="password"]').first();
  }

  entryUrl(name: string) {
    return `${this.localePrefix}/otcbuy/${name}/entry`;
  }
  formUrl(name: string) {
    return `${this.localePrefix}/otcbuy/${name}`;
  }
  registerCustomerUrl(name: string) {
    return `${this.localePrefix}/otcbuy/${name}/register_customer`;
  }

  async gotoEntry(name: string) {
    await this.page.goto(this.entryUrl(name));
  }
  async gotoForm(name: string) {
    await this.page.goto(this.formUrl(name));
  }
  async gotoRegisterCustomer(name: string) {
    await this.page.goto(this.registerCustomerUrl(name));
  }

  /** 存在しない店舗識別名で開くと 404 になること（期待は設計書「店舗識別名が該当なし→404」由来）。 */
  async expectStoreNotFoundOnEntry() {
    const res = await this.page.goto(this.entryUrl(this.noSuchStore));
    expect(res?.status()).toBe(404);
  }
  async expectStoreNotFoundOnForm() {
    const res = await this.page.goto(this.formUrl(this.noSuchStore));
    expect(res?.status()).toBe(404);
  }

  /** エントリー画面の表示要素（見出し・言語選択・ログインフォーム・ゲスト導線）を確認する。 */
  async seeEntryScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.loginEmail).toBeVisible();
    await expect(this.loginPassword).toBeVisible();
    await expect(this.guestLink).toBeVisible();
  }

  /** エントリーのログイン失敗時に最終エラーが表示されること（文言は認証仕様＝別機能。表示位置＝フォーム直下）。 */
  async loginOnEntry(name: string, email: string, password: string) {
    await this.gotoEntry(name);
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.loginStartButton.click();
  }

  async seeMemberRegisterForm() {
    await expect(this.regEmail).toBeVisible();
    await expect(this.regPassword).toBeVisible();
  }
}
