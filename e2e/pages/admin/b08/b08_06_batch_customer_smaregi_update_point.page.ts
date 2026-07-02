import { Locator, Page } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * スマレジポイント更新バッチ（B08-06）UIレイヤ Page Object。
 * 納品ケース表 integration_test/e2e/b08_06_batch_customer_smaregi_update_point_e2e_cases.md に対応。
 *
 * 役割: スマレジ連携失敗時に受注へ記録されるポイント連携エラーメッセージが、管理画面の受注編集画面
 *  「ポイントエラーメッセージ」欄に表示される範囲を観測する（E2E-020）。
 *  期待は仕様（失敗時出力「受注サブへのエラーメッセージ記録」正本md:L102／DBカラム point_error_message:L114／IT-26）由来（オラクル独立性）。
 *  エラーメッセージの json 構造・文言は期待値にしない（表示有無で判定）。smaregi_error_flg は画面非表示＝DB内部（IT層担保・対象外）。
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（Twig file:line。付帯表1由来）:
 *  src/Eccube/Resource/template/admin/Order/edit.twig
 *  - カードタイトル     → trans 'ポイントエラーメッセージ'（edit.twig:1798）
 *  - パネル            → #pointErrorMessage（edit.twig:1803）
 *  - エラーメッセージ欄 → #order_pointErrorMessage（form.pointErrorMessage, edit.twig:1805）
 *  入口URL: GET /{admin_route}/order/{id}/edit（admin_order_edit。受注IDは SEED-B08-06-FAIL の連携失敗受注）。
 */
export class SmaregiUpdatePointOrderEditPage {
  readonly page: Page;
  /** ポイントエラーメッセージ欄（#order_pointErrorMessage form.pointErrorMessage edit.twig:1805）。 */
  readonly pointErrorMessage: Locator;
  /** ポイントエラーメッセージ パネル（#pointErrorMessage edit.twig:1803）。 */
  readonly pointErrorMessagePanel: Locator;
  /** カードタイトル「ポイントエラーメッセージ」（edit.twig:1798）。 */
  readonly cardTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pointErrorMessage = page.locator("#order_pointErrorMessage"); // edit.twig:1805 form.pointErrorMessage
    this.pointErrorMessagePanel = page.locator("#pointErrorMessage"); // edit.twig:1803
    this.cardTitle = page.locator("text=ポイントエラーメッセージ"); // edit.twig:1798
  }

  /** 受注編集画面を開く（GET /{admin_route}/order/{id}/edit, admin_order_edit）。 */
  async goto(orderId: string | number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/${orderId}/edit`);
  }
}
