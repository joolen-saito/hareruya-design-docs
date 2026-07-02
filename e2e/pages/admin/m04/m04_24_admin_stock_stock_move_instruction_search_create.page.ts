import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 在庫移動指示リスト作成/検索 Page Object（一覧・検索 / 詳細 / 各モーダル）。
 * 納品ケース表 integration_test/e2e/m04_24_admin_stock_stock_move_instruction_search_create_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-24_admin_stock_stock_move_instruction_search_create.md /
 * 基本設計(在庫管理機能) / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 根拠（検索: getBlockPrefix=admin_search_stock_move_instruction / SearchStockMoveInstructionType.php:177-180）:
 *  - move_from_base_info  → #admin_search_stock_move_instruction_move_from_base_info（index.twig:85 / :46）
 *  - move_to_base_info    → #admin_search_stock_move_instruction_move_to_base_info（index.twig:90 / :53）
 *  - instruction_id       → #admin_search_stock_move_instruction_instruction_id（index.twig:95 / :60）
 *  - stock_move_transfer_id → #admin_search_stock_move_instruction_stock_move_transfer_id（index.twig:100 / :65）
 *  - create_date_start/end → #admin_search_stock_move_instruction_create_date_start/_end（index.twig:109,111 / :70,:88 single_text）
 *  - update_date_start/end → #admin_search_stock_move_instruction_update_date_start/_end（index.twig:118,120 / :106,:124）
 *  - shipment_status_not_done/done → #admin_search_stock_move_instruction_shipment_status_not_done/_done（index.twig:131,134 / :142,:146 checkbox）
 *  - 検索ボタン「検索」trans admin.common.search（index.twig:141 / messages.ja.yaml:1446）
 * 一覧・カード・モーダル:
 *  - 検索カード見出し「在庫移動指示検索」trans admin.stock.move_instruction.search_title（index.twig:75 / messages.ja.yaml:4947）
 *  - CSVファイル登録カード見出し trans admin.stock.move_instruction.csv_registration（index.twig:65 / messages.ja.yaml:4972）
 *  - 在庫移動実績CSV登録ボタン trans admin.stock.move_instruction.csv_registration_button（index.twig:68 data-bs-target=#csvRecordRegistrationModal / messages.ja.yaml:4973）
 *  - 件数見出し「検索結果：%count%件が該当しました」trans admin.common.search_result（index.twig:158 / messages.ja.yaml:1538）
 *  - 未検索プロンプト「検索条件を入力し、検索ボタンをクリックしてください。」trans admin.stock.move_instruction.search_first（index.twig:164,236 / messages.ja.yaml:4966）
 *  - 0件「検索条件に合致するデータが見つかりませんでした」trans admin.common.search_no_result（index.twig:231 / messages.ja.yaml:1542）
 *  - 在庫移動実績入力用CSVダウンロードリンク a[href$="move-instruction/csv-template"]（index.twig:160 path admin_stock_move_instruction_csv_download_record / messages.ja.yaml:4967）
 *  - 送り状CSVダウンロードボタン #stockMoveInstructionLabelsExport（index.twig:161 / 未選択alert messages.ja.yaml:4969）
 *  - 全選択 #checkAll（index.twig:183）/ 行チェック .row-check[name="ids[]"]（index.twig:203）
 *  - 移動指示IDリンク a[href*="move-instruction/"]（index.twig:205 path admin_stock_move_instruction_detail）
 *  - 送り状No.登録ボタン .btn-tracking-register（index.twig:218 / messages.ja.yaml:4996）
 *  - 送り状No.登録モーダル #trackingRegisterModal / #trackingRegisterTrackingNo（index.twig:251,263）
 *  - 在庫移動実績CSV登録モーダル #csvRecordRegistrationModal / file #csvRecordImportFile / 送信 #csvRecordUploadButton(disabled)（index.twig:276,299,336）
 * 詳細（getBlockPrefix=admin_stock_move_instruction_detail / StockMoveInstructionDetailType.php:60-63）:
 *  - 詳細見出し「在庫移動指示詳細」trans admin.stock.move_instruction.detail_title（detail.twig:5 / messages.ja.yaml:4987）
 *  - 詳細セクション見出し「在庫移動指示情報」trans admin.stock.move_instruction.detail_section_title（detail.twig:14 / messages.ja.yaml:4989）
 *  - 送り状No. → #admin_stock_move_instruction_detail_trackingNo（detail.twig:55 / :34 Textarea。最大長は設計65535byteが上位オラクル。実装側Form制約値はオラクル化しない＝不具合候補#4）
 *  - 備考 → #admin_stock_move_instruction_detail_memo（detail.twig:80 / :42 Textarea）
 *  - 登録ボタン「登録」trans admin.stock.move_instruction.register（detail.twig:83 / messages.ja.yaml:4994）
 *  - 削除ボタン「削除」trans admin.stock.move_instruction.delete（detail.twig:85 disabled / detail.twig:87 modal起動 / messages.ja.yaml:4995）
 *  - 削除確認モーダル #deleteInstructionModal / 確定「削除」trans admin.common.delete（detail.twig:145,159 / messages.ja.yaml:1444）
 */
