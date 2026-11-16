/** M05-11 受注情報編集（商品の明細を扱うケース）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 受注, 受注明細, 商品の在庫, 在庫変動履歴, 受注の合計金額, 受注の金額とポイント, 配送商品, 配送先の数, 商品規格のマスタ, 配送商品行 } from "../../db/m05_11";
import { OrderEditPage, OrderItemsEdit, 明細行 } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-f";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

caseTest("IT-M05-11-002", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let r: Record<string, string | null> = {};
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("002"))); });
  await step(2, async () => { await p.注文者姓を入れる("更新姓"); await p.note.fill("編集権限確認"); });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { r = 受注(notes.get(key("002"))); });
  await expected(async () => {
    expect.soft(r.注文者姓, "注文者のお名前（姓）").toBe("更新姓");
    expect.soft(r.ショップ用メモ, "ショップ用メモ欄").toBe("編集権限確認");
  });
});

caseTest("IT-M05-11-043", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let rows: ReturnType<typeof 受注明細> = [];
  const b = rc("BASE-B-043");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("043"))); });
  await step(2, async () => { await new OrderItemsEdit(page).削除を押す(b); });
  await step(3, async () => { await new OrderItemsEdit(page).削除を確定する(b); });
  await step(4, async () => { await p.受注情報を登録する(onDialog); });
  await step(5, async () => { rows = 受注明細(notes.get(key("043"))); });
  await expected(async () => {
    expect.soft(rows.some((r) => r.商品コード === b), `商品 ${b} の受注明細が残っている`).toBe(false);
    expect.soft(rows.some((r) => r.商品コード === rc("BASE-A-043")), "もう一方の商品の受注明細は残る").toBe(true);
  });
});

caseTest("IT-M05-11-044", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let rows: ReturnType<typeof 受注明細> = [];
  const b = rc("BASE-B-044");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("044"))); });
  await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(b, { 数量: "0" }); });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { rows = 受注明細(notes.get(key("044"))); });
  await expected(async () => {
    const row = rows.find((r) => r.商品コード === b);
    expect.soft(row?.数量, `商品 ${b} の受注明細の数量（数量0で残る）`).toBe("0");
  });
});

caseTest("IT-M05-11-049", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let rows: 配送商品行[] = [];
  let 配送先 = -1;
  let 画面の価格 = NaN;
  const a = rc("BASE-A-049");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("049"))); });
  await step(2, async () => {
    await new OrderItemsEdit(page).明細に入れる(a, { 数量: "1" });
    // 更新後の明細の価格（登録する直前の画面の値）。配送商品の価格の期待値にする
    画面の価格 = Number((await 明細行(page, a).locator('input[name$="[price]"]').inputValue()).replace(/,/g, ""));
  });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { rows = 配送商品(notes.get(key("049"))); 配送先 = 配送先の数(notes.get(key("049"))); });
  await expected(async () => {
    // 作り直す配送商品には、商品・商品規格・商品名（商品の名称）・商品コード・規格分類名・規格名・価格・数量を写す（設計書 L0593）
    const m = 商品規格のマスタ(a);
    const mine = rows.filter((r) => r.商品コード === a);
    expect.soft(mine.length, `配送先（${配送先}件）それぞれに商品 ${a} の配送商品が1件ずつ`).toBe(配送先);
    const row = mine[0];
    expect.soft(row?.商品ID, "配送商品の商品（更新後の明細の商品）").toBe(m.商品ID);
    expect.soft(row?.商品規格ID, "配送商品の商品規格（更新後の明細の商品規格）").toBe(m.商品規格ID);
    expect.soft(row?.商品名, "配送商品の商品名（商品の名称）").toBe(m.商品名);
    expect.soft(row?.商品コード, "配送商品の商品コード").toBe(a);
    expect.soft([row?.規格名1, row?.規格分類名1, row?.規格名2, row?.規格分類名2], "配送商品の規格名・規格分類名（商品規格の値）").toEqual([m.規格名1, m.規格分類名1, m.規格名2, m.規格分類名2]);
    expect.soft(row?.価格, `配送商品の価格（更新後の明細の価格 ${画面の価格}）`).toBe(画面の価格);
    expect.soft(row?.数量, "配送商品の数量（更新後の1）").toBe(1);
  });
});

caseTest("IT-M05-11-082", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let rows: ReturnType<typeof 受注明細> = [];
  const c = rc("ADD-001-082");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("082"))); });
  await step(2, async () => { /* 「商品の追加」を押す（次の手順で検索まで行う） */ await page.locator('a[data-bs-target="#addProduct"]').first().click({ timeout: 20_000 }); });
  await step(3, async () => { await page.locator("#addProduct input[type=text]").first().fill(rc("追加確認商品")); await page.locator("#searchProductModalButton").click({ timeout: 20_000 }); });
  await step(4, async () => {
    const list = page.locator("#searchProductModalList");
    const row = list.locator("tr").filter({ has: page.locator(`option[data-product-code="${c}"]`) });
    await expect(row, `検索結果に商品コード「${c}」を持つ商品`).toHaveCount(1, { timeout: 60_000 });
    await row.locator("select").first().selectOption((await row.locator(`option[data-product-code="${c}"]`).first().getAttribute("value"))!);
    await row.locator("button.add-order-item").click({ timeout: 20_000 });
  });
  await step(5, async () => { await p.受注情報を登録する(onDialog); });
  await step(6, async () => { rows = 受注明細(notes.get(key("082"))); });
  await expected(async () => { expect.soft(rows.some((r) => r.商品コード === c), `商品規格 ${c} の受注明細が追加された`).toBe(true); });
});

