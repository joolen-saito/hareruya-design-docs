/**
 * フロント 本店トップページ表示（F01-01）E2E。
 * integration_test/e2e/f01_01_front_top_home_main_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f01-01_front_top_home_main.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 要ログイン/要シードのケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontTopHomeMainPage } from "../../../pages/front/f01/f01_01_front_top_home_main.page";

test.describe("フロント > 本店 > トップページ表示", { tag: ["@front", "@top"] }, () => {
  test("E2E-F01-01-002 未認証で本店TOP（共通レイアウト枠）が表示される", async ({ page }) => {
    const top = new FrontTopHomeMainPage(page);
    await top.gotoTop();
    await top.seeTopLayout();
  });

  test("E2E-F01-01-007 未ログイン時にログイン用モーダルがページ内に用意される", async ({ page }) => {
    const top = new FrontTopHomeMainPage(page);
    await top.gotoTop();
    // 表示済みとは限らないためDOM上の存在で確認（未ログイン・ログインを問わず用意される仕様）。
    await expect(top.loginModal).toHaveCount(1);
  });

  test("E2E-F01-01-010 未ログイン時にヘッダへログイン／会員登録の導線が出る", async ({ page }) => {
    const top = new FrontTopHomeMainPage(page);
    await top.gotoTop();
    await expect(top.loginLink.or(top.entryLink).first()).toBeVisible();
  });

  test("E2E-F01-01-008 ロケールjaで本店TOPが日本語ページとして描画される", async ({ page }) => {
    const top = new FrontTopHomeMainPage(page);
    await top.gotoTop();
    await expect(page).toHaveURL(/\/ja\//);
    await top.seeTopLayout();
  });

  test("E2E-F01-01-013 ロケールenで本店TOPが英語ページとして描画される", async ({ page }) => {
    const top = new FrontTopHomeMainPage(page);
    await top.gotoEnTop();
    await expect(page).toHaveURL(/\/en\//);
    await top.seeTopLayout();
  });

  test("E2E-F01-01-021 未ログインでも本店TOPを閲覧できる（公開画面・ログイン誘導なし）", async ({ page }) => {
    const top = new FrontTopHomeMainPage(page);
    const res = await page.goto(top.topUrl);
    expect(res?.status()).toBeLessThan(400);
    await top.seeTopLayout();
  });

  test("E2E-F01-01-023 サイトルート直下 /{_locale}/ を開くと同一画面に本店TOPが表示される", async ({ page }) => {
    const top = new FrontTopHomeMainPage(page);
    await top.gotoTop();
    await expect(page).toHaveURL(/\/(ja|en)\/?$/);
    await top.seeTopLayout();
  });

  test("E2E-F01-01-064 グローバルナビ（画面上部の主要導線）が表示される", async ({ page }) => {
    const top = new FrontTopHomeMainPage(page);
    await top.gotoTop();
    await expect(top.globalNav).toBeVisible();
  });

  // --- 要ログイン/要シード。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F01-01-011 ログイン済みでヘッダに保有ポイント表示が出る（要: 会員ログイン状態）", async () => {});
  test.fixme("E2E-F01-01-022 ログイン済み会員が本店TOPを閲覧できる（要: 会員ログイン状態）", async () => {});
  test.fixme("E2E-F01-01-012 商品ブロック対象0件でもTOP全体が描画される（要: SEED 0件ブロック）", async () => {});
});
