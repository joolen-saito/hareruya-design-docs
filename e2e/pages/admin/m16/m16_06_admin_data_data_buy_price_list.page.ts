import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 データ管理 > 買取価格対応表（一覧） Page Object。
 * 画面タイプ: list（NM価格 × カード状態 × 通常/Foil・プロモ版 の買取価格マトリクス・参照のみGET）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m16-06_admin_data_data_buy_price_list.md /
 * integration-test-viewpoints.md)由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * セレクタ根拠について: 対象 Twig(buy_price_list.twig) には id=blockprefix 由来の安定IDが無い。
 * そのため位置情報は class / 見出しテキスト / href の構造で代替し、各々 file:line を明示する。
 * 期待値(オラクル)には実装固有の URL 断片(/data/ 接頭辞・/edit 接尾辞)や欠けセルの「-」文言は混入させない。
 *
 * セレクタ(位置情報のみ・Twig 由来):
 *  - 一覧ナビ到達後の URL は仕様共通トークン buy_price_list で判定する。
 *    実装ルート admin_data_buy_price_list = /{admin_route}/data/buy_price_list（BuyPriceListController.php:45）。
 *    ※ 設計書(入口節)は /{admin_route}/buy_price_list で /data/ の有無が乖離→不具合候補#1。
 *      goto 用 URL は実機到達のための位置情報として実装値を用いるが、URL アサーションには /data/ を固定しない。
 *  - ページタイトル h2.c-pageTitle__title（default_frame.twig:196）= trans admin.data.buy_price_list_management（messages.ja.yaml:5840「買取価格対応表」）
 *  - サブタイトル span.c-pageTitle__subTitle（default_frame.twig:196）※設計書は「一覧」。実装は admin.data.data_management「データ管理」→不具合候補#3
 *  - 一覧テーブル table.buy-price-list-table（buy_price_list.twig:50）
 *  - 表頭 NM価格（buy_price_list.twig:53 / messages.ja.yaml:5842）
 *  - 表頭 ノーマルカード（buy_price_list.twig:54 / messages.ja.yaml:5846）
 *  - 表頭 Foil&プロモ版カード（buy_price_list.twig:55 / messages.ja.yaml:5847）
 *  - サブ表頭 カード状態コード CardCondition.code を2回繰り返し（buy_price_list.twig:58-63）
 *  - 金額セルの編集リンク a（buy_price_list.twig:73 / route admin_data_buy_price_list_edit）。
 *    仕様(画面遷移)は「セル金額→編集画面(id付き)」。href は buy_price_list/{id} の存在で判定し /edit は固定しない。
 *  - 欠け組合せ: 設計書「セル欠け」は「マスタに存在しない組み合わせはセル自体が無い」。
 *    観測は「該当組合せに買取価格(編集リンク)が表示されない」で判定する（実装の「-」文言はオラクルに用いない＝不具合候補#6）。
 *  - ナビ「データ管理」→「買取価格対応表」（eccube_nav.yaml:353-371 / nav.twig:20-55）
 */
export class DataDataBuyPriceListPage {
  readonly page: Page;
  readonly url: string;

  readonly pageTitle: Locator; // h2.c-pageTitle__title（default_frame.twig:196）
  readonly subTitle: Locator; // span.c-pageTitle__subTitle（default_frame.twig:196）
  readonly table: Locator; // table.buy-price-list-table（buy_price_list.twig:50）
  readonly priceCellLinks: Locator; // 金額セルの編集リンク（buy_price_list.twig:73）

  // ナビ（位置情報のみ。展開トグルの挙動は要実機確認）
  readonly navParent: Locator; // 「データ管理」（nav.twig / eccube_nav.yaml:354）
  readonly navChild: Locator; // 「買取価格対応表」（eccube_nav.yaml:370）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/data/buy_price_list`;

    this.pageTitle = page.locator("h2.c-pageTitle__title");
    this.subTitle = page.locator("span.c-pageTitle__subTitle");
    this.table = page.locator("table.buy-price-list-table");
    // 金額セル=編集画面へのリンク。仕様(画面遷移)で「セル金額→編集画面」。リンクの存在で判定し /edit は固定しない。
    this.priceCellLinks = this.table.locator("tbody td a");

    this.navParent = page.getByRole("link", { name: "データ管理" });
    this.navChild = page.getByRole("link", { name: "買取価格対応表" });
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** ナビ「データ管理」→「買取価格対応表」で一覧へ到達する（展開トグルは要実機確認）。 */
  async gotoViaMenu() {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
    // 親メニューが折りたたみの場合は展開してから子リンクを押下する（要実機確認）。
    if (!(await this.navChild.isVisible().catch(() => false))) {
      await this.navParent.click();
    }
    await this.navChild.click();
  }

  /** 一覧の主要UI部品（タイトル・表・表頭）が仕様どおり表示されること。 */
  async seeListPage() {
    await expect(this.pageTitle).toContainText("買取価格対応表"); // 仕様(タイトル)
    await expect(this.table).toBeVisible();
  }

  /** サブタイトルが仕様どおり「一覧」であること（設計書 フロント挙動: 表示要素）。
   *  実装は「データ管理」を表示するため現状は失敗し不具合候補#3 を検出する（実装に寄せない）。 */
  async seeSubTitle() {
    await expect(this.subTitle).toContainText("一覧"); // 仕様(フロント挙動: サブタイトル「一覧」)
  }

  /** 表頭（NM価格・ノーマルカード・Foil&プロモ版カード）が表示されること。 */
  async seeTableHeaders() {
    const head = this.table.locator("thead");
    await expect(head).toContainText("NM価格");
    await expect(head).toContainText("ノーマルカード");
    await expect(head).toContainText("Foil&プロモ版カード");
  }

  /** 金額セルが編集画面（id付き）へのリンクになっていること。
   *  仕様(画面遷移)の編集URLは buy_price_list/{id}。href は buy_price_list と数値idの存在で判定し、
   *  実装固有の /data/ 接頭辞・/edit 接尾辞はオラクルに固定しない（不具合候補#1）。 */
  async seePriceCellIsEditLink() {
    await expect(this.priceCellLinks.first()).toBeVisible();
    await expect(this.priceCellLinks.first()).toHaveAttribute("href", /buy_price_list\/\d+/);
  }

  /** 先頭の金額セルを押下して編集画面へ遷移する。 */
  async clickFirstPriceCell() {
    await this.priceCellLinks.first().click();
  }
}
