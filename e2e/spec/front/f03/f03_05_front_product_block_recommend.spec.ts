/**
 * フロント 商品「商品リコメンド（おすすめ商品ブロック）」（F03-05）E2E。
 * integration_test/e2e/f03_05_front_product_block_recommend_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f03-05_front_product_block_recommend.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * おすすめ抽出は注文実績/在庫/公開状態のデータと会員ログインに依存するため、具体的な推薦内容・件数・
 * 商品別出し分けは test.fixme（要シード/要データ/要ログイン）で保留する。
 * 空カート＝基準商品なし＝おすすめ0件（設計書エッジケース）は非ログイン・非破壊で観測でき live 化する。
 * 手動・対象外はケース表（付帯表2/2b）で全量管理し spec には残さない。
 */
import { test, expect } from "@playwright/test";
import { FrontRecommendBlockPage } from "../../../pages/front/f03/f03_05_front_product_block_recommend.page";

test.describe("フロント > 商品 > 商品リコメンド（おすすめ商品ブロック）", { tag: ["@front", "@product"] }, () => {
  // --- live: 非ログイン・非破壊で観測できる表示有無・導線・0件メッセージ ---

  test("E2E-F03-05-022 未ログインでおすすめブロック設置ページ（カート）が表示可能", async ({ page }) => {
    const rec = new FrontRecommendBlockPage(page);
    const res = await page.goto(rec.cartUrl);
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/cart(?:\/|\?|$)/);
  });

  test("E2E-F03-05-021 未ログインでカートURLへ直接アクセスしてもページが表示される（未ログイン表示可）", async ({ page }) => {
    const rec = new FrontRecommendBlockPage(page);
    await rec.gotoCart();
    await expect(page).toHaveURL(/\/cart(?:\/|\?|$)/);
  });

  test("E2E-F03-05-002 未ログインでもおすすめブロックを含むページが表示可能（認証を要求しない）", async ({ page }) => {
    const rec = new FrontRecommendBlockPage(page);
    await rec.gotoCart();
    // 会員ログイン画面へ誘導されず、当該ページに留まること（未ログインでも表示可能）。
    await expect(page).not.toHaveURL(/\/mypage\/login/);
  });

  test("E2E-F03-05-013 空カートは基準商品なしとしておすすめ0件メッセージを表示する", async ({ page }) => {
    const rec = new FrontRecommendBlockPage(page);
    await rec.gotoCart();
    // 空カート＝基準商品なし＝おすすめ0件（設計書エッジケース）。おすすめ内容は非同期描画のため待機。
    await rec.seeNoRecommendMessage("ja");
  });

  test("E2E-F03-05-008 おすすめ0件メッセージの日本語文言が表示される", async ({ page }) => {
    const rec = new FrontRecommendBlockPage(page);
    await rec.gotoCart();
    await expect(rec.body).toContainText("表示するおすすめ商品はまだありません。");
  });

  test("E2E-F03-05-007 おすすめブロック内容はページ表示後に非同期で取得・描画される", async ({ page }) => {
    const rec = new FrontRecommendBlockPage(page);
    await rec.gotoCart();
    // 非同期描画完了後にブロックの0件メッセージが現れること（描画結果で非同期取得を観測）。
    await expect(rec.body).toContainText("表示するおすすめ商品はまだありません。");
  });

  test("E2E-F03-05-010 英語ロケールではおすすめ0件メッセージが英語で表示される", async ({ page }) => {
    const rec = new FrontRecommendBlockPage(page);
    await rec.gotoCartWithLocale("en");
    await rec.seeNoRecommendMessage("en");
  });

  // --- 要シード/要データ/要ログイン。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F03-05-079 商品詳細ページで表示中商品を基準におすすめブロックが表示される（detail種別）（要: 商品ID/おすすめデータ）", async () => {});
  test.fixme("E2E-F03-05-077 マイページで会員の最新注文商品を基準におすすめが表示される（mypage種別）（要: 会員ログイン/注文データ）", async () => {});
  test.fixme("E2E-F03-05-078 購入完了ページで会員の最新注文商品を基準におすすめが表示される（complete種別）（要: 注文完了フロー/データ）", async () => {});
  test.fixme("E2E-F03-05-011 カート内で最も高額な商品を基準におすすめが表示される（要: カート投入/おすすめデータ）", async () => {});
  test.fixme("E2E-F03-05-009 在庫があり公開中の商品規格を持つ商品のみおすすめ対象となる（要: 在庫/公開状態のデータ）", async () => {});
  test.fixme("E2E-F03-05-015 ブロック内おすすめ商品リンク押下で当該商品の商品詳細へ遷移する（要: おすすめデータ）", async () => {});
  test.fixme("E2E-F03-05-070 ログイン会員が過去に注文した商品はおすすめから除外される（要: 会員ログイン/購入履歴データ）", async () => {});
  test.fixme("E2E-F03-05-014 基準商品はあるが抽出結果が0件のときおすすめが無い旨を表示する（要: データ状態）", async () => {});
  test.fixme("E2E-F03-05-080 おすすめ商品名がロケールに応じ表示される（英語ロケールは英語名）（要: おすすめデータ）", async () => {});
  test.fixme("E2E-F03-05-088 おすすめスライダーの前後送りボタン・遅延読み込み画像が表示される（要: おすすめデータ）", async () => {});
});
