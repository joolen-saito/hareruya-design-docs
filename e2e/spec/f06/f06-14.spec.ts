/**
 * F06-14 マイイベント・デッキ登録。正本: cases/F06-14_test_cases.tsv
 * 実装するのは 021・022・024・025・026（申込0件の会員）。ほかはイベントの申込・デッキをDBで用意するシードを使うため実装しない。
 * 記録 review/F06-14_progress_2026-11-04.md
 */
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { EventHistoryPage } from "../../pages/front/f06_14_event_history";
import { mailOf, PW } from "../../seeds/f06-14";

async function 会員で開く(page: CaseCtx["page"]): Promise<EventHistoryPage> {
  const e = new EventHistoryPage(page);
  await e.ログインする(mailOf("f0614_member"), PW);
  return e;
}

caseTest("IT-F06-14-021", async ({ page, step, expected }) => {
  const e = await 会員で開く(page);
  await step(1, async () => { await e.開く(); });
  await step(2, async () => { await expect(e.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await e.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
});
caseTest("IT-F06-14-022", async ({ page, step, expected }) => {
  const e = await 会員で開く(page);
  await step(1, async () => { await e.開く(); });
  await step(2, async () => { await e.押して遷移する(e.パンくずホーム); });
  await expected(async () => { expect.soft(e.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-14-024", async ({ page, step, expected }) => {
  const e = await 会員で開く(page);
  await step(1, async () => { await e.開く(); });
  await step(2, async () => { await e.押して遷移する(e.イベントを探す); });
  await expected(async () => { expect.soft(e.path, "遷移した画面（イベントTOP）").toMatch(/^\/ja\/events\/?$/); });
});
caseTest("IT-F06-14-025", async ({ page, step, expected }) => {
  const e = await 会員で開く(page);
  await step(1, async () => { await e.開く(); });
  await step(2, async () => { await e.押して遷移する(e.マイページへ戻る); });
  await expected(async () => { expect.soft(e.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});
caseTest("IT-F06-14-026", async ({ page, step, expected }) => {
  const e = new EventHistoryPage(page);
  await step(1, async () => { await e.開く(); });
  await expected(async () => {
    expect.soft(e.path, "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await e.ログイン画面である(), "会員ログイン画面が表示され、マイイベント・デッキ登録画面は表示されない").toBe(true);
  });
});
