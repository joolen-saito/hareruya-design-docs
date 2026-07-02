/**
 * フロント 会員「登録済クレジットカード」（F06-19）E2E。
 * integration_test/e2e/f06_19_front_member_mypage_credit_card_e2e_cases.md に対応。
 *
 * 期待結果は functions/ec-cube-enterprise/f06-19_front_member_mypage_credit_card.md 由来。
 * 決済代行へのカード登録・削除は外部サービスと会員枠を変更するため、専用シード/スタブが整うまで fixme にする。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberMypageCreditCardPage } from "../../../pages/front/f06/f06_19_front_member_mypage_credit_card.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > 登録済クレジットカード", { tag: ["@front", "@member"] }, () => {
  test("E2E-F06-19-010 未ログインでカード編集画面へ直接アクセスするとマイページ入口へ誘導される", async ({ page }) => {
    const creditCard = new FrontMemberMypageCreditCardPage(page);
    await creditCard.gotoCardPage();
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(page.locator('input[type="password"], input[name*="password"]').first()).toBeVisible();
  });

  test("E2E-F06-19-001 ログイン済みなら登録済クレジットカード画面とカード入力フォームを表示する", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const creditCard = new FrontMemberMypageCreditCardPage(page);
    await creditCard.login();
    await creditCard.gotoCardPage();
    await creditCard.seeCardScreen();
  });

  test("E2E-F06-19-012 画面見出しは「マイページ/登録済クレジットカード」である", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const creditCard = new FrontMemberMypageCreditCardPage(page);
    await creditCard.login();
    await creditCard.gotoCardPage();
    await expect(creditCard.body).toContainText("マイページ");
    await expect(creditCard.heading).toBeVisible();
  });

  test("E2E-F06-19-015 設定で表示されている入力補助文は設計書どおり表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const creditCard = new FrontMemberMypageCreditCardPage(page);
    await creditCard.login();
    await creditCard.gotoCardPage();
    await creditCard.seeHelperTextsIfConfigured();
  });

  test("E2E-F06-19-016 専用モーダルは初期表示しない", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const creditCard = new FrontMemberMypageCreditCardPage(page);
    await creditCard.login();
    await creditCard.gotoCardPage();
    await expect(page.locator(".modal.show")).toHaveCount(0);
  });

  test("E2E-F06-19-013 未入力でカード情報登録を押すとクライアント側チェックで送信前に止まる", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const creditCard = new FrontMemberMypageCreditCardPage(page);
    await creditCard.login();
    await creditCard.gotoCardPage();

    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });
    await creditCard.registerButton.click();
    expect(dialogMessage).toContain("入力項目を再度ご確認ください");
    await expect(page).toHaveURL(/\/mypage\/sln_edit_card(?:\?|$)/);
  });

  test.fixme("E2E-F06-19-018 登録済みカードがある場合はマスク表示と有効期限を表示する（要: 決済代行会員枠シード）", async () => {});
  test.fixme("E2E-F06-19-008 トークン生成後にカード登録・差し替えを送信し更新完了フラッシュを表示する（要: 決済代行スタブ/隔離環境）", async () => {});
  test.fixme("E2E-F06-19-009 カード削除ボタンで削除指示トークンを送信し会員枠を無効化する（要: 登録済みカードシード/隔離環境）", async () => {});
  test.fixme("E2E-F06-19-011 カード会員登録を使わない設定ではHTTP404になる（要: 店舗設定シード）", async () => {});
  test.fixme("E2E-F06-19-030 トークン生成通信障害時は通信エラーを表示してマイページへ戻す（要: 外部スクリプト失敗注入）", async () => {});
});
