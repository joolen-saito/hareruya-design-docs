/**
 * フロント 会員「入荷待ち商品一覧」（F06-08）E2E。
 * integration_test/e2e/f06_08_front_member_mypage_arrival_notification_e2e_cases.md に対応。
 *
 * 本リポジトリでは未実行の雛形（ec-cube-enterprise の Playwright は実行不可で構造参考のみ）。
 * 期待結果は functions/pf-eccube3/f06-08_front_member_mypage_arrival_notification.md（仕様）由来であり、
 * 実装/POM由来の表示文言をオラクル化しない。
 * 本機能は参照系の会員ログイン必須画面。未認証→ログイン誘導は資格情報なしで走る（live）。
 * 一覧の常時表示要素は要会員資格情報（test.skip(!HAS_FRONT_CREDS)）、
 * 入荷通知依頼シード（データ）が要る一覧内容は test.fixme（理由付き）で保留する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberMypageArrivalNotificationPage } from "../../../pages/front/f06/f06_08_front_member_mypage_arrival_notification.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > 入荷待ち商品一覧", { tag: ["@front", "@member"] }, () => {
  // --- live（資格情報・シード不要。未認証→ログイン誘導） ---

  test("E2E-F06-08-002 未認証で入荷待ち商品一覧へ直接アクセスするとログイン画面へ誘導される", async ({ page }) => {
    const notify = new FrontMemberMypageArrivalNotificationPage(page);
    await notify.gotoNotifyList();
    await notify.seeRedirectedToLogin();
  });

  test("E2E-F06-08-021 未ログインの保護URL直接アクセスで会員ログインへの誘導となる", async ({ page }) => {
    const notify = new FrontMemberMypageArrivalNotificationPage(page);
    await notify.gotoNotifyList();
    // 失敗時出力＝未ログイン時の会員ログインへの誘導（入出力節由来）
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(page.locator('input[type="password"], input[name*="password"]').first()).toBeVisible();
  });

  // --- skip付きlive（要会員資格情報。一覧の常時表示要素。データ不問） ---

  test("E2E-F06-08-005 ログイン後に見出し「入荷待ち商品一覧」が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const notify = new FrontMemberMypageArrivalNotificationPage(page);
    await notify.login();
    await notify.gotoNotifyList();
    await notify.seeHeading();
  });

  test("E2E-F06-08-011 入荷時に登録メールアドレスへ通知する旨の案内が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const notify = new FrontMemberMypageArrivalNotificationPage(page);
    await notify.login();
    await notify.gotoNotifyList();
    await notify.seeArrivalNotificationGuide();
  });

  test("E2E-F06-08-012 入荷通知登録の上限が拡張された旨の案内が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const notify = new FrontMemberMypageArrivalNotificationPage(page);
    await notify.login();
    await notify.gotoNotifyList();
    await notify.seeRegistrationLimitGuide();
  });

  test("E2E-F06-08-020 ログイン後に入荷待ち商品一覧の画面が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const notify = new FrontMemberMypageArrivalNotificationPage(page);
    await notify.login();
    await notify.gotoNotifyList();
    await notify.seeListScreen();
  });

  test("E2E-F06-08-006 一覧は専用モーダルを初期表示せず静的に表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const notify = new FrontMemberMypageArrivalNotificationPage(page);
    await notify.login();
    await notify.gotoNotifyList();
    await notify.seeNoDedicatedModal();
  });

  // --- fixme（要入荷通知依頼シード＝データ。一覧内容・遷移・件数・集約・価格・0件） ---

  test.fixme("E2E-F06-08-003 一覧の商品リンクから当該商品の商品詳細へ遷移する（要: 入荷通知依頼シード）", async () => {
    // 期待は画面遷移（商品リンク→/{_locale}/products/detail/{id}）由来。
  });
  test.fixme("E2E-F06-08-004 一覧のカード検索リンクから当該カードの検索結果へ遷移する（要: 入荷通知依頼シード）", async () => {
    // 期待は画面遷移（カード検索リンク→/{_locale}/products/search）由来。
  });
  test.fixme("E2E-F06-08-008 取得した依頼の件数が一覧の件数として表示される（要: 入荷通知依頼シード）", async () => {
    // 期待は集計条件（取得依頼件数を一覧件数として表示）由来。
  });
  test.fixme("E2E-F06-08-009 当該会員の入荷通知依頼のみが一覧に表示される（要: 2会員シード）", async () => {
    // 期待はデータ整合性（当該会員の依頼のみ参照。別会員の依頼は非表示）由来。
  });
  test.fixme("E2E-F06-08-010 同一商品・言語・価格区分で集約され明細が束ねて表示される（要: 集約対象の依頼シード）", async () => {
    // 期待は業務ルール（集約：同一商品・言語・価格区分でまとめ明細を束ねる）由来。
  });
  test.fixme("E2E-F06-08-013 一覧の価格に商品クラスの価格（price02）が表示される（要: price02設定済みシード）", async () => {
    // 期待は業務ルール・計算（価格は商品クラスの価格 price02）由来。
  });
  test.fixme("E2E-F06-08-014 入荷通知依頼が0件のとき入荷待ち商品が無い旨が表示される（要: 0件会員シード）", async () => {
    // 期待はエッジケース（0件→入荷待ち商品が無い旨）由来。
  });
  test.fixme("E2E-F06-08-015 同一商品でも言語・価格区分が異なると別のまとまりとして表示される（要: 言語・価格区分違いの依頼シード）", async () => {
    // 期待はエッジケース（集約キー相違→別まとまり）由来。
  });
  test.fixme("E2E-F06-08-016 高額コードを持つ商品規格は商品詳細リンクに規格を含めて遷移する（要: 高額コード規格シード）", async () => {
    // 期待はエッジケース（高額コード→商品詳細リンクに規格を含めて遷移）由来。
  });
});
