import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「セール用価格変更CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m03_05_admin_product_product_sale_price_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-05_admin_product_product_sale_price_csv_export.md /
 * ProductCsvController.php / ProductPriceCsv.php / messages.ja.yaml)由来（オラクル独立性）。
 * 本機能は商品一覧の一括フォーム(form_bulk)からの POST ダウンロードであり、CSVの中身（列・値・行複製・
 * タグ連結・セールフラグ0|1）は手動確認とする。自動化はダウンロード発火・ファイル名・HTTP応答・UI部品・
 * 未選択/存在しないIDのエラー遷移に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Product/index.twig）:
 *  - 一括フォーム: form#form_bulk（index.twig:465。method=POST・action=""、formaction で各エクスポート先を切替）
 *  - 出力ボタン: form_bulk 内 button[type=submit][formaction=url('admin_product_price_csv_export')]（index.twig:474）
 *  - ボタン文言: trans admin.product.sale_price_csv_export=「セール用価格変更CSV出力」（index.twig:475 / messages.ja.yaml:2047）
 *  - 商品チェックボックス: input[name="ids[]"] id=check_{Product.id}（index.twig:585）
 *  - 全選択チェックボックス: #trigger_check_all（index.twig:552。JSで check_ 始まりを一括ON/OFF index.twig:131-138）
 *  - 出力ボタン行・チェックボックスは pagination.totalItemCount>0 のときのみ描画（index.twig:464）
 *
 * ルート（src/Eccube/Controller）:
 *  - 商品一覧 admin_product = /<route>/product（ProductController.php:122）
 *  - 出力 admin_product_price_csv_export = POST /<route>/product/product_price_csv_export（ProductCsvController.php:164）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductSalePriceCsvExportPage {
  readonly page: Page;
  readonly productListUrl: string; // 商品一覧（admin_product）
  readonly exportUrl: string; // POST 出力ルート（admin_product_price_csv_export）

  readonly bulkForm: Locator; // form#form_bulk（index.twig:465）
  readonly priceExportButton: Locator; // 「セール用価格変更CSV出力」submit（index.twig:474-476）
  readonly idCheckboxes: Locator; // input[name="ids[]"]（index.twig:585）
  readonly checkAll: Locator; // #trigger_check_all（index.twig:552）
  readonly dangerAlert: Locator; // フラッシュ .alert-danger（admin/alert.twig:42 / default_frame.twig:200）

  constructor(page: Page) {
    this.page = page;
    this.productListUrl = `/${ECCUBE_ADMIN_ROUTE}/product`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/product/product_price_csv_export`;

    this.bulkForm = page.locator("#form_bulk");
    // formaction はフルURL url('admin_product_price_csv_export')。位置情報として末尾一致で特定する。
    this.priceExportButton = page.locator(
      '#form_bulk button[type="submit"][formaction*="product_price_csv_export"]'
    );
    this.idCheckboxes = page.locator('#form_bulk input[name="ids[]"]');
    this.checkAll = page.locator("#trigger_check_all");
    // 管理フレームのフラッシュは eccube.admin.* のみ alert.twig で描画される（.alert-danger）。
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
   * チェック済み商品で「セール用価格変更CSV出力」を押し、ダウンロード発火を待つ。
   * type=submit のため form_bulk が POST され、StreamedResponse が添付ダウンロードされる。
   */
  async exportAndWaitDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.priceExportButton.click(),
    ]);
    return download;
  }

  /** チェックせずに出力ボタンを押す（未選択エラー経路の発火）。 */
  async clickExportWithoutSelection() {
    await this.priceExportButton.click();
  }

  /**
   * #form_bulk に hidden な ids[] を追加する（無効ID・混在IDの検証用）。
   * 実在IDを創作せず、文字列/0/負数や巨大な未使用IDを与えるために用いる。
   */
  async addRawIds(ids: Array<string | number>) {
    await this.page.evaluate((vals) => {
      const f = document.querySelector("#form_bulk");
      if (!f) return;
      for (const v of vals) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "ids[]";
        input.value = String(v);
        f.appendChild(input);
      }
    }, ids);
  }

  /** #form_bulk を出力ルートへ submit する（ダウンロードを伴わないエラー遷移経路用）。 */
  async submitExportForm() {
    await this.page.evaluate((url) => {
      const f = document.querySelector<HTMLFormElement>("#form_bulk");
      if (!f) return;
      f.setAttribute("action", url);
      f.submit();
    }, this.exportUrl);
  }

  /** 出力ボタンが仕様どおり表示されること（検索結果が正のとき）。 */
  async seeExportButton() {
    await expect(this.priceExportButton).toBeVisible();
    // 文言は trans admin.product.sale_price_csv_export（messages.ja.yaml:2047）。
    await expect(this.priceExportButton).toContainText("セール用価格変更CSV出力");
  }
}
