import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理「イベント申込一括CSV登録（CSVアップロード/取込）」Page Object（M13-13）。
 * 納品ケース表 integration_test/e2e/m13_13_admin_event_event_entry_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-13_admin_event_event_entry_csv_import.md / 観点表)由来（オラクル独立性）。
 * 設計源は pf-eccube3（HareruyaEcプラグイン）のリバースだが、基本設計/設計書を上位オラクルとし、
 * 刷新先 ec-cube-enterprise に当該画面の存在を確認済み。実装からはセレクタ（位置情報）のみを取り、
 * 表示文言・遷移・必須/エラー判定は仕様で判定する。Form制約(NotBlank/File)・行数上限の実装値・成功メッセージの
 * 実装文言は期待値に流用しない（乖離は付帯表4で管理）。
 *
 * 画面/ルート根拠（src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php）:
 *  - アップロード画面 admin_event_entry_bulk_csv_import = GET/POST /<route>/event/entry/bulk_csv_import（:59-66）
 *  - 雛形ダウンロード admin_event_entry_bulk_csv_template = GET /<route>/event/entry/bulk_csv_template（:156-162。ファイル名 event_entry.csv :172）
 *  ※ 設計書(pf-eccube3)の入口 /entry/bulkentry・/entry/bulkentry/upload・/entry/entry_csv_template とは
 *    URLパターン/分割が異なる（付帯表4 不具合候補#1）。位置情報は刷新先ルートで確定する。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig）。
 * DOM id は Symfony Form getBlockPrefix=`admin_csv_import`（CsvImportType.php:80-83）由来:
 *  - ファイル入力        #admin_csv_import_import_file（twig:18,69。form.import_file。accept=text/csv,.csv :69）
 *  - 選択ファイル名表示    #admin_csv_import_import_file_name（twig:27,68。初期 trans admin.common.file_select_empty=「選択されていません」:60/messages.ja.yaml:1560）
 *  - CSRFトークン        #admin_csv_import__token（twig:65。form._token hidden）
 *  - ファイル選択ボタン    #file-select（twig:67。trans admin.common.file_select=「ファイルを選択」messages.ja.yaml:1553）
 *  - 一括登録(送信)ボタン  #upload-button（twig:72。type=submit。初期 disabled。trans admin.common.bulk_registration=「一括登録を実行」messages.ja.yaml:1451）
 *  - 雛形DLリンク        #download-button（twig:89。href=admin_event_entry_bulk_csv_template。trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages.ja.yaml:1548）
 *  - エラー一覧          .alert.alert-danger（twig:40。各エラーを <p> で列挙 twig:41-46）
 *  - フォーマット表       .table.table-bordered（twig:95。ヘッダ名＋必須バッジ＋説明）
 *  - 必須バッジ          .badge.bg-primary（twig:102。trans admin.common.required=「必須」messages.ja.yaml:1528）
 *  - タイトル見出し       trans admin.event.entry.bulk_csv_upload_title=「イベント一括登録CSVアップロード」（twig:5/messages.ja.yaml:5577）
 *  - サブタイトル        trans admin.event.event_management=「イベント管理」（twig:6/messages.ja.yaml:5548）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class EventEventEntryCsvImportPage {
  readonly page: Page;
  readonly uploadUrl: string; // アップロード画面（GET/POST 同一ルート）
  readonly templateUrl: string; // 雛形ダウンロード（GETアンカー先）

  readonly fileInput: Locator; // #admin_csv_import_import_file
  readonly fileNameLabel: Locator; // #admin_csv_import_import_file_name
  readonly fileSelectButton: Locator; // #file-select
  readonly uploadButton: Locator; // #upload-button（初期 disabled）
  readonly downloadLink: Locator; // #download-button
  readonly errorAlert: Locator; // .alert.alert-danger
  readonly formatTable: Locator; // .table.table-bordered
  readonly requiredBadge: Locator; // .badge.bg-primary（「必須」）

  constructor(page: Page) {
    this.page = page;
    this.uploadUrl = `/${ECCUBE_ADMIN_ROUTE}/event/entry/bulk_csv_import`;
    this.templateUrl = `/${ECCUBE_ADMIN_ROUTE}/event/entry/bulk_csv_template`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileNameLabel = page.locator("#admin_csv_import_import_file_name");
    this.fileSelectButton = page.locator("#file-select");
    this.uploadButton = page.locator("#upload-button");
    this.downloadLink = page.locator("#download-button");
    this.errorAlert = page.locator(".alert.alert-danger");
    this.formatTable = page.locator(".table.table-bordered");
    this.requiredBadge = page.locator(".badge.bg-primary");
  }

  async goto() {
    await this.page.goto(this.uploadUrl);
  }

  async gotoTemplate() {
    await this.page.goto(this.templateUrl);
  }

  /**
   * CSVファイルをメモリ上のバッファで選択し、一括登録(送信)する。
   * setInputFiles が change を発火し、JS（twig:24-30）で #upload-button が活性化される前提。
   */
  async upload(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** アップロード画面の主要UI部品が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.fileSelectButton).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.downloadLink).toBeVisible();
    await expect(this.formatTable).toBeVisible();
  }

  /** フォーマット説明テーブルの行数（各列の定義行。仕様「各列の入力ルール」＝複数行）。 */
  async formatTableRowCount(): Promise<number> {
    return await this.formatTable.locator("tr").count();
  }

  /** 雛形ダウンロードリンクを押下し、download イベントを取得する。 */
  async clickTemplateDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.downloadLink.click(),
    ]);
    return download;
  }

  /**
   * 雛形CSVの本文を取得する（認証済みセッションのcookieを流用）。
   * 仕様「雛形の見出し名と一致する必要がある」ため、取込到達系(021/023)のヘッダ土台は
   * 雛形そのものから取得する（実装の列名をテストにハードコードせずオラクル独立性を保つ）。
   */
  async fetchTemplate(): Promise<string> {
    const res = await this.page.request.get(this.templateUrl);
    return await res.text();
  }

  /** 雛形CSVのヘッダ行（1行目）を取得する。 */
  async fetchTemplateHeader(): Promise<string> {
    const body = await this.fetchTemplate();
    return body.split(/\r?\n/)[0];
  }
}
