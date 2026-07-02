import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 デッキ管理 — アーキタイプ 登録・編集・削除 画面 Page Object（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m15_09_admin_deck_deck_archetype_crud_e2e_cases.md に対応。
 *
 * 期待結果（合否オラクル）は仕様(設計書 functions/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.md / 観点表 /
 * 基本設計)のみに由来（オラクル独立性）。刷新先 messages.ja.yaml の trans キー・訳文はオラクルではなく、
 * 本Page Objectが保持する Twig＋Symfony Form 由来のセレクタ（位置情報）を同定するための補助参照に留める。
 * 本Page Objectが保持するのはセレクタ（位置情報）のみで、合否は仕様で判定する。設計源は pf-eccube3（HareruyaEc プラグイン）で、
 * 刷新先 ec-cube-enterprise ではコア標準機能。設計(pf-eccube3)と実装(ec-cube-enterprise)の
 * ルート・HTTPメソッド・成功/失敗フラッシュ・削除失敗時遷移・旧アーキタイプID欄欠落の乖離はケース表
 * 付帯表4（不具合候補）に分離し、テストは仕様どおりに書く（実装が違えば落ちて検出する）。
 *
 * URLオラクル方針: ナビゲーション先（goto）は実装位置情報として刷新先ルートを用いるが、
 * 合否（toHaveURL）の上位オラクルは設計書「成功時は編集画面へ／削除成功は一覧へ／不存在は404」であり、
 * 末尾 /edit・/delete の有無や DELETE→POST 化は実装乖離（付帯表4）として許容し、ルート文字列そのものを
 * 期待値に固定しない（オラクル混入回避）。
 *
 * 画面・ルート（ec-cube-enterprise 実装位置 ArchetypeController.php）:
 *  - GET/POST /%admin%/archetype/new          （admin_archetype_new・:137-158。成功時 :234 で編集URLへ）
 *  - GET/POST /%admin%/archetype/{id}/edit     （admin_archetype_edit・:165-174。失敗時同画面再描画、成功時 :234 同編集URLへ）
 *  - POST     /%admin%/archetype/{id}/delete   （admin_archetype_delete・:179-204。成功 :203 一覧へ／関連デッキ有 :190-193 編集URLへ error）
 *  - POST     /%admin%/archetype/search_card_image（admin_archetype_search_card_image・:253 JSON）
 *
 * DOM id 根拠: Symfony Form getBlockPrefix=`admin_archetype`（ArchetypeType.php:133-136）。
 *  - nameJp      → #admin_archetype_nameJp（edit.twig:187 form_widget(form.nameJp) / label :185 admin.archetype.name_jp 必須バッジ admin.common.required）
 *  - nameEn      → #admin_archetype_nameEn（edit.twig:195 / 必須）
 *  - commentJp   → #admin_archetype_commentJp（edit.twig:203 textarea 任意）
 *  - commentEn   → #admin_archetype_commentEn（edit.twig:211 任意）
 *  - cardImageId → #admin_archetype_cardImageId hidden（edit.twig:178 form_widget(form.cardImageId)・JS :161 で値更新）
 *  - Disp        → #admin_archetype_Disp（edit.twig:240 公開状態 必須）
 *  - Format      → #admin_archetype_Format（edit.twig:265 フォーマット 必須）
 *  - Colors      → #admin_archetype_Colors_N チェックボックス（edit.twig:251-256 任意・複数）
 *  - DeckTags    → #admin_archetype_DeckTags（edit.twig:273 select2 任意・複数）
 *  - _token      → #admin_archetype__token（edit.twig:179）
 *  - 保存ボタン  → button[form="admin_archetype"]：新規=admin.archetype.new「新規登録」(edit.twig:289 / messages.ja.yaml:4171)、編集=admin.common.update「更新」(edit.twig:291 / :1435)
 *  - 削除ボタン  → #btn_delete（edit.twig:292・JS confirm admin.archetype.delete_confirm「このアーキタイプを削除してもよろしいですか？」:64 / messages.ja.yaml:4167）/ #delete_form（:332 POST admin_archetype_delete）
 *  - 戻るリンク  → a admin.common.back「戻る」（edit.twig:294 → admin_archetype_list?resume=1 / messages.ja.yaml:1464）
 *  - 代表カード選択 → button[data-bs-target="#searchCardImageModal"] admin.archetype.select_representative_card「代表カード選択」(edit.twig:221 / messages.ja.yaml:4160)
 *  - モーダル    → #searchCardImageModal（edit.twig:302）/ title admin.deck.card_image_search「代表カード検索」(edit.twig:306 / messages.ja.yaml:4054)
 *  - モーダル検索語 → #card_image_search_word（edit.twig:311 placeholder admin.deck.card_name）/ 完全一致 #card_image_exact_match（:315）/ カードテキスト #card_image_search_set（:320）
 *  - モーダル検索ボタン → #btn_search_card_image（edit.twig:323 admin.deck.search_button「検索」）/ 結果領域 #card_image_search_results（:325）
 *  - プレビュー  → #cardImagePreview（edit.twig:224）/ 選択カード名 #selectedCardImageName（edit.twig:228）/ 選択ボタン .select-card-image（JS :81 data-id/name/url）
 *  - 成功フラッシュ .alert-success（admin.common.save_complete「保存しました」:1398 / delete_complete「削除しました」:1400）
 *  - エラーフラッシュ .alert-danger（admin.archetype.delete_error_deck_exists「このアーキタイプに紐づくデッキが存在するため削除できません。」:4168）
 *  - フィールドエラー .invalid-feedback（form_errors。bootstrap_4_horizontal_layout・正確なクラスは要実機確認）
 */
