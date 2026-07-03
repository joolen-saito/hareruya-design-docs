/**
 * フロント 商品「カテゴリ一覧」（F03-04）E2E。
 * integration_test/e2e/f03_04_front_product_product_category_list_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f03-04_front_product_product_category_list.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本機能は閲覧専用（未ログイン閲覧可・入力/更新なし）のため、初期表示・見出し・リンク遷移は live で実装する。
 * マスタの厳密な順序・フラグ連動表示・記号画像・遷移先商品件数の照合は要シードのため test.fixme（理由付き）で保留し、
 * 全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontProductCategoryListPage } from "../../../pages/front/f03/f03_04_front_product_product_category_list.page";

test.describe("フロント > 商品 > カテゴリ一覧", { tag: ["@front", "@product"] }, () => {
  test("E2E-F03-04-002 未ログインでカテゴリ一覧を閲覧できる", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    // 未認証でも認証誘導されず一覧が表示される（権限・認可：未ログイン閲覧可）。
    await expect(page).toHaveURL(/\/products\/category(?:\/|\?|$)/);
    await category.seeCategoryListScreen();
  });

  test("E2E-F03-04-009 カテゴリ一覧の見出し「商品カテゴリ一覧」が表示される", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    await expect(category.body).toContainText("商品カテゴリ一覧");
  });

  test("E2E-F03-04-007 カードセット・カテゴリの見出しとリンクの一覧が表示される", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    await category.seeCategoryListScreen();
    await category.seeSearchLinks();
  });

  test("E2E-F03-04-090 表示対象カテゴリのリンクが一覧表示される", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    await expect(category.searchLinks.first()).toBeVisible();
  });

  test("E2E-F03-04-023 成功時にカードセット・カテゴリの見出しとリンクのHTMLが返る", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    await category.seeCategoryListScreen();
    await expect(category.searchLinks).not.toHaveCount(0);
  });

  test("E2E-F03-04-022 カテゴリ一覧の表示要求で画面が正常表示される", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    const response = await page.goto(category.categoryUrl);
    // エラー画面でなく一覧が表示される（4xx/5xx でないこと・見出しが出ること）。
    expect(response?.ok()).toBeTruthy();
    await category.seeCategoryListScreen();
  });

  test("E2E-F03-04-010 各リンクが商品一覧の検索エンドポイントへ検索条件付きで向いている", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    const href = await category.searchLinks.first().getAttribute("href");
    expect(href).toMatch(/\/products\/search/);
  });

  test("E2E-F03-04-008 カテゴリ一覧内のリンク押下で商品一覧（検索結果）へ遷移する", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    await category.clickFirstSearchLink();
    await expect(page).toHaveURL(/\/products\/search/);
  });

  test("E2E-F03-04-021 カテゴリ一覧URLへ直接アクセスすると一覧が表示される", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    // ログイン誘導されない（未認証でカテゴリ一覧に留まる）。
    await expect(page).toHaveURL(/\/products\/category(?:\/|\?|$)/);
    await category.seeCategoryListScreen();
  });

  test("E2E-F03-04-056 カテゴリ一覧を開くと同一画面に一覧を表示する", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    await expect(page).toHaveURL(/\/products\/category(?:\/|\?|$)/);
    await category.seeCategoryListScreen();
  });

  test("E2E-F03-04-014 表示対象の親カテゴリ配下のフロント用カテゴリが表示される", async ({ page }) => {
    const category = new FrontProductCategoryListPage(page);
    await category.gotoCategoryList();
    // 既定データでも表示対象カテゴリの導線（検索リンク）が存在することを弱観測する。
    await expect(category.searchLinks.first()).toBeVisible();
  });

  // --- 要シード（マスタ順序・フラグ連動表示・記号画像・遷移先商品件数）。自動化可能だが保留（抜け漏れ可視化） ---
  test.fixme("E2E-F03-04-011 カードセット見出しに記号画像が背景表示される（要: SEED-F03-04-MASTERS/CSS実機確認）", async () => {});
  test.fixme("E2E-F03-04-012 特殊セットを除きリリース日順で表示される（要: SEED-F03-04-MASTERS 順序照合）", async () => {});
  test.fixme("E2E-F03-04-013 全レアリティが取得されレアリティ別リンクが表示される（要: SEED-F03-04-MASTERS）", async () => {});
  test.fixme("E2E-F03-04-015 カードセットがリリース日順で表示される（要: SEED-F03-04-MASTERS 順序照合）", async () => {});
  test.fixme("E2E-F03-04-016 リリース前のカードセットに予約販売表示が付く（要: SEED-F03-04-PRESALE）", async () => {});
  test.fixme("E2E-F03-04-017 レアリティ表示フラグ有効なら見出し自体がリンクになる（要: SEED-F03-04-MASTERS フラグ）", async () => {});
  test.fixme("E2E-F03-04-018 レアリティ表示フラグ無効なら配下リンクが展開される（要: SEED-F03-04-MASTERS フラグ）", async () => {});
  test.fixme("E2E-F03-04-019 表示対象外の親配下カテゴリは一覧に出さない（要: SEED-F03-04-MASTERS 表示フラグ）", async () => {});
  test.fixme("E2E-F03-04-058 カテゴリリンク押下先の検索結果に該当区分の商品が含まれる（要: SEED-F03-04-PRODUCTS）", async () => {});
});
