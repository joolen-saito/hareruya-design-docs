/**
 * M14-08 カードセット詳細(登録・編集・削除)の続き（商品編集画面のカードセット欄への反映）。正本: cases/M14-08_test_cases.tsv のうち IT-M14-08-048・049
 * 補い: カードセット名・略称は実行の印つきの値で入力・確認した。商品はシードで画面から登録した商品を使った（seeds/m14-08-e.ts）。
 */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 欄, 入力する, 登録を押す, 登録画面を開く, 編集画面を開く } from "../../pages/admin/m14_08_cardset";
import { openProductEditByCode } from "../../pages/admin/m03_23_seed_products";
import { M1408L_ADMIN } from "../../seeds/m14-08-c";
import { 連携商品コード } from "../../seeds/m14-08-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 商品編集画面を開く（シードで登録した商品を、商品コードで商品マスターから探して開く） */
async function 商品編集を開く(page: Page): Promise<void> {
  await openProductEditByCode(page, 連携商品コード());
}
/** カードセット欄（単一選択）の選択肢の文。欄そのものが単一選択であることも確かめる */
async function カードセット欄の選択肢(page: Page): Promise<{ 選択肢: string[]; 複数選択: boolean }> {
  const select = page.locator("#admin_product_Cardset");
  await expect(select, "商品編集画面のカードセット欄").toHaveCount(1);
  return {
    複数選択: await select.evaluate((el) => (el as HTMLSelectElement).multiple),
    選択肢: (await select.locator("option").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()),
  };
}

caseTest("IT-M14-08-048", async ({ page, notes, step, expected }) => {
  const 名 = rc("LinkSet003");
  let 登録 = { sent: false, url: "" };
  let 欄の状態 = { 選択肢: [] as string[], 複数選択: false };
  await step(1, async () => { await loginAdmin(page, M1408L_ADMIN); });
  await step(2, async () => { await 登録画面を開く(page); });
  await step(3, async () => {
    await 入力する(page, { 名日: 名, 名英: 名, 略称: rc("LNK003"), リリース日: "2026-10-01" });
    await expect(欄(page, "nameJp"), "カードセット名日本語の入力").toHaveValue(名);
  });
  await step(4, async () => { 登録 = await 登録を押す(page); });
  await step(5, async () => { await 商品編集を開く(page); });
  await step(6, async () => {
    note("カードセット欄は選択肢の一覧を開かなくても、欄の選択肢の文を読んで確かめた");
    欄の状態 = await カードセット欄の選択肢(page);
  });
  await expected(async () => {
    expect.soft(登録.sent && /\/cardset\/\d+\/edit/.test(登録.url), "カードセットが登録された（詳細画面へ移った）").toBe(true);
    expect.soft(欄の状態.複数選択, "カードセット欄は単一選択").toBe(false);
    expect.soft(欄の状態.選択肢.some((t) => t.includes(名)), `カードセット欄の選択肢に登録したカードセット（${名}）が含まれる（選択肢 ${欄の状態.選択肢.length} 件）`).toBe(true);
  });
});

caseTest("IT-M14-08-049", async ({ page, notes, step, expected }) => {
  const 名 = rc("LinkDelSet004"), id = notes.get("〔カードセットID-M1408-049〕");
  let 削除前 = { 選択肢: [] as string[], 複数選択: false };
  let 削除後 = { 選択肢: [] as string[], 複数選択: false };
  await step(1, async () => { await loginAdmin(page, M1408L_ADMIN); });
  await step(2, async () => {
    await 商品編集を開く(page);
    削除前 = await カードセット欄の選択肢(page);
    expect.soft(削除前.選択肢.some((t) => t.includes(名)), `削除前: カードセット欄の選択肢に「${名}」が含まれる`).toBe(true);
  });
  await step(3, async () => { await 編集画面を開く(page, id); });
  await step(4, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); await expect(page.locator("#DeleteModal"), "削除の確認ポップアップ").toBeVisible(); });
  await step(5, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.locator('#DeleteModal [data-method="delete"]').click({ timeout: 20_000, noWaitAfter: true })]);
  });
  await step(6, async () => { await 商品編集を開く(page); });
  await step(7, async () => { 削除後 = await カードセット欄の選択肢(page); });
  await expected(async () => {
    // 選択肢が読み込めていないときに「含まれない」で合格にしない（空の選択肢のほかに、ほかのカードセットの選択肢が出ていること）
    expect.soft(削除後.選択肢.length, "削除後: カードセット欄の選択肢が読み込まれている（空の選択肢のほかにも選択肢がある）").toBeGreaterThan(1);
    expect.soft(削除後.選択肢.some((t) => t.includes(名)), `削除したカードセット（${名}）が選択肢に含まれない（含まれるのは不合格）`).toBe(false);
  });
});
