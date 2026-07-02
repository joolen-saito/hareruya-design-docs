import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 デッキ管理 — 直近の大会管理（編集）Page Object。
 * 納品ケース表 integration_test/e2e/m15_11_admin_deck_deck_latest_event_e2e_cases.md に対応。
 *
 * 期待結果は仕様(設計書 functions/pf-eccube3/m15-11_admin_deck_deck_latest_event.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来のセレクタ（位置情報）のみで、合否は仕様で判定する。
 * 本設計書は現行 pf-eccube3(プラグイン HareruyaEc)のリバースであり、刷新先 ec-cube-enterprise(コア)とのルート・フォーム名・
 * 文言・失敗時挙動の乖離はケース表 付帯表4 に分離する。Playwright は本リポジトリでは実行しない（構造参考のみ）。
 *
 * ルート（ec-cube-enterprise 実装位置・LatestEventDeckController.php:38）:
 *  - GET/POST /%admin%/deck/latest_event_deck  （admin_latest_event_deck_list・GETで一覧表示／POSTで全行一括上書き）
 *    ※ 設計書は GET /{admin}/latest_event_deck と POST /{admin}/latest_event_deck/update の2ルート想定。実装は単一ルート（付帯表4#1）。
 *
 * DOM id 根拠: Symfony Form getBlockPrefix=`admin_latest_event_deck`（LatestEventDeckType.php:47）＋ CollectionType `rows`
 * （LatestEventDeckType.php:28-34・行は0始まり index）。各行は LatestEventDeckRowType（eventDate/Format/eventNameJp/eventNameEn/participants）。
 *  - 行Nのイベント開催日 → #admin_latest_event_deck_rows_N_eventDate（latest_event_deck.twig:80 form_widget(rowForm.eventDate)・DateTimeType single_text）
 *  - 行Nのフォーマット   → #admin_latest_event_deck_rows_N_Format（twig:90・EntityType select）
 *  - 行Nのイベント名(日) → #admin_latest_event_deck_rows_N_eventNameJp（twig:97・maxlength=eccube_stext_len）
 *  - 行Nのイベント名(英) → #admin_latest_event_deck_rows_N_eventNameEn（twig:104）
 *  - 行Nの参加人数       → #admin_latest_event_deck_rows_N_participants（twig:111・number min=0 max=99999999）
 *  - CSRFトークン        → #admin_latest_event_deck__token（twig:67 form_widget(form._token)）
 *  - フォーム            → #admin_latest_event_deck（twig:66 form_start attr id）
 *  - 送信ボタン「直近の大会設定」trans admin.latest_event_deck.update（twig:70・twig:121 上下2箇所 / messages.ja.yaml:4188）
 *  - 「消去」ボタン trans admin.latest_event_deck.clear（twig:84 button.latest-event-deck-clear / messages.ja.yaml:4189）
 *  - 必須バッジ「必須」trans admin.common.required（twig:78他 span.latest-event-deck-required d-none / messages.ja.yaml:1528）
 *  - 成功フラッシュ .alert-success（@admin/alert）/ エラーフラッシュ .alert-danger
 */
export class DeckDeckLatestEventPage {
  readonly page: Page;
  readonly url: string;

  readonly form: Locator; // #admin_latest_event_deck（twig:66）
  readonly csrfToken: Locator; // #admin_latest_event_deck__token（twig:67）
  readonly submitButtons: Locator; // 「直近の大会設定」上下2箇所（twig:70,121）
  readonly clearButtons: Locator; // 「消去」button.latest-event-deck-clear（twig:84）
  readonly requiredBadges: Locator; // span.latest-event-deck-required（twig:78他）
  readonly tables: Locator; // table.latest-event-deck-table（各スロット1表・twig:75）
  readonly flashSuccess: Locator; // .alert-success
  readonly flashDanger: Locator; // .alert-danger

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/deck/latest_event_deck`;

    this.form = page.locator("#admin_latest_event_deck");
    this.csrfToken = page.locator("#admin_latest_event_deck__token");
    // 文言は messages.ja.yaml の trans キー由来（位置情報）。合否は仕様で判定する。
    this.submitButtons = page.getByRole("button", { name: "直近の大会設定" });
    this.clearButtons = page.locator("button.latest-event-deck-clear");
    this.requiredBadges = page.locator("span.latest-event-deck-required");
    this.tables = page.locator("table.latest-event-deck-table");
    this.flashSuccess = page.locator(".alert-success");
    this.flashDanger = page.locator(".alert-danger");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  // ----- 行N（0始まり）の各入力欄（CollectionType の index 由来・位置情報） -----
  eventDate(i = 0): Locator {
    return this.page.locator(`#admin_latest_event_deck_rows_${i}_eventDate`);
  }
  formatSelect(i = 0): Locator {
    return this.page.locator(`#admin_latest_event_deck_rows_${i}_Format`);
  }
  eventNameJp(i = 0): Locator {
    return this.page.locator(`#admin_latest_event_deck_rows_${i}_eventNameJp`);
  }
  eventNameEn(i = 0): Locator {
    return this.page.locator(`#admin_latest_event_deck_rows_${i}_eventNameEn`);
  }
  participants(i = 0): Locator {
    return this.page.locator(`#admin_latest_event_deck_rows_${i}_participants`);
  }

  /** 先頭（上）の「直近の大会設定」ボタンで送信。 */
  async submit() {
    await this.submitButtons.first().click();
  }

  /** 行Nの「消去」ボタンを押下（同一表内の入力欄を空にするクライアント挙動）。 */
  async clearRow(i = 0) {
    await this.clearButtons.nth(i).click();
  }

  /** 一覧（編集）画面の主要UI部品が仕様どおり表示されること（表示検証）。 */
  async seeListForm() {
    // 設計書「各スロットは5項目の表」。開催日/フォーマット/イベント名(日)/イベント名(英)/参加人数の5欄を全て確認する。
    await expect(this.eventDate(0)).toBeVisible();
    await expect(this.formatSelect(0)).toBeVisible();
    await expect(this.eventNameJp(0)).toBeVisible();
    await expect(this.eventNameEn(0)).toBeVisible();
    await expect(this.participants(0)).toBeVisible();
    await expect(this.submitButtons.first()).toBeVisible();
  }
}
