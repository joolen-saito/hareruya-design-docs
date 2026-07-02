import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 送り状CSV出力 Page Object（受注一覧 / 出荷指示編集 の2入口＋ダウンロードエンドポイント）。
 * 納品ケース表 integration_test/e2e/m05_07_admin_order_order_labels_csv_export_e2e_cases.md に対応。
 * 期待結果は仕様(functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md / 観点表)由来（オラクル独立性）。
 * 実装(Twig/Controller)から取得したのはセレクタ（位置情報）のみで、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース）:
 *  - 受注一覧 送り状出力ボタン #labelsExport（Order/index.twig:1211 / 文言 trans admin.order.output_labels_Export=「送り状出力」 messages.ja.yaml:2296）
 *  - 受注一覧 一括フォーム #form_bulk（Order/index.twig:1095。CSRF hidden Order/index.twig:1096）
 *  - 受注一覧 各行チェックボックス name="ids[]" id=check_{shippingId}（Order/index.twig:1249）
 *  - 受注一覧 未チェックalert「チェックボックスが選択されていません」（Order/index.twig:87・JSハードコード文字列）
 *  - 出荷指示編集 送り状出力ボタン #labelsExport（ShippingStandby/edit.twig:129 / 文言 trans admin.stock.move_instruction.csv_download_invoice=「送り状CSVダウンロード」 messages.ja.yaml:4968）
 *  - 出荷指示編集 一括フォーム #form_bulk（ShippingStandby/edit.twig:113。送信前に order_ids から hidden ids[] を組立 edit.twig:44-60）
 *  - ダウンロードルート admin_labels_export=/{admin_route}/standby/labels（OrderController.php:757。ids が空/非配列で 404 :769-771。ファイル名 labels_<YmdHis>.csv ・Content-Disposition attachment ShippingStandbyCsvExporterService.php:133-137）
 */
export class AdminOrderOrderLabelsCsvExportPage {
  readonly page: Page;
  readonly orderListUrl: string; // 受注一覧
  readonly shippingStandbyListUrl: string; // 出荷指示一覧
  readonly labelsEndpointUrl: string; // 送り状CSV ダウンロードエンドポイント

  readonly formBulk: Locator; // #form_bulk（受注一覧/出荷指示編集 共通 id）
  readonly labelsExportButton: Locator; // #labelsExport（送り状出力ボタン）
  readonly rowCheckboxes: Locator; // input[name="ids[]"]（受注一覧 各行・出荷ID）
  readonly loginId: Locator; // 管理ログイン画面 #login_id（未認証誘導の判定用 login.twig:26）

  constructor(page: Page) {
    this.page = page;
    this.orderListUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;
    this.shippingStandbyListUrl = `/${ECCUBE_ADMIN_ROUTE}/standby`;
    this.labelsEndpointUrl = `/${ECCUBE_ADMIN_ROUTE}/standby/labels`;

    this.formBulk = page.locator("#form_bulk");
    this.labelsExportButton = page.locator("#labelsExport");
    this.rowCheckboxes = page.locator('input[name="ids[]"]');
    this.loginId = page.locator("#login_id");
  }

  async gotoOrderList() {
    await this.page.goto(this.orderListUrl);
  }

  /** 出荷指示編集画面（要: 実在する出荷指示ID。テスト側でシード値を渡す）。 */
  async gotoShippingStandbyEdit(id: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/standby/${id}/edit`);
  }

  /** ids を付けずに GET でエンドポイントへ直接アクセスし、HTTP 応答を返す（ids 空=404 の判定用）。 */
  async gotoLabelsEndpointWithoutIds() {
    return this.page.goto(this.labelsEndpointUrl);
  }

  /** ids を「配列でない」スカラ値で GET 直接アクセスし、HTTP 応答を返す（ids 非配列=404 の判定用）。
   *  期待は仕様(処理フロー#3: 配列でない/空 → 404)由来。scalar の具体値はオラクルではなく入力データ。 */
  async gotoLabelsEndpointWithScalarId(value: string | number = 1) {
    return this.page.goto(`${this.labelsEndpointUrl}?ids=${value}`);
  }

  /** 受注一覧の出荷行チェックボックス数。0 のときシード不足（出荷行が無い）。 */
  async rowCount(): Promise<number> {
    return this.rowCheckboxes.count();
  }

  /** 先頭の出荷行チェックボックスを選択する。 */
  async checkFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** 送り状出力ボタンを押下する。 */
  async clickLabelsExport() {
    await this.labelsExportButton.click();
  }

  /** 先頭行を選択して送り状出力を押下し、ダウンロード発火を待って Download を返す。 */
  async exportViaListAndWaitDownload() {
    await this.checkFirstRow();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.labelsExportButton.click(),
    ]);
    return download;
  }

  /** 受注一覧の一括フォーム・送り状出力ボタンが仕様どおり表示されること。 */
  async seeListBulkUi() {
    await expect(this.formBulk).toBeVisible();
    await expect(this.labelsExportButton).toBeVisible();
  }
}
