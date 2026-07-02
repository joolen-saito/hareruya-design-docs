import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/** Playwright setInputFiles のインメモリ添付（実ファイルパスの代替）。 */
type FilePayload = { name: string; mimeType: string; buffer: Buffer };

/**
 * 管理画面 コンテンツ管理「ファイル管理」Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m09_02_admin_content_content_file_e2e_cases.md に対応。
 * 期待結果は仕様(functions/ec-cube-enterprise/m09-02_admin_content_content_file.md / 設計書「表示メッセージ」)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/Regex)・i18n文言は期待値に流用しない。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ（src/Eccube/Resource/template/admin/Content/file.twig）。
 *
 * DOM id 根拠（FileController.php:72-80 で createBuilder(FormType::class) で生成）:
 *  Symfony の createBuilder(FormType::class) はルート名＝FormType の block prefix「form」を採るため、
 *  子フィールドの DOM id/name には接頭辞 form_ が付く（無名ルートではない）。
 *  - file(FileType, multiple)  → #form_file（file.twig:137 form_widget(form.file) / name=form[file][]）
 *  - create_file(TextType)     → #form_create_file（file.twig:149 placeholder admin.content.file.directory_name=「フォルダ名」）
 *  - _token                    → #form__token（file.twig:124）
 *  ※ 実機 DOM 未照合のため id 接頭辞は要実機確認（付帯表4#3）。
 * その他セレクタ根拠は各 Locator のコメント参照。
 *
 * 操作（アップロード/作成/移動/削除）は <a> 要素 + file_manager.js による mode 設定→form1 送信で行われる。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 */
export class ContentContentFilePage {
  readonly page: Page;
  readonly url: string;
  readonly viewUrl: string;
  readonly downloadUrl: string;

  // 追加カード（file.twig:130-161）
  readonly addCardTitle: Locator; // 「ファイル・フォルダを追加」(file.twig:131 admin.content.file.add_file__card_title)
  readonly fileInput: Locator; // #form_file（file.twig:137 form.file multiple / name=form[file][]）
  readonly uploadButton: Locator; // a.action-upload.js-upload-trigger（file.twig:140 admin.common.upload）
  readonly createFileInput: Locator; // #form_create_file（file.twig:149 placeholder「フォルダ名」）
  readonly createButton: Locator; // a.action-create.js-create-dir（file.twig:152 admin.common.create__new）
  readonly errors: Locator; // p.text-danger.errormsg（file.twig:157-158 errors ループ）

  // 一覧・ツリー・パンくず
  readonly breadcrumb: Locator; // #bread（file.twig:128 ol.breadcrumb・JS描画）
  readonly fileListCardTitle: Locator; // 「このフォルダ内のファイル」(file.twig:169)
  readonly directoryTree: Locator; // #directory_userdata（file.twig:325）
  readonly directoryTreeCardTitle: Locator; // 「フォルダ構成」(file.twig:318)
  readonly fileRows: Locator; // table.table tbody tr（file.twig:176-307）

  // 行内操作（file.twig:208-302）
  readonly folderMoveLinks: Locator; // a.js-dir-move（file.twig:208 data-mode=move）
  readonly copyButtons: Locator; // a.action-copy（file.twig:260）
  readonly copyPathInputs: Locator; // .copy-file-path input（file.twig:221、初期 display:none）
  readonly viewLinks: Locator; // a.action-view[target=_blank]（file.twig:265 admin_content_file_view）
  readonly downloadLinks: Locator; // a.action-download（file.twig:270 admin_content_file_download）
  readonly deleteButtons: Locator; // a.action-delete（file.twig:229 フォルダ / file.twig:276 ファイル）
  readonly disabledFolderDeleteButtons: Locator; // a.action-delete.disabled（file.twig:229 非空フォルダ）

  // 削除モーダル（file.twig:233-299）
  readonly modalConfirmDelete: Locator; // a.btn-ec-delete[data-method=delete]（file.twig:246/293）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/content/file_manager`;
    this.viewUrl = `/${ECCUBE_ADMIN_ROUTE}/content/file_view`;
    this.downloadUrl = `/${ECCUBE_ADMIN_ROUTE}/content/file_download`;

    this.addCardTitle = page.locator(".card-title", {
      hasText: "ファイル・フォルダを追加",
    });
    this.fileInput = page.locator("#form_file");
    this.uploadButton = page.locator("a.action-upload");
    this.createFileInput = page.locator("#form_create_file");
    this.createButton = page.locator("a.action-create");
    this.errors = page.locator("p.text-danger.errormsg");

    this.breadcrumb = page.locator("#bread");
    this.fileListCardTitle = page.locator(".card-title", {
      hasText: "このフォルダ内のファイル",
    });
    this.directoryTree = page.locator("#directory_userdata");
    this.directoryTreeCardTitle = page.locator(".card-title", {
      hasText: "フォルダ構成",
    });
    this.fileRows = page.locator("table.table tbody tr");

    this.folderMoveLinks = page.locator("a.js-dir-move");
    this.copyButtons = page.locator("a.action-copy");
    this.copyPathInputs = page.locator(".copy-file-path input");
    this.viewLinks = page.locator("a.action-view");
    this.downloadLinks = page.locator("a.action-download");
    this.deleteButtons = page.locator("a.action-delete");
    this.disabledFolderDeleteButtons = page.locator("a.action-delete.disabled");

    this.modalConfirmDelete = page.locator("a.btn-ec-delete[data-method='delete']");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 追加カード・一覧カード・ツリー・パンくずの主要部品が表示されること（仕様：フロント挙動「表示要素」）。 */
  async seeMainLayout() {
    await expect(this.addCardTitle).toBeVisible();
    await expect(this.fileListCardTitle).toBeVisible();
    await expect(this.directoryTreeCardTitle).toBeVisible();
  }

  /** フォルダ名を入力して作成ボタンを押下（mode=create で form1 送信）。 */
  async createFolder(name: string) {
    await this.createFileInput.fill(name);
    await this.createButton.click();
  }

  /** ファイルを選択してアップロードボタンを押下（mode=upload で form1 送信）。 */
  async uploadFiles(files: string | string[] | FilePayload | FilePayload[]) {
    await this.fileInput.setInputFiles(files);
    await this.uploadButton.click();
  }

  /** アップロードのみ実行（未選択のまま送信＝必須検証）。 */
  async clickUpload() {
    await this.uploadButton.click();
  }

  /** 一覧のエラー領域に指定文言が表示されること（合否は設計書「表示メッセージ」由来）。 */
  async seeError(text: string) {
    await expect(this.errors.filter({ hasText: text })).toBeVisible();
  }
}
