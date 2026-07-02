import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カード管理 > フォーマット 新規登録・編集・削除 Page Object。
 * 画面: 一覧(@admin/Format/format_list.twig) / 登録・編集(@admin/Format/edit.twig) / 削除モーダル(@admin/Format/delete_modal.twig)。
 *
 * 期待結果は仕様（正本 functions/pf-eccube3/m14-10_admin_card_card_format_register_edit_delete.md / integration-test-viewpoints.md）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_format`（FormatType.php:381-384）由来の位置情報のみ。
 * 必須/最大長/Range 等のフォーム制約は期待値に流用しない（制約の正は設計書）。
 *
 * 重要（設計源と刷新先の乖離・付帯表4で管理）: 設計書は pf-eccube3 / HareruyaEc プラグインのリバース。刷新先 ec-cube-enterprise では
 *  - 削除ルートが設計の DELETE `/{route}/format/{id}/delete` ではなく DELETE `/{route}/product/format/{id}/delete`（FormatController.php:130）。
 *  - 禁止カード/制限カード/カードセット の複数選択(Select2)フィールドが FormType・edit.twig に存在しない（設計の主要入力項目の一部が刷新先で未実装）。
 *  - 文字列長(Length)制約が nameJp/nameEn/code/rule に無い（設計は 64/10/65535 を要求）。
 *  - 検証失敗時の `admin.register.failed` フラッシュが無い（form_errors 再表示のみ）。
 *  - 削除拒否時の遷移先が Referer ではなく一覧(admin_format_list)固定。
 *  - 成功/削除/拒否のフラッシュキーが設計と異なる（admin.common.save_complete / delete_complete / registered_event 等）。
 * テストは仕様どおりの観測（成功遷移・滞留・削除可否）を期待し、文言ハードコードに依存しない。
 *
 * DOM id 根拠（getBlockPrefix=admin_format、camelCase は保持。JS が #admin_format_useCommandFlg を参照: edit.twig:11）:
 *  - nameJp → #admin_format_nameJp（edit.twig:57） / nameEn → #admin_format_nameEn（edit.twig:64）
 *  - code → #admin_format_code（edit.twig:72） / rank → #admin_format_rank（edit.twig:81）
 *  - mainMaxCardCount → #admin_format_mainMaxCardCount（edit.twig:90） / mainMinCardCount（edit.twig:99）
 *  - sideMaxCardCount（edit.twig:108） / sideMinCardCount（edit.twig:117）
 *  - MetaRange → #admin_format_MetaRange（edit.twig:199） / useCommandFlg → #admin_format_useCommandFlg（edit.twig:229）
 *  - commandMaxCardCount（edit.twig:251, class js-commander-setting） / commandMinCardCount（edit.twig:260）
 *  - 登録ボタン trans admin.common.registration「登録」（edit.twig:298 / messages.ja.yaml:1436）
 *  - 新規登録リンク trans admin.common.registration__new「新規登録」（format_list.twig:30-32 / messages.ja.yaml:1437）
 *  - カード見出し admin.product.format__card_title「フォーマット情報」（edit.twig:48 / messages.ja.yaml:3951）
 *  - 削除モーダル #DeleteModal（delete_modal.twig:2）／削除実行アンカー data-method=delete（delete_modal.twig:21）
 */
export class CardCardFormatRegisterEditDeletePage {
  readonly page: Page;
  readonly listUrl: string;
  readonly newUrl: string;

  // 一覧
  readonly newButton: Locator; // 「新規登録」リンク（format_list.twig:30）
  readonly listTable: Locator; // 一覧テーブル（format_list.twig:37）
  readonly editLinks: Locator; // 行内「編集」リンク（format_list.twig:57 a.action-edit）
  readonly deleteModalTriggers: Locator; // 削除モーダル起動アンカー（format_list.twig:63 / edit.twig:287）

  // 登録・編集フォーム
  readonly cardTitle: Locator; // 「フォーマット情報」見出し（edit.twig:48 .card-title）
  readonly nameJp: Locator; // edit.twig:57
  readonly nameEn: Locator; // edit.twig:64
  readonly code: Locator; // edit.twig:72
  readonly rank: Locator; // edit.twig:81
  readonly mainMaxCardCount: Locator; // edit.twig:90
  readonly mainMinCardCount: Locator; // edit.twig:99
  readonly sideMaxCardCount: Locator; // edit.twig:108
  readonly sideMinCardCount: Locator; // edit.twig:117
  readonly metaRange: Locator; // edit.twig:199
  readonly useCommandFlg: Locator; // edit.twig:229
  readonly commandMaxCardCount: Locator; // edit.twig:251 (js-commander-setting)
  readonly commandMinCardCount: Locator; // edit.twig:260 (js-commander-setting)
  readonly submitButton: Locator; // 「登録」（edit.twig:298）
  readonly deleteButtonOnEdit: Locator; // 編集画面の削除ボタン（edit.twig:287、Format.id 有時のみ）

  // 削除モーダル
  readonly deleteModal: Locator; // #DeleteModal（delete_modal.twig:2）
  readonly modalConfirmDelete: Locator; // モーダル内の削除実行アンカー（delete_modal.twig:21 data-method=delete）

  // バリデーションエラー（EC-CUBE form_errors 出力。クラスは form theme 依存のため要実機確認）
  readonly formError: Locator; // .invalid-feedback（要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/format`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/format/new`;

    this.newButton = page.getByRole("link", { name: "新規登録" });
    this.listTable = page.locator("table.table");
    this.editLinks = page.locator("a.action-edit");
    this.deleteModalTriggers = page.locator('[data-bs-target="#DeleteModal"]');

    this.cardTitle = page.locator(".card-title");
    this.nameJp = page.locator("#admin_format_nameJp");
    this.nameEn = page.locator("#admin_format_nameEn");
    this.code = page.locator("#admin_format_code");
    this.rank = page.locator("#admin_format_rank");
    this.mainMaxCardCount = page.locator("#admin_format_mainMaxCardCount");
    this.mainMinCardCount = page.locator("#admin_format_mainMinCardCount");
    this.sideMaxCardCount = page.locator("#admin_format_sideMaxCardCount");
    this.sideMinCardCount = page.locator("#admin_format_sideMinCardCount");
    this.metaRange = page.locator("#admin_format_MetaRange");
    this.useCommandFlg = page.locator("#admin_format_useCommandFlg");
    this.commandMaxCardCount = page.locator("#admin_format_commandMaxCardCount");
    this.commandMinCardCount = page.locator("#admin_format_commandMinCardCount");
    this.submitButton = page.locator('#form1 button[type="submit"]');
    this.deleteButtonOnEdit = page.locator(
      '.c-conversionArea [data-bs-target="#DeleteModal"]'
    );

    this.deleteModal = page.locator("#DeleteModal");
    this.modalConfirmDelete = page.locator('#DeleteModal [data-method="delete"]');

    this.formError = page.locator(".invalid-feedback");
  }

  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/format/${id}/edit`;
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }
  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  /** 編集画面へ遷移し HTTP 応答を返す（404 確認に使う）。 */
  async gotoEdit(id: number | string) {
    return await this.page.goto(this.editUrl(id));
  }

  /** 必須項目に有効値を入力する（成功登録用）。任意で名称を上書き。 */
  async fillRequired(opts?: {
    nameJp?: string;
    nameEn?: string;
    rank?: string;
    metaRange?: string;
  }) {
    await this.nameJp.fill(opts?.nameJp ?? "E2Eフォーマット");
    await this.nameEn.fill(opts?.nameEn ?? "E2E_Format");
    await this.rank.fill(opts?.rank ?? "9999");
    await this.metaRange.fill(opts?.metaRange ?? "14");
  }

  async submit() {
    await this.submitButton.click();
  }

  /**
   * 送信失敗時にサーバが同一フォーム（/format/new）を再表示し検証エラーを示すこと。
   * 設計（画面遷移: 送信バリデーション失敗→同一編集画面を再表示／エラー処理: 検証失敗→再表示）由来。
   * URL滞留のみでは HTML5 ネイティブ検証（required/min/max 属性）とサーバ検証を区別できないため、
   * サーバ再表示後の検証エラー領域の表示も独立に確認する。エラー領域クラスは form theme 依存＝要実機確認。
   */
  async expectStayOnNewWithError() {
    await expect(this.page).toHaveURL(/\/format\/new(\?|$)/);
    await expect(this.formError.first()).toBeVisible();
  }

  /** 登録・編集画面のUI部品が仕様どおり表示されること（見出し・必須項目・登録ボタン）。 */
  async seeEditForm() {
    await expect(this.cardTitle).toContainText("フォーマット情報");
    await expect(this.nameJp).toBeVisible();
    await expect(this.nameEn).toBeVisible();
    await expect(this.rank).toBeVisible();
    await expect(this.metaRange).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
