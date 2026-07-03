/**
 * フロント 会員「オンライン本人確認」（F06-13）E2E。
 * integration_test/e2e/f06_13_front_member_mypage_online_identification_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-13_front_member_mypage_online_identification.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 会員資格情報は ECCUBE_FRONT_USER/PASS（未設定時は会員ログイン必須ケースを test.skip）。
 * 撮影・申請はスマートフォン・タブレット限定で、撮影画像・オブジェクトストレージ・外部本人確認・
 * 申請完了メールを伴うため、当該フローは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberOnlineIdentificationPage } from "../../../pages/front/f06/f06_13_front_member_mypage_online_identification.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > オンライン本人確認", { tag: ["@front", "@member"] }, () => {
  // --- 資格情報不要・非破壊の live（未認証の保護URL誘導） ---
  test("E2E-F06-13-002 未認証でスタート画面へアクセスすると会員ログインへ誘導される", async ({ page }) => {
    const oi = new FrontMemberOnlineIdentificationPage(page);
    await oi.gotoStartPage();
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(page.locator('input[type="password"], input[name*="password"]').first()).toBeVisible();
  });

  test("E2E-F06-13-021 未認証で撮影・申請の保護URLへ直接アクセスすると会員ログインへ誘導される", async ({ page }) => {
    const oi = new FrontMemberOnlineIdentificationPage(page);
    await oi.gotoPhotographDirect();
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
  });

  // --- 会員ログインのみで非破壊に確認できる creds-gated live（スタート画面表示） ---
  test("E2E-F06-13-004 ログイン済みでスタート画面に説明・種別選択・撮影画面へが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const oi = new FrontMemberOnlineIdentificationPage(page);
    await oi.login();
    await oi.gotoStartPage();
    await oi.seeStartScreen();
  });

  test("E2E-F06-13-007 スタート画面の見出し「オンライン本人確認について」が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const oi = new FrontMemberOnlineIdentificationPage(page);
    await oi.login();
    await oi.gotoStartPage();
    await expect(oi.startHeading).toBeVisible();
  });

  test("E2E-F06-13-009 スタート画面の必須項目に必須表示が付く", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const oi = new FrontMemberOnlineIdentificationPage(page);
    await oi.login();
    await oi.gotoStartPage();
    // 必須表示は文言/記号（「必須」等）で拾う（要実機確認：start.twig の必須表示形）。
    await expect(oi.identificationSelect).toBeVisible();
  });

  test("E2E-F06-13-010 スタート説明文が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const oi = new FrontMemberOnlineIdentificationPage(page);
    await oi.login();
    await oi.gotoStartPage();
    await expect(oi.body).toContainText("事前にオンラインで本人確認を行うことができます");
  });

  test("E2E-F06-13-011 再アップロード注意文が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const oi = new FrontMemberOnlineIdentificationPage(page);
    await oi.login();
    await oi.gotoStartPage();
    await expect(oi.body).toContainText("再度身分証のアップロードが必要となります");
  });

  // --- 要スマホ/タブレットUA・撮影画像・外部連携・DB更新・メール。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F06-13-005 スマホ・種別選択で「撮影画面へ」を押すと撮影画面へ遷移する（要: スマホ/タブレットUA/会員シード）", async () => {});
  test.fixme("E2E-F06-13-012 撮影画面に撮影案内と最新画像同意が表示される（要: スマホ/タブレットUA/会員シード）", async () => {});
  test.fixme("E2E-F06-13-015 PCで「撮影画面へ」を押すとスタート画面へ戻る（要: PC端末判定/会員シード/種別選択）", async () => {});
  test.fixme("E2E-F06-13-020 撮影画面へ直接アクセス（未送信）するとマイページへ戻る（要: スマホ/タブレットUA/会員シード）", async () => {});
  test.fixme("E2E-F06-13-075 撮影フォーム検証失敗時はエラー状態を付けて撮影画面へ戻る（要: スマホ/タブレットUA/会員シード）", async () => {});
  test.fixme("E2E-F06-13-022 画像の拡張子が判別できない場合は共通エラー画面を表示し申請を確定しない（要: スマホ/タブレットUA/不正画像/会員シード）", async () => {});
  test.fixme("E2E-F06-13-074 申請がPC・送信内容なし・未送信の場合はマイページへ戻す（要: 会員シード/端末判定）", async () => {});
  test.fixme("E2E-F06-13-001 なりすまし対策トークンが不整合な申請は成立しない（要: スマホ/タブレットUA/会員シード/DOM改ざん）", async () => {});
  test.fixme("E2E-F06-13-006 正当な申請で画像を保存しステータスを確認中に更新して申請完了画面を表示する（要: スマホ/タブレットUA/会員シード/外部本人確認/画像/メール）", async () => {});
  test.fixme("E2E-F06-13-013 申請完了画面に完了メッセージが表示される（要: 申請成立状態）", async () => {});
  test.fixme("E2E-F06-13-014 申請完了画面に確認中表示がされる（要: 申請成立状態）", async () => {});
});
