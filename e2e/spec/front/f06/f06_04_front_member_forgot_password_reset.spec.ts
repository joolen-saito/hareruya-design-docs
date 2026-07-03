/**
 * フロント 会員「パスワード再発行・再設定（パスワードをお忘れの方）」（F06-04）E2E。
 * integration_test/e2e/f06_04_front_member_forgot_password_reset_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-04_front_member_forgot_password_reset.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本機能は非ログイン。再発行URL（リセットキー）経由の再設定・更新はメール受信/有効キーが前提のため、
 * 要有効リセットキー/要シード/要メール/要実機のケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontForgotPasswordPage } from "../../../pages/front/f06/f06_04_front_member_forgot_password_reset.page";

test.describe("フロント > 会員 > パスワード再発行・再設定", { tag: ["@front", "@member"] }, () => {
  // --- 非ログイン・シード不要で走る live ケース ---
  test("E2E-F06-04-007 再発行画面の初期表示でUI部品が表示される", async ({ page }) => {
    const forgot = new FrontForgotPasswordPage(page);
    await forgot.gotoForgot();
    await forgot.seeForgotScreen();
  });

  test("E2E-F06-04-010 再発行画面に再発行案内文が表示される", async ({ page }) => {
    const forgot = new FrontForgotPasswordPage(page);
    await forgot.gotoForgot();
    // 期待文言は設計書「表示メッセージ（再発行案内）」由来。
    await expect(forgot.body).toContainText("ご登録時のメールアドレスを入力して");
  });

  test("E2E-F06-04-011 再発行完了画面に送信完了案内が表示される", async ({ page }) => {
    const forgot = new FrontForgotPasswordPage(page);
    await forgot.gotoComplete();
    await forgot.seeCompleteScreen();
  });

  test("E2E-F06-04-024 メール未入力で送信すると再発行画面に留まる", async ({ page }) => {
    const forgot = new FrontForgotPasswordPage(page);
    await forgot.gotoForgot();
    await forgot.nextButton.click();
    // 検証失敗時は再発行画面を再表示する（設計書 処理フロー#1）。実装形（HTML5/サーバ）に依らず遷移しない。
    await expect(page).toHaveURL(/\/forgot(?:\?|$)/);
    await expect(forgot.forgotHeading).toBeVisible();
  });

  test("E2E-F06-04-033 メール形式不正で送信すると再発行画面に留まる", async ({ page }) => {
    const forgot = new FrontForgotPasswordPage(page);
    await forgot.gotoForgot();
    await forgot.emailInput.fill("abc");
    await forgot.nextButton.click();
    await expect(page).toHaveURL(/\/forgot(?:\?|$)/);
    await expect(forgot.forgotHeading).toBeVisible();
  });

  test("E2E-F06-04-015 該当会員が無いメールでも再発行完了画面へ遷移する（存在秘匿）", async ({ page }) => {
    const forgot = new FrontForgotPasswordPage(page);
    await forgot.gotoForgot();
    await forgot.submitForgot("e2e-noexist-" + Date.now() + "@example.test");
    // 会員の有無を区別せず再発行完了画面へ遷移する（業務ルール：会員の存在秘匿）。
    await forgot.seeCompleteScreen();
  });

  test("E2E-F06-04-016 再発行完了画面の「ホームへ戻る」でトップへ遷移する", async ({ page }) => {
    const forgot = new FrontForgotPasswordPage(page);
    await forgot.gotoComplete();
    await forgot.homeLink.click();
    await expect(page).toHaveURL(new RegExp(`${forgot.localePrefix}/?(?:\\?|$)`));
  });

  test("E2E-F06-04-021 不正なリセットキーで再設定URLへ直接アクセスするとエラー画面となる", async ({ page }) => {
    const forgot = new FrontForgotPasswordPage(page);
    await forgot.gotoReset("invalid-key");
    // 新パスワード入力フォームを表示せず、共通エラー画面となる（判定順序1/2）。
    await forgot.seeResetErrorScreen();
  });

  // --- 要有効リセットキー/要シード/要メール/要実機。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F06-04-008 再発行画面のメール欄に必須表示が付く（要: 実機での必須表示マークアップ確認）", async () => {});
  test.fixme("E2E-F06-04-004 正当なリセットキーで再設定画面（新パスワード欄）が表示される（要: SEED-F06-04-RESETKEY）", async () => {});
  test.fixme("E2E-F06-04-012 再設定画面に再設定案内文が表示される（要: SEED-F06-04-RESETKEY）", async () => {});
  test.fixme("E2E-F06-04-014 新しいパスワード（確認）欄への貼り付けが抑止される（要: SEED-F06-04-RESETKEY/実機JS）", async () => {});
  test.fixme("E2E-F06-04-026 新しいパスワード最大長32文字なら検証を通過する（要: SEED-F06-04-RESETKEY）", async () => {});
  test.fixme("E2E-F06-04-029 新しいパスワード8文字未満で検証エラー・再設定画面再表示（要: SEED-F06-04-RESETKEY）", async () => {});
  test.fixme("E2E-F06-04-053 新しいパスワードと確認が不一致で検証エラー・再設定画面再表示（要: SEED-F06-04-RESETKEY）", async () => {});
  test.fixme("E2E-F06-04-005 正当な入力でパスワード更新し更新完了画面が表示される（要: SEED-F06-04-RESETKEY/更新実行）", async () => {});
  test.fixme("E2E-F06-04-018 更新成功後の同一URL再アクセスはキー消去によりエラー画面（要: SEED-F06-04-RESETKEY/更新実行）", async () => {});
  test.fixme("E2E-F06-04-001 更新POSTの_token改ざんで更新されない（要: SEED-F06-04-RESETKEY/DOM改ざん/実機）", async () => {});

  // --- 手動/間接（DB確認）。ケース表で全量管理し、抜け漏れ可視化のため fixme で残す ---
  test.fixme("E2E-F06-04-062 更新時に新パスワードがソルトで暗号化保存される（要: DB間接確認/更新実行）", async () => {});
  test.fixme("E2E-F06-04-076 更新成功時に対象会員のパスワードが変更される（要: DB間接確認/更新実行）", async () => {});
});
