/**
 * フロント 会員「退会（退会手続き）」（F06-21）E2E。
 * integration_test/e2e/f06_21_front_member_mypage_withdraw_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-21_front_member_mypage_withdraw.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 会員資格情報は ECCUBE_FRONT_USER/PASS（未設定時は要ログインケースを test.skip）。
 *
 * 破壊的操作の扱い: 退会実行（mode=complete・正パスワード一致）は会員を論理削除し外部連携・メール送信を
 * 伴うため live では走らせない。非破壊（未認証誘導・退会前/確認画面の表示・戻る遷移・誤り/未入力パスワードの
 * 照合失敗）のみ live（要ログイン系は test.skip）。退会実行・退会完了画面・連携失敗は test.fixme（理由付き）
 * で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberWithdrawPage } from "../../../pages/front/f06/f06_21_front_member_mypage_withdraw.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 会員 > 退会（退会手続き）", { tag: ["@front", "@member"] }, () => {
  // --- 未認証（資格情報・シード不要で走る live） ---
  test("E2E-F06-21-002 未ログインで退会画面へアクセスすると会員ログインへ誘導される", async ({ page }) => {
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.gotoWithdraw();
    await withdraw.seeLoginRedirect();
  });

  test("E2E-F06-21-021 未ログインで退会完了URLへ直接アクセスすると会員ログインへ誘導される", async ({ page }) => {
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.gotoWithdrawComplete();
    await withdraw.seeLoginRedirect();
  });

  // --- 要ログイン・非破壊（退会前/確認画面の表示・遷移・照合失敗）。creds が無い環境は skip ---
  test("E2E-F06-21-005 退会前画面に見出し「退会」と注意文・「退会手続きへ」が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.gotoWithdraw();
    await withdraw.seeWithdrawTopScreen();
    await expect(withdraw.body).toContainText("退会手続きの前に、ご確認ください");
  });

  test("E2E-F06-21-009 退会前画面に「退会手続きへ」「戻る」が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.gotoWithdraw();
    await expect(withdraw.proceedButton).toBeVisible();
    await expect(withdraw.backLink).toBeVisible();
  });

  test("E2E-F06-21-006 「退会手続きへ」押下で退会確認画面（パスワード欄・退会する）が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.proceedToConfirm();
    await withdraw.seeConfirmScreen();
  });

  test("E2E-F06-21-007 退会前画面の「戻る」でマイページトップへ戻る", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.gotoWithdraw();
    await withdraw.backLink.click();
    await expect(page).toHaveURL(/\/mypage(?:\/|\?|$)/);
    await expect(page).not.toHaveURL(/\/withdraw/);
  });

  test("E2E-F06-21-014 退会確認画面の見出しは「退会手続き」である", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.proceedToConfirm();
    await expect(withdraw.body).toContainText("退会手続き");
  });

  test("E2E-F06-21-015 退会確認画面に案内文「退会手続きを実行してもよろしいでしょうか。」が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.proceedToConfirm();
    await expect(withdraw.body).toContainText("退会手続きを実行してもよろしいでしょうか");
  });

  test("E2E-F06-21-016 退会確認画面に削除される旨の注意事項が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.proceedToConfirm();
    await expect(withdraw.body).toContainText("購入履歴や個人情報はすべて削除されます");
  });

  test("E2E-F06-21-017 退会確認画面にパスワード案内文と現在パスワード欄が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.proceedToConfirm();
    await expect(withdraw.body).toContainText("現在のパスワードを入力し");
    await expect(withdraw.passwordInput).toBeVisible();
  });

  test("E2E-F06-21-056 パスワード未入力で「退会する」を押しても退会せず退会確認画面に留まる", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.proceedToConfirm();
    await withdraw.submitWithdraw(""); // 未入力＝照合不一致（非破壊）
    await expect(page).toHaveURL(/\/mypage\/withdraw(?:\?|$)/);
    await expect(page).not.toHaveURL(/withdraw_complete/);
  });

  test("E2E-F06-21-020 誤ったパスワードで「退会する」を押すと「パスワードに誤りがあります。」が表示され退会しない", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const withdraw = new FrontMemberWithdrawPage(page);
    await withdraw.login();
    await withdraw.proceedToConfirm();
    await withdraw.submitWithdraw("wrong-" + "Passw0rd"); // 誤りパスワード＝照合不一致（非破壊）
    await expect(withdraw.body).toContainText("パスワードに誤りがあります");
    await expect(page).not.toHaveURL(/withdraw_complete/);
  });

  // --- 破壊的（退会実行）／要会員シード・メール・スマレジ連携。live では走らせず fixme で保留 ---
  test.fixme("E2E-F06-21-057 退会実行で会員が論理削除されメールがダミー化・選手情報が削除される（要: 使い捨て会員シード/破壊的）", async () => {});
  test.fixme("E2E-F06-21-074 退会実行で退会完了画面へ遷移しログアウトされる（要: 使い捨て会員シード/メール/破壊的）", async () => {});
  test.fixme("E2E-F06-21-018 退会完了画面の見出しは「退会完了」である（要: 退会実行到達/使い捨て会員シード）", async () => {});
  test.fixme("E2E-F06-21-019 退会完了画面に完了メッセージが表示される（要: 退会実行到達/使い捨て会員シード）", async () => {});
  test.fixme("E2E-F06-21-008 退会完了画面に「ホームへ戻る」リンクが表示される（要: 退会実行到達/使い捨て会員シード）", async () => {});
  test.fixme("E2E-F06-21-067 スマレジ連携失敗時は会員を残し「退会処理の途中でエラーが発生しました。」を表示する（要: スマレジ連携失敗注入/使い捨て会員シード）", async () => {});
});
