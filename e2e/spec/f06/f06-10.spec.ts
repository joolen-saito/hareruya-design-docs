/**
 * F06-10 ポイント履歴。正本: cases/F06-10_test_cases.tsv
 * 実装するのは 002・011・012。035・036 などは、ポイント失効日数を変えてアプリケーションを再起動するシード（共有の設定の書き換えと再起動）や、
 * ポイント履歴の発行日を指定して追加するシードを使うため実装しない。記録 review/F06-10_progress_2026-11-04.md
 */
import { caseTest, expect } from "../../lib/case";
import { PointHistoryPage } from "../../pages/front/f06_10_point_history";
import { LoginPage } from "../../pages/front/f06_03_login";
import { mailOf } from "../../seeds/f06-10";

caseTest("IT-F06-10-002", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.URLを開く("/ja/mypage/point_history"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "会員ログイン画面が表示される（ポイント履歴一覧は表示されない）").toBe(true);
  });
});

caseTest("IT-F06-10-011", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const h = new PointHistoryPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf("f0610_empty-011"), "F0610PwdCase011");
  await step(1, async () => { await h.開く(); });
  let 行数 = -1;
  await step(2, async () => { 行数 = await h.履歴の行.count(); });
  await expected(async () => {
    expect.soft(h.path, "ポイント履歴画面に留まる").toBe("/ja/mypage/point_history");
    expect.soft(await h.ポイント履歴画面である(), "ポイント履歴画面が表示される").toBe(true);
    expect.soft(行数, "履歴の行の数").toBe(0);
  });
});

caseTest("IT-F06-10-012", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const h = new PointHistoryPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf("f0610_empty-012"), "F0610PwdCase012");
  await step(1, async () => { await h.開く(); });
  let 文 = "";
  await step(2, async () => { 文 = await h.一覧上部の文(); });
  await expected(async () => {
    expect.soft(await h.ポイント履歴画面である(), "ポイント履歴画面が表示される").toBe(true);
    expect.soft(文, "一覧上部に「次に消失するポイント」が表示されない").not.toMatch(/次に|消失|失効/);
    expect.soft(await h.次に消失するポイントの行数(), "一覧上部のポイント情報の行の数（現在のポイントだけ）").toBe(1);
  });
});
