import { APIRequestContext, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 会員/店舗「店頭モニターに受注管理から登録した番号札を表示」（F06-25）Page Object。
 * integration_test/e2e/f06_25_front_member_store_order_call_number_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-25_front_member_store_order_call_number.md（利用者視点の入口・
 * フロント挙動・処理フロー・API/バッチ結果・権限認可）由来（オラクル独立性）。
 * pf-eccube3 の Twig（Waiting/waiting_number.twig）は本リポジトリに未取込のため、セレクタはフロント
 * Twig差分に耐えるよう URL・要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 本機能は表示専用・利用者操作なし・会員ログイン不要（店頭設置モニター）。
 */
export class FrontStoreOrderCallNumberPage {
  readonly page: Page;
  readonly localePrefix: string;
  /** 店内モニター画面（第1）: GET /{_locale}/waiting_number_1 */
  readonly monitor1Url: string;
  /** 店内モニター画面（第2）: GET /{_locale}/waiting_number_2 */
  readonly monitor2Url: string;
  /** 注文番号取得API: GET /{_locale}/waiting_api/get_waiting （JSON配列を返す） */
  readonly waitingApiUrl: string;

  readonly body: Locator;
  /** 番号表示枠（最大25区画）。要実機確認：Waiting/waiting_number.twig の番号表示枠マークアップ。 */
  readonly numberFrame: Locator;
  /** 新着検知用の音声要素。要実機確認：waiting_number.twig / waiting_monitor.js の audio 要素。 */
  readonly audioElement: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.monitor1Url = `${this.localePrefix}/waiting_number_1`;
    this.monitor2Url = `${this.localePrefix}/waiting_number_2`;
    this.waitingApiUrl = `${this.localePrefix}/waiting_api/get_waiting`;

    this.body = page.locator("body");
    // 番号表示枠（最大25区画の入力欄）。Twig差分に備え input 群/番号表示用コンテナで寄せる（要実機確認）。
    this.numberFrame = page.locator('input, [class*="waiting"], [id*="waiting"], [class*="number"]');
    // 新着検知用の音声要素（要実機確認）。
    this.audioElement = page.locator("audio, [id*='audio'], [class*='sound']");
  }

  async gotoMonitor1() {
    await this.page.goto(this.monitor1Url);
  }

  async gotoMonitor2() {
    await this.page.goto(this.monitor2Url);
  }

  /** モニター画面が表示され、番号表示枠を持つこと（仕様：フロント挙動 表示要素）。 */
  async seeMonitorScreen() {
    await expect(this.body).toBeVisible();
    await expect(this.numberFrame.first()).toBeVisible();
  }

  /**
   * 注文番号取得APIを呼び、レスポンスを返す（API/統合レイヤ）。
   * baseURL は playwright.config（E2E_BASE_URL）。呼び出し側で status/JSON配列を検証する。
   * 期待は設計書「注文番号取得API（成功時はJSON配列をHTTP200で返す）」由来。
   */
  async getWaitingApi(request: APIRequestContext) {
    return request.get(this.waitingApiUrl);
  }
}
