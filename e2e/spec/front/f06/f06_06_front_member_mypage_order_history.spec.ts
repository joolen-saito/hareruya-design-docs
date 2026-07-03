/**
 * フロント 会員「購入履歴一覧」（F06-06）E2E。未実行雛形。
 * 対応ケース表: integration_test/e2e/f06_06_front_member_mypage_order_history_e2e_cases.md
 *
 * オラクル（期待結果）は設計md functions/pf-eccube3/f06-06_front_member_mypage_order_history.md
 * （利用者視点の入口・処理フロー・集計条件・エッジケース・画面遷移・権限認可）由来。
 * 実装挙動・POM文言はオラクル化しない。
 *
 * 本画面は会員ログイン必須。未認証で保護URLへ直接アクセス→ログイン誘導は資格情報不要のため live。
 * ログイン後の一覧内容・件数・詳細遷移・再購入APIは要会員資格情報/要注文シードのため
 * test.skip(!HAS_FRONT_CREDS,…) 付き live または test.fixme（理由付き）で保留する。
 * 手動・対象外はケース表（付帯表2/2b）で全量管理し、spec には残さない。
 * ec-cube-enterprise の Playwright は本リポジトリで実行不可であり構造参考のみ。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberOrderHistoryPage } from "../../../pages/front/f06/f06_06_front_member_mypage_order_history.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > 購入履歴一覧", { tag: ["@front", "@member"] }, () => {
  // --- 未認証保護（会員資格情報不要・非破壊で live） ---

  test("E2E-F06-06-002 未認証で購入履歴一覧URLへ直接アクセスするとログイン画面へ誘導される", async ({ page }) => {
    const history = new FrontMemberOrderHistoryPage(page);
    await history.gotoHistory();
    await history.seeLoginRedirect();
  });

  test("E2E-F06-06-019 未ログインの失敗時出力として会員ログインへ誘導される", async ({ page }) => {
    const history = new FrontMemberOrderHistoryPage(page);
    await history.gotoHistory();
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
  });

  test("E2E-F06-06-021 未ログインで購入履歴詳細URLへ直接アクセスするとログインへ誘導される", async ({ page }) => {
    const history = new FrontMemberOrderHistoryPage(page);
    await history.gotoDetail(1);
    await history.seeLoginRedirect();
  });

  test("E2E-F06-06-086 購入履歴一覧の表示は会員ログインを要する", async ({ page }) => {
    const history = new FrontMemberOrderHistoryPage(page);
    await history.gotoHistory();
    // 未ログインでは見出し「購入履歴一覧」を表示せず、ログインへ誘導されること。
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(history.heading).toHaveCount(0);
  });

  // --- ログイン後の初期表示（要会員資格情報・非破壊。注文有無に依存しない） ---

  test("E2E-F06-06-007 ログイン後の購入履歴一覧に見出しが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontMemberOrderHistoryPage(page);
    await history.login();
    await history.gotoHistory();
    await expect(history.heading).toBeVisible();
  });

  test("E2E-F06-06-018 ログイン後に購入履歴一覧のHTMLが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontMemberOrderHistoryPage(page);
    await history.login();
    await history.gotoHistory();
    await history.seeHistoryScreen();
  });

  test("E2E-F06-06-009 購入履歴一覧に全件数と現在の表示範囲が併記される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontMemberOrderHistoryPage(page);
    await history.login();
    await history.gotoHistory();
    // 期待は設計書「集計条件（件数：全件数・表示範囲併記）」由来。件数表示領域の存在を確認。
    await expect(history.countArea).toBeVisible();
  });

  // --- 要注文シード（内容・遷移・順序・0件・処理中除外） ---

  test.fixme("E2E-F06-06-080 会員の注文が新しい順にページング表示される（要: 複数注文シード SEED-F06-06-ORDERS）", async () => {});
  test.fixme("E2E-F06-06-088 各注文に詳細遷移用の注文番号リンクが表示される（要: 注文シード）", async () => {});
  test.fixme("E2E-F06-06-022 各注文行に注文日が表示される（要: 注文シード）", async () => {});
  test.fixme("E2E-F06-06-023 各注文行に注文金額合計（保持値）が表示される（要: 注文シード）", async () => {});
  test.fixme("E2E-F06-06-003 ページ送りで指定ページの注文一覧が表示される（要: 11件以上シード SEED-F06-06-PAGE）", async () => {});
  test.fixme("E2E-F06-06-004 注文番号リンクから購入履歴詳細へ遷移する（要: 注文シード）", async () => {});
  test.fixme("E2E-F06-06-015 注文番号リンクから遷移した詳細は同一注文を表示する（要: 注文シード）", async () => {});
  test.fixme("E2E-F06-06-085 一覧は当該会員の注文のみを対象とする（要: 当該会員＋他会員注文シード）", async () => {});
  test.fixme("E2E-F06-06-013 注文0件の会員では件数0として一覧を空表示する（要: 0件会員シード SEED-F06-06-NOORDER）", async () => {});
  test.fixme("E2E-F06-06-014 処理中の注文は一覧に表示しない（要: 処理中注文シード SEED-F06-06-PROCESSING）", async () => {});
  test.fixme("E2E-F06-06-084 処理中を除外し確定済み注文のみを履歴に出す（要: 処理中注文シード）", async () => {});
  test.fixme("E2E-F06-06-006 領収書発行の導線から領収書発行画面へ遷移する（要: 注文シード）", async () => {});

  // --- 再購入（API/統合。POST repurchase。要注文シード） ---

  test.fixme("E2E-F06-06-005 再購入で当該注文の商品をカートへ再投入する内容を返す（要: 注文シード・API）", async () => {});
  test.fixme("E2E-F06-06-017 再購入は成功フラグと商品・数量を含むJSONを返す（要: 注文シード・API）", async () => {});
  test.fixme("E2E-F06-06-087 再購入は画面遷移せず非同期でカート投入内容を返す（要: 注文シード）", async () => {});
  test.fixme("E2E-F06-06-057 再購入で注文IDが無い場合は不正要求（HTTP404）となる（要: ログイン・API）", async () => {});
  test.fixme("E2E-F06-06-042 再購入で他会員の注文IDを指定するとHTTP404となる（要: 他会員注文シード・API）", async () => {});
});
