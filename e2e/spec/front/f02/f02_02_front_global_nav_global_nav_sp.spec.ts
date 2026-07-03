/**
 * フロント 本店スマホ版ナビ（F02-02）E2E。
 * integration_test/e2e/f02_02_front_global_nav_global_nav_sp_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f02-02_front_global_nav_global_nav_sp.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * スマホ版ナビは画面幅で出し分けられるため、SPビューポートで本店各画面（`/{_locale}/`）を開いて確認する。
 * 候補リスト（サジェスト）は要実機JS/候補データのため test.fixme で保留する。
 */
import { test, expect } from "@playwright/test";
import { FrontGlobalNavSpPage } from "../../../pages/front/f02/f02_02_front_global_nav_global_nav_sp.page";

test.describe("フロント > 本店 > スマホ版ナビ", { tag: ["@front", "@nav", "@sp"] }, () => {
  test("E2E-F02-02-009 スマホ表示（SPビューポート）で本店各画面が描画される", async ({ page }) => {
    const nav = new FrontGlobalNavSpPage(page);
    await nav.useSpViewport();
    await nav.gotoTop();
    await expect(nav.body).toBeVisible();
  });

  test("E2E-F02-02-007 スマホ版ナビの各導線が表示される（ja）", async ({ page }) => {
    const nav = new FrontGlobalNavSpPage(page);
    await nav.useSpViewport();
    await nav.gotoTop();
    // ja のSPナビ：ショップ・買取・記事・デッキ検索・デッキ構築・店舗一覧・イベント・ヘルプ。
    await expect(nav.navItem(/店舗一覧/)).toBeVisible();
    await expect(nav.navItem(/イベント/)).toBeVisible();
    await expect(nav.navItem(/ヘルプ/)).toBeVisible();
  });

  test("E2E-F02-02-008 商品検索フォーム（キーワード入力・検索ボタン）が表示される", async ({ page }) => {
    const nav = new FrontGlobalNavSpPage(page);
    await nav.useSpViewport();
    await nav.gotoTop();
    await expect(nav.searchKeyword).toBeVisible();
    await expect(nav.searchButton).toBeVisible();
  });

  test("E2E-F02-02-013 商品検索フォーム送信でキーワードが検索遷移先へ渡る", async ({ page }) => {
    const nav = new FrontGlobalNavSpPage(page);
    await nav.useSpViewport();
    await nav.gotoTop();
    await nav.searchKeyword.fill("e2e-keyword");
    await nav.searchButton.click();
    // 呼び出し元から渡された商品検索の遷移先へキーワードを送る（検索結果表示は商品機能を正とする）。
    await expect(page).toHaveURL(/product|search|keyword|e2e-keyword/i);
  });

  test("E2E-F02-02-011 英語表示ではショップ・記事・選手一覧・デッキ検索…の構成となる（en出し分け）", async ({ page }) => {
    const nav = new FrontGlobalNavSpPage(page);
    await nav.useSpViewport();
    await nav.gotoEnTop();
    await expect(page).toHaveURL(/\/en\//);
    // en は選手一覧を含み、買取・デッキ構築を含まない。
    await expect(nav.navItem(/買取/)).toHaveCount(0);
  });

  // --- 要実機（サジェスト用JS・候補リストデータ）。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F02-02-019 キーワード入力欄で候補リスト（サジェスト）が表示される（要: 実機JS/候補データ）", async () => {});
});
