import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「低価格帯カード価格変更CSV出力」Page Object（csv_export 画面）。
 * 納品ケース表 integration_test/e2e/m03_43_admin_product_product_simple_low_price_csv_export_e2e_cases.md に対応。
 *
 * 【重要・screenExists=false】刷新先 ec-cube-enterprise に本機能（低価格帯カード価格変更CSV出力）の
 *  専用ボタン・ルート・コントローラは存在しない（基本設計 注記「B6 Ph2で対応」のフェーズ2新規実装）。
 *  - 商品一覧 form_bulk の出力ボタンは カード/商品/セール用価格/一括買取価格 のみ（index.twig:468-477）。低価格帯出力ボタンは無い。
 *  - src/Eccube/Controller/Admin/Product/Csv/ に low_price/simple_low の出力コントローラ無し。
 *  - 基本設計が「ベース」とする ProductStandardPriceCsvController.php は取込専用（csv_template:60 / csv_upload:77 / import:120）でエクスポート無し。
 *  - messages.ja.yaml に simple_low_price / low_price_csv の翻訳キー無し。
 * よって本Page Objectの URL・セレクタは、既存の同系出力（セール用価格CSV出力）が使う商品一覧 form_bulk と同じ位置に
 *  低価格帯出力ボタンが「再実装された場合」の推定位置を参考として記すが、刷新先に該当DOM・ルートが無いため全て要実機確認。
 *  **創作セレクタは置かない**。
 *
 * 期待結果は仕様(基本設計 functions/ec-cube-enterprise/m03-43_admin_product_product_simple_low_price_csv_export.md /
 *  原典 Excel M03-44 CSVフォーマット)由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *  CSVの中身（9列・計算式※1の新価格・現行価格参考列・原価単価）は手動確認とする。
 *
 * 参考セレクタ（商品一覧 src/Eccube/Resource/template/admin/Product/index.twig。低価格帯出力ボタンは未存在＝要実機確認）:
 *  - 一括フォーム: form#form_bulk（index.twig:465。method=POST・action=""、formaction で各エクスポート先を切替）
 *  - 出力ボタン: form_bulk 内 button[type=submit][formaction=url('admin_product_simple_low_price_csv_export')]（推定。既存は index.twig:468-477）
 *  - 商品チェックボックス: input[name="ids[]"] id=check_{Product.id}（index.twig:585）
 *  - 全選択チェックボックス: #trigger_check_all（index.twig:552）
 *  - フラッシュ: .alert-danger（未選択 admin.product.not_select=「1つ以上の商品を選択してください」messages.ja.yaml:1769）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductSimpleLowPriceCsvExportPage {
  readonly page: Page;
  readonly productListUrl: string; // 商品一覧（admin_product = /<route>/product。一覧自体は実在）
  readonly exportUrl: string; // 出力ルート（設計推定 admin_product_simple_low_price_csv_export。刷新先未存在＝要実機確認）

  readonly bulkForm: Locator; // form#form_bulk（index.twig:465）
  readonly exportButton: Locator; // 「低価格帯カード価格変更CSV出力」submit（推定。刷新先未存在＝要実機確認）
  readonly idCheckboxes: Locator; // input[name="ids[]"]（index.twig:585）
  readonly checkAll: Locator; // #trigger_check_all（index.twig:552）
  readonly dangerAlert: Locator; // フラッシュ .alert-danger

  constructor(page: Page) {
    this.page = page;
    this.productListUrl = `/${ECCUBE_ADMIN_ROUTE}/product`;
    // 【非正典・未確定プレースホルダ（要実機確認）】刷新先 ec-cube-enterprise に低価格帯出力ルートは未存在のため、
    // この出力ルート名は正典(実装ルート)由来の確定値ではなく、test.fixme 雛形をコンパイル可能にするための仮値にすぎない。
    // 期待結果(オラクル)には一切用いず、Ph2実装・移行方針確定後の実機確認で実ルートに置き換える（不具合候補#1）。
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/product/simple_low_price_csv_export`;

    this.bulkForm = page.locator("#form_bulk");
    // 【非正典・未確定プレースホルダ（要実機確認）】formaction 末尾一致セレクタも実装に該当ボタンが無いため確定セレクタではない。
    // 正典由来の確定セレクタは創作しない方針に従い、本値は実機確認で実 formaction に置き換える前提の仮セレクタ。
    this.exportButton = page.locator(
      '#form_bulk button[type="submit"][formaction*="simple_low_price_csv_export"]'
    );
    this.idCheckboxes = page.locator('#form_bulk input[name="ids[]"]');
    this.checkAll = page.locator("#trigger_check_all");
    this.dangerAlert = page.locator(".alert-danger");
  }

  async gotoProductList() {
    await this.page.goto(this.productListUrl);
  }

  /** 一覧に存在する商品チェックボックス数（検索ヒット件数の代理。0 ならシード不足）。 */
  async productCount(): Promise<number> {
    return this.idCheckboxes.count();
  }

  /** 先頭商品のチェックボックス value(=商品ID)。一覧に商品が無ければ null。 */
  async firstProductId(): Promise<string | null> {
    if ((await this.idCheckboxes.count()) === 0) {
      return null;
    }
    return this.idCheckboxes.first().getAttribute("value");
  }

  /** 先頭商品を1件チェックする。 */
  async checkFirstProduct() {
    await this.idCheckboxes.first().check();
  }

  /**
   * チェック済み商品で「低価格帯カード価格変更CSV出力」を押し、ダウンロード発火を待つ。
   * type=submit のため form_bulk が POST され、StreamedResponse が添付ダウンロードされる想定（要実機確認・刷新先未存在）。
   */
  async exportAndWaitDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.exportButton.click(),
    ]);
    return download;
  }

  /** チェックせずに出力ボタンを押す（未選択エラー経路の発火）。 */
  async clickExportWithoutSelection() {
    await this.exportButton.click();
  }

  /** 出力ボタンが仕様どおり表示されること（検索結果が正のとき）。要実機確認(刷新先未存在)。 */
  async seeExportButton() {
    await expect(this.exportButton).toBeVisible();
    // 期待文言は基本設計の機能名（低価格帯カード価格変更CSV出力）由来。刷新先に該当 trans キーは未存在＝要実機確認。
    await expect(this.exportButton).toContainText("低価格帯カード価格変更CSV出力");
  }
}
