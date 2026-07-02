/**
 * 管理画面 二段階認証 E2E。納品ケース表 integration_test/e2e/m01_02_admin_login_two_factor_auth_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、056/080は test.fixme、091等の手動/間接はケース表で全量管理する
 * （ケース表とspecは完全1:1ではない＝規約「手動/対象外はspecに残さない」に従う）。
 * 期待結果は仕様(m01-02_admin_login_two_factor_auth.md / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts も @playwright/test を直接使う。本機能は複数のシード管理者（SECRET/NOSECRET/OFF）を
 * 切り替える必要があるため、単一 loginPage fixture では表現しづらい。既存リポ規約（login.spec.ts）に倣い
 * @playwright/test + AdminLoginPage 直利用とする（規約逸脱の理由を明記）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - シード/秘密鍵が無いと走らないように test.skip でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 追加認証POSTは試行制限(5回/30分・ユーザー単位)を進めるため、専用アカウント/IP隔離での実行を推奨。
 *  - 本人再設定成功(012)は秘密鍵を破壊するため、共通SECRETとは別の使い捨てアカウント(RESET)を用いる。
 *  - 試行制限ロック・別画面(メンバー一覧/編集)の間接確認・Cookie期限切れ等は test.fixme / ケース表で管理。
 *
 * シード資格情報（環境変数。コミットしない）:
 *  - SEED-M01-02-2FA-SECRET   : TFA_USER / TFA_PASS / TFA_SECRET（個別2FA ON・秘密鍵設定済・既知base32秘密鍵）
 *  - SEED-M01-02-2FA-NOSECRET : TFA_NS_USER / TFA_NS_PASS（個別2FA ON・秘密鍵未設定・参照系。破壊しない）
 *  - SEED-M01-02-2FA-NOSECRET-ONCE : TFA_NS_ONCE_USER / TFA_NS_ONCE_PASS（個別2FA ON・秘密鍵未設定・初回設定成功011で破壊する使い捨て）
 *  - SEED-M01-02-2FA-OFF      : TFA_OFF_USER / TFA_OFF_PASS（個別2FA OFF）
 *  - SEED-M01-02-2FA-RESET    : TFA_RESET_USER / TFA_RESET_PASS / TFA_RESET_SECRET（本人再設定の使い捨て・秘密鍵設定済）
 *  - 認証済みCookie名は仕様固定でないため判定に用いない（HttpOnly属性と新規付与のみをオラクルとする）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../pages/admin/login.page";
import { AdminTwoFactorAuthPage } from "../../pages/admin/two_factor_auth.page";
import { ECCUBE_ADMIN_ROUTE } from "../../config/default.config";
import { currentTotp, mismatchTotp } from "../../helpers/totp";

// SEED-M01-02-2FA-SECRET（秘密鍵設定済）
const TFA_USER = process.env.TFA_USER || "";
const TFA_PASS = process.env.TFA_PASS || "";
const TFA_SECRET = process.env.TFA_SECRET || "";
const HAS_SECRET = !!(TFA_USER && TFA_PASS && TFA_SECRET);
// SEED-M01-02-2FA-NOSECRET（秘密鍵未設定・参照系のみ。初回設定成功で破壊しないこと）
const TFA_NS_USER = process.env.TFA_NS_USER || "";
const TFA_NS_PASS = process.env.TFA_NS_PASS || "";
const HAS_NOSECRET = !!(TFA_NS_USER && TFA_NS_PASS);
// SEED-M01-02-2FA-NOSECRET-ONCE（秘密鍵未設定・初回設定成功で秘密鍵が確定し破壊されるため使い捨て）
// 011 をこの専用アカウントに分離し、共通 NOSECRET(003/030/031/051) の「秘密鍵未設定」状態を壊さない。
const TFA_NS_ONCE_USER = process.env.TFA_NS_ONCE_USER || "";
const TFA_NS_ONCE_PASS = process.env.TFA_NS_ONCE_PASS || "";
const HAS_NOSECRET_ONCE = !!(TFA_NS_ONCE_USER && TFA_NS_ONCE_PASS);
// SEED-M01-02-2FA-OFF（個別2FA OFF）
const TFA_OFF_USER = process.env.TFA_OFF_USER || "";
const TFA_OFF_PASS = process.env.TFA_OFF_PASS || "";
const HAS_OFF = !!(TFA_OFF_USER && TFA_OFF_PASS);
// SEED-M01-02-2FA-RESET（本人再設定の使い捨て・秘密鍵設定済）
const TFA_RESET_USER = process.env.TFA_RESET_USER || "";
const TFA_RESET_PASS = process.env.TFA_RESET_PASS || "";
const TFA_RESET_SECRET = process.env.TFA_RESET_SECRET || "";
const HAS_RESET = !!(TFA_RESET_USER && TFA_RESET_PASS && TFA_RESET_SECRET);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_REINPUT = "トークンに誤りがあります。再度入力してください。"; // :3027 追加認証/TOTP不一致
const ERR_INVALID = "トークンに誤りがあります。数字6桁で入力してください。"; // :3028 初回/再設定の形式不正
const SET_SUCCESS = "2段階認証の設定が完了しました。"; // :3026
const SET_WARNING =
  "既に2段階認証の設定が行われています。再設定すると登録済みのデバイスが使用出来なくなります。"; // :3025
const QR_DESC =
  "QRコードを2段階認証用スマートフォンアプリで読み込み、表示された6桁の数字を入力してください。"; // :3485

const AUTH_RE = /\/two_factor_auth\/auth(\?|$)/;
const SET_RE = /\/two_factor_auth\/set(\?|$)/;
const LOGIN_RE = /\/login(\?|$)/;
// ホーム画面相当（admin_homepage = /<route>/ ）。成功遷移は「ホームへ」を仕様とするため明示確認する。
const HOME_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/?(\\?|$)`);

/** パスワード認証して、ガードにより追加認証画面（秘密鍵あり）へ到達するまで。 */
async function loginToAuthScreen(page: Page, user: string, pass: string) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(user, pass);
  await expect(page).toHaveURL(AUTH_RE); // 判定順序#7: 秘密鍵あり→追加認証
}

