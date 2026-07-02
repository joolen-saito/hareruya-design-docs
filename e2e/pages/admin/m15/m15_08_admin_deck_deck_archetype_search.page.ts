import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 デッキ管理 > デッキ一覧（アーキタイプ検索条件）Page Object（独立クラス形・未実行雛形）。
 * 納品ケース表 integration_test/e2e/m15_08_admin_deck_deck_archetype_search_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m15-08_admin_deck_deck_archetype_search.md／観点表／基本設計）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_deck`（SearchDeckType.php:214-217）由来の位置情報のみ。
 * pf-eccube3 設計と刷新先 ec-cube-enterprise の乖離はケース表「付帯表4」に記録し、テストは仕様どおりに書く。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。
 *
 * DOM id / セレクタ根拠（@admin/Deck/index.twig）:
 *  - 検索フォーム #admin_search_deck（index.twig:230 form_start attr id）
 *  - アーキタイプ複数選択 #admin_search_deck_archetypes（index.twig:257 / field archetypes SearchDeckType.php:84）
 *    ※設計書のDOM ID `admin_search_deck_archetypes` と一致（付帯表4#6・乖離なし）
 *  - フォーマット複数選択 #admin_search_deck_formats（index.twig:244 / field formats:62）
 *  - 色チェック（expanded）: 親IDコンテナは生成されない。div.col-3.deck-search-check 内に
 *    個別チェック #admin_search_deck_color_0.. が並ぶ（index.twig:246-253 / field color:75 expanded）。
 *    ※付帯表4#7（旧 #admin_search_deck_color はDOM未生成＝セレクタ誤り）を修正
 *  - デッキID #admin_search_deck_deck_id（index.twig:239 / field deck_id:47）
 *  - 検索ボタン button[type=submit] trans admin.deck.search「検索する」（index.twig:380 / messages.ja.yaml:4076）
 *  - 検索条件クリア a.search-clear trans admin.deck.search_clear「検索条件をクリア」（index.twig:378 / messages.ja.yaml:4074）
 *  - 結果件数 span trans admin.common.search_result（index.twig:394）
 *  - 結果なし trans admin.common.search_no_result「検索結果はありません」（index.twig:614）
 *  - 一覧行リンク a[href*='/deck/'][href$='/edit'] url admin_deck_edit（index.twig:539）
 *  - 表示件数 #page_count_pulldown（index.twig:409）／並べ替え #sort_key_pulldown・#sort_order_pulldown（index.twig:418,425）
 *  - ページャ include pager.twig routes admin_deck_search（index.twig:610）
 */
export class DeckDeckArchetypeSearchPage {
  readonly page: Page;
  readonly listUrl: string; // デッキ一覧（検索フォーム初期表示）

  readonly searchForm: Locator; // #admin_search_deck
  readonly archetypeSelect: Locator; // #admin_search_deck_archetypes（複数選択セレクト）
  readonly formatSelect: Locator; // #admin_search_deck_formats
  readonly colorGroup: Locator; // div.col-3.deck-search-check（色チェック expanded コンテナ。親IDは未生成）
  readonly colorChecks: Locator; // #admin_search_deck_color_* 個別チェックボックス
  readonly deckIdInput: Locator; // #admin_search_deck_deck_id
  readonly searchButton: Locator; // 検索する
  readonly searchClearLink: Locator; // 検索条件をクリア
  readonly resultCount: Locator; // 結果件数 span
  readonly resultTable: Locator; // 結果一覧 table
  readonly detailLinks: Locator; // 一覧行→デッキ編集リンク
  readonly pageCountPulldown: Locator; // 表示件数
  readonly sortKeyPulldown: Locator; // 並べ替えキー
  readonly sortOrderPulldown: Locator; // 昇降順
  readonly pager: Locator; // ページャ

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/deck`;

    this.searchForm = page.locator("#admin_search_deck");
    this.archetypeSelect = page.locator("#admin_search_deck_archetypes");
    this.formatSelect = page.locator("#admin_search_deck_formats");
    // 色は expanded で個別 checkbox 化され親IDコンテナを持たない（index.twig:246-253）。
    // deck-search-check は色(col-3:246)/公開状態(col-6:263)/デッキリスト公開状態(col-6:272)に付与されるため、
    // 色コンテナは col-3 で一意化する（曖昧セレクタ回避・codex中指摘）。
    this.colorGroup = page.locator("div.col-3.deck-search-check");
    this.colorChecks = page.locator('[id^="admin_search_deck_color_"]');
    this.deckIdInput = page.locator("#admin_search_deck_deck_id");
    // 検索ボタンは検索フォーム内の submit（trans admin.deck.search「検索する」）。
    this.searchButton = this.searchForm.locator('button[type="submit"]');
    this.searchClearLink = page.locator("a.search-clear");
    this.resultCount = page.locator(".fw-bold"); // index.twig:394（結果件数 span）
    this.resultTable = page.locator("table.deck-result-table");
    // url admin_deck_edit = /<route>/deck/{id}/edit（index.twig:539）。コメントの href$='/edit' に合わせて
    // 編集リンクへ限定する（セレクタ根拠表との整合・codex低指摘）。
    this.detailLinks = page.locator(
      'table.deck-result-table a[href*="/deck/"][href$="/edit"]'
    );
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.sortKeyPulldown = page.locator("#sort_key_pulldown");
    this.sortOrderPulldown = page.locator("#sort_order_pulldown");
    this.pager = page.locator("ul.pagination");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** アーキタイプを除いた検索フォームのみ表示（結果一覧なし）を確認する。 */
  async seeSearchFormOnly() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.archetypeSelect).toBeAttached();
    await expect(this.resultTable).toHaveCount(0);
  }

  /**
   * アーキタイプ複数選択セレクトが存在し選択操作可能であることを確認する（DOM ID 確認）。
   * select2 化でネイティブ select が視覚的に隠れ得るため、可視ではなく「DOM存在＋有効」をオラクルにする。
   */
  async seeArchetypeSelect() {
    await expect(this.archetypeSelect).toBeAttached();
    await expect(this.archetypeSelect).toBeEnabled();
  }

  /** 検索を実行する（条件は呼び出し側で設定済み前提）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /**
   * select2 で描画されたアーキタイプセレクトに値（option value）を設定して検索する。
   * select2 はネイティブ select を隠すため selectOption で値を入れ、change を発火させる。
   */
  async searchByArchetypeValues(values: string[]) {
    await this.archetypeSelect.selectOption(values);
    await this.submitSearch();
  }

  /**
   * 検索後に結果領域（一覧 または「検索結果はありません」）が表示されることを確認する。
   * フォームPOST後の再描画を取りこぼさないよう、まずネットワーク静止を待ってから判定する。
   */
  async seeResultArea() {
    await this.page.waitForLoadState("networkidle");
    const noResult = this.page.getByText("検索結果はありません");
    const hasTable = (await this.resultTable.count()) > 0;
    const hasNoResult = (await noResult.count()) > 0;
    expect(hasTable || hasNoResult).toBeTruthy();
  }

  /** 検索条件クリア後にアーキタイプ選択が解除されていることを確認する（仕様：すべてクリア）。 */
  async expectArchetypeCleared() {
    const selected = await this.archetypeSelect
      .locator("option:checked")
      .count();
    expect(selected).toBe(0);
  }

  /** 「検索結果はありません」（0件）が表示されることを確認する（仕様：矛盾条件は0件）。 */
  async seeNoResult() {
    await expect(this.page.getByText("検索結果はありません")).toBeVisible();
  }

  /** 一覧行のデッキ詳細リンクからデッキ編集画面へ遷移する。 */
  async openFirstDeckDetail() {
    await this.detailLinks.first().click();
  }
}
