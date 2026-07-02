import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 デッキ管理 > デッキ検索・一覧 Page Object（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m15_01_admin_deck_deck_search_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m15-01_admin_deck_deck_search.md／観点表／基本設計）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_deck`（SearchDeckType.php:214-217）由来の位置情報のみ。
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の乖離（CSRF有効化・検索項目の削減/改名・ソートUIの差・
 * admin.error.sort未実装・タイトル/サブタイトル割当）はケース表「付帯表4」に記録し、テストは仕様どおりに書く。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 由来（@admin/Deck/index.twig・@admin/default_frame.twig・@admin/pager.twig）:
 *  - route admin_deck_list = GET/POST /%admin_route%/deck（DeckController.php:74）/ 検索フォーム action（index.twig:230）
 *  - route admin_deck_search = GET/POST /%admin_route%/deck/search/{page_no}（DeckController.php:75・要件 \d+。設計は ^[1-9][0-9]*$ ＝付帯表4#5）
 *  - 検索フォーム #admin_search_deck（index.twig:230）。DOM id は getBlockPrefix=admin_search_deck + フィールド名。
 *  - デッキID #admin_search_deck_deck_id（index.twig:239 / SearchDeckType.php:47 Regex ^[\d,\s　]+$・Length max=stext_len）
 *  - フォーマット #admin_search_deck_formats（index.twig:244・select2）/ アーキタイプ #admin_search_deck_archetypes（index.twig:257・select2）
 *  - 開催日From #admin_search_deck_event_date_from（index.twig:83,289 既定 -3month）/ To #admin_search_deck_event_date_to（index.twig:84,294）
 *  - イベント名 #admin_search_deck_event_name（index.twig:301）/ 順位 #admin_search_deck_ranking_from・_ranking_to（index.twig:317,321）
 *  - 成績 #admin_search_deck_result（index.twig:327）/ デッキ名 #admin_search_deck_deck_name（index.twig:336）/ プレイヤー名 #admin_search_deck_player_name（index.twig:341）
 *  - タグ #admin_search_deck_deck_tags（index.twig:350・select2）/ カード名 #admin_search_deck_card（index.twig:354）
 *  - イベント詳細ID #admin_search_deck_event_detail_id（index.twig:363 / 設計の event_id 改名＝付帯表4#2）/ 店舗 #admin_search_deck_shop（index.twig:368）/ 最終更新者 #admin_search_deck_member（index.twig:372）
 *  - 検索ボタン trans admin.deck.search「検索する」（index.twig:380 / messages.ja.yaml:4076）
 *  - 検索条件クリア a.search-clear trans admin.deck.search_clear「検索条件をクリア」（index.twig:378 / messages.ja.yaml:4074）
 *  - 日付クリア #date_clear trans admin.deck.date_clear「日付クリア」（index.twig:307 / messages.ja.yaml:4073）
 *  - 新規登録 a trans admin.deck.new「新規登録」（index.twig:225）/ CSV登録 a trans admin.deck.csv_import「CSV登録」（index.twig:226）
 *  - 見出し h2.c-pageTitle__title=block title=admin.deck.deck_list「デッキ一覧」（default_frame.twig:196 ← index.twig:5）
 *  - サブ span.c-pageTitle__subTitle=block sub_title=admin.deck.deck_management「デッキ管理」（default_frame.twig:196 ← index.twig:6）
 *  - 件数見出し（結果部）DOM=.fw-bold（index.twig:394）。期待は設計書「結果部は件数見出し」（md:42/124）概念由来＝件数見出し領域の出現で判定し、表示文言（messages.ja.yaml）は固定しない（オラクル独立）。
 *  - 0件（該当データなし）。期待は設計書「成功時出力＝該当時のみ一覧テーブル」（md:205）由来＝一覧行（input.searched_deck_id）が0件であることで判定し、実装の0件文言は固定しない（オラクル独立）。
 *  - 検索項目 色 input[name="admin_search_deck[color][]"]（index.twig:248 expanded・SearchDeckType.php:75）/ 表示非表示 disp[](index.twig:265・:92）/ プライベート private_flg[](index.twig:274・:100）
 *  - 順位 #admin_search_deck_ranking_from・_ranking_to（index.twig:317,321 / SearchDeckType.php:132,137）
 *  - 一覧表 table.deck-result-table（index.twig:522）/ 全選択 #allCheck（index.twig:526）/ 行チェック input.searched_deck_id（index.twig:536）
 *  - 行の編集リンク a[href*="/deck/{id}/edit"]（index.twig:539）
 *  - 表示件数 #page_count_pulldown（index.twig:409）/ 並べかえキー #sort_key_pulldown（index.twig:418）/ 並び順 #sort_order_pulldown（index.twig:425）
 *  - ページャ ul.pagination .page-link（pager.twig:12,21）routes=admin_deck_search（index.twig:610）
 */
export class DeckDeckSearchPage {
  readonly page: Page;
  readonly listUrl: string; // 一覧初期表示 GET /deck
  readonly searchUrl: string; // 検索/ページ送り /deck/search/1

  readonly searchForm: Locator; // #admin_search_deck
  readonly deckId: Locator;
  readonly deckName: Locator;
  readonly formats: Locator;
  readonly color: Locator; // 色 expanded checkbox 群
  readonly archetypes: Locator;
  readonly disp: Locator; // 表示/非表示 expanded checkbox 群
  readonly privateFlg: Locator; // プライベート expanded checkbox 群（公開/非公開の固定2択）
  readonly eventDateFrom: Locator;
  readonly eventDateTo: Locator;
  readonly eventName: Locator;
  readonly rankingFrom: Locator;
  readonly rankingTo: Locator;
  readonly result: Locator;
  readonly playerName: Locator;
  readonly deckTags: Locator;
  readonly card: Locator;
  readonly eventDetailId: Locator;
  readonly shop: Locator;
  readonly member: Locator;

  readonly searchButton: Locator; // 検索ボタン「検索する」
  readonly searchClear: Locator; // a.search-clear「検索条件をクリア」
  readonly dateClear: Locator; // #date_clear「日付クリア」
  readonly newButton: Locator; // a「新規登録」
  readonly csvImportButton: Locator; // a「CSV登録」

  readonly pageTitle: Locator; // h2.c-pageTitle__title「デッキ一覧」
  readonly subTitle: Locator; // span.c-pageTitle__subTitle「デッキ管理」
  readonly resultCount: Locator; // .fw-bold「検索結果：...件」
  readonly resultTable: Locator; // table.deck-result-table
  readonly rowCheckboxes: Locator; // input.searched_deck_id
  readonly editLinks: Locator; // 行の編集リンク
  readonly pageCountPulldown: Locator; // #page_count_pulldown
  readonly sortKeyPulldown: Locator; // #sort_key_pulldown
  readonly sortOrderPulldown: Locator; // #sort_order_pulldown
  readonly pager: Locator; // ul.pagination

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/deck`;
    this.searchUrl = `/${ECCUBE_ADMIN_ROUTE}/deck/search/1`;

    this.searchForm = page.locator("#admin_search_deck");
    this.deckId = page.locator("#admin_search_deck_deck_id");
    this.deckName = page.locator("#admin_search_deck_deck_name");
    this.formats = page.locator("#admin_search_deck_formats");
    // 色/表示/プライベートは expanded multiple のチェックボックス群。展開childは name 属性で集約（id は _0,_1… 連番）。
    this.color = page.locator('input[name="admin_search_deck[color][]"]');
    this.archetypes = page.locator("#admin_search_deck_archetypes");
    this.disp = page.locator('input[name="admin_search_deck[disp][]"]');
    this.privateFlg = page.locator('input[name="admin_search_deck[private_flg][]"]');
    this.eventDateFrom = page.locator("#admin_search_deck_event_date_from");
    this.eventDateTo = page.locator("#admin_search_deck_event_date_to");
    this.eventName = page.locator("#admin_search_deck_event_name");
    this.rankingFrom = page.locator("#admin_search_deck_ranking_from");
    this.rankingTo = page.locator("#admin_search_deck_ranking_to");
    this.result = page.locator("#admin_search_deck_result");
    this.playerName = page.locator("#admin_search_deck_player_name");
    this.deckTags = page.locator("#admin_search_deck_deck_tags");
    this.card = page.locator("#admin_search_deck_card");
    this.eventDetailId = page.locator("#admin_search_deck_event_detail_id");
    this.shop = page.locator("#admin_search_deck_shop");
    this.member = page.locator("#admin_search_deck_member");

    this.searchButton = page.locator('#admin_search_deck button[type="submit"]');
    this.searchClear = page.locator("a.search-clear");
    this.dateClear = page.locator("#date_clear");
    this.newButton = page.getByRole("link", { name: "新規登録" });
    this.csvImportButton = page.getByRole("link", { name: "CSV登録" });

    this.pageTitle = page.locator("h2.c-pageTitle__title");
    this.subTitle = page.locator("span.c-pageTitle__subTitle");
    this.resultCount = page.locator(".fw-bold", { hasText: "検索結果" });
    this.resultTable = page.locator("table.deck-result-table");
    this.rowCheckboxes = page.locator("input.searched_deck_id");
    this.editLinks = page.locator('table.deck-result-table a[href*="/edit"]');
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.sortKeyPulldown = page.locator("#sort_key_pulldown");
    this.sortOrderPulldown = page.locator("#sort_order_pulldown");
    this.pager = page.locator("ul.pagination");
  }

  /** 一覧初期表示（GET /deck）。検索実行前の状態。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 検索/ページ送りURL（GET /deck/search/{n}）。 */
  async gotoSearch(pageNo: number | string = 1) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck/search/${pageNo}`);
  }

  /** 検索フォームを送信する（条件は呼び出し側で fill 済み前提）。 */
  async submitSearch() {
    await this.searchButton.click();
    await this.page.waitForLoadState();
  }

  /** 検索結果ヘッダ「検索結果：N件」が表示されること（検索実行＝仕様の正常出力）。 */
  async seeResultHeader() {
    await expect(this.resultCount).toBeVisible();
  }

  /** 検索フォーム（主要入力欄）が表示されること。期待は設計書「フロント挙動・入力項目」由来。 */
  async seeSearchForm() {
    await expect(this.searchForm).toBeVisible();
    // テキスト入力欄は可視。select2 付与の選択欄（formats/archetypes/deck_tags/shop/member）は
    // 描画上ネイティブ select が隠れるため attached で存在のみ確認する。
    await expect(this.deckId).toBeVisible();
    await expect(this.deckName).toBeVisible();
    await expect(this.eventName).toBeVisible();
    await expect(this.playerName).toBeVisible();
    await expect(this.result).toBeVisible();
    await expect(this.eventDetailId).toBeVisible();
    await expect(this.eventDateFrom).toBeVisible();
    await expect(this.formats).toBeAttached();
    await expect(this.archetypes).toBeAttached();
    await expect(this.shop).toBeAttached();
    await expect(this.member).toBeAttached();
    // 設計書「表示要素」（md:42）の検索項目をフォーム存在として確認（付帯表2b 015-018,031 のカバーを実テストへ反映）。
    // 色/表示/プライベートは expanded checkbox 群＝先頭childの存在で判定。デッキタグは select2 付与で隠れるため attached。
    await expect(this.privateFlg.first()).toBeAttached(); // 公開/非公開の固定2択（常設）
    await expect(this.color.first()).toBeAttached();
    await expect(this.disp.first()).toBeAttached();
    await expect(this.deckTags).toBeAttached();
    await expect(this.card).toBeVisible();
    await expect(this.rankingFrom).toBeVisible();
  }
}
