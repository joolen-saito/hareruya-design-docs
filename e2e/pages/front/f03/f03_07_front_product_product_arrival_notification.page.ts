import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_SHOP,
} from "../../../config/default.config";

/**
 * フロント 商品「入荷時通知」（F03-07）Page Object。
 * integration_test/e2e/f03_07_front_product_product_arrival_notification_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f03-07_front_product_product_arrival_notification.md
 * （処理フロー・判定順序・表示メッセージ・権限認可）由来。
 * ec-cube-enterprise/pf-eccube3(HareruyaEc) の Twig は本リポジトリに未取込のため、セレクタは
 * URL・表示文言・要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontArrivalNotificationPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly notifyListUrl: string;
  readonly loginUrl: string;
  /** 入荷通知の登録・取消の非同期エンドポイント（POST）。要実機確認: HareruyaEc カート pushReceive。 */
  readonly pushReceivePath: string;

  readonly loginHeading: Locator;
  readonly passwordInput: Locator;
  /** 入荷通知ボタン（商品詳細・商品一覧）。要実機確認: HareruyaEc 商品Twig。 */
  readonly arrivalButton: Locator;
  /** 依頼・キャンセルの確認ダイアログ。要実機確認。 */
  readonly confirmDialog: Locator;
  /** 入荷通知依頼一覧のコンテナ。要実機確認: Mypage/notifylist Twig。 */
  readonly notifyList: Locator;
  readonly body: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.notifyListUrl = `${this.localePrefix}/mypage/notifylist`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.pushReceivePath = `${this.localePrefix}/cart/pushReceive`;

    this.body = page.locator("body");
    this.loginHeading = page.getByRole("heading", { name: /ログイン/ }).first();
    this.passwordInput = page
      .locator('input[name*="login_pass"], input[type="password"], input[name*="password"]')
      .first();
    // 入荷通知ボタン。Twig差分に備え文言で拾う（要実機確認）。
    this.arrivalButton = page.getByRole("button", { name: /入荷通知/ }).first();
    this.confirmDialog = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    this.notifyList = page.locator('[class*="notify"], table, .ec-mypageRole').first();
  }

  async gotoNotifyList() {
    await this.page.goto(this.notifyListUrl);
  }

  /** 未ログインで保護URL（入荷通知依頼一覧）にアクセスすると会員ログイン画面へ誘導されること。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.passwordInput).toBeVisible();
  }
}
