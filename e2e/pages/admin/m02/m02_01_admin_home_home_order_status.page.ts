import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面ホーム「受注状況（注文状況）」カード Page Object。
 * 納品ケース表 integration_test/e2e/m02_01_admin_home_home_order_status_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m02-01_admin_home_home_order_status.md / messages.ja.yaml)由来
 * （オラクル独立性）。セレクタは Twig 由来の位置情報のみ:
 *  - カード根: #order-status（admin/index.twig:121）
 *  - カード見出しリンク → url('admin_order')（index.twig:123、受注一覧へ・ステータス条件なし）
 *  - カード見出し文言「注文状況」trans admin.home.order_status_title（index.twig:124 / messages.ja.yaml:1681）
 *  - ステータス行リンク → url('admin_order', {order_status_id: OrderStatus.id})（index.twig:130）
 *  - 行内ステータス名 {{ OrderStatus.name }}（index.twig:133）
 *  - 行内件数 {{ Orders[...] ?? 0 }}（index.twig:136、.h4）
 * 本ブロックはフォーム/入力欄/モーダルを持たない（index.twig:127-142・design「フロント挙動」）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class HomeHomeOrderStatusPage {
  readonly page: Page;
  readonly homeUrl: string; // 管理ホーム（admin_homepage = /<route>/）
  readonly orderListUrl: string; // 受注一覧（admin_order = /<route>/order）

  readonly card: Locator; // #order-status（index.twig:121）
  readonly headingLink: Locator; // カード見出しリンク → admin_order（index.twig:123）
  readonly cardTitle: Locator; // .card-title「注文状況」（index.twig:124）
  readonly statusRowLinks: Locator; // 各ステータス行のリンク（index.twig:130）
  readonly counts: Locator; // 行内件数 .h4（index.twig:136）

  constructor(page: Page) {
    this.page = page;
    this.homeUrl = `/${ECCUBE_ADMIN_ROUTE}/`;
    this.orderListUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;

    this.card = page.locator("#order-status");
    this.headingLink = this.card.locator(".card-header a");
    this.cardTitle = this.card.locator(".card-title");
    // card-body 直下の各行リンク（href に order_status_id を載せる）
    this.statusRowLinks = this.card.locator(".card-body a");
    this.counts = this.card.locator(".card-body .h4");
  }

  async gotoHome() {
    await this.page.goto(this.homeUrl);
  }

  /** ステータス名で行リンクを取得（index.twig:133 の {{ OrderStatus.name }}）。 */
  rowByName(name: string): Locator {
    return this.statusRowLinks.filter({ hasText: name });
  }

  /** カード見出し「注文状況」を押下して受注一覧へ遷移する（ステータス条件なし）。 */
  async clickHeading() {
    await this.headingLink.click();
  }

  /** 受注状況カードの基本UI部品が仕様どおり表示されること。 */
  async seeCard() {
    await expect(this.card).toBeVisible();
    await expect(this.cardTitle).toContainText("注文状況"); // messages.ja.yaml:1681
    // 少なくとも1つ以上のステータス行が表示される（除外を通過したマスタ行）。
    await expect(this.statusRowLinks.first()).toBeVisible();
  }
}
