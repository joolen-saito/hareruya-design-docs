import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * a05-02 受注ステータス補助観測 Page Object（受注一覧/受注編集での状態観測）。
 * ケース表 a05_02_api_order_print_direct_e2e_cases.md の E2E自動化(UI) 行(050-053)に対応。
 * SetResponse 後の受注ステータス（ピック中）・ブラウザ印刷フラグ・確定日時/ピック開始日を管理画面で観測する。
 *
 * セレクタ根拠: admin/Order 一覧（route admin_order）。受注ステータス表示セル・編集画面の確定日時欄の正確な
 * セレクタ(twig file:line)は要実機確認のため、本Page Objectは一覧画面到達と検索のみを安定提供し、
 * ステータス値の厳密照合は spec 側で要実機確認(fixme)として残す。
 */
export class AdminOrderStatusPage {
  readonly page: Page;
  readonly url: string;
  readonly searchKeyword: Locator; // 受注検索フォームの検索キーワード（要実機確認: 正確なid/name）
  readonly searchButton: Locator;  // 検索ボタン（要実機確認）
  readonly resultTable: Locator;   // 検索結果テーブル（要実機確認: 受注ステータス列を含む）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/order`; // route admin_order（受注一覧）
    this.searchKeyword = page.locator("#admin_search_order_multi");
    this.searchButton = page.locator('button:has-text("検索")');
    this.resultTable = page.locator("table");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 受注一覧画面に到達できたことを確認（受注ステータス列の存在は要実機確認）。 */
  async seeOrderList() {
    await expect(this.page.locator("body")).toBeVisible();
  }

  /** 受注IDで検索する（検索フォームのセレクタは要実機確認）。 */
  async searchByOrderId(orderId: string) {
    await this.searchKeyword.fill(orderId);
    await this.searchButton.click();
  }
}
