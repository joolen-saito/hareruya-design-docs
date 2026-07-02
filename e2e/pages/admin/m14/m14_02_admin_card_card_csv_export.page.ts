import { APIResponse, Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カード管理「カード情報CSV出力」Page Object（M14-02）。
 * 納品ケース表 integration_test/e2e/m14_02_admin_card_card_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m14-02_admin_card_card_csv_export.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・Form制約・内部セッションキー名は期待値に流用しない。セレクタ（位置情報）のみ
 * 刷新先 ec-cube-enterprise の Twig/Controller 由来で確定する。
 *
 * 本機能はカード検索一覧（admin_card_list）の検索結果ボックス上部「CSV出力」ボタン押下で、
 * 行チェックボックス name="cardIds[]" で選択したカードIDを #form_bulk から POST し、StreamedResponse の
 * カードCSV（cards_<YmdHis>.csv）をダウンロードさせる。自動化はダウンロード発火・ファイル名・応答ヘッダ・
 * UI部品（ボタン/チェックボックス/全選択表示）・確認モーダル不在・未選択ガード・存在しないID時のリダイレクト・
 * 未認証ガードに限る。CSV各列の値・見出し・並び順・BOM/文字コードは実ファイルを開いて手動確認。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Card/index.twig）:
 *  - 一覧:              route admin_card_list = GET/POST /<route>/card（CardController.php:64）。GET初期表示は pagination=null＝結果非表示（:103-108）。
 *                       結果と「CSV出力」ボタンを出すには検索POST（検索ボタン）が必要。
 *  - 検索キーワード:    #admin_search_card_multi（SearchCardType.php:45 'multi' / getBlockPrefix='admin_search_card' :218）
 *  - 検索ボタン:        button[type=submit] trans admin.common.search=「検索」（index.twig:330）
 *  - 検索結果件数:      span trans admin.common.search_result（index.twig:332。totalItemCount を埋め込む）
 *  - 一括フォーム:      #form_bulk（index.twig:343。totalItemCount>0 のときだけ描画 :342）
 *  - CSV出力ボタン:     button.action-submit[data-action=url('admin_card_export_csv')]「CSV出力」（index.twig:346-352。文言は静的・trans無し）
 *  - 行チェックボックス: input[name="cardIds[]"] value=card.id（index.twig:417-419）
 *  - 全選択:            #chose_all（index.twig:404-406。JS :150-153 で cardIds[] を一括ON/OFF）
 *  - CSRFトークン:      button に csrf_token_for_anchor()＝token-for-anchor='<token>'（index.twig:348 / CsrfExtension.php:43-45）。
 *                       JS（:81-89）が token-for-anchor を _token フィールドへ注入して送信。
 *
 * ルート/応答（src/Eccube/Controller/Admin/Card/CardCsvController.php / Service/Csv/CardCsv.php・AbstractCsvService.php）:
 *  - 出力 admin_card_export_csv = POST /<route>/card/export_csv（CardCsvController.php:143。$this->isTokenValid() で CSRF 検証 :146）
 *  - 成功応答(StreamedResponse): Content-Type text/csv;charset=...（AbstractCsvService.php:395）/
 *    Content-Disposition attachment; filename=cards_<YmdHis>.csv（CardCsv.php:245 createFileName('cards_') / AbstractCsvService.php:382,396）
 *  - 未選択 cardIds=[] → addError('admin.csv.error.export.no_card_selected') → admin_card_search へリダイレクト（Controller.php:149-152,170-177）
 *  - 取得件数≠指定件数（存在しないID混在）→ RuntimeException not_registered → addError＋admin_card_search へリダイレクト（CardCsv.php:214-215 / Controller.php:160-163）
 *
 * 仕様乖離メモ（テストは仕様どおりに書き、期待値を実装へ書き換えない。ケース表 付帯表4 で管理）:
 *  - 出力ルートは設計の /card/csvexport ではなく /card/export_csv（admin_card_export_csv）（#1）。
 *  - 設計は「CSRFトークンフィールドは付かない」とするが、実装は csrf_token_for_anchor＋isTokenValid で CSRF を強制（#2）。
 *  - 全選択は設計の #allCheck ではなく #chose_all（#3）。
 *  - 未選択は設計の server flash（admin.csv.error.export.card/require）だが、実装は JS alert「1つ以上のカードを選択してください。」で
 *    クライアント側ブロック＋server側は no_card_selected キー（#4）。
 *  - 一部欠落IDは設計「静かに無視」だが、実装は件数不一致で即 not_registered エラー（#5）。
 *  - 出力順は設計「findBy依存・順序保証なし」だが、実装は選択順を usort で保持（#6）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class CardCardCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // カード検索一覧（CSV出力の起点画面）
  readonly exportPath: string; // カードCSV出力 POSTルート（直接リクエスト/ヘッダ検証用）

  readonly searchMulti: Locator; // 検索キーワード入力（index.twig:183 / SearchCardType.php:45）
  readonly searchButton: Locator; // 検索ボタン「検索」（index.twig:330）
  readonly searchResultCount: Locator; // 検索結果件数表示（index.twig:332 span trans admin.common.search_result）。包含要素のクラスは未実機確認のため要実機確認。本spec未使用。
  readonly bulkForm: Locator; // #form_bulk（index.twig:343）
  readonly csvExportButton: Locator; // 「CSV出力」ボタン（index.twig:346-352）
  readonly rowCheckboxes: Locator; // 行チェックボックス cardIds[]（index.twig:417-419）
  readonly selectAll: Locator; // 全選択 #chose_all（index.twig:404-406）
  readonly noResult: Locator; // 検索結果なしメッセージ（index.twig:454 trans admin.common.search_no_result）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/card`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/card/export_csv`;

    this.searchMulti = page.locator("#admin_search_card_multi");
    this.searchButton = page.getByRole("button", { name: "検索", exact: true });
    // 要実機確認: 件数表示の包含クラスは未確定（trans admin.common.search_result の span）。本specでは未使用。
    this.searchResultCount = page.locator("text=admin.common.search_result");
    this.bulkForm = page.locator("#form_bulk");
    // 「CSV出力」ボタンは出力ルートを指す data-action で位置特定（文言は静的だが二重特定で誤認を防ぐ）。
    this.csvExportButton = page.locator(
      '#form_bulk button.action-submit[data-action$="/card/export_csv"]'
    );
    this.rowCheckboxes = page.locator('#form_bulk input[name="cardIds[]"]');
    this.selectAll = page.locator("#chose_all");
    this.noResult = page.locator(".card-body", { hasText: "検索結果が見つかりませんでした" });
  }

  /** カード検索一覧（起点画面・GET）を開く。GET単独では結果非表示のため、結果は searchAll で出す。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 出力ルートへ直接アクセスする（未認証ガード/URL直接アクセス検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath);
  }

  /** 検索キーワードを空のまま検索を実行し、検索結果（CSV出力ボタン付き）を表示させる。 */
  async searchAll() {
    await this.gotoList();
    await this.searchButton.click();
  }

  /** ヒットしないキーワードで検索し、検索結果0件状態を作る。 */
  async searchNoResult(keyword: string) {
    await this.gotoList();
    await this.searchMulti.fill(keyword);
    await this.searchButton.click();
  }

  /** 先頭行のカードを選択する。 */
  async checkFirstCard() {
    await this.rowCheckboxes.first().check();
  }

  /** 全選択チェックをONにする。 */
  async checkAll() {
    await this.selectAll.check();
  }

  /**
   * カードを選択した状態で「CSV出力」を押し、ダウンロード発火を待って Download を返す。
   * CSV出力ボタンは data-confirm を持たないため確認ダイアログは出ない（JS index.twig:62-66）。
   */
  async exportSelected(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportButton.click(),
    ]);
    return download;
  }

  /**
   * 未選択のまま「CSV出力」を押す。実装JS（index.twig:57-60）は1件も選択がないと
   * alert を出して送信を中止する。alert文言とダウンロード非発火を観測するためのヘルパ。
   * @returns 表示された alert のメッセージ（出なければ空文字）
   */
  async exportWithoutSelection(): Promise<string> {
    let dialogMessage = "";
    this.page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await this.csvExportButton.click();
    // JS の同期 alert→dismiss が反映されるまで僅かに待つ（ネットワーク待ちはしない）。
    await this.page.waitForTimeout(300);
    return dialogMessage;
  }

  /** CSV出力ボタンの token-for-anchor 属性（CSRFトークン原値）を読む。 */
  async readCsrfToken(): Promise<string> {
    return (await this.csvExportButton.getAttribute("token-for-anchor")) ?? "";
  }

  /** 先頭行カードチェックボックスの value（カードID）を読む。 */
  async readFirstCardId(): Promise<string> {
    return (await this.rowCheckboxes.first().getAttribute("value")) ?? "";
  }

  /**
   * 認証済みコンテキストの request で出力 POST を送る（応答ヘッダ/リダイレクト検証用）。
   * フィールド名 _token は Constant::TOKEN_NAME（CsrfExtension/isTokenValid 由来）。
   */
  async postExport(
    cardIds: string[],
    token: string,
    maxRedirects = 0
  ): Promise<APIResponse> {
    const form: Record<string, string> = { _token: token };
    cardIds.forEach((id, i) => {
      form[`cardIds[${i}]`] = id;
    });
    return this.page.request.post(this.exportPath, { form, maxRedirects });
  }

  /** 検索結果一覧（CSV出力ボタン付き）が表示されていること。 */
  async seeExportButton() {
    await expect(this.csvExportButton).toBeVisible();
    await expect(this.csvExportButton).toContainText("CSV出力");
  }
}
