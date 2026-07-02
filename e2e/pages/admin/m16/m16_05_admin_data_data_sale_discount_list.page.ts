import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 データ管理 — 販売割引率一覧 Page Object（閲覧専用 list 画面）。
 * 納品ケース表 integration_test/e2e/m16_05_admin_data_data_sale_discount_list_e2e_cases.md に対応。
 *
 * 期待結果は仕様（functions/pf-eccube3/m16-05_admin_data_data_sale_discount_list.md / 観点表）由来（オラクル独立性）。
 * 実装（ec-cube-enterprise の現挙動）からはセレクタ（位置情報）のみ取得する。
 * 設計（pf-eccube3 HareruyaEc）と刷新先（ec-cube-enterprise コア）の乖離はケース表 付帯表4 を参照:
 *  - #1 タイトル: 設計「割引率管理」/「割引率一覧」 vs 刷新「販売割引率一覧」/「データ管理」
 *  - #2 交差なしセル: 設計「未定義」 vs 刷新「-」
 *  - #3 入口パス: 設計 /{admin_route}/discount vs 刷新 /{admin_route}/data/discount（本POMは刷新先パスでナビゲート）
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Data/discount.twig）:
 *  - 一覧表 table.discount-table（discount.twig:49）/ ラッパ .table-responsive.with-border（:48）
 *  - 表頭 thead th（:51-56）。先頭= 「名称」 trans admin.data.discount.name（:52 / messages.ja.yaml:5820）。以降= CardCondition.code（:54）
 *  - 表本体 tbody tr（:59-72）。各行 先頭 td= Discount.name（:61）。交差セル= rate or 「-」（:63-69）
 *  - 本文 block main（:42-80）に form/button/行リンクは無い（閲覧専用）
 */
export class DataDataSaleDiscountListPage {
  readonly page: Page;
  readonly url: string; // 刷新先入口 admin_data_discount（DiscountController.php:37）

  readonly table: Locator; // table.discount-table（discount.twig:49）
  readonly headerCells: Locator; // thead th（discount.twig:51-56）
  readonly nameHeader: Locator; // thead 先頭 th「名称」（discount.twig:52）
  readonly bodyRows: Locator; // tbody tr（discount.twig:59）
  readonly mainArea: Locator; // block main 本文領域（discount.twig:42）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/data/discount`;

    this.table = page.locator("table.discount-table");
    this.headerCells = page.locator("table.discount-table thead th");
    this.nameHeader = this.headerCells.first();
    this.bodyRows = page.locator("table.discount-table tbody tr");
    this.mainArea = page.locator(".c-contentsArea__primaryCol");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 一覧画面が表示され、表頭の左端が設計どおり「名称」であること。 */
  async seeList() {
    await expect(this.table).toBeVisible();
    await expect(this.nameHeader).toHaveText("名称"); // 設計: 左端ヘッダ「名称」
  }

  /** 表頭の列見出し（先頭「名称」＋カード状態 code）が並ぶこと。先頭以外の列見出しを返す。 */
  async columnCodeHeaders(): Promise<string[]> {
    const all = await this.headerCells.allInnerTexts();
    return all.slice(1).map((s) => s.trim());
  }

  /** 1データ行のセル数（名称列＋カード状態列数）を返す。 */
  async firstRowCellCount(): Promise<number> {
    return await this.bodyRows.first().locator("td").count();
  }

  /** 本文の表領域に入力欄・送信ボタン・行リンクが存在しないこと（閲覧専用）。 */
  async seeReadOnly() {
    await expect(this.mainArea.locator("form")).toHaveCount(0);
    await expect(this.mainArea.locator("button")).toHaveCount(0);
    await expect(this.mainArea.locator("input")).toHaveCount(0);
    await expect(this.mainArea.locator("a")).toHaveCount(0);
  }
}
