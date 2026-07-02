/**
 * 管理画面 会員管理 > 会員登録仮登録完了メール再送 E2E。
 * 納品ケース表 integration_test/e2e/m08_14_admin_customer_customer_resend_provisional_mail_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースと、自動化予定だが未実装/要実機の test.fixme のみを置く。
 * 手動/対象外（実メール受信・本文・本登録用URL内容・secret_key 再生成のDB確認・CSRF内部・ログ抑止・
 * 同時更新・一覧検索委譲 等）はケース表で全量管理する。
 * 期待結果は仕様（正本 functions/pf-eccube3/m08-14_admin_customer_customer_resend_provisional_mail.md / 観点表）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行前提:
 *  - ログインは config の ECCUBE_ADMIN_USER/PASS（未設定なら test.skip でガード）。
 *  - 001/002/010/011 は会員一覧に「仮会員(PROVISIONAL)」が1件以上必要（SEED-M08-14-PROVISIONAL）。
 *    003 は「本会員(REGULAR)」が必要（SEED-M08-14-REGULAR）。会員IDは環境変数で受け取る。
 *  - 010/011（再送実行）は実メール送信の副作用があるため、catch-all 宛先の仮会員シードで実行する。
 *    共有環境への誤送信を避けるため HAS_MAIL_TARGET が無い限り test.skip とする。
 *  - 020(404)/021(トークン不正) は再送URLの直接GETが必要。isTokenValid() がコントローラ冒頭で走るため
 *    （CustomerController.php:188）、有効トークン付与や不正トークンの作り込みが要る＝要実機確認で test.fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerResendProvisionalMailPage } from "../../../pages/admin/m08/m08_14_admin_customer_customer_resend_provisional_mail.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 実メール送信の副作用回避フラグ。catch-all 宛先の仮会員シードが用意できた環境でのみ true。
const HAS_MAIL_TARGET = !!process.env.HAS_MAIL_TARGET;
// SEED-M08-14-PROVISIONAL（仮会員）/ SEED-M08-14-REGULAR（本会員）の会員ID。
const PROVISIONAL_ID = process.env.M08_14_PROVISIONAL_ID || "";
const REGULAR_ID = process.env.M08_14_REGULAR_ID || "";

const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "会員管理 > 仮登録完了メール再送",
  { tag: ["@admin", "@customer", "@mail"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M08-14-030 未ログインで再送URL→管理ログイン画面へ誘導", async ({ page }) => {
      const target = new CustomerCustomerResendProvisionalMailPage(page);
      await page.goto(target.resendUrl(1)); // 権限・認可: 未ログインはアクセス不可
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 会員一覧の行アクション（SEED-M08-14-PROVISIONAL / REGULAR） =====

    test("E2E-M08-14-001 仮会員の操作メニューに「仮会員メール再送」リンクが表示される", async ({ page }) => {
      test.skip(!(HAS_CREDS && PROVISIONAL_ID), "ECCUBE_ADMIN_USER/PASS と M08_14_PROVISIONAL_ID が必要");
      await login(page);
      const target = new CustomerCustomerResendProvisionalMailPage(page);
      await target.gotoCustomerList();
      await target.openRowMenu(PROVISIONAL_ID);
      await expect(target.resendMenuLink(PROVISIONAL_ID)).toBeVisible(); // index.twig:485
    });

    test("E2E-M08-14-002 再送リンク押下で「確認のうえ送信」できる確認操作経路が表示される", async ({ page }) => {
      test.skip(!(HAS_CREDS && PROVISIONAL_ID), "ECCUBE_ADMIN_USER/PASS と M08_14_PROVISIONAL_ID が必要");
      await login(page);
      const target = new CustomerCustomerResendProvisionalMailPage(page);
      await target.gotoCustomerList();
      await target.openResendModal(PROVISIONAL_ID);
      // 設計書(正本:74)は「本機能専用のモーダルは無い」とし、表示される確認ダイアログ文言は実装trans由来。
      // 文言一致をオラクルにせず、再送前に確認操作を経て送信できることのみを判定する。文言確認は要確認(付帯表4#4)。
      await target.seeConfirmStep(PROVISIONAL_ID);
    });

    test("E2E-M08-14-003 本会員には「仮会員メール再送」リンクが表示されない", async ({ page }) => {
      test.skip(!(HAS_CREDS && REGULAR_ID), "ECCUBE_ADMIN_USER/PASS と M08_14_REGULAR_ID が必要");
      await login(page);
      const target = new CustomerCustomerResendProvisionalMailPage(page);
      await target.gotoCustomerList();
      await target.openRowMenu(REGULAR_ID);
      // 仮会員(PROVISIONAL)のみ表示（index.twig:484）。本会員には存在しないこと。
      await expect(target.resendMenuLink(REGULAR_ID)).toHaveCount(0);
    });

    test("E2E-M08-14-004 確認モーダルのキャンセルで再送せず会員一覧に留まる", async ({ page }) => {
      test.skip(!(HAS_CREDS && PROVISIONAL_ID), "ECCUBE_ADMIN_USER/PASS と M08_14_PROVISIONAL_ID が必要");
      await login(page);
      const target = new CustomerCustomerResendProvisionalMailPage(page);
      await target.gotoCustomerList();
      await target.openResendModal(PROVISIONAL_ID);
      // 送信正常系(002→010)に対する中断系の対。キャンセルでメール送信が起こらないこと。
      await target.cancelResend(PROVISIONAL_ID);
      // 仕様(処理フロー#6は再送成功時のみ)由来: 再送していないため成功フラッシュは出ず、一覧に留まる。
      await expect(target.successAlert).toHaveCount(0);
      await expect(page).toHaveURL(LIST_RE);
    });

    // ===== 再送実行（実メール副作用・catch-all宛先の仮会員シード必須） =====

    test("E2E-M08-14-010 確認モーダルの送信で再送が完了し成功メッセージが表示される", async ({ page }) => {
      test.skip(
        !(HAS_CREDS && PROVISIONAL_ID && HAS_MAIL_TARGET),
        "実メール送信の副作用回避: HAS_MAIL_TARGET と catch-all 宛先の SEED-M08-14-PROVISIONAL が必要"
      );
      await login(page);
      const target = new CustomerCustomerResendProvisionalMailPage(page);
      await target.gotoCustomerList();
      await target.openResendModal(PROVISIONAL_ID);
      await target.submitResend(PROVISIONAL_ID);
      // 設計書(正本:95)の成功時出力＝「再送完了メッセージ」を成功フラッシュの表示で判定する。
      // 設計書はロケールキー admin.customer.resend.complete を挙げるのみで確定文言を示さず、
      // 実装文言(admin.common.send_complete「メールを送信しました」)はオラクル化しない(オラクル独立性)。
      // よって本specは「成功フラッシュが表示される」ことまでを自動判定の範囲とし、
      // 「再送完了」文言の一致検証は要確認(手動・不具合候補#3。設計書キーが未実装のため)とする。
      await expect(target.successAlert).toBeVisible();
    });

    test("E2E-M08-14-011 再送完了後に会員一覧へ戻る", async ({ page }) => {
      test.skip(
        !(HAS_CREDS && PROVISIONAL_ID && HAS_MAIL_TARGET),
        "実メール送信の副作用回避: HAS_MAIL_TARGET と catch-all 宛先の SEED-M08-14-PROVISIONAL が必要"
      );
      await login(page);
      const target = new CustomerCustomerResendProvisionalMailPage(page);
      await target.gotoCustomerList();
      await target.openResendModal(PROVISIONAL_ID);
      await target.submitResend(PROVISIONAL_ID);
      await expect(page).toHaveURL(LIST_RE); // redirectToRoute('admin_customer')（Controller.php:221）
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M08-14-020 不存在の会員IDで再送URL→404（要: 有効CSRFトークン付きの直接GET）",
      async () => {
        // 期待は仕様(エラー処理: 会員が存在しない→404)由来。isTokenValid()がfind()より前に走るため
        // （Controller.php:188-194）、有効トークンを付与したうえで不存在IDへGETする手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M08-14-021 なりすまし対策トークン不正で再送されない（要: 不正トークンの作り込み）",
      async () => {
        // 期待は仕様(エラー処理: トークン検証エラー→再送を行わない)由来。トークン検証エラー時の
        // レスポンス/表示を実機確認後に実装。再送（メール送信・secret_key更新）が行われないことを観測する。
      }
    );

    test.fixme(
      "E2E-M08-14-022 不正トークン+不存在IDでトークン検証エラーが404より先行する（判定順序）",
      async () => {
        // 期待は仕様(処理フロー#2 トークン検証→#3 会員取得)由来。isTokenValid()がfind()より前に走るため
        // （Controller.php:188-194）、不正トークン付きで不存在IDへアクセスしても404ではなくトークン検証エラーに
        // なる。不正トークン作り込み＋不存在ID併用が必要＝要実機確認後に実装。再送が行われないことを観測する。
      }
    );
  }
);
