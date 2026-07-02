import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 設定 > システム設定 > マスタデータ管理 Page Object（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m11_05_admin_system_setting_setting_system_masterdata_e2e_cases.md に対応。
 *
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m11-05_admin_system_setting_setting_system_masterdata.md /
 * 観点表 / messages.ja.yaml・validators.ja.yaml の確認値）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix 由来の位置情報のみ。合否は仕様で判定する。
 *
 * DOM id 根拠（getBlockPrefix）:
 *  - マスタ選択 select: MasterdataType.getBlockPrefix=`admin_system_masterdata`（MasterdataType.php:89-92）
 *      → #admin_system_masterdata_masterdata（masterdata.twig:34 form.masterdata）
 *  - 編集フォーム hidden: MasterdataEditType.getBlockPrefix=`admin_system_masterdata_edit`（MasterdataEditType.php:75-78）
 *      → #admin_system_masterdata_edit_masterdata_name（masterdata.twig:47）
 *  - 行入力: MasterdataDataType（CollectionType entry, blockPrefix=`admin_system_masterdata_data`）
 *      → #admin_system_masterdata_edit_data_{key}_id（masterdata.twig:71）/ _name（masterdata.twig:75）
 *      ※ {key} は一覧時はエンティティ主キー、末尾追加行は採番のため index 固定でなく CSS で行走査する。
 *  - 「選択」ボタン: trans admin.setting.system.master_data.select=「選択」（masterdata.twig:38 / messages.ja.yaml:3131）
 *  - 「保存」ボタン: trans admin.common.save=「保存」（masterdata.twig:95 / messages.ja.yaml:1434）
 *      ※ 設計書は「登録（保存）」と表記するが実装の trans 値は「保存」。差異は付帯表4で管理。
 *  - ツールチップ見出し: data-bs-toggle="tooltip"（masterdata.twig:27）/ span 見出し master_data_management（twig:28 / messages.ja.yaml:2795）
 *  - 説明文 .read: trans master_data.description（twig:52 / messages.ja.yaml:3132-3136, nl2br）
 *  - 列見出し ID/Name（twig:60,63 / messages.ja.yaml:3137-3138）
 */
export class SystemSettingSettingSystemMasterdataPage {
  readonly page: Page;
  readonly listUrl: string; // マスタ選択/一覧の入口（GET・POST select）
  readonly editPostUrl: string; // 編集テーブル保存 POST（form2 action）

  readonly masterSelect: Locator; // #admin_system_masterdata_masterdata（masterdata.twig:34）
  readonly selectButton: Locator; // 「選択」（masterdata.twig:38）
  readonly tooltipHeading: Locator; // ツールチップ付き見出し（masterdata.twig:27）
  readonly headingSpan: Locator; // 見出し span「マスタデータ管理」（masterdata.twig:28）

  readonly form1: Locator; // #form1（masterdata.twig:23）
  readonly form2: Locator; // #form2 編集テーブル（masterdata.twig:46。form2.data 非空時のみ）
  readonly masterdataNameHidden: Locator; // #admin_system_masterdata_edit_masterdata_name（masterdata.twig:47）
  readonly description: Locator; // .read 説明文（masterdata.twig:51-53）
  readonly editTable: Locator; // #form2 table（masterdata.twig:56）
  readonly columnHeaders: Locator; // #form2 thead th（masterdata.twig:59-64）
  readonly editRows: Locator; // #form2 tbody tr（masterdata.twig:68-78）
  readonly saveButton: Locator; // 「保存」（masterdata.twig:95）
  readonly successAlert: Locator; // 成功フラッシュ admin.common.save_complete（要実機確認: クラス）
  readonly errorAlert: Locator; // 失敗フラッシュ admin.common.save_error（要実機確認: クラス）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/system/masterdata`;
    this.editPostUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/system/masterdata/edit`;

    this.masterSelect = page.locator("#admin_system_masterdata_masterdata");
    this.selectButton = page.locator('#form1 button[type="submit"]');
    // 共通ヘッダ等の別ツールチップ誤検出を避け、第1カード見出しの tooltip に限定（masterdata.twig:26-27）。
    this.tooltipHeading = page.locator('#form1 .card-header [data-bs-toggle="tooltip"]');
    this.headingSpan = page.locator("#form1 .card-header span");

    this.form1 = page.locator("#form1");
    this.form2 = page.locator("#form2");
    this.masterdataNameHidden = page.locator("#admin_system_masterdata_edit_masterdata_name");
    this.description = page.locator("#form2 .read");
    this.editTable = page.locator("#form2 table");
    this.columnHeaders = page.locator("#form2 thead th");
    this.editRows = page.locator("#form2 tbody tr");
    this.saveButton = page.locator('#form2 button[type="submit"]');
    // フラッシュのクラスは実機確認後に確定する（共通フレーム）。テキスト存在でも代替判定する。
    this.successAlert = page.locator(".alert-success");
    this.errorAlert = page.locator(".alert-danger, .alert-warning");
  }

  /** マスタ未選択のマスタデータ管理画面を開く（GET）。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** マスタキーを指定して一覧入口を直接開く（GET /{entity}/edit）。 */
  async gotoEntity(entityKey: string) {
    await this.page.goto(`${this.listUrl}/${entityKey}/edit`);
  }

  /** 編集のみの入口を直接開く（GET /masterdata/edit）。編集対象データが無ければ編集表は出ない。 */
  async gotoEditOnly() {
    await this.page.goto(this.editPostUrl);
  }

  /** マスタ選択 select の option 値（マスタキー）一覧を読む。 */
  async masterOptionValues(): Promise<string[]> {
    const values = await this.masterSelect
      .locator("option")
      .evaluateAll((opts) =>
        opts
          .map((o) => (o as HTMLOptionElement).value)
          .filter((v) => v !== "")
      );
    return values;
  }

  /** マスタ選択 select の現在値（マスタキー）を読む。 */
  async selectedMasterKey(): Promise<string> {
    return await this.masterSelect.inputValue();
  }

  /** 編集フォーム hidden のマスタキーを読む（選択後）。 */
  async editMasterKey(): Promise<string> {
    return (await this.masterdataNameHidden.inputValue()).trim();
  }

  /** プルダウンの先頭マスタを選び「選択」を送信する（表示確認用・非破壊）。 */
  async selectFirstMaster(): Promise<string> {
    const value = await this.masterSelect
      .locator("option")
      .first()
      .getAttribute("value");
    await this.masterSelect.selectOption({ index: 0 });
    await this.selectButton.click();
    return value ?? "";
  }

  /** 末尾の行（ID・名称が空の追加行）の ID 入力欄。 */
  rowId(i: number): Locator {
    return this.editRows.nth(i).locator('input[id$="_id"]');
  }

  /** 行 i の名称入力欄。 */
  rowName(i: number): Locator {
    return this.editRows.nth(i).locator('input[id$="_name"]');
  }

  /** 編集テーブルを保存（form2 を submit）。 */
  async save() {
    await this.saveButton.click();
  }

  /** マスタ選択フォームの部品が仕様どおり表示されること。 */
  async seeSelectForm() {
    await expect(this.masterSelect).toBeVisible();
    await expect(this.selectButton).toBeVisible();
    await expect(this.tooltipHeading).toBeVisible();
  }

  /** 編集テーブルの列見出し「ID」「Name」が表示されること。 */
  async seeColumnHeaders() {
    await expect(this.columnHeaders.nth(0)).toContainText("ID");
    await expect(this.columnHeaders.nth(1)).toContainText("Name");
  }
}
