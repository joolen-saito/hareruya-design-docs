/**
 * 提案雛形（未実行・codexレビュー反映版）。
 * 配置先想定: ec-cube-enterprise/e2e-tests/spec/admin/login.spec.ts
 *   ↑ import の相対パスはこの配置先を前提にしている（本リポジトリの保存場所では解決しない）。
 *   ec-cube-enterprise の Playwright は本リポジトリでは実行不可＝構造参考のみ。
 * 期待結果は仕様(m01-01_admin_login_login.md)由来（オラクル独立性）。
 *   認証失敗の2行文言は validators.ja.yaml:20-24 で静的確認済み（両行を検証）。
 *   nl2br による2行レンダリング・表示位置は実機確認対象（不具合候補#1）。
 * セレクタは admin/login.twig 由来。既存 pages/admin/login.page.ts を活用。
 */
import {expect, test} from "../../fixtures/admin_login.fixture";
import {AdminLoginPage} from "../../pages/admin/login.page";
import {ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS, ECCUBE_ADMIN_ROUTE} from "../../config/default.config";

// 仕様(validators.ja.yaml:20-24)由来の2行。実装に合わせて変えない。
const AUTH_FAIL_LINE1 = "ログインできませんでした。";
const AUTH_FAIL_LINE2 = "入力内容に誤りがないかご確認ください。";

async function expectAuthFailure(page) {
    const err = page.locator(".text-danger"); // login.twig:33
    await expect(err).toContainText(AUTH_FAIL_LINE1);
    await expect(err).toContainText(AUTH_FAIL_LINE2); // 2行目欠落も検出する
    await expect(page.locator("#login_id")).toBeVisible(); // ログイン画面に留まる
}

test.describe("管理画面 > ログイン", {tag: ["@admin", "@auth"]}, () => {

    // E2E-M01-01-001 判定順序#8: 成功→ホーム
    test("E2E-M01-01-001 正常: ホームへ遷移", async ({loginPage}) => {
        await loginPage.seeAfterLoginSuccess();
    });

    // E2E-M01-01-010 判定順序#1: ID未入力→認証失敗(2行)
    test("E2E-M01-01-010 異常: ID未入力で認証失敗(2行)", async ({page}) => {
        const lp = new AdminLoginPage(page);
        await lp.goto();
        await lp.login("", ECCUBE_ADMIN_PASS);
        await expectAuthFailure(page);
    });

    // E2E-M01-01-011 判定順序#1: PW未入力→認証失敗(2行)
    test("E2E-M01-01-011 異常: PW未入力で認証失敗(2行)", async ({page}) => {
        const lp = new AdminLoginPage(page);
        await lp.goto();
        await lp.login(ECCUBE_ADMIN_USER, "");
        await expectAuthFailure(page);
    });

    // E2E-M01-01-040 判定順序#4: 存在しないID→同一(区別しない)
    test("E2E-M01-01-040 異常: 存在しないID→同一の認証失敗", async ({page}) => {
        const lp = new AdminLoginPage(page);
        await lp.goto();
        await lp.login("e2e_no_such_admin", "whatever");
        await expectAuthFailure(page);
    });

    // E2E-M01-01-060 判定順序#6: パスワード不一致→認証失敗
    test("E2E-M01-01-060 異常: パスワード不一致→認証失敗", async ({page}) => {
        const lp = new AdminLoginPage(page);
        await lp.goto();
        await lp.login(ECCUBE_ADMIN_USER, "definitely_wrong");
        await expectAuthFailure(page);
    });

    // E2E-M01-01-013 IT-13: 未ログインで保護URL→ログイン画面へ誘導
    test("E2E-M01-01-013 未ログインで保護URL→ログイン画面へ", async ({page}) => {
        await page.goto(`/${ECCUBE_ADMIN_ROUTE}/`);
        await expect(page.locator("#login_id")).toBeVisible();
    });

    // E2E-M01-01-002 IT-25: ログイン済みでログインURL→ホーム
    test("E2E-M01-01-002 ログイン済みでログインURL→ホーム", async ({loginPage, page}) => {
        await loginPage.seeAfterLoginSuccess();
        await page.goto(`/${ECCUBE_ADMIN_ROUTE}/login`);
        await expect(page.locator("h2")).toContainText("ホーム");
    });

    // E2E-M01-01-080 ログアウト→ログイン画面
    test("E2E-M01-01-080 ログアウトでログイン画面へ", async ({loginPage, page}) => {
        await loginPage.seeAfterLoginSuccess();
        await loginPage.logout();
        await expect(page.locator("#login_id")).toBeVisible();
    });

    // ---- 要シード/要実機（実装は後・抜け漏れ可視化。手動/対象外はケース表で管理しspecに残さない）----

    // E2E-M01-01-020 判定順序#2: CSRF改ざん→認証しない（DOM改ざん。実機確認後に実装）
    test.fixme("E2E-M01-01-020 CSRFトークン改ざんで認証されない(要実機)", async () => {});

    // E2E-M01-01-050 判定順序#5: 停止中管理者→認証失敗 (SEED-M01-DISABLED)
    test.fixme("E2E-M01-01-050 停止中管理者は認証失敗(要シード)", async () => {});

    // E2E-M01-01-030 試行制限到達→「{N}分後」(SEED-M01-LOCK: 専用ID+IP隔離+リミッタ初期化)
    test.fixme("E2E-M01-01-030 試行制限で『{N}分後に』表示(要データ生成・要隔離)", async () => {});

    // E2E-M01-01-070/071 2FA有効→追加認証画面・保護画面不可 (SEED-M01-2FA-ON)
    test.fixme("E2E-M01-01-070 2FA有効ユーザーは追加認証画面へ(要シード)", async () => {});
    test.fixme("E2E-M01-01-071 2FA未完では保護画面を利用できない(要シード)", async () => {});

    // ログイン履歴・最終ログイン日時は別画面での間接確認（ケース表 090-092 / 手動寄り）
    test.fixme("E2E-M01-01-090 ログイン履歴に成功/失敗が記録される(間接・別画面)", async () => {});
});
