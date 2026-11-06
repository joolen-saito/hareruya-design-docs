/**
 * M15-06 デッキ登録CSV。ケースの正本: integration_test/casegen/cases/M15-06_test_cases.tsv
 * 実装しないケース（理由は記録 e2e/review/M15-06_progress_*.md）: 取込そのもののケースは、DB での準備が要るシード・デッキ検索TOP（前面）・3601秒のキャッシュ待ちが要る。ここは画面だけで成り立つ 001 と 048。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1506_ADMIN } from "../../seeds/m15-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1506_ADMIN);
}

caseTest("IT-M15-06-001", async ({ page, step, expected }) => {
  await login(page);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => {
    note("画面のボタンの表示は「CSV登録」（正本は「CSV,TSV取り込み」）。同じ位置のボタン（デッキ登録CSVアップロードへのリンク）を押した");
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('a[href$="/deck/csv_import"]').click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス").toMatch(/\/deck\/csv_import$/);
    await expect.soft(page.locator("#upload-button, button[type=submit]").first(), "アップロードの操作部品").toBeVisible();
  });
});

caseTest("IT-M15-06-048", async ({ page, step, expected }) => {
  await login(page);
  let ラベル: string[] = [];
  await step(1, async () => { await page.goto(adminUrl("/deck/csv_import")); await page.waitForLoadState("load"); await expect(page.locator("form").first(), "デッキ登録CSVアップロード画面").toBeVisible(); });
  await step(2, async () => {
    ラベル = (await page.locator("main label, .c-contentsArea label, form label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    expect(await page.locator("form input, form button").count(), "画面の入力部品の数").toBeGreaterThan(0);
  });
  await expected(async () => {
    expect.soft(ラベル.some((t) => t.includes("厳密にチェック")), "「厳密にチェックする」のラベルの有無").toBe(false);
    expect.soft(await page.getByText("厳密にチェックする").count(), "「厳密にチェックする」の表示の数").toBe(0);
    expect.soft(await page.locator('input[type="checkbox"]:visible').count(), "表示されているチェックボックスの数").toBe(0);
  });
});