export class StockStockMoveInstructionSearchCreatePage {
  readonly page: Page;
  readonly listUrl: string;

  // --- 検索フォーム ---
  readonly searchForm: Locator;
  readonly moveFromBaseInfo: Locator;
  readonly moveToBaseInfo: Locator;
  readonly instructionId: Locator;
  readonly stockMoveTransferId: Locator;
  readonly createDateStart: Locator;
  readonly createDateEnd: Locator;
  readonly updateDateStart: Locator;
  readonly updateDateEnd: Locator;
  readonly shipmentStatusNotDone: Locator;
  readonly shipmentStatusDone: Locator;
  readonly searchButton: Locator;

  // --- 一覧・カード ---
  readonly searchCardTitle: Locator;
  readonly csvRegistrationCardTitle: Locator;
  readonly csvRegistrationButton: Locator;
  readonly searchResultCount: Locator;
  readonly searchNoResult: Locator;
  readonly searchFirst: Locator;
  readonly csvTemplateLink: Locator;
  readonly labelsExportButton: Locator;
  readonly checkAll: Locator;
  readonly rowChecks: Locator;
  readonly detailLinks: Locator;
  readonly trackingRegisterButtons: Locator;

  // --- 送り状No.登録モーダル ---
  readonly trackingModal: Locator;
  readonly trackingModalInput: Locator;
  readonly trackingModalSubmit: Locator;

  // --- CSV登録モーダル ---
  readonly csvModal: Locator;
  readonly csvFileInput: Locator;
  readonly csvUploadButton: Locator;

