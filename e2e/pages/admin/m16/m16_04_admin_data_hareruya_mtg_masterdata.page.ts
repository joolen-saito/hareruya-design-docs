import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 データ管理 > MTGマスターデータ編集 Page Object（種別選択＋全行一括編集の汎用エディタ）。
 *
 * 構造参考: ec-cube-enterprise/e2e-tests の既存 Page Object。本ファイルは設計書+Twig由来の未実行雛形。
 * 期待結果は仕様（正本 functions/pf-eccube3/m16-04_admin_data_hareruya_mtg_masterdata.md／観点表／基本設計）由来（オラクル独立性）。
 * 実装から取るのはセレクタ（位置情報）のみ。設計と刷新先 ec-cube-enterprise の乖離（入口ルート・種別実値・
 * 成功/エラー挙動・NotBlank分岐の有無）はケース表「付帯表4」に出し、テストは仕様どおりに書く（実装が違えば落ちて検出する）。
 *
 * セレクタ由来（src/Eccube より）:
 *  - 一覧URL: MtgMasterDataController.php:333 route admin_data_mtg_master_data = GET/POST /%eccube_admin_route%/data/mtg_master_data
 *      ※ 設計書（md「利用者視点の入口」）は /{admin_route}/masterdata を入口とするが、刷新実装は /data/mtg_master_data（付帯表4#1）。
 *        URLは位置情報として実装値を用い、パス乖離はケース表に記録する。
 *      ※ entity 未指定GETは先頭種別へリダイレクト（controller:339-341）。種別は query 'entity'（controller:343）。
 *  - 種別プルダウン: mtg_master_data.twig:55 <select name="entity">（option は entityChoices twig:56-58）
 *  - 「選択」ボタン: mtg_master_data.twig:60 trans admin.data.mtg_master_data.select（messages.ja.yaml:5815）
 *  - 編集フォーム: mtg_master_data.twig:66 <form id="edit_form" method="post">（_token twig:67 / entity_key twig:68）
 *  - 一覧テーブル: mtg_master_data.twig:80 <table class="... mtg-master-table">
 *  - 列見出し: mtg_master_data.twig:84 <th>{{ column.label }}</th>
 *  - 真偽列(0/1セレクト): mtg_master_data.twig:94-98（set_type=='bool'）name="rows[{id}][{field}]"
 *  - テキスト/数値/日時入力: mtg_master_data.twig:100-106（datetime→type=datetime-local, int→type=number, 固定行→readonly）
 *  - 新規行入力: mtg_master_data.twig:121-126 name="rows[new][{field}]"
 *  - 「登録」ボタン: mtg_master_data.twig:148 trans admin.common.registration（messages.ja.yaml:1436）form="edit_form"
 *  - タイトル: default_frame block title / card-header span ともに trans admin.data.mtg_master_data_management=「MTGマスターデータ管理」(twig:15,51 / messages.ja.yaml:5813)
 *  - 成功フラッシュ: alert.twig:22 .alert-success ／ エラーフラッシュ: alert.twig:32 .alert-danger
 */
export class DataHareruyaMtgMasterdataPage {
  readonly page: Page;
  readonly url: string;

  readonly entitySelect: Locator; // mtg_master_data.twig:55
  readonly selectButton: Locator; // mtg_master_data.twig:60 「選択」
  readonly editForm: Locator; // mtg_master_data.twig:66 #edit_form
  readonly registerButton: Locator; // mtg_master_data.twig:148 「登録」
  readonly table: Locator; // mtg_master_data.twig:80
  readonly headerCells: Locator; // mtg_master_data.twig:84 thead th
  readonly bodyRows: Locator; // tbody tr（既存行＋末尾の新規行）
  readonly pageTitle: Locator; // default_frame .c-pageTitle__title
  readonly cardHeader: Locator; // mtg_master_data.twig:51 .card-header span
  readonly successFlash: Locator; // alert.twig:22 .alert-success
  readonly errorFlash: Locator; // alert.twig:32 .alert-danger

  constructor(page: Page) {
    this.page = page;
    // 実装の route 値（位置情報）。設計入口 /masterdata との乖離は付帯表4#1。
    this.url = `/${ECCUBE_ADMIN_ROUTE}/data/mtg_master_data`;
    this.entitySelect = page.locator('select[name="entity"]');
    this.selectButton = page.getByRole("button", { name: "選択" });
    this.editForm = page.locator("#edit_form");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.table = page.locator("table.mtg-master-table");
    this.headerCells = this.table.locator("thead th");
    this.bodyRows = this.table.locator("tbody tr");
    this.pageTitle = page.locator(".c-pageTitle__title");
    this.cardHeader = page.locator(".card-header span").first();
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
  }

  /** URL直接GETで一覧画面を開く（entity 任意。未指定は先頭種別へ誘導される）。 */
  async goto(entityKey?: string) {
    const url = entityKey ? `${this.url}?entity=${entityKey}` : this.url;
    await this.page.goto(url);
  }

  /** 種別プルダウンでラベルを選び「選択」を押して当該種別の一覧へ。 */
  async selectEntityByLabel(label: string) {
    await this.entitySelect.selectOption({ label });
    await this.selectButton.click();
  }

  /** 末尾の新規行の指定フィールド入力欄（name="rows[new][field]"）。 */
  newRowInput(field: string): Locator {
    return this.page.locator(`input[name="rows[new][${field}]"]`);
  }

  /** 既存行のうち最初の編集可能（readonly でない）テキスト入力欄。 */
  firstEditableTextInput(): Locator {
    return this.table.locator(
      'tbody input[type="text"]:not([readonly])'
    ).first();
  }

  /** 編集フォームを「登録」送信する。 */
  async clickRegister() {
    await this.registerButton.click();
  }

  /** 一覧テーブル・タイトルが仕様どおり表示されていること。 */
  async seeList() {
    await expect(this.table).toBeVisible();
  }

  /** 見出しに「MTGマスターデータ管理」が表示されること（タイトル帯またはカードヘッダ）。 */
  async seeTitle() {
    await expect(this.page.locator("body")).toContainText("MTGマスターデータ管理");
  }

  /** 登録成功フラッシュ（成功アラート）が表示されること。文言の完全一致はオラクル化しない（付帯表4#5）。 */
  async seeRegisterSuccess() {
    await expect(this.successFlash).toBeVisible();
  }

  /** エラーフラッシュが表示され、登録成功フラッシュは表示されないこと（処理が完了しない）。 */
  async seeRegisterErrorNoSuccess() {
    await expect(this.errorFlash).toBeVisible();
    await expect(this.successFlash).toHaveCount(0);
  }
}
