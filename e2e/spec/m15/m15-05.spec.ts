/**
 * M15-05 デッキ編集（新規登録画面の表示まわり）。ケースの正本: integration_test/casegen/cases/M15-05_test_cases.tsv
 * 実装したのは、管理者とブラウザの状態だけで成り立つケース。フォーマット・アーキタイプ・カードなどの共有マスタが要るケースは未実装。
 */
import { test, Page } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1505_ADMIN } from "../../seeds/m15-05";

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1505_ADMIN);
}

/** 手順1・2（デッキ一覧を開いて新規登録を押す）。手順3は呼び出し側 */
async function 新規登録画面を開く(page: Page, step: Parameters<CaseBody>[0]["step"]): Promise<void> {
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), l.新規登録.click({ noWaitAfter: true })]); });
}
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 右の操作 = (page: Page) => page.locator(".col-md-2 .card-body");
const f = (page: Page, n: string) => page.locator(`[name="admin_deck[${n}]"]`);

caseTest("IT-M15-05-001", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録画面を開く(page, step);
  await step(3, async () => { await expect(右の操作(page), "画面下部の操作ボタン").toBeVisible(); });
  await expected(async () => {
    await expect(右の操作(page).getByRole("button", { name: "新規登録", exact: true }), "「新規登録」ボタン").toBeVisible();
  });
});

caseTest("IT-M15-05-002", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録画面を開く(page, step);
  await step(3, async () => { await expect(f(page, "textMain"), "カード情報の入力欄").toBeVisible(); });
  await expected(async () => {
    const labels = (await page.locator("form#admin_deck label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    for (const [名, 欄] of [["統率", "textCommand"], ["メインボード", "textMain"], ["サイドボード", "textSide"]] as const) {
      expect.soft(labels.some((t) => t.startsWith(名)), `「${名}」の見出しがある`).toBe(true);
      expect.soft(await f(page, 欄).evaluate((e) => e.tagName), `「${名}」の入力欄の種類`).toBe("TEXTAREA");
    }
    expect.soft(await page.locator("form#admin_deck textarea").count(), "カード情報のテキスト入力欄の数").toBe(3);
    expect.soft(await page.locator("form#admin_deck input[name*='card'], form#admin_deck input[name*='Card']").evaluateAll((es) => es.filter((e) => (e as HTMLInputElement).type !== "hidden").length), "カード名・枚数の入力欄の数").toBe(0);
  });
});

caseTest("IT-M15-05-003", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録画面を開く(page, step);
  await step(3, async () => { await expect(右の操作(page), "画面下部の操作ボタン").toBeVisible(); });
  await expected(async () => {
    for (const 名 of ["更新", "削除"]) {
      expect.soft(await 右の操作(page).getByRole("button", { name: 名, exact: true }).count(), `「${名}」ボタンの数`).toBe(0);
    }
    // 画面の複製のボタンの文言は「複製」（正本は「複製 >」）。文言の違いで見逃さないよう、複製のポップアップを開くボタン（文言によらない）と「複製」で始まるボタンを数える
    note("正本の「複製 >」ボタンは、画面では文言「複製」のボタン（デッキ情報複製のポップアップを開く）。文言によらず、ポップアップを開くボタンと「複製」で始まるボタンが無いことを確かめた");
    expect.soft(await page.locator('[data-bs-target="#copyModal"]').count(), "「複製 >」（デッキ情報複製のポップアップを開く）ボタンの数").toBe(0);
    expect.soft(await 右の操作(page).getByRole("button", { name: /^\s*複製/ }).count(), "「複製」で始まるボタンの数").toBe(0);
  });
});

caseTest("IT-M15-05-004", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録画面を開く(page, step);
  await step(3, async () => { await expect(f(page, "deckName"), "デッキ名の欄").toBeVisible(); });
  await expected(async () => {
    for (const [名, 欄] of [["デッキ名", "deckName"], ["プレイヤー名", "playerName"], ["イベント名(日)", "eventNameJp"], ["イベント名(英)", "eventNameEn"], ["イベント開催日", "eventDate"],
      ["順位", "ranking"], ["成績", "result"], ["引用元URL", "sourceUrl"], ["イベント参加人数", "participants"], ["統率", "textCommand"], ["メインボード", "textMain"], ["サイドボード", "textSide"]]) {
      expect.soft(await f(page, 欄).inputValue(), `${名}の値（空のはず）`).toBe("");
    }
  });
});

caseTest("IT-M15-05-014", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録画面を開く(page, step);
  let 種別: string[] = [], 公開: string[] = [];
  await step(3, async () => {
    const opts = async (n: string) => (await f(page, n).locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    種別 = await opts("DeckType"); 公開 = await opts("Disp");
  });
  await expected(async () => {
    expect.soft(種別, "デッキ種別の選択肢").toEqual(["event", "user"]);
    expect.soft(公開, "公開状態の選択肢").toEqual(["公開", "非公開", "限定公開"]);
  });
});


caseTest("IT-M15-05-019", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録画面を開く(page, step);
  await step(3, async () => { await page.locator('[data-bs-target="#searchCardImageModal"]').click(); });
  await expected(async () => { await expect(page.locator("#searchCardImageModal"), "代表カード検索のポップアップ").toBeVisible(); });
});

caseTest("IT-M15-05-020", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録画面を開く(page, step);
  await step(3, async () => { await page.locator('[data-bs-target="#searchPlayerModal"]').click(); });
  await expected(async () => { await expect(page.locator("#searchPlayerModal"), "プレイヤー検索のポップアップ").toBeVisible(); });
});

caseTest("IT-M15-05-021", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録画面を開く(page, step);
  await step(3, async () => { await page.locator('[data-bs-target="#searchEventModal"]').click(); });
  await expected(async () => { await expect(page.locator("#searchEventModal"), "イベント検索のポップアップ").toBeVisible(); });
});
