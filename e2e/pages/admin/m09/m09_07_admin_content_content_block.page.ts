import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 コンテンツ管理 ブロック管理（M09-07）Page Object（一覧 / 新規作成・編集フォーム）。
 * 納品ケース表 integration_test/e2e/m09_07_admin_content_content_block_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m09-07_admin_content_content_block.md / 観点表)の挙動由来（オラクル独立性）。
 * i18n リソース(messages.ja.yaml)の表示文言は実装由来だが、設計書がフラッシュ文言（保存しました/削除しました/
 * 同じファイル名のデータが存在しています）を仕様として明記しているため、その範囲のみ文言を判定に用いる。
 * pf-eccube3 由来の設計だが、刷新先 ec-cube-enterprise に同一画面(admin_content_block / Content/block.twig・block_edit.twig)が
 * 実在するためセレクタを導出した。セレクタは Twig＋Symfony Form の getBlockPrefix=`block`（BlockType.php:132-134）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id / セレクタ根拠:
 *  一覧 (Content/block.twig):
 *   - 新規作成リンク     → a.btn-ec-regular[href*="/content/block/new"]（block.twig:41 trans admin.common.create__new=「新規作成」 messages.ja.yaml:1454）
 *                          ※設計書の入口文言は「新規入力」。実装は「新規作成」＝不具合候補#3。誤検知防止のため遷移は href で特定する。
 *   - 検索ボックス       → #search-block（block.twig:50。input type=search。block.twig:29-31 のクライアントJSで一覧を絞り込む。サーバ検索ではない＝不具合候補#6）
 *   - 列見出しブロック名 → trans admin.content.block_name=「ブロック名」（block.twig:62 / messages.ja.yaml:2739）
 *   - 列見出しファイル名 → trans admin.content.block_file_name=「ファイル名」（block.twig:63 / messages.ja.yaml:2741）
 *   - ブロック行         → li#ex-block-{id}（block.twig:68。deletable のみ編集リンク・削除アイコンを描画 block.twig:71-124）
 *   - 編集アイコン       → a[href*="/content/block/{id}/edit"]（block.twig:72,86 tooltip title admin.common.edit=「編集」 messages.ja.yaml:1439）
 *   - 削除アイコン       → a[data-bs-target="#confirmModal-{id}"]（block.twig:96 tooltip title admin.common.delete=「削除」 messages.ja.yaml:1444）
 *   - 削除確認モーダル   → #confirmModal-{id}（block.twig:101。title admin.common.delete_modal__title=「削除します」 messages.ja.yaml:1592。
 *                          設計書の確認文言「このブロックを削除してもよろしいですか？」と乖離＝不具合候補#2。要実機確認）
 *   - 削除実行リンク     → #confirmModal-{id} a[href*="/content/block/{id}/delete"][data-method="delete"]（block.twig:116-117）
 *  フォーム (Content/block_edit.twig):
 *   - フォーム           → #content_block_form（block_edit.twig:64 name=content_block_form method=post）
 *   - ブロック名         → #block_name（block_edit.twig:99 form.name / BlockType.php:52 NotBlank+Length）
 *   - ファイル名         → #block_file_name（block_edit.twig:113 form.file_name / BlockType.php:61 NotBlank+Length+Regex+重複判定）
 *   - ブロックデータ     → #block_block_html（block_edit.twig:132 hidden textarea。表示はACEエディタ #editor block_edit.twig:130。
 *                          設計書は素のtextarea想定＝不具合候補#4。フォーム制約は設計書では任意だが実装はNotBlank+TwigLint＝不具合候補#5。入力は要実機確認）
 *   - ブロックID(hidden) → #block_id（block_edit.twig:67 form.id）
 *   - DeviceType(hidden) → #block_DeviceType（block_edit.twig:68 form.DeviceType）
 *   - CSRFトークン       → #block__token（block_edit.twig:66 form._token）
 *   - カード見出し       → .card-title trans admin.content.block__card_title=「ブロック設定」（block_edit.twig:75 / messages.ja.yaml:2740）
 *   - 必須バッジ         → .badge.bg-primary trans admin.common.required=「必須」（block_edit.twig:96,108,127）
 *   - 登録ボタン         → button[type=submit] trans admin.common.registration=「登録」（block_edit.twig:172 / messages.ja.yaml:1436）
 *   - フィールドエラー   → form_errors() → .invalid-feedback（block_edit.twig:100,119,134）。重複文言 admin.content.block_file_name_exists（messages.ja.yaml:2742。設計書文言の先頭「※」は実装に無い＝不具合候補#8）
 */
