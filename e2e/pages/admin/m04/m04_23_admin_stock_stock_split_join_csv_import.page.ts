import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫分割結合CSV登録」Page Object。
 * 納品ケース表 integration_test/e2e/m04_23_admin_stock_stock_split_join_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-23_admin_stock_stock_split_join_csv_import.md
 *   / 基本設計仕様書(在庫管理機能 M04-23シート))由来（オラクル独立性）。実装の現挙動・Form制約(NotBlank/File)は期待値へ流用しない。
 *
 * 本機能は在庫分割結合一覧（M04-12 / route admin_stock_split_join_list = GET/POST /<route>/product/stock/split-join）の
 * 「在庫分割CSV登録」「在庫結合CSV登録」ボタンで開くモーダルからCSVをアップロードして一括登録する。
 * 取込は常に一覧へリダイレクト(PRG)し、結果メッセージ(成功/エラー)を一覧上部のフラッシュ領域に表示する。
 * 取込後のDB値・在庫増減・ステータス遷移・承認アラートメール・CSV雛形の内容(BOM/ヘッダ文字コード)は手動/間接（ケース表で管理）。
 * 自動化はモーダルUI表示・雛形ダウンロード発火/応答ヘッダ・取込結果メッセージ(エラー/成功)・CSRF・未認証ガード・JSON応答に限る。
 *
 * セレクタは Twig 由来の位置情報のみ:
 *  - 一覧テンプレート src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig
 *  - 分割モーダル本体 .../stock_split_csv_modal_body.twig（getBlockPrefix=admin_stock_split_csv_upload / StockSplitCsvUploadType.php:131）
 *  - 結合モーダル本体 .../stock_join_csv_modal_body.twig（getBlockPrefix=admin_stock_join_csv_upload / StockJoinCsvUploadType.php:112）
 *  - フラッシュ表示 .../alert.twig（success=.alert-success:22 / error=.alert-danger:42・default_frame.twig:200 include）
 *
 * ルート（StockSplitJoinController.php）:
 *  - 一覧 admin_stock_split_join_list = GET/POST /<route>/product/stock/split-join（:90）
 *  - 分割CSV登録 admin_stock_split_join_list_split_csv_import = POST .../list-split-csv-import（:222）
 *  - 結合CSV登録 admin_stock_split_join_list_join_csv_import = POST .../list-join-csv-import（:314）
 *  - 分割雛形 admin_stock_split_csv_template = GET .../split-csv-template（:180・ファイル名 stock_split_template.csv:185 / UTF-8 BOM:202）
 *  - 結合雛形 admin_stock_join_csv_template = GET .../join-csv-template（:172・ファイル名 stock_join_template.csv:177）
 *  - 承認通知先メンバー取得 admin_stock_split_join_approval_members = GET .../approval-members（:427・JsonResponse）
 *  - 雛形応答ヘッダ: Content-Type application/octet-stream（:204）/ Content-Disposition attachment; filename=...（:205）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockSplitJoinCsvImportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫分割結合一覧（CSV登録ボタン/モーダルの起点）
  readonly splitImportPath: string; // 分割CSV登録 POSTルート
  readonly joinImportPath: string; // 結合CSV登録 POSTルート
  readonly splitTemplatePath: string; // 分割CSV雛形 GETルート
  readonly joinTemplatePath: string; // 結合CSV雛形 GETルート
  readonly approvalMembersPath: string; // 承認通知先メンバー取得 GETルート

  // 一覧のモーダル起動ボタン（trans admin.stock.split_join.split_csv_register / join_csv_register）
  readonly splitRegisterButton: Locator; // index.twig:102（label messages.ja.yaml:4580=「在庫分割CSV登録」）
  readonly joinRegisterButton: Locator; // index.twig:103（label messages.ja.yaml:4581=「在庫結合CSV登録」）
  readonly splitModal: Locator; // #modalSplitCsv（index.twig:420）
  readonly joinModal: Locator; // #modalJoinCsv（index.twig:440）

  // 分割モーダル（getBlockPrefix=admin_stock_split_csv_upload）
  readonly splitForm: Locator; // #form-stock-split-csv-upload（stock_split_csv_modal_body.twig:10）
  readonly splitStore: Locator; // #admin_stock_split_csv_upload_store（store ChoiceType / Type:61）
  readonly splitInventoryEcCube: Locator; // #...inventory_category_0（value=1 EC-CUBE / Type:67）
  readonly splitApprovalDept: Locator; // #...approval_department（所属セレクト / modal_body.twig:33）
  readonly splitApprovalMembers: Locator; // #...approval_notification_target_members（modal_body.twig:39）
  readonly splitFile: Locator; // #admin_stock_split_csv_upload_import_file（modal_body.twig:51）
  readonly splitToken: Locator; // #admin_stock_split_csv_upload__token（modal_body.twig:11）
  readonly splitSubmit: Locator; // #btn-split-csv-import（modal_body.twig:58 / label admin.stock.split_join.list_csv_import_submit=「CSVから登録」:4582）
  readonly splitTemplateLink: Locator; // 分割雛形DLリンク（modal_body.twig:68）

  // 結合モーダル（getBlockPrefix=admin_stock_join_csv_upload）
  readonly joinForm: Locator; // #form-stock-join-csv-upload（stock_join_csv_modal_body.twig:9）
  readonly joinStore: Locator; // #admin_stock_join_csv_upload_store（join_modal_body Type:50）
  readonly joinInventoryEcCube: Locator; // #...inventory_category_0（value=1）
  readonly joinFile: Locator; // #admin_stock_join_csv_upload_import_file（join_modal_body.twig:27）
  readonly joinToken: Locator; // #admin_stock_join_csv_upload__token（join_modal_body.twig:10）
  readonly joinSubmit: Locator; // #btn-join-csv-import（join_modal_body.twig:33 / label「CSVから登録」）
  readonly joinTemplateLink: Locator; // 結合雛形DLリンク（join_modal_body.twig:42）

  // フラッシュ表示（alert.twig）
  readonly successAlert: Locator; // .alert-success（alert.twig:22 / addSuccess）
  readonly errorAlert: Locator; // .alert-danger（alert.twig:42 / addError）

  constructor(page: Page) {
    this.page = page;
    const base = `/${ECCUBE_ADMIN_ROUTE}/product/stock/split-join`;
    this.listUrl = base;
    this.splitImportPath = `${base}/list-split-csv-import`;
    this.joinImportPath = `${base}/list-join-csv-import`;
    this.splitTemplatePath = `${base}/split-csv-template`;
    this.joinTemplatePath = `${base}/join-csv-template`;
    this.approvalMembersPath = `${base}/approval-members`;

    this.splitRegisterButton = page.getByRole("button", { name: "在庫分割CSV登録" });
    this.joinRegisterButton = page.getByRole("button", { name: "在庫結合CSV登録" });
    this.splitModal = page.locator("#modalSplitCsv");
    this.joinModal = page.locator("#modalJoinCsv");

    this.splitForm = page.locator("#form-stock-split-csv-upload");
    this.splitStore = page.locator("#admin_stock_split_csv_upload_store");
    this.splitInventoryEcCube = page.locator(
      "#admin_stock_split_csv_upload_inventory_category_0"
    );
    this.splitApprovalDept = page.locator(
      "#admin_stock_split_csv_upload_approval_department"
    );
    this.splitApprovalMembers = page.locator(
      "#admin_stock_split_csv_upload_approval_notification_target_members"
    );
    this.splitFile = page.locator("#admin_stock_split_csv_upload_import_file");
    this.splitToken = page.locator("#admin_stock_split_csv_upload__token");
    this.splitSubmit = page.locator("#btn-split-csv-import");
    this.splitTemplateLink = page.locator(
      `a[href$="/product/stock/split-join/split-csv-template"]`
    );

    this.joinForm = page.locator("#form-stock-join-csv-upload");
    this.joinStore = page.locator("#admin_stock_join_csv_upload_store");
    this.joinInventoryEcCube = page.locator(
      "#admin_stock_join_csv_upload_inventory_category_0"
    );
    this.joinFile = page.locator("#admin_stock_join_csv_upload_import_file");
    this.joinToken = page.locator("#admin_stock_join_csv_upload__token");
    this.joinSubmit = page.locator("#btn-join-csv-import");
    this.joinTemplateLink = page.locator(
      `a[href$="/product/stock/split-join/join-csv-template"]`
    );

    this.successAlert = page.locator(".alert-success");
    this.errorAlert = page.locator(".alert-danger");
  }

  /**
   * 店舗セレクトで先頭の実選択肢（value が非空＝placeholder以外）を選ぶ。
   * 編集可能店舗(M11-03)は環境依存のため index 固定にせず、存在する実選択肢を動的に選ぶ。
   * 選択肢が無い場合は要シード/要実機確認（SEED-M04-23-ADMIN で店舗1件以上を前提）。
   */
  async selectFirstStore(store: Locator) {
    const value = await store
      .locator('option[value]:not([value=""])')
      .first()
      .getAttribute("value");
    if (value !== null) {
      await store.selectOption(value);
    }
  }

  /** 在庫分割結合一覧（CSV登録ボタン/モーダルの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 分割CSV登録モーダルを開く（Bootstrap modal が表示状態になるのを待つ）。 */
  async openSplitModal() {
    await this.splitRegisterButton.click();
    await expect(this.splitModal).toBeVisible();
  }

  /** 結合CSV登録モーダルを開く。 */
  async openJoinModal() {
    await this.joinRegisterButton.click();
    await expect(this.joinModal).toBeVisible();
  }

  /**
   * 分割CSVをアップロードして「CSVから登録」を実行する。
   * 店舗（先頭の実選択肢）と在庫区分=EC-CUBE(1) を選び、与えたCSVバイト列をファイルとして添付する。
   * content にヘッダ不正/数値不正を与えると取込エラー（全件ロールバック）を発生させられる。
   */
  async uploadSplit(filename: string, content: string) {
    await this.openSplitModal();
    await this.selectFirstStore(this.splitStore);
    await this.splitInventoryEcCube.check();
    await this.splitFile.setInputFiles({
      name: filename,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.splitSubmit.click();
  }

  /** 結合CSVをアップロードして「CSVから登録」を実行する。 */
  async uploadJoin(filename: string, content: string) {
    await this.openJoinModal();
    await this.selectFirstStore(this.joinStore);
    await this.joinInventoryEcCube.check();
    await this.joinFile.setInputFiles({
      name: filename,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.joinSubmit.click();
  }

  /** 分割CSV雛形リンクを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadSplitTemplate(): Promise<Download> {
    await this.openSplitModal();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.splitTemplateLink.click(),
    ]);
    return download;
  }

  /** 結合CSV雛形リンクを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadJoinTemplate(): Promise<Download> {
    await this.openJoinModal();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.joinTemplateLink.click(),
    ]);
    return download;
  }

  /** 一覧に分割/結合CSV登録ボタンが仕様どおり表示されること。 */
  async seeRegisterButtons() {
    await expect(this.splitRegisterButton).toBeVisible();
    await expect(this.joinRegisterButton).toBeVisible();
  }
}
