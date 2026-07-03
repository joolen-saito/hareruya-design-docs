import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント ネット買取「買取商品詳細」（F05-04）Page Object。
 * integration_test/e2e/f05_04_front_online_purchase_buy_product_detail_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f05-04_front_online_purchase_buy_product_detail.md
 *（利用者視点の入口・処理フロー・フロント挙動・エッジケース・画面遷移）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig（`Purchase/detail.twig`・`Block/js/purchase_js.twig`）は本リポジトリに未取込のため、
 * セレクタは Twig 差分に耐えるよう URL・表示文言・要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontPurchaseDetailPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly topUrl: string;

  readonly body: Locator;
  readonly heading: Locator;
  readonly languageTabs: Locator; // 由来: 言語タブ（detail.twig / purchase_js.twig）要実機確認
  readonly priceTable: Locator; // 由来: 状態と買取価格の表 要実機確認
  readonly quantitySelect: Locator; // 由来: 数量選択（買取価格≧500時のみ表示）要実機確認
  readonly addToCartButton: Locator; // 由来: カートに追加ボタン 要実機確認
  readonly sameNameList: Locator; // 由来: 同名カードの買取価格一覧 要実機確認
  readonly deckList: Locator; // 由来: 使用デッキ一覧 要実機確認

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.topUrl = `${this.localePrefix}/`;

    this.body = page.locator("body");
    this.heading = page.getByRole("heading").first();
    // 表示要素は Twig 差分に備え、意味の近い一般セレクタで寄せる（確定は要実機確認）。
    this.languageTabs = page.locator('[class*="lang"] a, [role="tab"], .nav-tabs a').first();
    this.priceTable = page.locator("table").first();
    this.quantitySelect = page.locator('select[name*="quantity"], select[name*="quantity"], input[name*="quantity"]').first();
    this.addToCartButton = page.getByRole("button", { name: /カートに追加/ }).first();
    this.sameNameList = page.locator('[class*="same"], [class*="samename"], [class*="card_list"]').first();
    this.deckList = page.locator('[class*="deck"]').first();
  }

  /** 買取商品詳細を開く（GET）。戻り値の Response で HTTP ステータスを観測できる。 */
  async gotoDetail(id: number | string) {
    return this.page.goto(`${this.localePrefix}/purchase/detail/${id}`);
  }

  /** 言語・商品クラスをクエリ指定して買取商品詳細を開く（GET）。 */
  async gotoDetailWithQuery(id: number | string, query: string) {
    return this.page.goto(`${this.localePrefix}/purchase/detail/${id}${query.startsWith("?") ? "" : "?"}${query}`);
  }

  /** 旧商品コードから転送する（GET）。対応あり→新詳細、対応なし→トップ。 */
  async gotoForward(oldCode: string) {
    return this.page.goto(`${this.localePrefix}/purchase/forward/${oldCode}`);
  }

  /** ログインへ誘導されていないこと（未ログインで閲覧可）。期待は設計書「権限・認可」由来。 */
  async seeNotRedirectedToLogin() {
    await expect(this.page).not.toHaveURL(/\/mypage\/login/);
  }

  /** トップページへ戻っていること。期待は設計書「画面遷移／エラー処理」由来。 */
  async seeRedirectedToTop() {
    await expect(this.page).not.toHaveURL(/\/purchase\/(forward|detail)\//);
  }
}
