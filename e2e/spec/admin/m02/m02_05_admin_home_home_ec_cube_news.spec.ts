/**
 * 管理画面ホーム「EC-CUBEお知らせ」カード E2E。
 * 納品ケース表 integration_test/e2e/m02_05_admin_home_home_ec_cube_news_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装する。手動/対象外（空URL・外部埋込拒否・TLS・時間経過・ログ等）は
 * ケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(m02-05_admin_home_home_ec_cube_news.md / messages.ja.yaml / index.twig)由来（オラクル独立性）。
 * 実装の現挙動・CSSクラス値を期待値に流用しない（セレクタは位置情報としてのみ実装から取得）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts も @playwright/test を直接使う。本specも既存リポ規約に倣い
 * @playwright/test + AdminLoginPage 直利用とする。資格情報が無い環境では test.skip でガードする。
 *
 * シード資格情報（環境変数。コミットしない）:
 *  - SEED-M02-ADMIN: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（ホームに到達できる有効な管理者）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminHomeHomeEcCubeNewsPage } from "../../../pages/admin/m02/m02_05_admin_home_home_ec_cube_news.page";
import { ECCUBE_ADMIN_ROUTE, ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS } from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 管理ルート配下のログイン画面（/<admin>/login）へ誘導されることを確認する。
// ルートは homeUrl 組み立てと同じ ECCUBE_ADMIN_ROUTE 由来（実装値のハードコードはしない）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

/** 管理者でログインしてホーム画面（お知らせカード）まで到達する。 */
async function loginAndOpenHome(page: Page): Promise<AdminHomeHomeEcCubeNewsPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const home = new AdminHomeHomeEcCubeNewsPage(page);
  await home.goto();
  return home;
}

test.describe("管理画面 > ホーム > EC-CUBEお知らせ", { tag: ["@admin", "@home"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M02-05-006 未ログインでホームURL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
    await expect(page).toHaveURL(LOGIN_RE); // ホーム（お知らせカード）に到達せずログインへ
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 認証必須（SEED-M02-ADMIN） =====

  test("E2E-M02-05-001 ホームにEC-CUBEお知らせカードが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M02-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
    const home = await loginAndOpenHome(page);
    await home.seeCard();
  });

  test("E2E-M02-05-002 お知らせカード見出しが翻訳キーのタイトル（お知らせ）で表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M02-ADMIN 未設定");
    const home = await loginAndOpenHome(page);
    await home.seeCardTitle("お知らせ"); // trans admin.home.news_title（messages.ja.yaml:1698・ja-JP）
  });

  test("E2E-M02-05-003 お知らせカード本体に情報iframe（name=information）が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M02-ADMIN 未設定");
    const home = await loginAndOpenHome(page);
    await home.seeInfoIframe();
  });

  test("E2E-M02-05-004 情報iframeのsrcに設定値eccube_info_urlが出力される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M02-ADMIN 未設定");
    const home = await loginAndOpenHome(page);
    const src = await home.getInfoIframeSrc();
    // 設定 eccube_info_url の値がそのまま src に出力される（処理フロー#3）。
    // 特定URL文字列は環境別設定で上書きされうるため厳密一致せず、非空の出力で判定する（不具合候補#1/#2）。
    expect(src, "情報iframe の src に eccube_info_url が出力されていること").toBeTruthy();
    expect((src || "").length).toBeGreaterThan(0);
  });

  test("E2E-M02-05-005 お知らせカードが本体・フッタ領域を持つ", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M02-ADMIN 未設定");
    const home = await loginAndOpenHome(page);
    await home.seeLayout();
  });

  test("E2E-M02-05-007 お知らせカードはフォーム・入力欄を持たない", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M02-ADMIN 未設定");
    const home = await loginAndOpenHome(page);
    await home.seeCard();
    // 本カードはフォーム・自由記述入力を持たない（バリデーション節）。情報iframe内の外部入力は対象外。
    await expect(home.newsCard.locator("form")).toHaveCount(0);
    await expect(home.newsCard.locator("input")).toHaveCount(0);
    await expect(home.newsCard.locator("button")).toHaveCount(0);
  });
});
