/**
 * 管理画面 コンテンツ管理 > メンテナンス管理（M09-09）E2E。
 * 納品ケース表 integration_test/e2e/m09_09_admin_content_content_maintenance_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、公開側503（要実機・破壊的）は test.fixme で残す。
 * 手動/対象外（許可フラグ env 切替・自動メンテナンス状態・ファイル障害・CSRF内部・ログ抑止 等）は
 * ケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m09-09_admin_content_content_maintenance.md /
 * messages.ja.yaml の挙動）由来（オラクル独立性）。実装の現挙動・Form制約をオラクル化しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m08/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 本機能はメンテナンス許可フラグ eccube_allow_maintenance_mode=true の環境でのみ画面に到達できる。
 *  - 有効化は公開側フロント(SHOP)を即時停止する破壊的操作。切替系（004/010-013/030/031/041）は
 *    ECCUBE_MAINTENANCE_TOGGLE_OK のオプトインでのみ実行し、テスト内で必ず無効化して原状復帰する。
 *  - 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *  - 公開側503（050）は別コンテキスト＋HTTPS＋破壊的のため test.fixme で残す。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ContentContentMaintenancePage } from "../../../pages/admin/m09/m09_09_admin_content_content_maintenance.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
// 破壊的（公開側停止）操作のオプトイン。専用環境・専用時間帯でのみ true にする。
const TOGGLE_OK = process.env.ECCUBE_MAINTENANCE_TOGGLE_OK === "1";

// 管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const MAINT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/maintenance(\\?|$)`);

// 仕様由来の表示文言。実装に合わせて変えない（オラクル独立性）。
// 出典は設計書（正本 functions/ec-cube-enterprise/m09-09_admin_content_content_maintenance.md 表示メッセージ節:167）。
const CARD_TITLE = "メンテナンスモード"; // 設計書:167（カード見出し）
const DESC_PART = "管理画面のみアクセス可能な状態となります"; // 設計書:167 説明文1行目
const DESC_PART2 = "自動的にメンテナンスモードに切り替わります"; // 設計書:167 説明文2行目（改行付き）
const ENABLE_MSG = "メンテナンスモードを有効にしました。"; // 設計書:179 表示メッセージ（有効化フラッシュ）
const DISABLE_MSG = "メンテナンスモードを無効にしました。"; // 設計書:179 表示メッセージ（無効化フラッシュ）
// Cookie名は設計書 Cookie節（:64,:310）に明記された仕様値（実装確認値だが設計書が正典化）。
// 値は秘密情報のため判定に使わず、名称・属性のみで判定する（オラクル独立性）。
const COOKIE_NAME = "maintenance_token"; // 設計書 Cookie節:64,:310

/** 管理者でログインしてメンテナンス管理画面を開く。 */
async function loginAndOpen(page: Page): Promise<ContentContentMaintenancePage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const mp = new ContentContentMaintenancePage(page);
  await mp.goto();
  return mp;
}

/** テスト後に必ず無効状態へ戻す（公開側停止の取り残し防止）。 */
async function ensureDisabled(mp: ContentContentMaintenancePage) {
  await mp.goto();
  if ((await mp.maintenanceValue()) === "off") {
    await mp.clickDisable();
    await expect(mp.page).toHaveURL(MAINT_RE);
  }
}