export class DeckDeckArchetypeCrudPage {
  readonly page: Page;

  readonly nameJp: Locator; // #admin_archetype_nameJp（edit.twig:187 必須）
  readonly nameEn: Locator; // #admin_archetype_nameEn（edit.twig:195 必須）
  readonly commentJp: Locator; // #admin_archetype_commentJp（edit.twig:203 任意）
  readonly commentEn: Locator; // #admin_archetype_commentEn（edit.twig:211 任意）
  readonly cardImageId: Locator; // #admin_archetype_cardImageId hidden（edit.twig:178）
  readonly dispSelect: Locator; // #admin_archetype_Disp（edit.twig:240 必須）
  readonly formatSelect: Locator; // #admin_archetype_Format（edit.twig:265 必須）
  readonly deckTagsSelect: Locator; // #admin_archetype_DeckTags（edit.twig:273 select2 任意）
  readonly colorsCheckboxes: Locator; // .archetype-colors のチェックボックス群（edit.twig:250-256 / ArchetypeType.php:92-99 multiple/expanded・任意）
  // 旧アーキタイプID欄は設計(pf-eccube3 入力項目：任意・最大16・^[\w\d]+$)に存在するが刷新先フォームに無い（付帯表4#5）。
  // 下記 id は創作ではなく「検証済 blockPrefix=admin_archetype（ArchetypeType.php:133-136）＋設計フィールド名 oldArchetypeId」から
  // 規約導出した“設計が満たすべき期待 id”であり、実装由来の検証済セレクタではない（要実機確認）。テストは欄の存在を期待し、
  // 刷新先に欄が無いため失敗して欠落を検出する（実装に寄せない）。
  readonly oldArchetypeId: Locator; // 設計期待 #admin_archetype_oldArchetypeId（刷新先に未実装＝失敗で検出・要実機確認）

  readonly saveButton: Locator; // button[form="admin_archetype"] 新規「新規登録」/編集「更新」（edit.twig:289,291）
  readonly deleteButton: Locator; // #btn_delete（edit.twig:292）
  readonly backLink: Locator; // 戻る（edit.twig:294）

  readonly selectCardButton: Locator; // 代表カード選択（edit.twig:221）
  readonly cardModal: Locator; // #searchCardImageModal（edit.twig:302）
  readonly cardModalTitle: Locator; // モーダル見出し 代表カード検索（edit.twig:306）
  readonly cardSearchWord: Locator; // #card_image_search_word（edit.twig:311）
  readonly cardExactMatch: Locator; // #card_image_exact_match（edit.twig:315）
  readonly cardSearchText: Locator; // #card_image_search_set（edit.twig:320）
  readonly cardSearchButton: Locator; // #btn_search_card_image（edit.twig:323）
  readonly cardSearchResults: Locator; // #card_image_search_results（edit.twig:325）
  readonly cardPreview: Locator; // #cardImagePreview（edit.twig:224）
  readonly selectedCardName: Locator; // #selectedCardImageName（edit.twig:228）
  readonly selectCardRowButton: Locator; // .select-card-image（JS :81）

  readonly flashSuccess: Locator; // .alert-success
  readonly flashDanger: Locator; // .alert-danger
  readonly fieldError: Locator; // .invalid-feedback（form_errors・要実機確認）

