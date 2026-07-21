/**
 * 管理ログイン E2E（納品ケース表 integration_test/e2e/m01_01_admin_login_login_e2e_cases.md と1:1）。
 * 期待結果は仕様(m01-01_admin_login_login.md 表示メッセージ節)由来（オラクル独立性。実装/翻訳ファイル由来の値で固定しない）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - SEED-M01-* を e2e/seed/lib/apply.sh で投入し、seed-env.sh の M01_* 契約を使う。
 *  - 認証失敗系は試行制限カウンタを進めるため、専用シードアカウントで実行する。
 *  - RateLimiter状態や可視UIが未特定の間接確認のみ test.fixme（理由付き）で保留する。
 *
 * 資格情報: M01_ADMIN_USER / M01_ADMIN_PASS 等（manifest由来。コミットしない）。
 */
import { test, expect, Page, Locator } from "@playwright/test";
import { AdminLoginPage } from "../../pages/admin/login.page";
import { SystemSettingSettingSystemLoginHistoryPage } from "../../pages/admin/m11/m11_04_admin_system_setting_setting_system_login_history.page";
import { FrontMemberLoginPage } from "../../pages/front/f06/f06_03_front_member_customer_login.page";
import { ECCUBE_ADMIN_ROUTE, E2E_BASE_URL } from "../../config/default.config";
import {
  M01_ADMIN_USER,
  M01_ADMIN_PASS,
  M01_DISABLED_USER,
  M01_DISABLED_PASS,
  M01_2FA_USER,
  M01_2FA_PASS,
  M01_CUSTOMER_EMAIL,
  M01_CUSTOMER_PASS,
  M01_LOCK_USER,
  M01_LOCK_PASS,
  seedMissing,
} from "../../config/seed.config";

const HAS_ADMIN_SEED = !seedMissing(M01_ADMIN_USER, M01_ADMIN_PASS);
const HAS_DISABLED_SEED = !seedMissing(M01_DISABLED_USER, M01_DISABLED_PASS);
const HAS_2FA_SEED = !seedMissing(M01_2FA_USER, M01_2FA_PASS);
const HAS_CUSTOMER_SEED = !seedMissing(M01_CUSTOMER_EMAIL, M01_CUSTOMER_PASS);
const HAS_LOCK_SEED = !seedMissing(M01_LOCK_USER, M01_LOCK_PASS);

// 仕様(m01-01_admin_login_login.md 表示メッセージ「認証失敗（2行）」)由来。実装に合わせて変えない。
const FAIL_L1 = "ログインできませんでした。";
const FAIL_L2 = "入力内容に誤りがないかご確認ください。";
const REQUIRED_MESSAGES = [
  "このフィールドを入力してください。",
  "Please fill out this field.",
];

// ホーム画面相当（admin_homepage = /<route>/ ）。設計書「判定順序#8: 管理セッションを確立しホーム画面へ遷移」由来。
const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);
const AUTH_RE = /\/two_factor_auth\/auth(\?|$)/;
const LOGIN_RE = /\/login(\?|$)/;
const REMEMBER_COOKIE = "eccube_admin_remember_me";

async function expectAuthFailure2Lines(page: Page) {
  const err = page.locator(".text-danger");
  await expect(err).toContainText(FAIL_L1);
  await expect(err).toContainText(FAIL_L2); // 2行目欠落も検出
  await expect(page.locator("#login_id")).toBeVisible(); // ログイン画面に留まる
}

async function expectRequiredField(locator: Locator) {
  await expect(locator).toBeFocused();
  await expect
    .poll(() => locator.evaluate((el) => (el as HTMLInputElement).validity.valueMissing))
    .toBe(true);
  const message = await locator.evaluate((el) => (el as HTMLInputElement).validationMessage);
  expect(REQUIRED_MESSAGES).toContain(message);
}

async function loginAs(page: Page, user: string, pass: string) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(user, pass);
}

async function logoutIfLoggedIn(page: Page) {
  if (await page.locator("#login_id").isVisible().catch(() => false)) return;
  await page.locator(".c-headerBar__userMenu").click();
  await page.getByRole("link", { name: "ログアウト" }).click();
  await expect(page.locator("#login_id")).toBeVisible();
}

