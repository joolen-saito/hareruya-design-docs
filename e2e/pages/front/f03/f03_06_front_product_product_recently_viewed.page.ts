import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 商品「最近見た商品」ブロック（F03-06）Page Object。
 * integration_test/e2e/f03_06_front_product_product_recently_viewed_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f03-06_front_product_product_recently_viewed.md
 *（利用者視点の入口・処理フロー・表示メッセージ・エッジケース）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig（Block/history.twig）は本リポジトリに未取込のため、
 * セレクタは URL・表示文言・要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 本ブロックは `GET /{_locale}/block/history` で埋め込み・非同期取得される読み取り専用ブロック。
 * 履歴Cookie `history`（商品IDの並び）を読み取り、最適カード画像をサムネイル一覧として描画する。
 */
export class FrontRecentlyViewedPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly blockUrl: string;
  readonly topUrl: string;

  readonly heading: Locator; // 見出し「最近見た商品」（message.ja.yml history.title 相当・要実機確認）
  readonly noHistoryMessage: Locator; // 「最近見た商品はありません。」（history.no_content 相当・要実機確認）
  readonly body: Locator;
  readonly thumbnails: Locator; // サムネイル（商品詳細への a リンク）・要実機確認
  readonly detailLinks: Locator; // 商品詳細リンク /products/detail/{id}

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    // 由来: 利用者視点の入口 GET /{_locale}/block/history（埋め込み・非同期取得）。要実機確認。
    this.blockUrl = `${this.localePrefix}/block/history`;
    this.topUrl = `${this.localePrefix}/`;

    // 見出しと履歴無し文言はどちらも「最近見た商品」を含むため、履歴無しは末尾文言で区別する。
    this.heading = page
      .getByRole("heading", { name: /最近見た商品|Recently Viewed/ })
      .first();
    this.noHistoryMessage = page
      .getByText(/最近見た商品はありません。?|No Recently Seen Items/)
      .first();
    this.body = page.locator("body");
    // サムネイルは商品詳細への a リンク（内包する img）。Twig差分に備え意味で寄せる。要実機確認。
    this.detailLinks = page.locator('a[href*="/products/detail/"]');
    this.thumbnails = page.locator('a[href*="/products/detail/"] img, .ec-recently img, [class*="history"] img');
  }

  /** ブロック取得URLへ直接アクセスする。応答（Response）を返す。 */
  async gotoBlock() {
    return await this.page.goto(this.blockUrl);
  }

  /** フロントのトップ（ブロックが埋め込まれるページ）を表示する。 */
  async gotoTop() {
    return await this.page.goto(this.topUrl);
  }

  /** 見出し「最近見た商品」が表示されていること。期待文言は表示メッセージ節由来。 */
  async seeHeading() {
    await expect(this.heading).toBeVisible();
  }

  /** 履歴無しの表示「最近見た商品はありません。」が表示されていること。期待文言は表示メッセージ節由来。 */
  async seeNoHistory() {
    await expect(this.noHistoryMessage).toBeVisible();
  }

  /** サムネイル一覧（商品詳細リンク）が描画されていないこと。 */
  async seeNoThumbnails() {
    await expect(this.detailLinks).toHaveCount(0);
  }

  /** 入力フォーム部品（入力欄・送信ボタン）が存在しないこと（読み取り専用）。 */
  async seeReadOnlyNoForm() {
    await expect(this.page.getByRole("textbox")).toHaveCount(0);
    await expect(this.page.getByRole("button", { name: /送信|検索|Submit/i })).toHaveCount(0);
  }
}
