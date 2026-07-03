/**
 * フロント 会員「仮会員登録（新規会員登録）」（F06-01）E2E。
 * 対応ケース表: integration_test/e2e/f06_01_front_member_customer_entry_e2e_cases.md
 *
 * 期待結果は functions/pf-eccube3/f06-01_front_member_customer_entry.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 会員登録は非ログイン画面のため、フォーム初期表示・UI部品・非破壊な表示確認は live。
 * 要フォーム全項目入力(要実機確認セレクタ)/要シード/要メール受信/要ブラックリスト/確認・完了画面到達の
 * ケースは test.fixme（理由付き）で保留し、全量はケース表(付帯表)で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberEntryPage } from "../../../pages/front/f06/f06_01_front_member_customer_entry.page";

test.describe("フロント > 会員 > 仮会員登録（新規会員登録）", { tag: ["@front", "@member"] }, () => {
  // --- live: 非ログイン・非破壊・実機なしで観測可能（フォーム初期表示・UI部品） ---
  test("E2E-F06-01-005 会員登録画面の初期表示でフォームが表示される", async ({ page }) => {
    const entry = new FrontMemberEntryPage(page);
    await entry.gotoEntry();
    await entry.seeEntryScreen();
  });

  test("E2E-F06-01-011 入力フォームの主要項目が表示される", async ({ page }) => {
    const entry = new FrontMemberEntryPage(page);
    await entry.gotoEntry();
    await entry.seeEntryFormFields();
  });

  test("E2E-F06-01-013 必須項目にチェック画像(alt=必須)が付く", async ({ page }) => {
    const entry = new FrontMemberEntryPage(page);
    await entry.gotoEntry();
    await expect(entry.requiredMark.first()).toBeVisible();
  });

  test("E2E-F06-01-014 会員登録画面の見出し「会員情報登録」が表示される", async ({ page }) => {
    const entry = new FrontMemberEntryPage(page);
    await entry.gotoEntry();
    await expect(page.getByRole("heading", { name: /会員情報登録/ }).first()).toBeVisible();
  });

  test("E2E-F06-01-083 英語表示(/en/entry)で見出し「Registration」が表示される", async ({ page }) => {
    const entry = new FrontMemberEntryPage(page);
    await entry.gotoEntryLocale("en");
    await expect(entry.body).toContainText("Registration");
  });

  test("E2E-F06-01-084 「同意する」ボタン（確認へ）が表示される", async ({ page }) => {
    const entry = new FrontMemberEntryPage(page);
    await entry.gotoEntry();
    await expect(entry.agreeButton).toBeVisible();
  });

  // --- fixme: 自動化可能だが 要フォーム全項目入力(要実機確認セレクタ)/要シード/要メール/要到達 のため保留 ---
  test.fixme("E2E-F06-01-006 全項目正しく入力し「同意する」で確認画面へ遷移する（要: フォーム全項目セレクタ実機確認）", async () => {});
  test.fixme("E2E-F06-01-015 確認画面の見出し「会員情報登録確認」が表示される（要: 確認画面到達）", async () => {});
  test.fixme("E2E-F06-01-016 確認画面に案内文が表示される（要: 確認画面到達）", async () => {});
  test.fixme("E2E-F06-01-008 確認画面の「戻る」で入力画面へ戻る（要: 確認画面到達）", async () => {});
  test.fixme("E2E-F06-01-024 必須項目未入力で「同意する」→検証エラーで確認画面へ進まない（要: フォーム操作/実機確認）", async () => {});
  test.fixme("E2E-F06-01-065 メールアドレス確認不一致で「同じメールアドレスを入力してください。」（要: フォーム全項目入力）", async () => {});
  test.fixme("E2E-F06-01-067 パスワード確認不一致で「同じパスワードを入力してください。」（要: フォーム全項目入力）", async () => {});
  test.fixme("E2E-F06-01-019 国と都道府県の不整合で「国と都道府県の組み合わせが正しくありません。」（要: 国/都道府県セレクタ実機確認）", async () => {});
  test.fixme("E2E-F06-01-021 メール＝パスワードで登録へ進めず入力画面を再表示（判定順序#2。要: フォーム全項目入力）", async () => {});
  test.fixme("E2E-F06-01-033 生年月日に未来日を指定すると検証エラーとなる（要: 生年月日セレクタ実機確認）", async () => {});
  test.fixme("E2E-F06-01-034 海外の国を選択で単一郵便番号欄表示・都道府県欄非表示（要: 国セレクタ実機確認）", async () => {});
  test.fixme("E2E-F06-01-012 メール＝パスワード時にJSで送信を成立させない（要: JS挙動実機確認）", async () => {});
  test.fixme("E2E-F06-01-007 全項目入力し「登録する」で仮会員設定に応じ完了画面/本会員化URLへ遷移（要: 全項目入力/メール/シード）", async () => {});
  test.fixme("E2E-F06-01-009 仮会員登録完了画面「新規会員登録（完了）」が表示される（要: 登録完了到達/直接アクセス可否実機確認）", async () => {});
  test.fixme("E2E-F06-01-018 仮会員登録完了画面に案内文が表示される（要: 登録完了到達）", async () => {});
  test.fixme("E2E-F06-01-010 ブラックリスト該当で登録エラー画面へ遷移し会員登録不可を表示（要: SEED-F06-01-BLACKLIST/送信）", async () => {});
});
