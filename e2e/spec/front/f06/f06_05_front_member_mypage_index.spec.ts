/**
 * フロント 会員「マイページ（トップ）」（F06-05）E2E。本リポジトリでは未実行の雛形。
 * 対応ケース表: integration_test/e2e/f06_05_front_member_mypage_index_e2e_cases.md
 *
 * 期待結果（オラクル）は functions/pf-eccube3/f06-05_front_member_mypage_index.md（利用者視点の入口・
 * 処理フロー・フロント挙動・権限認可）由来であり、実装/POM由来の表示文言をオラクル化しない。
 * /mypage 配下は会員ログイン必須。未認証→会員ログイン誘導は live、ログイン後の表示内容は
 * 会員資格情報が要るため test.skip(!HAS_FRONT_CREDS,...) 付き live、要シードのものは test.fixme で保留する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberMypageIndexPage } from "../../../pages/front/f06/f06_05_front_member_mypage_index.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > マイページトップ", { tag: ["@front", "@member"] }, () => {
  test("E2E-F06-05-015 未ログインでマイページトップへアクセスすると会員ログインへ誘導される", async ({ page }) => {
    const mypage = new FrontMemberMypageIndexPage(page);
    await mypage.gotoMypage();
    await mypage.seeLoginRedirect();
  });

  test("E2E-F06-05-021 未ログインで保護された会員機能URLへ直接アクセスすると会員ログインへ誘導される", async ({ page }) => {
    const mypage = new FrontMemberMypageIndexPage(page);
    await mypage.gotoProtectedUrl();
    await mypage.seeLoginRedirect();
  });

  test("E2E-F06-05-002 未認証ではマイページの機能ブロックを表示しない", async ({ page }) => {
    const mypage = new FrontMemberMypageIndexPage(page);
    await mypage.gotoMypage();
    // 機能ブロックを表示せず、会員ログイン画面（パスワード欄）が表示されること。
    await expect(mypage.loginPasswordInput).toBeVisible();
    await expect(page).not.toHaveURL(/\/mypage(?:\/)?$/);
  });

  test("E2E-F06-05-005 ログイン後にマイページ見出しと各機能ブロックが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const mypage = new FrontMemberMypageIndexPage(page);
    await mypage.login();
    await mypage.gotoMypage();
    await mypage.seeMypageScreen();
  });

  test("E2E-F06-05-010 ログイン後に現在の保有ポイントが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const mypage = new FrontMemberMypageIndexPage(page);
    await mypage.login();
    await mypage.gotoMypage();
    await expect(mypage.currentPoint).toBeVisible();
  });

  test("E2E-F06-05-003 各機能ブロックを押下すると対応する機能の画面へ遷移する", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const mypage = new FrontMemberMypageIndexPage(page);
    await mypage.login();
    await mypage.gotoMypage();
    await mypage.shoppingHistoryLink.click();
    // 押下した機能の画面（マイページ配下の別機能URL）へ遷移すること。
    await expect(page).toHaveURL(/\/mypage\//);
  });

  // 要シード（期限の近いポイント履歴）: 失効間近のポイント表示は会員のポイント履歴に依存する。
  test.fixme("E2E-F06-05-011 期限の近いポイントが表示される（要: 期限の近いポイント履歴シード）", async () => {});
  // 要シード（期限の近いポイント無しの会員）: 「対象なし」表示の確認。
  test.fixme("E2E-F06-05-014 期限の近いポイントが無い場合は対象なしとして表示される（要: 会員シード）", async () => {});
  // 要セッション状態（商品検索の戻り先）: 戻り先があればマイページを表示せずリダイレクトし戻り先を消去する。
  test.fixme("E2E-F06-05-013 商品検索の戻り先がある場合は戻り先へリダイレクトし戻り先を消去する（要: 商品検索戻り先セッション）", async () => {});
  // 要ログインセッション: ヘッダー用保有ポイントの別エンドポイント（/mypage/point_in_header）応答確認。
  test.fixme("E2E-F06-05-019 ヘッダー用保有ポイントは別エンドポイントで返される（要: 会員ログインセッション）", async () => {});
});
