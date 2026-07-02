/**
 * 管理画面 店舗設定 > 追加システム設定 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m10_16_admin_base_setting_setting_shop_additional_system_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装し、
 * 保存成功(POST=mtb_option 更新)・無変更送信のDB間接確認・CSRF改ざん・INSERTしない検証は
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 pf-eccube3 md / 観点表 / 基本設計）由来（オラクル独立性）。
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の項目集合・文言・成功メッセージキーの乖離はケース表「付帯表4」に出し、
 * テストは仕様どおりに書いて落ちて検出する。実装からはセレクタ(位置情報)のみを取得した。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec(login/m10系)も
 * @playwright/test を直接使う。既存リポ規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 表示(GET)・検証失敗(POST不正値→保存されず再描画)は非破壊のため安全に実行できる。
 *  - 保存成功(030)・無変更送信(031)・INSERTしない(032)・CSRF改ざん(040)は破壊的/要改ざん/DB観測のため test.fixme。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopAdditionalSystemPage } from "../../../pages/admin/m10/m10_16_admin_base_setting_setting_shop_additional_system.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// URLアサーションは管理ルート(ECCUBE_ADMIN_ROUTE)込みで判定し、別ルートへの誤遷移を取りこぼさない。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 保存成功時の同一機能GET初期表示（update を含まない additional_system 末尾）。
const INDEX_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/additional_system(\\?|$)`);

/** 管理ログインしてから追加システム設定画面を開く。 */
async function gotoAsAdmin(page: Page): Promise<BaseSettingSettingShopAdditionalSystemPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const p = new BaseSettingSettingShopAdditionalSystemPage(page);
  await p.goto();
  return p;
}

