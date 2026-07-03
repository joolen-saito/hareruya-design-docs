/**
 * フロント 店頭買取「査定申込前ログイン」（F08-01）E2E。
 * integration_test/e2e/f08_01_front_store_purchase_otc_buy_entry_login_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f08-01_front_store_purchase_otc_buy_entry_login.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本画面は店舗ごとURL /otcbuy/{name}/entry で開くため、店舗識別子 ECCUBE_FRONT_SHOP を要する
 * （未設定時は店舗依存ケースを test.skip）。会員資格情報は ECCUBE_FRONT_USER/PASS。
 * 要シード/要ログイン/要実機のケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontStorePurchaseOtcBuyEntryLoginPage } from "../../../pages/front/f08/f08_01_front_store_purchase_otc_buy_entry_login.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_SHOP, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_STORE = !!ECCUBE_FRONT_SHOP;
const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 店頭買取 > 査定申込前ログイン", { tag: ["@front", "@otcbuy"] }, () => {
  test("E2E-F08-01-007 査定申込前ログイン画面でログインフォームのUI部品が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    await entry.gotoEntry();
    await entry.seeEntryScreen();
  });

  test("E2E-F08-01-008 言語切替とゲスト導線リンクが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    await entry.gotoEntry();
    await expect(entry.guestLink).toBeVisible();
    await expect(entry.langSwitch).toBeVisible();
  });

  test("E2E-F08-01-014 未ログインでentryを開くとログインフォームが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    await entry.gotoEntry();
    // 未ログインでは（ログアウトへ転送されず）そのままログインフォームを表示する。
    await expect(page).toHaveURL(/\/otcbuy\/[^/]+\/entry/);
    await expect(entry.passwordInput).toBeVisible();
  });

  test("E2E-F08-01-013 メール・パスワード未入力で送信すると送信前チェックでentryに留まる", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    await entry.gotoEntry();
    await entry.submitButton.click();
    // 送信時の入力チェックにより entry 画面に留まる（ダイアログ/HTML5/インラインいずれの実装でも申込フォームへ進まない）。
    await expect(page).toHaveURL(/\/otcbuy\/[^/]+\/entry/);
    await expect(entry.passwordInput).toBeVisible();
  });

  test("E2E-F08-01-024 メール未入力で送信すると送信前チェックでentryに留まる", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    await entry.gotoEntry();
    await entry.passwordInput.fill("dummyPassw0rd");
    await entry.submitButton.click();
    await expect(page).toHaveURL(/\/otcbuy\/[^/]+\/entry/);
  });

  test("E2E-F08-01-025 パスワード未入力で送信すると送信前チェックでentryに留まる", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    await entry.gotoEntry();
    await entry.emailInput.fill("e2e-otcbuy-noexist@example.test");
    await entry.submitButton.click();
    await expect(page).toHaveURL(/\/otcbuy\/[^/]+\/entry/);
  });

  test("E2E-F08-01-018 誤った資格情報で送信するとentryへ戻る（ログイン失敗の入口）", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    await entry.gotoEntry();
    await entry.fillAndSubmit("e2e-otcbuy-noexist@example.test", "wrongPassw0rd");
    // ログイン失敗時は本画面（entry）へ戻る。失敗理由の文言は会員ログイン機能を正とするため文言は断定しない。
    await expect(page).toHaveURL(/\/otcbuy\/[^/]+\/entry/);
    await expect(entry.passwordInput).toBeVisible();
  });

  test("E2E-F08-01-016 ゲスト導線リンクから当該店舗の申込フォームへ遷移する", async ({ page }) => {
    test.skip(!HAS_FRONT_STORE, "ECCUBE_FRONT_SHOP（店舗識別子）未設定");
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    await entry.gotoEntry();
    await entry.guestLink.click();
    // 「アカウントをお持ちでない方はこちら」→ /otcbuy/{name}（entryを含まない申込フォーム）。
    await expect(page).toHaveURL(/\/otcbuy\/[^/]+(?:\/(?!entry)|\?|$)/);
  });

  test("E2E-F08-01-022 不正な店舗識別子のentry URLは404となる", async ({ page }) => {
    // 実在しない店舗識別子は「ページが見つからない扱い（404）」。店舗シード不要で実行できる。
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    const res = await page.goto(entry.invalidStoreEntryUrl);
    expect(res?.status()).toBe(404);
  });

  // --- 要ログイン/要シード/要実機。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme(
    "E2E-F08-01-009 正しい資格情報でログインし当該店舗の査定申込フォームへ遷移する（要: 会員資格情報/店舗）",
    async () => {},
  );
  test.fixme(
    "E2E-F08-01-015 ログイン済み会員がentryを開くとログアウトへ遷移する（要: 会員ログイン状態/店舗）",
    async () => {},
  );
  test.fixme(
    "E2E-F08-01-023 既ログイン状態で開くと認証状態が解除されログイン前状態から開始する（要: 会員ログイン状態/店舗）",
    async () => {},
  );
  test.fixme(
    "E2E-F08-01-001 なりすまし対策トークン改ざんで認証失敗しentryへ戻る（要: DOM改ざん/実機挙動確認/店舗）",
    async () => {},
  );

  // creds＋store があれば live 化する成功系（環境が整うまでは skip）
  test("E2E-F08-01-009-live 資格情報がある環境ではログインし申込フォームへ遷移する", async ({ page }) => {
    test.skip(!(HAS_FRONT_STORE && HAS_FRONT_CREDS), "ECCUBE_FRONT_SHOP または ECCUBE_FRONT_USER/PASS 未設定");
    const entry = new FrontStorePurchaseOtcBuyEntryLoginPage(page);
    await entry.loginWithConfiguredCreds();
    // 成功時は当該店舗の申込フォーム /otcbuy/{name}（entry を含まない）へ遷移する。
    await expect(page).toHaveURL(/\/otcbuy\/[^/]+(?:\/(?!entry)|\?|$)/);
  });
});
