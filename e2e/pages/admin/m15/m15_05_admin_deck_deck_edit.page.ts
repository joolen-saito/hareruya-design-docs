import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 デッキ管理（新規登録・編集・削除・複製）画面 Page Object。
 * 納品ケース表 integration_test/e2e/m15_05_admin_deck_deck_edit_e2e_cases.md に対応。
 *
 * 期待結果は仕様(設計書 functions/pf-eccube3/m15-05_admin_deck_deck_edit.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来のセレクタ（位置情報）のみで、
 * 合否は仕様で判定する。設計書(pf-eccube3)と実装(ec-cube-enterprise)のルート・文言乖離はケース表 付帯表4 参照。
 *
 * URLオラクル方針: ナビゲーション先（goto）は実装位置情報として実装ルート /deck/{id}/edit を用いるが、
 * 合否（toHaveURL）の上位オラクルは設計書「対象デッキの編集画面に滞留/復帰」であり、設計書ルートは /{admin}/deck/{id}・
 * 実装は末尾 /edit が付く（付帯表4#1・要確認）。末尾 /edit の有無は実装乖離（位置情報）として許容し、
 * 実装ルート文字列そのものを期待値に固定しない（オラクル混入回避）。ルート末尾差の検出は専用検証として要確認。
 *
 * 画面・ルート（ec-cube-enterprise 実装位置）:
 *  - GET/POST /%admin%/deck/{id}/edit  （admin_deck_edit・DeckController.php:261。失敗時は同画面再描画、成功時 :325 で同編集URLへ）
 *  - GET/POST /%admin%/deck/new        （admin_deck_new・DeckController.php:247）
 *  - POST     /%admin%/deck/{id}/copy   （admin_deck_copy・DeckController.php:379。完了/不備とも :385-413 編集URLへ）
 *  - GET      /%admin%/deck/{id}/duplicate（admin_deck_duplicate・DeckController.php:421。元値を初期値に新規フォーム）
 *  - POST     /%admin%/deck/{id}/delete （admin_deck_delete・DeckController.php:344。成功 :373 一覧へ）
 *
 * DOM id 根拠: Symfony Form getBlockPrefix=`admin_deck`（DeckType.php:180-182）/ `admin_deck_copy`（DeckCopyType.php:49-51）。
 *  - deckName     → #admin_deck_deckName（edit.twig:132 form_widget(form.deckName) / label :131 admin.deck.deck_name）
 *  - privateFlg   → #admin_deck_privateFlg（edit.twig:139 checkbox）
 *  - DeckType     → #admin_deck_DeckType（edit.twig:145 form_widget(form.DeckType)）
 *  - Format       → #admin_deck_Format（edit.twig:154）
 *  - Archetype    → #admin_deck_Archetype（edit.twig:159）
 *  - Disp         → #admin_deck_Disp（edit.twig:198 公開状態）
 *  - cardImageId  → #admin_deck_cardImageId（edit.twig:194 hidden）
 *  - playerId     → #admin_deck_playerId（edit.twig:209 hidden）/ #clear_player（:208）
 *  - eventNameJp  → #admin_deck_eventNameJp（edit.twig:232）/ eventNameEn :237 / eventDate :242
 *  - ranking      → #admin_deck_ranking（edit.twig:251）/ result :256 / sourceUrl :265 / participants :270
 *  - textCommand  → #admin_deck_textCommand（edit.twig:285）/ textMain :289 / textSide :293
 *  - 更新ボタン   → button[form="admin_deck"] trans admin.deck.update「更新」（edit.twig:311 / messages.ja.yaml:4085）
 *  - 新規ボタン   → button[form="admin_deck"] trans admin.deck.new「新規登録」（edit.twig:309 / messages.ja.yaml:4077）
 *  - 削除ボタン   → #btn_delete（edit.twig:312,677）confirm admin.deck.delete_confirm（:678 / messages.ja.yaml:4081）/ #delete_form（:350）
 *  - 複製モーダル → #copyModal（edit.twig:324）/ 回数 input[name="admin_deck_copy[copy]"]（:336）
 *                   複製保存 admin.deck.copy_save「複製保存」（:337 / :4082）/ 複製新規 a→admin_deck_duplicate（:342）
 *  - 成功フラッシュ .alert-success / エラーフラッシュ .alert-danger（@admin/alert）
 */
export class DeckDeckEditPage {
  readonly page: Page;

  readonly deckName: Locator; // #admin_deck_deckName（edit.twig:132）
  readonly privateFlg: Locator; // #admin_deck_privateFlg（edit.twig:139）
  readonly deckTypeSelect: Locator; // #admin_deck_DeckType（edit.twig:145）
  readonly formatSelect: Locator; // #admin_deck_Format（edit.twig:154）
  readonly archetypeSelect: Locator; // #admin_deck_Archetype（edit.twig:159）
  readonly dispSelect: Locator; // #admin_deck_Disp（edit.twig:198 公開状態）
  readonly cardImageId: Locator; // #admin_deck_cardImageId hidden（edit.twig:194）
  readonly playerId: Locator; // #admin_deck_playerId hidden（edit.twig:209）
  readonly clearPlayerButton: Locator; // #clear_player（edit.twig:208）
  readonly playerSearchButton: Locator; // [data-bs-target="#searchPlayerModal"]（edit.twig:207 admin.deck.search）
  readonly cardImageSelectButton: Locator; // [data-bs-target="#searchCardImageModal"]（edit.twig:181 admin.deck.card_image_select）
  readonly eventNameJp: Locator; // #admin_deck_eventNameJp（edit.twig:232）
  readonly eventNameEn: Locator; // #admin_deck_eventNameEn（edit.twig:237）
  readonly eventDate: Locator; // #admin_deck_eventDate（edit.twig:242）
  readonly ranking: Locator; // #admin_deck_ranking（edit.twig:251）
  readonly participants: Locator; // #admin_deck_participants（edit.twig:270）
  readonly textCommand: Locator; // #admin_deck_textCommand（edit.twig:285）
  readonly textMain: Locator; // #admin_deck_textMain（edit.twig:289）
  readonly textSide: Locator; // #admin_deck_textSide（edit.twig:293）

  readonly updateButton: Locator; // 更新（edit.twig:311 admin.deck.update）
  readonly newSubmitButton: Locator; // 新規登録（edit.twig:309 admin.deck.new）
  readonly deleteButton: Locator; // #btn_delete（edit.twig:312）
  readonly copyOpenButton: Locator; // 複製モーダルを開く（edit.twig:313 data-bs-target=#copyModal）
  readonly copyModal: Locator; // #copyModal（edit.twig:324）
  readonly copyCount: Locator; // input[name="admin_deck_copy[copy]"]（edit.twig:336）
  readonly copySaveButton: Locator; // 複製保存（edit.twig:337）
  readonly copyNewLink: Locator; // 複製新規 a→admin_deck_duplicate（edit.twig:342）

  readonly flashSuccess: Locator; // .alert-success
  readonly flashDanger: Locator; // .alert-danger
  // フィールド単位のバリデーションエラー。edit.twig は form_errors(...) を form theme
  // @admin/Form/bootstrap_4_horizontal_layout.html.twig（Symfony Bootstrap4）で描画する。
  // Bootstrap4 form_errors block は子フィールド時 .invalid-feedback、フォーム直下時 .alert-danger を出力する
  // （フレームワーク標準マークアップ＝位置情報。合否「エラー表示で滞留」は設計書由来）。
  readonly validationError: Locator; // .invalid-feedback（Symfony Bootstrap4 form_errors）

  constructor(page: Page) {
    this.page = page;

    this.deckName = page.locator("#admin_deck_deckName");
    this.privateFlg = page.locator("#admin_deck_privateFlg");
    this.deckTypeSelect = page.locator("#admin_deck_DeckType");
    this.formatSelect = page.locator("#admin_deck_Format");
    this.archetypeSelect = page.locator("#admin_deck_Archetype");
    this.dispSelect = page.locator("#admin_deck_Disp");
    this.cardImageId = page.locator("#admin_deck_cardImageId");
    this.playerId = page.locator("#admin_deck_playerId");
    this.clearPlayerButton = page.locator("#clear_player");
    this.playerSearchButton = page.locator('[data-bs-target="#searchPlayerModal"]');
    this.cardImageSelectButton = page.locator(
      '[data-bs-target="#searchCardImageModal"]'
    );
    this.eventNameJp = page.locator("#admin_deck_eventNameJp");
    this.eventNameEn = page.locator("#admin_deck_eventNameEn");
    this.eventDate = page.locator("#admin_deck_eventDate");
    this.ranking = page.locator("#admin_deck_ranking");
    this.participants = page.locator("#admin_deck_participants");
    this.textCommand = page.locator("#admin_deck_textCommand");
    this.textMain = page.locator("#admin_deck_textMain");
    this.textSide = page.locator("#admin_deck_textSide");

    // 文言は messages.ja.yaml の trans キー由来（位置情報）。合否は仕様で判定する。
    this.updateButton = page.getByRole("button", { name: "更新" });
    this.newSubmitButton = page.getByRole("button", { name: "新規登録" });
    this.deleteButton = page.locator("#btn_delete");
    this.copyOpenButton = page.locator('[data-bs-target="#copyModal"]');
    this.copyModal = page.locator("#copyModal");
    this.copyCount = page.locator('input[name="admin_deck_copy[copy]"]');
    this.copySaveButton = page.getByRole("button", { name: "複製保存" });
    this.copyNewLink = page.getByRole("link", { name: "複製新規" });

    this.flashSuccess = page.locator(".alert-success");
    this.flashDanger = page.locator(".alert-danger");
    this.validationError = page.locator(".invalid-feedback");
  }

  /** 編集画面 URL（既存デッキ）。 */
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/deck/${id}/edit`;
  }
  newUrl(): string {
    return `/${ECCUBE_ADMIN_ROUTE}/deck/new`;
  }

  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }
  async gotoNew() {
    await this.page.goto(this.newUrl());
  }

  /** デッキ名を変更して更新送信。 */
  async updateDeckName(name: string) {
    await this.deckName.fill(name);
    await this.updateButton.click();
  }

  /** 複製モーダルを開く。 */
  async openCopyModal() {
    await this.copyOpenButton.click();
    await expect(this.copyModal).toBeVisible();
  }

  /** 複製モーダルで回数を指定し複製保存。 */
  async submitCopy(count: number | string) {
    await this.openCopyModal();
    await this.copyCount.fill(String(count));
    await this.copySaveButton.click();
  }

  /** 編集画面の主要UI部品が仕様どおり表示されること（表示検証）。 */
  async seeEditForm() {
    await expect(this.deckName).toBeVisible();
    await expect(this.textCommand).toBeVisible();
    await expect(this.textMain).toBeVisible();
    await expect(this.textSide).toBeVisible();
  }
}
