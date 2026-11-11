// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/** M05-11 受注情報編集（日付のクリア・ポイント・原価の在庫変動履歴・複数明細）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { CaseBody, CaseCtx, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 受注明細, 商品の在庫 } from "../../db/m05_11";
import { 会員の累計注文金額, 受注のポイント, 受注の日付, 受注の対応状況, 商品の在庫値, 在庫変動履歴の詳細 } from "../../db/m05_11_write";
import { searchStockByCode, stockInRow } from "../../pages/admin/m04_02_rc_stock";
import { OrderEditPage, OrderItemsEdit, 明細行, 日付をクリアする } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-n-k";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";
import { 会員ポイント } from "../../db/m05_11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}
const 編集画面 = (page: Page) => new URL(page.url()).pathname;
async function 在庫数(page: Page, browser: Browser, code: string): Promise<number> {
  const shop = await 店舗Aの店名(browser);
  const list = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
  return stockInRow(list.row(code, shop, "EC-CUBE"));
}
const 履歴リンクの注記 = () => note("受注データ更新履歴のリンクの文言は「画面操作変更」。これを正本の「変更」として押した（別タブで履歴画面が開く）");

caseTest("IT-M05-11-042", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("042")), code = rc("NSTOCK-001-042");
  let p!: OrderEditPage;
  let 前: string | null = "", 後: string | null = "";
  await step(1, async () => { p = await 開く(browser, page, no); 前 = 商品の在庫値(code); });
  await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(code, { 数量: "1" }); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { 後 = 商品の在庫値(code); });
  await expected(async () => {
    expect.soft(受注明細(no).find((r) => r.商品コード === code)?.数量, "受注数量（1に変わった）").toBe("1");
    expect.soft(後, `在庫値（操作前の${前 === null ? "未設定" : 前}のまま）`).toBe(前);
  });
});

caseTest("IT-M05-11-123", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("123"));
  let p!: OrderEditPage;
  let 発生 = -1;
  await step(1, async () => { p = await 開く(browser, page, no); });
  await step(2, async () => { await p.お支払情報を開く(); });
  await step(3, async () => {
    const f = page.locator("#order_gainedPoints");
    try { await f.fill("999", { timeout: 10_000 }); } catch { note("ポイント発生の欄は入力できない状態だったため、値を直接書き換えて999にした"); await f.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, "999"); }
  });
  await step(4, async () => { await p.登録を押す(onDialog); });
  await step(5, async () => { 発生 = 受注のポイント(no).発生; });
  await expected(async () => { expect.soft(発生, "発生ポイント（(2000-100)×5%＝95。入力した999にならない）").toBe(95); });
});

caseTest("IT-M05-11-132", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("132"))); });
  await step(2, async () => { await p.note.fill("キャンセル保存遷移"); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await expected(async () => { expect.soft(編集画面(page), "遷移先（受注情報編集画面）").toMatch(/\/order\/\d+\/edit$/); });
});

// ---- 在庫変動履歴の原価 ----
const 注文番号入り = (rows: ReturnType<typeof 在庫変動履歴の詳細>) => rows.filter((r) => !r.理由.includes("M05-11試験データ"));
function 数量変更の履歴(n: string, 変更後: string, 期待: { 増減: number; 仕入総価格?: number; 前: number; 後: number }): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const no = notes.get(key(n)), code = rc(`M0511-${n}-ITM`);
    let p!: OrderEditPage;
    let rows: ReturnType<typeof 在庫変動履歴の詳細> = [];
    await step(1, async () => { p = await 開く(browser, page, no); });
    await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(code, { 数量: 変更後 }); });
    await step(3, async () => { await p.登録を押す(onDialog); });
    await step(4, async () => { await page.waitForLoadState("load"); /* 数量を減らしたときの一部キャンセルの確認ダイアログは、登録を押したときに受け入れた（注記に残る） */ });
    await step(5, async () => { rows = 注文番号入り(在庫変動履歴の詳細(code)); });
    await expected(async () => {
      expect.soft(rows.length, "在庫変動履歴の件数").toBe(1);
      const r = rows[0];
      expect.soft(r?.増減数, "増減数").toBe(期待.増減);
      if (期待.仕入総価格 !== undefined) expect.soft(r && r.変更後総原価! - r.変更前総原価!, "仕入総価格（履歴で増えた総原価。履歴に仕入総価格の列は無いので、変更後と変更前の総原価の差とみなした）").toBe(期待.仕入総価格);
      expect.soft(r?.変更前総原価, "変更前総原価").toBe(期待.前);
      expect.soft(r?.変更後総原価, "変更後総原価").toBe(期待.後);
      expect.soft(r?.理由.includes(no), "理由に注文番号が含まれる").toBe(true);
    });
  };
}
caseTest("IT-M05-11-100", 数量変更の履歴("100", "2", { 増減: 1, 仕入総価格: 500, 前: 3600, 後: 4100 }));
caseTest("IT-M05-11-101", 数量変更の履歴("101", "4", { 増減: -1, 前: 3600, 後: 3200 }));

