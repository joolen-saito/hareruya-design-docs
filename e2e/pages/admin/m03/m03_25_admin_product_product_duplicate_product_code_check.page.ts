import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理「重複商品コード確認」Page Object（前ページ / 結果ページ の2画面・参照専用）。
 * 期待結果は仕様(functions/pf-eccube3/m03-25_admin_product_product_duplicate_product_code_check.md ＋ 観点表)由来（オラクル独立性）。
 * 画面文言の根拠は設計書 functions md（下記の md:行）に明記された値とし、実装側 messages.ja.yaml / Twig の現挙動を期待値に流用しない。
 * messages.ja.yaml のトランスキーは「実装DOM特定の参照情報」であってオラクルではない。
 * セレクタは実ソース（Twig/default_frame）由来の位置情報のみ。確定できないものは「要実機確認」と明示し創作しない。
 * 本機能は入力フォーム・バリデーション・DB更新を持たない GET 参照系。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 文言の仕様根拠（オラクル）:
 *  - 前ページ sub_title「重複商品コード確認」（functions md:44）／本文の単一プライマリボタン「重複確認する」（functions md:44,57）
 *  - 結果ページ sub_title「重複商品コード」（functions md:44）
 *  - 重複なしメッセージ「重複している商品コードはありません。」（functions md:44）
 *  - ナビラベル「重複コード確認」（functions md:5,34）
 *
 * DOM/構造 根拠（ec-cube-enterprise 現行ソース、nl -ba 基準。トランスキーは実装参照でオラクルではない）:
 *  - 前ページ route admin_product_pre_doubling_check（ProductController.php:1253）
 *  - 結果ページ route admin_product_doubling_check（ProductController.php:1265）
 *  - 「重複確認する」リンク（pre_doubling_check.twig:25 / 実装キー admin.product.doubling_check_execute）
 *  - 共通フレーム サイドナビ領域 .c-mainNavArea（admin/default_frame.twig:189）／sub_title 出力先 .c-pageTitle__subTitle（同:196）
 *  - 重複一覧テーブル table.table-striped（doubling_check.twig:27）／コードリンク td a target=_blank rel=noopener（doubling_check.twig:33）
 *  - 重複なしメッセージ出力（doubling_check.twig:47 / 実装キー admin.product.no_doubling_code）
 *  - ナビ「重複コード確認」（eccube_nav.yaml:34-36 url=admin_product_pre_doubling_check / 実装キー admin.product.duplicate_code）
 *  - リンク先 規格編集 route admin_product_product_class_edit …/product/product/class/{id}/edit/{productClassId}（ProductController.php:1283）
 */
export class ProductProductDuplicateProductCodeCheckPage {
  readonly page: Page;
  readonly preUrl: string; // 前ページ（説明用中間ページ）
  readonly resultUrl: string; // 結果ページ（重複検索の表示）

  readonly executeLink: Locator; // 前ページ「重複確認する」リンク（pre_doubling_check.twig:25）
  readonly resultTable: Locator; // 結果ページ 重複一覧 table.table-striped（doubling_check.twig:27）
  readonly resultRows: Locator; // 一覧行 tbody tr（doubling_check.twig:31）
  readonly codeLinks: Locator; // コードのリンク td a（doubling_check.twig:33）
  readonly navLink: Locator; // サイドナビ「重複コード確認」（eccube_nav.yaml:34-36。サイドバー展開は要実機確認）
  readonly commonNavArea: Locator; // 共通フレーム サイドナビ領域 .c-mainNavArea（admin/default_frame.twig:189）
  // 前ページ sub_title「重複商品コード確認」/ 結果ページ sub_title「重複商品コード」/「重複なし」文言は
  // default_frame の sub_title ブロック等の出力先クラスが要実機確認のため専用セレクタを創作せず、spec ではテキスト存在で確認する。

  constructor(page: Page) {
    this.page = page;
    this.preUrl = `/${ECCUBE_ADMIN_ROUTE}/product/pre_doubling_check`;
    this.resultUrl = `/${ECCUBE_ADMIN_ROUTE}/product/doubling_check`;

    this.executeLink = page.getByRole("link", { name: "重複確認する" });
    this.resultTable = page.locator("table.table-striped");
    this.resultRows = page.locator("table.table-striped tbody tr");
    this.codeLinks = page.locator("table.table-striped td a");
    this.navLink = page.getByRole("link", { name: "重複コード確認" });
    this.commonNavArea = page.locator(".c-mainNavArea");
  }

  async gotoPre() {
    return this.page.goto(this.preUrl);
  }
  async gotoResult() {
    return this.page.goto(this.resultUrl);
  }

  /** 前ページのUI部品（sub_title・「重複確認する」リンク）が仕様どおり表示されること。 */
  async seePreForm() {
    await expect(this.page.locator("body")).toContainText("重複商品コード確認"); // sub_title（pre_doubling_check.twig:16）
    await expect(this.executeLink).toBeVisible();
  }

  /** 結果ページのサブタイトル「重複商品コード」が表示されること（functions md:44。前ページ sub_title「重複商品コード確認」とは別文言）。 */
  async seeResultSubTitle() {
    // sub_title 出力先クラスは要実機確認のため body 文言で確認（オラクルは設計書 functions md:44 由来）。
    await expect(this.page.locator("body")).toContainText("重複商品コード");
  }

  /** 重複なしメッセージが表示され、一覧テーブルが出ないこと。 */
  async seeNoDoublingMessage() {
    await expect(this.page.locator("body")).toContainText(
      "重複している商品コードはありません。"
    ); // doubling_check.twig:47
    await expect(this.resultTable).toHaveCount(0);
  }
}
