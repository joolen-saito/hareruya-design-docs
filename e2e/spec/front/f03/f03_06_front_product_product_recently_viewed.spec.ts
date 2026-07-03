/**
 * フロント 商品「最近見た商品」ブロック（F03-06）E2E。
 * integration_test/e2e/f03_06_front_product_product_recently_viewed_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f03-06_front_product_product_recently_viewed.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本ブロックは履歴Cookie（ブラウザ単位）に依存し会員ログイン不要。live は履歴Cookie無しの初期状態で観測できる
 * 見出し／履歴無し表示／未ログイン応答／読み取り専用を対象とする。
 * 実在商品ID・加工Cookie・フォイル商品を要するケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontRecentlyViewedPage } from "../../../pages/front/f03/f03_06_front_product_product_recently_viewed.page";

test.describe("フロント > 商品 > 最近見た商品", { tag: ["@front", "@product"] }, () => {
  test("E2E-F03-06-009 履歴が無い初期状態でも見出し「最近見た商品」が表示される", async ({ page }) => {
    const block = new FrontRecentlyViewedPage(page);
    await block.gotoBlock();
    await block.seeHeading();
  });

  test("E2E-F03-06-010 履歴Cookieが無い場合は履歴無しの表示のみを描画する", async ({ page }) => {
    const block = new FrontRecentlyViewedPage(page);
    await block.gotoBlock();
    await block.seeNoHistory();
    await block.seeNoThumbnails();
  });

  test("E2E-F03-06-020 未ログインでも最近見た商品ブロックが表示可能（正常応答）", async ({ page }) => {
    const block = new FrontRecentlyViewedPage(page);
    const res = await block.gotoBlock();
    // 認証を要求されず、エラーとならずに応答すること（権限・認可＝未ログインでも表示可能）。
    expect(res?.ok()).toBeTruthy();
  });

  test("E2E-F03-06-021 ブロック取得URLへ直接アクセスしてもブロック内容が返る", async ({ page }) => {
    const block = new FrontRecentlyViewedPage(page);
    await block.gotoBlock();
    // ログイン画面へ誘導されず、ブロック内容（見出し／履歴無し表示）が返ること。
    await expect(page).not.toHaveURL(/\/mypage\/login/);
    await expect(block.body).toContainText(/最近見た商品|Recently Viewed/);
  });

  test("E2E-F03-06-063 本ブロックは読み取り専用で利用者入力フォームを持たない", async ({ page }) => {
    const block = new FrontRecentlyViewedPage(page);
    await block.gotoBlock();
    await block.seeReadOnlyNoForm();
  });

  // --- 要シード/要実在商品ID/要加工Cookie/要フォイル商品。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F03-06-003 商品詳細を閲覧すると当該商品のサムネイルがブロックに反映される（要: SEED-F03-06-PRODUCT/実在商品ID）", async () => {});
  test.fixme("E2E-F03-06-008 履歴Cookieの並び順どおり（新しく見た商品が先頭）に表示される（要: 複数の実在商品閲覧）", async () => {});
  test.fixme("E2E-F03-06-022 サムネイルのリンク押下で商品詳細（F03-02）へ遷移する（要: 履歴あり/実在商品ID）", async () => {});
  test.fixme("E2E-F03-06-007 画像が取得できない商品IDは一覧から除外される（要: SEED-F03-06-HISTORY-BROKEN 加工Cookie/書式実機確認）", async () => {});
  test.fixme("E2E-F03-06-012 画像を取得できる商品が0件のとき一覧が空となる（要: SEED-F03-06-HISTORY-BROKEN 加工Cookie）", async () => {});
  test.fixme("E2E-F03-06-065 サムネイル画像は遅延読み込みで取得される（要: 履歴あり/遅延読み込み実装形の実機確認）", async () => {});
  test.fixme("E2E-F03-06-077 商品IDに対する最適カード画像が取得され表示される（要: SEED-F03-06-PRODUCT カード画像あり）", async () => {});
  test.fixme("E2E-F03-06-019 フォイル商品のサムネイルにフォイル用装飾が付く（要: SEED-F03-06-FOIL フォイル商品）", async () => {});
});