  constructor(page: Page) {
    this.page = page;

    this.nameJp = page.locator("#admin_archetype_nameJp");
    this.nameEn = page.locator("#admin_archetype_nameEn");
    this.commentJp = page.locator("#admin_archetype_commentJp");
    this.commentEn = page.locator("#admin_archetype_commentEn");
    this.cardImageId = page.locator("#admin_archetype_cardImageId");
    this.dispSelect = page.locator("#admin_archetype_Disp");
    this.formatSelect = page.locator("#admin_archetype_Format");
    this.deckTagsSelect = page.locator("#admin_archetype_DeckTags");
    this.colorsCheckboxes = page.locator(
      '.archetype-colors input[type="checkbox"], [id^="admin_archetype_Colors_"]'
    );
    this.oldArchetypeId = page.locator("#admin_archetype_oldArchetypeId");

    // 文言は messages.ja.yaml の trans キー由来（位置情報）。合否は仕様で判定する。
    this.saveButton = page.locator('button[type="submit"][form="admin_archetype"]');
    this.deleteButton = page.locator("#btn_delete");
    this.backLink = page.getByRole("link", { name: "戻る" });

    this.selectCardButton = page.locator('[data-bs-target="#searchCardImageModal"]');
    this.cardModal = page.locator("#searchCardImageModal");
    this.cardModalTitle = this.cardModal.locator(".modal-title");
    this.cardSearchWord = page.locator("#card_image_search_word");
    this.cardExactMatch = page.locator("#card_image_exact_match");
    this.cardSearchText = page.locator("#card_image_search_set");
    this.cardSearchButton = page.locator("#btn_search_card_image");
    this.cardSearchResults = page.locator("#card_image_search_results");
    this.cardPreview = page.locator("#cardImagePreview");
    this.selectedCardName = page.locator("#selectedCardImageName");
    this.selectCardRowButton = page.locator(".select-card-image");

    this.flashSuccess = page.locator(".alert-success");
    this.flashDanger = page.locator(".alert-danger");
    // 正確なエラークラスは bootstrap_4_horizontal_layout の form_errors 出力に依存（要実機確認）。
    this.fieldError = page.locator(".invalid-feedback, .text-danger");
  }

  // ===== URL（実装位置情報。合否の上位オラクルは仕様） =====
  newUrl(): string {
    return `/${ECCUBE_ADMIN_ROUTE}/archetype/new`;
  }
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/archetype/${id}/edit`;
  }
  listUrl(): string {
    return `/${ECCUBE_ADMIN_ROUTE}/archetype`;
  }

  async gotoNew() {
    await this.page.goto(this.newUrl());
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  // ===== 操作 =====
  /** 名称(日/英)を埋めて保存（必須以外は刷新先の初期値=公開状態/フォーマットに依存）。 */
  async fillRequired(nameJp: string, nameEn: string) {
    await this.nameJp.fill(nameJp);
    await this.nameEn.fill(nameEn);
  }
  async submit() {
    await this.saveButton.click();
  }
  /** 代表カード検索モーダルを開く。 */
  async openCardModal() {
    await this.selectCardButton.click();
    await expect(this.cardModal).toBeVisible();
  }
  /** モーダルで検索語を入力して検索（結果はXHR JSONで描画）。 */
  async searchCard(word: string) {
    await this.cardSearchWord.fill(word);
    await this.cardSearchButton.click();
  }
  /** 削除ボタン押下（confirmはspec側で page.on('dialog') により受諾する）。 */
  async clickDelete() {
    await this.deleteButton.click();
  }

  // ===== 表示検証（UI部品が仕様どおり表示されること） =====
  /** 新規画面の必須入力欄と保存ボタンが表示されること。 */
  async seeNewRequiredFields() {
    await expect(this.nameJp).toBeVisible();
    await expect(this.nameEn).toBeVisible();
    await expect(this.dispSelect).toBeVisible();
    await expect(this.formatSelect).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }
  /** 新規画面の任意項目・代表カード選択ボタンが表示されること。 */
  async seeNewOptionalFields() {
    await expect(this.commentJp).toBeVisible();
    await expect(this.commentEn).toBeVisible();
    await expect(this.deckTagsSelect).toBeAttached();
    await expect(this.selectCardButton).toBeVisible();
  }
  /** 新規/編集画面にカラー（複数チェック）欄が表示されること。 */
  async seeColorsField() {
    // 仕様: カラーは任意・複数チェック（入力項目）。expanded EntityType でチェックボックス群が描画される。
    await expect(this.colorsCheckboxes.first()).toBeVisible();
  }
  /** 代表カード検索モーダルの入力部品が表示されること。 */
  async seeCardModalFields() {
    await expect(this.cardModalTitle).toContainText("代表カード検索");
    await expect(this.cardSearchWord).toBeVisible();
    await expect(this.cardExactMatch).toBeVisible();
    await expect(this.cardSearchText).toBeVisible();
    await expect(this.cardSearchButton).toBeVisible();
  }
}
