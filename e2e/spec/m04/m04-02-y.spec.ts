/**
 * M04-02 在庫編集の続き（-y）: 所属のマスタを使うケース 007・008。正本: cases/M04-02_test_cases.tsv
 * 依頼者決定（2026-11-14）で、所属のマスタに「在庫管理部（M04-02）」「東京販売部（M04-02）」を足した（seeds/m04-02-y.ts）。
 * 店舗「TC東京2F-007」「TC東京2F-008」は、試験支店で読み替える（店舗は作らない）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 在庫編集画面を開く } from "../../pages/admin/m04_02_stock_x";
import { 担当者, TC東京2F, 店の読み替え } from "../../seeds/m04-02-x";
import { 伊藤, 宇野, 大阪, 所属, 所属の注記, 青木 } from "../../seeds/m04-02-y";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
test.beforeEach(() => { supplement(店の読み替え()); supplement(所属の注記()); });
const 在庫ID = (ctx: CaseCtx, n: string) => ctx.notes.get(`〔在庫ID-M0402-${n}〕`);

const dept = (page: Page) => page.locator("form#stock_approval_form #admin_stock_approval_new_approval_department");
const members = (page: Page) => page.locator("form#stock_approval_form #admin_stock_approval_new_approval_notification_target_members");
const labels = (l: ReturnType<typeof dept>) => l.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value).map((o) => (o.textContent ?? "").trim()));

caseTest("IT-M04-02-007", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 担当者.account);
  let 所属の選択肢: string[] = [];
  let メンバーの選択肢: string[] = [];
  await step(1, async () => { expect(await 在庫編集画面を開く(page, 在庫ID(ctx, "007")), "在庫編集画面の応答").toBe(200); });
  await step(2, async () => {
    await expect(dept(page), "承認通知先の所属の欄").toBeVisible({ timeout: 30_000 });
    所属の選択肢 = await labels(dept(page));
    メンバーの選択肢 = await labels(members(page));
    note(`所属の選択肢: ${所属の選択肢.join("、")}・メンバーの選択肢（${メンバーの選択肢.length}件）: ${メンバーの選択肢.join("、")}`);
  });
  await expected(async () => {
    supplement(`試験支店（${TC東京2F.店名}）は共有で、ほかの試験用の所属・承認権限ありのメンバーも所属しているので、選択肢は正本の2件・2人だけにならない。足した所属・メンバーが含まれ並び順（名前順）どおりであること、承認権限なしの宇野・対象店舗以外の大阪承認者が含まれないことで確かめた`);
    const a = 所属の選択肢.indexOf(所属.在庫管理部), b = 所属の選択肢.indexOf(所属.東京販売部);
    expect.soft(a >= 0 && b >= 0, "所属に「在庫管理部」「東京販売部」がある").toBe(true);
    expect.soft(a < b, "所属は並び順昇順（在庫管理部が先）").toBe(true);
    const m1 = メンバーの選択肢.indexOf(青木("007").名前), m2 = メンバーの選択肢.indexOf(伊藤("007").名前);
    expect.soft(m1 >= 0 && m2 >= 0, "メンバーに「青木承認者-007」「伊藤承認者-007」がある").toBe(true);
    expect.soft(m1 < m2, "メンバーは名前昇順（青木承認者が先）").toBe(true);
    expect.soft(メンバーの選択肢.includes(宇野("007").名前), "承認権限のない「宇野一般担当-007」は表示されない").toBe(false);
    expect.soft(メンバーの選択肢.includes(大阪("007").名前), "対象店舗以外の「大阪承認者-007」は表示されない").toBe(false);
  });
});

caseTest("IT-M04-02-008", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, 担当者.account);
  let 選択中: string[] = [];
  let 選択肢: string[] = [];
  await step(1, async () => { expect(await 在庫編集画面を開く(page, 在庫ID(ctx, "008")), "在庫編集画面の応答").toBe(200); await expect(dept(page)).toBeVisible({ timeout: 30_000 }); });
  await step(2, async () => {
    const name = 青木("008").名前;
    await page.locator("form#stock_approval_form #admin_stock_approval_new_approval_notification_target_members + span.select2 .select2-selection").click();
    const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) });
    await expect(option, `承認通知先の候補「${name}」`).toHaveCount(1, { timeout: 60_000 });
    await option.click();
    await page.keyboard.press("Escape");
  });
  await step(3, async () => {
    const hit = await dept(page).locator("option").evaluateAll((os, n) => os.filter((o) => (o.textContent ?? "").trim() === n).map((o) => (o as HTMLOptionElement).value), 所属.東京販売部);
    expect(hit.length, `所属「${所属.東京販売部}」が選択肢に1つ`).toBe(1);
    await dept(page).selectOption(hit[0]);
    await page.waitForTimeout(500);
    選択中 = await members(page).locator("option:checked").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value).map((o) => (o.textContent ?? "").trim()));
    選択肢 = await labels(members(page));
    note(`所属変更後の選択中: ${選択中.join("、") || "なし"}・メンバーの選択肢: ${選択肢.join("、")}`);
  });
  await expected(async () => {
    expect.soft(選択中, "選択済みの「青木承認者-008」が保持される").toEqual([青木("008").名前]);
    expect.soft(選択肢.includes(伊藤("008").名前), "メンバーの選択肢に東京販売部所属で承認権限のある「伊藤承認者-008」がある").toBe(true);
    expect.soft(選択肢.includes(青木("008").名前), "在庫管理部所属の青木承認者-008は選択肢から外れる（伊藤承認者-008に差し替わる）").toBe(false);
  });
});
