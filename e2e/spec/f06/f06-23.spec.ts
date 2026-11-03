/**
 * F06-23 お問い合わせ履歴。正本: cases/F06-23_test_cases.tsv
 * 実装するのは、お問い合わせ件名のマスタとお問い合わせの送信を使わない 001〜004・010・011・022〜024。ほかは件名のマスタ（SUBJECT）とお問い合わせの送信を要するため実装しない。
 * 記録 review/F06-23_progress_2026-11-04.md
 */
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { ContactHistoryPage, 言語 } from "../../pages/front/f06_23_contact_history";
import { mailOf } from "../../seeds/f06-23";

const 会員 = (区分: string, 文字: string, n: string) => ({ メール: mailOf(`f0623_member_${区分}-${n}`), PW: `F0623Pass${文字}${n}` });

caseTest("IT-F06-23-001", async ({ page, step, expected }) => {
  const h = new ContactHistoryPage(page);
  const m = 会員("a", "A", "001");
  await h.ログインする(m.メール, m.PW);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await expect(h.パンくず.first(), "画面上部のパンくずリスト").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await h.パンくず.count(), "パンくずリストが表示される").toBe(1); });
});
caseTest("IT-F06-23-002", async ({ page, step, expected }) => {
  const h = new ContactHistoryPage(page);
  const m = 会員("a", "A", "002");
  await h.ログインする(m.メール, m.PW);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await expect(h.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await h.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
});
caseTest("IT-F06-23-003", async ({ page, step, expected }) => {
  const h = new ContactHistoryPage(page);
  const m = 会員("a", "A", "003");
  await h.ログインする(m.メール, m.PW);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.押して遷移する(h.パンくずホーム); });
  await expected(async () => { expect.soft(h.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});
caseTest("IT-F06-23-004", async ({ page, step, expected }) => {
  const h = new ContactHistoryPage(page);
  const m = 会員("a", "A", "004");
  await h.ログインする(m.メール, m.PW);
  let 上部 = "";
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 上部 = await h.画面上部の文(); });
  await expected(async () => {
    expect.soft(await h.履歴画面である(), "お問い合わせ履歴画面が表示される").toBe(true);
    expect.soft(上部, "画面上部にユーザ名（会員の氏名）が表示されない").not.toMatch(/F06-23|会員A004/);
  });
});

function 件数(n: string, 区分: string, 文字: string, 言: 言語, 期待: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const h = new ContactHistoryPage(page, 言);
    const m = 会員(区分, 文字, n);
    await h.ログインする(m.メール, m.PW);
    await step(1, async () => { await h.開く(); });
    await expected(async () => {
      expect.soft(await h.履歴画面である(), "お問い合わせ履歴一覧画面が表示される").toBe(true);
      expect.soft(await h.件数の表示(), "問い合わせ件数の表示").toContain(期待);
    });
  };
}
caseTest("IT-F06-23-010", 件数("010", "c", "C", "ja", "0件"));
caseTest("IT-F06-23-011", 件数("011", "c", "C", "en", "0 Items"));

caseTest("IT-F06-23-022", async ({ page, step, expected }) => {
  const h = new ContactHistoryPage(page);
  const m = 会員("d", "D", "022");
  await h.ログインする(m.メール, m.PW);
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.押して遷移する(h.マイページへ戻る); });
  await expected(async () => { expect.soft(h.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});
function 履歴なし(n: string, 言: 言語, 文: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const h = new ContactHistoryPage(page, 言);
    const m = 会員("d", "D", n);
    await h.ログインする(m.メール, m.PW);
    let 案内 = "";
    await step(1, async () => { await h.開く(); });
    await step(2, async () => { 案内 = await h.履歴なしの案内(); });
    await expected(async () => { expect.soft(案内, "画面上部の案内の文").toContain(文); });
  };
}
caseTest("IT-F06-23-023", 履歴なし("023", "ja", "お問い合わせ履歴はありません。"));
caseTest("IT-F06-23-024", 履歴なし("024", "en", "You have no inquiry history."));
