import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 データ管理 > 祝日の追加・削除 画面 Page Object。
 * 納品ケース表 integration_test/e2e/m16_03_admin_data_data_holiday_add_delete_e2e_cases.md に対応。
 *
 * 期待結果は仕様(設計書 functions/pf-eccube3/m16-03_admin_data_data_holiday_add_delete.md / 観点表 /
 * 刷新先 messages.ja.yaml・validators.ja.yaml)由来（オラクル独立性）。本Page Objectが保持するのは
 * Twig＋Symfony Form 由来のセレクタ（位置情報）のみで、合否は仕様で判定する。
 * 本設計書は現行 pf-eccube3(HareruyaEcプラグイン)のリバースであり、刷新先 ec-cube-enterprise はコア提供。
 * ルート(/data/holiday)・トグル要素(#holidayAddToggle/#holidayAddForm)・メッセージ鍵・タイトル等の乖離は
 * ケース表 付帯表4 を参照（テストは仕様どおりに書き、乖離は落ちて検出する）。
 *
 * 画面・ルート（ec-cube-enterprise 実装位置）:
 *  - GET/POST /%admin%/data/holiday        （admin_data_holiday・HolidayController.php:45。一覧＋追加POSTが同一ルート。失敗/重複/成功とも :96-124 で同ルートへリダイレクト）
 *  - DELETE   /%admin%/data/holiday/{id}/delete （admin_data_holiday_delete・HolidayController.php:136。成功/失敗とも :148 で一覧へ）
 *
 * DOM id 根拠: Symfony Form getBlockPrefix=`holiday_add`（HolidayAddType は getBlockPrefix 未定義＝クラス名由来）。
 *  - name → #holiday_add_name（holiday.twig:119 form_widget(form.name) / placeholder admin.data.holiday.name_placeholder messages.ja.yaml:5826 / maxlength=64 HolidayAddType.php:45）
 *  - date → #holiday_add_date（holiday.twig:123 DateType single_text input type=date / yyyy-MM-dd）
 *  - 追加ボタン → #holidayAddForm 内 button[type=submit] trans admin.data.holiday.add_submit「追加」（holiday.twig:133-135 / messages.ja.yaml:5829）
 *  - 新規登録/戻るトグル → #holidayAddToggle（holiday.twig:98）data-bs-target #holidayAddForm（:108 Bootstrap collapse）
 *       展開ラベル admin.data.holiday.add_button「新規登録」（:103 / messages.ja.yaml:5828）/ 収納ラベル admin.common.back「戻る」（:104 / messages.ja.yaml:1464）
 *  - 一覧表 → table.holiday-table（holiday.twig:180）列見出し 名称(:183 messages:5824)/日付(:184 :5825)/削除(:185 :1444)
 *  - 削除リンク → table.holiday-table a[data-method="delete"]（holiday.twig:194-199）data-message admin.data.holiday.delete_confirm（:197 / messages.ja.yaml:5827）
 */
export class DataDataHolidayAddDeletePage {
  readonly page: Page;
  readonly listUrl: string;

  readonly table: Locator; // 一覧表 .holiday-table
  readonly headerName: Locator; // 列見出し「名称」
  readonly headerDate: Locator; // 列見出し「日付」
  readonly headerDelete: Locator; // 列見出し「削除」

  readonly addToggle: Locator; // #holidayAddToggle（新規登録/戻る）
  readonly addForm: Locator; // #holidayAddForm（collapse）
  readonly nameInput: Locator; // #holiday_add_name
  readonly dateInput: Locator; // #holiday_add_date
  readonly addSubmit: Locator; // 追加フォーム内 submit「追加」

  readonly deleteLinks: Locator; // 一覧行の削除リンク

  readonly loadStartDate: Locator; // #holiday_load_start_date（一括読込 開始日付）
  readonly loadEndDate: Locator; // #holiday_load_end_date（一括読込 終了日付）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/data/holiday`;

    this.table = page.locator("table.holiday-table");
    this.headerName = this.table.locator("thead th", { hasText: "名称" });
    this.headerDate = this.table.locator("thead th", { hasText: "日付" });
    this.headerDelete = this.table.locator("thead th", { hasText: "削除" });

    this.addToggle = page.locator("#holidayAddToggle");
    this.addForm = page.locator("#holidayAddForm");
    this.nameInput = page.locator("#holiday_add_name");
    this.dateInput = page.locator("#holiday_add_date");
    this.addSubmit = this.addForm.locator('button[type="submit"]');

    this.deleteLinks = this.table.locator('a[data-method="delete"]');

    // 一括読込フォーム（HolidayLoadType getBlockPrefix 未定義＝クラス名由来 `holiday_load`）。
    //  start_date → #holiday_load_start_date / end_date → #holiday_load_end_date（holiday.twig:150,155 DateType single_text）。
    this.loadStartDate = page.locator("#holiday_load_start_date");
    this.loadEndDate = page.locator("#holiday_load_end_date");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 一覧の列見出しが仕様どおり表示されること（名称/日付/削除）。 */
  async seeListColumns() {
    await expect(this.headerName).toBeVisible();
    await expect(this.headerDate).toBeVisible();
    await expect(this.headerDelete).toBeVisible();
  }

  /** 「新規登録」ボタンを押して追加フォームを開く（Bootstrap collapse は要実機確認）。 */
  async openAddForm() {
    await this.addToggle.click();
    await expect(this.addForm).toBeVisible();
  }

  /** 「戻る」を押して追加フォームを閉じる。 */
  async closeAddForm() {
    await this.addToggle.click();
    await expect(this.addForm).toBeHidden();
  }

  /** 追加フォームへ名称・日付を入力し「追加」を押す。日付は yyyy-MM-dd。 */
  async submitAdd(name: string, dateYmd: string) {
    await this.nameInput.fill(name);
    await this.dateInput.fill(dateYmd);
    await this.addSubmit.click();
  }

  /** トグルボタンに現在表示されているラベル文言（仕様: 新規登録 ⇄ 戻る）を返す。 */
  async toggleVisibleLabel(): Promise<string> {
    return (await this.addToggle.innerText()).trim();
  }

  /** body に指定の文言（フラッシュメッセージ等）が含まれること。期待文言は仕様正典(messages.ja.yaml)由来。 */
  async seeMessage(text: string) {
    await expect(this.page.locator("body")).toContainText(text);
  }

  /** 一覧に指定日付(Y/m/d)の行が含まれること（追加の間接確認）。 */
  async seeDateInList(dateSlash: string) {
    await expect(this.table.locator("tbody")).toContainText(dateSlash);
  }

  /** 一覧に指定日付(Y/m/d)の行が含まれないこと（削除の間接確認）。 */
  async notSeeDateInList(dateSlash: string) {
    await expect(this.table.locator("tbody")).not.toContainText(dateSlash);
  }

  /** 一括読込フォーム（期間指定）の存在確認: 開始/終了日付の入力欄が表示されること。DOM id は要実機確認。 */
  async seeLoadForm() {
    await expect(this.loadStartDate).toBeVisible();
    await expect(this.loadEndDate).toBeVisible();
  }

  /** 一覧の日付列（Y/m/d・2列目）のテキストを上から順に返す（昇順ソート順検証用）。 */
  async listDateCells(): Promise<string[]> {
    const cells = this.table.locator("tbody tr td:nth-child(2)");
    return (await cells.allInnerTexts()).map((t) => t.trim());
  }
}
