/** M14-08 カードセット詳細(登録・編集・削除)。正本: cases/M14-08_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { カードセットの値 } from "../../db/m14_08_cardset";
import { M1408_ADMIN } from "../../seeds/m14-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const f = (page: Page, n: string) => page.locator(`[name="admin_cardset[${n}]"]`);

async function 登録画面を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), "カードセット詳細（登録）画面").toBeVisible();
}
async function 登録を押す(page: Page): Promise<{ sent: boolean; url: string }> {
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }).then(() => true, () => false);
  await page.locator("form#form1 button[type=submit]").filter({ hasText: /^\s*登録\s*$/ }).click({ timeout: 20_000, noWaitAfter: true });
  const sent = await nav;
  return { sent, url: page.url() };
}
const 長い = (c: string, n: number) => c.repeat(n);

caseTest("IT-M14-08-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let 本文 = "";
  let 欄名: string[] = [];
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => {
    本文 = (await page.locator("form#form1").innerText()).replace(/\s+/g, " ");
    欄名 = await page.locator("form#form1 [name]").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name));
  });
  await expected(async () => {
    for (const 語 of ["並び順", "カテゴリ", "フリーエリア(日)", "フリーエリア(英)", "サイドメニュー表示", "支店表示", "MTG ARENAで導入済", "レアリティ別に表示させない"]) {
      expect.soft(本文.includes(語), `「${語}」の項目が表示される`).toBe(false);
    }
    expect.soft(欄名.filter((n) => /rank|category|freeArea|free_area|sideMenu|display_side|branch|arena|rarityDisplay/i.test(n)), "該当する入力欄の名前").toEqual([]);
  });
});

caseTest("IT-M14-08-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let 操作部 = "";
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => { 操作部 = (await page.locator(".c-conversionArea").innerText()).replace(/\s+/g, " "); });
  await expected(async () => {
    expect.soft(操作部.includes("検索画面に戻る"), "「検索画面に戻る」が表示される").toBe(false);
    expect.soft(操作部.includes("カードセット管理"), "「カードセット管理」が表示される").toBe(true);
  });
});

caseTest("IT-M14-08-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let 選択 = "";
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => { 選択 = ((await f(page, "Cardsetblock").locator("option:checked").innerText()) ?? "").trim(); });
  await expected(async () => { expect.soft(選択, "ブロック選択で選ばれている項目").toBe("未指定"); });
});

caseTest("IT-M14-08-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let 本文 = "";
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => { 本文 = (await page.locator("form#form1").innerText()).replace(/\s+/g, " "); });
  await expected(async () => { expect.soft(本文.includes("画像未登録"), "シンボル画像の未登録状態（「画像未登録」）が表示される").toBe(true); });
});

caseTest("IT-M14-08-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const 名 = rc("任意項目空セット");
  let r = { sent: false, url: "" };
  let id = "";
  let 値: ReturnType<typeof カードセットの値> = null;
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => {
    await f(page, "nameJp").fill(名); await f(page, "nameEn").fill("Optional Empty Set"); await f(page, "code").fill("OES");
    await f(page, "releaseDate").fill("2026-09-02");
    await f(page, "Cardsetblock").selectOption({ label: "未指定" });
    if (await f(page, "specialFlg").isChecked()) await f(page, "specialFlg").uncheck();
  });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); id = /\/cardset\/(\d+)\/edit/.exec(r.url)?.[1] ?? ""; });
  await step(4, async () => { 値 = id ? カードセットの値(id) : null; });
  await expected(async () => {
    expect.soft(id, "登録後のカードセットID（編集画面のアドレス）").not.toBe("");
    expect.soft([値?.名日, 値?.名英, 値?.略称, 値?.リリース日], "名称・英語名・略称・リリース日").toEqual([名, "Optional Empty Set", "OES", "2026-09-02"]);
    expect.soft([値?.ブロック, 値?.特殊セット, 値?.シンボル画像 ?? null], "ブロック・特殊セットフラグ・シンボル画像（未設定）").toEqual([null, false, null]);
  });
});

caseTest("IT-M14-08-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let r = { sent: false, url: "" };
  let 本文 = "";
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => { for (const n of ["nameJp", "nameEn", "code", "releaseDate"]) await f(page, n).fill(""); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェック（必須の欄）が送信を止めた"); });
  await step(4, async () => { 本文 = (await page.locator("body").innerText()).replace(/\s+/g, " "); });
  await expected(async () => {
    expect.soft(r.sent, "登録要求が送信された").toBe(true);
    expect.soft(/収録カード.{0,10}0\s*件|収録カード.{0,10}なし/.test(本文), "収録カードが0件で再表示される").toBe(true);
  });
});

caseTest("IT-M14-08-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  let r = { sent: false, url: "" };
  let id = "";
  let 値: ReturnType<typeof カードセットの値> = null;
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => {
    await f(page, "nameJp").fill(長い("あ", 64)); await f(page, "nameEn").fill(長い("A", 64)); await f(page, "code").fill(長い("B", 50));
    await f(page, "releaseDate").fill("2026-09-02");
  });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); id = /\/cardset\/(\d+)\/edit/.exec(r.url)?.[1] ?? ""; });
  await step(4, async () => { 値 = id ? カードセットの値(id) : null; });
  await expected(async () => {
    expect.soft(id, "登録後のカードセットID").not.toBe("");
    expect.soft([値?.名日.length, 値?.名英.length, 値?.略称.length], "名称・英語名・略称の文字数").toEqual([64, 64, 50]);
  });
});

caseTest("IT-M14-08-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const 名 = rc("新規遷移確認セット");
  let r = { sent: false, url: "" };
  await step(1, async () => { await 登録画面を開く(page); });
  await step(2, async () => {
    await f(page, "nameJp").fill(名); await f(page, "nameEn").fill("New Transition Set"); await f(page, "code").fill("NTS"); await f(page, "releaseDate").fill("2026-09-02");
  });
  await step(3, async () => { r = await 登録を押す(page); });
  await expected(async () => {
    const id = /\/cardset\/(\d+)\/edit/.exec(r.url)?.[1];
    expect.soft(id, "遷移先がカードセット詳細（編集・削除）画面").toBeTruthy();
    expect.soft(await f(page, "nameJp").inputValue(), "表示されたカードセット名日本語").toBe(名);
  });
});
