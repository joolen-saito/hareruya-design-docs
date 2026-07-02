import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * デッキ管理 — デッキタグ一覧 Page Object。
 * 納品ケース表 integration_test/e2e/m15_07_admin_deck_deck_tag_list_e2e_cases.md に対応。
 *
 * 重要（screenExists=false）: 設計書(pf-eccube3 カスタムプラグイン HareruyaEc)が記述する専用画面
 *   `deckTag.twig`（一覧＋モーダル編集＋件数/並び順ドロップダウン＋ページネーション＋行単位削除）は
 *   刷新先 ec-cube-enterprise に存在しない。デッキタグ管理は汎用「MTGマスターデータ管理」画面
 *   （admin_data_mtg_master_data＝/{admin_route}/data/mtg_master_data?entity=deck_tag、
 *   MtgMasterDataController.php:333、テンプレート @admin/Data/mtg_master_data.twig）で行う。
 *   本POMは**代替画面**のセレクタ（位置情報のみ）を保持する。設計書固有の #editModal・件数/並び
 *   ドロップダウン・行削除リンク等は刷新先に存在しないため定義しない（創作禁止）。
 *
 * 期待結果は仕様（基本設計＝刷新後要件 / messages.ja.yaml）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM 由来:
 *  - 画面ルート: admin_data_mtg_master_data（MtgMasterDataController.php:333）。?entity=deck_tag で deck_tag を選択
 *  - deck_tag の列/フィールド: nameJp/nameEn/sortNo（label name_jp/name_en/sort_no）(MtgMasterDataController.php:255-265)
 *  - エンティティ選択 select[name="entity"]（mtg_master_data.twig:55）/ 選択ボタン trans admin.data.mtg_master_data.select（twig:60 / messages.ja.yaml:5815）
 *  - 列見出し th（mtg_master_data.twig:84、column.label）
 *  - 既存行入力 input[name="rows[<id>][nameJp|nameEn|sortNo]"]（twig:100-106）
 *  - 新規行入力 input[name="rows[new][nameJp|nameEn|sortNo]"]（twig:121-126）
 *  - 登録ボタン button[type=submit][form="edit_form"] trans admin.common.registration（twig:148 / messages.ja.yaml:1435）
 *  - 成功フラッシュ admin.common.save_complete=「保存しました」（messages.ja.yaml:1398、Controller.php:379）
 */
export class DeckDeckTagListPage {
  readonly page: Page;
  readonly url: string; // 代替画面（entity=deck_tag）

  readonly entitySelect: Locator; // mtg_master_data.twig:55 select[name=entity]
  readonly selectButton: Locator; // mtg_master_data.twig:60 trans admin.data.mtg_master_data.select
  readonly registerButton: Locator; // mtg_master_data.twig:148 trans admin.common.registration
  readonly table: Locator; // mtg_master_data.twig:80 一括編集テーブル
  readonly columnHeaders: Locator; // mtg_master_data.twig:84 列見出し th

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/data/mtg_master_data?entity=deck_tag`;
    this.entitySelect = page.locator('select[name="entity"]');
    this.selectButton = page.getByRole("button", { name: "選択" });
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.table = page.locator("table.mtg-master-table");
    this.columnHeaders = this.table.locator("thead th");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 既存行 input（rows[<id>][<field>]）。field は nameJp/nameEn/sortNo。 */
  rowInput(id: number | string, field: "nameJp" | "nameEn" | "sortNo"): Locator {
    return this.page.locator(`input[name="rows[${id}][${field}]"]`);
  }

  /** 末尾の新規行 input（rows[new][<field>]）。 */
  newRowInput(field: "nameJp" | "nameEn" | "sortNo"): Locator {
    return this.page.locator(`input[name="rows[new][${field}]"]`);
  }

  /**
   * 既存（登録済み）行の input セレクタ。末尾の新規入力行（rows[new][...]）は除外する。
   * これにより firstRowId/seeList がシード未投入時に新規空行を誤って既存行と見なすことを防ぐ。
   */
  existingRowInputs(): Locator {
    return this.table.locator(
      'tbody input[name^="rows["]:not([name^="rows[new]"])'
    );
  }

  /**
   * 既存（登録済み）行の id を読む。新規行（rows[new]）は除外するため、既存行が無ければ null を返す。
   * 行 id は実機データ依存のため要実機確認。
   */
  async firstRowId(): Promise<string | null> {
    const first = this.existingRowInputs().first();
    if ((await first.count()) === 0) return null;
    const name = await first.getAttribute("name"); // rows[<id>][nameJp]
    const m = name?.match(/^rows\[(\d+)\]/); // 数値 id のみ（new は除外）
    return m ? m[1] : null;
  }

  async clickRegister() {
    await this.registerButton.click();
  }

  /**
   * 一覧（列見出しと既存行）が仕様どおり表示されること。
   * 既存行の存在は existingRowInputs()（末尾の新規空行 rows[new] を除外）で検証する。
   * tbody tr は常に新規入力行を含むため行数では既存行0件を検知できない（要シード）。
   */
  async seeList() {
    await expect(this.table).toBeVisible();
    await expect(this.columnHeaders.filter({ hasText: "name_jp" })).toBeVisible();
    await expect(this.columnHeaders.filter({ hasText: "name_en" })).toBeVisible();
    await expect(this.columnHeaders.filter({ hasText: "sort_no" })).toBeVisible();
    // 既存（登録済み）行が1件以上あること（新規空行は除外）
    expect(await this.existingRowInputs().count(), "既存デッキタグ行が表示される（要シード）").toBeGreaterThan(0);
  }

  /** 成功フラッシュ「保存しました」が表示されること（admin.common.save_complete）。 */
  async seeSaveComplete() {
    await expect(this.page.locator("body")).toContainText("保存しました");
  }
}
