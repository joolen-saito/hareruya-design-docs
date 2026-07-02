import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理「配送CSV出力（出荷CSVダウンロード）」Page Object（M05-04）。
 * 納品ケース表 integration_test/e2e/m05_04_admin_order_order_shipping_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-04_admin_order_order_shipping_csv_export.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・CSV列構成・文字コード・区切り・ファイル名prefixは期待値に流用しない。
 *
 * 本機能は受注一覧（admin_order）の「CSVダウンロード」ドロップダウン内の「出荷CSVダウンロード」リンク
 * （id=shippingCsvDownload・単純GETリンク＝送信前確認ダイアログやクライアント検証なし）から、
 * 現在セッションの受注検索条件（eccube.admin.order.search）に一致する受注を、受注明細単位で行に展開した
 * 配送用CSVを StreamedResponse でダウンロードする。出力対象列は dtb_csv の配送種別(csv_type_id=CSV_TYPE_SHIPPING=4)
 * かつ enabled が真の行のみ・sort_no 昇順。画面遷移は伴わず一覧に滞留する。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Order/index.twig）。
 * ルート/ID/trans キーを主セレクタとし、CSSクラスは補助に留める:
 *  - 受注一覧:          route admin_order = GET/POST /<route>/order（OrderController.php:136）
 *      画面タイトル trans admin.order.order_list=「受注一覧」（index.twig:14 / messages.ja.yaml:2255）
 *      サブタイトル trans admin.order.order_management=「受注管理」（index.twig:15 / messages.ja.yaml:2254）
 *  - CSVダウンロードドロップダウン開閉ボタン: #csvDownloadDropDown（index.twig:1136）
 *      ラベル trans admin.common.csv_download=「CSVダウンロード」（index.twig:1138 / messages.ja.yaml:1546）
 *  - 出荷CSVダウンロードリンク: a#shippingCsvDownload href=url('admin_order_export_shipping')（index.twig:1144）
 *      文言 trans admin.order.shipping_csv.download=「出荷CSVダウンロード」（index.twig:1145 / messages.ja.yaml:5531）
 *  - 配送CSV出力ルート: admin_order_export_shipping = GET /<route>/order/export/shipping（OrderController.php:387）
 *      応答(StreamedResponse): Content-Disposition attachment / filename=shipping_<YmdHis>.csv（OrderController.php:389,396）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class OrderOrderShippingCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 受注一覧（出荷CSVダウンロードリンクの起点画面）
  readonly exportPath: string; // 配送CSV出力 GETルート（ブックマーク直接アクセス／未認証ガード検証用）

  readonly csvDownloadToggle: Locator; // CSVダウンロード ドロップダウン開閉ボタン #csvDownloadDropDown（index.twig:1136）
  readonly shippingCsvLink: Locator; // 出荷CSVダウンロードリンク #shippingCsvDownload（index.twig:1144）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/order/export/shipping`;

    this.csvDownloadToggle = page.locator("#csvDownloadDropDown");
    this.shippingCsvLink = page.locator("#shippingCsvDownload");
  }

  /** 受注一覧（出荷CSVダウンロードリンクの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 配送CSV出力URLへ直接GETアクセスする（ブックマーク／アドレスバー起点・未認証ガード検証用）。 */
  async gotoExport() {
    // 添付応答のためナビゲーションは中断され得る。直接アクセス検証では失敗を握り潰す。
    await this.page.goto(this.exportPath).catch(() => null);
  }

  /** 受注一覧の「CSVダウンロード」ドロップダウンを開く（出荷CSVダウンロードリンクを可視化する）。 */
  async openCsvDropdown() {
    await this.csvDownloadToggle.click();
  }

  /**
   * 受注一覧でドロップダウンを開き「出荷CSVダウンロード」を押下し、ダウンロード発火を待って Download を返す。
   * 単純GETリンクのため送信前の確認ダイアログは出ない（仕様: フロント挙動）。
   */
  async downloadViaShippingLink(): Promise<Download> {
    await this.openCsvDropdown();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.shippingCsvLink.click(),
    ]);
    return download;
  }

  /** 配送CSV出力URLを直接GETしてダウンロード発火を待つ（ブックマーク/アドレスバー起点）。 */
  async downloadViaDirectUrl(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.goto(this.exportPath).catch(() => null),
    ]);
    return download;
  }

  /**
   * 配送CSV出力URLにクエリパラメータを付与して直接GETし、ダウンロード発火を待つ。
   * 仕様: GETボディもクエリによる絞り込み指示も受け付けず、抽出条件はセッションの受注検索条件のみ（正本md:126）。
   * クエリ付与の有無に関わらずダウンロードが発火することを確認する（クエリは無視される）。
   */
  async downloadViaDirectUrlWithQuery(query: string): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.goto(`${this.exportPath}${query}`).catch(() => null),
    ]);
    return download;
  }

  /** 受注一覧画面（CSV出力の起点）に到達していること（入口の表示確認）。 */
  async seeListScreen() {
    await expect(this.csvDownloadToggle).toBeVisible();
  }
}
