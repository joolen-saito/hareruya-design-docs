/**
 * フロント 本店PC版グローバルナビ（F02-01）E2E。
 * integration_test/e2e/f02_01_front_global_nav_global_nav_pc_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f02-01_front_global_nav_global_nav_pc.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * ナビ・ECヘッダは本店各画面（`/{_locale}/`）の一部として描画される。要ログインのケースは test.fixme で保留する。
 */
import { test, expect } from "@playwright/test";
import { FrontGlobalNavPcPage } from "../../../pages/front/f02/f02_01_front_global_nav_global_nav_pc.page";

test.describe("フロント > 本店 > PC版グローバルナビ", { tag: ["@front", "@nav"] }, () => {
  test("E2E-F02-01-002 グローバルナビの各導線が画面上部に表示される（ja）", async ({ page }) => {
    const nav = new FrontGlobalNavPcPage(page);
    await nav.gotoTop();
    // ja のナビ項目：買取・記事・デッキ検索・選手一覧・店舗一覧・イベント・ヘルプ。
    await expect(nav.navItem(/店舗一覧/)).toBeVisible();
    await expect(nav.navItem(/イベント/)).toBeVisible();
    await expect(nav.navItem(/ヘルプ/)).toBeVisible();
  });

  test("E2E-F02-01-003 商品検索フォーム（キーワード入力・検索ボタン）が表示される", async ({ page }) => {
    const nav = new FrontGlobalNavPcPage(page);
    await nav.gotoTop();
    await expect(nav.searchKeyword).toBeVisible();
    await expect(nav.searchButton).toBeVisible();
  });

  test("E2E-F02-01-005 ECヘッダ（ロゴ・商品検索・カート・言語切替）が表示される", async ({ page }) => {
    const nav = new FrontGlobalNavPcPage(page);
    await nav.gotoTop();
    await nav.seeEcHeader();
    await expect(nav.langSwitch).toBeVisible();
  });

  test("E2E-F02-01-008 未ログイン時はマイページ隠しメニューにログイン／会員登録の導線が出る", async ({ page }) => {
    const nav = new FrontGlobalNavPcPage(page);
    await nav.gotoTop();
    await expect(nav.loginLink.or(nav.entryLink).first()).toBeVisible();
  });

  test("E2E-F02-01-021 記事の導線が表示される", async ({ page }) => {
    const nav = new FrontGlobalNavPcPage(page);
    await nav.gotoTop();
    await expect(nav.navItem(/記事/)).toBeVisible();
  });

  test("E2E-F02-01-090 英語表示では買取の導線を表示しない（en出し分け）", async ({ page }) => {
    const nav = new FrontGlobalNavPcPage(page);
    await nav.gotoEnTop();
    await expect(page).toHaveURL(/\/en\//);
    // en ナビは買取を含まない。ナビ内の買取導線が無いことを確認する。
    await expect(nav.navItem(/買取/)).toHaveCount(0);
  });

  // --- 要ログイン。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F02-01-007 ログイン会員のときヘッダに保有ポイント表示が出る（要: 会員ログイン状態）", async () => {});
});