  // --- 詳細 ---
  readonly detailSectionTitle: Locator;
  readonly detailTrackingNo: Locator;
  readonly detailMemo: Locator;
  readonly detailRegisterButton: Locator;
  readonly detailDeleteButton: Locator;
  readonly deleteModal: Locator;
  readonly deleteModalConfirm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction`;

    this.searchForm = page.locator('form[name="admin_search_stock_move_instruction"]');
    this.moveFromBaseInfo = page.locator("#admin_search_stock_move_instruction_move_from_base_info");
    this.moveToBaseInfo = page.locator("#admin_search_stock_move_instruction_move_to_base_info");
    this.instructionId = page.locator("#admin_search_stock_move_instruction_instruction_id");
    this.stockMoveTransferId = page.locator("#admin_search_stock_move_instruction_stock_move_transfer_id");
    this.createDateStart = page.locator("#admin_search_stock_move_instruction_create_date_start");
    this.createDateEnd = page.locator("#admin_search_stock_move_instruction_create_date_end");
    this.updateDateStart = page.locator("#admin_search_stock_move_instruction_update_date_start");
    this.updateDateEnd = page.locator("#admin_search_stock_move_instruction_update_date_end");
    this.shipmentStatusNotDone = page.locator("#admin_search_stock_move_instruction_shipment_status_not_done");
    this.shipmentStatusDone = page.locator("#admin_search_stock_move_instruction_shipment_status_done");
    this.searchButton = this.searchForm.locator('button[type="submit"]');

    this.searchCardTitle = page.getByText("在庫移動指示検索", { exact: true });
    this.csvRegistrationCardTitle = page.getByText("CSVファイル登録", { exact: true });
    this.csvRegistrationButton = page.getByRole("button", { name: "在庫移動実績CSV登録" });
    this.searchResultCount = page.getByText(/検索結果：/);
    this.searchNoResult = page.getByText("検索条件に合致するデータが見つかりませんでした");
    this.searchFirst = page.getByText("検索条件を入力し、検索ボタンをクリックしてください。");
    this.csvTemplateLink = page.locator('a[href$="move-instruction/csv-template"]');
    this.labelsExportButton = page.locator("#stockMoveInstructionLabelsExport");
    this.checkAll = page.locator("#checkAll");
    this.rowChecks = page.locator(".row-check");
    this.detailLinks = page.locator('table.table-stock-move-instruction a[href*="move-instruction/"]');
    this.trackingRegisterButtons = page.locator(".btn-tracking-register");

    this.trackingModal = page.locator("#trackingRegisterModal");
    this.trackingModalInput = page.locator("#trackingRegisterTrackingNo");
    this.trackingModalSubmit = page.locator('#trackingRegisterForm button[type="submit"]');

    this.csvModal = page.locator("#csvRecordRegistrationModal");
    this.csvFileInput = page.locator("#csvRecordImportFile");
    this.csvUploadButton = page.locator("#csvRecordUploadButton");

    this.detailSectionTitle = page.getByText("在庫移動指示情報", { exact: true });
    this.detailTrackingNo = page.locator("#admin_stock_move_instruction_detail_trackingNo");
    this.detailMemo = page.locator("#admin_stock_move_instruction_detail_memo");
    this.detailRegisterButton = page.locator('form[name="admin_stock_move_instruction_detail"] button[type="submit"]');
    this.detailDeleteButton = page.locator('form[name="admin_stock_move_instruction_detail"] button.btn-ec-delete');
    this.deleteModal = page.locator("#deleteInstructionModal");
    this.deleteModalConfirm = page.locator('#deleteInstructionModal button.btn-ec-delete');
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** ?resume=1 付きで一覧を開く（検索条件のセッション復元）。 */
  async gotoResume() {
    await this.page.goto(`${this.listUrl}?resume=1`);
  }

  detailUrl(id: number | string): string {
    return `${this.listUrl}/${id}`;
  }

  async gotoDetail(id: number | string) {
    await this.page.goto(this.detailUrl(id));
  }

  /** 検索を実行する（指定された項目のみ入力）。 */
  async search(opts: { instructionId?: string; createDateStart?: string; createDateEnd?: string; updateDateStart?: string; updateDateEnd?: string } = {}) {
    if (opts.instructionId !== undefined) await this.instructionId.fill(opts.instructionId);
    if (opts.createDateStart !== undefined) await this.createDateStart.fill(opts.createDateStart);
    if (opts.createDateEnd !== undefined) await this.createDateEnd.fill(opts.createDateEnd);
    if (opts.updateDateStart !== undefined) await this.updateDateStart.fill(opts.updateDateStart);
    if (opts.updateDateEnd !== undefined) await this.updateDateEnd.fill(opts.updateDateEnd);
    await this.searchButton.click();
  }

  /** 検索フォームの主要UI部品が表示されていること（仕様: フロント挙動・表示要素）。 */
  async seeSearchForm() {
    await expect(this.searchCardTitle).toBeVisible();
    await expect(this.moveFromBaseInfo).toBeVisible();
    await expect(this.moveToBaseInfo).toBeVisible();
    await expect(this.instructionId).toBeVisible();
    await expect(this.stockMoveTransferId).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }
}
