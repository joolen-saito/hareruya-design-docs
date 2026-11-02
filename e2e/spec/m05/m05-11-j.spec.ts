/** M05-11 受注情報編集（配送商品の作り直し・商品名・店頭受取）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 受注, 受注明細, 受注明細ID, 受注明細の商品名 } from "../../db/m05_11";
import { OrderEditPage, OrderItemsEdit } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-j";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

caseTest("IT-M05-11-048", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let 前: Record<string, string> = {}, 後: Record<string, string> = {};
  const a = rc("BASE-A-048");
  await step(1, async () => { 前 = 受注明細ID(notes.get(key("048"))); expect(前[a], "記録した配送商品ID").toBe(notes.get("〔配送商品ID-M0511-048A〕")); });
  await step(2, async () => { p = await 開く(browser, page, notes.get(key("048"))); await new OrderItemsEdit(page).明細に入れる(a, { 数量: "1" }); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { 後 = 受注明細ID(notes.get(key("048"))); });
  await expected(async () => {
    const olds = Object.values(前), news = Object.values(後);
    expect.soft(olds.filter((id) => news.includes(id)), "更新前と同じ配送商品ID（残っていない）").toEqual([]);
    expect.soft(Object.keys(後).sort(), "更新後に登録された配送商品の商品").toEqual(Object.keys(前).sort());
  });
});

caseTest("IT-M05-11-216", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let names: Record<string, string> = {};
  const a = rc("DPM0511-216-A");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("216"))); });
  await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(a, { 数量: "1" }); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { await page.waitForLoadState("load"); });
  await step(5, async () => { names = 受注明細の商品名(notes.get(key("216"))); });
  await expected(async () => {
    expect.soft(names[a], "作り直された配送商品の商品名").toBe(rc("変更後名称216"));
    expect.soft(names[a] === rc("受注時名称216"), "受注時の商品名のままになっている").toBe(false);
  });
});

caseTest("IT-M05-11-027", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let rows: ReturnType<typeof 受注明細> = [];
  const a = rc("PICK-A"), b = rc("PICK-B");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("共有PICKUP"))); });
  await step(2, async () => { await new OrderItemsEdit(page).削除を押す(b); await new OrderItemsEdit(page).削除を確定する(b); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { rows = 受注明細(notes.get(key("共有PICKUP"))); });
  await expected(async () => { expect.soft(rows.map((r) => r.商品コード).sort(), "受注明細（PICK-A・PICK-B の2明細がそのまま残る）").toEqual([a, b].sort()); });
});

caseTest("IT-M05-11-099", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let st = "";
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("099"))); });
  await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { st = String(受注(notes.get(key("099"))).ステータス); });
  await expected(async () => {
    expect.soft(st, "受注のステータス（受注全体がキャンセル）").toBe("キャンセル");
    expect.soft(new URL(page.url()).pathname, "遷移先（受注情報編集画面）").toMatch(/\/order\/\d+\/edit$/);
  });
});
