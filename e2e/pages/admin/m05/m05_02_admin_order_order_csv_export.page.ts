import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理「受注情報CSV出力」Page Object（M05-02）。
 * 納品ケース表 integration_test/e2e/m05_02_admin_order_order_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-02_admin_order_order_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。設計源は pf-eccube3 リバースだが、DB・挙動は刷新先 ec-cube-enterprise を正とし当該画面の
 * 存在を確認済み。実装の現挙動・Form制約・Cookie名は期待値に流用しない。
 *
 * 本機能は受注一覧（admin_order）上部の「CSVダウンロード」ドロップダウン内「受注CSVダウンロード」リンク（GETアンカー）
 * からの StreamedResponse ダウンロードであり、受注一覧の検索条件セッション（参照のみ）で
 * 注文→明細単位のCSVをストリーム出力する。※内部セッションキー名は実装詳細でありオラクルにしない。
 * 自動化はダウンロード発火・ファイル名・応答ヘッダ・UI部品（リンク表示）・
 * 確認モーダル不在・未認証ガードに限る。CSV各列の値・見出し文言・明細単位の行数・BOM/エンコードは実ファイルを開いて手動確認。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Order/index.twig）:
 *  - 受注一覧:            route admin_order = GET/POST /<route>/order（OrderController.php:136）
 *  - CSVダウンロードボタン: #csvDownloadDropDown（index.twig:1136 / ラベル trans admin.common.csv_download=「CSVダウンロード」messages.ja.yaml:1546）
 *  - 「受注CSVダウンロード」: <a id="orderCsvDownload" href="{{ url('admin_order_export_order') }}">（index.twig:1141）
 *      ラベル trans admin.order.order_csv.download=「受注CSVダウンロード」（index.twig:1142 / messages.ja.yaml:5530）
 *
 * ルート（src/Eccube/Controller/Admin/Order/OrderController.php）:
 *  - 受注CSV出力 admin_order_export_order = GET /<route>/order/export/order（:374-385）
 *    応答(StreamedResponse): Content-Type application/octet-stream（:463）/
 *    Content-Disposition attachment; filename=order_<YmdHis>.csv（:377,:464）
 *    出力対象は受注一覧の検索条件セッション（getOrderQueryBuilder が参照。内部キー名はオラクルにしない）。検索未保存でも既定検索で出力されうる（設計エッジケース）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class OrderOrderCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 受注一覧（admin_order）= CSV出力リンクの起点画面
  readonly exportPath: string; // 受注CSV出力 GETルート（直接アクセス/ヘッダ検証用）

  readonly csvDropdownToggle: Locator; // 「CSVダウンロード」ドロップダウンボタン（index.twig:1136）
  readonly orderCsvLink: Locator; // 「受注CSVダウンロード」リンク id=orderCsvDownload（index.twig:1141）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/order/export/order`;

    this.csvDropdownToggle = page.locator("#csvDownloadDropDown");
    // id で位置特定（ラベルは trans admin.order.order_csv.download 由来であることを上記コメントで確認済み）。
    this.orderCsvLink = page.locator("#orderCsvDownload");
    // 受注一覧到達の確認は #csvDownloadDropDown の表示で行う（seeListScreen）。Twig根拠の無い広域 form セレクタは置かない。
  }

  /** 受注一覧（CSV出力リンクの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 受注CSV出力URLへ直接GETアクセスする（URL直接アクセス／未認証ガード検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath);
  }

  /** 「CSVダウンロード」ドロップダウンを開く（中の項目を表示させる）。 */
  async openCsvDropdown() {
    await this.csvDropdownToggle.click();
  }

  /**
   * 「受注CSVダウンロード」リンク押下でダウンロード発火を待って Download を返す。
   * ドロップダウン内のリンクのため先にトグルを開く。
   */
  async downloadViaLink(): Promise<Download> {
    await this.openCsvDropdown();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.orderCsvLink.click(),
    ]);
    return download;
  }

  /**
   * CSV出力URLへ直接GETしてダウンロード発火を待つ（URL直接アクセス検証用）。
   * 添付応答へのnavigationはダウンロード開始でgotoが中断されるため、その既知エラー
   * （Download is starting / net::ERR_ABORTED）のみ握りつぶし、それ以外（接続失敗等）は再送出する。
   */
  async downloadViaDirectGet(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.goto(this.exportPath).catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (/Download is starting|ERR_ABORTED/i.test(msg)) return null; // 添付応答でnavigation中断＝想定内
        throw e; // 想定外のエラーは隠さない
      }),
    ]);
    return download;
  }

  /** 受注一覧画面に到達していること（入口の表示確認）。 */
  async seeListScreen() {
    await expect(this.csvDropdownToggle).toBeVisible();
  }

  /** ドロップダウン内に「受注CSVダウンロード」リンクが存在すること（id＋href＝位置情報で確認）。 */
  async seeOrderCsvLink() {
    await this.openCsvDropdown();
    await expect(this.orderCsvLink).toBeVisible();
    await expect(this.orderCsvLink).toContainText("受注CSVダウンロード");
  }
}
