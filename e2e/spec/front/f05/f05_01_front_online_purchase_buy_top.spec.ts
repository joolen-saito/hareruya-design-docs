/**
 * フロント ネット買取「買取トップページ」（F05-01）E2E。
 * integration_test/e2e/f05_01_front_online_purchase_buy_top_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f05-01_front_online_purchase_buy_top.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本ページは主に公開表示ページ（会員ログイン不要）。表示・遷移は非破壊で走る（live）。
 * 要シード/要会員ログイン/要実機のケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 * 手動・対象外は spec に残さずケース表（付帯表2/2b）で全量管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontPurchaseTopPage } from "../../../pages/front/f05/f05_01_front_online_purchase_buy_top.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > ネット買取 > 買取トップページ", { tag: ["@front", "@purchase"] }, () => {
  // --- live: シード/資格情報/破壊的操作なしで非破壊に走る公開表示・遷移 ---

  test("E2E-F05-01-003 トップURLを開くと目玉買取商品の一覧領域が表示される", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    await top.gotoTop();
    await expect(page).toHaveURL(/\/purchase\/?(?:\?|$)/);
    await expect(top.heading).toBeVisible();
  });

  test("E2E-F05-01-006 見出し「目玉買取商品」が表示される", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    await top.gotoTop();
    await expect(top.body).toContainText("目玉買取商品");
  });

  test("E2E-F05-01-002 未ログインでも買取トップを閲覧できる", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    await top.gotoTop();
    // 権限・認可: 未ログインで閲覧可能。ログイン画面へ誘導されないこと。
    await expect(page).not.toHaveURL(/\/mypage\/login/);
    await expect(top.heading).toBeVisible();
  });

  test("E2E-F05-01-008 買取ページ用クラス（purchase_page）が付与される", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    await top.gotoTop();
    await expect(top.purchasePageContainer).toBeVisible();
  });

  test("E2E-F05-01-022 買取トップURLは正常に表示され会員ログインを要しない", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    const res = await page.goto(top.topUrl);
    // HTTPステータス: 正常応答（設計md 成功時出力＝トップページのHTML）。
    expect(res?.ok()).toBeTruthy();
    await expect(top.heading).toBeVisible();
  });

  test("E2E-F05-01-014 目玉買取商品の一覧を含むトップページのHTMLが返る", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    await top.gotoTop();
    await expect(top.body).toContainText("目玉買取商品");
  });

  test("E2E-F05-01-015 本機能固有のエラー応答を持たず正常に表示される", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    const res = await page.goto(top.topUrl);
    // 失敗時出力: 本機能固有のエラー応答は持たない（エラーページに落ちないこと）。
    expect(res?.ok()).toBeTruthy();
    await expect(top.body).not.toContainText(/エラーが発生しました|見つかりませんでした/);
  });

  test("E2E-F05-01-021 買取トップURLへ直接アクセスするとトップが表示される", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    await top.gotoTop();
    await expect(top.heading).toBeVisible();
  });

  test("E2E-F05-01-080 買取詳細検索の導線から買取商品一覧へ遷移する", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    // 利用者視点の入口: GET /{_locale}/purchase/search（F05-02／F05-03を正とする）。非破壊GET。
    const res = await page.goto(top.searchUrl);
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/purchase\/search/);
  });

  test("E2E-F05-01-081 カートへの導線から買取希望品カートへ遷移する", async ({ page }) => {
    const top = new FrontPurchaseTopPage(page);
    // 利用者視点の入口: GET /{_locale}/purchase/cart（F05-05を正とする）。非破壊GET。
    const res = await page.goto(top.cartUrl);
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/purchase\/cart/);
  });

  // --- 要会員ログイン。creds があれば live 化する ---
  test("E2E-F05-01-023 ログイン済み会員でも買取トップを閲覧できる", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定（会員ログインが必要）");
    // 会員ログイン導線は F06-03 を正とする。ここでは資格情報がある環境でのみ閲覧可否を確認。
    const top = new FrontPurchaseTopPage(page);
    await top.gotoTop();
    await expect(top.heading).toBeVisible();
  });

  // --- 要シード/要会員ログイン/要実機。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme(
    "E2E-F05-01-018 目玉買取商品カード押下で買取商品詳細(F05-04)へ遷移する（要: SEED-F05-01-FEATURED 目玉買取商品）",
    async () => {}
  );
  test.fixme(
    "E2E-F05-01-019 カートに追加ボタンで画面遷移せず非同期に買取カートへ追加される（要: SEED-F05-01-FEATURED/破壊的操作）",
    async () => {}
  );
  test.fixme(
    "E2E-F05-01-009 カート追加時に追加完了/追加失敗ダイアログが表示される（要: SEED-F05-01-FEATURED）",
    async () => {}
  );
  test.fixme(
    "E2E-F05-01-012 各目玉買取商品に買取価格が表示される（要: SEED-F05-01-FEATURED 買取価格）",
    async () => {}
  );
  test.fixme(
    "E2E-F05-01-007 買取共通JS(purchase_js)を読み込みカート追加が非同期になる（要: SEED-F05-01-FEATURED/実機挙動確認）",
    async () => {}
  );
  test.fixme(
    "E2E-F05-01-020 目玉買取商品が0件でも一覧を空で表示しエラーにならない（要: SEED-F05-01-EMPTY 0件状態）",
    async () => {}
  );
});
