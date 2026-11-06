/**
 * M15-05 デッキ編集（複製の重ね・更新の重ね・削除後の戻り先）。ケースの正本: integration_test/casegen/cases/M15-05_test_cases.tsv
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { デッキカードの明細 } from "../../db/m15_05_cards";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1505_ADMIN } from "../../seeds/m15-05";
import { 語, 名 } from "../../seeds/m15-05-b";
import { 語CB } from "../../seeds/m15-05-e";

type Step = Parameters<CaseBody>[0]["step"];
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 画面の文言 = async (page: Page) => (await page.locator(".alert").allInnerTexts()).join(" ").replace(/\s+/g, " ");

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1505_ADMIN);
}
async function 検索する(page: Page, 検索語: string): Promise<デッキ一覧> {
  const l = new デッキ一覧(page);
  await l.開く(); await l.f("deck_name").fill(検索語); await l.日付クリア.click(); await l.検索する();
  return l;
}
async function 編集画面を開く(page: Page, step: Step, 検索語: string, id: string): Promise<void> {
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索する(page, 検索語); });
  await step(2, async () => {
    const r = l!.行(id);
    await expect(r, "検索結果のデッキの行").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), r.locator('a[href$="/edit"]').first().click()]);
  });
}
async function 複製を1回保存する(page: Page): Promise<void> {
  await page.locator(".col-md-2 .card-body").locator('[data-bs-target="#copyModal"]').click();
  const m = page.locator("#copyModal");
  await expect(m, "デッキ情報複製のポップアップ").toBeVisible();
  await m.locator("form[action$='/copy'] input:not([type=hidden])").first().fill("1");
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), m.getByRole("button", { name: "複製保存" }).click()]);
  await page.waitForLoadState("load");
}
async function 更新を押す(page: Page): Promise<void> {
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), page.locator('button[type="submit"][form="admin_deck"]').first().click()]);
  await page.waitForLoadState("load");
}
const path = (page: Page) => new URL(page.url()).pathname;

caseTest("IT-M15-05-150", async ({ page, notes, step, expected, db }) => {
  void db;
  await login(page);
  const id = notes.get("〔デッキID-M1505-150〕");
  await 編集画面を開く(page, step, `${語("150")}-デッキ`, id);
  await step(3, async () => { await 更新を押す(page); });
  await step(4, async () => { await 更新を押す(page); });
  let 明細: { カード名英: string; 枚数: number }[] = [];
  await step(5, async () => { 明細 = デッキカードの明細(id); });
  await expected(async () => {
    expect.soft(明細.length, "デッキ〔デッキID-M1505-150〕に紐づくデッキカードの数").toBe(2);
    expect.soft(明細.find((x) => x.カード名英 === 名("カードA"))?.枚数, "DeckTestAlphaの枚数").toBe(4);
    expect.soft(明細.find((x) => x.カード名英 === 名("カードB"))?.枚数, "DeckTestBetaの枚数").toBe(3);
  });
});

caseTest("IT-M15-05-151", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1505-151〕");
  await 編集画面を開く(page, step, `${語("151")}-デッキ`, id);
  await step(3, async () => { await 複製を1回保存する(page); });
  await step(4, async () => { expect(path(page).endsWith(`/deck/${id}/edit`), "元の編集画面に戻った").toBe(true); await 複製を1回保存する(page); });
  let 件数 = -1;
  await step(5, async () => { 件数 = await (await 検索する(page, `${語("151")}-デッキ`)).件数(); });
  await expected(async () => { expect.soft(件数, "検索結果の該当件数（元のデッキ1件と複製2件）").toBe(3); });
});

caseTest("IT-M15-05-195", async ({ page, notes, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  const A = notes.get("〔デッキID-M1505-CB195A〕");
  await step(1, async () => { await 検索する(page, 語CB("195")); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並べ替え項目.selectOption({ label: "デッキID" })]);
    await l.結果を待つ();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並び順.selectOption({ label: "降順" })]);
    await l.結果を待つ();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.件数選択.selectOption({ label: "10件" })]);
    await l.結果を待つ();
  });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator(".pagination a.page-link", { hasText: "2" }).first().click()]);
    await l.結果を待つ();
    expect(await l.表示されたデッキ名(), "2ページ目のデッキ（01と02）").toEqual([`${語CB("195")}-02`, `${語CB("195")}-01`]);
  });
  await step(4, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.行(A).locator('a[href$="/edit"]').first().click()]);
    page.once("dialog", (d) => { void d.accept(); });
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), page.locator("#btn_delete").click()]);
    await page.waitForLoadState("load");
  });
  await step(5, async () => { note(`削除後の画面のアドレス: ${path(page)}`); });
  await expected(async () => {
    const 名前 = (await page.locator(".deck-result-table").count()) ? await l.表示されたデッキ名() : [];
    expect.soft(await 画面の文言(page), "削除の成功メッセージ").toContain("削除しました");
    expect.soft(path(page), "表示された一覧のアドレス（2ページ目）").toMatch(/\/deck\/search\/2$/);
    expect.soft(名前.includes(`${語CB("195")}-02`), "「M1505-CB195-02」が表示される").toBe(true);
    expect.soft(名前.includes(`${語CB("195")}-01`), "「M1505-CB195-01」が表示される（表示されない）").toBe(false);
  });
});

caseTest("IT-M15-05-196", async ({ page, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
  await step(3, async () => {
    const f = (n: string) => page.locator(`[name="admin_deck[${n}]"]`);
    await f("deckName").fill(`${語CB("196")}-デッキ`);
    await f("Format").selectOption({ label: 名("標準") });
    await f("Archetype").selectOption({ label: 名("型丙") });
    await f("Disp").selectOption({ label: "非公開" });
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), page.locator('button[type="submit"][form="admin_deck"]').first().click()]);
    await page.waitForLoadState("load");
  });
  await step(4, async () => {
    page.once("dialog", (d) => { void d.accept(); });
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), page.locator("#btn_delete").click()]);
    await page.waitForLoadState("load");
  });
  await step(5, async () => { await expect(l.検索ボタン, "デッキ検索・一覧画面の検索ボタン").toBeVisible(); });
  await expected(async () => {
    expect.soft(await 画面の文言(page), "削除の成功メッセージ").toContain("削除しました");
    expect.soft(path(page), "表示された画面のアドレス（特定のページではなくデッキ一覧）").toMatch(/\/deck$/);
  });
});
