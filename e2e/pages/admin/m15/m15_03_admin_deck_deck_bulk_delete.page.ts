import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面「デッキ管理 — 一括削除」Page Object。
 * 一覧（デッキ検索結果）に同居する一括フォームから deckId[] をまとめて POST し、削除する画面。
 *
 * 期待結果は仕様(functions/pf-eccube3/m15-03_admin_deck_deck_bulk_delete.md / 観点表)由来（オラクル独立性）。
 * セレクタは ec-cube-enterprise の Twig 由来の位置情報のみ。合否は仕様で判定する。
 *
 * 入口/ルート（刷新先 ec-cube-enterprise）:
 *  - 一覧表示 GET  admin_deck_list   /%admin%/deck（DeckController.php:74）
 *  - 一括削除 POST admin_deck_bulk_delete /%admin%/deck/bulk_delete（DeckController.php:139）
 *  - 検索ページ GET admin_deck_search /%admin%/deck/search/{page_no}（DeckController.php:75）
 *  ※ 設計(pf-eccube3)のルート名 m15-03_admin_deck_deck_bulk_delete / POST /{admin_route}/deck/delete は
 *    刷新先で admin_deck_bulk_delete / /deck/bulk_delete に対応（不具合候補#5・要確認＝パス差異）。
 *
 * DOM/セレクタ根拠（src/Eccube/Resource/template/admin/Deck/index.twig）:
 *  - 検索結果件数ラベル trans admin.common.search_result（index.twig:394）
 *  - 一括フォーム #bulk_form action=admin_deck_bulk_delete（index.twig:397）
 *  - CSRFトークン hidden #bulk_form_token name=_token（index.twig:398）/ #bulk_delete_token_value（index.twig:399）
 *  - 表頭チェック #allCheck（index.twig:526）
 *  - 行チェック input[name="deckId[]"].searched_deck_id value=Deck.id（index.twig:536）
 *  - 一括削除ボタン #bulk_delete onclick=confirm(admin.deck.bulk_delete_confirm) trans admin.deck.bulk_delete（index.twig:405）
 *  - 検索ボタン trans admin.deck.search（index.twig:380）
 *  - 検索結果ゼロ表示 trans admin.common.search_no_result（index.twig:614）
 *  - フラッシュ（成功/エラー）は @admin/default_frame.twig の alert 領域（出力先クラスは要実機確認）
 */
export class M15DeckDeckBulkDeletePage {
  readonly page: Page;
  readonly listUrl: string;

  readonly searchResultLabel: Locator; // 検索結果件数（index.twig:394）
  readonly searchNoResult: Locator; // 検索結果ゼロ（index.twig:614）
  readonly bulkForm: Locator; // #bulk_form（index.twig:397）
  readonly bulkFormToken: Locator; // #bulk_form_token name=_token（index.twig:398）
  readonly allCheck: Locator; // #allCheck（index.twig:526）
  readonly rowChecks: Locator; // deckId[] 行チェック（index.twig:536）
  readonly bulkDeleteButton: Locator; // #bulk_delete（index.twig:405）
  readonly successAlert: Locator; // 成功フラッシュ（default_frame.twig・要実機確認）
  readonly errorAlert: Locator; // エラーフラッシュ（default_frame.twig・要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/deck`;