test.describe(
  "管理画面 > コンテンツ管理 > メンテナンス管理",
  { tag: ["@admin", "@content", "@maintenance"] },
  () => {
    // ===== 認証不要 =====

    test("E2E-M09-09-020 未ログインでメンテナンス管理画面URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/content/maintenance`);
      // 権限・認可: 未認証は利用不可。管理ログイン画面へ誘導される（仕様）。
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== 無効状態の表示（非破壊・要許可フラグ真環境） =====

    test("E2E-M09-09-001 メンテナンス管理画面にカード見出し「メンテナンスモード」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const mp = await loginAndOpen(page);
      await expect(mp.cardTitle).toContainText(CARD_TITLE);
    });

    test("E2E-M09-09-002 メンテナンス管理画面に説明文（2行・改行付き）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const mp = await loginAndOpen(page);
      // 設計書:167 は1行目（SHOP停止/管理画面のみ）と2行目（自動切替の注記）を改行付きで表示する。
      await expect(mp.description).toContainText(DESC_PART);
      await expect(mp.description).toContainText(DESC_PART2);
      // 改行表示（nl2br）＝説明文 span 内に <br> が存在すること（仕様: 画面でも改行表示する）。
      await expect(mp.description.locator("br")).toHaveCount(1);
    });

    test("E2E-M09-09-003 無効中はボタン「有効にする」と隠しフィールドmaintenance=onが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const mp = await loginAndOpen(page);
      test.skip(
        (await mp.maintenanceValue()) !== "on",
        "前提: メンテナンス無効状態（目印ファイル不在）が必要"
      );
      await mp.seeDisabledStateForm();
    });

    test("E2E-M09-09-005 メンテナンス管理画面はモーダル・確認ダイアログ・入力欄を持たない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const mp = await loginAndOpen(page);
      // 仕様: モーダル・確認ダイアログ・利用者が値を入力するテキスト欄/ラジオ/トグルを持たない。
      await expect(page.locator(".modal")).toHaveCount(0);
      await expect(page.locator('input[type="text"]')).toHaveCount(0);
      await expect(page.locator('input[type="radio"]')).toHaveCount(0);
      await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
      await expect(page.locator("textarea")).toHaveCount(0);
      await expect(page.locator("select")).toHaveCount(0);
    });

    test("E2E-M09-09-006 同一画面に切り替えボタンは一方のみ表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const mp = await loginAndOpen(page);
      await expect(mp.switchButton).toHaveCount(1);
    });

    test("E2E-M09-09-040 無効状態で送信値offが届くと状態を変更せずリダイレクトする（判定順序#4）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const mp = await loginAndOpen(page);
      test.skip((await mp.maintenanceValue()) !== "on", "前提: メンテナンス無効状態が必要");
      // 無効状態で off を送る＝判定順序#4（該当なし）。状態は無効のまま・成功フラッシュなし（仕様）。
      await mp.submitWithMaintenance("off");
      await expect(page).toHaveURL(MAINT_RE);
      await expect(page.locator("body")).not.toContainText(ENABLE_MSG);
      await mp.goto();
      await expect(mp.maintenanceHidden).toHaveValue("on"); // 依然として無効（=有効化ボタン表示）
    });

    test("E2E-M09-09-042 なりすまし対策トークン不正時は切り替えを行わず画面を再表示する（判定順序#1）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const mp = await loginAndOpen(page);
      test.skip((await mp.maintenanceValue()) !== "on", "前提: メンテナンス無効状態が必要");
      // CSRF不正は切替を行わない＝非破壊（公開側を停止しない）。状態不変・成功フラッシュなし（仕様 判定順序#1）。
      await mp.submitWithInvalidCsrf();
      await expect(page.locator("body")).not.toContainText(ENABLE_MSG);
      // 本画面専用の追加エラー文言を出さず、通常のメンテナンス管理画面として再表示される（設計書 エラー処理:275）。
      await expect(mp.cardTitle).toContainText(CARD_TITLE);
      await mp.goto();
      await expect(mp.maintenanceHidden).toHaveValue("on"); // 依然として無効のまま
    });

    // ===== 公開側フロント 正常表示（非破壊・メンテ無効状態） =====

    test("E2E-M09-09-060 メンテナンス無効中は公開側フロント / が通常表示される（公開側判定順序#1）", async ({ page }) => {
      // 目印ファイルなし（メンテ無効）＝公開側は停止せず通常表示（仕様 公開側判定順序#1:153）。非破壊。
      const res = await page.goto("/");
      expect(res?.status(), "メンテ無効中の公開側 / は503にならない").not.toBe(503);
      // 停止画面の見出し（設計書 表示メッセージ節:182）が出ないこと＝通常表示。
      await expect(page.locator("body")).not.toContainText("ただいまメンテナンス中です。");
    });

    // ===== 切替系（破壊的・ECCUBE_MAINTENANCE_TOGGLE_OK でガード） =====

    test("E2E-M09-09-010 無効状態で有効化ボタン押下時に有効化フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!TOGGLE_OK, "破壊的（公開側停止）: ECCUBE_MAINTENANCE_TOGGLE_OK=1 で明示許可");
      const mp = await loginAndOpen(page);
      // 前提判定は try の外で行う。スキップ時に finally の原状復帰が走り、本テストが作っていない
      // 既存メンテナンス状態を無効化してしまう破壊を防ぐ（cleanup は自分が有効化した時のみ実行する）。
      test.skip((await mp.maintenanceValue()) !== "on", "前提: メンテナンス無効状態が必要");
      try {
        await mp.clickEnable();
        await expect(page.locator("body")).toContainText(ENABLE_MSG);
      } finally {
        await ensureDisabled(mp);
      }
    });

    test("E2E-M09-09-011 有効化後はメンテナンス管理画面へリダイレクトしボタンが「無効にする」に変化する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!TOGGLE_OK, "破壊的（公開側停止）: ECCUBE_MAINTENANCE_TOGGLE_OK=1 で明示許可");
      const mp = await loginAndOpen(page);
      // 前提判定は try の外（スキップ時に finally の原状復帰で既存状態を壊さないため）。
      test.skip((await mp.maintenanceValue()) !== "on", "前提: メンテナンス無効状態が必要");
      try {
        await mp.clickEnable();
        await expect(page).toHaveURL(MAINT_RE);
        await mp.seeEnabledStateForm(); // 「無効にする」＋maintenance=off
      } finally {
        await ensureDisabled(mp);
      }
    });

    test("E2E-M09-09-012 有効状態で無効化ボタン押下時に無効化フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!TOGGLE_OK, "破壊的（公開側停止）: ECCUBE_MAINTENANCE_TOGGLE_OK=1 で明示許可");
      const mp = await loginAndOpen(page);
      try {
        // 無効状態から有効化し、その後の無効化で無効化フラッシュを観測する。
        if ((await mp.maintenanceValue()) === "on") {
          await mp.clickEnable();
          await expect(page).toHaveURL(MAINT_RE);
        }
        await mp.goto();
        await mp.clickDisable();
        await expect(page.locator("body")).toContainText(DISABLE_MSG);
      } finally {
        await ensureDisabled(mp);
      }
    });

    test("E2E-M09-09-013 無効化後はメンテナンス管理画面へリダイレクトしボタンが「有効にする」に戻る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!TOGGLE_OK, "破壊的（公開側停止）: ECCUBE_MAINTENANCE_TOGGLE_OK=1 で明示許可");
      const mp = await loginAndOpen(page);
      try {
        if ((await mp.maintenanceValue()) === "on") {
          await mp.clickEnable();
          await expect(page).toHaveURL(MAINT_RE);
        }
        await mp.goto();
        await mp.clickDisable();
        await expect(page).toHaveURL(MAINT_RE);
        await mp.seeDisabledStateForm(); // 「有効にする」＋maintenance=on
      } finally {
        await ensureDisabled(mp);
      }
    });

    test("E2E-M09-09-014 有効化後のフラッシュはリダイレクト後に1度だけ表示される（画面遷移）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!TOGGLE_OK, "破壊的（公開側停止）: ECCUBE_MAINTENANCE_TOGGLE_OK=1 で明示許可");
      const mp = await loginAndOpen(page);
      test.skip((await mp.maintenanceValue()) !== "on", "前提: メンテナンス無効状態が必要");
      try {
        await mp.clickEnable();
        // 遷移後に1度だけ表示（設計書 画面遷移:267）。
        await expect(page.locator("body")).toContainText(ENABLE_MSG);
        await mp.goto(); // 再読込＝次遷移ではフラッシュは消える。
        await expect(page.locator("body")).not.toContainText(ENABLE_MSG);
      } finally {
        await ensureDisabled(mp);
      }
    });

    test("E2E-M09-09-030 有効化応答後にメンテナンス用トークンCookie（maintenance_token）が付与される", async ({
      page,
      context,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!TOGGLE_OK, "破壊的（公開側停止）: ECCUBE_MAINTENANCE_TOGGLE_OK=1 で明示許可");
      const mp = await loginAndOpen(page);
      // 前提判定は try の外（スキップ時に finally の原状復帰で既存状態を壊さないため）。
      test.skip((await mp.maintenanceValue()) !== "on", "前提: メンテナンス無効状態が必要");
      try {
        const before = new Set((await context.cookies()).map((c) => c.name));
        await mp.clickEnable();
        await expect(page).toHaveURL(MAINT_RE);
        const added = (await context.cookies()).filter((c) => !before.has(c.name));
        // Cookie名は実装確認値。値は秘密情報のため名称/属性で判定し値一致しない（オラクル独立性）。
        const tokenCookie = added.find((c) => c.name === COOKIE_NAME);
        expect(tokenCookie, `有効化応答で ${COOKIE_NAME} が新規付与されること`).toBeTruthy();
        expect(tokenCookie?.secure).toBe(true); // Secure属性（要HTTPS環境）
      } finally {
        await ensureDisabled(mp);
      }
    });

    test("E2E-M09-09-031 無効化応答後にメンテナンス用トークンCookie（maintenance_token）が破棄される", async ({
      page,
      context,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!TOGGLE_OK, "破壊的（公開側停止）: ECCUBE_MAINTENANCE_TOGGLE_OK=1 で明示許可");
      const mp = await loginAndOpen(page);
      try {
        if ((await mp.maintenanceValue()) === "on") {
          await mp.clickEnable();
          await expect(page).toHaveURL(MAINT_RE);
        }
        await mp.goto();
        await mp.clickDisable();
        await expect(page).toHaveURL(MAINT_RE);
        const names = (await context.cookies()).map((c) => c.name);
        expect(names).not.toContain(COOKIE_NAME); // 無効化応答で破棄
      } finally {
        await ensureDisabled(mp);
      }
    });

    test("E2E-M09-09-041 有効状態で送信値onが届くと状態を変更せずリダイレクトする（判定順序#4）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!TOGGLE_OK, "破壊的（公開側停止）: ECCUBE_MAINTENANCE_TOGGLE_OK=1 で明示許可");
      const mp = await loginAndOpen(page);
      try {
        if ((await mp.maintenanceValue()) === "on") {
          await mp.clickEnable(); // 有効状態にする
          await expect(page).toHaveURL(MAINT_RE);
        }
        await mp.goto();
        // 有効状態で on を送る＝判定順序#4（該当なし）。状態は有効のまま・成功フラッシュなし（仕様）。
        await mp.submitWithMaintenance("on");
        await expect(page).toHaveURL(MAINT_RE);
        await expect(page.locator("body")).not.toContainText(DISABLE_MSG);
        await mp.goto();
        await expect(mp.maintenanceHidden).toHaveValue("off"); // 依然として有効（=無効化ボタン表示）
      } finally {
        await ensureDisabled(mp);
      }
    });

    // ===== 有効状態の表示（破壊的セットアップ要） =====

    test("E2E-M09-09-004 有効中はボタン「無効にする」と隠しフィールドmaintenance=offが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!TOGGLE_OK, "破壊的（公開側停止）: ECCUBE_MAINTENANCE_TOGGLE_OK=1 で明示許可");
      const mp = await loginAndOpen(page);
      try {
        if ((await mp.maintenanceValue()) === "on") {
          await mp.clickEnable();
          await expect(page).toHaveURL(MAINT_RE);
        }
        await mp.goto();
        await mp.seeEnabledStateForm();
      } finally {
        await ensureDisabled(mp);
      }
    });

    // ===== 保留（要実機・破壊的・別コンテキスト。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M09-09-050 メンテナンス有効中・トークン不一致の公開側フロント→503＋案内画面（要: HTTPS・Cookie無コンテキスト・破壊的）",
      async () => {
        // 期待は仕様(設計書 表示メッセージ節:182-183 / 公開側判定順序#4:156)由来。
        // 有効化後、maintenance_token Cookie を持たない別 browser.context で公開側(/)へアクセスし
        // HTTP 503 と「ただいまメンテナンス中です。」を確認する手順を専用環境で実装する。
      }
    );

    test.fixme(
      "E2E-M09-09-051 メンテナンス有効中でも管理画面プレフィックス配下は継続アクセスできる（公開側判定順序#2）",
      async () => {
        // 期待は仕様(設計書 公開側判定順序#2:131,195)由来。
        // 有効化後、管理画面プレフィックス配下(/%admin%/...)へアクセスし 503 にならず継続表示されることを
        // 専用環境(破壊的)で確認する。
      }
    );

    test.fixme(
      "E2E-M09-09-052 メンテナンス有効中・トークン一致Cookie保持の管理者は公開側フロントを継続閲覧できる（公開側判定順序#3）",
      async () => {
        // 期待は仕様(設計書 公開側判定順序#3:134,155 / Cookie節:313)由来。
        // 有効化応答で付与された maintenance_token Cookie を保持したまま公開側(/)へアクセスし、
        // 503 にならず継続閲覧できることを専用環境(破壊的・要HTTPS)で確認する。
      }
    );
  }
);