test.describe(
  "管理画面 > 店舗設定 > 追加システム設定",
  { tag: ["@admin", "@setting"] },
  () => {
    // ===== 表示（GET・非破壊） =====

    test("E2E-M10-16-001 画面が開きカード見出し「追加システム設定」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      await expect(page).toHaveURL(INDEX_RE);
      // 期待は仕様（フロント挙動「block title=追加システム設定」）由来。
      await expect(p.cardHeader).toContainText("追加システム設定");
      // 期待は仕様（処理フロー(GET)「mtb_option を全件読込→各フォーム行に現在値を表示」正本md:88-91）由来。
      // 必須項目は DB現行値（無ければ定数既定）が必ず入るため、現在値が描画されること（空でないこと）を構造で観測する。
      // 値の正当性（DB原値との一致）はDB間接＝手動（付帯表2b 003/083）。
      await expect(p.arrivalAlertMax).toBeVisible();
      await expect(p.arrivalAlertMax).not.toHaveValue("");
    });

    test("E2E-M10-16-002 CSRFトークン付き単一フォームと送信ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（利用者視点の入口「CSRFトークン付きの単一フォームと設定ボタン」）由来。
      await p.seeForm();
      // 送信ボタン文言は設計（正本md:63「設定」ボタン／md:74 右カラム「設定」）を一次オラクルとして検証する。
      // 刷新先は「登録」（付帯表4#5）のためここは意図的に落ちて文言乖離を検出する（テストを実装へ寄せない）。
      await expect(p.submitButton).toContainText("設定");
    });

    test("E2E-M10-16-003 必須項目に「必須」バッジが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（業務ルール・計算「必須/任意」）由来。必須項目（入荷通知最大数 等）にバッジが付くこと。
      expect(await p.requiredBadge.count()).toBeGreaterThan(0);
      await expect(p.requiredBadge.first()).toBeVisible();
    });

    test("E2E-M10-16-004 送信は確認ダイアログを介さずPOSTフォームで行う", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      // 期待は仕様（フロント挙動「method=post・モーダル不使用」）由来。
      await expect(p.form).toHaveAttribute("method", /post/i);
      // 設計「送信」(正本md:79)は action=GET と同じ追加システム設定パス（メソッドのみPOSTで別ハンドラ）。
      // /update 等の特定ハンドラパスは実装由来オラクルになるため固定しない（設計md:64 と md:79 は内部不整合＝要確認）。
      await expect(p.form).toHaveAttribute("action", /setting\/shop\/additional_system/);
    });

    // ===== バリデーション（POST検証失敗・非破壊：失敗時はDBへ書き込まない） =====

    test("E2E-M10-16-010 入荷通知最大数を未入力で送信するとエラー表示され保存リダイレクトしない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      await p.submitWith(p.arrivalAlertMax, ""); // 必須空
      // 期待は仕様（処理フロー(POST検証失敗)「保存せず再描画」＋業務ルール「入荷通知最大数 必須」）由来。
      // 別フィールド由来エラーで誤通過しないよう、対象フィールド自体の不正状態（フィールド近傍エラー）で判定する。
      await p.expectFieldInvalid(p.arrivalAlertMax);
      await expect(page).not.toHaveURL(INDEX_RE); // 成功時の同一機能GET再表示が起きていないこと
    });

    test("E2E-M10-16-011 入荷通知最大数に0未満を入力するとエラー表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      await p.submitWith(p.arrivalAlertMax, "-1"); // 0以上の整数に違反
      await p.expectFieldInvalid(p.arrivalAlertMax);
      await expect(page).not.toHaveURL(INDEX_RE);
    });

    test("E2E-M10-16-012 買取専用メールアドレスに不正形式を入力するとエラー表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      await p.submitWith(p.purchaseMailAddress, "abc"); // メール形式違反
      await p.expectFieldInvalid(p.purchaseMailAddress);
      await expect(page).not.toHaveURL(INDEX_RE);
    });

    test("E2E-M10-16-013 配送日指定繰上時刻にhh:mm以外を入力するとエラー表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      await p.submitWith(p.orderTimingBorder, "25:61"); // 00:00〜23:59 形式違反
      await p.expectFieldInvalid(p.orderTimingBorder);
      await expect(page).not.toHaveURL(INDEX_RE);
    });

    test("E2E-M10-16-014 スマレジ店舗受取用部門IDに数字以外を入力するとエラー表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      await p.submitWith(p.smaregiCategoryId, "abc"); // 数字のみ許容に違反
      await p.expectFieldInvalid(p.smaregiCategoryId);
      await expect(page).not.toHaveURL(INDEX_RE);
    });

    test("E2E-M10-16-015 検証失敗時は同一機能GETへリダイレクトせず再描画して滞留する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const p = await gotoAsAdmin(page);
      await p.submitWith(p.arrivalAlertMax, ""); // 必須空＝検証失敗
      // 期待は仕様（処理フロー(POST検証失敗)「DBへ書き込まず同一テンプレート再描画」）由来。
      await expect(page).not.toHaveURL(INDEX_RE);
      await expect(p.form).toBeVisible(); // フォームを再描画して滞留
    });

    // ===== 権限・認可（資格情報不要・非破壊） =====

    test("E2E-M10-16-020 未ログインで当画面URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      // 資格情報不要（未ログイン前提）。期待は仕様（権限・認可「未認証は共通認証フローへ誘導」）由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/additional_system`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M10-16-021 未ログインで更新パスへPOSTすると保存されず認証フローへ誘導/拒否される", async ({ page }) => {
      // 資格情報不要（未ログイン前提）。期待は仕様（権限・認可「未認証は認証フローへ誘導」＋画面遷移「未認証→ログイン誘導」）由来。
      // 更新パス自体は POM の updateUrl（位置情報）で、オラクルはパスではなく未認証時の誘導/拒否挙動。
      const p = new BaseSettingSettingShopAdditionalSystemPage(page);
      const res = await page.request.post(p.updateUrl, {
        form: { dummy: "1" },
        failOnStatusCode: false,
      });
      // 未認証はログイン誘導（最終URLがログイン）またはアクセス拒否（401/403）となり、
      // 保存成功（同一機能GET初期表示への到達）に至らないこと。
      const reachedLogin = LOGIN_RE.test(res.url());
      const denied = [401, 403].includes(res.status());
      expect(reachedLogin || denied).toBeTruthy();
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M10-16-030 値変更で送信すると成功フラッシュ＋同一機能GETへリダイレクト（破壊的: mtb_option を更新。要: 使い捨てシードと後始末）",
      async () => {
        // 期待は仕様（処理フロー(POST成功)・画面遷移「保存成功→同一機能GET初期表示」）由来。
        // 成功メッセージの正は仕様。刷新先のキーは admin.common.save_complete（設計は admin.register.complete、付帯表4#1）。
        // 文言はハードコードせず「成功フラッシュ表示＋INDEX_RE へ redirect」を観測する。SEED-M10-16-OPTIONS の既知値復元後に実装。
      }
    );

    test.fixme(
      "E2E-M10-16-031 送信値と現行値が同一の行は persist されず member_id も更新されない（DB間接確認）",
      async () => {
        // 期待は仕様（エッジケース「送信値=現行値はpersistしない・member_id非更新」Controller.php:92）由来。
        // 無変更送信→同一機能GET再表示の前後で member_id/option_value が不変であることをDBで間接確認する。
      }
    );

    test.fixme(
      "E2E-M10-16-032 mtb_option に当該キー行が無いキーは保存ループ対象外でINSERTされない（DB間接確認）",
      async () => {
        // 期待は仕様（エッジケース「findAll に無いキーはINSERTしない」Controller.php:89-99）由来。
        // SEED-M10-16-OPTIONS-MISSING（対象キー行欠落）で送信し、当該キー行が増えないことをDBで間接確認する。
      }
    );

    test.fixme(
      "E2E-M10-16-040 CSRFトークン不正のPOSTはアクセス拒否となり保存されない（要: トークン改ざん）",
      async () => {
        // 期待は仕様（エラー処理「CSRF 不正→アクセス拒否（HTTP 403）」正本md:258・md:66）由来＝
        // 実装時は HTTP 403 応答かつ「保存成功とならずDB不変」を検証する（POST応答ステータス 403 をアサート）。
        // ※md:66 は「HTTPコードはフレームワーク/エラーハンドラを正とする」とも併記＝403 の確度は要確認（付帯表4#6）。
      }
    );
  }
);