test.describe("管理画面 > ログイン", { tag: ["@admin", "@auth"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M01-01-003 初期表示: ID/PW/ログインボタンが表示される", async ({ page }) => {
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.seeLoginForm();
  });

  test("E2E-M01-01-004 初期表示: プレースホルダが「ログインID」「パスワード」", async ({ page }) => {
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await expect(lp.loginId).toHaveAttribute("placeholder", "ログインID");
    await expect(lp.password).toHaveAttribute("placeholder", "パスワード");
  });

  test("E2E-M01-01-013 未ログインで保護URL→ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 認証あり（資格情報があるときのみ実行） =====

  test("E2E-M01-01-001 正常: 正しいID/PWでホーム画面へ遷移する", async ({ page }) => {
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定（M01_ADMIN_USER/PASS）");
    await loginAs(page, M01_ADMIN_USER, M01_ADMIN_PASS);
    await expect(page).not.toHaveURL(/\/login(\?|$)/); // ログイン画面から遷移
    await expect(page).toHaveURL(HOME_RE); // 設計書: ホーム画面へ遷移（到達URLで確認）
    await expect(page.locator("#login_id")).toBeHidden();
  });

  test("E2E-M01-01-010 異常: ID未入力で必須入力バリデーション", async ({ page }) => {
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login("", M01_ADMIN_PASS);
    await expectRequiredField(lp.loginId);
    await expect(page.locator(".text-danger")).toHaveCount(0);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M01-01-011 異常: PW未入力で必須入力バリデーション", async ({ page }) => {
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(M01_ADMIN_USER, "");
    await expectRequiredField(lp.password);
    await expect(page.locator(".text-danger")).toHaveCount(0);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M01-01-040 異常: 存在しないID→同一の認証失敗(2行)", async ({ page }) => {
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login("e2e_no_such_admin", "whatever");
    await expectAuthFailure2Lines(page);
  });

  test("E2E-M01-01-060 異常: パスワード不一致→認証失敗(2行)", async ({ page }) => {
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(M01_ADMIN_USER, "definitely_wrong_pass");
    await expectAuthFailure2Lines(page);
  });

  test("E2E-M01-01-002 ログイン済みでログインURL→ホーム", async ({ page }) => {
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(M01_ADMIN_USER, M01_ADMIN_PASS);
    await expect(page.locator("#login_id")).toBeHidden();
    await lp.goto(); // 再度 /admin/login
    await expect(page).not.toHaveURL(/\/login(\?|$)/);
    await expect(page).toHaveURL(HOME_RE); // 設計書: ログイン済みはホーム画面へリダイレクト
  });

  test("E2E-M01-01-080 ログアウト→ログイン画面へ", async ({ page }) => {
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定");
    await loginAs(page, M01_ADMIN_USER, M01_ADMIN_PASS);
    await expect(page.locator("#login_id")).toBeHidden();
    await page.locator(".c-headerBar__userMenu").click();
    await page.getByRole("link", { name: "ログアウト" }).click();
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化） =====

  test("E2E-M01-01-012 ログインID最大長50は文字数エラーにならない", async ({ page }) => {
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login("a".repeat(50), "whatever");
    await expectAuthFailure2Lines(page);
    await expect(page.locator("body")).not.toContainText(/文字数|長すぎ|50文字/);
  });

  test("E2E-M01-01-020 CSRFトークン改ざんで認証失敗(2行)", async ({ page }) => {
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.loginId.fill(M01_ADMIN_USER);
    await lp.password.fill(M01_ADMIN_PASS);
    await page.locator('input[name="_csrf_token"]').evaluate((el) => {
      (el as HTMLInputElement).value = "e2e-invalid-csrf-token";
    });
    await lp.loginButton.click();
    await expectAuthFailure2Lines(page);
  });

  test("E2E-M01-01-050 停止中管理者は認証失敗", async ({ page }) => {
    test.skip(!HAS_DISABLED_SEED, "SEED-M01-DISABLED 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(M01_DISABLED_USER, M01_DISABLED_PASS);
    await expectAuthFailure2Lines(page);
  });

  test("E2E-M01-01-014 一般フロント会員は管理保護画面を利用不可", async ({ page }) => {
    test.skip(!HAS_CUSTOMER_SEED, "SEED-M01-CUSTOMER 未設定");
    const front = new FrontMemberLoginPage(page);
    await front.gotoLoginPage();
    await front.fillAndSubmit(M01_CUSTOMER_EMAIL, M01_CUSTOMER_PASS);
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
    await expect(page.locator("#login_id")).toBeVisible();
    await expect(page).toHaveURL(LOGIN_RE);
  });

  test.fixme("E2E-M01-01-030 試行制限到達で『{N}分後に』表示（要データ生成・専用IP/アカウント・リミッタ初期化）", async () => {});
  test.fixme("E2E-M01-01-031 分数なしの制限メッセージ（手動・条件再現が不安定）", async () => {});

  test("E2E-M01-01-032 成功で試行回数リセット", async ({ page }) => {
    test.skip(!HAS_LOCK_SEED, "SEED-M01-LOCK 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(M01_LOCK_USER, "wrong-before-success-1");
    await expectAuthFailure2Lines(page);
    await lp.login(M01_LOCK_USER, "wrong-before-success-2");
    await expectAuthFailure2Lines(page);
    await lp.login(M01_LOCK_USER, M01_LOCK_PASS);
    await expect(page).toHaveURL(HOME_RE);
    await logoutIfLoggedIn(page);
    await lp.login(M01_LOCK_USER, "wrong-after-reset-1");
    await expectAuthFailure2Lines(page);
  });

  test("E2E-M01-01-070 2FA有効ユーザーは追加認証画面へ", async ({ page }) => {
    test.skip(!HAS_2FA_SEED, "SEED-M01-2FA-ON 未設定");
    await loginAs(page, M01_2FA_USER, M01_2FA_PASS);
    await expect(page).toHaveURL(AUTH_RE);
  });

  test("E2E-M01-01-071 追加認証完了まで保護画面を利用できない", async ({ page }) => {
    test.skip(!HAS_2FA_SEED, "SEED-M01-2FA-ON 未設定");
    await loginAs(page, M01_2FA_USER, M01_2FA_PASS);
    await expect(page).toHaveURL(AUTH_RE);
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
    await expect(page).toHaveURL(AUTH_RE);
  });

  test("E2E-M01-01-081 Remember Me有効で状態再確立", async ({ browser }) => {
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定");
    const context = await browser.newContext({ baseURL: E2E_BASE_URL });
    const page = await context.newPage();
    await loginAs(page, M01_ADMIN_USER, M01_ADMIN_PASS);
    await expect(page).toHaveURL(HOME_RE);
    const remember = (await context.cookies()).find((c) => c.name === REMEMBER_COOKIE);
    expect(remember, `${REMEMBER_COOKIE} が付与されること`).toBeTruthy();

    const rememberOnly = {
      ...remember!,
      domain: new URL(E2E_BASE_URL).hostname,
    };
    await context.close();

    const resumed = await browser.newContext({ baseURL: E2E_BASE_URL });
    await resumed.addCookies([rememberOnly]);
    const resumedPage = await resumed.newPage();
    await resumedPage.goto(`/${ECCUBE_ADMIN_ROUTE}/login`);
    await expect(resumedPage).toHaveURL(HOME_RE);
    await expect(resumedPage.locator("#login_id")).toBeHidden();
    await resumed.close();
  });

  test("E2E-M01-01-090 成功時ログイン履歴に成功記録", async ({ page }) => {
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定");
    await loginAs(page, M01_ADMIN_USER, M01_ADMIN_PASS);
    const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
    await lh.goto();
    await lh.searchUserName(M01_ADMIN_USER);
    const row = lh.rowContaining(M01_ADMIN_USER).filter({ hasText: "成功" }).first();
    await expect(row).toContainText("成功");
  });

  test("E2E-M01-01-091 失敗時ログイン履歴に失敗記録", async ({ page }) => {
    const failedUser = `e2e_no_such_admin_${Date.now()}`;
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(failedUser, "whatever");
    await expectAuthFailure2Lines(page);
    test.skip(!HAS_ADMIN_SEED, "SEED-M01-ADMIN 未設定");
    await loginAs(page, M01_ADMIN_USER, M01_ADMIN_PASS);
    const lh = new SystemSettingSettingSystemLoginHistoryPage(page);
    await lh.goto();
    await lh.searchUserName(failedUser);
    const row = lh.rowContaining(failedUser).first();
    await expect(row).toContainText("失敗");
  });

  test.fixme("E2E-M01-01-092 成功時に最終ログイン日時更新（要: login_dateを確認できる可視UIの確定）", async () => {});
});