    this.searchResultLabel = page.locator(".fw-bold", { hasText: "検索結果" });
    this.searchNoResult = page.locator("text=検索条件に合致するデータが見つかりませんでした");
    this.bulkForm = page.locator("#bulk_form");
    this.bulkFormToken = page.locator("#bulk_form_token");
    this.allCheck = page.locator("#allCheck");
    this.rowChecks = page.locator('input[name="deckId[]"].searched_deck_id');
    this.bulkDeleteButton = page.locator("#bulk_delete");
    // 成功/エラーのフラッシュ領域。出力先クラスは要実機確認のため Bootstrap の標準 alert で位置取りする。
    // 成功(.alert-success)と独立させるため、エラーは danger/warning に限定（汎用 .alert で成功や無関係 alert を
    // 拾わない＝記事参照中エラーのオラクル独立性を担保。codex指摘・中）。
    this.successAlert = page.locator(".alert-success, .alert.alert-success");
    this.errorAlert = page.locator(".alert-danger, .alert-warning");
  }

  /** デッキ一覧（兼検索結果）を開く。検索結果ブロックは検索後に描画される。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 一覧の検索を実行し、検索結果ブロックを描画させる。 */
  async submitSearch() {
    await this.page.getByRole("button", { name: "検索する" }).click();
  }

  /** 指定 value（デッキID）の行チェックを ON にする。 */
  async checkRow(deckId: string | number) {
    await this.page.locator(`input[name="deckId[]"][value="${deckId}"]`).check();
  }

  /** 先頭の行チェックを ON にして deckId を返す。 */
  async checkFirstRow(): Promise<string> {
    const first = this.rowChecks.first();
    const id = (await first.getAttribute("value")) ?? "";
    await first.check();
    return id;
  }

  /**
   * 対象デッキを決定論的に選択する。シードが対象デッキの id を環境変数で渡した場合はその行を、
   * 未指定なら先頭行を選ぶ（先頭固定は保証されないため要確認）。選択した deckId を返す。
   * codex指摘(高): SEED フラグだけでは対象が先頭に来る保証が無く、任意デッキを削除し得るため、
   * シードは識別 id を明示することを推奨（DECK 名の DOM 構造に依存するセレクタは創作しない）。
   */
  async checkTargetRow(explicitDeckId?: string): Promise<string> {
    if (explicitDeckId) {
      await this.checkRow(explicitDeckId);
      return explicitDeckId;
    }
    return this.checkFirstRow();
  }

  /** 表頭チェックで全行を連動選択する。 */
  async checkAll() {
    await this.allCheck.check();
  }

  /**
   * 一括削除ボタンを押す。confirm の応答を accept/dismiss で指定する。
   * dismiss（キャンセル）時は送信されず同画面に留まる仕様。
   */
  async clickBulkDelete(accept = true) {
    this.page.once("dialog", (dialog) => (accept ? dialog.accept() : dialog.dismiss()));
    await this.bulkDeleteButton.click();
  }

  /**
   * 一括削除ボタンを押して確認ダイアログの表示文言を読み取り、送信せずキャンセルする（非破壊）。
   * 仕様: フロント挙動の confirm 文言は format('選択されたデッキ') を埋める（設計由来。翻訳キーは期待値化しない）。
   */
  async captureConfirmMessage(): Promise<string> {
    const dialogPromise = this.page.waitForEvent("dialog");
    await this.bulkDeleteButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.dismiss();
    return message;
  }

  /** 一括削除フォームのトークン値を任意値に差し替える（CSRF 異常系・要実機確認）。 */
  async tamperToken(value: string) {
    await this.bulkFormToken.evaluate((el, v) => {
      (el as HTMLInputElement).value = v;
    }, value);
  }

  /** 行チェックの value を存在しないIDに書き換える（404 異常系・要実機確認）。 */
  async tamperRowValue(deckId: string) {
    await this.rowChecks.first().evaluate((el, v) => {
      (el as HTMLInputElement).value = v;
      (el as HTMLInputElement).checked = true;
    }, deckId);
  }

  /** 検索結果1件以上のとき一括削除ボタンが見えること（仕様: フロント挙動・表示要素）。 */
  async seeBulkDeleteVisible() {
    await expect(this.bulkDeleteButton).toBeVisible();
  }

  /** 一覧UI部品（表頭チェック・行チェック・一括削除ボタン）が存在すること。 */
  async seeListControls() {
    await expect(this.allCheck).toBeVisible();
    await expect(this.rowChecks.first()).toBeVisible();
    await expect(this.bulkDeleteButton).toBeVisible();
  }
}
