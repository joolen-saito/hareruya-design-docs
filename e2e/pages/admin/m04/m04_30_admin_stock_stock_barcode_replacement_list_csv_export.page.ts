import { Download, Locator, Page, Response, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「バーコード貼替リストCSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m04_30_admin_stock_stock_barcode_replacement_list_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-30_admin_stock_stock_barcode_replacement_list_csv_export.md
 *   / 基本設計仕様書(在庫管理機能))由来（オラクル独立性）。実装の現挙動・Form制約(NotBlank等)は期待値に流用しない。
 *
 * 本機能は検索フォーム（出力対象店舗1店舗・価格変更発生期間From/To）をPOST送信し、CSRF検証→フォーム検証後に
 * StreamedResponse でCSVをダウンロードする。検証NG時はエラーをフラッシュ表示して画面（index）へリダイレクトする。
 * 自動化はUI部品表示・初期値・ダウンロード発火・ファイル名・応答ヘッダ・必須/相関バリデーションのエラー遷移・未認証ガードに限る。
 * CSV本文（6列・商品名トリム・言語/状態・販売価格整形・バーコード生成）・抽出条件・出力順・文字コードは手動／間接確認とする。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。Symfony Form getBlockPrefix=`admin_barcode_replacement_list`
 *   ＝BarcodeReplacementListType.php:106-108 から DOM id を導出）:
 *  - フォーム: #barcode_replacement_list_form（barcode_replacement_list.twig:11、action=admin_stock_barcode_replacement_list_csv_export）
 *  - 出力対象店舗 select: #admin_barcode_replacement_list_base_info
 *      （twig:22 form_widget(form.base_info) / BlockPrefix base_info。placeholder「店舗を選択」=trans admin.stock.barcode_replacement_list.base_info_empty messages.ja.yaml:4544）
 *  - 価格変更発生期間From: #admin_barcode_replacement_list_price_change_period_from（twig:28 / DateType single_text=input type=date）
 *  - 価格変更発生期間To: #admin_barcode_replacement_list_price_change_period_to（twig:30 / 同上）
 *  - 送信ボタン: #barcode_replacement_list_form button[type=submit]
 *      ラベル trans admin.stock.barcode_replacement_list.csv_export=「バーコード貼替リストCSV出力」（twig:38-40 / messages.ja.yaml:4547）
 *  - エラー（フラッシュ）: .alert-danger（addError(...,'admin')→eccube.admin.error→alert.twig:41-48）
 *  - 画面タイトル: trans admin.stock.barcode_replacement_list.title=「バーコード貼替リスト」（twig:5 / messages.ja.yaml:4541）
 *
 * 応答仕様根拠（期待値の出典・BarcodeReplacementListCsvExportService.php）:
 *  - Content-Type: application/octet-stream（:95）
 *  - Content-Disposition: attachment; filename=barcode_replacement_list_<YmdHis>.csv（:96-99,59）
 *  - 0件でもヘッダ行のみのCSVを出力（:73 ヘッダ先頭出力）／設計書「分岐・例外: 対象0件」
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockBarcodeReplacementListCsvExportPage {
  readonly page: Page;
  readonly indexUrl: string; // バーコード貼替リスト画面（GET）
  readonly exportPath: string; // CSV出力ルート（POST）

  readonly form: Locator; // #barcode_replacement_list_form
  readonly baseInfoSelect: Locator; // 出力対象店舗 select
  readonly periodFrom: Locator; // 価格変更発生期間 From（input type=date）
  readonly periodTo: Locator; // 価格変更発生期間 To
  readonly submitButton: Locator; // 「バーコード貼替リストCSV出力」ボタン
  readonly error: Locator; // .alert-danger（フラッシュエラー）

  constructor(page: Page) {
    this.page = page;
    this.indexUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/barcode_replacement_list`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/barcode_replacement_list/csv_export`;

    this.form = page.locator("#barcode_replacement_list_form");
    this.baseInfoSelect = page.locator("#admin_barcode_replacement_list_base_info");
    this.periodFrom = page.locator(
      "#admin_barcode_replacement_list_price_change_period_from"
    );
    this.periodTo = page.locator(
      "#admin_barcode_replacement_list_price_change_period_to"
    );
    this.submitButton = page.locator(
      '#barcode_replacement_list_form button[type="submit"]'
    );
    this.error = page.locator(".alert-danger");
  }

  /** バーコード貼替リスト画面（GET）を開く。 */
  async goto() {
    await this.page.goto(this.indexUrl);
  }

  /** 出力対象店舗を選択する。value 未指定時は先頭の実店舗（placeholder以外）を選ぶ。 */
  async selectStore(value?: string) {
    if (value !== undefined) {
      await this.baseInfoSelect.selectOption(value);
      return;
    }
    // placeholder（value=""）以外の最初の option を選ぶ。
    const value0 = await this.baseInfoSelect
      .locator('option:not([value=""])')
      .first()
      .getAttribute("value");
    if (value0 !== null) {
      await this.baseInfoSelect.selectOption(value0);
    }
  }

  /** 出力対象店舗を未選択（placeholder）にする＝NotBlank を誘発させる。 */
  async clearStore() {
    await this.baseInfoSelect.selectOption("");
  }

  /** 価格変更発生期間を設定する（YYYY-MM-DD）。空文字でクリア。 */
  async setPeriod(from: string, to: string) {
    await this.periodFrom.fill(from);
    await this.periodTo.fill(to);
  }

  /** 送信ボタンを押下する（遷移/ダウンロードのハンドリングは呼び出し側）。 */
  async submit() {
    await this.submitButton.click();
  }

  /** 送信→ダウンロード発火を待って Download を返す（正常系）。 */
  async submitAndDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.submitButton.click(),
    ]);
    return download;
  }

  /** 送信→CSV出力POSTの応答とダウンロードを同時に取得する（応答ヘッダ検証用）。 */
  async submitAndCapture(): Promise<{ response: Response; download: Download }> {
    const [response, download] = await Promise.all([
      // CSV出力ルートは POST /…/csv_export（設計書ルート定義）。method/対象パスで限定し別リクエスト混入を防ぐ。
      this.page.waitForResponse(
        (r) =>
          r.url().includes(this.exportPath) && r.request().method() === "POST"
      ),
      this.page.waitForEvent("download"),
      this.submitButton.click(),
    ]);
    return { response, download };
  }

  /**
   * 未認証で CSV出力ルート（POST）へ直接リクエストする（権限・認可の確認用）。
   * ログインを経ずに送るため、firewall によりログイン誘導/拒否されることを期待値とする。
   * リダイレクトは追わず（maxRedirects:0）応答ステータス/Location を呼び出し側で検証する。
   */
  async postExportUnauthenticated() {
    return this.page.request.post(this.exportPath, {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
  }

  /** 画面のUI部品が仕様どおり表示されること。 */
  async seeForm() {
    await expect(this.page.locator("body")).toContainText("バーコード貼替リスト");
    await expect(this.baseInfoSelect).toBeVisible();
    await expect(this.periodFrom).toBeVisible();
    await expect(this.periodTo).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
