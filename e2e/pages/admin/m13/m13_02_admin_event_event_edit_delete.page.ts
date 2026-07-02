import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント編集/削除 Page Object（@admin/Event/edit.twig：編集・新規・削除モーダル・日程一括削除を1テンプレートで提供）。
 * 期待結果は仕様(functions/pf-eccube3/m13-02_admin_event_event_edit_delete.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_event`（EventType.php:319-322）由来の位置情報のみ。制約(必須/最大長)は期待値に流用しない。
 *
 * 重要(仕様乖離): 設計書は pf-eccube3 / HareruyaEc プラグインのリバースであり、刷新先 ec-cube-enterprise では
 *  - 更新POSTは設計の `POST /event/{id}/create` ではなく `POST /event/{id}/edit`（EventController.php:194）
 *  - 新規表示は設計の `GET /event/new` ではなく `GET /event/create`（EventController.php:154）
 *  - 略称/店舗shop_id/チーム人数/備考detail は刷新先に存在せず base_info/eventScale/isTeamBattle/freeTextArea* に再編
 *  - イベント・日程削除は確認モーダル(Bootstrap modal)経由のアンカー(data-method=delete) で、設計の DELETE/POST と整合
 * これらは付帯表4(不具合候補)で管理し、テストは仕様どおりの観測（更新成功/削除可否/検証失敗で滞留）を期待する。
 *
 * DOM id 根拠（getBlockPrefix=admin_event）:
 *  - nameJp → #admin_event_nameJp（edit.twig:81）/ nameEn → #admin_event_nameEn（edit.twig:91）
 *  - baseInfo(店舗) → #admin_event_baseInfo（edit.twig:103）/ formats(会場/フォーマット) → #admin_event_formats（edit.twig:117, select2 :13）
 *  - eventScale → #admin_event_eventScale（edit.twig:155）/ rel → #admin_event_rel（edit.twig:129）/ disp → #admin_event_disp（edit.twig:141）
 *  - bannerUrl → #admin_event_bannerUrl（edit.twig:166）/ capacity → #admin_event_capacity（edit.twig:187）
 *  - entryFee → #admin_event_entryFee（edit.twig:223）/ payments(クレカ) → #admin_event_payments_0（edit.twig:211）
 *  - 登録ボタン → button[type=submit][form="event_form"]（edit.twig:499 / trans admin.common.registration=「登録」 messages.ja.yaml:1436）
 *  - 削除リンク(モーダルトリガ) → a.btn-ec-delete[data-bs-target="#event_delete_{id}"]（edit.twig:484 / trans admin.common.delete=「削除」 :1444）
 *  - 削除モーダル → #event_delete_{id}（edit.twig:509）/ 日程残メッセージ admin.event.delete.not.schedule_exists（edit.twig:517 / :5717）
 *  - 日程一覧 → #form_schedule_bulk table（edit.twig:394,402 / 見出し admin.event.schedule.list=「日程一覧」 :5684）
 *  - 日程チェック → input[id^="check_schedule_"]（edit.twig:424）/ 全選択 #toggle_schedule_check_all（edit.twig:407）
 *  - 一括削除ボタン → #btn_schedule_bulk_delete（edit.twig:494）/ 一括削除モーダル #schedule_bulk_delete_modal（edit.twig:574）
 *  - 戻る(イベント一覧) → a[href$="/event"]（edit.twig:477 / admin_event_index）
 */
export class EventEventEditDeletePage {
  readonly page: Page;

  // 入力欄（既知の入力項目のみ。略称/store/teamMemberCount/detail は刷新先に存在しないため定義しない＝創作禁止）
  readonly nameJp: Locator; // edit.twig:81
  readonly nameEn: Locator; // edit.twig:91
  readonly baseInfo: Locator; // 店舗(刷新先 base_info) edit.twig:103
  readonly formats: Locator; // 会場/フォーマット edit.twig:117
  readonly eventScale: Locator; // edit.twig:155
  readonly rel: Locator; // edit.twig:129
  readonly disp: Locator; // 公開状態 edit.twig:141
  readonly bannerUrl: Locator; // edit.twig:166
  readonly capacity: Locator; // edit.twig:187
  readonly entryFee: Locator; // edit.twig:223
  readonly paymentCredit: Locator; // 支払方法クレジット edit.twig:211

  readonly form: Locator; // #event_form edit.twig:57
  readonly registerButton: Locator; // 登録 edit.twig:499
  readonly cardTitle: Locator; // イベント情報 edit.twig:69
  readonly fieldError: Locator; // form_errors（.invalid-feedback / .text-danger）
  readonly alert: Locator; // フラッシュ領域（default_frame）

  // 削除
  readonly deleteTrigger: Locator; // 削除リンク edit.twig:484
  readonly scheduleListHeading: Locator; // 日程一覧見出し edit.twig:398
  readonly checkAll: Locator; // 全選択 edit.twig:407
  readonly bulkDeleteButton: Locator; // 一括削除 edit.twig:494
  readonly backToList: Locator; // 戻る edit.twig:477

  constructor(page: Page) {
    this.page = page;
    this.nameJp = page.locator("#admin_event_nameJp");
    this.nameEn = page.locator("#admin_event_nameEn");
    this.baseInfo = page.locator("#admin_event_baseInfo");
    this.formats = page.locator("#admin_event_formats");
    this.eventScale = page.locator("#admin_event_eventScale");
    this.rel = page.locator("#admin_event_rel");
    this.disp = page.locator("#admin_event_disp");
    this.bannerUrl = page.locator("#admin_event_bannerUrl");
    this.capacity = page.locator("#admin_event_capacity");
    this.entryFee = page.locator("#admin_event_entryFee");
    this.paymentCredit = page.locator("#admin_event_payments_0");

    this.form = page.locator("#event_form");
    this.registerButton = page.locator('button[type="submit"][form="event_form"]');
    this.cardTitle = page.locator(".card-title");
    this.fieldError = page.locator(".invalid-feedback, .text-danger");
    this.alert = page.locator(".alert, #ex-page-alert, .c-alert");

    this.deleteTrigger = page.locator('a.btn-ec-delete[data-bs-target^="#event_delete_"]');
    this.scheduleListHeading = page.getByText("日程一覧", { exact: false });
    this.checkAll = page.locator("#toggle_schedule_check_all");
    this.bulkDeleteButton = page.locator("#btn_schedule_bulk_delete");
    this.backToList = page.locator('a[href$="/event"]');
  }

  /** 編集画面URL（GET /%route%/event/{id}/edit）。 */
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/${id}/edit`;
  }

  /** 新規登録画面URL（刷新先は GET /%route%/event/create。設計の /event/new からの乖離は付帯表4）。 */
  createUrl(): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/create`;
  }

  /** 一覧URL（削除成功時の遷移先＝検索結果ページ）。 */
  indexUrl(): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event`;
  }

  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  async gotoCreate() {
    await this.page.goto(this.createUrl());
  }

  /** 登録/更新を送信（登録ボタンは form 外配置のため form 属性で紐付く）。 */
  async submit() {
    await this.registerButton.click();
  }

  /**
   * 編集画面の入力フォーム主要部品が仕様どおり表示されること。
   * 設計「表示要素」（イベント名・店舗・会場/フォーマット・ルール適用度・公開状態・バナーURL・定員・参加費・支払方法）と
   * 右側ボタン群（登録）を観測する。チーム人数・賞品・備考は刷新先カラム再編で非存在のため対象外（付帯表4・創作禁止）。
   */
  async seeEditForm() {
    await expect(this.cardTitle).toContainText("イベント情報");
    await expect(this.nameJp).toBeVisible(); // イベント名(日)
    await expect(this.baseInfo).toBeVisible(); // 店舗(base_info)
    await expect(this.formats).toBeVisible(); // 会場/フォーマット
    await expect(this.rel).toBeVisible(); // ルール適用度
    await expect(this.disp).toBeVisible(); // 公開状態
    await expect(this.bannerUrl).toBeVisible(); // バナーURL
    await expect(this.capacity).toBeVisible(); // 定員
    await expect(this.entryFee).toBeVisible(); // 参加費
    await expect(this.paymentCredit).toBeVisible(); // 支払方法(クレジットカード)
    await expect(this.registerButton).toBeVisible(); // 右側ボタン群: 登録
  }

  /** 削除確認モーダルを開く。 */
  async openDeleteModal() {
    await this.deleteTrigger.click();
  }
}
