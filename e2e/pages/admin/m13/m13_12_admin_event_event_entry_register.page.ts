import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント新規申込登録 Page Object（登録先選択画面＋新規申込入力／登録送信）。
 * 納品ケース表 integration_test/e2e/m13_12_admin_event_event_entry_register_e2e_cases.md に対応。
 * 期待結果は仕様(functions/pf-eccube3/m13-12_admin_event_event_entry_register.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_event_entry_detail`（EventEntryDetailType.php:163-166）由来の位置情報のみ。
 *
 * ルート（実装。設計のパスとは相違＝不具合候補#8）:
 *  - admin_entry_registration        = /%eccube_admin_route%/entry_registration（登録先選択/一覧。GET一覧+POST検索）EntryRegistrationController.php:64
 *  - admin_entry_new                 = /%eccube_admin_route%/entry_registration/new/{eventDetailId}（GET表示+POST登録を同一ルート）:137
 *  - admin_entry_registration_search_player = /%eccube_admin_route%/entry_registration/search_player（GET XHR専用）:192
 * テンプレート: @admin/Event/EntryRegistration/index.twig（選択）/ edit.twig（新規入力・登録は編集と共用、新規モード registration_mode=true）
 *
 * DOM id 根拠（index.twig / edit.twig / EventEntryDetailType.php）:
 *  - 登録先選択: 「検索」button trans admin.common.search（index.twig:67 / messages.ja.yaml:1446）
 *               「新規登録」link trans admin.event.entry.register（index.twig:110 / :5740）→ admin_entry_new
 *  - 申込状況 select(新規=無効) → #admin_event_entry_detail_EntryStatus（edit.twig:303 / entry_status_editable=false→disabled EventEntryDetailType.php:88）
 *  - 支払方法 select(無効) → #admin_event_entry_detail_Payment（edit.twig:310 / disabled EventEntryDetailType.php:104）
 *  - 支払金額 input(無効・初期=参加費) → #admin_event_entry_detail_price（edit.twig:317 / disabled :111-112・初期 :144）
 *  - 参加プレイヤー hidden(必須) → #admin_event_entry_detail_entryPlayer（edit.twig:220 / NotBlank+Regex :60-72・実装は単一ID＝乖離#6）
 *  - プレイヤー検索語 → #admin_event_entry_detail_search（edit.twig:377）
 *  - 送信ボタン #submit_entry（edit.twig:359 新規 trans admin.common.save「保存」:1434・初期disabled）
 *  - 支払会員 #paying_player_name（edit.twig:297 新規時 初期「－」）
 *  - 参加者行: 名前 #detail_player__name_jp--1（edit.twig:271） / 隠しID #player_id--1（edit.twig:277）
 *  - 検索ボタン #search_button--1（edit.twig:279「検索」:5561） / 削除ボタン #clear_button--1（edit.twig:282「削除」:5562）
 *  - モーダル #searchPlayerModal（edit.twig:368） / 実行 #searchPlayerModalButton（edit.twig:380「検索する」:5571） / 結果 #searchPlayerModalList（edit.twig:382）
 *  - モーダル候補 .js-entry-player-select（search_player_modal_list.twig・要実機確認）
 *  - 戻る link admin.event.entry.back「戻る」（edit.twig:342 / :5568）→ admin_entry_registration
 *  - フラッシュ .alert（成功 addSuccess admin.common.save_complete EntryRegistrationController.php:163）
 */
export class AdminEventEventEntryRegisterPage {
  readonly page: Page;

  // 登録先選択画面
  readonly searchBaseInfo: Locator; // 検索フォーム 店舗条件 select（index.twig:14-22）
  readonly searchButton: Locator; // 「検索」
  readonly registerLink: Locator; // 一覧の「新規登録」

  // 新規申込入力画面
  readonly entryStatus: Locator; // 申込状況 select（新規=無効）
  readonly payment: Locator; // 支払方法 select（無効）
  readonly price: Locator; // 支払金額 input（無効）
  readonly entryPlayerHidden: Locator; // 参加プレイヤー hidden（必須）
  readonly searchInput: Locator; // モーダル内 検索語
  readonly submitButton: Locator; // #submit_entry 送信（初期disabled）
  readonly payingMember: Locator; // 支払会員（新規=「－」）
  readonly playerNameJp: Locator; // 参加者行 氏名
  readonly playerIdHidden: Locator; // 参加者行 隠しプレイヤーID
  readonly searchPlayerButton: Locator; // 行の「検索」ボタン
  readonly clearPlayerButton: Locator; // 行の「削除」ボタン
  readonly modal: Locator; // プレイヤー検索モーダル
  readonly modalRunButton: Locator; // モーダル「検索する」
  readonly modalList: Locator; // モーダル候補一覧 host
  readonly modalCandidate: Locator; // モーダル候補（選択用要素）
  readonly backLink: Locator; // 戻る→登録先選択画面
  readonly flash: Locator; // フラッシュメッセージ領域

  constructor(page: Page) {
    this.page = page;
    this.searchBaseInfo = page.locator("#admin_search_event_base_info"); // 店舗条件 select2（index.twig:14-22）
    this.searchButton = page.getByRole("button", { name: "検索" });
    this.registerLink = page.getByRole("link", { name: "新規登録" });

    this.entryStatus = page.locator("#admin_event_entry_detail_EntryStatus");
    this.payment = page.locator("#admin_event_entry_detail_Payment");
    this.price = page.locator("#admin_event_entry_detail_price");
    this.entryPlayerHidden = page.locator("#admin_event_entry_detail_entryPlayer");
    this.searchInput = page.locator("#admin_event_entry_detail_search");
    this.submitButton = page.locator("#submit_entry");
    this.payingMember = page.locator("#paying_player_name");
    this.playerNameJp = page.locator("#detail_player__name_jp--1");
    this.playerIdHidden = page.locator("#player_id--1");
    this.searchPlayerButton = page.locator("#search_button--1");
    this.clearPlayerButton = page.locator("#clear_button--1");
    this.modal = page.locator("#searchPlayerModal");
    this.modalRunButton = page.locator("#searchPlayerModalButton");
    this.modalList = page.locator("#searchPlayerModalList");
    this.modalCandidate = page.locator("#searchPlayerModalList .js-entry-player-select");
    this.backLink = page.getByRole("link", { name: "戻る" });
    this.flash = page.locator(".alert");
  }

  /** 登録先選択画面URL。 */
  selectUrl(): string {
    return `/${ECCUBE_ADMIN_ROUTE}/entry_registration`;
  }

  /** 新規申込入力画面URL（イベント日程ID指定）。 */
  newUrl(eventDetailId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/entry_registration/new/${eventDetailId}`;
  }

  /** 指定イベント日程行の「新規登録」リンク（href にルートIDを含む＝対象データを固定する）。 */
  registerLinkForDetail(eventDetailId: number | string): Locator {
    return this.page.locator(`a[href*="/entry_registration/new/${eventDetailId}"]`);
  }

  async gotoSelect() {
    await this.page.goto(this.selectUrl());
  }

  async gotoNew(eventDetailId: number | string) {
    await this.page.goto(this.newUrl(eventDetailId));
  }

  /** イベント名・店舗・フォーマットが読み取り専用で表示されること（仕様: フロント挙動 表示要素）。 */
  async seeReadonlyEventInfo() {
    const body = this.page.locator("body");
    await expect(body).toContainText("イベント名"); // messages.ja.yaml:5638
    await expect(body).toContainText("店舗"); // :5648
    await expect(body).toContainText("フォーマット"); // :5649
  }

  /** プレイヤー検索モーダルを開く。 */
  async openSearchModal() {
    await this.searchPlayerButton.click();
  }

  /** モーダルで検索語を入力し検索を実行（XHRで候補一覧を取得）。 */
  async searchPlayer(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.modalRunButton.click();
  }

  /** モーダルの先頭候補を選択して参加者行へ反映する。 */
  async selectFirstCandidate() {
    await this.modalCandidate.first().click();
  }

  /** 参加者行の削除ボタンで参加者を未選択にする。 */
  async clearPlayer() {
    await this.clearPlayerButton.click();
  }

  /** 登録を送信する。 */
  async submit() {
    await this.submitButton.click();
  }
}
