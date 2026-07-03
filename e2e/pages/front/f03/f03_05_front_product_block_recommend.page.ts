import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_SHOP,
} from "../../../config/default.config";

/**
 * フロント 商品「商品リコメンド（おすすめ商品ブロック）」（F03-05）Page Object。
 * integration_test/e2e/f03_05_front_product_block_recommend_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f03-05_front_product_block_recommend.md
 * （利用者視点の入口・処理フロー・表示メッセージ・集計条件・画面遷移）由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の Twig（Block/user_recommend_product.twig・Block/recommend_detail.twig）
 * は本リポジトリに未取込のため、セレクタはフロントTwig差分に耐えるよう URL・表示文言・要素の意味で寄せる。
 * file:line 根拠が取れない箇所は要実機確認。未実行雛形。
 */
export class FrontRecommendBlockPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly cartUrl: string;
  readonly mypageUrl: string;

  readonly body: Locator;
  // おすすめ商品ブロックの領域。Twig差分に備え、一般的なクラス名の候補で拾う。要実機確認。
  readonly recommendBlock: Locator;
  // ブロック内のおすすめ商品リンク（商品詳細への導線）。要実機確認。
  readonly recommendItemLinks: Locator;
  // スライダーの前後送りボタン。要実機確認。
  readonly sliderNavButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.cartUrl = `${this.localePrefix}/cart`;
    this.mypageUrl = `${this.localePrefix}/mypage`;

    this.body = page.locator("body");
    // おすすめブロックのコンテナ。ロケールキー hareruyaec.product.no_recommend のメッセージや
    // recommend 系のクラスを候補にする。要実機確認。
    this.recommendBlock = page.locator(
      '[class*="recommend"], [id*="recommend"], [class*="Recommend"]'
    );
    this.recommendItemLinks = this.recommendBlock.locator('a[href*="/products/detail/"]');
    this.sliderNavButtons = this.recommendBlock.locator(
      'button, [class*="prev"], [class*="next"], [class*="arrow"]'
    );
  }

  /** ロケール接頭辞を差し替えた任意ロケールのカートURLを返す（例 en）。 */
  cartUrlForLocale(locale: string): string {
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    return `/${locale}${shop}/cart`;
  }

  productDetailUrl(productId: number | string): string {
    return `${this.localePrefix}/products/detail/${productId}`;
  }

  async gotoCart() {
    await this.page.goto(this.cartUrl);
  }

  async gotoCartWithLocale(locale: string) {
    await this.page.goto(this.cartUrlForLocale(locale));
  }

  async gotoProductDetail(productId: number | string) {
    await this.page.goto(this.productDetailUrl(productId));
  }

  async gotoMypage() {
    await this.page.goto(this.mypageUrl);
  }

  /**
   * おすすめ0件メッセージ（設計書「表示メッセージ」節、ロケールキー hareruyaec.product.no_recommend）
   * を表示していること。空カートは基準商品なし＝おすすめ0件のため常に本メッセージとなる（設計書エッジケース）。
   * 期待文言は設計書由来。日本語/英語を切替える。
   */
  async seeNoRecommendMessage(locale: "ja" | "en" = "ja") {
    const text =
      locale === "en"
        ? "No recommended items to display yet."
        : "表示するおすすめ商品はまだありません。";
    await expect(this.body).toContainText(text);
  }
}