caseTest("IT-M05-11-073", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let rows: ReturnType<typeof 受注明細> = [];
  let r: Record<string, string | null> = {};
  const a = rc("BASE-A-073");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("073"))); });
  await step(2, async () => { await page.locator(`#table-form-field tr.item_box:has(span.product-code:text-is("${a}")) button.btn-stockout`).click({ timeout: 20_000 }); });
  await step(3, async () => {
    const items = new OrderItemsEdit(page);
    await items.明細に入れる(a, { 数量: "2", 価格: "1000" });
    await page.locator(`#table-form-field tr.item_box:has(span.product-code:text-is("${a}")) input[name$="[stockout]"]`).fill("1", { timeout: 20_000 });
    await items.金額欄({ 値引き: "100", 送料: "500", 手数料: "200" });
    await p.ポイント設定("5", "100");
    await page.locator("#order_gainedPoints").fill("50", { timeout: 20_000 });
  });
  await step(4, async () => { await p.受注情報を登録する(onDialog); });
  let 金額: Record<string, number> = {};
  await step(5, async () => { rows = 受注明細(notes.get(key("073"))); r = 受注(notes.get(key("073"))); 金額 = 受注の金額とポイント(notes.get(key("073"))); });
  await expected(async () => {
    const row = rows.find((x) => x.商品コード === a);
    expect.soft([Number(row?.数量), Number(row?.欠品数量), Number(row?.価格)], "受注明細の数量・欠品数量・価格（2・1・1000）").toEqual([2, 1, 1000]);
    expect.soft(r.受注ID !== undefined, "受注が保存された").toBe(true);
    // 入力した整数値が、それぞれの項目に保存されたこと
    expect.soft(金額.値引き, "値引き（100）").toBe(100);
    expect.soft(金額.送料, "送料（500）").toBe(500);
    expect.soft(金額.手数料, "手数料（200）").toBe(200);
    expect.soft(金額.還元率, "ポイント還元率（5）").toBe(5);
    // 正本は入力値（50）の保存を求める。設計書 L0596〜L0597 は発生ポイントを計算し直すと定めており、食い違いは正本の問題として報告する（期待は正本のまま）
    expect.soft(金額.発生, "ポイント発生（50）").toBe(50);
    expect.soft(金額.使用, "ポイント使用（100）").toBe(100);
  });
});

caseTest("IT-M05-11-051", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let rows: ReturnType<typeof 受注明細> = [];
  let 合計 = NaN;
  const c = rc("LIMIT-001-051");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("051"))); });
  await step(2, async () => { const items = new OrderItemsEdit(page); await items.明細に入れる(c, { 価格: "9999999999", 数量: "1" }); await items.金額欄({ 値引き: "0", 送料: "0", 手数料: "0" }); });
  await step(3, async () => { await p.受注情報を登録する(onDialog); });
  await step(4, async () => { rows = 受注明細(notes.get(key("051"))); 合計 = 受注の合計金額(notes.get(key("051"))).合計; });
  await expected(async () => {
    expect.soft(合計, "受注の合計金額（9999999999）").toBe(9999999999);
    expect.soft(Number(rows.find((x) => x.商品コード === c)?.価格), "受注明細の価格（9999999999）").toBe(9999999999);
  });
});

caseTest("IT-M05-11-022", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let 在庫 = { 在庫: -1, 総原価: -1 };
  let 履歴: ReturnType<typeof 在庫変動履歴> = [];
  const c = rc("CANCEL-ITEM-022");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("022"))); });
  await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { 在庫 = 商品の在庫(c); 履歴 = 在庫変動履歴(c); });
  await expected(async () => {
    expect.soft(在庫.在庫, "キャンセル後の商品在庫（8から10へ戻る）").toBe(10);
    expect.soft(履歴.some((h) => h.増減数 === 2 && h.理由.includes(notes.get(key("022")))), "注文番号を含む理由の在庫変動履歴（増減数+2）が登録される").toBe(true);
  });
});

/** 在庫・原価（COST）: 035 はキャンセル、039 は数量を変えて戻す */
caseTest("IT-M05-11-035", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let 在庫 = { 在庫: -1, 総原価: -1 };
  let rows: ReturnType<typeof 受注明細> = [];
  const c = rc("COST-001-035");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("035"))); });
  await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { 在庫 = 商品の在庫(c); rows = 受注明細(notes.get(key("035"))); });
  await expected(async () => {
    const row = rows.find((x) => x.商品コード === c);
    expect.soft(在庫.在庫, "商品在庫（12）").toBe(12);
    expect.soft(在庫.総原価, "商品総原価（5100）").toBe(5100);
    expect.soft(row?.数量, "受注数量（0）").toBe("0");
    expect.soft(Number(row?.総原価 ?? "-1"), "受注総原価（0）").toBe(0);
  });
});

caseTest("IT-M05-11-039", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let 在庫 = { 在庫: -1, 総原価: -1 };
  let rows: ReturnType<typeof 受注明細> = [];
  const c = rc("COST-001-039");
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("039"))); });
  await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(c, { 数量: "4" }); await p.受注情報を登録する(onDialog); });
  await step(3, async () => { await new OrderItemsEdit(page).明細に入れる(c, { 数量: "3" }); await p.受注情報を登録する(onDialog); });
  await step(4, async () => { 在庫 = 商品の在庫(c); rows = 受注明細(notes.get(key("039"))); });
  await expected(async () => {
    const row = rows.find((x) => x.商品コード === c);
    expect.soft(在庫.在庫, "商品在庫（9）").toBe(9);
    expect.soft(row?.数量, "受注数量（3）").toBe("3");
    expect.soft(Number(row?.総原価 ?? "-1"), "受注総原価（1425）").toBe(1425);
  });
});
