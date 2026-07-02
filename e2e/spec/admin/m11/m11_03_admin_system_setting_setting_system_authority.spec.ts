/**
 * 管理画面 システム設定 > 権限管理（権限×機能アクセス権マトリクス）（M11-03）E2E。
 * 納品ケース表 integration_test/e2e/m11_03_admin_system_setting_setting_system_authority_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースを test() で実装し、自動化予定だが未実装/要実機（022 優先度継承ロックの確定・
 * 041 新規権限名 HTML5 required の client 検証）は test.fixme（理由付き）で残す。
 * 手動/対象外（dtb_authority_role 全件置換の DB 原値・AuthorityVoter のアクセス拒否・ナビ非表示・イベント発火・
 * CSRF 内部・ログ抑止・セッション/キャッシュ非更新・本機能が行わない DB 検索）はケース表で全量管理し spec に残さない（規約）。
 *
 * 期待結果は仕様（基本設計＝マトリクスUIのリニューアル後仕様 ＋ 観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（リバース＝旧「権限＋拒否URL」行ベースフォーム）。刷新先 ec-cube-enterprise は基本設計どおり
 * マトリクスUI（チェックボックス＋複製＋新規権限名）を実装しており、設計md本文（旧行ベース）との差は
 * ケース表 付帯表4（不具合候補/要確認）で管理する。実装の現挙動を期待値へ流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・m02-m10/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 表示系（001-004,010,011）と JS 系（020,021）は非破壊。
 *  - 030/031 は現状チェック状態のまま無変更で登録する冪等な正常系（desired＝current のため dtb_authority_role は実質無変更）。
 *  - 040 は複製した新規行の権限名に「既存権限名」を入力して送信＝重複名で例外→rollback のため新規権限を作らず非破壊。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminSystemSettingSettingSystemAuthorityPage } from "../../../pages/admin/m11/m11_03_admin_system_setting_setting_system_authority.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
// ルート文字列は正規表現メタ文字をエスケープしてから埋め込む（監査容易・部分一致誤検知防止）。
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const AUTHORITY_RE = new RegExp(`/${escapeRe(ECCUBE_ADMIN_ROUTE)}/setting/system/authority(\\?|$)`);

/** 管理者ログインして権限管理画面を開く。 */
async function gotoAuthorityAsAdmin(page: Page): Promise<AdminSystemSettingSettingSystemAuthorityPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const authority = new AdminSystemSettingSettingSystemAuthorityPage(page);
  await authority.goto();
  return authority;
}

test.describe(
  "管理画面 > システム設定 > 権限管理",
  { tag: ["@admin", "@setting", "@system", "@authority"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M11-03-011 未ログインで権限管理URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/system/authority`);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（仕様: 権限・認可/未認証）
    });

    // ===== 画面表示（要 ECCUBE_ADMIN_USER/PASS） =====

    test("E2E-M11-03-001 権限管理画面: カードタイトル「権限設定」とマトリクス表・登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      await authority.seeMatrix();
    });

    test("E2E-M11-03-002 権限管理画面: 列見出し「機能名」「権限名」「優先度」「操作」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      await authority.seeColumnHeaders();
    });

    test("E2E-M11-03-003 権限管理画面: 各権限行にアクセス許可チェックボックスが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      await expect(authority.permissionCheckboxes.first()).toBeVisible();
    });

    test("E2E-M11-03-004 権限管理画面: 複製ボタンと登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      await expect(authority.copyButtons.first()).toBeVisible();
      await expect(authority.registerButton).toBeVisible();
    });

    test("E2E-M11-03-010 ログイン後 権限管理URL直接アクセスで権限設定画面が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      await expect(page).toHaveURL(AUTHORITY_RE); // 仕様: 利用者視点の入口/URL直接アクセス
      await authority.seeMatrix();
    });

    // ===== JS 挙動（非破壊・クライアント操作のみ） =====

    test("E2E-M11-03-020 複製ボタン押下で新規権限行（権限名入力欄付き）が末尾に追加される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      const before = await authority.authorityRows.count();
      await authority.clickCopyFirstRow();
      await expect(authority.authorityRows).toHaveCount(before + 1); // 行が1つ増える（基本設計: 権限の複製）
      await expect(authority.newAuthorityNameInput).toBeVisible(); // 新規権限名入力欄が出現
    });

    test("E2E-M11-03-021 複製で追加した行の削除ボタン押下で当該行が消える", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      const before = await authority.authorityRows.count();
      await authority.clickCopyFirstRow();
      await expect(authority.authorityRows).toHaveCount(before + 1);
      await authority.deleteButtons.first().click();
      await expect(authority.authorityRows).toHaveCount(before); // 当該行が表から消える（仕様: 行の削除）
    });

    // ===== 正常系保存（冪等・無変更再送信） =====

    test("E2E-M11-03-030 無変更のまま登録→成功フラッシュが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      await authority.submit(); // 現状チェック状態のまま登録（冪等）
      await expect(authority.successAlert).toBeVisible(); // 成功フラッシュ（仕様: 処理フロー POST検証成功・成功メッセージ）
    });

    test("E2E-M11-03-031 登録成功後は同一の権限管理画面へリダイレクトし再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      await authority.submit();
      await expect(page).toHaveURL(AUTHORITY_RE); // 同一画面へリダイレクト（仕様: 画面遷移 POST成功）
      await authority.seeMatrix(); // 再GETで一覧が読み直され再表示される
    });

    // ===== 異常系（非破壊：例外→rollback で保存されない） =====

    test("E2E-M11-03-040 複製行の権限名に既存権限名を入力して登録→エラーで保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const authority = await gotoAuthorityAsAdmin(page);
      const existingName = await authority.readFirstAuthorityName(); // 既存権限名を取得
      await authority.clickCopyFirstRow();
      await authority.submitWithNewAuthorityName(existingName); // 既存名で重複→例外→rollback
      await expect(authority.errorAlert.first()).toBeVisible(); // エラーフラッシュ表示（保存に失敗）
      await expect(authority.successAlert).toHaveCount(0); // 成功フラッシュは出ない＝保存されない
      await expect(page).toHaveURL(AUTHORITY_RE); // 権限管理画面へ戻る
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M11-03-022 優先度グループ内で上位優先度を許可にすると下位も自動許可・編集ロックされる（要: 優先度を複数持つ権限グループの実機データ確認）",
      async () => {
        // 期待は基本設計（上位権限がアクセス可なら下位も自動でアクセス可・下位を編集不可にする継承）由来。
        // updateGroupLocks（authority.twig:117-148 .permission-checkbox.locked）。グループ構成に依存するため実機データ確認後に実装。
      }
    );

    test.fixme(
      "E2E-M11-03-023 優先度グループ内で上位許可を解除すると自動許可・ロックされていた下位が編集可能へ戻る（022の対・要: 優先度を複数持つ権限グループの実機データ確認）",
      async () => {
        // 期待は基本設計（優先度継承の逆方向＝上位許可解除で下位の自動許可/編集ロックが解かれる）由来。
        // updateGroupLocks（authority.twig:117-148）。022と同じグループ構成依存のため実機データ確認後に実装。
      }
    );

    test.fixme(
      "E2E-M11-03-041 複製行の権限名を空のまま登録すると送信できない/必須エラー（要: HTML5 required の client 検証挙動を実機確認）",
      async () => {
        // 期待は基本設計（新規権限は名称必須）由来。new_authority_name 入力は HTML5 required（authority.twig:182）で
        // ブラウザが送信をブロックするため、client 検証の観測方法を実機確認後に実装。
      }
    );
  }
);
