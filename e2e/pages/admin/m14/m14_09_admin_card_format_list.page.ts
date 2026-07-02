import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カード管理 > フォーマット一覧 Page Object（@admin/Format/format_list.twig）。
 * 期待結果は仕様(functions/pf-eccube3/m14-09_admin_card_format_list.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。本一覧は入力フォームを持たない参照系のため Form/Type は使わない。
 *
 * 重要(仕様乖離・付帯表4): 設計書は pf-eccube3 / HareruyaEc プラグインのリバース。刷新先 ec-cube-enterprise では
 *  - 削除入口が「行アンカーの data-method=delete 直接送信」ではなく Bootstrap モーダル(#DeleteModal)経由
 *    （format_list.twig:63-67 トリガ → delete_modal.twig:21 の data-method=delete アンカー）。設計の「モーダルを定義しない／
 *    javascriptブロックなし」と乖離（一覧テンプレートに javascript ブロックと #DeleteModal が存在する）。
 *  - 削除ルートが設計の `DELETE /{admin_route}/format/{id}/delete` ではなく `admin_format_delete`
 *    ＝ `DELETE /{admin_route}/product/format/{id}/delete`（FormatController.php:130）。
 *  - フォーマット名セルが編集リンクではなく素のテキスト。編集は鉛筆アイコン a.action-edit（format_list.twig:57-58）。
 *  - 削除拒否時の遷移先が設計の Referer ではなく一覧(admin_format_list)（FormatController.php:145,150,155）。
 *  - 削除エラーメッセージが単一キーではなくイベント/デッキ/アーキタイプ別の3キー
 *    （admin.product.format.error.delete.registered_event/deck/archetype, messages.ja.yaml:4027-4029）。
 *  - 設計の `admin/assets/css/format.css` 読込はテンプレートに存在しない。
 * テストは仕様どおりの観測（一覧表示・新規/編集遷移・削除可否）を期待し、乖離は付帯表4で管理する。
 *
 * DOM/セレクタ根拠（format_list.twig: app/template/admin/Format/format_list.twig）:
 *  - 新規登録ボタン a.btn-ec-regular（:30 / trans admin.common.registration__new=「新規登録」 messages.ja.yaml:1437）
 *  - 一覧テーブル table.table（:37）／見出し フォーマット名(:40)・略称(:41)・認定(:42)
 *  - データ行 tbody tr（:47-48）／フォーマット名セル「和名 / 英名」(:49)／略称(:50)／認定(:51-54)
 *  - 編集アイコン a.action-edit（:57 / href admin_format_edit /format/{id}/edit）
 *  - 削除アイコン（モーダルトリガ）a.btn-ec-actionIcon[data-bs-target="#DeleteModal"]（:63-65 / data-url=admin_format_delete）
 *  - 削除モーダル #DeleteModal（delete_modal.twig:2）／実行アンカー a.btn-ec-delete[data-method=delete]（delete_modal.twig:21 csrf_token_for_anchor）
 *  - タイトル/サブタイトル admin.product.format_list=「フォーマット一覧」(:5) / admin.product.format_management=「フォーマット管理」(:6)
 */
export class CardFormatListPage {
  readonly page: Page;
  readonly url: string;

  readonly newButton: Locator; // format_list.twig:30 新規登録
  readonly table: Locator; // format_list.twig:37
  readonly headerFormatName: Locator; // format_list.twig:40 「フォーマット名」
  readonly headerCode: Locator; // format_list.twig:41 「略称」
  readonly headerCertification: Locator; // format_list.twig:42 「認定」
  readonly rows: Locator; // format_list.twig:47-48 tbody tr
  readonly editIcons: Locator; // format_list.twig:57 a.action-edit
  readonly deleteIcons: Locator; // format_list.twig:63 a.btn-ec-actionIcon[data-bs-target="#DeleteModal"]
  readonly deleteModal: Locator; // delete_modal.twig:2 #DeleteModal
  readonly modalDeleteAnchor: Locator; // delete_modal.twig:21 a.btn-ec-delete[data-method=delete]

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/format`;
    this.newButton = page.getByRole("link", { name: "新規登録" });
    this.table = page.locator("table.table");
    this.headerFormatName = page.locator("table.table thead th", { hasText: "フォーマット名" });
    this.headerCode = page.locator("table.table thead th", { hasText: "略称" });
    this.headerCertification = page.locator("table.table thead th", { hasText: "認定" });
    this.rows = page.locator("table.table tbody tr");
    this.editIcons = page.locator("a.action-edit");
    this.deleteIcons = page.locator('a.btn-ec-actionIcon[data-bs-target="#DeleteModal"]');
    this.deleteModal = page.locator("#DeleteModal");
    this.modalDeleteAnchor = page.locator('#DeleteModal a.btn-ec-delete[data-method="delete"]');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 一覧の基本UI部品（タイトル・テーブル見出し・新規登録ボタン）が表示されること。 */
  async seeListBasics() {
    // 設計はタイトル「フォーマット管理」。刷新先は title=フォーマット一覧/sub_title=フォーマット管理の両表示（付帯表4）。
    await expect(this.page.locator("body")).toContainText("フォーマット管理");
    await expect(this.table).toBeVisible();
    await expect(this.newButton).toBeVisible();
  }

  /** テーブル見出しが「フォーマット名」「略称」「認定」であること。 */
  async seeTableHeaders() {
    await expect(this.headerFormatName).toBeVisible();
    await expect(this.headerCode).toBeVisible();
    await expect(this.headerCertification).toBeVisible();
  }

  /** 先頭行の編集アイコンを押下する（編集画面へ遷移）。 */
  async clickFirstEdit() {
    await this.editIcons.first().click();
  }

  /** 先頭行の削除アイコンを押下し、削除確認モーダルを開く（刷新先はモーダル方式）。 */
  async openFirstDeleteModal() {
    await this.deleteIcons.first().click();
  }
}
