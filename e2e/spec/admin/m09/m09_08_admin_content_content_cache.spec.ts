/**
 * 管理画面 コンテンツ管理 > キャッシュ管理（M09-08）E2E。
 * 納品ケース表 integration_test/e2e/m09_08_admin_content_content_cache_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースを test() で実装する。手動/対象外（送出後のキャッシュ実体削除・opcache等リセット・
 * ログ出力抑止・DB登録/検索の非該当）はケース表で全量管理しspecに残さない。
 * 例外として 040（メンテ連動の設定切替が必要だが将来自動化を予定）は test.fixme で抜け漏れを可視化する（規約「未実行は理由付きで可視化」）。
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m09-08_admin_content_content_cache.md / messages.ja.yaml）由来（オラクル独立性）。
 * 表示文言は設計書「フロント挙動／表示メッセージ」節が明記する語を仕様正典として用いる。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・m05-m08/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 実行方針: キャッシュ削除はアプリ全体のキャッシュを破棄する副作用があるため、共有ステージングでは
 * 影響を理解したうえで実行する。メンテ許可設定有効時の解除非同期POST(040)は環境設定切替が必要で test.fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentCachePage } from "../../../pages/admin/m09/m09_08_admin_content_content_cache.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const CACHE_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/cache(\\?|$)`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

/** 管理者ログインしてキャッシュ管理画面を開く。 */
async function gotoCacheAsAdmin(page: Page): Promise<ContentContentCachePage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const cache = new ContentContentCachePage(page);
  await cache.goto();
  return cache;
}

test.describe("管理画面 コンテンツ管理 > キャッシュ管理", { tag: ["@admin", "@content"] }, () => {
  // ===== 未認証・非破壊（資格情報不要・常時実行可） =====

  test("E2E-M09-08-030 未認証で /content/cache へ直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/cache`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M09-08-031 未認証で削除POSTを試みても管理ログイン画面へ誘導され削除されない", async ({ page }) => {
    // 未認証のまま削除POSTを直接送出し、削除ガード（権限・認可「未認証」）が働くことを確認する。
    // 030（GET直接アクセス）とは別に、POST経路でも本画面を利用できないことを検証する。
    const resp = await page.request.post(`/${ECCUBE_ADMIN_ROUTE}/content/cache`, {
      form: { "_token": "x" },
      maxRedirects: 5,
    });
    // 認証要件によりログインへ誘導される（最終到達がログイン）。削除完了は成立しない。
    expect(resp.url()).toMatch(LOGIN_RE);
    expect(await resp.text(), "未認証では削除完了フラッシュを表示しない").not.toContain("削除しました");
  });

  // ===== 画面表示（SEED-M09-08-ADMIN） =====

  test("E2E-M09-08-001 キャッシュ管理画面: 見出し・説明文・キャッシュ削除ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M09-08-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
    const cache = await gotoCacheAsAdmin(page);
    await cache.seeCacheForm();
  });

  test("E2E-M09-08-002 説明文が設計書どおりの文言で表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M09-08-ADMIN 未設定");
    const cache = await gotoCacheAsAdmin(page);
    await expect(page.locator("body")).toContainText(cache.descriptionText);
  });

  test("E2E-M09-08-003 本画面は利用者が値を入力するフォーム項目を持たない", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M09-08-ADMIN 未設定");
    const cache = await gotoCacheAsAdmin(page);
    await expect(cache.deleteButton).toBeVisible();
    await expect(cache.userInputs).toHaveCount(0); // 可視入力欄なし（送信はトークン付きボタンのみ）
  });

  test("E2E-M09-08-004 削除ボタン押下時に確認ダイアログ／モーダルを表示せず即送信する", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M09-08-ADMIN 未設定");
    const cache = await gotoCacheAsAdmin(page);
    // 確認ダイアログ(JS dialog)が出る場合は失敗させる。出なければ即POSTで削除完了フラッシュに至る。
    let dialogShown = false;
    page.on("dialog", async (d) => {
      dialogShown = true;
      await d.dismiss();
    });
    // 押下前: DOMモーダル/トーストが表示されていないこと（仕様「モーダル・ポップアップ」）。
    await cache.expectNoModalOrToast();
    await cache.clickDelete();
    await cache.seeDeleteSuccess();
    expect(dialogShown, "確認ダイアログ(JS dialog)を表示しないこと").toBe(false);
    // 押下後も確認モーダル/トーストを表示せず、即送信で削除完了フラッシュに至ること。
    await cache.expectNoModalOrToast();
  });

  // ===== 削除実行（正常系） =====

  test("E2E-M09-08-010 キャッシュ削除ボタン押下で削除完了フラッシュ「削除しました」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M09-08-ADMIN 未設定");
    const cache = await gotoCacheAsAdmin(page);
    await cache.clickDelete();
    await cache.seeDeleteSuccess();
  });

  test("E2E-M09-08-011 削除ボタン押下後は別画面へ遷移せず同一キャッシュ管理画面を再表示する", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M09-08-ADMIN 未設定");
    const cache = await gotoCacheAsAdmin(page);
    await cache.clickDelete();
    await expect(page).toHaveURL(CACHE_RE); // 同一画面（別画面へ遷移しない）
    await cache.seeDeleteSuccess();
  });

  test("E2E-M09-08-012 連続して押下しても都度削除完了フラッシュが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M09-08-ADMIN 未設定");
    const cache = await gotoCacheAsAdmin(page);
    await cache.clickDelete();
    await cache.seeDeleteSuccess();
    await cache.clickDelete(); // 再表示後にもう一度押下
    await cache.seeDeleteSuccess();
  });

  // ===== 異常系（CSRF） =====

  test("E2E-M09-08-020 なりすまし対策トークン不正だと削除完了フラッシュを表示せず画面を再表示する", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M09-08-ADMIN 未設定");
    const cache = await gotoCacheAsAdmin(page);
    await cache.submitWithTamperedToken();
    await expect(page).toHaveURL(CACHE_RE); // キャッシュ管理画面を再表示
    await expect(cache.successAlert).toHaveCount(0); // 「削除しました」は表示されない
  });

  // ===== メンテ連動JSの負分岐（既定=無効環境で自動化可・決定的DOM観測） =====

  test("E2E-M09-08-041 メンテ許可設定が既定(無効)のとき削除後に解除用の非同期メンテ解除要求を発火しない", async ({ page }) => {
    test.skip(!HAS_CREDS, "SEED-M09-08-ADMIN 未設定");
    // 040（設定有効で解除非同期POSTを発火する正分岐）に対する負分岐。
    // 設計書 エッジケース「メンテ設定無効」: メンテ操作せず削除のみ予約し、解除用JSも動作しない。
    const cache = await gotoCacheAsAdmin(page);
    await cache.clickDelete();
    await cache.seeDeleteSuccess(); // 削除完了フラッシュは表示される
    await cache.expectNoMaintenanceReleaseScript(); // 解除用inline scriptは出力されない
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動はケース表で全量管理） =====

  test.fixme(
    "E2E-M09-08-040 メンテ許可設定有効時、削除後に /disable_maintenance/auto_maintenance へ非同期POSTする（要: ECCUBE_ALLOW_MAINTENANCE_MODE 有効化）",
    async () => {
      // 期待は仕様（フロント挙動 JS挙動 / cache.twig:19-26 / MaintenanceController.php:82）由来。
      // SEED-M09-08-MAINTENANCE（メンテ許可設定=有効）の環境設定切替後、page.waitForRequest で解除POSTを観測して実装する。
      // 共有環境ではメンテナンスモード切替の副作用があるため隔離実行が必要。
    }
  );
});
