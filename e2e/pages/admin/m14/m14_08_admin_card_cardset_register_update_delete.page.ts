import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カード管理 > カードセット 新規登録/編集/削除 Page Object（未実行雛形）。
 * 画面: カードセット詳細（@admin/Cardset/edit.twig を新規・編集で共用 / CardsetController.php）。
 *   新規 admin_cardset_new ＝ GET|POST /{admin_route}/cardset/new（CardsetController.php:116）
 *   編集 admin_cardset_edit ＝ GET|POST /{admin_route}/cardset/{id}/edit（:148）
 *   一覧 admin_cardset_list ＝ /{admin_route}/cardset（:49）
 *   削除 admin_cardset_delete ＝ DELETE /{admin_route}/product/cardset/{id}/delete（:187。設計の /cardset/{id}/delete と乖離＝ケース表 付帯表4#4）
 * 期待結果は仕様（正本 functions/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.md / 観点表 / 基本設計）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_cardset`（CardsetType.php:174-177）由来の位置情報のみ。Form制約は期待値へ流用しない。
 *
 * 設計源(pf-eccube3 リバース) ⇔ 刷新先(ec-cube-enterprise) 乖離（ケース表 付帯表4）:
 *  - 送信ボタンは新規/編集とも「登録」(admin.common.registration)。設計の編集「更新」とは乖離(#1)。
 *  - 成功フラッシュは admin.common.save_complete「保存しました」。設計の登録完了文言とは乖離(#2)。本POMは文言を断定せずフラッシュ領域の表示で観測。
 *  - 並び順rank/カテゴリ/フリーエリア/各種フラグ/symbol_image hidden 等は刷新先フォームに存在しない(#7)。創作セレクタを置かない。
 *  - リリース日は DateType(年/月/日 select)。設計の単一テキストとは乖離(#8)。
 *  - 削除は専用モーダル #DeleteModal を表示。設計「モーダル無し」とは逆(#9)。
 *
 * DOM id / セレクタ根拠（edit.twig / delete_modal.twig 基準）:
 *  - CSRFトークン → #admin_cardset__token（edit.twig:32 form_widget(form._token)）
 *  - カードセット名(日) 必須 → #admin_cardset_nameJp（edit.twig:41 / ラベル admin.card.cardset.name_jp）
 *  - カードセット名(英) 必須 → #admin_cardset_nameEn（edit.twig:48）
 *  - 略称 必須・半角ASCII → #admin_cardset_code（edit.twig:56）
 *  - ブロック(select) → #admin_cardset_Cardsetblock（edit.twig:65、placeholder admin.card.cardset.block_unselected=未指定）
 *  - リリース日(DateType select) → #admin_cardset_releaseDate_year/_month/_day（edit.twig:74）
 *  - 特殊セットフラグ → #admin_cardset_specialFlg（edit.twig:86）
 *  - シンボル画像(file) → #admin_cardset_symbol_image_file（edit.twig:100）
 *  - 登録ボタン → button.btn-ec-conversion[type=submit]（edit.twig:164 / trans admin.common.registration=「登録」messages.ja.yaml:1436）
 *  - 削除導線(モーダル起動・Cardset.id時のみ) → a.btn-ec-delete[data-bs-target="#DeleteModal"]（edit.twig:153）
 *  - 削除モーダル → #DeleteModal（delete_modal.twig:2）／タイトル .modal-title（:7 admin.common.delete_modal__title=削除します）
 *    ／メッセージ .modal-message（:15 JS挿入 admin.common.delete_modal__message）／確認 a.btn-ec-delete[data-method="delete"]（:21）
 *  - 収録カードリスト見出し → th 'admin.card.cardset.card_list'=「収録カードリスト」（edit.twig:128 / messages.ja.yaml:4204）
 *  - 戻る導線 → a.c-baseLink（edit.twig:151 admin_cardset_list / admin.card.cardset_management=カードセット管理）
 *  - 必須バッジ → .badge.bg-primary（edit.twig:39 admin.common.required=必須）
 *  - 入力検証エラー → form_errors 出力（edit.twig:42,49,57,...）。Bootstrap form theme は .invalid-feedback。要実機確認。
 */
export class CardCardsetRegisterUpdateDeletePage {
  readonly page: Page;
  readonly newUrl: string; // 新規フォーム
  readonly listUrl: string; // 一覧

  readonly nameJp: Locator; // #admin_cardset_nameJp
  readonly nameEn: Locator; // #admin_cardset_nameEn
  readonly code: Locator; // #admin_cardset_code
  readonly cardsetblock: Locator; // #admin_cardset_Cardsetblock
  readonly releaseYear: Locator; // #admin_cardset_releaseDate_year
  readonly releaseMonth: Locator; // #admin_cardset_releaseDate_month
  readonly releaseDay: Locator; // #admin_cardset_releaseDate_day
  readonly specialFlg: Locator; // #admin_cardset_specialFlg
  readonly symbolImageFile: Locator; // #admin_cardset_symbol_image_file
  readonly registerButton: Locator; // 「登録」submit
  readonly deleteTrigger: Locator; // 削除モーダル起動リンク（Cardset.id時のみ）
  readonly deleteModal: Locator; // #DeleteModal
  readonly deleteModalTitle: Locator; // #DeleteModal .modal-title
  readonly deleteModalMessage: Locator; // #DeleteModal .modal-message
  readonly deleteConfirm: Locator; // #DeleteModal a[data-method="delete"]
  readonly cardListHeading: Locator; // 収録カードリスト見出し
  readonly backToList: Locator; // 戻る導線
  readonly requiredBadge: Locator; // .badge.bg-primary（必須）
  readonly fieldError: Locator; // form_errors（.invalid-feedback。要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/cardset/new`;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/cardset`;

    this.nameJp = page.locator("#admin_cardset_nameJp");
    this.nameEn = page.locator("#admin_cardset_nameEn");
    this.code = page.locator("#admin_cardset_code");
    this.cardsetblock = page.locator("#admin_cardset_Cardsetblock");
    this.releaseYear = page.locator("#admin_cardset_releaseDate_year");
    this.releaseMonth = page.locator("#admin_cardset_releaseDate_month");
    this.releaseDay = page.locator("#admin_cardset_releaseDate_day");
    this.specialFlg = page.locator("#admin_cardset_specialFlg");
    this.symbolImageFile = page.locator("#admin_cardset_symbol_image_file");
    this.registerButton = page.locator('button.btn-ec-conversion[type="submit"]');
    this.deleteTrigger = page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]');
    this.deleteModal = page.locator("#DeleteModal");
    this.deleteModalTitle = page.locator("#DeleteModal .modal-title");
    this.deleteModalMessage = page.locator("#DeleteModal .modal-message");
    this.deleteConfirm = page.locator('#DeleteModal a.btn-ec-delete[data-method="delete"]');
    this.cardListHeading = page.getByText("収録カードリスト");
    this.backToList = page.locator("a.c-baseLink");
    this.requiredBadge = page.locator(".badge.bg-primary");
    this.fieldError = page.locator(".invalid-feedback");
  }

  async gotoNew() {
    await this.page.goto(this.newUrl);
  }

  async gotoEdit(id: string | number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/cardset/${id}/edit`);
  }

  /** リリース日(DateType select)を年/月/日で選択する。 */
  async fillReleaseDate(year: string, month: string, day: string) {
    await this.releaseYear.selectOption(year);
    await this.releaseMonth.selectOption(month);
    await this.releaseDay.selectOption(day);
  }

  /**
   * 必須項目を有効値で入力する（リリース日は当年・1月・1日を既定とする）。
   * 期待される登録成功はテスト側で観測する。値はテスト由来でオラクル化しない。
   */
  async fillValidRequired(opts: { nameJp: string; nameEn: string; code: string }) {
    await this.nameJp.fill(opts.nameJp);
    await this.nameEn.fill(opts.nameEn);
    await this.code.fill(opts.code);
    // 当年の最初の選択肢を採る（DateType の年範囲は当年起点。要実機確認の場合は index 指定で代替）。
    await this.releaseYear.selectOption({ index: 1 });
    await this.releaseMonth.selectOption({ index: 1 });
    await this.releaseDay.selectOption({ index: 1 });
  }

  async submit() {
    await this.registerButton.click();
  }

  /** 新規フォームの主要UI部品が仕様どおり表示されること。 */
  async seeNewForm() {
    await expect(this.nameJp).toBeVisible();
    await expect(this.nameEn).toBeVisible();
    await expect(this.code).toBeVisible();
    await expect(this.registerButton).toBeVisible();
    // 新規は削除導線が無いこと（利用者視点の入口）。
    await expect(this.deleteTrigger).toHaveCount(0);
  }

  /** 編集フォームの既存値・削除導線・収録カードリストが表示されること。 */
  async seeEditForm() {
    await expect(this.nameJp).toBeVisible();
    // 既存値が埋まっていること（仕様: 編集は既存値が埋まったフォーム）。
    // 具体値はシード依存のためオラクル化せず、非空であることのみ観測する。
    await expect(this.nameJp).not.toHaveValue("");
    await expect(this.deleteTrigger).toBeVisible();
    await expect(this.cardListHeading.first()).toBeVisible();
  }

  /** 削除モーダルを開く。 */
  async openDeleteModal() {
    await this.deleteTrigger.click();
  }

  /** 削除を確認して実行する。 */
  async confirmDelete() {
    await this.openDeleteModal();
    await expect(this.deleteModal).toBeVisible();
    await this.deleteConfirm.click();
  }
}
