/**
 * フロント 会員「本店・支店で会員ログイン」（F06-03）E2E。
 * integration_test/e2e/f06_03_front_member_customer_login_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-03_front_member_customer_login.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 会員資格情報は ECCUBE_FRONT_USER/PASS（未設定時は認証必須ケースを test.skip）。
 * 要シード/要ログイン/要2ドメイン/要隔離のケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberLoginPage } from "../../../pages/front/f06/f06_03_front_member_customer_login.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 会員 > 本店・支店で会員ログイン", { tag: ["@front", "@member"] }, () => {
  test("E2E-F06-03-003 ログイン画面の初期表示でUI部品が表示される", async ({ page }) => {
    const login = new FrontMemberLoginPage(page);
    await login.gotoLoginPage();
    await login.seeLoginScreen();
  });

  test("E2E-F06-03-004 ログイン画面に案内文と各リンクが表示される", async ({ page }) => {
    const login = new FrontMemberLoginPage(page);
    await login.gotoLoginPage();
    await expect(login.body).toContainText("メールアドレスとパスワードを入力してログインしてください");
    await expect(login.forgotLink).toBeVisible();
    await expect(login.entryButton).toBeVisible();
  });

  test("E2E-F06-03-005 旧サイト会員向けパスワード再設定案内が表示される", async ({ page }) => {
    const login = new FrontMemberLoginPage(page);
    await login.gotoLoginPage();
    await expect(login.body).toContainText("パスワード再設定");
  });

  test("E2E-F06-03-024 メール未入力で送信するとクライアント側チェックで送信前に止まる", async ({ page }) => {
    const login = new FrontMemberLoginPage(page);
    await login.gotoLoginPage();
    await login.passwordInput.fill("dummyPassw0rd");
    await login.loginButton.click();
    // 送信前チェックによりログイン画面に留まる（ダイアログ/HTML5/インラインいずれの実装でも遷移しない）。
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
  });

  test("E2E-F06-03-025 パスワード未入力で送信するとクライアント側チェックで送信前に止まる", async ({ page }) => {
    const login = new FrontMemberLoginPage(page);
    await login.gotoLoginPage();
    await login.emailInput.fill("e2e-noexist@example.test");
    await login.loginButton.click();
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
  });

  test("E2E-F06-03-050 存在しないメールアドレスでは共通の認証失敗文言となる", async ({ page }) => {
    const login = new FrontMemberLoginPage(page);
    await login.gotoLoginPage();
    await login.fillAndSubmit("e2e-noexist-" + "user@example.test", "wrongPassw0rd");
    await login.seeAuthFailureMessage();
  });

  test("E2E-F06-03-016 会員情報登録ボタンから会員登録画面へ遷移する", async ({ page }) => {
    const login = new FrontMemberLoginPage(page);
    await login.gotoLoginPage();
    await login.entryButton.click();
    await expect(page).toHaveURL(/\/entry(?:\/|\?|$)/);
  });

  test("E2E-F06-03-017 パスワード忘れリンクからパスワード再発行画面へ遷移する", async ({ page }) => {
    const login = new FrontMemberLoginPage(page);
    await login.gotoLoginPage();
    await login.forgotLink.click();
    await expect(page).toHaveURL(/\/forgot(?:\/|\?|$)/);
  });

  test("E2E-F06-03-021 未ログインで会員機能URLへ直接アクセスするとログイン画面へ誘導される", async ({ page }) => {
    const login = new FrontMemberLoginPage(page);
    await login.gotoMypage();
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(login.passwordInput).toBeVisible();
  });

  // --- 要シード/要ログイン/要実機。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F06-03-001 正しいメール/パスワードでログインしマイページへ遷移する（要: SEED-F06-03-CUSTOMER/会員資格情報）", async () => {});
  test.fixme("E2E-F06-03-051 パスワード不一致で共通の認証失敗文言となる（要: SEED-F06-03-CUSTOMER）", async () => {});
  test.fixme("E2E-F06-03-002 ログイン済みでログインURLを開くとマイページへ遷移する（要: 会員ログイン状態）", async () => {});
  test.fixme("E2E-F06-03-018 ログアウトするとトップへ戻る（要: 会員ログイン状態）", async () => {});
  test.fixme("E2E-F06-03-006 Remember Me設定が有効な店舗でログイン保持チェックが表示される（要: SEED-F06-03-REMEMBER 店舗設定）", async () => {});
  test.fixme("E2E-F06-03-020 なりすまし対策トークン改ざんで共通の認証失敗文言となる（要: DOM改ざん/実機挙動確認）", async () => {});
  test.fixme("E2E-F06-03-030 メール最大長320文字でも文字数エラーとならない（要: 実機フォーム制約確認）", async () => {});
  test.fixme("E2E-F06-03-056 試行制限到達で制限メッセージが表示され入力欄が出ない（要: SEED-F06-03-LOCK/隔離）", async () => {});
  test.fixme("E2E-F06-03-019 支店側で正当な共有トークンを保持すると自動ログイン状態が再確立される（要: 2ドメイン/共有トークン）", async () => {});
  test.fixme("E2E-F06-03-090 ログイン成立時に共有トークン用Cookieが発行される（要: ログイン成功/Cookie確認）", async () => {});

  // creds があれば live 化する成功系（環境が整うまでは skip）
  test("E2E-F06-03-001-live 会員資格情報がある環境ではログインしマイページへ遷移する", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const login = new FrontMemberLoginPage(page);
    await login.login();
    await expect(page).toHaveURL(/\/mypage(?:\/|\?|$)/);
  });
});
