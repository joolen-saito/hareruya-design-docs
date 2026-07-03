/**
 * フロント 会員/店舗「店頭PC用アカウントで通常会員と異なる制御」（F06-26）E2E。
 * 本リポジトリでは未実行の雛形。ec-cube-enterprise/pf-eccube3 の実画面は実行不可で構造参考のみ。
 * 対応ケース表: integration_test/e2e/f06_26_front_member_store_pc_account_control_e2e_cases.md
 *
 * 期待結果（オラクル）は functions/pf-eccube3/f06-26_front_member_store_pc_account_control.md 由来であり、
 * 実装/POM由来の表示文言をオラクル化しない。本機能は店内アカウント会員・許可IP設定・店頭フロント区分に依存する。
 * 非破壊で確認できる「非会員/通常会員は制御対象外（店頭エラーを出さない）」は live／skip-live。
 * 店内アカウント会員・許可IP制御・番号札採番（破壊的・要シード）は test.fixme（理由付き）で保留する。
 * 顧客グループ判定・端末IP取得・番号札採番（DB内部/間接）はケース表で管理し spec に置かない。
 */
import { test, expect } from "@playwright/test";
import { FrontStorePcAccountControlPage } from "../../../pages/front/f06/f06_26_front_member_store_pc_account_control.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 店舗 > 店頭PC用アカウント制御", { tag: ["@front", "@store", "@member"] }, () => {
  test("E2E-F06-26-002 非会員（未ログイン）は制御対象外で店頭用アカウント遮断画面を出さない", async ({ page }) => {
    const ctrl = new FrontStorePcAccountControlPage(page);
    // お問い合わせは公開機能。非会員はIP判定・機能遮断の対象外（通常表示）。
    await ctrl.goto(ctrl.contactUrl);
    await ctrl.seeNotBlocked();
  });

  test("E2E-F06-26-055 通常会員は遮断対象機能（会員情報変更）を利用でき店頭エラーが出ない", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const ctrl = new FrontStorePcAccountControlPage(page);
    await ctrl.login();
    await ctrl.goto(ctrl.memberEditUrl);
    // 通常会員は店頭フロント区分が立たず遮断されない（共通エラー画面が出ない）。
    await ctrl.seeNotBlocked();
  });

  // --- 店内アカウント会員・許可IP・店頭フロント区分に依存（破壊的/要シード）。自動化可能だが本リポ環境では保留 ---
  test.fixme("E2E-F06-26-003 店頭フロント区分の会員が遮断対象機能へアクセスすると共通エラー画面を返す（要: SEED-F06-26-SHOP-FRONT 会員シード）", async () => {});
  test.fixme("E2E-F06-26-004 遮断時に共通エラー画面タイトル「店頭用アカウントでは利用できません。」を表示する（要: SEED-F06-26-SHOP-FRONT）", async () => {});
  test.fixme("E2E-F06-26-007 共通エラー画面の本文は空である（要: SEED-F06-26-SHOP-FRONT）", async () => {});
  test.fixme("E2E-F06-26-009 店内アカウントが許可IP内から非遮断機能へアクセスすると通常利用できる（要: SEED-F06-26-OTC-ACCOUNT＋許可IP）", async () => {});
  test.fixme("E2E-F06-26-010 店内アカウントが遮断対象機能へアクセスすると共通エラー画面を返す（要: SEED-F06-26-OTC-ACCOUNT）", async () => {});
  test.fixme("E2E-F06-26-006 店内アカウントが許可IP外からアクセスすると即時ログアウトへリダイレクトされる（要: SEED-F06-26-OTC-ACCOUNT＋許可IP隔離）", async () => {});
  test.fixme("E2E-F06-26-013 許可IP外はログアウト・遮断対象機能は共通エラー画面となる（要: SEED-F06-26-OTC-ACCOUNT＋許可IP）", async () => {});
  test.fixme("E2E-F06-26-021 店内アカウントが遮断対象URLへ直接アクセスすると共通エラー画面を返す（要: SEED-F06-26-OTC-ACCOUNT）", async () => {});
  test.fixme("E2E-F06-26-011 店内アカウントの受注確定時に番号札を採番する（通常会員では採番しない）（要: 受注確定/破壊的・SEED-F06-26-OTC-ACCOUNT）", async () => {});
});