/** 指定の秘密鍵設定済アカウントで追加認証まで完了し、認証済みCookieを確立する。 */
async function loginAndPassAuth(
  page: Page,
  user = TFA_USER,
  pass = TFA_PASS,
  secret = TFA_SECRET
) {
  await loginToAuthScreen(page, user, pass);
  const tfa = new AdminTwoFactorAuthPage(page);
  await tfa.submitAuth(currentTotp(secret));
  await expect(page).toHaveURL(HOME_RE); // 成功→ホーム画面相当
}

test.describe("管理画面 > 二段階認証", { tag: ["@admin", "@auth", "@2fa"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M01-02-060 未ログインで追加認証URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/two_factor_auth/auth`);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M01-02-061 未ログインで初回設定/本人再設定URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/two_factor_auth/set`);
    await expect(page.locator("#login_id")).toBeVisible();
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/two_factor_auth/edit`);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 追加認証画面（SEED-M01-02-2FA-SECRET） =====

  test("E2E-M01-02-001 追加認証画面: トークン入力欄・認証ボタン・見出しが表示される", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定（TFA_USER/PASS/SECRET）");
    await loginToAuthScreen(page, TFA_USER, TFA_PASS);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.seeAuthForm();
  });

  test("E2E-M01-02-002 追加認証画面: トークン欄プレースホルダが「トークン」", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginToAuthScreen(page, TFA_USER, TFA_PASS);
    const tfa = new AdminTwoFactorAuthPage(page);
    await expect(tfa.deviceToken).toHaveAttribute("placeholder", "トークン");
  });

  test("E2E-M01-02-010 追加認証成功: 正しい6桁トークンでホームへ遷移", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginToAuthScreen(page, TFA_USER, TFA_PASS);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.submitAuth(currentTotp(TFA_SECRET));
    await expect(page).toHaveURL(HOME_RE); // ホーム画面相当へ遷移
  });

  test("E2E-M01-02-020 追加認証 未入力→再入力メッセージで滞留", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginToAuthScreen(page, TFA_USER, TFA_PASS);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.submitAuth("");
    await expect(tfa.error).toContainText(ERR_REINPUT);
    await expect(page).toHaveURL(AUTH_RE);
  });

  test("E2E-M01-02-021 追加認証 6桁以外→再入力メッセージで滞留", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginToAuthScreen(page, TFA_USER, TFA_PASS);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.submitAuth("12345"); // 6桁未満（形式不正）
    await expect(tfa.error).toContainText(ERR_REINPUT); // 追加認証は理由を区別しない
    await expect(page).toHaveURL(AUTH_RE);
  });

  test("E2E-M01-02-022 追加認証 TOTP不一致→再入力メッセージで滞留", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginToAuthScreen(page, TFA_USER, TFA_PASS);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.submitAuth(mismatchTotp(TFA_SECRET)); // 形式は正しいが不一致
    await expect(tfa.error).toContainText(ERR_REINPUT);
    await expect(page).toHaveURL(AUTH_RE);
  });

  test("E2E-M01-02-050 個別2FA ON・秘密鍵あり・未認証で保護URL→追加認証画面へ誘導", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(TFA_USER, TFA_PASS);
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`); // 保護された管理URL
    await expect(page).toHaveURL(AUTH_RE);
  });

  test("E2E-M01-02-052 秘密鍵設定済が初回設定URL→追加認証画面へ誘導", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(TFA_USER, TFA_PASS);
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/two_factor_auth/set`); // 未認証で /set 直接
    await expect(page).toHaveURL(AUTH_RE); // 判定順序#4
  });

  test("E2E-M01-02-054 追加認証成功後はCookie有効期間内は再認証されない", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginAndPassAuth(page);
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`); // 保護URLへ再アクセス
    await expect(page).toHaveURL(HOME_RE); // 再認証されずホームを利用できる
  });

  test("E2E-M01-02-055 認証済みCookie有効で追加認証URL直接→ホームへ遷移", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginAndPassAuth(page);
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/two_factor_auth/auth`); // 認証済みで直接
    await expect(page).not.toHaveURL(AUTH_RE); // 判定順序#6: 追加認証画面を表示せず
    await expect(page).toHaveURL(HOME_RE); // ホーム画面相当へ
  });

  test("E2E-M01-02-090 追加認証成功時にHttpOnlyの認証済みCookieが付与される", async ({ page, context }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    // baseline は「ID/PW認証後・追加認証画面到達後」に取る（ログインで増えるセッションCookieを混入させない）。
    await loginToAuthScreen(page, TFA_USER, TFA_PASS);
    const before = new Set((await context.cookies()).map((c) => c.name));
    // TOTP送信＝追加認証成功でのみ付与される差分だけを観測する。
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.submitAuth(currentTotp(TFA_SECRET));
    await expect(page).toHaveURL(HOME_RE);
    const added = (await context.cookies()).filter((c) => !before.has(c.name));
    // 認証済みCookie名は仕様固定でないため**名称一致では判定しない**（オラクル独立性）。
    // 設計書由来のオラクル＝「追加認証成功で新規Cookieが付与され、HttpOnly属性を持つ」のみを検証する。
    expect(added.length, "追加認証成功で新規Cookieが付与されること").toBeGreaterThan(0);
    const httpOnlyAdded = added.filter((c) => c.httpOnly === true);
    expect(
      httpOnlyAdded.length,
      "新規付与CookieにHttpOnly属性のもの（認証済みCookie）が含まれること"
    ).toBeGreaterThan(0);
    // Secure/SameSite は SSL強制設定依存のため属性確認は手動（不具合候補#4）。
  });

  test("E2E-M01-02-070 個別2FA ONの管理者はヘッダに「2段階認証 設定」リンクが表示される", async ({
    page,
  }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginAndPassAuth(page);
    await page.locator(".c-headerBar__userMenu").click(); // ポップオーバーを開く（要実機確認）
    await expect(page.getByRole("link", { name: "2段階認証 設定" })).toBeVisible();
  });

  // ===== 初回設定画面（SEED-M01-02-2FA-NOSECRET） =====

  test("E2E-M01-02-003 初回設定画面: QR説明文・QR・トークン欄・登録ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_NOSECRET, "SEED-M01-02-2FA-NOSECRET 未設定（TFA_NS_USER/PASS）");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(TFA_NS_USER, TFA_NS_PASS);
    await expect(page).toHaveURL(SET_RE); // 判定順序#8: 秘密鍵なし→初回設定
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.seeSetForm();
    await expect(page.locator("body")).toContainText(QR_DESC);
  });

  test("E2E-M01-02-011 初回設定成功: 秘密鍵候補から算出した6桁で成功メッセージ表示", async ({ page }) => {
    // 成功で秘密鍵を確定＝NOSECRET状態を破壊するため、共通NOSECRETではなく使い捨てONCEアカウントを使う
    // （012/RESET と同じ分離方針。共通NOSECRETを使う003/030/031/051をフル実行で壊さない）。
    test.skip(!HAS_NOSECRET_ONCE, "SEED-M01-02-2FA-NOSECRET-ONCE 未設定（TFA_NS_ONCE_USER/PASS）");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(TFA_NS_ONCE_USER, TFA_NS_ONCE_PASS);
    await expect(page).toHaveURL(SET_RE);
    const tfa = new AdminTwoFactorAuthPage(page);
    const secret = await tfa.readAuthKey(); // 隠し項目の秘密鍵候補
    await tfa.submitRegister(currentTotp(secret));
    await expect(page.locator("body")).toContainText(SET_SUCCESS);
    await expect(page).toHaveURL(HOME_RE); // ホーム画面相当へ遷移
  });

  test("E2E-M01-02-030 初回設定 6桁以外→形式不正メッセージで滞留", async ({ page }) => {
    test.skip(!HAS_NOSECRET, "SEED-M01-02-2FA-NOSECRET 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(TFA_NS_USER, TFA_NS_PASS);
    await expect(page).toHaveURL(SET_RE);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.submitRegister("12345"); // 形式不正
    await expect(tfa.error).toContainText(ERR_INVALID);
    await expect(page).toHaveURL(SET_RE);
  });

  test("E2E-M01-02-031 初回設定 TOTP不一致→再入力メッセージで滞留", async ({ page }) => {
    test.skip(!HAS_NOSECRET, "SEED-M01-02-2FA-NOSECRET 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(TFA_NS_USER, TFA_NS_PASS);
    await expect(page).toHaveURL(SET_RE);
    const tfa = new AdminTwoFactorAuthPage(page);
    const secret = await tfa.readAuthKey();
    await tfa.submitRegister(mismatchTotp(secret)); // 形式は正しいが不一致
    await expect(tfa.error).toContainText(ERR_REINPUT);
    await expect(page).toHaveURL(SET_RE);
  });

  test("E2E-M01-02-051 個別2FA ON・秘密鍵なし・未認証で保護URL→初回設定画面へ誘導", async ({ page }) => {
    test.skip(!HAS_NOSECRET, "SEED-M01-02-2FA-NOSECRET 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(TFA_NS_USER, TFA_NS_PASS);
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
    await expect(page).toHaveURL(SET_RE);
  });

  // ===== 本人再設定画面（SEED-M01-02-2FA-SECRET ＋ 認証済みCookie） =====

  test("E2E-M01-02-004 本人再設定画面: 見出し・QRラベル・必須トークン・登録ボタンが表示される", async ({
    page,
  }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginAndPassAuth(page);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.gotoEdit();
    await expect(page.locator("body")).toContainText("システム設定"); // サブタイトル(edit.twig:16・出力先要実機確認)
    await expect(tfa.editCardTitle).toContainText("2段階認証");
    await expect(page.locator("body")).toContainText("QRコード"); // QRコードラベル(edit.twig:70)
    await expect(tfa.deviceToken).toBeVisible();
    await expect(tfa.editRequiredBadge).toBeVisible(); // トークン「必須」バッジ(edit.twig:81)
    await expect(tfa.registerButton).toBeVisible();
  });

  test("E2E-M01-02-005 本人再設定画面: 秘密鍵設定済のとき再設定警告が表示される", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginAndPassAuth(page);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.gotoEdit();
    await expect(page.locator("body")).toContainText(SET_WARNING);
  });

  test("E2E-M01-02-012 本人再設定成功: 新秘密鍵候補から算出した6桁で成功メッセージ表示", async ({ page }) => {
    // 秘密鍵を破壊するため共通SECRETではなく使い捨てRESETアカウントを使う（後続テストの安定化）。
    test.skip(!HAS_RESET, "SEED-M01-02-2FA-RESET 未設定（TFA_RESET_USER/PASS/SECRET）");
    await loginAndPassAuth(page, TFA_RESET_USER, TFA_RESET_PASS, TFA_RESET_SECRET);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.gotoEdit();
    const secret = await tfa.readAuthKey(); // GETで生成された新秘密鍵候補
    await tfa.submitRegister(currentTotp(secret));
    await expect(page.locator("body")).toContainText(SET_SUCCESS);
    await expect(page).toHaveURL(HOME_RE); // ホーム画面相当へ遷移
  });

  test("E2E-M01-02-040 本人再設定 6桁以外→形式不正メッセージで滞留", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginAndPassAuth(page);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.gotoEdit();
    await tfa.submitRegister("12345");
    await expect(tfa.error).toContainText(ERR_INVALID);
  });

  test("E2E-M01-02-041 本人再設定 TOTP不一致→再入力メッセージで滞留", async ({ page }) => {
    test.skip(!HAS_SECRET, "SEED-M01-02-2FA-SECRET 未設定");
    await loginAndPassAuth(page);
    const tfa = new AdminTwoFactorAuthPage(page);
    await tfa.gotoEdit();
    const secret = await tfa.readAuthKey();
    await tfa.submitRegister(mismatchTotp(secret));
    await expect(tfa.error).toContainText(ERR_REINPUT);
  });

  // ===== 個別2FA OFF（SEED-M01-02-2FA-OFF） =====

  test("E2E-M01-02-053 個別2FA OFFの管理者は追加認証なしで保護画面を利用できる", async ({ page }) => {
    test.skip(!HAS_OFF, "SEED-M01-02-2FA-OFF 未設定（TFA_OFF_USER/PASS）");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(TFA_OFF_USER, TFA_OFF_PASS);
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
    await expect(page).not.toHaveURL(AUTH_RE);
    await expect(page).not.toHaveURL(SET_RE);
    await expect(page).not.toHaveURL(LOGIN_RE);
  });

  test("E2E-M01-02-071 個別2FA OFFの管理者はヘッダに「2段階認証 設定」リンクが表示されない", async ({
    page,
  }) => {
    test.skip(!HAS_OFF, "SEED-M01-02-2FA-OFF 未設定");
    const lp = new AdminLoginPage(page);
    await lp.goto();
    await lp.login(TFA_OFF_USER, TFA_OFF_PASS);
    await page.locator(".c-headerBar__userMenu").click();
    await expect(page.getByRole("link", { name: "2段階認証 設定" })).toHaveCount(0);
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M01-02-056 本人再設定でCookie無効→ホームへ送られガード再誘導（要: 認証済みCookie無効状態の生成）",
    async () => {
      // 期待は仕様(処理フロー Controller.php:106-107)由来。Cookie無効状態を安定生成する手順を実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M01-02-080 追加認証POST 5回/30分超過で試行制限メッセージ（要: 専用IP隔離＋リミッタ(Redis)初期化）",
    async () => {
      // 期待は仕様(messages.ja.yaml:3585)由来。SEED-M01-02-2FA-LOCK のべき等化後に実装。
    }
  );
});
