import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 在庫編集承認一覧（検索/一覧＋一括承認/却下＋CSV＋明細モーダル）Page Object。
 * 納品ケース表 integration_test/e2e/m04_32_admin_stock_stock_approval_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-32_admin_stock_stock_approval_list.md /
 * Excel基本設計 / 観点表)由来（オラクル独立性）。実装の現挙動・文言・Form制約を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_stock_approval_list`
 * （SearchStockApprovalListType.php:290-293）由来の位置情報のみ。
 * Twig=src/Eccube/Resource/template/admin/Stock/approval_list.twig（以下 list.twig）。
 *
 * DOM id 根拠（block prefix + フィールド名・SearchStockApprovalListType.php:65-215 の各 ->add(...) 由来）:
 *  - base_info → #admin_search_stock_approval_list_base_info（list.twig:355）
 *  - stock_location_id → #...stock_location_id（list.twig:361）
 *  - filter_approval_target → #...filter_approval_target（list.twig:370 / Type.php:85）
 *  - approval_status → #...approval_status（list.twig:378）
 *  - stock_change_type_detail → #...stock_change_type_detail（list.twig:386）
 *  - registered_department → #...registered_department（list.twig:393 / Type.php:117）
 *  - registered_member → #...registered_member（list.twig:397 / Type.php:123）
 *  - approval_department → #...approval_department（list.twig:413 / Type.php:140）
 *  - approval_member → #...approval_member（list.twig:417 / Type.php:146）
 *  - registered_date_start/end → #...registered_date_start /_end（list.twig:403/405）
 *  - approved_date_start/end → #...approved_date_start /_end（list.twig:423/425）
 * その他 id/クラス（list.twig）:
 *  - 検索フォーム #form_search_stock_approval_list（:349 action=admin_stock_approval_list）
 *  - 検索ボタン button[type=submit] trans admin.common.search=「検索」（:437 / messages:1446）
 *  - 件数 span trans ...search_result_count=「検索結果：%count%件が該当しました」（:438 / messages:5048）
 *  - クリア #btn_search_clear（:432 / JS :67-80）
 *  - 表示件数 #page_count_pulldown（:459）
 *  - 検索結果CSV a→route admin_stock_approval_list_csv trans ...csv_download（:464 / messages:5051）
 *  - 全選択 #toggle_check_all（:473）／行 input[name="approval_list_ids[]"] id=check_{id}（:494 if is_bulk_actionable）
 *  - 承認対象（在庫編集系）a.js-open-single-approval-modal（:500）／（移動等）a[target=_blank]（:504）
 *  - 一括却下 #btn_bulk_reject（:454）／一括承認 #btn_bulk_approve（:455）（親 #btn_bulk は d-none）
 *  - 確認モーダル #stockApprovalListConfirmModal（:536）／title trans ...confirm_modal_title=「確認」（:543 / messages:5075）
 *  - 明細コンテナ #js-approval-line-items-container（:555）／明細CSV .js-approval-line-items-csv-link（:553）
 *  - 却下理由 #rejection_reason（:559）／確定 #btn_bulk_reject_submit「却下する」（:574）/ #btn_bulk_approve_submit「承認する」（:575）
 *  - 最終OK button[type=submit] trans common.ok=「OK」（:579 / messages:20）
 *  - 0件 td trans admin.common.search_no_result（:522 / messages:1542）
 *  - 一覧見出し th trans ...approval_status_label 等（:475-485 / messages:5053-5063）
 * フラッシュ文言（仕様正典・実装はメッセージキー）:
 *  - 保存完了 admin.common.save_complete=「保存しました」（messages:1398 / Controller:272）
 *  - 権限なし admin.stock.approval_list.not_granted=「在庫編集の承認権限がありません。」（messages:5083）
 *  - 明細CSVセッション欠落 admin.stock.approval_list.csv_export_no_session（messages:5085 / Controller:373）
 *  - 日付相関 admin.common.date_end_error=「終了日は、開始日より大きく設定してください」（messages:1419 / Type.php:225-227,234-237）
 * 注: フォームエラー表示要素クラス（form_theme bootstrap_4_layout 由来）は要実機確認。創作しない。
 */
export class StockStockApprovalListPage {
  readonly page: Page;
  readonly url: string; // 承認一覧トップ（admin_stock_approval_list）
  readonly lineItemsCsvUrl: string; // 明細CSV（admin_stock_approval_list_line_items_csv）

  // 検索フォーム
  readonly searchForm: Locator; // #form_search_stock_approval_list（list.twig:349）
  readonly baseInfo: Locator; // #admin_search_stock_approval_list_base_info（:355）
  readonly stockLocation: Locator; // #...stock_location_id（:361）
  readonly filterApprovalTarget: Locator; // #...filter_approval_target（:370）
  readonly approvalStatus: Locator; // #...approval_status（:378）
  readonly changeTypeDetail: Locator; // #...stock_change_type_detail（:386）
  readonly registeredDepartment: Locator; // #...registered_department（:393）
  readonly registeredMember: Locator; // #...registered_member（:397）
  readonly approvalDepartment: Locator; // #...approval_department（:413）
  readonly approvalMember: Locator; // #...approval_member（:417）
  readonly registeredDateStart: Locator; // #...registered_date_start（:403）
  readonly registeredDateEnd: Locator; // #...registered_date_end（:405）
  readonly approvedDateStart: Locator; // #...approved_date_start（:423）
  readonly approvedDateEnd: Locator; // #...approved_date_end（:425）
  readonly searchButton: Locator; // button trans admin.common.search（:437）
  readonly resultCount: Locator; // 件数 span（:438）
  readonly clearLink: Locator; // #btn_search_clear（:432）

  // 一覧・件数・CSV・ページング
  readonly listTable: Locator; // 検索結果テーブル（:469）
  readonly noResult: Locator; // 0件メッセージ td（:522 trans search_no_result）
  readonly pageCountPulldown: Locator; // #page_count_pulldown（:459）
  readonly csvDownloadLink: Locator; // 検索結果CSV a（:464）
  readonly toggleCheckAll: Locator; // #toggle_check_all（:473）

  // bulk・確認モーダル
  readonly bulkApproveButton: Locator; // #btn_bulk_approve（:455）
  readonly bulkRejectButton: Locator; // #btn_bulk_reject（:454）
  readonly confirmModal: Locator; // #stockApprovalListConfirmModal（:536）
  readonly modalTitle: Locator; // モーダル title「確認」（:543）
  readonly lineItemsContainer: Locator; // #js-approval-line-items-container（:555）
  readonly lineItemsCsvLink: Locator; // .js-approval-line-items-csv-link（:553）
  readonly rejectionReason: Locator; // #rejection_reason（:559）
  readonly approveSubmit: Locator; // #btn_bulk_approve_submit「承認する」（:575）
  readonly rejectSubmit: Locator; // #btn_bulk_reject_submit「却下する」（:574）
  readonly okButton: Locator; // 最終OK button trans common.ok（:579）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/stock/approval_list`;
    this.lineItemsCsvUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/approval_list/line_items/csv`;

    const p = "#admin_search_stock_approval_list_";
    this.searchForm = page.locator("#form_search_stock_approval_list");
    this.baseInfo = page.locator(`${p}base_info`);
    this.stockLocation = page.locator(`${p}stock_location_id`);
    this.filterApprovalTarget = page.locator(`${p}filter_approval_target`);
    this.approvalStatus = page.locator(`${p}approval_status`);
    this.changeTypeDetail = page.locator(`${p}stock_change_type_detail`);
    this.registeredDepartment = page.locator(`${p}registered_department`);
    this.registeredMember = page.locator(`${p}registered_member`);
    this.approvalDepartment = page.locator(`${p}approval_department`);
    this.approvalMember = page.locator(`${p}approval_member`);
    this.registeredDateStart = page.locator(`${p}registered_date_start`);
    this.registeredDateEnd = page.locator(`${p}registered_date_end`);
    this.approvedDateStart = page.locator(`${p}approved_date_start`);
    this.approvedDateEnd = page.locator(`${p}approved_date_end`);
    this.searchButton = this.searchForm.getByRole("button", { name: "検索" });
    this.resultCount = page.locator("#form_search_stock_approval_list span", {
      hasText: "検索結果",
    });
    this.clearLink = page.locator("#btn_search_clear");

    this.listTable = page.locator("table.table");
    this.noResult = page.getByText("検索条件に合致するデータが見つかりませんでした");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.csvDownloadLink = page.locator(
      `a[href*="/product/stock/approval_list/csv"]`
    );
    this.toggleCheckAll = page.locator("#toggle_check_all");

    this.bulkApproveButton = page.locator("#btn_bulk_approve");
    this.bulkRejectButton = page.locator("#btn_bulk_reject");
    this.confirmModal = page.locator("#stockApprovalListConfirmModal");
    this.modalTitle = this.confirmModal.locator(".modal-title");
    this.lineItemsContainer = page.locator("#js-approval-line-items-container");
    this.lineItemsCsvLink = page.locator(".js-approval-line-items-csv-link");
    this.rejectionReason = page.locator("#rejection_reason");
    this.approveSubmit = page.locator("#btn_bulk_approve_submit");
    this.rejectSubmit = page.locator("#btn_bulk_reject_submit");
    this.okButton = this.confirmModal.getByRole("button", { name: "OK" });
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 明細CSV出力URLへ直接アクセスする（セッション欠落時の誘導確認用）。 */
  async gotoLineItemsCsv() {
    await this.page.goto(this.lineItemsCsvUrl);
  }

  /** 表示件数を直接URL指定で開く（不正値の丸め確認用）。 */
  async gotoPageCount(pageNo: number, pageCount: number) {
    await this.page.goto(
      `/${ECCUBE_ADMIN_ROUTE}/product/stock/approval_list/page/${pageNo}/count/${pageCount}`
    );
  }

  async search() {
    await this.searchButton.click();
  }

  /** 承認一覧画面の主要UI部品が仕様どおり表示されること。 */
  async seeScreen() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /**
   * 検索フォームの検索条件入力欄が仕様どおり表示されること（仕様: 検索条件節 正本md:95-103 の全フィールド）。
   * 店舗・在庫区分・承認対象の絞り込み・承認ステータス・在庫変動区分・登録者(所属/メンバー)・承認者(所属/メンバー)・登録日・承認日。
   */
  async seeSearchFields() {
    await expect(this.baseInfo).toBeVisible();
    await expect(this.stockLocation).toBeVisible();
    await expect(this.filterApprovalTarget).toBeVisible();
    await expect(this.approvalStatus).toBeVisible();
    await expect(this.changeTypeDetail).toBeVisible();
    await expect(this.registeredDepartment).toBeVisible();
    await expect(this.registeredMember).toBeVisible();
    await expect(this.approvalDepartment).toBeVisible();
    await expect(this.approvalMember).toBeVisible();
    await expect(this.registeredDateStart).toBeVisible();
    await expect(this.registeredDateEnd).toBeVisible();
    await expect(this.approvedDateStart).toBeVisible();
    await expect(this.approvedDateEnd).toBeVisible();
  }

  /**
   * 一覧見出し列が仕様どおり表示されること（仕様: 一覧項目節 正本md:71 由来の文言で確認）。
   * 仕様は店舗/在庫区分を1見出しに集約（正本md:25,71）。共通部分「店舗」で確認し、「在庫区分」vs実装「在庫場所」の差異は付帯表4で要確認管理（オラクル混入回避のため厳密文言は固定しない）。
   */
  async seeListHeaders() {
    const thead = this.listTable.locator("thead");
    for (const label of [
      "承認状態",
      "承認対象",
      "店舗",
      "対象商品規格数",
      "合計在庫増減数",
      "合計総原価増減数",
      "在庫変動区分",
      "登録日",
      "登録者",
      "承認日",
      "承認者",
    ]) {
      await expect(thead).toContainText(label);
    }
  }

  /** 「検索結果：N件が該当しました」が表示されること。 */
  async seeResultCount() {
    await expect(this.page.locator("body")).toContainText("検索結果");
    await expect(this.page.locator("body")).toContainText("件が該当しました");
  }
}
