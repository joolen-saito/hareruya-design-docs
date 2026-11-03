/**
 * F06-07 購入履歴詳細。正本: cases/F06-07_test_cases.tsv
 * 実装するのは 003・004（会員Aだけ。注文を用意しない）。ほかは注文や別会員の購入履歴をDBで用意するシードを使うため実装しない。
 * 記録 review/F06-07_progress_2026-11-04.md
 */
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { HistoryDetailPage } from "../../pages/front/f06_07_history";
import { LoginPage } from "../../pages/front/f06_03_login";
import { mailOf, passwordOf } from "../../seeds/f06-07";

function 履歴詳細(番号: string, 注文ID: string | undefined) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const l = new LoginPage(page);
    // 事前準備: 会員Aでログイン済みにする
    await l.ログイン画面を開く();
    await l.ログインする(mailOf(`f0607-a-${番号}`), passwordOf(番号));
    const h = new HistoryDetailPage(page);
    let status = 0;
    await step(1, async () => { status = await h.開く(注文ID); });
    await expected(async () => {
      expect.soft(status, "HTTPステータス").toBe(404);
      expect.soft(await h.詳細の見出し.count(), "購入履歴詳細画面の見出しが表示されない").toBe(0);
    });
  };
}
caseTest("IT-F06-07-003", 履歴詳細("003", undefined));
caseTest("IT-F06-07-004", 履歴詳細("004", "abc"));
