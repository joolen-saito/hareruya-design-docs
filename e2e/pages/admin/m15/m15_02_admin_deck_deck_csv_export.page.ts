import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 デッキ管理「デッキ CSV 出力」Page Object。
 * 納品ケース表 integration_test/e2e/m15_02_admin_deck_deck_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m15-02_admin_deck_deck_csv_export.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・メッセージ文言・Form制約を期待値に流用しない。CSVの中身（列・順序・値・表示フラグ写像・
 * メイン/サイド列・統率者名・行数対応・エンコード/BOM）は手動確認とする。自動化はダウンロード発火・
 * ファイル名・UI部品・未選択時の出力抑止・認証ガードに限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Deck/index.twig）:
 *  - 検索フォーム: form#admin_search_deck（index.twig:230 form_start, action=admin_deck_list, method=POST / SearchDeckType.getBlockPrefix=admin_search_deck SearchDeckType.php:214-216）
 *  - 検索実行ボタン: form#admin_search_deck 内 button[type=submit]（index.twig:380, trans admin.deck.search=「検索」）
 *  - 一括フォーム: form#bulk_form（index.twig:397, method POST action=admin_deck_bulk_delete・CSV出力は formaction で切替）
 *  - 「CSV出力」ボタン: button#csv_export formaction=url('admin_deck_csv_export')（index.twig:404 / trans admin.deck.csv_export=「CSV出力」messages.ja.yaml:4079）
 *  - 各デッキ行チェックボックス: input.searched_deck_id name="deckId[]" value="{{ Deck.id }}"（index.twig:536）
 *  - 表頭の全選択: #allCheck（index.twig:526, JS index.twig:192-194 で .searched_deck_id を一括ON/OFF）
 *  - CSRFトークン hidden: #bulk_form_token（index.twig:398）/ #csv_export_token_value（index.twig:401, JS index.twig:208-209 で submit時に差替）
 *  - 検索結果件数ラベル: span.fw-bold（index.twig:394, trans admin.common.search_result）
 *  - エラーフラッシュ: .alert-danger（admin/alert.twig:32/42, addError 'admin'→eccube.admin.danger）
 *
 * ルート（src/Eccube/Controller/Admin/Deck/DeckController.php）:
 *  - デッキ一覧 admin_deck_list = GET/POST /<route>/deck（:74）／検索 admin_deck_search = /<route>/deck/search/{page_no}（:75）
 *  - デッキCSV出力 admin_deck_csv_export = POST /<route>/deck/csv_export（:677, methods POST のみ）
 *    ※設計書(pf-eccube3)の正典ルートは POST /<route>/deck/csvexport（アンダースコア無し）。実装はアンダースコア有り
 *      の /deck/csv_export で乖離（不具合候補#6）。本POMの csvExportPath は実機到達のため実装URLを用いるが、
 *      合否オラクルは仕様（出力発火/ファイル名/未選択抑止）で判定しURL文字列自体は期待値固定しない。
 *
 * 注（刷新先との乖離・付帯表4参照）: 設計書(pf-eccube3)が定める「CSV出力（旧サイト）」ルート
 * admin_deck_csv_export_old（POST /deck/csvexport_old）/ ボタン #csvexport_old は ec-cube-enterprise に存在しない（不具合候補#1）。
 * また設計書のクライアントalert「CSV出力するデッキをひとつ以上選択してください。」も実装に無い（不具合候補#2）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class DeckDeckCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // デッキ一覧（admin_deck_list）
  readonly csvExportPath: string; // POST 専用ルート（GET直アクセス検証用）

  readonly searchForm: Locator; // form#admin_search_deck（index.twig:230）
  readonly searchButton: Locator; // 検索実行（index.twig:380）
  readonly bulkForm: Locator; // form#bulk_form（index.twig:397）
  readonly csvExportButton: Locator; // #csv_export（index.twig:404）
  readonly checkboxes: Locator; // input.searched_deck_id（index.twig:536）
  readonly allCheck: Locator; // #allCheck（index.twig:526）
  readonly resultCount: Locator; // span.fw-bold（index.twig:394）
  readonly flashError: Locator; // .alert-danger（alert.twig:32/42）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/deck`;
    this.csvExportPath = `/${ECCUBE_ADMIN_ROUTE}/deck/csv_export`;

    this.searchForm = page.locator("#admin_search_deck");
    this.searchButton = page.locator('#admin_search_deck button[type="submit"]');
    this.bulkForm = page.locator("#bulk_form");
    this.csvExportButton = page.locator("#csv_export");
    this.checkboxes = page.locator("input.searched_deck_id");
    this.allCheck = page.locator("#allCheck");
    this.resultCount = page.locator("span.fw-bold", { hasText: "検索結果" });
    this.flashError = page.locator(".alert-danger");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** CSV出力の POST 専用ルートへ素のGETで到達を試みる（未認証ガード検証用）。
   *  仕様（権限・認可）: CSV出力ルートも認証済み管理者のみ操作可。未認証は管理ログインへ誘導される。 */
  async gotoCsvExportRoute() {
    await this.page.goto(this.csvExportPath);
  }

  /** 検索を実行して一覧（一括フォーム・CSV出力ボタン）を描画する。条件未指定で全件相当。 */
  async search() {
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 先頭のデッキ行チェックボックスを1件オンにする（出力対象はチェック済みのみ）。 */
  async checkFirst() {
    await this.checkboxes.first().check();
  }

  /** 表頭の全選択をオンにする。 */
  async checkAll() {
    await this.allCheck.check();
  }

  /** CSV出力ボタンを押下し、発火したダウンロードを返す。 */
  async exportAndWaitDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportButton.click(),
    ]);
    return download;
  }

  /** CSV出力ボタンを押下する（ダウンロードを待たない／未選択の出力抑止検証用）。 */
  async clickCsvExport() {
    await this.csvExportButton.click();
  }

  /** 一覧に「CSV出力」ボタン・チェックボックスが仕様どおり表示されること。 */
  async seeCsvExportUi() {
    await expect(this.csvExportButton).toBeVisible();
    await expect(this.checkboxes.first()).toBeVisible();
  }
}
