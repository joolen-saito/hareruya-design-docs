import { Locator, Page, expect } from "@playwright/test";
// 注: 本 page object は e2e/pages/admin/a06 配下（login.page.ts より1階層深い）。
// config は e2e/config にあるため相対は `../../../config`（login.page.ts の `../../config` を1段繰り下げ）。
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * a06-04 店頭買取受注詳細 Page Object（UI観測レイヤ E2E-A06-04-040/041 用）。
 * ケース表 integration_test/e2e/a06_04_api_store_purchase_otc_buy_order_free_comment_e2e_cases.md（付帯表1）に対応。
 * APIで更新したフリーコメントが管理画面詳細に反映されること（040）・他項目/ステータスが不変であること（041）を観測する未実行雛形。
 *
 * セレクタ根拠（正本md準拠・実装からは位置情報のみ file:line で取得）:
 *  - 詳細ルート: admin_otcbuyorder_detail path `/%eccube_admin_route%/otcbuyorder/{otcBuyOrderId}`（OtcBuyOrderController.php:228）。
 *  - フリーコメント欄: `form_widget(form.freeComment)`（detail.twig:423-426）。textarea の id 末尾 `_freeComment` は要実機確認。
 *  - 保存ボタン・他項目(ステータス等)のセレクタは detail.twig の具体 id が要実機確認（付帯表4・041）。
 */
export class OtcBuyOrderDetailPage {
  readonly page: Page;
  readonly freeComment: Locator;   // detail.twig:425 textarea（id末尾 _freeComment は要実機確認）
  readonly saveButton: Locator;    // 詳細フォームの保存/登録ボタン（要実機確認: 具体セレクタ）

  constructor(page: Page) {
    this.page = page;
    // id末尾一致で拾う（プレフィックスのForm名は要実機確認）。
    this.freeComment = page.locator('textarea[id$="_freeComment"]');
    // 保存ボタンは文言「登録」を仮置き（要実機確認: detail.twig の submit セレクタ）。
    this.saveButton = page.locator('button:has-text("登録"), button:has-text("保存")').first();
  }

  /** 店頭買取受注詳細を開く（admin_otcbuyorder_detail）。 */
  async goto(otcBuyOrderId: string | number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/${otcBuyOrderId}`);
  }

  /** フリーコメント欄の現在値を取得する（textarea の value）。 */
  async freeCommentValue(): Promise<string> {
    return this.freeComment.inputValue();
  }

  /** フリーコメント欄が表示されていることを確認する。 */
  async seeFreeComment() {
    await expect(this.freeComment).toBeVisible();
  }

  /** 画面操作でフリーコメントを保存する（UI経由更新を使う場合。本機能の更新はAPI主だが補助用）。 */
  async save() {
    await this.saveButton.click();
  }
}
