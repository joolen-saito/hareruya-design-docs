/**
 * F06-18 会員情報変更。正本: cases/F06-18_test_cases.tsv
 * 実装するのは 001（シード無し）だけ。ほかは自動ログイン（共有の設定）・ブラックリスト・DBでの準備・管理者を要するため実装しない。
 * 記録 review/F06-18_progress_2026-11-04.md
 */
import { caseTest, expect } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";

caseTest("IT-F06-18-001", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.URLを開く("/ja/mypage/change"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});
