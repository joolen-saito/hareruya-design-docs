/** F06-17 大会デッキ登録確認〜完了（フロント）の続き（連携ケース）。正本: cases/F06-17_test_cases.tsv。f06-17.spec.ts・f06-17-b.spec.ts は変えない */
import { Page } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { DeckEditPage } from "../../pages/front/f06_16_deck_entry";
import { デッキ検索, デッキ編集, デッキ表示の内容, 申込一覧 } from "../../pages/admin/f06_pe_pages";
import * as S from "../../seeds/f06-17-c";
import "../../seeds/f06-17-c";

type Step = (n: number, f: () => Promise<void>) => Promise<void>;
const 会員 = (n: string) => { const m = S.会員一覧C.get(n); if (!m) throw new Error(`会員 ${n} が作られていない`); return m; };
const 大会 = (n: string) => { const d = S.大会一覧C.get(n); if (!d) throw new Error(`大会 ${n} が作られていない`); return d; };
const 行 = (text: string): string[] => text.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
const 日付形式 = (v: string): string => v.replace(/-/g, "/").replace("T", " ");

/** 手順1〜4: 会員でログインし、連携形式・メイン・サイドを入れて提出し、完了画面を確かめる */
async function 提出まで(page: Page, n: string, step: Step): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  const e = new DeckEditPage(page);
  const [稲妻, 島, 否認] = S.カード;
  await step(1, async () => { await frontLogin(page, 会員(n)); });
  await step(2, async () => { await e.開く(大会(n).日程ID); await expect(e.メイン).toBeVisible(); });
  let 送信 = false;
  await step(3, async () => {
    if ((await e.フォーマット選択肢()).length > 1) await e.フォーマットを選ぶ(S.形式名);
    await e.入力する("メイン", `4 ${稲妻.日}\n20 ${島.日}`);
    await e.入力する("サイド", `3 ${否認.日}`);
    送信 = (await e.提出する()).送信;
  });
  await step(4, async () => {
    expect(送信, "提出が送信された").toBe(true);
    expect(new URL(page.url()).pathname, "デッキ登録完了画面").toMatch(/^\/ja\/deckentry\/\d+\/check\/?$/);
  });
}
/** 管理画面に連携店の管理者でログインする（会員のセッションを残さない） */
async function 管理者でログインする(page: Page): Promise<void> {
  await page.context().clearCookies();
  await loginAdmin(page, S.管理者);
}

caseTest("IT-F06-17-037", async ({ page, step, expected }) => {
  await 提出まで(page, "001", step);
  const l = new 申込一覧(page);
  await step(5, async () => { await 管理者でログインする(page); await l.開く(); });
  await step(6, async () => { await l.検索種別をデッキ登録にする(); await l.イベント名で検索する(大会("001").大会名); });
  let 件数 = 0, 行文: string[] = [];
  await step(7, async () => { 件数 = await l.件数(); 行文 = await l.結果の行の文(); });
  await expected(async () => {
    expect.soft(件数, "検索結果の該当件数").toBe(1);
    expect.soft(行文.filter((t) => t.includes(大会("001").大会名)).length, "イベント名のデッキ登録の行の数").toBe(1);
  });
});

caseTest("IT-F06-17-039", async ({ page, step, expected }) => {
  await 提出まで(page, "003", step);
  const l = new 申込一覧(page);
  await step(5, async () => { await 管理者でログインする(page); await l.開く(); });
  await step(6, async () => { await l.検索種別をデッキ登録にする(); await l.イベント名で検索する(大会("003").大会名); });
  let 表示: Awaited<ReturnType<typeof デッキ表示の内容>> | undefined;
  await step(7, async () => { const p = await l.デッキ表示を開く(); 表示 = await デッキ表示の内容(p); });
  const [稲妻, 島, 否認] = S.カード;
  await expected(async () => {
    expect.soft(表示?.ページ数, "デッキ表示画面のデッキの数").toBe(1);
    expect.soft(表示?.名前, "Name欄").toContain("CHARLIE TARO");
    expect.soft(表示?.イベント, "Event欄のイベント名(英)").toContain(大会("003").大会名英);
    expect.soft(表示?.日付, "Date欄の開催日").toContain("2099/12/20");
    expect.soft(表示?.カード行.some((t) => t.includes(`4 ${稲妻.日}`) && t.includes(稲妻.英)), "メインの「連携稲妻」4枚（英語名が続く）").toBe(true);
    expect.soft(表示?.カード行.some((t) => t.includes(`20 ${島.日}`) && t.includes(島.英)), "メインの「連携島」20枚（英語名が続く）").toBe(true);
    expect.soft(表示?.カード行.some((t) => t.includes(`3 ${否認.日}`) && t.includes(否認.英)), "サイドの「連携否認」3枚（英語名が続く）").toBe(true);
    expect.soft(表示?.メイン見出し, "メイン枚数").toContain("(24)");
    expect.soft(表示?.区画見出し.some((t) => t.includes("(3)")), "サイド枚数").toBe(true);
  });
});

