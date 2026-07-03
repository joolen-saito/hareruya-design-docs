/**
 * フロント 会員「会員情報変更」（F06-18）E2E。本リポジトリでは未実行の雛形。
 * 対応ケース表: integration_test/e2e/f06_18_front_member_mypage_customer_edit_e2e_cases.md
 *
 * 期待結果（オラクル）は functions/pf-eccube3/f06-18_front_member_mypage_customer_edit.md（利用者視点の入口・
 * 処理フロー・フロント挙動・バリデーション・画面遷移・権限認可）由来であり、実装/POM由来の表示文言をオラクル化しない。
 * /mypage/change は会員ログイン必須。未認証→会員ログイン誘導は live、ログイン後の表示・非破壊バリデーションは
 * 会員資格情報が要るため test.skip(!HAS_FRONT_CREDS,...) 付き live、更新確定(妥当送信=スマレジ連携/会員情報更新)や
 * 特殊会員/連携失敗を要する破壊的・要シード系は test.fixme（理由付き）で保留する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberMypageCustomerEditPage } from "../../../pages/front/f06/f06_18_front_member_mypage_customer_edit.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > 会員情報変更", { tag: ["@front", "@member"] }, () => {
  test("E2E-F06-18-002 未ログインで会員情報変更へアクセスすると会員ログインへ誘導される", async ({ page }) => {
    const edit = new FrontMemberMypageCustomerEditPage(page);
    await edit.gotoChange();
    await edit.seeLoginRedirect();
  });

  test("E2E-F06-18-021 未ログインで保護URLへ直接アクセスすると会員ログインへ誘導される", async ({ page }) => {
    const edit = new FrontMemberMypageCustomerEditPage(page);
    await edit.gotoProtectedUrl();
    await edit.seeLoginRedirect();
  });

  test("E2E-F06-18-009 ログイン後に見出し「会員情報変更」が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const edit = new FrontMemberMypageCustomerEditPage(page);
    await edit.login();
    await edit.gotoChange();
    await expect(edit.body).toContainText("会員情報変更");
    await expect(edit.heading).toBeVisible();
  });

  test("E2E-F06-18-006 ログイン後に現在の会員情報を初期表示した編集フォームが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const edit = new FrontMemberMypageCustomerEditPage(page);
    await edit.login();
    await edit.gotoChange();
    await edit.seeEditForm();
  });

  test("E2E-F06-18-024 必須項目を空にして送信すると更新されず編集フォームに留まる", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const edit = new FrontMemberMypageCustomerEditPage(page);
    await edit.login();
    await edit.gotoChange();
    // 必須のお名前（姓）を空にして送信 → 検証不成立で更新せず編集画面を再描画（判定順序#2）。
    await edit.name01Input.fill("");
    await edit.submitButton.click();
    await expect(page).toHaveURL(/\/mypage\/change(?:\?|$)/);
  });

  test("E2E-F06-18-027 MTG Companion登録名に最大長超過(129文字)を入力して送信すると更新されない", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const edit = new FrontMemberMypageCustomerEditPage(page);
    await edit.login();
    await edit.gotoChange();
    // MTG Companion登録名は各128文字以内（仕様：バリデーション）。129文字は文字数超過で更新しない。
    await edit.firstNameEnInput.fill("a".repeat(129));
    await edit.submitButton.click();
    await expect(page).toHaveURL(/\/mypage\/change(?:\?|$)/);
  });

  test("E2E-F06-18-050 メールアドレス確認欄が不一致だと更新されず編集フォームに留まる", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const edit = new FrontMemberMypageCustomerEditPage(page);
    await edit.login();
    await edit.gotoChange();
    // メールは確認用2欄で両欄一致を要する（仕様：バリデーション 相関）。不一致は更新しない。
    await edit.emailFirstInput.fill("e2e-f0618-a@example.test");
    await edit.emailSecondInput.fill("e2e-f0618-b@example.test");
    await edit.submitButton.click();
    await expect(page).toHaveURL(/\/mypage\/change(?:\?|$)/);
  });

  // 相関エラー（国=日本×都道府県=海外など）は国の選択肢・値が実機依存のため要実機確認（fixme）。
  test.fixme("E2E-F06-18-013 国と都道府県の不整合で国にエラーを付し再描画する（要: 国/都道府県セレクタ確定）", async () => {});
  // 国切替の再描画（isChange/countryCode）は住所項目の切替を伴い、更新を行わない。トリガ実装は要実機確認。
  test.fixme("E2E-F06-18-008 国切替の再描画(isChange)で入力を保持し編集フォームを再描画する（更新しない・要実機確認）", async () => {});

  // 以下は更新確定=スマレジ連携/会員情報更新を伴う破壊的操作、または特殊会員・連携失敗注入を要するため保留。
  test.fixme("E2E-F06-18-007 妥当入力＋スマレジ連携成功で会員情報を更新し会員情報変更完了画面へ遷移する（要: 会員シード/スマレジスタブ・破壊的）", async () => {});
  test.fixme("E2E-F06-18-085 更新確定後に再度編集画面を開くと更新値が初期表示される（更新反映・間接／要: 会員シード・破壊的）", async () => {});
  test.fixme("E2E-F06-18-012 スマレジ連携失敗時「会員情報の更新時にエラーが発生しました。」を表示し更新を確定せず再描画する（要: スマレジ連携失敗注入）", async () => {});
  test.fixme("E2E-F06-18-014 パスワードをマスク値のまま送信すると従前パスワードを維持し従前パスワードで再ログインできる（間接／要: 会員シード・破壊的）", async () => {});
  test.fixme("E2E-F06-18-015 会員IDとパスワードが同一の入力は更新せず編集フォームを再描画する（要: 会員ID=パスワードの特殊会員シード）", async () => {});
});
