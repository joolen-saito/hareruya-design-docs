/**
 * F06-11 買取履歴一覧。正本: cases/F06-11_test_cases.tsv
 * 実装するのは 001・003・004・018・019・022（ネット買取の申込みを使わない）。ほかはネット買取を複数件作るシードを使うため実装しない。
 * 記録 review/F06-11_progress_2026-11-04.md
 */
import { caseTest, expect } from "../../lib/case";
import { PurchaseHistoryPage } from "../../pages/front/f06_11_purchase_history";
import { mailOf } from "../../seeds/f06-11";

caseTest("IT-F06-11-001", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.履歴一覧を開く(); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await h.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-11-003", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.ログインする(mailOf("f0611-a-003"), "F0611PwdCase003"); });
  await step(2, async () => { await h.マイページを開く(); });
  await step(3, async () => { await h.押して遷移する(h.買取履歴へのリンク.first()); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（買取履歴一覧）").toBe("/ja/mypage/purchase_history");
    expect.soft(await h.履歴一覧画面である(), "買取履歴一覧画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-11-004", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page, "en");
  await step(1, async () => { await h.ログインする(mailOf("f0611-a-004"), "F0611PwdCase004"); });
  await step(2, async () => { await h.マイページを開く(); });
  await step(3, async () => { await expect(page.locator("main, body").first(), "英語版マイページが表示されている").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(h.path, "英語版のマイページが表示されている").toMatch(/^\/en\/mypage\/?$/);
    expect.soft(await h.買取履歴へのリンク.count(), "買取履歴一覧画面へのリンクの数").toBe(0);
  });
});

caseTest("IT-F06-11-018", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.ログインする(mailOf("none-f0611-018"), "F0611PwdCase018"); });
  await step(2, async () => { await h.履歴一覧を開く(); });
  await expected(async () => {
    expect.soft(await h.履歴一覧画面である(), "買取履歴一覧画面が表示される").toBe(true);
    expect.soft(await h.履歴の行.count(), "買取履歴の一覧行の数").toBe(0);
    expect.soft(await h.件数の表示(), "件数範囲の開始と総件数が0と表示される").toMatch(/0/);
  });
});

caseTest("IT-F06-11-019", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.ログインする(mailOf("none-f0611-019"), "F0611PwdCase019"); });
  await step(2, async () => { await h.履歴一覧を開く(); });
  await expected(async () => {
    expect.soft(h.path, "買取履歴一覧画面に留まる").toBe("/ja/mypage/purchase_history");
    expect.soft(await h.履歴なしの案内.count(), "買取履歴がない旨の案内が画面上部に表示される").toBe(1);
  });
});

caseTest("IT-F06-11-022", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPage(page);
  await step(1, async () => { await h.ログインする(mailOf("f0611-a-022"), "F0611PwdCase022"); });
  await step(2, async () => { await h.履歴一覧を開く(); });
  await step(3, async () => { await h.押して遷移する(h.マイページへ戻る); });
  await expected(async () => { expect.soft(h.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});
