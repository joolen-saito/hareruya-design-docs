/**
 * M04-31 棚卸計画の続き（082）。正本: cases/M04-31_test_cases.tsv。シード: seeds/m04-31-b.ts
 * 棚卸計画編集画面の「数量登録」のモーダルで、20001行のCSVを送り、上限超過の誤りと、計上済み（棚卸数量が入った）の棚卸詳細が0件であることを確かめる。
 * 期待結果の「計上済み商品数」は、画面の棚卸対象商品の一覧で棚卸数量が入った行の数として読んだ（正本の外の補い。棚卸詳細は商品20001件でなく、印つきの商品1件〔棚卸数量は空〕の計画）。
 * アプリの作り: 「数量登録」ボタンは棚卸詳細（商品数）0件だと無効。20000行超の確かめは、見出し確認・空確認の後、商品コードの照合・登録より前に行われる。
 * このため CSV の先頭データ行は入れた詳細の商品コードにした（取り消されなければ棚卸数量1が入る＝取り消しが観測できる。順序が違えば商品の照合は行われず、結果は変わらない）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { InventoryPlanEditPage, InventoryPlanListPage, topMessages } from "../../pages/admin/m04_31_inventory_plan";
import { M0431_ADMIN, 表示名 } from "../../seeds/m04-31";
import { 数量CSV20001, 計画ID_082, 計画名082 } from "../../seeds/m04-31-b";

test.use({ actionTimeout: 90_000, navigationTimeout: 180_000 });
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M04-31-082", async ({ page, step, expected }) => {
  const id = 計画ID_082();
  const name = 計画名082();
  const list = new InventoryPlanListPage(page);
  const edit = new InventoryPlanEditPage(page);
  let errors: string[] = [];
  let 計上済み = -1;
  await loginAdmin(page, M0431_ADMIN);
  await step(1, async () => { await list.open(); });
  await step(2, async () => { await list.search({ 店舗: 表示名("店舗A"), 在庫区分: ["EC-CUBE"] }); });
  await step(3, async () => {
    const hit = (await list.rows()).filter((r) => r.棚卸名 === name);
    expect(hit, `棚卸計画一覧に「${name}」の行が1件`).toHaveLength(1);
    expect(hit[0].id, `一覧の行の棚卸計画ID（控えた ${id}）`).toBe(id);
    await Promise.all([page.waitForURL(new RegExp(`/product/stock/inventory_plan/${id}$`), { waitUntil: "load", timeout: 60_000 }), page.locator(`#inventory_plan_list_main__item--${id} a`).first().click()]);
    expect(await edit.name(), "棚卸計画編集画面の棚卸名").toBe(name);
  });
  const modalId = "#inventoryPlanQuantityCsvModal";
  await step(4, async () => {
    const opener = page.locator(`button[data-bs-target="${modalId}"]`);
    await expect(opener, "「数量登録」ボタン").toBeEnabled();
    await opener.click();
    await expect(page.locator(modalId), "棚卸商品数量CSV登録のモーダル").toBeVisible();
  });
  await step(5, async () => {
    const body = 数量CSV20001();
    note(`m0431-082-over.csv: 見出し行＋データ ${body.trim().split("\n").length - 1} 行（${Buffer.byteLength(body)}バイト）を選んで、モーダルの登録ボタンを押した`);
    const modal = page.locator(modalId);
    await modal.locator('input[type="file"]').setInputFiles({ name: "m0431-082-over.csv", mimeType: "text/csv", buffer: Buffer.from(body, "utf-8") });
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('form button[type="submit"]').click()]);
    const m = await topMessages(page);
    errors = m.エラー;
    note(`登録のあとの上部のメッセージ: ${JSON.stringify(m)}・画面 ${page.url()}`);
    await edit.openById(id);
    const rows = await edit.detailRows();
    計上済み = rows.filter((r) => (r["棚卸数量"] ?? "").trim() !== "").length;
    note(`棚卸対象商品の一覧: ${rows.length} 行・うち棚卸数量が入った行 ${計上済み}。補い: 棚卸詳細は印つきの商品1件（棚卸数量は空）で、CSVの先頭データ行がその商品`);
  });
  await expected(async () => {
    expect.soft(errors.some((e) => e.includes("20000 行を超えるCSVファイルは登録できません。")), `「20000 行を超えるCSVファイルは登録できません。」が表示される（実際: ${errors.join(" / ") || "なし"}）`).toBe(true);
    expect.soft(計上済み, "計上済み商品数（棚卸数量が入った行）が0").toBe(0);
  });
});
