import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 デッキ管理「検索一覧からの一括編集」Page Object（M15-04）。
 * 納品ケース表 integration_test/e2e/m15_04_admin_deck_deck_bulk_update_e2e_cases.md に対応。
 * 期待結果は仕様(functions/pf-eccube3/m15-04_admin_deck_deck_bulk_update.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * 設計は pf-eccube3(HareruyaEc) のリバース。刷新先 ec-cube-enterprise との乖離はケース表「不具合候補」を参照。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_deck_bulk_update`（DeckBulkUpdateType.php:125-128）由来の位置情報のみ。
 *
 * DOM/セレクタ根拠（ec-cube-enterprise src/Eccube）:
 *  - 一括編集ボタン #toggle_bulk_edit 文言 admin.deck.bulk_edit「一括編集」(template/admin/Deck/index.twig:406 / messages.ja.yaml:4112)
 *  - 一括編集パネル #bulk_edit_panel（初期 display:none を slideToggle）(index.twig:433 / JS:87-91)
 *  - 変更フラグ input.toggle_bulk_update_check[name="change_flgs[<col>]"]（index.twig:436,442,450,456,464,470,476,484,490,498,504,510）
 *  - 入力ブロック .bulk_update_form（初期 display:none、フラグで toggle）(index.twig:437.. / JS:93-97)
 *  - 入力欄 #admin_deck_bulk_update_<field>（getBlockPrefix 由来）
 *  - 一括編集実行ボタン button[formaction*="bulk_update"] 文言 admin.deck.bulk_edit_execute「一括編集実行」(index.twig:517 / messages.ja.yaml:4113)
 *  - 行チェック input.searched_deck_id[name="deckId[]"]（index.twig:536）
 *  - 全選択 #allCheck（index.twig:526 / JS:192-194）
 *  - クライアント必須エラー .bulk_update_error.text-danger 文言 admin.deck.bulk_update_required「入力されていません。」(index.twig:178 / messages.ja.yaml:4140)
 */
export class AdminDeckDeckBulkUpdatePage {
  readonly page: Page;
  readonly listUrl: string; // デッキ一覧（検索画面）
  readonly bulkUpdateUrl: string; // 一括編集POSTルート（POST専用・直接アクセス確認用）

  readonly searchForm: Locator; // #admin_search_deck
  readonly searchSubmit: Locator; // 検索実行ボタン（要実機確認）
  readonly rowCheckboxes: Locator; // input.searched_deck_id（name=deckId[]）
  readonly allCheck: Locator; // #allCheck
  readonly toggleBulkEditButton: Locator; // #toggle_bulk_edit「一括編集」
  readonly bulkEditPanel: Locator; // #bulk_edit_panel
  readonly executeButton: Locator; // 一括編集実行 button[formaction*=bulk_update]
  readonly clientRequiredError: Locator; // .bulk_update_error.text-danger
  readonly errorAlert: Locator; // サーバ検証エラーフラッシュ .alert-danger（要実機確認）

  // 入力欄（getBlockPrefix=admin_deck_bulk_update 由来）
  readonly eventNameJp: Locator; // #admin_deck_bulk_update_eventNameJp
  readonly ranking: Locator; // #admin_deck_bulk_update_ranking

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/deck`;
    this.bulkUpdateUrl = `/${ECCUBE_ADMIN_ROUTE}/deck/bulk_update`;

    this.searchForm = page.locator("#admin_search_deck");
    // 検索実行ボタンの確定セレクタは Twig 上で要実機確認。検索フォーム内の submit を既定とする。
    this.searchSubmit = page.locator('#admin_search_deck button[type="submit"]').first();
    // 行チェックは name=deckId[] まで固定し、同 class の別用途混入を避ける（index.twig:536）。
    this.rowCheckboxes = page.locator('input.searched_deck_id[name="deckId[]"]');
    this.allCheck = page.locator("#allCheck");
    this.toggleBulkEditButton = page.locator("#toggle_bulk_edit");
    this.bulkEditPanel = page.locator("#bulk_edit_panel");
    this.executeButton = page.locator('button[formaction*="bulk_update"]');
    this.clientRequiredError = page.locator(".bulk_update_error.text-danger");
    this.errorAlert = page.locator(".alert-danger");

    this.eventNameJp = page.locator("#admin_deck_bulk_update_eventNameJp");
    this.ranking = page.locator("#admin_deck_bulk_update_ranking");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  async gotoBulkUpdate() {
    await this.page.goto(this.bulkUpdateUrl);
  }

  /** 検索を実行して結果一覧を表示する（keyword 任意。未指定は空検索）。 */
  async search(keyword?: string) {
    if (keyword) {
      // 検索キーワード欄の確定セレクタは要実機確認。代表的な name=admin_search_deck[xxx] に依存しない汎用入力。
      const kw = this.searchForm.locator('input[type="text"]').first();
      if (await kw.count()) {
        await kw.fill(keyword);
      }
    }
    await this.searchSubmit.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 一括編集パネルを開く。 */
  async openBulkEditPanel() {
    await this.toggleBulkEditButton.click();
    await expect(this.bulkEditPanel).toBeVisible();
  }

  /** 指定列の変更フラグ checkbox（name=change_flgs[col]）。 */
  changeFlag(col: string): Locator {
    return this.page.locator(`input.toggle_bulk_update_check[name="change_flgs[${col}]"]`);
  }

  /** 指定列の変更フラグをONにし、対応入力ブロックを表示させる。 */
  async checkChangeFlag(col: string) {
    await this.changeFlag(col).check();
  }

  /** 先頭の行チェックボックスを1件選択する。 */
  async selectFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** 全選択チェックをオンにする。 */
  async checkAll() {
    await this.allCheck.check();
  }

  /** 一括編集実行ボタンを押下する。 */
  async clickExecute() {
    await this.executeButton.click();
  }

  /** 一覧（検索結果≥1）の主要UI部品が仕様どおり表示されること。 */
  async seeListWithBulkControls() {
    await expect(this.rowCheckboxes.first()).toBeVisible();
    await expect(this.toggleBulkEditButton).toBeVisible();
  }
}
