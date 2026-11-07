/**
 * M15-05 デッキ編集（代表カードの指定・ボードの解釈）。ケースの正本: integration_test/casegen/cases/M15-05_test_cases.tsv
 * 代表カードの画像は画面から登録できないため、DeckTestAlpha の画像の代わりに画像つきの既存カード（Lightning Bolt）、
 * DeckTestBeta の画像の代わりに Saheeli Rai を使う（注記に残す。画像の中身はカードによらず、選んだカードの名前と画像で確かめる）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { 代表カードを検索して選ぶ } from "../../pages/admin/m15_05_cb";
import { M1505_ADMIN } from "../../seeds/m15-05";
import { 語, 名, 代表カードの代役 } from "../../seeds/m15-05-b";
import { 語CB } from "../../seeds/m15-05-e";
import "../../seeds/m15-05-f";

type Step = Parameters<CaseBody>[0]["step"];
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const f = (page: Page, n: string) => page.locator(`[name="admin_deck[${n}]"]`);
const 行 = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);
const 代役の注記 = () => note("カード画像は画面から登録できないため、DeckTestAlpha の画像の代わりに Lightning Bolt、DeckTestBeta の画像の代わりに Saheeli Rai（どちらも画像つきの既存カード）を使った。代表カードの検索ではDeckTestBetaが画像を持たず出ないため、Saheeli Rai を検索して選んだ");

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1505_ADMIN);
}
const 代表名 = (page: Page) => page.locator("#selectedCardImageName");
const 代表の画像 = async (page: Page) => (await page.locator("#cardImagePreview").getAttribute("src").catch(() => null)) ?? "";
const 代表の名前 = async (page: Page) => ((await 代表名(page).innerText().catch(() => "")) ?? "").trim();

// ---- 144: 編集で代表カードを指定しても変わらない ----
caseTest("IT-M15-05-144", async ({ page, notes, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1505-144〕");
  await step(1, async () => { await l.開く(); await l.f("deck_name").fill(`${語("144")}-デッキ`); await l.日付クリア.click(); await l.検索する(); });
  await step(2, async () => {
    const r = l.行(id);
    await expect(r, "検索結果のデッキの行").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), r.locator('a[href$="/edit"]').first().click()]);
  });
  await step(3, async () => { await 代表カードを検索して選ぶ(page, 代表カードの代役.B); });
  await step(4, async () => {
    const nav = page.waitForNavigation({ waitUntil: "load", timeout: 45_000 }).then(() => true).catch(() => false);
    await page.locator('button[type="submit"][form="admin_deck"]').first().click();
    await nav; await page.waitForLoadState("load");
  });
  await step(5, async () => { await expect(f(page, "deckName"), "更新後の編集画面").toBeVisible(); });
  await expected(async () => {
    expect.soft(await 代表の名前(page), "代表カード（DeckTestAlphaの画像の代わりの Lightning Bolt）").toContain(代表カードの代役.A);
    expect.soft(await 代表の名前(page), "代表カードに DeckTestBeta の画像の代わりの Saheeli Rai が表示されない").not.toContain(代表カードの代役.B);
    expect.soft(await 代表の画像(page), "代表カードの画像").toBeTruthy();
  });
  代役の注記();
});

// ---- 156〜168: 新規登録 ----
type 登録 = { デッキ名: string; フォーマット: string; アーキタイプ: string; 代表を選ぶ: boolean; 欄: "textMain" | "textCommand"; 入力?: string; 期待代表: "A" | "B"; 期待行?: string[]; 期待されない行?: string[] };

function 新規登録(n: string, c: 登録): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const l = new デッキ一覧(page);
    const 開始 = 1;
    await step(開始, async () => { await l.開く(); });
    await step(開始 + 1, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
    await step(開始 + 2, async () => {
      await f(page, "deckName").fill(c.デッキ名);
      await f(page, "Format").selectOption({ label: c.フォーマット });
      await f(page, "Archetype").selectOption({ label: c.アーキタイプ });
      await f(page, "Disp").selectOption({ label: "非公開" });
    });
    let s = 開始 + 3;
    if (c.代表を選ぶ) await step(s++, async () => { await 代表カードを検索して選ぶ(page, 代表カードの代役.B); });
    else await step(s++, async () => { await expect(page.locator("#searchCardImageModal"), "代表カード検索の画面（押さないので開いていない）").toBeHidden(); });
    await step(s++, async () => {
      if (c.入力 !== undefined) await f(page, c.欄).fill(c.入力);
      else for (const 欄 of ["textCommand", "textMain", "textSide"]) expect.soft(await f(page, 欄).inputValue(), `${欄 === "textCommand" ? "統率" : 欄 === "textMain" ? "メインボード" : "サイドボード"}の欄（空のまま）`).toBe("");
    });
    await step(s++, async () => {
      const nav = page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).then(() => true).catch(() => false);
      await page.locator('button[type="submit"][form="admin_deck"]').first().click();
      await nav; await page.waitForLoadState("load");
    });
    await step(s++, async () => { await expect(f(page, "deckName"), "登録後の編集画面").toBeVisible(); });
    await expected(async () => {
      expect.soft(/\/deck\/\d+\/edit/.test(page.url()), "デッキ編集画面へ移った").toBe(true);
      const 名前 = await 代表の名前(page);
      const 他 = c.期待代表 === "A" ? "B" : "A";
      expect.soft(名前, `代表カード（${c.期待代表 === "B" ? "DeckTestBeta" : "DeckTestAlpha"}の画像の代わりの ${代表カードの代役[c.期待代表]}）`).toContain(代表カードの代役[c.期待代表]);
      if (c.代表を選ぶ || c.期待代表 === "B") expect.soft(名前, `代表カードに ${代表カードの代役[他]} が表示されない`).not.toContain(代表カードの代役[他]);
      expect.soft(await 代表の画像(page), "代表カードの画像").toBeTruthy();
      if (c.期待行) expect.soft(行(await f(page, c.欄).inputValue()), c.欄 === "textCommand" ? "統率" : "メインボード").toEqual(c.期待行);
      else for (const 欄 of ["textCommand", "textMain", "textSide"]) expect.soft(行(await f(page, 欄).inputValue()), `${欄 === "textCommand" ? "統率" : 欄 === "textMain" ? "メインボード" : "サイドボード"}（空）`).toEqual([]);
      for (const x of c.期待されない行 ?? []) expect.soft(行(await f(page, c.欄).inputValue()).some((t) => t.includes(x)), `「${x}」の行が表示されない`).toBe(false);
      expect.soft(await page.locator("body").innerText(), "画面の文言（現行フォーマットの警告）").not.toContain("現行フォーマットに則さない形で登録されています。");
    });
    代役の注記();
  };
}
const A = () => 名("カードA"), B = () => 名("カードB");

caseTest("IT-M15-05-156", 新規登録("156", { デッキ名: `${語CB("156")}-デッキ`, フォーマット: 名("標準"), アーキタイプ: 名("型甲"), 代表を選ぶ: true, 欄: "textMain", 入力: `2 ${A()}\n2 ${B()}`, 期待代表: "B", 期待行: [`2 ${A()}`, `2 ${B()}`] }));
caseTest("IT-M15-05-157", 新規登録("157", { デッキ名: `${語CB("157")}-デッキ`, フォーマット: 名("標準"), アーキタイプ: 名("型甲"), 代表を選ぶ: true, 欄: "textMain", 入力: `1 ${名("範囲外")}`, 期待代表: "B", 期待行: [`1 ${名("範囲外")}`] }));
caseTest("IT-M15-05-158", 新規登録("158", { デッキ名: `${語CB("158")}-デッキ`, フォーマット: 名("標準"), アーキタイプ: 名("型甲"), 代表を選ぶ: true, 欄: "textMain", 入力: `5 ${A()}`, 期待代表: "B", 期待行: [`5 ${A()}`] }));
caseTest("IT-M15-05-159", 新規登録("159", { デッキ名: `${語CB("159")}-デッキ`, フォーマット: 名("単一"), アーキタイプ: `${語CB("159")}-型`, 代表を選ぶ: true, 欄: "textMain", 入力: `2 ${A()}`, 期待代表: "B", 期待行: [`2 ${A()}`] }));
caseTest("IT-M15-05-160", 新規登録("160", { デッキ名: `${語CB("160")}-デッキ`, フォーマット: 名("統率なし"), アーキタイプ: `${語CB("160")}-型`, 代表を選ぶ: true, 欄: "textCommand", 入力: `1 ${A()}`, 期待代表: "B", 期待行: [`1 ${A()}`] }));
caseTest("IT-M15-05-161", 新規登録("161", { デッキ名: `${語CB("161")}-デッキ`, フォーマット: 名("上限"), アーキタイプ: `${語CB("161")}-型`, 代表を選ぶ: true, 欄: "textMain", 入力: `3 ${A()}\n3 ${B()}`, 期待代表: "B", 期待行: [`3 ${A()}`, `3 ${B()}`] }));
caseTest("IT-M15-05-162", 新規登録("162", { デッキ名: `${語CB("162")}-デッキ`, フォーマット: 名("下限"), アーキタイプ: `${語CB("162")}-型`, 代表を選ぶ: true, 欄: "textMain", 入力: `2 ${A()}\n2 ${B()}`, 期待代表: "B", 期待行: [`2 ${A()}`, `2 ${B()}`] }));
caseTest("IT-M15-05-166", 新規登録("166", { デッキ名: `${語CB("166")}-デッキ`, フォーマット: 名("標準"), アーキタイプ: `${語CB("166")}-型`, 代表を選ぶ: true, 欄: "textMain", 入力: `2 ${A()}\n1 ${語CB("166")}-Nothing`, 期待代表: "B", 期待行: [`2 ${A()}`], 期待されない行: [`${語CB("166")}-Nothing`] }));
caseTest("IT-M15-05-167", 新規登録("167", { デッキ名: `${語CB("167")}-デッキ`, フォーマット: 名("標準"), アーキタイプ: 名("型乙"), 代表を選ぶ: false, 欄: "textMain", 期待代表: "B" }));
caseTest("IT-M15-05-168", 新規登録("168", { デッキ名: `${語CB("168")}-デッキ`, フォーマット: 名("標準"), アーキタイプ: 名("型乙"), 代表を選ぶ: false, 欄: "textMain", 入力: `2 ${A()}\n3 ${B()}\n2 ${A()}`, 期待代表: "B", 期待行: [`4 ${A()}`, `3 ${B()}`] }));
