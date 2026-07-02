import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 在庫移動・振替検索/一覧 Page Object。
 * 納品ケース表 integration_test/e2e/m04_08_admin_stock_stock_move_transfer_search_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-08_admin_stock_stock_move_transfer_search_list.md /
 * 基本設計(在庫管理機能) / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_stock_move_transfer`
 * （SearchStockMoveTransferType.php:360-364）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 根拠（getBlockPrefix=admin_search_stock_move_transfer）:
 *  - stock_move_transfer_id → #admin_search_stock_move_transfer_stock_move_transfer_id（index.twig:476 / SearchStockMoveTransferType.php:58）
 *  - move_instruction_id    → #admin_search_stock_move_transfer_move_instruction_id（index.twig:481 / :63）
 *  - tracking_no            → #admin_search_stock_move_transfer_tracking_no（index.twig:486 / :68）
 *  - create_date_start/end  → #admin_search_stock_move_transfer_create_date_start/_end（index.twig:539,541 / :145,:158 single_text）
 *  - move_from_stock_date_start/end → #admin_search_stock_move_transfer_move_from_stock_date_start/_end（index.twig:576,578 / :217,:230）
 *  - move_to_stock_date_start/end   → #admin_search_stock_move_transfer_move_to_stock_date_start/_end（index.twig:602,604 / :266,:279）
 *  - 検索ボタン「検索」trans admin.common.search（index.twig:617 / messages.ja.yaml:1446）
 *  - 件数見出し「検索結果：%count%件が該当しました」trans admin.common.search_result（index.twig:619 / messages.ja.yaml:1538）
 *  - 0件「検索条件に合致するデータが見つかりませんでした」trans admin.common.search_no_result（index.twig:762 / messages.ja.yaml:1542）
 *  - 日付相関エラー「終了日は、開始日より大きく設定してください」trans admin.common.date_end_error（SearchStockMoveTransferType.php:306 / messages.ja.yaml:1419）
 *  - 詳細検索枠 #stockMoveTransferSearchDetail（index.twig:534 collapse。has_errors時のみ show）/ トグル aria-controls 同名（index.twig:527-528）
 *  - CSVファイル登録カード見出し admin.stock.move_transfer.csv_file_registration（index.twig:459 / messages.ja.yaml:5142）
 *  - 在庫移動CSV登録ボタン admin.stock.move_transfer.csv_register_move（index.twig:463 data-bs-target=#stockMoveCsvRegisterModal / messages.ja.yaml:5143）
 *  - 在庫振替CSV登録ボタン admin.stock.move_transfer.csv_register_transfer（index.twig:464 data-bs-target=#stockTransferCsvRegisterModal / messages.ja.yaml:5144）
 *  - 移動指示作成ボタン #stockMoveTransferCreateInstruction（index.twig:625 / no_selection messages.ja.yaml:5159）
 *  - 在庫移動振替CSV出力リンク a[href$="/move_transfer/csv_export"]（index.twig:627 path admin_stock_move_transfer_csv_export）
 *  - 戻しリストCSV出力ボタン #stockMoveTransferReturnListCsvExport（index.twig:628 / no_selection messages.ja.yaml:5139）
 *  - 戻しリストPDF出力ボタン #stockMoveTransferReturnListPdfExport（index.twig:629）
 *  - 在庫移動CSV雛形リンク a[href$="/move_transfer/move_csv_template"]（index.twig:839 path admin_stock_move_transfer_move_csv_template）
 *  - 在庫振替CSV雛形リンク a[href$="/move_transfer/transfer_csv_template"]（index.twig:936 path admin_stock_move_transfer_transfer_csv_template）
 *  - 表示件数プルダウン #page_count_pulldown（index.twig:639。pagination かつ totalItemCount>0 時のみ描画）
 *  - 一覧の在庫移動振替IDリンク（target=_blank） td a[href*="/stock/move/"] / [*="/stock/transfer/"]（index.twig:697,701）
 */
export class StockStockMoveTransferSearchListPage {
  readonly page: Page;
  readonly url: string; // 一覧の入口 GET,POST /{admin_route}/product/stock/move_transfer

  readonly searchForm: Locator; // #form_search_stock_move_transfer（index.twig:470）
  readonly stockMoveTransferId: Locator; // 在庫移動・振替ID
  readonly trackingNo: Locator; // 送り状No.
  readonly searchButton: Locator; // 「検索」submit
  readonly searchDetail: Locator; // 詳細検索 collapse（has_errors時のみ show）
  readonly searchDetailToggle: Locator; // 詳細検索トグル
  readonly createDateStart: Locator; // 登録日(開始)
  readonly createDateEnd: Locator; // 登録日(終了)
  readonly moveFromStockDateStart: Locator; // 出庫日(開始)
  readonly moveFromStockDateEnd: Locator; // 出庫日(終了)
  readonly moveToStockDateStart: Locator; // 入庫日(開始)
  readonly moveToStockDateEnd: Locator; // 入庫日(終了)

  readonly csvFileRegistrationCard: Locator; // CSVファイル登録カード見出し
  readonly moveCsvRegisterButton: Locator; // 在庫移動CSV登録ボタン
  readonly transferCsvRegisterButton: Locator; // 在庫振替CSV登録ボタン
  readonly moveCsvModal: Locator; // 在庫移動CSV登録モーダル
  readonly transferCsvModal: Locator; // 在庫振替CSV登録モーダル
  readonly moveCsvTemplateLink: Locator; // 在庫移動CSV雛形リンク
  readonly transferCsvTemplateLink: Locator; // 在庫振替CSV雛形リンク

  readonly moveTransferCsvExportLink: Locator; // 在庫移動振替CSV出力リンク
  readonly returnListCsvButton: Locator; // 戻しリストCSV出力ボタン
  readonly returnListPdfButton: Locator; // 戻しリストPDF出力ボタン
  readonly createInstructionButton: Locator; // 移動指示作成ボタン

  readonly pageCountPulldown: Locator; // 表示件数 select
  readonly firstIdLink: Locator; // 一覧先頭の在庫移動振替IDリンク
  // 見出し「在庫移動振替一覧」は default_frame 側のページ見出し出力先クラスが要実機確認のため
  // 専用セレクタを創作せず、spec ではテキスト存在で確認する（trans admin.stock.move_transfer.title / messages.ja.yaml:5115）。

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer`;

    this.searchForm = page.locator("#form_search_stock_move_transfer");
    this.stockMoveTransferId = page.locator(
      "#admin_search_stock_move_transfer_stock_move_transfer_id"
    );
    this.trackingNo = page.locator("#admin_search_stock_move_transfer_tracking_no");
    this.searchButton = page.locator(
      '#form_search_stock_move_transfer button[type="submit"]'
    );
    this.searchDetail = page.locator("#stockMoveTransferSearchDetail");
    this.searchDetailToggle = page.locator(
      '[aria-controls="stockMoveTransferSearchDetail"]'
    );
    this.createDateStart = page.locator(
      "#admin_search_stock_move_transfer_create_date_start"
    );
    this.createDateEnd = page.locator(
      "#admin_search_stock_move_transfer_create_date_end"
    );
    this.moveFromStockDateStart = page.locator(
      "#admin_search_stock_move_transfer_move_from_stock_date_start"
    );
    this.moveFromStockDateEnd = page.locator(
      "#admin_search_stock_move_transfer_move_from_stock_date_end"
    );
    this.moveToStockDateStart = page.locator(
      "#admin_search_stock_move_transfer_move_to_stock_date_start"
    );
    this.moveToStockDateEnd = page.locator(
      "#admin_search_stock_move_transfer_move_to_stock_date_end"
    );

    this.csvFileRegistrationCard = page.locator(".card-title", {
      hasText: "CSVファイル登録",
    });
    this.moveCsvRegisterButton = page.locator(
      'button[data-bs-target="#stockMoveCsvRegisterModal"]'
    );
    this.transferCsvRegisterButton = page.locator(
      'button[data-bs-target="#stockTransferCsvRegisterModal"]'
    );
    this.moveCsvModal = page.locator("#stockMoveCsvRegisterModal");
    this.transferCsvModal = page.locator("#stockTransferCsvRegisterModal");
    this.moveCsvTemplateLink = page.locator(
      'a[href$="/move_transfer/move_csv_template"]'
    );
    this.transferCsvTemplateLink = page.locator(
      'a[href$="/move_transfer/transfer_csv_template"]'
    );

    this.moveTransferCsvExportLink = page.locator(
      'a[href$="/move_transfer/csv_export"]'
    );
    this.returnListCsvButton = page.locator("#stockMoveTransferReturnListCsvExport");
    this.returnListPdfButton = page.locator("#stockMoveTransferReturnListPdfExport");
    this.createInstructionButton = page.locator(
      "#stockMoveTransferCreateInstruction"
    );

    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.firstIdLink = page
      .locator(
        'table a[href*="/stock/move/"], table a[href*="/stock/transfer/"]'
      )
      .first();
  }

  /** 一覧を開く（GET /{admin_route}/product/stock/move_transfer 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 既定条件のまま検索POST（「検索」押下）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** 在庫移動・振替IDで検索POST。 */
  async searchByStockMoveTransferId(value: string) {
    await this.stockMoveTransferId.fill(value);
    await this.searchButton.click();
  }

  /** 詳細検索枠を開く（登録日・出庫日・入庫日の各欄は collapse 内にあるため操作前に開く）。 */
  async openSearchDetail() {
    if (!(await this.searchDetail.isVisible())) {
      await this.searchDetailToggle.first().click();
      await expect(this.searchDetail).toBeVisible();
    }
  }

  /** 登録日レンジで検索POST（相関エラー検証用）。詳細検索枠を開いてから入力する。 */
  async searchByCreateDateRange(start: string, end: string) {
    await this.openSearchDetail();
    await this.createDateStart.fill(start);
    await this.createDateEnd.fill(end);
    await this.searchButton.click();
  }

  /** 出庫日レンジで検索POST（相関エラー検証用）。 */
  async searchByMoveFromStockDateRange(start: string, end: string) {
    await this.openSearchDetail();
    await this.moveFromStockDateStart.fill(start);
    await this.moveFromStockDateEnd.fill(end);
    await this.searchButton.click();
  }

  /** 入庫日レンジで検索POST（相関エラー検証用）。 */
  async searchByMoveToStockDateRange(start: string, end: string) {
    await this.openSearchDetail();
    await this.moveToStockDateStart.fill(start);
    await this.moveToStockDateEnd.fill(end);
    await this.searchButton.click();
  }

  /** 検索フォームの主要UI部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.stockMoveTransferId).toBeVisible();
    await expect(this.trackingNo).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 件数見出し（検索結果：N件が該当しました）が表示されること。 */
  async seeResultCountHeading() {
    await expect(this.page.getByText("検索結果")).toBeVisible();
  }

  /** 検索結果0件メッセージが表示されること（trans admin.common.search_no_result）。 */
  async seeNoResult() {
    await expect(
      this.page.getByText("検索条件に合致するデータが見つかりませんでした")
    ).toBeVisible();
  }

  /** 日付相関エラーメッセージが表示されること（trans admin.common.date_end_error）。 */
  async seeDateEndError() {
    await expect(
      this.page.getByText("終了日は、開始日より大きく設定してください")
    ).toBeVisible();
  }
}
