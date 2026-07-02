import { APIResponse, Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「グッズ商品CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m03_04_admin_product_product_goods_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-04_admin_product_product_goods_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。本機能は商品一覧 form_bulk からの POST CSV 出力であり、CSVの中身（列・行・規格展開・
 * カンマ連結）は手動確認とする。自動化はダウンロード発火・ファイル名・Content-Type/Disposition・リダイレクト・
 * フラッシュ・UI部品・権限ガードに限る。実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Product/index.twig）:
 *  - 一括フォーム: form#form_bulk method=POST action=""（index.twig:465。pagination.totalItemCount>0 のときのみ描画 index.twig:464）
 *  - 出力ボタン: type=submit formaction=url('admin_product_goods_csv_export') span trans admin.product.goods_csv_export=「グッズ商品CSV出力」（index.twig:471-473 / messages.ja.yaml:2046）
 *  - 行チェックボックス: input[name="ids[]"] id="check_{Product.id}"（index.twig:585）
 *  - 全選択チェック: #trigger_check_all（index.twig:552、JS index.twig:131-）
 *  - フラッシュ: .alert.alert-danger（admin/alert.twig eccube.admin.error ループ）
 *
 * ルート（src/Eccube/Controller）:
 *  - 商品一覧 admin_product = GET/POST /<route>/product（ProductController.php:122）
 *  - 一覧ページ admin_product_page = /<route>/product/page/{page_no}（ProductController.php:123）
 *  - グッズ商品CSV出力 admin_product_goods_csv_export = POST /<route>/product/product_goods_csv_export（ProductCsvController.php:109）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductGoodsCsvExportPage {
  readonly page: Page;
  readonly productListUrl: string; // 商品一覧（admin_product）
  readonly exportUrl: string; // グッズ商品CSV出力 POST ルート

  readonly bulkForm: Locator; // #form_bulk（index.twig:465）
  readonly goodsCsvButton: Locator; // 「グッズ商品CSV出力」submit（index.twig:471-473）
  readonly rowCheckboxes: Locator; // input[name="ids[]"]（index.twig:585）
  readonly triggerCheckAll: Locator; // #trigger_check_all（index.twig:552）
  readonly errorAlert: Locator; // フラッシュ表示領域。文言で合否判定する
  readonly searchForm: Locator; // #search_form
  readonly searchKeyword: Locator; // #admin_search_product_product_name
  readonly searchSubmit: Locator; // .admin-product-search-submit（index.twig:445）
  readonly noResult: Locator; // 検索0件メッセージ（index.twig:824 admin.common.search_no_result）

  constructor(page: Page) {
    this.page = page;
    this.productListUrl = `/${ECCUBE_ADMIN_ROUTE}/product`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/product/product_goods_csv_export`;

    this.bulkForm = page.locator("#form_bulk");
    // 文言は messages.ja.yaml:2046（admin.product.goods_csv_export）。trans キー由来。
    this.goodsCsvButton = page.getByRole("button", { name: "グッズ商品CSV出力" });
    this.rowCheckboxes = page.locator('#form_bulk input[name="ids[]"]');
    this.triggerCheckAll = page.locator("#trigger_check_all");
    // 位置情報は alert.twig の alert-danger 系。eccube.admin.error/danger いずれにも一致し得るため、
    // セレクタ単独では特定せず、合否は仕様文言（messages.ja.yaml）で判定する。
    this.errorAlert = page.locator(".alert.alert-danger");
    this.searchForm = page.locator("#search_form");
    this.searchKeyword = page.locator("#admin_search_product_product_name");
    this.searchSubmit = page.locator(".admin-product-search-submit");
    // 文言は messages.ja.yaml:1542（admin.common.search_no_result）。trans キー由来。
    this.noResult = page.getByText("検索条件に合致するデータが見つかりませんでした");
  }

  async gotoProductList() {
    await this.page.goto(this.productListUrl);
  }

  /** 一致しないキーワードで検索し、結果0件状態（一覧ブロック非描画）にする。 */
  async searchNoResult(keyword: string) {
    await this.searchKeyword.fill(keyword);
    await this.searchSubmit.click();
  }

  /** 指定IDの商品行チェックボックス（#check_{id}）。 */
  checkbox(productId: number | string): Locator {
    return this.page.locator(`#check_${productId}`);
  }

  /** 指定IDの商品をチェックする。 */
  async selectProduct(productId: number | string) {
    await this.checkbox(productId).check();
  }

  /** 一覧に出力ボタンが仕様どおり表示されること（検索結果件数が正のとき）。 */
  async seeGoodsButton() {
    await expect(this.goodsCsvButton).toBeVisible();
  }

  /** 出力ボタンを押下する（選択状態に応じてダウンロードまたはリダイレクト）。 */
  async clickExport() {
    await this.goodsCsvButton.click();
  }

  /** 商品を選択して出力ボタンを押下し、ダウンロード発火を待つ。 */
  async exportAndWaitDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.goodsCsvButton.click(),
    ]);
    return download;
  }

  /**
   * 認証済みコンテキストから出力ルートへ直接 POST する（ids[] 配列を任意指定）。
   * Content-Type/Disposition やリダイレクト挙動の観測に用いる。出力 submit はトークン入力欄を
   * 持たない位置情報のためここでは付与しない（CSRF 保護の有無はケース表 不具合候補#2 で要確認）。
   */
  async postExport(ids: Array<number | string>): Promise<APIResponse> {
    const body = ids.map((id) => `ids%5B%5D=${encodeURIComponent(String(id))}`).join("&");
    return this.postExportRaw(body);
  }

  /**
   * 出力ルートへ任意の生ボディ・追加ヘッダで直接 POST する。
   * 非配列 `ids`（設計「配列でない場合は空配列とみなす」処理フロー#2）や Referer 付与
   *（設計「Referer があればその URL へリダイレクトする」実行時例外処理）の観測に用いる。
   */
  async postExportRaw(
    body: string,
    extraHeaders: Record<string, string> = {}
  ): Promise<APIResponse> {
    return this.page.context().request.post(this.exportUrl, {
      headers: { "content-type": "application/x-www-form-urlencoded", ...extraHeaders },
      data: body,
      maxRedirects: 0, // リダイレクト応答（302）をそのまま観測する
    });
  }
}
