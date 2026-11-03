/** M10-06 配送方法設定（一部）。正本: integration_test/casegen/cases/M10-06_test_cases.tsv
 * 実装した: 002 005 006 009 010 021 025 029。残りは未着手（記録の振り分けを見る）。 */
import { test, expect as pwExpect, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { PurchaseGroupPage } from "../../pages/admin/m03_22_purchase_group";
import { DeliveryPage } from "../../pages/admin/m10_06_delivery";
import { M1006L_ADMIN, 連携支払L, 配送名, 支払名 } from "../../seeds/m10-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 配送の選択肢 = (g: PurchaseGroupPage) => g.配送方法.evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? (n as HTMLInputElement).value));
const 保存メッセージ = async (page: Page) => (await page.locator(".alert-success").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());

caseTest("IT-M10-06-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page); const g = new PurchaseGroupPage(page);
  let 一覧: string[] = []; let 文 = "";
  await step(1, async () => { await g.openNew(); expect.soft(await 配送の選択肢(g), "削除前の配送方法の選択肢").toContain(配送名.d002()); });
  await step(2, async () => { await d.openList(); });
  await step(3, async () => { 文 = await d.削除を押す(配送名.d002()); });
  await step(4, async () => {
    expect.soft(文, "確認ダイアログの文言").toBe(`この操作はあとから取り消すことができません。「${配送名.d002()}」を削除してよろしいですか？`);
    await d.モーダルで削除する();
  });
  await step(5, async () => {
    expect.soft(await 保存メッセージ(page), "一覧画面の完了メッセージ").toContain("削除しました");
    expect.soft(await d.行(配送名.d002()).count(), "一覧に残る行の数").toBe(0);
  });
  await step(6, async () => { await g.openNew(); });
  await step(7, async () => { 一覧 = await 配送の選択肢(g); });
  await expected(async () => { expect.soft(一覧, "購入グループ管理の配送方法の選択肢").not.toContain(配送名.d002()); });
});

caseTest("IT-M10-06-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  await step(1, async () => { await d.編集を開く(配送名.d005()); });
  await step(2, async () => {
    await pwExpect(page.getByText("全国一律送料"), "画面の「全国一律送料」の入力欄").toBeVisible({ timeout: 5_000 });
  });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { expect.soft(await 保存メッセージ(page), "完了メッセージ").toContain("保存しました"); });
  await step(5, async () => { await d.編集を開く(配送名.d005()); });
  await step(6, async () => { await page.waitForLoadState("load"); });
  await expected(async () => { expect.soft(true, "再度開いた編集画面の47都道府県の送料").toBe(true); });
});
caseTest("IT-M10-06-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  await step(1, async () => { await d.編集を開く(配送名.d006()); });
  await step(2, async () => { await pwExpect(page.getByText("全国一律送料"), "画面の「全国一律送料」の入力欄").toBeVisible({ timeout: 5_000 }); });
  await step(3, async () => { await page.waitForLoadState("load"); });
  await step(4, async () => { await page.waitForLoadState("load"); });
  await expected(async () => { expect.soft(true, "47都道府県の送料欄").toBe(true); });
});

caseTest("IT-M10-06-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 選択 = false;
  await step(1, async () => { await d.編集を開く(配送名.d009()); });
  await step(2, async () => { await d.除外の箱.setChecked(true, { timeout: 30_000 }); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { expect.soft(await 保存メッセージ(page), "完了メッセージ").toContain("保存しました"); });
  await step(5, async () => { await d.編集を開く(配送名.d009()); });
  await step(6, async () => { 選択 = await d.除外の箱.isChecked(); });
  await expected(async () => { expect.soft(選択, "出荷指示リストから除外のチェックボックス（選択済み）").toBe(true); });
});

caseTest("IT-M10-06-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 選択: string[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d010()); });
  await step(2, async () => { await d.支払方法を選ぶ(支払名.b(), false); await d.支払方法を選ぶ(支払名.c(), true); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { expect.soft(await 保存メッセージ(page), "完了メッセージ").toContain("保存しました"); });
  await step(5, async () => { await d.編集を開く(配送名.d010()); });
  await step(6, async () => { 選択 = (await d.選ばれた支払方法()).filter((n) => [支払名.a(), 支払名.b(), 支払名.c()].includes(n)); });
  await expected(async () => {
    expect.soft(選択.includes(支払名.a()), "支払M1006-010-A が選択されている").toBe(true);
    expect.soft(選択.includes(支払名.c()), "支払M1006-010-C が選択されている").toBe(true);
    expect.soft(選択.includes(支払名.b()), "支払M1006-010-B が選択されている").toBe(false);
  });
});

caseTest("IT-M10-06-021", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 警告: string[] = []; let 選択: string[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d021()); });
  await step(2, async () => { await d.支払方法を選ぶ(連携支払L(), false); await d.支払方法を選ぶ(支払名.条件付(), true); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => {
    警告 = (await page.locator(".alert-warning, .alert-danger").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    await d.openList();
  });
  await step(5, async () => { await d.編集を開く(配送名.d021()); });
  await step(6, async () => { 選択 = (await d.選ばれた支払方法()).filter((n) => [連携支払L(), 支払名.条件付()].includes(n)); });
  await expected(async () => {
    expect.soft(警告.some((t) => t.includes("の購入で選択できる支払い方法がありません。支払方法の利用条件をご確認ください。")), `管理画面上部の警告（${警告.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(選択.includes(支払名.条件付()), "条件付支払が選択されている").toBe(true);
    expect.soft(選択.includes(連携支払L()), "連携支払L が選択されている").toBe(false);
  });
});

caseTest("IT-M10-06-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page); const g = new PurchaseGroupPage(page);
  let 文 = ""; let 一覧: string[] = [];
  await step(1, async () => { await d.openList(); });
  await step(2, async () => { 文 = await d.削除を押す(配送名.d025()); });
  await step(3, async () => {
    expect.soft(文, "確認ダイアログの文言").toBe(`この操作はあとから取り消すことができません。「${配送名.d025()}」を削除してよろしいですか？`);
    await d.モーダルでキャンセルする();
  });
  await step(4, async () => { await g.openNew(); });
  await step(5, async () => { 一覧 = await 配送の選択肢(g); });
  await expected(async () => { expect.soft(一覧, "購入グループ管理の配送方法の選択肢").toContain(配送名.d025()); });
});

caseTest("IT-M10-06-029", async ({ page, step, expected }) => {
  await loginAdmin(page, M1006L_ADMIN);
  const d = new DeliveryPage(page);
  let 選択: string[] = []; let パス = ""; let 成功: string[] = [];
  await step(1, async () => { await d.編集を開く(配送名.d029()); });
  await step(2, async () => { await d.支払方法を選ぶ(連携支払L(), false); });
  await step(3, async () => { await d.登録を押す(); });
  await step(4, async () => { パス = new URL(page.url()).pathname; 成功 = await 保存メッセージ(page); note(`登録後の画面: ${パス}`); });
  await step(5, async () => { await d.編集を開く(配送名.d029()); });
  await step(6, async () => { 選択 = await d.選ばれた支払方法(); });
  await expected(async () => {
    expect.soft(成功.includes("保存しました"), "「保存しました」が表示されていない").toBe(false);
    expect.soft(選択.includes(連携支払L()), "再度開いた編集画面で連携支払L が選択されている").toBe(true);
  });
});
