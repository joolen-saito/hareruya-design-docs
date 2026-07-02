import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理 — 日程追加 Page Object（m13_03_admin_event_event_schedule_add）。
 * 対象は登録済みイベントへの日程1件の新規追加フォーム（編集・繰り返し日程・一括削除は別機能）。
 * 期待結果は仕様(functions/pf-eccube3/m13-03_admin_event_event_schedule_add.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_event_detail`（ScheduleType.php:261-265）由来の位置情報のみ。
 *
 * URL（正典＝設計書 functions:60。オラクルは設計書由来とし実装ルートへ寄せない）:
 *  - フォーム表示 : GET /%route%/event/{eventId}/schedule/new （admin_schedule_new / 設計書「利用者視点の入口」「画面遷移」）
 *  - 登録(POST)   : POST /%route%/event/{eventId}/schedule/create （admin_schedule_create / form action edit.twig:82）
 *    ※刷新先実装では admin_schedule_new ルートが無く /schedule/create のGETに統合されている＝乖離（ケース表 付帯表4 #1）。
 *      本POMは設計書どおり /schedule/new で表示遷移し、実装が違えば落ちて乖離を検出する（テストを実装へ寄せない）。
 *
 * DOM id 根拠（getBlockPrefix=admin_event_detail。ScheduleType.php の各 add()／edit.twig の form_widget 出力先）:
 *  - startDate(必須)  → #admin_event_detail_startDate（edit.twig:126 form_widget / ScheduleType.php:101-108 NotBlank・必須バッジ edit.twig:123）
 *  - capacity(必須)   → #admin_event_detail_capacity（edit.twig:192 / ScheduleType.php:137-142・必須バッジ edit.twig:189）
 *  - entryFee(必須)   → #admin_event_detail_entryFee（edit.twig:211 / ScheduleType.php:143-148・必須バッジ edit.twig:209）
 *  - disp(必須/select)→ #admin_event_detail_disp（edit.twig:219 / ScheduleType.php:161-168 NotBlank・必須バッジ edit.twig:217）
 *  - prizeJp(任意)    → #admin_event_detail_prizeJp（edit.twig:226 / ScheduleType.php:149-154 Length max）
 *  - prizeEn(任意)    → #admin_event_detail_prizeEn（edit.twig:230）
 *  - entryStartDate/entryEndDate（time）, onlineEntryStartDate/onlineEntryEndDate, deckRegistDeadline（datetime）
 *  - offlineEntryFlg/deckRegistFlg/entryFlg/deadlineFlg（checkbox）
 *  - CSRFトークン → #admin_event_detail__token（form._token edit.twig:83）
 *  - フォーム → #schedule_form（edit.twig:82）
 *  - 日程情報カード（対象イベント名を含む） → #scheduleInfo（edit.twig:97）。設計書「表示要素＝対象イベント名」(functions:71)の表示領域。
 *    ※対象イベント名は form.eventNameJp.vars.value をテキスト表示（edit.twig:107。入力要素でなく id 無しの表示テキスト）
 *      ＝安定セレクタが無いため値テキストの厳密照合は 要実機確認（シード値依存）。本POMは表示領域(#scheduleInfo)の存在で代替確認する。
 *  - 送信ボタン（type=submit） → #schedule_form 内の button[type=submit]（edit.twig:258/264）。
 *    ※文言（設計書は「登録」/実装 i18n は admin.common.save=「保存」）は実装由来オラクルのため期待値に固定しない＝構造(submit)で特定する。
 *  - 日程情報カード見出し .card-title（edit.twig:90）。見出し文言は固定しない（構造で特定）。
 *  - フィールドエラー .invalid-feedback（admin/Form/bootstrap_4_horizontal_layout.html.twig:55、form is not rootform 時）
 *  - 必須バッジ .badge.bg-primary（edit.twig:123 startDate 行ほか）。バッジ文言（admin.common.required）は固定せず構造(クラス)で特定。
 *  - 成功フラッシュ .alert-success（alert.twig:22 / ScheduleController.php:62）。文言は固定しない（クラスは構造）。
 *  - 失敗フラッシュ .alert-danger（alert.twig:42 / ScheduleController.php:66）。文言は固定しない（クラスは構造）。
 *
 * 注: 必須項目の最終的な正は設計書「入力項目（日程＝必須）」。Form制約(NotBlank/Range等)・i18n文言・CSRFトークン名(_token)は
 *     id/name/位置の確認にのみ用い、期待値（合否）には流用しない（オラクル独立性）。設計書は入力を「日程（開催日時等）必須」1項目に
 *     簡略化しており、刷新先の項目数（開始時間/定員/参加費/公開状態 ほか）との差は付帯表4 #3 に記す。
 */
export class EventEventScheduleAddPage {
  readonly page: Page;

  readonly form: Locator; // #schedule_form（edit.twig:82）
  readonly scheduleInfo: Locator; // #scheduleInfo＝対象イベント名を含む日程情報領域（edit.twig:97）
  readonly cardTitle: Locator; // .card-title（edit.twig:90。文言固定しない）
  readonly requiredBadge: Locator; // .badge.bg-primary＝必須バッジ（edit.twig:123。文言固定しない）
  readonly startDate: Locator; // 開始時間（必須）
  readonly capacity: Locator; // 定員（必須）
  readonly entryFee: Locator; // 参加費（必須）
  readonly disp: Locator; // 公開状態（必須 select）
  readonly prizeJp: Locator; // 賞品（日・任意）
  readonly prizeEn: Locator; // 賞品（英・任意）
  readonly entryStartDate: Locator; // 受付開始時間（任意 time）
  readonly entryEndDate: Locator; // 受付終了時間（任意 time）
  readonly saveButton: Locator; // 「保存」type=submit
  readonly fieldError: Locator; // .invalid-feedback（フィールドエラー）
  readonly successFlash: Locator; // .alert-success（保存しました）
  readonly errorFlash: Locator; // .alert-danger（保存に失敗しました）

  constructor(page: Page) {
    this.page = page;

    this.form = page.locator("#schedule_form");
    this.scheduleInfo = page.locator("#scheduleInfo");
    this.cardTitle = page.locator(".card-title");
    this.requiredBadge = this.form.locator(".badge.bg-primary");
    this.startDate = page.locator("#admin_event_detail_startDate");
    this.capacity = page.locator("#admin_event_detail_capacity");
    this.entryFee = page.locator("#admin_event_detail_entryFee");
    this.disp = page.locator("#admin_event_detail_disp");
    this.prizeJp = page.locator("#admin_event_detail_prizeJp");
    this.prizeEn = page.locator("#admin_event_detail_prizeEn");
    this.entryStartDate = page.locator("#admin_event_detail_entryStartDate");
    this.entryEndDate = page.locator("#admin_event_detail_entryEndDate");
    // 送信ボタンは type=submit で特定（文言「登録」/「保存」は固定しない＝オラクル独立性）。新規/編集で別ブランチ描画のため first。
    this.saveButton = this.form.locator('button[type="submit"]').first();
    this.fieldError = page.locator(".invalid-feedback");
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
  }

  /** 日程追加（新規）フォーム表示URL。設計書「入口/画面遷移」由来＝admin_schedule_new（/schedule/new）。 */
  newUrl(eventId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/${eventId}/schedule/new`;
  }

  /** 日程登録(POST)の送信先URL。設計書「入口」由来＝admin_schedule_create（form action）。 */
  createUrl(eventId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/${eventId}/schedule/create`;
  }

  /** 当該イベントの日程追加フォームを表示する（設計書どおり /schedule/new で遷移）。 */
  async gotoForm(eventId: number | string) {
    await this.page.goto(this.newUrl(eventId));
  }

  /** 日程追加フォームのUI部品（入力欄・対象イベント名領域・送信ボタン）が仕様どおり表示されること。 */
  async seeForm() {
    await expect(this.form).toBeVisible();
    await expect(this.scheduleInfo).toBeVisible(); // 対象イベント名を含む日程情報領域（functions:71 表示要素）
    await expect(this.startDate).toBeVisible();
    await expect(this.capacity).toBeVisible();
    await expect(this.entryFee).toBeVisible();
    await expect(this.disp).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  /** フォーム送信（任意の入力後に保存ボタンを押下）。 */
  async submit() {
    await this.saveButton.click();
  }
}
