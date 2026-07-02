import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 コンテンツ管理「レイアウト管理」Page Object（一覧 / 新規 / 編集 / 削除 / プレビュー / コードプレビュー）。
 *
 * オラクル独立性: 期待結果（合否）は仕様（正本md functions/ec-cube-enterprise/m09-03_admin_content_content_layout.md・
 *   テスト観点表・messages.ja.yaml/validators.ja.yaml の確認値）由来とする。本ファイルが実装から取るのは
 *   セレクタ（位置情報）のみであり、必須/制約/挙動を期待結果へ流用しない。
 *
 * 画面タイプ: other（CRUD ＋ Ajax プレビュー ＋ クライアント D&D）。観測可能な範囲を自動化対象とする。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src/Eccube 基準）:
 *  - フォーム DOM id は Symfony Form の getBlockPrefix='admin_layout'（LayoutType.php:91-94）由来。
 *    name→#admin_layout_name（layout.twig:209）/ DeviceType(新規select)→#admin_layout_DeviceType（layout.twig:221）/
 *    Page(プレビュー対象select)→#admin_layout_Page（layout.twig:423）/ _token→#admin_layout__token（layout.twig:193）。
 *  - 一覧: 新規作成 a.btn-ec-regular href=admin_content_layout_new trans admin.common.create__new=「新規作成」（layout_list.twig:39 / messages.ja.yaml:1454）
 *  - 一覧: レイアウトカード見出しリンク a.card-title href=admin_content_layout_edit（layout_list.twig:53-54）
 *  - 一覧: 端末種別アイコン PC=i.fa-desktop / それ以外=i.fa-mobile（layout_list.twig:47-52）
 *  - 一覧: 削除ボタン button[data-bs-target="#DeleteModal"] trans admin.content.layout_delete=「レイアウトを削除」（layout_list.twig:58-63 / messages.ja.yaml:2675）。既定レイアウトは Layout.isDefault()==false でのみ出力（:57）
 *  - 一覧: 割り当てページ無し span.text-muted trans admin.content.layout_no_page=「ページが登録されていません」（layout_list.twig:89 / messages.ja.yaml:2676）
 *  - 削除モーダル #DeleteModal（layout_list.twig:97）/ メッセージ p.modal-message（:105 jsで data-message を差込）/
 *    実行リンク a[data-method="delete"]（:109）/ data-message は trans admin.common.delete_modal__message（:60 / messages.ja.yaml:1593）
 *  - 編集: 概要カード見出し trans admin.content.layout__card_title=「レイアウト概要」（layout.twig:200 / messages.ja.yaml:2677）
 *  - 編集: 名称ラベル trans admin.content.layout_name=「レイアウト名」＋必須バッジ trans admin.common.required（layout.twig:207）
 *  - 編集: 編集カード見出し trans admin.content.layout_edit__card_title=「レイアウト編集」（layout.twig:249 / messages.ja.yaml:2679）
 *  - 編集: 配置プレースホルダ .target-placeholder trans admin.content.layout_drag_and_drop_message=「ブロックをドラッグ＆ドロップ」（layout.twig:267 等 / messages.ja.yaml:2680）
 *  - 編集: 未使用ブロック欄 #unused-block（layout.twig:431）/ 検索入力 #search-block（layout.twig:442）/
 *    未使用ブロック item [id^="detail_box__layout_item--"] .view_readme（layout.twig:448,458）
 *  - 編集: コンテキストメニュー起点 .block-context-menu（layout.twig:472 / layout_block.twig:28）/
 *    ポップオーバー項目 .context-moveup/.context-movedown/.context-movesection/.context-preview（layout.twig:525-536）
 *    trans layout_up/down/move_to/preview_code
 *  - 編集: コードプレビューモーダル #codePreview（layout.twig:505）/ エディタ #block-source-code（layout.twig:514 ace）/
 *    コード編集ボタン #block-edit data-href=admin_content_block_edit（layout.twig:518。DUMMY_BLOCK_ID=9999999999 を実IDへ置換 LayoutController.php:41）
 *  - 編集: プレビューボタン #preview-button trans admin.content.layout_preview=「プレビュー」（layout.twig:426）。Layout.id かつ Page候補ありで表示（:419）。
 *    ページ未選択時 alert trans admin.content.layout_preview_select_page=「プレビューするページを選択してください」（layout.twig:163 / messages.ja.yaml:2686）
 *  - 編集: 登録ボタン button[type=submit] trans admin.common.registration=「登録」（layout.twig:556）/
 *    レイアウト管理戻り a.c-baseLink href=admin_content_layout（layout.twig:550）
 *
 * ルート（LayoutController.php）:
 *  index GET /content/layout（:55）/ new GET,POST /content/layout/new（:104）/ edit GET,POST /content/layout/{id}/edit（:103）/
 *  delete DELETE /content/layout/{id}/delete（:72）/ preview POST /content/layout/{id}/preview（:226）/ view_block GET /content/layout/view_block（:192）
 *
 * 注: 名称必須エラー位置（form_errors → form_theme bootstrap_4_horizontal_layout 依存）の正確なセレクタは要実機確認。
 *   本POMは「保存しましたフラッシュが出ない＋編集画面に滞留」を主観測とし、文言「入力されていません。」（設計書 表示メッセージ節 正本:187）を補助確認とする。
 *   D&D 永続化・サーバ側再検証・プレビュー別タブのフロント描画内容は手動（ケース表で管理）。
 */
