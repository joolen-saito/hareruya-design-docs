/**
 * 管理ログイン E2E（納品ケース表 integration_test/e2e/m01_01_admin_login_login_e2e_cases.md と1:1）。
 * 期待結果は仕様(m01-01_admin_login_login.md 表示メッセージ節)由来（オラクル独立性。実装/翻訳ファイル由来の値で固定しない）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 資格情報が無いと走らないように test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 認証失敗系は試行制限カウンタを進めるため、専用アカウント/IPでの実行を推奨（連続実行で5回/30分に注意）。
 *  - 試行制限ロック・シード依存(停止/2FA/会員)・別画面の間接確認・最大長等は test.fixme（理由付き）で保留。
 *
 * 資格情報: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（環境変数。コミットしない）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../pages/admin/login.page";
import { ECCUBE_ADMIN_ROUTE } from "../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 仕様(m01-01_admin_login_login.md 表示メッセージ「認証失敗（2行）」)由来。実装に合わせて変えない。
const FAIL_L1 = "ログインできませんでした。";
const FAIL_L2 = "入力内容に誤りがないかご確認ください。";

// ホーム画面相当（admin_homepage = /<route>/ ）。設計書「判定順序#8: 管理セッションを確立しホーム画面へ遷移」由来。
const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);

async function expectAuthFailure2Lines(page: Page) {
  const err = page.locator(".text-danger");
  await expect(err).toContainText(FAIL_L1);
  await expect(err).toContainText(FAIL_L2); // 2行目欠落も検出
  await expect(page.locator("#login_id")).toBeVisible(); // ログイン画面に留まる
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
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    await expect(page).not.toHaveURL(/\/login(\?|$)/); // ログイン画面から遷移
    await expect(page).toHaveURL(HOME_RE); // 設計書: ホーム画面へ遷移（到達URLで確認）
    await expect(page.locator("#login_id")).toBeHidden();
  });

  test("E2E-M01-01-010 異常: ID未入力で認証失敗(2行)", async ({ page }) => {
    test.skip(!HAS_CREDS, "認証フロー。試行制限に注意（専用アカウント推奨）");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login("", ADMIN_PASS);
    await expectAuthFailure2Lines(page);
  });

  test("E2E-M01-01-011 異常: PW未入力で認証失敗(2行)", async ({ page }) => {
    test.skip(!HAS_CREDS, "認証フロー。試行制限に注意");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, "");
    await expectAuthFailure2Lines(page);
  });

  test("E2E-M01-01-040 異常: 存在しないID→同一の認証失敗(2行)", async ({ page }) => {
    test.skip(!HAS_CREDS, "認証フロー。試行制限に注意（専用IP/アカウント推奨）");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login("e2e_no_such_admin", "whatever");
    await expectAuthFailure2Lines(page);
  });

  test("E2E-M01-01-060 異常: パスワード不一致→認証失敗(2行)", async ({ page }) => {
    test.skip(!HAS_CREDS, "認証フロー。試行制限に注意");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, "definitely_wrong_pass");
    await expectAuthFailure2Lines(page);
  });

  test("E2E-M01-01-002 ログイン済みでログインURL→ホーム", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    await expect(page.locator("#login_id")).toBeHidden();
    await lp.goto(); // 再度 /admin/login
    await expect(page).not.toHaveURL(/\/login(\?|$)/);
    await expect(page).toHaveURL(HOME_RE); // 設計書: ログイン済みはホーム画面へリダイレクト
  });

  test("E2E-M01-01-080 ログアウト→ログイン画面へ", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(ADMIN_USER, ADMIN_PASS);
    await expect(page.locator("#login_id")).toBeHidden();
    await page.locator(".c-headerBar__userMenu").click();
    await page.getByRole("link", { name: "ログアウト" }).click();
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化） =====

  test.fixme("E2E-M01-01-012 ログインID最大長50は文字数エラーにならない（手動/maxlength属性・低価値）", async () => {});
  test.fixme("E2E-M01-01-020 CSRFトークン改ざんで認証失敗(2行)（DOM改ざん・要実機検証）", async () => {});
  test.fixme("E2E-M01-01-050 停止中管理者は認証失敗（要シード SEED-M01-DISABLED）", async () => {});
  test.fixme("E2E-M01-01-014 一般フロント会員は管理保護画面を利用不可（要シード SEED-M01-CUSTOMER）", async () => {});
  test.fixme("E2E-M01-01-030 試行制限到達で『{N}分後に』表示（要データ生成・専用IP/アカウント・リミッタ初期化）", async () => {});
  test.fixme("E2E-M01-01-031 分数なしの制限メッセージ（手動・条件再現が不安定）", async () => {});
  test.fixme("E2E-M01-01-032 成功で試行回数リセット（手動/間接）", async () => {});
  test.fixme("E2E-M01-01-070 2FA有効ユーザーは追加認証画面へ（要シード SEED-M01-2FA-ON）", async () => {});
  test.fixme("E2E-M01-01-071 追加認証完了まで保護画面を利用できない（要シード SEED-M01-2FA-ON）", async () => {});
  test.fixme("E2E-M01-01-081 Remember Me有効で状態再確立（要シード・Remember Me Cookie）", async () => {});
  test.fixme("E2E-M01-01-090 成功時ログイン履歴に成功記録（手動/間接・別画面 login_history）", async () => {});
  test.fixme("E2E-M01-01-091 失敗時ログイン履歴に失敗記録（手動/間接・別画面）", async () => {});
  test.fixme("E2E-M01-01-092 成功時に最終ログイン日時更新（手動/間接・要実機UI）", async () => {});
});
