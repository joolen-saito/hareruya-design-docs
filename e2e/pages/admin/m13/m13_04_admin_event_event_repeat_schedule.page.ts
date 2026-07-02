import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理 > 繰り返し日程登録 Page Object（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m13_04_admin_event_event_repeat_schedule_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m13-04_admin_event_event_repeat_schedule.md／観点表／基本設計）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_repeat_schedule`（RepeatScheduleType.php:256-258）由来の位置情報のみ。
 *
 * 経路の乖離（付帯表4#1）: 設計書は `/event/repeatschedule/{eventId}/new`(表示)＋`/create`(登録) の2経路だが、
 * 刷新先は単一ルート `GET|POST /{admin_route}/event/{eventId}/repeatSchedule/create`
 * （admin_repeat_schedule_create RepeatScheduleController.php:39）。本POMは刷新先の実URLで遷移する。
 *
 * DOM id 根拠（create.twig / id は form prefix `admin_repeat_schedule`）:
 *  - repeatStartDate → #admin_repeat_schedule_repeatStartDate（create.twig:103 form.repeatStartDate）
 *  - repeatEndDate   → #admin_repeat_schedule_repeatEndDate（create.twig:108）
 *  - week(複数チェック expanded) → #admin_repeat_schedule_week_0..6（create.twig:118-123）
 *  - startTime → #admin_repeat_schedule_startTime（create.twig:134、widget=single_text）
 *  - entryFlg(オンライン申込受付) → #admin_repeat_schedule_entryFlg（create.twig:176）
 *  - form → #repeat_schedule_form（create.twig:62）
 *  - 登録ボタン「登録」trans admin.common.registration（create.twig:229 / messages.ja.yaml:1436）
 *  - card-title/sub_title「繰返し日程登録」trans admin.event.repeat_schedule.title（create.twig:6,70 / messages.ja.yaml:5723）
 *  - 必須バッジ「必須」trans admin.common.required（create.twig:100,131 / messages.ja.yaml:1528）
 *  - エラー: form_errors（bootstrap_4_horizontal_layout、.invalid-feedback 推定＝要実機確認）
 */
export class EventEventRepeatSchedulePage {
  readonly page: Page;

  readonly form: Locator; // #repeat_schedule_form（create.twig:62）
  readonly cardTitle: Locator; // card-title「繰返し日程登録」（create.twig:70）
  readonly repeatStartDate: Locator; // #admin_repeat_schedule_repeatStartDate（create.twig:103）
  readonly repeatEndDate: Locator; // #admin_repeat_schedule_repeatEndDate（create.twig:108）
  readonly startTime: Locator; // #admin_repeat_schedule_startTime（create.twig:134）
  readonly entryFlg: Locator; // #admin_repeat_schedule_entryFlg（create.twig:176）
  readonly registerButton: Locator; // button trans admin.common.registration（create.twig:229）
  readonly requiredBadge: Locator; // 必須バッジ admin.common.required（create.twig:100,131）
  readonly error: Locator; // form_errors（.invalid-feedback 推定・要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator("#repeat_schedule_form");
    this.cardTitle = page.locator(".card-title");
    this.repeatStartDate = page.locator("#admin_repeat_schedule_repeatStartDate");
    this.repeatEndDate = page.locator("#admin_repeat_schedule_repeatEndDate");
    this.startTime = page.locator("#admin_repeat_schedule_startTime");
    this.entryFlg = page.locator("#admin_repeat_schedule_entryFlg");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.requiredBadge = page.locator(".badge", { hasText: "必須" });
    this.error = page.locator(".invalid-feedback"); // 要実機確認（bootstrap form_errors 出力）
  }

  /** 刷新先の繰り返し日程登録画面URL（GET/POST 共通ルート admin_repeat_schedule_create）。 */
  createUrl(eventId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/${eventId}/repeatSchedule/create`;
  }

  /** 成功時のリダイレクト先＝イベント編集画面（admin_event_edit EventController.php:194）。 */
  eventEditUrl(eventId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/${eventId}/edit`;
  }

  async goto(eventId: string | number) {
    await this.page.goto(this.createUrl(eventId));
  }

  /**
   * week(expanded 複数チェック)の index 番目にチェックを入れる。
   * 注: index と曜日の対応（並び順）は実装の ChoiceType 定義依存であり本テストは特定曜日の
   * 生成結果に依存しない（成功判定は画面遷移＝設計書「画面遷移」由来）。創作を避けるため曜日名は断定しない。
   */
  async checkWeekday(index: number) {
    await this.page.locator(`#admin_repeat_schedule_week_${index}`).check();
  }

  /** 必須項目を入力して登録する（期間開始・終了・曜日・開始時間）。 */
  async fillAndSubmit(opts: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
    weekday?: number; // week チェックの index（既定 1）。曜日名は実装依存のため断定しない
    time?: string; // HH:MM（既定 10:00）
    enableEntry?: boolean; // 申込受付(entryFlg)を有効化する
    skipWeekday?: boolean; // 曜日のみ未選択にする（曜日必須の異常系確認用）
  }) {
    await this.repeatStartDate.fill(opts.start);
    await this.repeatEndDate.fill(opts.end);
    if (!opts.skipWeekday) {
      await this.checkWeekday(opts.weekday ?? 1);
    }
    await this.startTime.fill(opts.time ?? "10:00");
    if (opts.enableEntry) {
      await this.entryFlg.check();
    }
    await this.registerButton.click();
  }

  /** 入力欄を埋めずに登録ボタンを押す（必須バリデーション確認）。 */
  async submitEmpty() {
    await this.registerButton.click();
  }

  /** 作成画面の主要UI部品が仕様どおり表示されること。 */
  async seeCreateForm() {
    await expect(this.cardTitle).toContainText("繰返し日程登録");
    await expect(this.form).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
}
