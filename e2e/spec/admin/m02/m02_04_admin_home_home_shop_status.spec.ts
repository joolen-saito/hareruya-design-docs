/**
 * 管理画面ホーム ショップ状況カード E2E（納品ケース表 integration_test/e2e/m02_04_admin_home_home_shop_status_e2e_cases.md に対応）。
 * 本specには「E2E自動化」ケースのみ実装する。手動/間接（集計値突合・検索条件上書きの一覧描画確認）は
 * ケース表で全量管理し、自動化予定だが要シード/別機能セレクタ要実機のものだけ test.fixme で残す。
 * 期待結果は仕様(functions/ec-cube-enterprise/m02-04_admin_home_home_shop_status.md / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec（login/two_factor_auth）も
 * @playwright/test を直接使う。本specも既存規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）が無いと走らないように test.skip(!HAS_CREDS) でガード。
 * 本ブロックは参照のみ（非破壊）。ログイン後ホームを開くだけで観測でき、ロック等の破壊的副作用はない。
 *
 * シード資格情報（環境変数。コミットしない）:
 *  - SEED-M02-04-ADMIN: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（有効な管理者・2FA OFF）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { HomeHomeShopStatusPage } from "../../../pages/admin/m02/m02_04_admin_home_home_shop_status.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;
const PRODUCT_RE = /\/product(\/|\?|$)/; // 商品一覧（admin_product / admin_product_page）
const CUSTOMER_RE = /\/customer(\/|\?|$)/; // 会員一覧（admin_customer / admin_customer_page）

/** 管理者でログインしホーム画面に到達する。 */
async function loginToHome(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden(); // ログイン画面から遷移
}

test.describe("管理画面 > ホーム ショップ状況", { tag: ["@admin", "@home"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M02-04-001 未認証でホームURL→管理ログイン画面へ誘導（カード利用不可）", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
    await expect(page.locator("#shop-statistical")).toHaveCount(0); // カードは表示されない
  });

  test("E2E-M02-04-006 未認証で各管理側入口(search_nonstock/search_customer/product)へ直接アクセス→ログイン誘導（到達不可）", async ({ page }) => {
    // 設計書「利用者視点の入口（非管理者・未認証は管理側URLなどに到達できない）」「権限・認可（未認証は利用不可）」由来。
    for (const path of ["search_nonstock", "search_customer", "product"]) {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/${path}`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    }
  });

  // ===== 認証あり（資格情報があるときのみ実行・SEED-M02-04-ADMIN） =====

  test("E2E-M02-04-002 ホームにショップ状況カードと見出し「ショップ状況」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M02-04-ADMIN）");
    await loginToHome(page);
    const shop = new HomeHomeShopStatusPage(page);
    await shop.goto();
    await shop.seeCard();
  });

  test("E2E-M02-04-003 ショップ状況カードに3行（在庫切れ商品数/取扱商品数/会員数）が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginToHome(page);
    const shop = new HomeHomeShopStatusPage(page);
    await shop.goto();
    await shop.seeRows();
  });

  test("E2E-M02-04-007 ショップ状況カードの各行にアイコンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginToHome(page);
    const shop = new HomeHomeShopStatusPage(page);
    await shop.goto();
    await shop.seeRowIcons(); // 設計書フロント挙動「各行はアイコン・ラベル・件数で構成」由来
  });

  test("E2E-M02-04-004 3指標が整数件数（桁区切り）として数値表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginToHome(page);
    const shop = new HomeHomeShopStatusPage(page);
    await shop.goto();
    await shop.seeNumericCount(shop.outOfStockCount);
    await shop.seeNumericCount(shop.productsCount);
    await shop.seeNumericCount(shop.customersCount);
    // 桁区切りカンマは件数≥1000のときのみ現れる（要確認#3）。本ケースは「数字＋任意カンマ」を仕様（桁区切り適用）とみなす。
  });

  test("E2E-M02-04-010 在庫切れ商品数の行を押下→商品一覧へ遷移", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginToHome(page);
    const shop = new HomeHomeShopStatusPage(page);
    await shop.goto();
    await shop.clickOutOfStock();
    await expect(page).toHaveURL(PRODUCT_RE);
  });

  test("E2E-M02-04-011 取扱商品数の行を押下→商品一覧へ遷移", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginToHome(page);
    const shop = new HomeHomeShopStatusPage(page);
    await shop.goto();
    await shop.clickProducts();
    await expect(page).toHaveURL(PRODUCT_RE);
  });

  test("E2E-M02-04-012 会員数の行を押下→会員一覧へ遷移", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginToHome(page);
    const shop = new HomeHomeShopStatusPage(page);
    await shop.goto();
    await shop.clickCustomers();
    await expect(page).toHaveURL(CUSTOMER_RE);
  });

  test("E2E-M02-04-013 在庫切れ商品数リンク(search_nonstock)→商品一覧1ページ目へリダイレクト", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginToHome(page);
    const shop = new HomeHomeShopStatusPage(page);
    await shop.gotoNonstock(); // GET /%route%/search_nonstock
    await expect(page).toHaveURL(/\/product\/page\/1(\?|$)/); // admin_product_page page_no=1
  });

  test("E2E-M02-04-014 会員数リンク(search_customer)→会員一覧1ページ目へリダイレクト", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginToHome(page);
    const shop = new HomeHomeShopStatusPage(page);
    await shop.gotoCustomerSearch(); // GET /%route%/search_customer
    await expect(page).toHaveURL(/\/customer\/page\/1(\?|$)/); // admin_customer_page page_no=1
  });

  // ===== 保留（自動化予定だが要シード/別機能セレクタ要実機。手動/間接はケース表で全量管理） =====

  test.fixme(
    "E2E-M02-04-015 在庫切れ遷移で既存検索条件をマージせず在庫なしで上書き（要: 商品一覧の在庫なしフィルタ反映確認＝別機能m11セレクタ要実機）",
    async () => {
      // 期待は仕様(エッジケース・遷移時に引き継ぐ検索条件 / AdminController.php:307-309)由来。
      // 事前に商品一覧で別条件を保存→在庫切れ押下→遷移先一覧の初期フィルタが在庫なしのみであることを実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M02-04-016 取扱遷移ではショップ状況側が検索条件セッションを更新しない（要: 商品一覧の初期状態確認＝別機能m11セレクタ要実機）",
    async () => {
      // 期待は仕様(処理フロー「取扱商品数から商品一覧へ」/ 遷移時に引き継ぐ検索条件・取扱)由来。
      // 事前に商品一覧で別条件を保存→取扱押下→ショップ状況側が条件を書き換えず一覧既定動作に従うことを実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M02-04-017 会員数遷移で既存検索条件をマージせず本会員で上書き（要: 会員一覧の本会員フィルタ反映確認＝別機能m11セレクタ要実機）",
    async () => {
      // 期待は仕様(エッジケース・遷移時に引き継ぐ検索条件・会員数)由来。
    }
  );

  // ===== 集計値突合・権限(非管理者)・追加エッジケース（手動: 要DBシード/専用資格情報。ケース表で全量管理） =====
  // E2E-018〜025/005 は付帯表で手動として管理する。集計値の正しさは DB シードと画面件数の突合が要るため
  // 自動 spec には起こさない（オラクルを実装の count クエリへ寄せないため）。
});
