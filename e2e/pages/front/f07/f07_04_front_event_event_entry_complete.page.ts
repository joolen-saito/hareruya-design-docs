import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント イベント「大会申込～完了」（F07-04）Page Object。
 * integration_test/e2e/f07_04_front_event_event_entry_complete_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f07-04_front_event_event_entry_complete.md（利用者視点の入口・処理フロー・
 * 判定順序・表示メッセージ・バリデーション・権限認可・画面遷移）由来（オラクル独立性）。
 * pf-eccube3 の `Event/entry.twig`・`Event/select_payment.twig`・`Event/entry_confirm.twig`・
 * `Event/payment_complete.twig`・`Block/js/event_payment.twig` は本リポジトリに未取込のため、
 * セレクタはフロントTwig差分に耐えるよう URL・表示文言・フォーム要素の意味で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 申込各段階（申込対象選択・支払方法選択・申込確認・申込登録）はログイン会員の選手情報を前提とし、
 * 未ログインでは利用できず会員ログインへ誘導される（設計書「権限・認可」節）。
 * URLスキーム（設計書「利用者視点の入口」節）:
 *   GET  /{_locale}/events/{eventDetailId}/entry           申込対象を選ぶ
 *   GET  /{_locale}/events/{eventDetailId}/select_payment  支払方法選択を開く
 *   POST /{_locale}/events/confirm                         申込内容を確認する
 *   POST /{_locale}/events/registration（非同期）          申込を登録する
 *   POST /{_locale}/events/payment_url（非同期）           決済URLを取得する
 *   GET  /{_locale}/events/payment_finish                  決済後に戻る
 *   GET  /{_locale}/events/payment_complete?detail={id}    申込完了を表示する
 *   GET/POST /{_locale}/events/payment_cancel?paymentNo=…  決済キャンセルを表示する
 */
export class FrontEventEntryPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  /** 未ログインで到達確認に使うサンプルのイベント詳細ID。firewall 誘導は詳細IDの実在に依らない。 */
  readonly sampleEventDetailId: string;

  readonly body: Locator;
  readonly heading: Locator; // 見出し「イベント申込」
  readonly emailInput: Locator; // 会員ログイン用メール欄（誘導先の会員ログイン画面）
  readonly passwordInput: Locator; // 会員ログイン用パスワード欄
  readonly loginButton: Locator;

  // 由来: pf-eccube3 Event/*.twig（本リポジトリ未取込）。文言・意味は設計書由来。要実機確認。
  readonly confirmCheckbox: Locator; // 「この内容でイベント申込を確定します。」確定チェック
  readonly payToButton: Locator; // 「支払いへ進む」
  readonly applyButton: Locator; // 申込確認画面の「申込する」
  readonly paymentSelect: Locator; // 支払方法セレクト（有料時。name=payment）
  readonly memberEmailInputs: Locator; // チームメンバーメール（team_members[i][address]）
  readonly seatSelects: Locator; // 席次（team_members[i][seat]）
  readonly errorArea: Locator; // インラインエラー枠

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.sampleEventDetailId = process.env.ECCUBE_EVENT_DETAIL_ID || "1";

    this.body = page.locator("body");
    this.heading = page.getByRole("heading", { name: /イベント申込|Event Registration/ }).first();
    this.emailInput = page
      .locator('input[name*="login_email"], input[type="email"], input[name*="email"]')
      .first();
    this.passwordInput = page
      .locator('input[name*="login_pass"], input[type="password"], input[name*="password"]')
      .first();
    this.loginButton = page.getByRole("button", { name: /ログイン|Login/i }).first();

    // 確定チェックは支払方法選択画面のチェックボックス。文言近傍のチェックボックスで拾う。
    this.confirmCheckbox = page.locator('input[type="checkbox"]').first();
    this.payToButton = page.getByRole("button", { name: /支払いへ進む|支払い|進む|Proceed/ }).first();
    this.applyButton = page.getByRole("button", { name: /申込する|申込む|Register|Apply/ }).first();
    this.paymentSelect = page.locator('select[name*="payment"], select').first();
    this.memberEmailInputs = page.locator(
      'input[name*="team_members"][name*="address"], input[name*="address"]',
    );
    this.seatSelects = page.locator('select[name*="team_members"][name*="seat"], select[name*="seat"]');
    // インラインエラー枠。Twig差分に備え文言と一般的なエラークラスの双方で拾う。
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  entryUrl(eventDetailId: string | number = this.sampleEventDetailId): string {
    return `${this.localePrefix}/events/${eventDetailId}/entry`;
  }

  selectPaymentUrl(eventDetailId: string | number = this.sampleEventDetailId): string {
    return `${this.localePrefix}/events/${eventDetailId}/select_payment`;
  }

  completeUrl(eventDetailId: string | number = this.sampleEventDetailId): string {
    return `${this.localePrefix}/events/payment_complete?detail=${eventDetailId}`;
  }

  cancelUrl(paymentNo: string): string {
    return `${this.localePrefix}/events/payment_cancel?paymentNo=${paymentNo}`;
  }

  async gotoEntry(eventDetailId: string | number = this.sampleEventDetailId) {
    return await this.page.goto(this.entryUrl(eventDetailId));
  }

  async gotoSelectPayment(eventDetailId: string | number = this.sampleEventDetailId) {
    return await this.page.goto(this.selectPaymentUrl(eventDetailId));
  }

  async gotoComplete(eventDetailId: string | number = this.sampleEventDetailId) {
    return await this.page.goto(this.completeUrl(eventDetailId));
  }

  /** 会員ログイン（誘導先の /mypage/login フォームで認証）。-live 変種の前提。 */
  async loginAsMember() {
    await this.page.goto(this.loginUrl);
    await this.emailInput.fill(ECCUBE_FRONT_USER);
    await this.passwordInput.fill(ECCUBE_FRONT_PASS);
    await this.loginButton.click();
  }

  /** 未ログインで申込段階URLへ到達すると会員ログイン画面へ誘導されること。期待は「権限・認可」節由来。 */
  async expectLoginRedirect() {
    await expect(this.page).toHaveURL(/\/(mypage\/login|login)(?:\?|\/|$)/);
  }

  /** 支払方法選択画面の主要素（申込対象・合計参加費・支払方法・確定チェック）が表示されること。
   *  期待はフロント挙動「表示要素」節・表示メッセージ節由来。 */
  async seeSelectPaymentScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.body).toContainText(/合計|参加費/);
    await expect(this.body).toContainText("この内容でイベント申込を確定します");
  }

  /** 申込完了画面の完了文言・完了案内が表示されること。期待は表示メッセージ（常時表示）節由来。 */
  async seeCompletionScreen() {
    await expect(this.body).toContainText("イベント申込が完了いたしました");
    await expect(this.body).toContainText("イベントの申し込み状況はマイページから確認できます");
  }
}
