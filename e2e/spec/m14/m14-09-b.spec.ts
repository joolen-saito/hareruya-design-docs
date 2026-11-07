/** M14-09 フォーマット一覧（続き: デッキ使用中の削除・新規登録・編集保存）。正本: cases/M14-09_test_cases.tsv */
import { Page, test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { フォーマットの値, 名日のフォーマット } from "../../db/m14_10_format";
import { 欄, 入力する, 登録を押す } from "../../pages/admin/m14_10_format";
import { M1409_ADMIN } from "../../seeds/m14-09";
import "../../seeds/m14-09-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 一覧を開く = async (page: Page): Promise<void> => {
  await page.goto(adminUrl("/format"));
  await page.waitForLoadState("load");
  await expect(page.locator('a[href$="/format/new"]').first(), "フォーマット一覧の「新規登録」").toBeVisible();
};
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const 行 = (page: Page, 日: string, 英: string) => page.locator("tr").filter({ has: page.locator("a").filter({ hasText: new RegExp(`^\\s*${esc(日)} / ${esc(英)}\\s*$`) }) });

function デッキ使用中の削除(n: string, 確かめ: (c: { url: string; id: string; 削除済み: boolean | null; 表示: string[] }) => void, DB: boolean): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1409_ADMIN);
    const id = notes.get(`〔フォーマットID-M1409-${n}〕`);
    const 日 = rc(`デッキ使用中フォーマット-${n}`), 英 = rc(`Deck Format ${n}`);
    let url = ""; let 応答 = 0; let 削除済み: boolean | null = null;
    await step(1, async () => { await 一覧を開く(page); });
    await step(2, async () => {
      const r = 行(page, 日, 英);
      await expect(r, `フォーマット一覧の「${日} / ${英}」の行`).toHaveCount(1);
      await r.locator("button.dropdown-menu-toggle").click({ timeout: 20_000 });
      await r.locator('a[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 });
      await expect(page.locator("#DeleteModal"), "削除の確認ポップアップ").toBeVisible();
    });
    await step(3, async () => {
      const [res] = await Promise.all([
        page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().method() !== "GET", { timeout: 30_000 }).catch(() => null),
        page.locator("#DeleteModal [data-method=delete]").click({ timeout: 20_000 }),
      ]);
      応答 = res?.status() ?? 0;
      await page.waitForLoadState("load").catch(() => undefined);
      url = page.url();
    });
    if (DB) await step(4, async () => { const v = フォーマットの値(id); 削除済み = v === null ? null : v.削除済み; });
    await expected(async () => {
      const 表示 = (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
      expect.soft(応答, "削除要求への応答があった（要求が送られた）").not.toBe(0);
      確かめ({ url, id, 削除済み, 表示 });
    });
  };
}
caseTest("IT-M14-09-013", デッキ使用中の削除("013", ({ 削除済み }) => { expect.soft(削除済み === false, "デッキが紐づくフォーマットが削除済みに変わっていない").toBe(true); }, true));
caseTest("IT-M14-09-014", デッキ使用中の削除("014", ({ url }) => { expect.soft(new URL(url).pathname, "遷移先（フォーマット一覧画面）").toMatch(/\/format(\/page\/\d+)?$/); }, false));

caseTest("IT-M14-09-024", async ({ page, step, expected }) => {
  await loginAdmin(page, M1409_ADMIN);
  const 日 = rc("新規試験フォーマット"), 英 = rc("New Test Format");
  let 結果 = { sent: false, url: "", status: 0 };
  await step(1, async () => {
    await 一覧を開く(page);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('a[href$="/format/new"]').first().click({ timeout: 20_000 })]);
    await expect(欄(page, "nameJp"), "フォーマット詳細(登録)画面").toBeVisible();
  });
  await step(2, async () => { await 入力する(page, { 名日: 日, 名英: 英, 並び順: "100", メタ日数: "30" }); });
  await step(3, async () => { note("画面の保存ボタンの文言は「登録」（正本は「フォーマット更新」「フォーマット登録」）。同じ位置の保存ボタンを押した"); 結果 = await 登録を押す(page); });
  await expected(async () => {
    expect.soft(結果.sent, "登録の要求が送られた").toBe(true);
    const 成功 = (await page.locator(".alert-success").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    expect.soft(成功.some((t) => t.includes("保存しました")), "成功メッセージ「保存しました」が表示されている").toBe(true);
    const id = /\/format\/(\d+)\/edit/.exec(page.url())?.[1] ?? "";
    expect.soft(id !== "", "遷移先（登録したフォーマットの詳細画面）").toBe(true);
    expect.soft(await 欄(page, "nameJp").inputValue(), "遷移先のフォーマット名(日)").toBe(日);
    const 行 = 名日のフォーマット(日);
    expect.soft(行.length === 1 && 行[0].フォーマットID === id, "登録したフォーマットが1件だけあり、遷移先の番号と一致する").toBe(true);
  });
});

caseTest("IT-M14-09-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1409_ADMIN);
  const id = notes.get("〔フォーマットID-M1409-025〕");
  const 前日 = rc("編集前フォーマット"), 前英 = rc("Before Format"), 後 = rc("編集後フォーマット");
  let 結果 = { sent: false, url: "", status: 0 };
  await step(1, async () => {
    await 一覧を開く(page);
    const r = 行(page, 前日, 前英);
    await expect(r, `フォーマット一覧の「${前日} / ${前英}」の行`).toHaveCount(1);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), r.locator("a").filter({ hasText: `${前日} / ${前英}` }).first().click({ timeout: 20_000 })]);
    await expect(欄(page, "nameJp"), "フォーマット詳細画面").toBeVisible();
  });
  await step(2, async () => { await 入力する(page, { 名日: 後 }); });
  await step(3, async () => {
    note("画面の保存ボタンの文言は「登録」（正本は「フォーマット更新」「フォーマット登録」）。同じ位置の保存ボタンを押した");
    結果 = await 登録を押す(page);
  });
  await expected(async () => {
    expect.soft(結果.sent, "更新の要求が送られた").toBe(true);
    const 成功 = (await page.locator(".alert-success").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    expect.soft(成功.some((t) => t.includes("保存しました")), "成功メッセージ「保存しました」が表示されている").toBe(true);
    expect.soft(new URL(page.url()).pathname, "遷移先（このフォーマットの詳細画面）").toMatch(new RegExp(`/format/${id}/edit$`));
    expect.soft(await 欄(page, "nameJp").inputValue(), "遷移先のフォーマット名(日)").toBe(後);
  });
});
