/**
 * フロント 会員「ポイント履歴」（F06-10）E2E。未実行雛形。
 * 対応ケース表: integration_test/e2e/f06_10_front_member_mypage_point_history_e2e_cases.md
 *
 * オラクル（期待結果）は設計md functions/pf-eccube3/f06-10_front_member_mypage_point_history.md
 * （利用者視点の入口・フロント挙動・処理フロー・集計条件・表示メッセージ・エッジケース・画面遷移・権限認可）由来。
 * 実装挙動・POM文言はオラクル化しない。
 *
 * 本画面は会員ログイン必須の参照専用（一覧表示）画面。副作用なし（設計「参照のみ」）。
 * 未認証で保護URLへ直接アクセス→ログイン誘導は資格情報不要のため live。
 * ログイン後の初期表示（見出し・現在ポイント・件数・表示件数セレクト・マイページボタン）は
 * 会員資格情報のみで観測できるため test.skip(!HAS_FRONT_CREDS,…) 付き live。
 * 履歴内容（符号・色・有効期限・失効見込み・注文番号リンク・並び順・ページング・0件/0pt）は
 * 要ポイント履歴シードのため test.fixme（理由付き）で保留する。
 * 手動・対象外はケース表（付帯表2/2b）で全量管理し、spec には残さない。
 * ec-cube-enterprise の Playwright は本リポジトリで実行不可であり構造参考のみ。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberPointHistoryPage } from "../../../pages/front/f06/f06_10_front_member_mypage_point_history.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > ポイント履歴", { tag: ["@front", "@member"] }, () => {
  // --- 未認証保護（会員資格情報不要・非破壊で live） ---

  test("E2E-F06-10-021 未ログインでポイント履歴URLへ直接アクセスするとログイン画面へ誘導される", async ({ page }) => {
    const history = new FrontMemberPointHistoryPage(page);
    await history.gotoPointHistory();
    await history.seeLoginRedirect();
  });

  test("E2E-F06-10-002 未認証アクセスでは一覧を表示せず会員ログインへ誘導される", async ({ page }) => {
    const history = new FrontMemberPointHistoryPage(page);
    await history.gotoPointHistory();
    // 未ログインでは見出し「ポイント履歴一覧」を表示せず、ログインへ誘導されること（権限・認可）。
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(history.heading).toHaveCount(0);
  });

  // --- ログイン後の初期表示（要会員資格情報・非破壊。履歴の有無に依存しない常時表示要素） ---

  test("E2E-F06-10-007 ログイン後のポイント履歴一覧に見出しと現在のポイントが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontMemberPointHistoryPage(page);
    await history.login();
    await history.gotoPointHistory();
    await history.seePointHistoryScreen();
    // 現在のポイントは常時表示（表示メッセージ節）。
    await expect(history.currentPoints).toBeVisible();
  });

  test("E2E-F06-10-008 ポイント履歴一覧に件数表示（総件数）が常時表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontMemberPointHistoryPage(page);
    await history.login();
    await history.gotoPointHistory();
    // 「（開始）~（終了）件 ／ （総件数）件あります」は一覧表示時に常時（表示メッセージ節）。
    await expect(history.countArea).toBeVisible();
  });

  test("E2E-F06-10-009 表示件数セレクト（10/20/50/100）が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontMemberPointHistoryPage(page);
    await history.login();
    await history.gotoPointHistory();
    // 表示要素（フロント挙動）: 表示件数セレクト。
    await expect(history.pageSizeSelect).toBeVisible();
  });

  test("E2E-F06-10-020 「マイページ」ボタンからマイページトップへ戻る", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontMemberPointHistoryPage(page);
    await history.login();
    await history.gotoPointHistory();
    // 画面遷移: 「マイページ」ボタン→マイページトップ（/{_locale}/mypage）。
    await history.mypageButton.click();
    await expect(page).toHaveURL(/\/mypage(?:\/(?:index)?)?(?:\?|$)/);
  });

  test("E2E-F06-10-013 表示件数セレクト変更でGET送信されpageSizeが反映される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontMemberPointHistoryPage(page);
    await history.login();
    await history.gotoPointHistory();
    // JS挙動: セレクト変更をページサイズの隠し項目へ反映してGET送信する。
    await history.pageSizeSelect.selectOption("20");
    await expect(page).toHaveURL(/pageSize=20/);
  });

  // --- 要ポイント履歴シード（内容・符号・色・有効期限・失効見込み・注文番号・並び順・ページング・エッジ） ---

  test.fixme("E2E-F06-10-010 獲得（プラス）は先頭に「+」を付けて表示し利用（マイナス）はそのまま表示する（要: プラス/マイナス両履歴シード）", async () => {});
  test.fixme("E2E-F06-10-006 獲得（プラス）と利用（マイナス）でポイント値の表示色を切り替える（要: プラス/マイナス両履歴シード）", async () => {});
  test.fixme("E2E-F06-10-011 有効期限はプラス（獲得）の履歴にのみ表示する（要: プラス/マイナス両履歴シード）", async () => {});
  test.fixme("E2E-F06-10-012 失効見込みがある場合「次に消失するポイント：（額）ポイント（失効日）」を表示する（要: 保有ポイント>0＋基準日以降の獲得履歴シード）", async () => {});
  test.fixme("E2E-F06-10-018 注文に紐づく履歴のみ注文番号をリンク表示し押下で注文詳細を別タブで開く（要: 注文紐づき/非紐づき履歴シード）", async () => {});
  test.fixme("E2E-F06-10-016 一覧は発行日の降順（同日は履歴識別子の降順）で表示する（要: 複数日付履歴シード）", async () => {});
  test.fixme("E2E-F06-10-060 一覧は当該会員自身のポイント履歴のみを新しい順に1ページ目表示する（要: 当該会員＋他会員履歴シード）", async () => {});
  test.fixme("E2E-F06-10-003 他会員のポイント履歴は表示されない（要: 当該会員＋他会員履歴シード）", async () => {});
  test.fixme("E2E-F06-10-084 一覧の備考欄に note を表示する（要: 備考ありの履歴シード）", async () => {});
  test.fixme("E2E-F06-10-023 ?pageSize= で1ページあたりの表示件数を切り替えて表示する（要: 11件以上の履歴シード）", async () => {});
  test.fixme("E2E-F06-10-032 ?page= の指定ページのポイント履歴を表示する（要: 11件以上の履歴シード）", async () => {});
  test.fixme("E2E-F06-10-057 page・pageSize が未指定・0 の場合はページ1・10件の既定で表示する（要: 履歴シード）", async () => {});
  test.fixme("E2E-F06-10-014 ポイント履歴0件の会員では件数0として一覧領域を空表示する（要: 履歴0件の会員シード）", async () => {});
  test.fixme("E2E-F06-10-015 保有ポイント0の会員では失効見込み表示を出さない（要: 保有ポイント0の会員シード）", async () => {});
});