export class ContentContentLayoutPage {
  readonly page: Page;
  readonly listUrl: string;
  readonly newUrl: string;
  readonly viewBlockUrl: string;

  // --- 一覧 ---
  readonly createNewLink: Locator; // layout_list.twig:39 trans admin.common.create__new
  readonly layoutCards: Locator; // layout_list.twig:43 .card
  readonly layoutTitleLinks: Locator; // layout_list.twig:53-54 a.card-title
  readonly deviceIcons: Locator; // layout_list.twig:47-52 各カードの端末種別アイコン（PC=fa-desktop / それ以外=fa-mobile）
  readonly deleteButtons: Locator; // layout_list.twig:58 button[data-bs-target="#DeleteModal"]
  readonly deleteModal: Locator; // layout_list.twig:97 #DeleteModal
  readonly deleteModalMessage: Locator; // layout_list.twig:105 p.modal-message
  readonly deleteModalConfirm: Locator; // layout_list.twig:109 a[data-method="delete"]
  readonly noPageLabel: Locator; // layout_list.twig:89 span.text-muted

  // --- 編集/新規 ---
  readonly nameInput: Locator; // layout.twig:209 #admin_layout_name
  readonly requiredBadge: Locator; // layout.twig:207 必須バッジ
  readonly deviceTypeSelect: Locator; // layout.twig:221 #admin_layout_DeviceType（新規のみ）
  readonly pageSelect: Locator; // layout.twig:423 #admin_layout_Page
  readonly registerButton: Locator; // layout.twig:556 type=submit trans admin.common.registration
  readonly backToListLink: Locator; // layout.twig:550 a.c-baseLink
  readonly placeholders: Locator; // layout.twig:267等 .target-placeholder
  readonly unusedBlockArea: Locator; // layout.twig:431 #unused-block
  readonly searchBlockInput: Locator; // layout.twig:442 #search-block
  readonly unusedBlockItems: Locator; // layout.twig:448 [id^="detail_box__layout_item--"]
  readonly contextMenuTriggers: Locator; // layout.twig:472 .block-context-menu
  readonly previewButton: Locator; // layout.twig:426 #preview-button
  readonly codePreviewModal: Locator; // layout.twig:505 #codePreview
  readonly codePreviewEditor: Locator; // layout.twig:514 #block-source-code
  readonly nameError: Locator; // 名称必須エラー（位置は要実機確認。文言で補助確認）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/content/layout`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/content/layout/new`;
    this.viewBlockUrl = `/${ECCUBE_ADMIN_ROUTE}/content/layout/view_block`;