caseTest("IT-F06-17-040", async ({ page, step, expected }) => {
  await 提出まで(page, "004", step);
  const l = new 申込一覧(page);
  await step(5, async () => { await 管理者でログインする(page); await l.開く(); });
  await step(6, async () => { await l.検索種別をデッキ登録にする(); await l.イベント名で検索する(大会("004").大会名); });
  let 行文: string[] = [];
  await step(7, async () => { 行文 = (await l.結果の行の文()).filter((t) => t.includes(大会("004").大会名)); });
  await expected(async () => {
    expect.soft(行文.length, "イベント名の行の数").toBe(1);
    expect.soft(行文[0] ?? "", "イベント名").toContain(大会("004").大会名);
    expect.soft(行文[0] ?? "", "店舗").toContain(S.店名);
    expect.soft(行文[0] ?? "", "開催日").toContain("2099/12/20");
  });
});

/** 手順5〜8（041〜043 共通）: デッキ一覧で日付クリアを押し、イベント名で検索する */
async function デッキ一覧で検索する(page: Page, n: string, step: Step): Promise<{ 日付の値: string[] }> {
  const l = new デッキ検索(page);
  const r = { 日付の値: ["", ""] };
  await step(5, async () => { await 管理者でログインする(page); await l.開く(); });
  await step(6, async () => { await l.日付クリア.click({ timeout: 30_000 }); r.日付の値 = [await l.開催日From.inputValue(), await l.開催日To.inputValue()]; });
  await step(7, async () => { await l.イベント名.fill(大会(n).大会名); await l.検索する(); });
  return r;
}

caseTest("IT-F06-17-041", async ({ page, step, expected }) => {
  await 提出まで(page, "005", step);
  const 日付 = await デッキ一覧で検索する(page, "005", step);
  const l = new デッキ検索(page);
  let 件数 = 0, リンク = 0;
  await step(8, async () => { 件数 = await l.件数(); リンク = await l.デッキ情報のリンク.count(); });
  await expected(async () => {
    expect.soft(日付, "日付クリア後の開催日(From)・(To)").toEqual({ 日付の値: ["", ""] });
    expect.soft(件数, "検索結果の該当件数").toBe(1);
    expect.soft(リンク, "表示されたデッキ情報の数").toBe(1);
  });
});

caseTest("IT-F06-17-042", async ({ page, step, expected }) => {
  await 提出まで(page, "006", step);
  await デッキ一覧で検索する(page, "006", step);
  const l = new デッキ検索(page);
  const edit = new デッキ編集(page);
  await step(8, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), l.デッキ情報のリンク.first().click({ timeout: 30_000 })]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "デッキ編集画面").toMatch(/\/deck\/\d+\/edit$/);
    await expect.soft(edit.更新ボタン, "更新ボタン").toBeVisible({ timeout: 30_000 });
    await expect.soft(edit.f("eventNameJp"), "イベント名(日)").toHaveValue(大会("006").大会名);
  });
});

caseTest("IT-F06-17-043", async ({ page, step, expected }) => {
  await 提出まで(page, "007", step);
  await デッキ一覧で検索する(page, "007", step);
  const l = new デッキ検索(page);
  const edit = new デッキ編集(page);
  await step(8, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), l.デッキ情報のリンク.first().click({ timeout: 30_000 })]);
    await expect(edit.f("eventNameJp"), "デッキ編集画面").toBeVisible({ timeout: 30_000 });
  });
  const [稲妻, 島, 否認] = S.カード;
  await expected(async () => {
    expect.soft(await edit.f("eventNameJp").inputValue(), "イベント名(日)").toBe(大会("007").大会名);
    expect.soft(await edit.f("eventNameEn").inputValue(), "イベント名(英)").toBe(大会("007").大会名英);
    expect.soft(日付形式(await edit.f("eventDate").inputValue()), "イベント開催日").toContain("2026/01/01 10:00");
    expect.soft(行(await edit.f("textMain").inputValue()), "メインボード").toEqual([`4 ${稲妻.日}`, `20 ${島.日}`]);
    expect.soft(行(await edit.f("textSide").inputValue()), "サイドボード").toEqual([`3 ${否認.日}`]);
  });
});
