/**
 * 管理画面 店舗設定 > 特定商取引法（M10-02）E2E。納品ケース表
 * integration_test/e2e/m10_02_admin_base_setting_setting_shop_tradelaw_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、自動化予定だが未実装/要実機（最大長境界の確定）は test.fixme（理由付き）で残す。
 * 手動/対象外（DB原値・update_date・イベント発火・ログ抑止・CSRF内部・刷新先に存在しない固定項目検証）は
 * ケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（設計書 functions/pf-eccube3/m10-02_admin_base_setting_setting_shop_tradelaw.md ＋ 観点表 ＋
 * 基本設計＝刷新後要件）由来（オラクル独立性）。実装の現挙動・Form制約をオラクル化しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 仕様乖離の注意: 設計源 pf-eccube3 は dtb_help 固定列（販売業者・メール・URL・TEL/FAX 3分割・都道府県・law_term01〜06）
 *  を前提とするが、刷新先 ec-cube-enterprise の当画面は dtb_tradelaw の「名称・説明」行コレクションの編集表である。
 *  本specは刷新先の実画面で観測可能な挙動のみを自動化する（旧固定項目検証はケース表 付帯表4で乖離として管理）。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 *  既存の spec/admin/login.spec.ts・m09/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 *  資格情報が無ければ走らないよう test.skip(!HAS_CREDS) でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 永続化注意: 保存系（010/011/020/021）は dtb_tradelaw の説明値を書き換える。共有ステージングでの実行は
 *  店舗フロント表示へ影響しうるため、識別接頭辞付きの値を使い、専用環境または後始末前提で実行すること（SEED-M10-02-TRADELAW）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminBaseSettingSettingShopTradelawPage } from "../../../pages/admin/m10/m10_02_admin_base_setting_setting_shop_tradelaw.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const TRADELAW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/tradelaw(\\?|$)`);

// 設計書「表示メッセージ」由来の文言（仕様＝オラクル）。部分一致で判定し i18n 句読点差に左右されない。
const SUCCESS_MSG = "保存しました"; // 処理フロー POST成功（成功フラッシュ）

async function loginAndOpen(page: Page): Promise<AdminBaseSettingSettingShopTradelawPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const tl = new AdminBaseSettingSettingShopTradelawPage(page);
  await tl.goto();
  return tl;
}

test.describe("管理画面 > 店舗設定 > 特定商取引法", { tag: ["@admin", "@setting"] }, () => {
  // ===== 画面表示（E2E自動化） =====

  test("E2E-M10-02-001 編集画面: 見出し・表ヘッダ「名称」「説明」・保存ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tl = await loginAndOpen(page);
    await tl.seeEditForm();
  });

  test("E2E-M10-02-002 編集画面: 各特商法行に名称入力欄と説明テキストエリアが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const tl = await loginAndOpen(page);
    await expect(tl.nameInput(1)).toBeVisible();
    await expect(tl.descriptionInput(1)).toBeVisible();
  });

  test("E2E-M10-02-003 編集画面: DBの特定商取引法行が読み込まれ表示される（1件以上）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-02-TRADELAW 前提）");
    const tl = await loginAndOpen(page);
    expect(await tl.rows.count()).toBeGreaterThan(0);
  });

  // ===== 保存（E2E自動化） =====

  test("E2E-M10-02-010 説明を編集して保存→成功メッセージが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-02-TRADELAW 前提）");
    const tl = await loginAndOpen(page);
    const value = `E2E-M10-02 説明 ${Date.now()}`; // 識別接頭辞付き
    await tl.editDescriptionAndSave(value, 1);
    await expect(page.locator("body")).toContainText(SUCCESS_MSG); // 仕様: POST成功で成功メッセージ
  });

  test("E2E-M10-02-011 保存後に同一編集画面へ遷移し編集値が再表示される（間接永続化）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-02-TRADELAW 前提）");
    const tl = await loginAndOpen(page);
    const value = `E2E-M10-02 永続 ${Date.now()}`;
    await tl.editDescriptionAndSave(value, 1);
    await expect(page).toHaveURL(TRADELAW_RE); // 仕様: 同一編集画面へリダイレクト
    await expect(tl.descriptionInput(1)).toHaveValue(value); // 仕様: 保存値が再表示される（間接確認）
  });

  test("E2E-M10-02-020 最大長超過の説明で保存→同一画面に留まり保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-02-TRADELAW 前提）");
    const tl = await loginAndOpen(page);
    // 境界長は設計書に明記がなくForm制約をオラクル化しないため、いかなる上限も明確に超える長大文字列で異常系を観測する。
    // 厳密な境界長（説明=実機で要確認）は別途確定するが、仕様「最大長超過は保存しない」はこの粗い超過で観測可能。
    const tooLong = "あ".repeat(100000);
    await tl.editDescriptionAndSave(tooLong, 1);
    // 仕様（処理フロー POST失敗）: 保存されず同一編集画面に留まり、検証エラーが表示される（成功メッセージは出ない）。
    await expect(page).toHaveURL(TRADELAW_RE);
    await expect(page.locator("body")).not.toContainText(SUCCESS_MSG);
    await expect(tl.errors.first()).toBeVisible();
  });

  test("E2E-M10-02-021 最大長以内の説明は保存に成功する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-02-TRADELAW 前提）");
    const tl = await loginAndOpen(page);
    // 境界長は設計書に明記がなくForm値をオラクル化しないため、十分に安全な長さで正常系を確認する。
    const value = "あ".repeat(100);
    await tl.editDescriptionAndSave(value, 1);
    await expect(page.locator("body")).toContainText(SUCCESS_MSG);
  });

  test("E2E-M10-02-022 最大長以内の名称は保存に成功する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-02-TRADELAW 前提）");
    const tl = await loginAndOpen(page);
    // 名称も最大長制約を持つ（刷新先要件）。境界長はオラクル化せず安全な短い値で正常系を確認する。
    const value = `E2E-M10-02 名称 ${Date.now()}`;
    await tl.editNameAndSave(value, 1);
    await expect(page.locator("body")).toContainText(SUCCESS_MSG);
  });

  test("E2E-M10-02-023 最大長超過の名称で保存→同一画面に留まり保存されない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-02-TRADELAW 前提）");
    const tl = await loginAndOpen(page);
    // 名称の境界長（要実機確認）はオラクル化しないため、いかなる上限も明確に超える長大文字列で異常系を観測する。
    const tooLong = "あ".repeat(100000);
    await tl.editNameAndSave(tooLong, 1);
    await expect(page).toHaveURL(TRADELAW_RE);
    await expect(page.locator("body")).not.toContainText(SUCCESS_MSG);
    await expect(tl.errors.first()).toBeVisible();
  });

  // ===== フロント参照（E2E自動化・認証不要） =====

  test("E2E-M10-02-030 フロント /help/tradelaw に名称・説明が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-02-TRADELAW 前提）");
    // まず管理画面で識別可能な名称・説明を保存し、フロントへ反映されることを確認する（データ整合性）。
    // フロントは name と description が両方非空の行のみ表示するため、名称も非空にして保存する。
    const tl = await loginAndOpen(page);
    const nameValue = `E2E-M10-02 名称 ${Date.now()}`;
    const descValue = `E2E-M10-02 フロント ${Date.now()}`;
    await tl.editRowAndSave(nameValue, descValue, 1);
    await expect(page).toHaveURL(TRADELAW_RE);
    await tl.gotoFront();
    await expect(tl.frontHeading).toBeVisible();
    // 仕様: 同一データがフロントに表示される。管理(getMallBaseInfo)とフロント(eccube_root_base_info_id)で
    // 参照する baseInfo が一致する前提（既定店舗が両者で同一であること＝要確認 / SEED-M10-02-TRADELAW）。
    await expect(page.locator("body")).toContainText(descValue);
    await expect(page.locator("body")).toContainText(nameValue);
  });

  test("E2E-M10-02-031 フロント: 名称・説明が両方そろう行のみ表示される（空行は非表示）", async ({ page }) => {
    // 認証不要。SEED-M10-02-TRADELAW に空説明の行が含まれる前提。表示される行は全て名称・説明が非空であること。
    const tl = new AdminBaseSettingSettingShopTradelawPage(page);
    await tl.gotoFront();
    await expect(tl.frontHeading).toBeVisible();
    const dlCount = await tl.frontRows.count();
    // 0件表示でループが素通りして偽陽性になるのを防ぐ。SEED は両値非空の行を最低1件含む前提のため
    // 少なくとも1行は表示されること（＝表示抑止が「全行非表示」ではないこと）を確認する。
    expect(dlCount).toBeGreaterThan(0);
    for (let i = 0; i < dlCount; i++) {
      const dl = tl.frontRows.nth(i);
      await expect(dl.locator("dt")).not.toBeEmpty(); // 名称
      await expect(dl.locator("dd")).not.toBeEmpty(); // 説明
    }
  });

  // ===== 権限・認可（E2E自動化・資格情報不要） =====

  test("E2E-M10-02-040 未ログインで編集URL直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/tradelaw`);
    await expect(page).toHaveURL(LOGIN_RE); // 仕様: 未ログインは管理ログインへ誘導
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M10-02-041 ログイン済み（ROLE_ADMIN）で編集URL直接アクセス→編集画面が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M10-02-ADMIN 前提）");
    // 040（未ログイン誘導）の正常系対。仕様: ログイン済み ROLE_ADMIN は当画面の表示が行える（正本226-232）。
    const tl = await loginAndOpen(page); // ログイン後に編集URLへ直接遷移する
    await expect(page).toHaveURL(TRADELAW_RE); // ログイン画面へ落ちず編集画面に留まる
    await tl.seeEditForm(); // 見出し・保存ボタン等が表示される
  });

  // 注: 厳密な最大長の「境界値（max ちょうど / max+1）」検証はForm制約をオラクル化しないため本specでは扱わない。
  //  020/023 は「いかなる上限も明確に超える長大値で保存されない」ことの観測に留め、境界長の実機確定は付帯表4#7で要確認。
  //  手動/対象外（DB原値・update_date・イベント発火・ログ抑止・CSRF内部・刷新先に存在しない固定項目検証）はケース表で全量管理する。
});