/** 手順1〜5（開く・欠品登録を押す・欠品数量を入れる・登録を押す・DBで在庫変動履歴を確認する）を行い、履歴を返す */
async function 欠品を登録する(ctx: CaseCtx, n: string): Promise<{ rows: ReturnType<typeof 在庫変動履歴の詳細>; no: string }> {
  const { page, browser, notes, step } = ctx;
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key(n)), code = rc(`M0511-${n}-ITM`);
  let p!: OrderEditPage;
  let rows: ReturnType<typeof 在庫変動履歴の詳細> = [];
  await step(1, async () => { p = await 開く(browser, page, no); });
  await step(2, async () => { await 明細行(page, code).locator("button.btn-stockout").click({ timeout: 20_000 }); });
  await step(3, async () => { await 明細行(page, code).locator('input[name$="[stockout]"]').fill("1", { timeout: 20_000 }); });
  await step(4, async () => { await p.登録を押す(onDialog); });
  await step(5, async () => { rows = 注文番号入り(在庫変動履歴の詳細(code)); });
  return { rows, no };
}
caseTest("IT-M05-11-102", async (ctx) => {
  const { rows } = await 欠品を登録する(ctx, "102");
  await ctx.expected(async () => {
    expect.soft(rows.length, "在庫変動履歴の件数（戻し履歴と減算履歴の2件）").toBe(2);
    const [a, b] = rows;
    expect.soft([a?.増減数, a && a.変更後総原価! - a.変更前総原価!, a?.変更前総原価, a?.変更後総原価], "1件目（戻し履歴）の増減数・仕入総価格（履歴で増えた総原価）・変更前総原価・変更後総原価").toEqual([1, 500, 3600, 4100]);
    expect.soft([b?.増減数, b?.変更前総原価, b?.変更後総原価], "2件目（減算履歴）の増減数・変更前総原価・変更後総原価").toEqual([-1, 4100, 3600]);
  });
});
caseTest("IT-M05-11-103", async (ctx) => {
  const { rows, no } = await 欠品を登録する(ctx, "103");
  await ctx.expected(async () => {
    expect.soft(rows.length, "在庫変動履歴の件数").toBe(2);
    expect.soft(rows[0]?.理由, "戻し履歴の理由").toBe(`欠品による加算 注文番号：${no}`);
    expect.soft(rows[1]?.理由, "減算履歴の理由").toBe(`欠品による減算 注文番号：${no}`);
  });
});
caseTest("IT-M05-11-160", async (ctx) => {
  const { rows } = await 欠品を登録する(ctx, "160");
  await ctx.expected(async () => {
    expect.soft(rows.length, "在庫変動履歴の件数").toBe(2);
    expect.soft(rows.find((r) => r.増減数 === 1)?.区分, "増減数+1の履歴の在庫変動区分").toBe("欠品加算（受注）");
    expect.soft(rows.find((r) => r.増減数 === -1)?.区分, "増減数-1の履歴の在庫変動区分").toBe("欠品減算（受注）");
  });
});

