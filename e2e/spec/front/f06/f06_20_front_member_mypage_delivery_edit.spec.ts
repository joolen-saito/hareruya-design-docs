/**
 * フロント 会員「配送先登録・編集」（F06-20）E2E。本リポジトリでは未実行の雛形。
 * 対応ケース表: integration_test/e2e/f06_20_front_member_mypage_delivery_edit_e2e_cases.md
 *
 * 期待結果（オラクル）は functions/pf-eccube3/f06-20_front_member_mypage_delivery_edit.md（利用者視点の入口・
 * 処理フロー・フロント挙動・バリデーション・画面遷移・権限認可）由来であり、実装/POM由来の表示文言をオラクル化しない。
 * /mypage/delivery 配下は会員ログイン必須。未認証→会員ログイン誘導は live、ログイン後の表示・非破壊バリデーションは
 * 会員資格情報が要るため test.skip(!HAS_FRONT_CREDS,...) 付き live、登録確定(…/confirm)や削除(…/delete)など
 * 破壊的・要シード系は test.fixme（理由付き）で保留する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberMypageDeliveryEditPage } from "../../../pages/front/f06/f06_20_front_member_mypage_delivery_edit.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > 配送先登録・編集", { tag: ["@front", "@member"] }, () => {
  test("E2E-F06-20-002 未ログインで配送先一覧へアクセスすると会員ログインへ誘導される", async ({ page }) => {
    const delivery = new FrontMemberMypageDeliveryEditPage(page);
    await delivery.gotoDelivery();
    await delivery.seeLoginRedirect();
  });

  test("E2E-F06-20-021 未ログインで新規登録編集URLへ直接アクセスすると会員ログインへ誘導される", async ({ page }) => {
    const delivery = new FrontMemberMypageDeliveryEditPage(page);
    await delivery.gotoNewEdit();
    await delivery.seeLoginRedirect();
  });

  test("E2E-F06-20-005 ログイン後に会員の配送先一覧が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const delivery = new FrontMemberMypageDeliveryEditPage(page);
    await delivery.login();
    await delivery.gotoDelivery();
    await delivery.seeDeliveryList();
  });

  test("E2E-F06-20-011 配送先一覧に「新規登録」導線が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const delivery = new FrontMemberMypageDeliveryEditPage(page);
    await delivery.login();
    await delivery.gotoDelivery();
    await expect(delivery.newRegisterLink).toBeVisible();
  });

  test("E2E-F06-20-006 新規登録の編集画面で入力フォームが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const delivery = new FrontMemberMypageDeliveryEditPage(page);
    await delivery.login();
    await delivery.gotoNewEdit();
    await delivery.seeNewEditForm();
  });

  test("E2E-F06-20-013 配送先編集画面は専用モーダルを初期表示しない", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const delivery = new FrontMemberMypageDeliveryEditPage(page);
    await delivery.login();
    await delivery.gotoNewEdit();
    // 仕様：本画面専用のモーダルは無い。
    await expect(page.locator(".modal.show")).toHaveCount(0);
  });

  test("E2E-F06-20-024 配送先名称を空にして送信すると確認画面へ進まず編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const delivery = new FrontMemberMypageDeliveryEditPage(page);
    await delivery.login();
    await delivery.gotoNewEdit();
    // 配送先名称は必須（仕様：バリデーション）。空送信は検証不成立で編集画面を再表示する。
    await delivery.addressNameInput.fill("");
    await delivery.toConfirmButton.click();
    await expect(page).toHaveURL(/\/delivery\/new\/edit(?:\?|$)/);
  });

  // 相関エラー（国=日本×都道府県=海外など）は国の選択肢・値が実機依存のため要実機確認（fixme）。
  test.fixme("E2E-F06-20-023 国と都道府県の不整合で国にエラーを付し編集画面を再描画する（要: 国/都道府県セレクタ確定）", async () => {});
  // 国切替の再描画（isChange/countryCode）は住所項目切替を伴い保存しない。トリガ実装は要実機確認。
  test.fixme("E2E-F06-20-025 国切替の再描画(isChange)で入力を保持し編集画面を再表示する（保存しない・要実機確認）", async () => {});

  // 以下は破壊的（登録確定/削除）または要シード（既存配送先/上限到達）のため保留。
  test.fixme("E2E-F06-20-007 既存配送先の「編集」で既存値が入力フォームに初期表示される（要: 既存配送先シード）", async () => {});
  test.fixme("E2E-F06-20-008 妥当入力の「確認画面へ」送信で入力内容の確認画面が表示される（要: 会員ログイン＋有効な配送先入力）", async () => {});
  test.fixme("E2E-F06-20-022 確認画面の「戻る」で保存せず編集画面を再表示する（要: 確認画面到達）", async () => {});
  test.fixme("E2E-F06-20-009 確認画面の「登録する」で配送先と名称を保存し一覧へリダイレクトする（要: 会員シード・破壊的登録）", async () => {});
  test.fixme("E2E-F06-20-010 配送先の「削除」で当該配送先を削除し一覧へリダイレクトする（要: 配送先シード・破壊的削除）", async () => {});
  test.fixme("E2E-F06-20-014 新規登録で配送先数が上限(20)以上のとき一覧へエラーを表示して戻す（要: 上限到達シード）", async () => {});
  test.fixme("E2E-F06-20-062 会員に紐づかない/IDなしの削除はHTTP404となる（要: なりすまし対策トークン・破壊的DELETE・要実機確認）", async () => {});
});
