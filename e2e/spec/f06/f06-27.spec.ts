/**
 * F06-27 パスワード設定（ポリシー違反用）。正本: cases/F06-27_test_cases.tsv
 * 実装するのは 003・021（ポリシー違反のセッションが無い会員）。ほかはポリシー違反のパスワードの会員をDBで用意するシードを使うため実装しない。
 * 記録 review/F06-27_progress_2026-11-04.md
 */
import { caseTest, expect } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import { PolicyPage } from "../../pages/front/f06_27_policy";
import { mailOf } from "../../seeds/f06-27";

caseTest("IT-F06-27-003", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const p = new PolicyPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("f0627-003"), "F0627-Cmp-003!ab"); });
  await step(2, async () => { await p.直接開く(); });
  await expected(async () => {
    expect.soft(await p.設定画面である(), "パスワード設定（ポリシー違反用）画面が表示されない").toBe(false);
    expect.soft(p.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/);
  });
});

caseTest("IT-F06-27-021", async ({ page, step, expected }) => {
  const p = new PolicyPage(page);
  await step(1, async () => { await p.直接開く(); });
  await expected(async () => {
    expect.soft(p.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/);
    expect.soft(await p.設定画面である(), "パスワード設定（ポリシー違反用）画面が表示されない").toBe(false);
  });
});
