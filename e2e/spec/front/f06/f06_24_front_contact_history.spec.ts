/**
 * フロント 会員「お問い合わせ履歴（一覧・詳細）」（F06-24＝詳細機能を担当stem）E2E。本リポジトリでは未実行の雛形。
 * ec-cube-enterprise の Playwright は実行不可で、構造（命名・Page Object/spec の書き方）の参考のみ。
 * 対応ケース表: integration_test/e2e/f06_24_front_contact_history_e2e_cases.md
 *
 * 期待結果（オラクル）は functions/pf-eccube3/f06-24_front_contact_history.md（利用者視点の入口・
 * 処理フロー・フロント挙動・表示メッセージ・権限認可）由来であり、実装/POM由来の表示文言をオラクル化しない。
 * /contact/history 配下は会員ログイン必須。未認証→会員ログイン誘導は live、ログイン後の一覧表示は
 * 会員資格情報が要るため test.skip(!HAS_FRONT_CREDS,...) 付き live、要シード（履歴データ・0件会員・
 * 複数件・他会員）のものは test.fixme で保留する。手動/対象外はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontContactHistoryPage } from "../../../pages/front/f06/f06_24_front_contact_history.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 会員 > お問い合わせ履歴（一覧・詳細）", { tag: ["@front", "@member"] }, () => {
  test("E2E-F06-24-002 未ログインでお問い合わせ履歴一覧へアクセスすると会員ログインへ誘導される", async ({ page }) => {
    const history = new FrontContactHistoryPage(page);
    await history.gotoList();
    await history.seeLoginRedirect();
  });

  test("E2E-F06-24-021 未ログインでお問い合わせ履歴詳細URLへ直接アクセスすると会員ログインへ誘導される", async ({ page }) => {
    const history = new FrontContactHistoryPage(page);
    await history.gotoDetail(1);
    await history.seeLoginRedirect();
  });

  test("E2E-F06-24-009 ログイン後にお問い合わせ履歴一覧の見出しが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontContactHistoryPage(page);
    await history.login();
    await history.gotoList();
    await history.seeListHeading();
  });

  test("E2E-F06-24-010 ログイン後に一覧へ総件数が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontContactHistoryPage(page);
    await history.login();
    await history.gotoList();
    await history.seeTotalCount();
  });

  test("E2E-F06-24-006 一覧に会員氏名・総件数・「マイページ」ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontContactHistoryPage(page);
    await history.login();
    await history.gotoList();
    // 見出し・総件数・「マイページ」ボタンが表示されること（仕様：フロント挙動 表示要素）。
    await history.seeListScreen();
  });

  test("E2E-F06-24-018 存在しないお問い合わせIDの詳細URLでは当該内容を表示しない", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const history = new FrontContactHistoryPage(page);
    await history.login();
    // 非存在ID。会員条件で絞られ当該お問い合わせの内容（詳細見出し）を表示しない（要実機確認：非存在ID時の描画）。
    await history.gotoDetail(99999999);
    await history.seeDetailNotShown();
  });

  // 要シード（履歴1件以上）: 件名リンク→詳細遷移。
  test.fixme("E2E-F06-24-005 一覧の件名リンクから詳細へ遷移する（要: SEED-F06-24-HISTORY 会員シード）", async () => {});
  // 要シード（履歴1件以上）: 詳細見出し表示。
  test.fixme("E2E-F06-24-011 詳細画面の見出しが表示される（要: SEED-F06-24-HISTORY 会員シード）", async () => {});
  // 要シード（履歴1件以上）: 詳細「戻る」＝ブラウザ履歴を1つ戻すリンク。
  test.fixme("E2E-F06-24-007 詳細の「戻る」はブラウザ履歴を1つ戻すリンクである（要: SEED-F06-24-HISTORY 会員シード）", async () => {});
  // 要シード（履歴2件以上）: 並び順＝お問い合わせ番号の降順。
  test.fixme("E2E-F06-24-012 一覧はお問い合わせ番号の降順（新しい順）で表示される（要: SEED-F06-24-HISTORY-MULTI 会員シード）", async () => {});
  // 要シード（件名マスタ紐づけ済み）: 件名＝お問い合わせ種別マスタ名称。
  test.fixme("E2E-F06-24-014 件名にお問い合わせ種別マスタの名称が表示される（要: SEED-F06-24-HISTORY 会員シード）", async () => {});
  // 要シード（履歴1件以上）: 送信日時 Y年m月d日 H:i 書式。
  test.fixme("E2E-F06-24-015 一覧の送信日時が Y年m月d日 H:i 書式で表示される（要: SEED-F06-24-HISTORY 会員シード）", async () => {});
  // 要シード（お問い合わせ0件の会員）: 0件でも見出しと「0件」表示・明細なし。
  test.fixme("E2E-F06-24-016 お問い合わせが0件でも見出しと「0件」を表示し明細を出さない（要: SEED-F06-24-EMPTY 会員シード）", async () => {});
  // 要シード（他会員のお問い合わせIDが既知の2会員）: 他会員ID→内容非表示（認可範囲）。
  test.fixme("E2E-F06-24-017 他会員のお問い合わせIDを詳細URLに指定しても当該内容を表示しない（要: SEED-F06-24-OTHER 2会員シード）", async () => {});
});