    this.createNewLink = page.locator('a[href$="/content/layout/new"]');
    this.layoutCards = page.locator(".c-primaryCol .card.rounded");
    this.layoutTitleLinks = page.locator("a.card-title");
    // 各レイアウトカードの端末種別アイコン（1カード1アイコン）。layout_list.twig:47-52
    this.deviceIcons = page.locator(".card-header i.fa-desktop, .card-header i.fa-mobile");
    this.deleteButtons = page.locator('button[data-bs-target="#DeleteModal"]');
    this.deleteModal = page.locator("#DeleteModal");
    this.deleteModalMessage = page.locator("#DeleteModal p.modal-message");
    this.deleteModalConfirm = page.locator('#DeleteModal a[data-method="delete"]');
    this.noPageLabel = page.locator("span.text-muted");

    this.nameInput = page.locator("#admin_layout_name");
    this.requiredBadge = page.locator(".badge.bg-primary");
    this.deviceTypeSelect = page.locator("#admin_layout_DeviceType");
    this.pageSelect = page.locator("#admin_layout_Page");
    this.registerButton = page.locator('button[type="submit"]');
    this.backToListLink = page.locator('a.c-baseLink[href$="/content/layout"]');
    this.placeholders = page.locator(".target-placeholder");
    this.unusedBlockArea = page.locator("#unused-block");
    this.searchBlockInput = page.locator("#search-block");
    this.unusedBlockItems = page.locator('#unused-block [id^="detail_box__layout_item--"]');
    this.contextMenuTriggers = page.locator(".block-context-menu");
    this.previewButton = page.locator("#preview-button");
    this.codePreviewModal = page.locator("#codePreview");
    this.codePreviewEditor = page.locator("#block-source-code");
    // form_errors(form.name) の出力位置は form_theme 依存（要実機確認）。文言で位置非依存に確認する。
    this.nameError = page.getByText("入力されていません。");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  async gotoNew() {
    await this.page.goto(this.newUrl);
  }

  async gotoEdit(id: number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/layout/${id}/edit`);
  }

  /** 一覧見出し（仕様: 「レイアウト管理」/ 副題「コンテンツ管理」）を確認 */
  async seeListHeading() {
    await expect(this.page.locator("h1, .c-pageTitle")).toContainText("レイアウト管理");
  }

  /** 名称・端末種別を入力して登録（新規） */
  async fillNew(name: string, deviceTypeValueOrLabel?: string) {
    await this.nameInput.fill(name);
    if (deviceTypeValueOrLabel !== undefined) {
      await this.deviceTypeSelect.selectOption(deviceTypeValueOrLabel);
    }
  }

  async submit() {
    await this.registerButton.click();
  }

  /** 未使用ブロック検索で絞り込み */
  async searchUnused(word: string) {
    await this.searchBlockInput.fill(word);
  }

  /** 保存成功フラッシュ（仕様: 「保存しました」）を確認 */
  async seeSaveComplete() {
    await expect(this.page.locator(".alert, .c-alert, body")).toContainText("保存しました");
  }

  /** 削除成功フラッシュ（仕様: 「削除しました」）を確認 */
  async seeDeleteComplete() {
    await expect(this.page.locator(".alert, .c-alert, body")).toContainText("削除しました");
  }

  /** 削除不可警告（仕様: 「関連するデータがあるため「<名称>」を削除できませんでした」）を確認 */
  async seeDeleteForbidden(layoutName: string) {
    await expect(this.page.locator("body")).toContainText(
      `関連するデータがあるため「${layoutName}」を削除できませんでした`
    );
  }
}
