/** M05-11 受注情報編集（共有・履歴・ポイントの紐づけ）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 会員ポイント, 受注明細, 商品の在庫 } from "../../db/m05_11";
import { OrderEditPage, OrderItemsEdit, 明細行 } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-i";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
const 履歴リンクの注記 = () => test.info().annotations.push({ type: "手順の注記", description: "受注データ更新履歴のリンクの文言は「画面操作変更」。これを正本の「変更」として押した（別タブで履歴画面が開く）" });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

caseTest("IT-M05-11-105", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let n = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("105"))); });
  await step(2, async () => { n = await p.整理番号の表示数(); });
  await expected(async () => { expect.soft(n, "店頭販売用整理番号の表示数").toBe(0); });
});

caseTest("IT-M05-11-055", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  const c = rc("LOW-001");
  let rows: ReturnType<typeof 受注明細> = [];
  let 在庫 = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("共有LOW"))); });
  await step(2, async () => {
    await 明細行(page, c).locator("button.btn-stockout").click({ timeout: 20_000 });
    await new OrderItemsEdit(page).明細に入れる(c, { 数量: "3" });
    await 明細行(page, c).locator('input[name$="[stockout]"]').fill("0", { timeout: 20_000 });
  });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { rows = 受注明細(notes.get(key("共有LOW"))); 在庫 = 商品の在庫(c).在庫; });
  await expected(async () => {
    expect.soft(rows.find((r) => r.商品コード === c)?.数量, "受注数量（更新前の1のまま）").toBe("1");
    expect.soft(在庫, "商品在庫数（更新前の2のまま）").toBe(2);
  });
});

caseTest("IT-M05-11-129", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let pt = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("129"))); });
  await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { pt = 会員ポイント(notes.get(key("129"))); });
  await expected(async () => { expect.soft(pt, "会員の保持ポイント（1000から削除した履歴の合計80を引いた920）").toBe(920); });
});

caseTest("IT-M05-11-139", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage, h!: OrderEditPage;
  const old = rc("M0511-139-ITM-OLD"), cur = rc("M0511-139-ITM-CUR");
  let 数量 = "", curCount = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("139"))); });
  await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); });
  await step(3, async () => {
    await h.status.waitFor({ state: "attached", timeout: 30_000 });
    数量 = await 明細行(h.page, old).locator('input[name$="[quantity]"]').first().inputValue();
    curCount = await 明細行(h.page, cur).count();
  });
  await expected(async () => {
    expect.soft(数量, `履歴画面の受注商品 ${old} の数量`).toBe("3");
    expect.soft(curCount, `履歴画面の受注商品 ${cur} の行数`).toBe(0);
  });
});

caseTest("IT-M05-11-144", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage, h!: OrderEditPage;
  const c = rc("M0511-144-ITM");
  let 前 = { 数量: "", 価格: "" }, 後 = { 数量: "", 価格: "" };
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("144"))); });
  await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); });
  await step(3, async () => {
    await h.status.waitFor({ state: "attached", timeout: 30_000 });
    const row = 明細行(h.page, c);
    const q = row.locator('input[name$="[quantity]"]').first(), pr = row.locator('input[name$="[price]"]').first();
    前 = { 数量: await q.inputValue(), 価格: await pr.inputValue() };
    await q.click({ force: true, timeout: 10_000 }).catch(() => undefined);
    await h.page.keyboard.type("99").catch(() => undefined);
    await pr.click({ force: true, timeout: 10_000 }).catch(() => undefined);
    await h.page.keyboard.type("99").catch(() => undefined);
    後 = { 数量: await q.inputValue(), 価格: await pr.inputValue() };
  });
  await expected(async () => {
    expect.soft(Number(前.数量), "履歴画面の数量").toBe(3);
    expect.soft(Number(前.価格.replace(/[^0-9.]/g, "")), "履歴画面の価格").toBe(1000);
    expect.soft(後, "文字入力を試みたあとの数量・価格（変わらない）").toEqual(前);
  });
});

caseTest("IT-M05-11-145", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage, h!: OrderEditPage;
  const c = rc("M0511-145-ITM");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("145"))); });
  await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); });
  await step(3, async () => { await h.status.waitFor({ state: "attached", timeout: 30_000 }); await expect(明細行(h.page, c)).toHaveCount(1); });
  await expected(async () => {
    const btn = 明細行(h.page, c).locator("button.btn-stockout");
    await expect.soft(btn, "「欠品登録」ボタン").toBeVisible();
    await expect.soft(btn, "「欠品登録」ボタン（非活性でない）").toBeEnabled();
  });
});
