import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「戻しリストCSV出力（M04-33）」Page Object。
 * 納品ケース表 integration_test/e2e/m04_33_admin_stock_stock_move_return_list_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-33_admin_stock_stock_move_return_list_csv_export.md
 *   / 基本設計仕様書(在庫管理機能))由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *
 * 本機能は専用画面を持たず、在庫移動・振替一覧（M04-32 相当 / route admin_stock_move_transfer）画面の
 * 「戻しリストCSV出力」ボタン押下で、選択行 ids[] を隠しPOSTフォームから送信してCSVを StreamedResponse で
 * ダウンロードする POST 専用エンドポイント。CSVの中身（列・整形・ピッキング区分・並び順・文字コード/BOM）は手動確認とする。
 * 自動化はボタン表示・未選択alert・ダウンロード発火/ファイル名/応答ヘッダ・検証NG時の一覧リダイレクト＋フラッシュ・
 * 未認証ガード・GET不可（POST専用）に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig）:
 *  - 在庫移動・振替一覧: route admin_stock_move_transfer = GET/POST /<route>/product/stock/move_transfer
 *      （StockMoveTransferController.php:106）
 *  - 「戻しリストCSV出力」ボタン: id=stockMoveTransferReturnListCsvExport（index.twig:628）
 *      ラベル trans admin.stock.move_transfer.action_return_list_csv_export=「戻しリストCSV出力」
 *      （index.twig:628 / messages.ja.yaml:5134）
 *  - 行選択チェックボックス: .js-move-transfer-row-check（name="ids[]" value=移動・振替情報id / index.twig:692）
 *  - 全選択チェックボックス: #move_transfer_check_all（index.twig:653）
 *  - 隠しPOSTフォーム: #form_stock_move_transfer_return_list_csv
 *      action=url('admin_stock_move_transfer_return_list_csv_export') / CSRF hidden input
 *      name=Constant::TOKEN_NAME（=_token）（index.twig:971-973）
 *  - フラッシュエラー（検証NG時 addError → eccube.admin.error）: .alert-danger（alert.twig:42, default_frame.twig:200）
 *
 * ルート/応答（StockMoveTransferController.php / StockMoveTransferReturnListCsvExportService.php）:
 *  - 出力 admin_stock_move_transfer_return_list_csv_export = POST /<route>/product/stock/move_transfer/return_list_csv_export
 *      （Controller.php:437-438。set_time_limit(0)+isTokenValid Controller.php:440-441）
 *  - 検証NG（未選択/対象なし/存在しない/入庫先未設定/権限なし/対象外ステータス/複数店舗）は
 *      admin_stock_move_transfer_page（セッションのページ番号）へリダイレクト（Controller.php:445,487 / Service.php:121-169）
 *  - 検証OK: StreamedResponse / Content-Type application/octet-stream（Service.php:97）
 *      / Content-Disposition attachment; filename=stock_move_transfer_return_list_<7桁min id>_<YmdHis>.csv（Service.php:95-100）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockMoveReturnListCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫移動・振替一覧（ボタンの起点画面 admin_stock_move_transfer）
  readonly exportPath: string; // 戻しリストCSV出力 POSTルート（直接アクセス/応答検証用）

  readonly returnListCsvButton: Locator; // 「戻しリストCSV出力」ボタン（index.twig:628 id=stockMoveTransferReturnListCsvExport）
  readonly rowChecks: Locator; // 行選択チェックボックス（index.twig:692 .js-move-transfer-row-check）
  readonly checkAll: Locator; // 全選択（index.twig:653 #move_transfer_check_all）
  readonly returnListCsvForm: Locator; // 隠しPOSTフォーム（index.twig:971）
  readonly flashError: Locator; // 検証NG時フラッシュ（alert.twig:42 .alert-danger）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/return_list_csv_export`;

    this.returnListCsvButton = page.locator("#stockMoveTransferReturnListCsvExport");
    this.rowChecks = page.locator(".js-move-transfer-row-check");
    this.checkAll = page.locator("#move_transfer_check_all");
    this.returnListCsvForm = page.locator("#form_stock_move_transfer_return_list_csv");
    this.flashError = page.locator(".alert-danger");
  }

  /** 在庫移動・振替一覧（ボタンの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 先頭 n 件の行を選択する（戻しリストCSV出力の対象 ids[] を作る）。 */
  async selectRows(n = 1) {
    const count = await this.rowChecks.count();
    const limit = Math.min(n, count);
    for (let i = 0; i < limit; i++) {
      await this.rowChecks.nth(i).check();
    }
    return limit;
  }

  /** 行を選択した状態でボタンを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadReturnListCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.returnListCsvButton.click(),
    ]);
    return download;
  }

  /** 一覧の戻しリストCSV出力ボタンが仕様どおり表示されること。 */
  async seeReturnListButton() {
    await expect(this.returnListCsvButton).toBeVisible();
  }

  /** 隠しフォームから CSRF トークンを読み取る（検証NG分岐をサーバ側で検証するための位置情報取得）。 */
  async readCsrfToken(): Promise<string> {
    // CSRF hidden input は name=Constant::TOKEN_NAME（=_token）（index.twig:972）。位置情報のみで期待値化しない。
    return (await this.returnListCsvForm.locator('input[name="_token"]').inputValue()).trim();
  }

  /**
   * 戻しリストCSV出力エンドポイントへ直接 POST する（サーバ側の検証NG分岐/CSRFを観測）。
   * ids が空配列なら未選択（no_selection）相当。token に不正値を渡せば CSRF 検証を観測できる。
   * リダイレクト追従後の応答（一覧HTML＋フラッシュ）を返す。
   */
  async postExport(ids: string[], token: string) {
    const form: Record<string, string> = { _token: token };
    ids.forEach((id, i) => {
      form[`ids[${i}]`] = id;
    });
    return await this.page.request.post(this.exportPath, { form });
  }
}