// ---- 受注データ更新履歴 ----
caseTest("IT-M05-11-196", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage, h!: OrderEditPage;
  let st = "";
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("196"))); });
  await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); });
  await step(3, async () => { await h.status.waitFor({ state: "attached", timeout: 30_000 }); st = await h.現在のステータス(); });
  await expected(async () => { expect.soft(st, "履歴画面の受注情報部の受注ステータス").toBe("入金済み"); });
});
caseTest("IT-M05-11-197", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage, h!: OrderEditPage;
  let memo = "";
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("197"))); });
  await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); });
  await step(3, async () => { await h.status.waitFor({ state: "attached", timeout: 30_000 }); memo = await h.note.inputValue(); });
  await expected(async () => { expect.soft(memo, "履歴画面のショップ用メモ欄").toBe("履歴メモ197"); });
});

// ---- 複数明細（DP系） ----
caseTest("IT-M05-11-205", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("205")), code = rc("DPM0511-205-A");
  let p!: OrderEditPage;
  let 在庫 = -1, 累計 = -1;
  await step(1, async () => { p = await 開く(browser, page, no); });
  await step(2, async () => { await p.受注情報を登録する(onDialog); });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { 在庫 = await 在庫数(page, browser, code); });
  await step(5, async () => { 累計 = 会員の累計注文金額(no); });
  await expected(async () => {
    expect.soft(在庫, "商品DPM0511-205-Aの在庫（8のまま）").toBe(8);
    expect.soft(累計, "会員の累計注文金額（10000のまま）").toBe(10000);
  });
});

caseTest("IT-M05-11-207", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("DPM0511-207-A");
  let p!: OrderEditPage;
  let rows: ReturnType<typeof 在庫変動履歴の詳細> = [];
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("207"))); });
  await step(2, async () => { await 明細行(page, code).locator("button.btn-stockout").click({ timeout: 20_000 }); });
  await step(3, async () => { await 明細行(page, code).locator('input[name$="[stockout]"]').fill("2", { timeout: 20_000 }); });
  await step(4, async () => { await p.登録を押す(onDialog); });
  await step(5, async () => { rows = 注文番号入り(在庫変動履歴の詳細(code)); });
  await expected(async () => {
    expect.soft(rows.filter((r) => r.増減数 === 2 && r.区分 === "欠品加算（受注）").length, "増減数+2の「欠品加算（受注）」の件数").toBe(1);
    expect.soft(rows.filter((r) => r.増減数 === -2 && r.区分 === "欠品減算（受注）").length, "増減数-2の「欠品減算（受注）」の件数").toBe(1);
  });
});

caseTest("IT-M05-11-213", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const m = rc("DPM0511-213-M"), nn = rc("DPM0511-213-N");
  let p!: OrderEditPage;
  let 前N: string | null = "", 後N: string | null = "", 後M = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("213"))); 前N = 商品の在庫値(nn); });
  await step(2, async () => { const items = new OrderItemsEdit(page); await items.明細に入れる(m, { 数量: "1" }); await items.明細に入れる(nn, { 数量: "1" }); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { await page.waitForLoadState("load"); /* 一部キャンセルの確認ダイアログは、登録を押したときに受け入れた */ });
  await step(5, async () => { 後M = 商品の在庫(m).在庫; 後N = 商品の在庫値(nn); });
  await expected(async () => {
    expect.soft(後M, "商品DPM0511-213-Mの在庫（8から9）").toBe(9);
    expect.soft(後N, `商品DPM0511-213-Nの在庫値（操作前の${前N === null ? "未設定" : 前N}のまま）`).toBe(前N);
  });
});

caseTest("IT-M05-11-217", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("DPM0511-217-A");
  let p!: OrderEditPage;
  let 在庫 = -1, 件数 = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("217"))); });
  await step(2, async () => { await p.note.fill("数量不変メモ217"); });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { 在庫 = 商品の在庫(code).在庫; 件数 = 在庫変動履歴の詳細(code).length; });
  await expected(async () => {
    expect.soft(在庫, "商品DPM0511-217-Aの在庫（8のまま）").toBe(8);
    expect.soft(件数, "在庫変動履歴の件数（控えた値のまま）").toBe(Number(notes.get("〔履歴件数-M0511-217〕")));
  });
});

