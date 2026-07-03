import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「お問い合わせ履歴（一覧・詳細）」（F06-23）Page Object。
 * integration_test/e2e/f06_23_front_contact_history_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-23_front_contact_history.md（利用者視点の入口・処理フロー・
 * フロント挙動・表示メッセージ・権限認可）由来。pf-eccube3 の Twig（Contact/history.twig・
 * Contact/history_detail.twig）は本リポジトリに未取込のため、セレクタはフロントTwig差分に耐えるよう
 * URL・表示文言・要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 本機能は閲覧専用（参照系）。一覧＝GET /contact/history、詳細＝GET /contact/history/{id}/detail。
 * URLの locale/店舗プレフィックスは要実機確認（設計書は `/contact/history` 記載、他フロント画面に倣い付与）。
 */
export class FrontContactHistoryPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly historyUrl: string;

  readonly body: Locator;
  /** 会員ログイン画面のパスワード欄（未ログイン誘導の確認用）。 */
  readonly loginPasswordInput: Locator;
  /** 一覧見出し「お問い合わせ履歴一覧」（要実機確認：Contact/history.twig）。 */
  readonly listHeading: Locator;
  /** 詳細見出し「お問い合わせ履歴詳細」（要実機確認：Contact/history_detail.twig）。 */
  readonly detailHeading: Locator;
  /** 総件数表示（「N件」）。文言「件」を含む領域で寄せる（要実機確認）。 */
  readonly totalCount: Locator;
  /** 「マイページ」ボタン（一覧→マイページトップ）。 */
  readonly mypageButton: Locator;
  /** 一覧の件名リンク（→詳細）。href に /contact/history/{id}/detail を含む内部リンク（要実機確認）。 */
  readonly subjectLinks: Locator;
  /** 詳細の「戻る」リンク（history.go(-1)）。 */
  readonly backLink: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.historyUrl = `${this.localePrefix}/contact/history`;

    this.body = page.locator("body");
    this.loginPasswordInput = page
      .locator('input[type="password"], input[name*="login_pass"], input[name*="password"]')
      .first();
    // 見出しは heading ロールと本文文言の双方で拾う（要実機確認）。
    this.listHeading = page.getByRole("heading", { name: /お問い合わせ履歴一覧/ }).first();
    this.detailHeading = page.getByRole("heading", { name: /お問い合わせ履歴詳細/ }).first();
    // 総件数「N件」。件数書式に依存しないよう「件」を含む要素で寄せる（要実機確認）。
    this.totalCount = page.getByText(/\d+\s*件/).first();
    this.mypageButton = page.getByRole("link", { name: /マイページ/ }).first();
    // 件名リンク＝詳細への内部リンク（要実機確認）。
    this.subjectLinks = page.locator(
      'a[href*="/contact/history/"][href*="detail"]',
    );
    this.backLink = page.getByRole("link", { name: /戻る/ }).first();
  }

  /** お問い合わせ履歴詳細URL（存在しない/他会員IDの検証にも使う）。 */
  detailUrl(id: number | string): string {
    return `${this.localePrefix}/contact/history/${id}/detail`;
  }

  async gotoList() {
    await this.page.goto(this.historyUrl);
  }

  async gotoDetail(id: number | string) {
    await this.page.goto(this.detailUrl(id));
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  /** 会員ログイン（資格情報は環境変数。会員ログイン機能を正とする）。 */
  async login() {
    await this.gotoLoginPage();
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"]')
      .first();
    await email.fill(ECCUBE_FRONT_USER);
    await this.loginPasswordInput.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).first().click();
  }

  /** 未ログインでお問い合わせ履歴配下へアクセスした際、会員ログイン画面へ誘導されていること。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.loginPasswordInput).toBeVisible();
  }

  /** 一覧見出しが表示されていること（仕様：表示メッセージ 一覧見出し）。 */
  async seeListHeading() {
    await expect(this.listHeading).toBeVisible();
  }

  /** 一覧に総件数「N件」が表示されていること（仕様：業務ルール 件数）。 */
  async seeTotalCount() {
    await expect(this.totalCount).toBeVisible();
  }

  /** 一覧の表示要素（見出し・総件数・マイページボタン）が表示されていること（仕様：フロント挙動 表示要素）。 */
  async seeListScreen() {
    await expect(this.listHeading).toBeVisible();
    await expect(this.totalCount).toBeVisible();
    await expect(this.mypageButton).toBeVisible();
  }

  /** 詳細見出しが表示されていること（仕様：表示メッセージ 詳細見出し）。 */
  async seeDetailHeading() {
    await expect(this.detailHeading).toBeVisible();
  }

  /** 指定IDの詳細で当該お問い合わせ内容（詳細見出し）を表示していないこと（仕様：エッジケース 非存在/他会員ID）。 */
  async seeDetailNotShown() {
    await expect(this.detailHeading).toHaveCount(0);
  }
}
