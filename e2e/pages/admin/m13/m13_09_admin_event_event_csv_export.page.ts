import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理「イベント申込CSV出力（CSVダウンロード）」Page Object（M13-09）。
 * 納品ケース表 integration_test/e2e/m13_09_admin_event_event_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-09_admin_event_event_csv_export.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・Form制約・内部セッションキー名・searchMode内部値は期待値に流用しない。
 * セレクタ（位置情報）のみ刷新先 ec-cube-enterprise の Twig/Controller 由来で確定する。
 *
 * 本機能はイベント申込一覧（admin_event_entry）上部「CSVダウンロード」ドロップダウン内の出力リンク（GETアンカー）
 * からの StreamedResponse ダウンロードで、申込一覧の検索条件セッション（参照のみ）に従い
 * 申込プレイヤー単位の申込CSVをストリーム出力する。自動化はダウンロード発火・ファイル名・応答ヘッダ・
 * UI部品（ボタン/リンク表示）・確認モーダル不在・未認証ガード・画面遷移なしに限る。
 * CSV各列の値・見出し・並び順・BOM/文字コード・論理削除データ包含・検索条件の母集合一致は実ファイルを開いて手動確認。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Event/Entry/index.twig）:
 *  - 一覧:                route admin_event_entry = GET/POST /<route>/event/entry（EntryController.php:93）
 *  - CSVダウンロードボタン: #entryCsvDownloadDropDown（index.twig:353 / ラベル trans admin.event.entry.csv_download=「CSVダウンロード」messages.ja.yaml:5777）
 *  - 出力リンク:          <a class="dropdown-item" href="{{ path('admin_event_entry_csv_export') }}">「CSVダウンロード」</a>（index.twig:358。id無しのため href で位置特定）
 *  - 出力項目設定リンク:    trans admin.event.entry.csv_column_settings=「出力項目設定」（index.twig:361 / :5778。別機能=申込CSV出力項目設定へ委譲。本機能対象外）
 *
 * ルート/応答（src/Eccube/Controller/Admin/Event/EntryController.php / Service/Csv/Exporter/EventEntryCsvExportService.php）:
 *  - 申込CSV出力 admin_event_entry_csv_export = GET /<route>/event/entry/csv（EntryController.php:340）
 *    応答(StreamedResponse): Content-Type application/octet-stream（Service:88）/
 *    Content-Disposition attachment; filename=event_entry_<YmdHis>.csv（Service:42,88-89）
 *  - イベント詳細指定の一覧 admin_event_entry_event_detail = GET /<route>/event/entry/event_detail/{event_detail_id}（EntryController.php:95。
 *    一覧を当該詳細で絞り込み検索条件セッションへ反映 → /event/entry/csv で出力）。
 *
 * 仕様乖離メモ（テストは仕様どおりに書き、期待値を実装へ書き換えない）:
 *  - 設計書は出力時にソート default・昇順 ASC 固定を要求するが、実装はセッションのソート/並び順（既定 DESC）を読む（EntryController.php:360-362）。
 *  - 設計書の詳細指定出力ルート /entry/{eventDetailId}/export は刷新先に無く、一覧の詳細絞り込み＋共通出力URLで実現する。
 *  - 設計書の searchMode 値 registedDeck に対し実装は deck_registration（内部値・セレクタにしない）。
 *  これらはケース表 付帯表4（不具合候補）で管理する。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class EventEventCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // イベント申込一覧（CSV出力リンクの起点画面）
  readonly exportPath: string; // 申込CSV出力 GETルート（直接アクセス/ヘッダ検証用）

  readonly csvDropdownToggle: Locator; // 「CSVダウンロード」ドロップダウンボタン（index.twig:353）
  readonly csvExportLink: Locator; // ドロップダウン内 出力リンク（index.twig:358 href=admin_event_entry_csv_export）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/event/entry`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/event/entry/csv`;

    this.csvDropdownToggle = page.locator("#entryCsvDownloadDropDown");
    // 出力リンクは id を持たないため、出力ルートを指す href で位置特定する（ラベルは trans admin.event.entry.csv_download 由来）。
    this.csvExportLink = page.locator(
      `#result_list_main__csv_menu a.dropdown-item[href$="/event/entry/csv"]`
    );
  }

  /** イベント詳細指定の一覧URL（検索条件セッションを当該詳細で絞り込む）。 */
  eventDetailListUrl(eventDetailId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/entry/event_detail/${eventDetailId}`;
  }

  /** イベント申込一覧（CSV出力リンクの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** イベント詳細指定の一覧を開き、検索条件セッションへ反映させる。 */
  async gotoEventDetailList(eventDetailId: string | number) {
    await this.page.goto(this.eventDetailListUrl(eventDetailId));
  }

  /** 申込CSV出力URLへ直接GETアクセスする（URL直接アクセス／未認証ガード検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath);
  }

  /** 「CSVダウンロード」ドロップダウンを開く（中の出力リンクを表示させる）。 */
  async openCsvDropdown() {
    await this.csvDropdownToggle.click();
  }

  /** 出力リンク押下でダウンロード発火を待って Download を返す（先にドロップダウンを開く）。 */
  async downloadViaLink(): Promise<Download> {
    await this.openCsvDropdown();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportLink.click(),
    ]);
    return download;
  }

  /**
   * 出力URLへ直接GETしてダウンロード発火を待つ（URL直接アクセス検証用）。
   * 添付応答への navigation はダウンロード開始で goto が中断されるため、その既知エラー
   * （Download is starting / net::ERR_ABORTED）のみ握りつぶし、それ以外は再送出する。
   */
  async downloadViaDirectGet(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.goto(this.exportPath).catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (/Download is starting|ERR_ABORTED/i.test(msg)) return null; // 添付応答で navigation 中断＝想定内
        throw e; // 想定外のエラーは隠さない
      }),
    ]);
    return download;
  }

  /** イベント申込一覧画面に到達していること（入口の表示確認）。 */
  async seeListScreen() {
    await expect(this.csvDropdownToggle).toBeVisible();
  }

  /**
   * ドロップダウン内に出力リンク（CSVダウンロードの入口）が存在すること。
   * オラクルは仕様（利用者視点の入口＝一覧側にCSV出力リンクが在る）由来。出力先URL（/event/entry/csv）は
   * 刷新先の位置情報でありオラクルにしない（正典の入口URLは /entry/export。ケース表付帯表4#2 で乖離管理）。
   */
  async seeCsvExportLink() {
    await this.openCsvDropdown();
    await expect(this.csvExportLink).toBeVisible();
  }
}
