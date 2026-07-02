import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カード管理 カード検索/一覧（M14-01）Page Object。
 * 納品ケース表 integration_test/e2e/m14_01_admin_card_card_search_e2e_cases.md に対応。
 * 期待結果は仕様(設計 functions/pf-eccube3/m14-01_admin_card_card_search.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * 設計はpf-eccube3(HareruyaEcプラグイン)のリバース。基本設計・観点表を上位オラクルとし、刷新先
 * ec-cube-enterprise(コアに移設済み)との乖離はケース表「不具合候補」へ出す。実装からはセレクタ(位置情報)のみ取得。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 画面実体: Controller/Admin/Card/CardController.php:64-122（route admin_card_list=GET,POST /{route}/card、
 *           admin_card_search=GET,POST /{route}/card/search/{page_no}）／Template @admin/Card/index.twig。
 * DOM id 根拠（Symfony Form getBlockPrefix=`admin_search_card`：SearchCardType.php:216-219）:
 *  - multi(複合キーワード) → #admin_search_card_multi（index.twig:183 / SearchCardType.php:45-51 placeholder admin.card.multi_search_placeholder=「カード名・テキスト」messages.ja.yaml:3961）
 *  - cmc(マナコスト)        → #admin_search_card_cmc（index.twig:208 / SearchCardType.php:70-79 label admin.card.cmc=「マナ・コスト」messages.ja.yaml:3954）
 *  - color(色 複数チェック) → #admin_search_card_color（index.twig:202 / SearchCardType.php:52-60 label admin.card.color=「色」messages.ja.yaml:3955）
 *  - format(フォーマット)   → #admin_search_card_format（index.twig:277 / SearchCardType.php:152-160 select2 label admin.card.legal_format=「使用可能フォーマット」messages.ja.yaml:3960）
 *  - sortKey(hidden)        → #admin_search_card_sortKey（index.twig:324 / SearchCardType.php:199-201）
 *  - sortOrder(hidden)      → #admin_search_card_sortOrder（index.twig:325 / SearchCardType.php:202-204）
 *  - 検索フォーム           → #admin_search_form（index.twig:176 form_start action=admin_card_list method=POST）
 *  - 検索ボタン             → #admin_search_form button[type=submit]（index.twig:330 trans admin.common.search=「検索」messages.ja.yaml:1446）
 *  - 詳細検索トグル/枠      → [href="#searchDetail"]（index.twig:187 data-bs-toggle collapse・要素種別は限定しない）/ #searchDetail（index.twig:195 collapse）
 *  - クリア                 → a.search-clear（index.twig:319 trans admin.common.search_clear=「検索条件をクリア」messages.ja.yaml:1545）
 *  - 新規登録               → a[href*="/card/new"]（index.twig:164 trans admin.common.registration__new=「新規登録」messages.ja.yaml:1437）
 *  - CSV取り込み            → a[href*="/card/csv_upload"]（index.twig:167 url admin_card_csv_upload=/card/csv_upload・CardCsvController.php:60 trans admin.common.csv_import=「CSV取り込み」messages.ja.yaml:1587）
 *  - カード名リスト作成     → #generate-card-list-btn（index.twig:170 trans admin.card.create_card_name_list=「カード名リスト作成」messages.ja.yaml:3957）
 *  - 表示件数 select        → #page_count_pulldown（index.twig:367 option値=path admin_card_search?page_count=N）
 *  - 並び順 select          → #sort_key_pulldown（index.twig:381 option値=sortKey:sortOrder。change で hidden へ反映し submit）
 *  - 全選択 / 行チェック     → #chose_all（index.twig:405）/ input[name="cardIds[]"]（index.twig:419）
 *  - CSV出力 / 一括削除      → button[data-action*="/card/export_csv"]（index.twig:349 admin_card_export_csv）/ button[data-action*="/card/bulk_delete"]（index.twig:357）
 *  - カードID列             → table.table tbody td（index.twig:422 {{ card.id }} プレーンテキスト）
 *  - カード名リンク         → table.table tbody td a[href*="/card/"]:not([href*="/edit"])（設計:39,224 一覧のカード名リンク→GET /card/{id}/カード編集。
 *                             ※刷新先 index.twig:424 は {{ card.getNameJpWithEn }} がプレーンテキスト＝非リンク＝不具合候補#5。テストは仕様どおりカード名リンクを押下する）
 *  - 件数見出し             → 「検索結果：%count%件が該当しました」trans admin.common.search_result（index.twig:332 / messages.ja.yaml:1538）
 *  - 0件メッセージ          → 「検索条件に合致するデータが見つかりませんでした」trans admin.common.search_no_result（index.twig:454 / messages.ja.yaml:1542）
 *  - 見出し                 → h2.c-pageTitle__title（default_frame.twig:196 block title=admin.product.card_list=「カード一覧」）/
 *                             .c-pageTitle__subTitle（同 block sub_title=admin.product.card_management=「カード管理」messages.ja.yaml:3943）
 */
export class AdminCardCardSearchPage {
  readonly page: Page;
  readonly listUrl: string; // 初期表示 GET /{route}/card

  readonly subTitle: Locator; // 「カード管理」サブタイトル
  readonly pageTitle: Locator; // h2 見出し（刷新先は「カード一覧」）
  readonly searchForm: Locator; // #admin_search_form
  readonly multi: Locator; // 複合キーワード入力欄
  readonly cmc: Locator; // マナコスト入力欄
  readonly searchDetailToggle: Locator; // 詳細検索トグル
  readonly searchDetail: Locator; // 詳細検索エリア（collapse）
  readonly colorArea: Locator; // 色 複数チェック領域
  readonly searchButton: Locator; // 検索ボタン
  readonly newButton: Locator; // 新規登録
  readonly csvImportButton: Locator; // CSV取り込み
  readonly generateListButton: Locator; // カード名リスト作成
  readonly pageCountPulldown: Locator; // 表示件数 select
  readonly sortPulldown: Locator; // 並び順 select
  readonly choseAll: Locator; // 全選択
  readonly resultCount: Locator; // 件数見出し
  readonly noResult: Locator; // 0件メッセージ
  readonly resultRows: Locator; // 一覧の行
  readonly cardNameLinks: Locator; // 一覧のカード名リンク（仕様: 押下でカード編集へ。刷新先は非リンク＝不具合候補#5）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/card`;

    this.subTitle = page.locator(".c-pageTitle__subTitle");
    this.pageTitle = page.locator("h2.c-pageTitle__title");
    this.searchForm = page.locator("#admin_search_form");
    this.multi = page.locator("#admin_search_card_multi");
    this.cmc = page.locator("#admin_search_card_cmc");
    this.searchDetailToggle = page.locator('[href="#searchDetail"]');
    this.searchDetail = page.locator("#searchDetail");
    this.colorArea = page.locator("#admin_search_card_color");
    this.searchButton = page.locator(
      '#admin_search_form button[type="submit"]'
    );
    this.newButton = page.locator('a[href*="/card/new"]');
    this.csvImportButton = page.locator('a[href*="/card/csv_upload"]');
    this.generateListButton = page.locator("#generate-card-list-btn");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.sortPulldown = page.locator("#sort_key_pulldown");
    this.choseAll = page.locator("#chose_all");
    this.resultCount = page.locator("text=該当しました");
    this.noResult = page.locator(
      "text=検索条件に合致するデータが見つかりませんでした"
    );
    this.resultRows = page.locator("table.table tbody tr");
    // 仕様(設計:39,224)のカード名リンク（GET /card/{id}→カード編集）。編集アイコン(/edit)は除外し、
    // 設計どおりカード名セルのリンクを対象にする。刷新先はカード名が非リンクのため不一致＝不具合候補#5を検出する。
    this.cardNameLinks = page.locator(
      'table.table tbody td a[href*="/card/"]:not([href*="/edit"])'
    );
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** 複合キーワードで検索して送信。 */
  async searchByKeyword(keyword: string) {
    await this.multi.fill(keyword);
    await this.searchButton.click();
  }

  /** 詳細検索アコーディオンを開く。 */
  async openSearchDetail() {
    await this.searchDetailToggle.click();
  }

  /** 検索フォームのみ表示（初期表示）であること＝結果エリアがないこと。 */
  async seeSearchFormOnly() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.searchButton).toBeVisible();
    await expect(this.resultCount).toHaveCount(0);
    await expect(this.noResult).toHaveCount(0);
  }

  /** カード管理の見出しが表示されること（仕様: ページタイトル「カード管理」）。 */
  async seeCardManagementTitle() {
    await expect(this.subTitle).toContainText("カード管理");
  }
}
