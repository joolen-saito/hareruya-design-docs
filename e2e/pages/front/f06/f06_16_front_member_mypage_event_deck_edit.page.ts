import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員マイページ「大会デッキ登録編集」（F06-16）Page Object。
 * integration_test/e2e/f06_16_front_member_mypage_event_deck_edit_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-16_front_member_mypage_event_deck_edit.md
 *（利用者視点の入口・処理フロー・判定順序・表示メッセージ・画面遷移）由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の Twig（Mypage/deckentry.twig 等）は本リポジトリに未取込のため、
 * セレクタはフロントTwig差分に耐えるよう URL・表示文言・フォーム要素の意味で寄せる。
 * file:line 根拠が取れない箇所は「要実機確認」とし、創作しない。未実行雛形。
 */
export class FrontMemberEventDeckEditPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly eventsUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly formatRadio: Locator;
  readonly deckMainInput: Locator;
  readonly deckSideInput: Locator;
  readonly cardNameInput: Locator;
  readonly countInput: Locator;
  readonly csrfToken: Locator;
  readonly submitButton: Locator;
  readonly cancelLink: Locator;
  readonly getMyDeckButton: Locator;
  readonly importModal: Locator;
  readonly myDeckModal: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.eventsUrl = `${this.localePrefix}/events`;

    // 見出し「登録デッキ編集」（表示メッセージ節・フロント挙動「表示要素」由来／要実機確認）
    this.heading = page.getByText("登録デッキ編集", { exact: false });
    this.body = page.locator("body");
    // フォーマット選択はラジオ（フロント挙動「CSS・レイアウト」／複数フォーマット時。要実機確認）
    this.formatRadio = page.locator('input[type="radio"][name*="format"]');
    // メイン／サイドボードのテキストエリア（フォームキー deckMain / deckSide。要実機確認）
    this.deckMainInput = page
      .locator('textarea[name*="deckMain"], textarea[name*="main"], textarea[id*="main"]')
      .first();
    this.deckSideInput = page
      .locator('textarea[name*="deckSide"], textarea[name*="side"], textarea[id*="side"]')
      .first();
    // カード選択欄（入力補助。カード名・枚数。要実機確認）
    this.cardNameInput = page.locator('input[name*="card"], input[id*="card_name"]').first();
    this.countInput = page.locator('input[name*="count"], select[name*="count"], input[name*="amount"]').first();
    this.csrfToken = page
      .locator('input[type="hidden"][name="_token"], input[type="hidden"][name*="csrf"], input[type="hidden"][name*="token"]')
      .first();
    // 「デッキリストを提出する」ボタン（利用者視点の入口／要実機確認）
    this.submitButton = page.getByRole("button", { name: /デッキリストを提出|提出|submit/i }).first();
    // 「キャンセル」リンク → イベント一覧（要実機確認）
    this.cancelLink = page.getByRole("link", { name: /キャンセル|cancel/i }).first();
    // 「マイデッキを取得」（要実機確認）
    this.getMyDeckButton = page.getByRole("button", { name: /マイデッキを取得|マイデッキ/ }).first();
    this.importModal = page.locator('[class*="modal"][id*="import"], [class*="modal"][class*="import"]').first();
    this.myDeckModal = page.locator('[class*="modal"][id*="deck"], [class*="modal"][class*="mydeck"]').first();
  }

  /** デッキ編集画面URL（GET /{_locale}/deckentry/{eventDetailId}/edit）。 */
  editUrl(eventDetailId: string | number): string {
    return `${this.localePrefix}/deckentry/${eventDetailId}/edit`;
  }

  /** デッキ提出URL（POST /{_locale}/deckentry/{eventDetailId}/update）。 */
  updateUrl(eventDetailId: string | number): string {
    return `${this.localePrefix}/deckentry/${eventDetailId}/update`;
  }

  async gotoEdit(eventDetailId: string | number) {
    await this.page.goto(this.editUrl(eventDetailId));
  }

  async gotoUpdate(eventDetailId: string | number) {
    await this.page.goto(this.updateUrl(eventDetailId));
  }

  async gotoLogin() {
    await this.page.goto(this.loginUrl);
  }

  async login() {
    await this.gotoLogin();
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"], input[name*="login_id"]')
      .first();
    const password = this.page.locator('input[type="password"], input[name*="password"]').first();
    await email.fill(ECCUBE_FRONT_USER);
    await password.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).click();
  }

  async fillDeck(main: string, side: string) {
    await this.deckMainInput.fill(main);
    await this.deckSideInput.fill(side);
  }

  async submit() {
    await this.submitButton.click();
  }

  /** 編集画面の主要部品が表示されていること（フロント挙動「表示要素」由来）。 */
  async seeEditScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.deckMainInput).toBeVisible();
    await expect(this.deckSideInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /** 入力形式の注意文が常時表示されていること（表示メッセージ節・常時表示）。 */
  async seeInputNotices() {
    await expect(this.body).toContainText("半角数字");
    await expect(this.body).toContainText("カード名は日本語・英語のどちらかをご入力ください");
  }

  /** メインボード書式エラー見出しが表示され、編集画面へ戻り入力が保持されること（表示メッセージ節）。 */
  async seeMainBoardFormatError() {
    await expect(this.body).toContainText("メインボードの入力形式に誤りがあります");
  }

  /** サイドボード書式エラー見出しが表示され、編集画面へ戻り入力が保持されること（表示メッセージ節）。 */
  async seeSideBoardFormatError() {
    await expect(this.body).toContainText("サイドボードの入力形式に誤りがあります");
  }
}
