/**
 * F06-05 マイページ。正本: cases/F06-05_test_cases.tsv
 * 実装するのは 002（シード無し）だけ。ほかは環境の設定（バーコード・スマレジ接続先・非同期処理の起動）やスマレジ側のポイントなど、
 * 外部の試験環境が要るため実装しない。記録 review/F06-05_progress_2026-11-04.md
 */
import { expect, caseTest } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";

caseTest("IT-F06-05-002", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.URLを開く("/ja/mypage/"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "ログイン画面が表示される（マイページは表示されない）").toBe(true);
  });
});
