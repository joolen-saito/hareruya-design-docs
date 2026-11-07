/** F06-16 大会デッキ登録編集（フロント）の続き（連携ケース 063）。正本: cases/F06-16_test_cases.tsv。f06-16.spec.ts・f06-16-b.spec.ts は変えない */
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { DeckEditPage } from "../../pages/front/f06_16_deck_entry";
import { デッキ表示の内容, 申込一覧 } from "../../pages/admin/f06_pe_pages";
import * as S from "../../seeds/f06-16-pe";
import "../../seeds/f06-16-pe";

caseTest("IT-F06-16-063", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  const m = S.会員一覧P.get("001"), d = S.大会一覧P.get("001");
  if (!m || !d) throw new Error("会員・大会が作られていない");
  const [稲妻, 島] = S.カード;
  const e = new DeckEditPage(page);
  const l = new 申込一覧(page);
  const 提出する = async (メイン: string, サイド: string): Promise<boolean> => {
    if ((await e.フォーマット選択肢()).length > 1) await e.フォーマットを選ぶ(S.形式名);
    await e.入力する("メイン", メイン);
    await e.入力する("サイド", サイド);
    return (await e.提出する()).送信;
  };
  await step(1, async () => { await frontLogin(page, m); });
  await step(2, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  let 一回目 = false;
  await step(3, async () => { 一回目 = await 提出する(`4 ${稲妻.日}`, `1 ${島.日}`); });
  await step(4, async () => {
    expect(一回目, "1回目の提出が送信された").toBe(true);
    expect(new URL(page.url()).pathname, "デッキ登録完了画面").toMatch(/^\/ja\/deckentry\/\d+\/check\/?$/);
  });
  await step(5, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  let 二回目 = false;
  await step(6, async () => { 二回目 = await 提出する(`2 ${稲妻.日}\n10 ${島.日}`, `3 ${稲妻.日}`); });
  await step(7, async () => {
    expect(二回目, "2回目の提出が送信された").toBe(true);
    expect(new URL(page.url()).pathname, "デッキ登録完了画面").toMatch(/^\/ja\/deckentry\/\d+\/check\/?$/);
  });
  await step(8, async () => { await page.context().clearCookies(); await loginAdmin(page, S.管理者); await l.開く(); });
  await step(9, async () => { await l.検索種別をデッキ登録にする(); await l.イベント名で検索する(d.大会名); });
  let 表示: Awaited<ReturnType<typeof デッキ表示の内容>> | undefined;
  await step(10, async () => { const p = await l.デッキ表示を開く(); 表示 = await デッキ表示の内容(p); });
  await expected(async () => {
    expect.soft(表示?.ページ数, "デッキ表示画面のデッキの数").toBe(1);
    expect.soft(表示?.名前, "Name欄の英字姓名").toContain("OMEGA TARO");
    expect.soft(表示?.カード行.some((t) => t.includes(`2 ${稲妻.日}`)), "メインの「上書稲妻」2枚").toBe(true);
    expect.soft(表示?.カード行.some((t) => t.includes(`10 ${島.日}`)), "メインの「上書島」10枚").toBe(true);
    expect.soft(表示?.メイン見出し, "メイン枚数").toContain("(12)");
    expect.soft(表示?.カード行.some((t) => t.includes(`3 ${稲妻.日}`)), "サイドの「上書稲妻」3枚").toBe(true);
    expect.soft(表示?.区画見出し.some((t) => t.includes("(3)")), "サイド枚数").toBe(true);
    expect.soft(表示?.カード行.some((t) => t.includes(`4 ${稲妻.日}`) || t.includes(`1 ${島.日}`)), "手順3で登録した「上書稲妻」4枚・「上書島」1枚が表示される").toBe(false);
  });
});
