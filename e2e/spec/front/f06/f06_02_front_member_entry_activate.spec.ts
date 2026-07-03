/**
 * フロント 会員「本会員登録（アクティベート）」（F06-02）E2E。
 * 対応ケース表: integration_test/e2e/f06_02_front_member_entry_activate_e2e_cases.md
 *
 * 本リポジトリでは未実行の雛形。ec-cube-enterprise/pf-eccube3 の実画面は実行不可で構造参考のみ。
 * 期待結果は functions/pf-eccube3/f06-02_front_member_entry_activate.md 由来（オラクル独立性。実装/POM文言をオラクル化しない）。
 * 有効な秘密キーのシード／スマレジ連携失敗の再現／完了メール実受信／自動ログイン確認が要るケースは
 * test.fixme（理由付き）で保留し、全量はケース表で管理する。不正トークンでの判定拒否観測のみ非破壊 live。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberEntryActivatePage } from "../../../pages/front/f06/f06_02_front_member_entry_activate.page";

// 開封すると状態遷移し得る有効な秘密キーは使わない。非破壊 live では存在しない不正キーのみ使用する。
const INVALID_TOKEN = "invalid-secret-key-e2e";

test.describe("フロント > 会員 > 本会員登録（アクティベート）", { tag: ["@front", "@member"] }, () => {
  test("E2E-F06-02-011 改ざん・不正な秘密キーでは本登録完了画面にならない", async ({ page }) => {
    const activate = new FrontMemberEntryActivatePage(page);
    await activate.gotoActivate(INVALID_TOKEN);
    // 判定順序#1/#2で拒否され、成功時の完了案内文が表示されないこと（期待は判定順序・表示メッセージ節由来）。
    await activate.expectNotCompleted();
  });

  test("E2E-F06-02-018 判定で拒否されたとき本登録完了画面へ遷移せず共通エラー画面に留まる", async ({ page }) => {
    const activate = new FrontMemberEntryActivatePage(page);
    await activate.gotoActivate(INVALID_TOKEN);
    // 共通エラー画面（タイトルと本文の組）＝完了画面でもログイン画面でもない（期待はエラー処理節由来）。
    await activate.expectNotRedirectedToLogin();
    await activate.seeErrorScreen();
  });

  test("E2E-F06-02-021 非ログインでトークンURLを直接開いても会員ログイン画面へ誘導されない", async ({ page }) => {
    const activate = new FrontMemberEntryActivatePage(page);
    await activate.gotoActivate(INVALID_TOKEN);
    // ログイン前アクセスを前提とする入口のため、会員ログイン画面へリダイレクトされないこと（権限・認可節由来）。
    await activate.expectNotRedirectedToLogin();
  });

  // --- 要シード/要外部再現/要メール/要ログイン確認。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F06-02-002 未認証で有効トークンURLを開くと本会員化し自動ログインのうえ遷移する（要: SEED-F06-02-PROVISIONAL 有効秘密キー）", async () => {});
  test.fixme("E2E-F06-02-003 本会員化成功時に本登録完了画面の見出し・案内・リンクが表示される（要: SEED-F06-02-PROVISIONAL/戻り先なし）", async () => {});
  test.fixme("E2E-F06-02-010 本会員化済みURLを再度開くと「完了済みです。」エラー画面が表示される（要: SEED-F06-02-ACTIVATED）", async () => {});
  test.fixme("E2E-F06-02-012 スマレジ連携失敗で「有効化に失敗しました。」となり本会員化を確定しない（要: SEED-F06-02-SMAREGI-FAIL 連携失敗再現）", async () => {});
  test.fixme("E2E-F06-02-013 商品検索から遷移していた場合は本会員化後に商品検索画面へ戻る（要: SEED-F06-02-SEARCH-RETURN 戻り先セッション）", async () => {});
  test.fixme("E2E-F06-02-017 本会員化成功かつ戻り先なしのとき本登録完了画面へ遷移する（要: SEED-F06-02-PROVISIONAL）", async () => {});
  test.fixme("E2E-F06-02-084 成功時に本会員化・自動ログイン・遷移・完了メール送信が行われる（要: SEED-F06-02-PROVISIONAL/完了メール実受信）", async () => {});
  test.fixme("E2E-F06-02-090 本会員化成功後は自動ログイン状態が成立している（要: SEED-F06-02-PROVISIONAL/自動ログイン間接確認）", async () => {});
});