export class ContentContentBlockPage {
  readonly page: Page;
  readonly listUrl: string; // 一覧
  readonly newUrl: string; // 新規作成フォーム

  // 一覧
  readonly newLink: Locator; // 新規作成リンク（href で特定）
  readonly searchBox: Locator; // #search-block クライアント絞り込み
  readonly blockRows: Locator; // li[id^="ex-block-"]

  // フォーム
  readonly form: Locator; // #content_block_form
  readonly name: Locator; // #block_name
  readonly fileName: Locator; // #block_file_name
  readonly blockHtmlHidden: Locator; // #block_block_html (hidden)
  readonly aceEditor: Locator; // #editor (ACE表示。要実機確認)
  readonly cardTitle: Locator; // .card-title「ブロック設定」
  readonly requiredBadge: Locator; // .badge.bg-primary「必須」
  readonly registerButton: Locator; // 登録ボタン
  readonly fieldError: Locator; // .invalid-feedback

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/content/block`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/content/block/new`;

    this.newLink = page.locator('a[href*="/content/block/new"]');
    this.searchBox = page.locator("#search-block");
    this.blockRows = page.locator('li[id^="ex-block-"]');

    this.form = page.locator("#content_block_form");
    this.name = page.locator("#block_name");
    this.fileName = page.locator("#block_file_name");
    this.blockHtmlHidden = page.locator("#block_block_html");
    this.aceEditor = page.locator("#editor");
    this.cardTitle = page.locator(".card-title");
    this.requiredBadge = page.locator(".badge.bg-primary");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.fieldError = page.locator(".invalid-feedback");
  }

  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/content/block/${id}/edit`;
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }
  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  /** 一覧の主要部品が仕様どおり表示されること（新規作成・検索・2列見出し）。 */
  async seeListUi() {
    await expect(this.newLink.first()).toBeVisible();
    await expect(this.searchBox).toBeVisible();
    await expect(this.page.locator("body")).toContainText("ブロック名");
    await expect(this.page.locator("body")).toContainText("ファイル名");
  }

  /**
   * 新規作成・編集フォームの主要入力欄が表示されること（仕様: ブロック名・ファイル名・ブロックデータ・登録ボタン）。
   * ブロックデータ欄は設計書では入力項目だが、実装はhidden textarea(#block_block_html)＋ACEエディタ(#editor)＝不具合候補#4。
   * UI形態(textarea/ACE)を断定せずフォーム内にブロックデータ欄が存在すること（toBeAttached）で仕様の入力項目有無を判定する。
   */
  async seeFormUi() {
    await expect(this.name).toBeVisible();
    await expect(this.fileName).toBeVisible();
    await expect(this.blockHtmlHidden).toBeAttached(); // ブロックデータ欄（設計書の入力項目）。表示形態は不具合候補#4で別途検出
    await expect(this.registerButton).toBeVisible();
  }

  /**
   * ブロック名・ファイル名を入力する。ブロックデータ(ACEエディタ)はDOM操作が要実機確認のため、
   * ここでは hidden textarea へ直接値を流し込む（実機ではACEのonsubmit同期に依存。要実機確認）。
   */
  async fillAttributes(name: string, fileName: string, blockHtml = "") {
    await this.name.fill(name);
    await this.fileName.fill(fileName);
    if (blockHtml) {
      // 要実機確認: ACEエディタ(#editor)→#block_block_html の同期。雛形では hidden に直接設定する。
      await this.blockHtmlHidden.evaluate((el, v) => {
        (el as HTMLTextAreaElement).value = v;
      }, blockHtml);
    }
  }

  async submit() {
    await this.registerButton.click();
  }
}
