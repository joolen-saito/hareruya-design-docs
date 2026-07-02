import { Locator, Page, expect } from "@playwright/test";
// 注: 本 page object は e2e/pages/admin/a07 配下（login.page.ts より1階層深い）。
// config は e2e/config にあるため相対は `../../../config`（login.page.ts の `../../config` を1段繰り下げ）。
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * a07-03 ネット買取受注（買取管理）編集画面 Page Object（UI観測レイヤ E2E-A07-03-040/041 用）。
 * ケース表 integration_test/e2e/a07_03_api_online_purchase_buy_order_free_comment_e2e_cases.md（付帯表1）に対応。
 * APIで更新したフリーコメント（メモ）が管理画面の編集画面に反映されること（040）・他項目/ステータスが不変であること（041）を観測する未実行雛形。
 *
 * セレクタ根拠（正本md準拠・実装からは位置情報のみ file:line で取得）:
 *  - 編集ルート: admin_purchase_edit path `/%eccube_admin_route%/purchase/{id}/edit`（PurchaseController.php:199）。
 *  - フリーコメント（メモ）欄: `form_widget(form.memo)`（Purchase/detail.twig:349／親div id `edit_purchase_info_box__memo` :348）。
 *    textarea の id 末尾 `_memo` は要実機確認（Form名プレフィックスは未検証）。
 *  - 保存ボタン・他項目(受注ステータス等)のセレクタは detail.twig の具体 id が要実機確認（付帯表4・041）。
 */
export class BuyOrderEditPage {
  readonly page: Page;
  readonly memo: Locator;        // detail.twig:349 form_widget(form.memo)（親div id edit_purchase_info_box__memo :348。textarea id末尾 _memo は要実機確認）
  readonly memoBox: Locator;     // detail.twig:348 親div id=edit_purchase_info_box__memo
  readonly saveButton: Locator;  // 編集フォームの保存/登録ボタン（要実機確認: 具体セレクタ）

  constructor(page: Page) {
    this.page = page;
    // 親div id（detail.twig:348）配下の textarea を id末尾一致で拾う（プレフィックスのForm名は要実機確認）。
    this.memoBox = page.locator("#edit_purchase_info_box__memo");
    this.memo = page.locator('#edit_purchase_info_box__memo textarea, textarea[id$="_memo"]').first();
    // 保存ボタンは文言「登録」を仮置き（要実機確認: detail.twig の submit セレクタ）。
    this.saveButton = page.locator('button:has-text("登録"), button:has-text("保存")').first();
  }

  /** ネット買取受注編集画面を開く（admin_purchase_edit／PurchaseController.php:199）。 */
  async goto(purchaseId: string | number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/${purchaseId}/edit`);
  }

  /** フリーコメント（メモ）欄の現在値を取得する（textarea の value）。 */
  async memoValue(): Promise<string> {
    return this.memo.inputValue();
  }

  /** フリーコメント（メモ）欄が表示されていることを確認する。 */
  async seeMemo() {
    await expect(this.memo).toBeVisible();
  }

  /** 画面操作でフリーコメント（メモ）を保存する（UI経由更新を使う場合。本機能の更新はAPI主だが補助用）。 */
  async save() {
    await this.saveButton.click();
  }
}
