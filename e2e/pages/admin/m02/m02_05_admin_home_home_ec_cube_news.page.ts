import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面ホーム「EC-CUBEお知らせ」カード Page Object（read-only iframe カード）。
 * 構造参考: ec-cube-enterprise/e2e-tests の既存 Page Object。本ファイルは設計書+Twig由来の未実行雛形。
 *
 * 期待結果は仕様(m02-05_admin_home_home_ec_cube_news.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig（src/Eccube/Resource/template/admin/index.twig）由来の位置情報のみ。
 * 本カードは Symfony Form を持たないため DOM id 由来のフォーム要素は存在しない。
 *
 * セレクタ根拠（index.twig 行番号は現行ソース基準）:
 *  - カード本体        #ec-cube-news                         （index.twig:304）
 *  - カード見出し      #ec-cube-news .card-title             （index.twig:307 trans `admin.home.news_title` / messages.ja.yaml:1698=「お知らせ」）
 *  - カード本体領域    #ec-cube-news .card-body              （index.twig:310 余白なし p-0）
 *  - 情報iframe        #ec-cube-news iframe[name="information"]（index.twig:311 src={{ eccube_config.eccube_info_url }}）
 *  - カードフッタ      #ec-cube-news .card-footer            （index.twig:313 固定高さの空領域）
 *  - eccube_info_url 既定値 https://www.ec-cube.net/info/4/  （app/config/eccube/packages/eccube.yaml:146・環境別設定で上書き可）
 */
export class AdminHomeHomeEcCubeNewsPage {
  readonly page: Page;
  readonly homeUrl: string; // ホーム画面（実装確認値 GET /<admin>/）

  readonly newsCard: Locator; // #ec-cube-news
  readonly cardTitle: Locator; // 見出し（翻訳キー admin.home.news_title）
  readonly cardBody: Locator; // 本体（iframe敷き詰め）
  readonly cardFooter: Locator; // フッタ（固定高さ空領域）
  readonly infoIframe: Locator; // 情報iframe name="information"

  constructor(page: Page) {
    this.page = page;
    this.homeUrl = `/${ECCUBE_ADMIN_ROUTE}/`;

    this.newsCard = page.locator("#ec-cube-news");
    this.cardTitle = this.newsCard.locator(".card-title");
    this.cardBody = this.newsCard.locator(".card-body");
    this.cardFooter = this.newsCard.locator(".card-footer");
    this.infoIframe = this.newsCard.locator('iframe[name="information"]');
  }

  async goto() {
    await this.page.goto(this.homeUrl);
  }

  /** 情報iframe の src 属性値（設定 eccube_info_url の出力）を取得する。 */
  async getInfoIframeSrc(): Promise<string | null> {
    return await this.infoIframe.getAttribute("src");
  }

  /** お知らせカードが表示されること（E2E-M02-05-001）。 */
  async seeCard() {
    await expect(this.newsCard).toBeVisible();
  }

  /** カード見出しが翻訳キー由来のタイトルで表示されること（E2E-M02-05-002）。
   * 値はロケール依存のため、既定ロケール ja-JP の文言「お知らせ」で判定する（messages.ja.yaml:1698）。 */
  async seeCardTitle(expected = "お知らせ") {
    await expect(this.cardTitle).toContainText(expected);
  }

  /** 情報iframe（name=information）が表示されること（E2E-M02-05-003）。 */
  async seeInfoIframe() {
    await expect(this.infoIframe).toBeVisible();
  }

  /** カード本体・フッタ領域が描画されること（E2E-M02-05-005）。 */
  async seeLayout() {
    await expect(this.cardBody).toBeVisible();
    await expect(this.cardFooter).toBeAttached();
  }
}
