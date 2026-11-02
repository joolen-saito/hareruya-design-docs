/** M05-11 受注情報編集（欠品・担当者・一部キャンセル・在庫・ポイント・商品の追加）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 受注, 受注明細, 在庫変動履歴, 会員ポイント } from "../../db/m05_11";
import { searchStockByCode, stockInRow } from "../../pages/admin/m04_02_rc_stock";
import { OrderEditPage, OrderItemsEdit, 明細行 } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-g";
import { ADMIN_A_NAME, M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}
const 編集画面 = (page: Page) => new URL(page.url()).pathname;

// ---- 欠品・担当者・言語アイコン ----
caseTest("IT-M05-11-108", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("M0511-108-ITM");
  await step(1, async () => { await 開く(browser, page, notes.get(key("108"))); });
  await step(2, async () => { await expect(明細行(page, code), `明細に商品 ${code}`).toHaveCount(1); });
  await expected(async () => { await expect.soft(明細行(page, code).locator('input[name$="[stockout]"]'), "欠品数量の入力欄").toBeHidden(); });
});
caseTest("IT-M05-11-109", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("M0511-109-ITM");
  await step(1, async () => { await 開く(browser, page, notes.get(key("109"))); });
  await step(2, async () => { await 明細行(page, code).locator("button.btn-stockout").click({ timeout: 20_000 }); });
  await expected(async () => { await expect.soft(明細行(page, code).locator('input[name$="[stockout]"]'), "欠品数量の入力欄").toBeVisible(); });
});
caseTest("IT-M05-11-155", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("M0511-155-ITM");
  await step(1, async () => { await 開く(browser, page, notes.get(key("155"))); });
  await step(2, async () => { await 明細行(page, code).locator("button.btn-stockout").click({ timeout: 20_000 }); });
  await step(3, async () => { await expect(明細行(page, code).locator('input[name$="[stockout]"]')).toBeVisible(); });
  await expected(async () => { await expect.soft(明細行(page, code).locator('input[name$="[stockout]"]'), "欠品数量の入力欄の値").toHaveValue("0"); });
});
caseTest("IT-M05-11-110", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("M0511-110-ITM");
  await step(1, async () => { await 開く(browser, page, notes.get(key("110"))); });
  await step(2, async () => { await 明細行(page, code).locator("button.btn-stockout").click({ timeout: 20_000 }); });
  let 選択中 = "";
  await step(3, async () => { 選択中 = ((await 明細行(page, code).locator('select[name$="[operator]"] option:checked').first().textContent()) ?? "").trim(); });
  await expected(async () => { expect.soft(選択中, "欠品担当者の選択中のメンバー").toBe(ADMIN_A_NAME); });
});
caseTest("IT-M05-11-148", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("M0511-148-ITM");
  let 前 = "", 後 = "", 変えられた = "";
  await step(1, async () => { await 開く(browser, page, notes.get(key("148"))); });
  await step(2, async () => { await 明細行(page, code).locator("button.btn-stockout").click({ timeout: 20_000 }); });
  await step(3, async () => {
    const sel = 明細行(page, code).locator('select[name$="[operator]"]').first();
    前 = ((await sel.locator("option:checked").first().textContent()) ?? "").trim();
    const others = (await sel.locator("option").allTextContents()).map((t) => t.trim()).filter((t) => t && t !== 前);
    const enabled = await sel.isEnabled();
    if (enabled && others.length > 0) { await sel.selectOption({ label: others[0] }); 変えられた = others[0]; }
    後 = ((await sel.locator("option:checked").first().textContent()) ?? "").trim();
  });
  await expected(async () => { expect.soft(後, `担当者のセレクトボックス（変更しようとして選べた別のメンバー: ${変えられた || "なし"}）`).toBe(前); });
});
caseTest("IT-M05-11-149", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("M0511-149-ITM");
  await step(1, async () => { await 開く(browser, page, notes.get(key("149"))); });
  await step(2, async () => { await expect(明細行(page, code)).toHaveCount(1); });
  await expected(async () => { await expect.soft(明細行(page, code).locator(".lang-badge"), "言語のアイコン（ラベル）").toBeVisible(); });
});

// ---- 明細の削除・一部キャンセル ----
caseTest("IT-M05-11-194", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("M0511-194-ITM");
  let p!: OrderEditPage;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("194"))); });
  await step(2, async () => { await new OrderItemsEdit(page).削除を押す(code); });
  await step(3, async () => { await new OrderItemsEdit(page).削除を確定する(code); });
  await step(4, async () => { await p.登録を押す(onDialog); });
  await step(5, async () => { await page.waitForLoadState("load"); });
  await expected(async () => { expect.soft(編集画面(page), "表示中の画面（受注情報編集画面に留まる）").toMatch(/\/order\/\d+\/edit$/); });
});
caseTest("IT-M05-11-195", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("M0511-195-ITM");
  let p!: OrderEditPage;
  let rows: ReturnType<typeof 受注明細> = [];
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("195"))); });
  await step(2, async () => { await new OrderItemsEdit(page).削除を押す(code); });
  await step(3, async () => { await new OrderItemsEdit(page).削除を確定する(code); });
  await step(4, async () => { await p.登録を押す(onDialog); });
  await step(5, async () => { rows = 受注明細(notes.get(key("195"))); });
  await expected(async () => { expect.soft(rows.find((r) => r.商品コード === code)?.数量, "受注の商品の数量（更新前の2のまま）").toBe("2"); });
});
caseTest("IT-M05-11-133", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const code = rc("M0511-133-ITM");
  let p!: OrderEditPage;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("133"))); });
  await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(code, { 数量: "1" }); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { await page.waitForLoadState("load"); /* 一部キャンセルの確認ダイアログは、登録を押したときに受け入れた（注記に残る） */ });
  await expected(async () => { expect.soft(編集画面(page), "遷移先（受注情報編集画面）").toMatch(/\/order\/\d+\/edit$/); });
});

// ---- 在庫（在庫検索一覧で確かめる） ----
async function 在庫数(page: Page, browser: Browser, code: string): Promise<number> {
  const shop = await 店舗Aの店名(browser);
  const list = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
  return stockInRow(list.row(code, shop, "EC-CUBE"));
}
caseTest("IT-M05-11-201", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  const a = rc("DPM0511-201-A"), b = rc("DPM0511-201-B");
  let na = -1, nb = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("201"))); });
  await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { na = await 在庫数(page, browser, a); nb = await 在庫数(page, browser, b); });
  await expected(async () => { expect.soft(na, "商品Aの在庫（8から10）").toBe(10); expect.soft(nb, "商品Bの在庫（9から10）").toBe(10); });
});
caseTest("IT-M05-11-202", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  const a = rc("DPM0511-202-A"), b = rc("DPM0511-202-B");
  let ha: ReturnType<typeof 在庫変動履歴> = [], hb: ReturnType<typeof 在庫変動履歴> = [];
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("202"))); });
  await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { ha = 在庫変動履歴(a); hb = 在庫変動履歴(b); });
  await expected(async () => {
    const no = notes.get(key("202"));
    const fa = ha.filter((h) => h.増減数 === 2 && h.理由.includes(no)), fb = hb.filter((h) => h.増減数 === 1 && h.理由.includes(no));
    expect.soft(fa.length, "商品Aの在庫変動履歴（+2・注文番号入りの理由）の件数").toBe(1);
    expect.soft(fb.length, "商品Bの在庫変動履歴（+1・注文番号入りの理由）の件数").toBe(1);
  });
});
caseTest("IT-M05-11-203", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  const a = rc("DPM0511-203-A"), b = rc("DPM0511-203-B");
  let na = -1, nb = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("203"))); });
  await step(2, async () => { const i = new OrderItemsEdit(page); await i.明細に入れる(a, { 数量: "2" }); await i.明細に入れる(b, { 数量: "2" }); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { await page.waitForLoadState("load"); /* 一部キャンセルの確認ダイアログは、登録を押したときに受け入れた */ });
  await step(5, async () => { na = await 在庫数(page, browser, a); nb = await 在庫数(page, browser, b); });
  await expected(async () => { expect.soft(na, "商品Aの在庫（7から8）").toBe(8); expect.soft(nb, "商品Bの在庫（9から8）").toBe(8); });
});
caseTest("IT-M05-11-204", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  const a = rc("DPM0511-204-A"), b = rc("DPM0511-204-B");
  let na = -1, nb = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("204"))); });
  await step(2, async () => { await page.locator('a[data-bs-target="#addProduct"]').first().click({ timeout: 20_000 }); });
  await step(3, async () => { await page.locator("#addProduct input[type=text]").first().fill(rc("追加混在商品204")); await page.locator("#searchProductModalButton").click({ timeout: 20_000 }); });
  await step(4, async () => {
    const row = page.locator("#searchProductModalList tr").filter({ has: page.locator(`option[data-product-code="${b}"]`) });
    await expect(row, `検索結果に商品コード「${b}」`).toHaveCount(1, { timeout: 60_000 });
    await row.locator("select").first().selectOption((await row.locator(`option[data-product-code="${b}"]`).first().getAttribute("value"))!);
    await row.locator("button.add-order-item").click({ timeout: 20_000 });
  });
  await step(5, async () => { await new OrderItemsEdit(page).明細に入れる(b, { 数量: "2" }); });
  await step(6, async () => { await p.登録を押す(onDialog); });
  await step(7, async () => { na = await 在庫数(page, browser, a); nb = await 在庫数(page, browser, b); });
  await expected(async () => { expect.soft(nb, "追加した商品Bの在庫（10から8）").toBe(8); expect.soft(na, "商品Aの在庫（9のまま）").toBe(9); });
});
caseTest("IT-M05-11-214", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const b = rc("DPM0511-214-B");
  const messages: string[] = [];
  page.on("dialog", (d) => { messages.push(d.message()); void d.accept(); });
  await step(1, async () => { await 開く(browser, page, notes.get(key("214"))); });
  await step(2, async () => { await page.locator('a[data-bs-target="#addProduct"]').first().click({ timeout: 20_000 }); });
  await step(3, async () => { await page.locator("#addProduct input[type=text]").first().fill(rc("追加在庫あり商品214")); await page.locator("#searchProductModalButton").click({ timeout: 20_000 }); });
  await step(4, async () => {
    const row = page.locator("#searchProductModalList tr").filter({ has: page.locator(`option[data-product-code="${b}"]`) });
    await expect(row, `検索結果に商品コード「${b}」`).toHaveCount(1, { timeout: 60_000 });
    await row.locator("select").first().selectOption((await row.locator(`option[data-product-code="${b}"]`).first().getAttribute("value"))!);
    await row.locator("button.add-order-item").click({ timeout: 20_000 });
    await expect(明細行(page, b), "追加した明細").toHaveCount(1, { timeout: 60_000 });
  });
  await expected(async () => {
    const warn = (await page.locator(".alert-warning, .alert-danger").allInnerTexts()).filter((t) => /在庫/.test(t));
    expect.soft([...messages.filter((m) => /在庫/.test(m)), ...warn], "在庫がないことを示す警告").toEqual([]);
  });
});
caseTest("IT-M05-11-215", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  const a = rc("DPM0511-215-A"), b = rc("DPM0511-215-B");
  let rows: ReturnType<typeof 受注明細> = [];
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("215"))); });
  await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(a, { 数量: "1" }); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { await page.waitForLoadState("load"); /* 一部キャンセルの確認ダイアログは、登録を押したときに受け入れた */ });
  await step(5, async () => { rows = 受注明細(notes.get(key("215"))); });
  await expected(async () => {
    expect.soft(rows.map((r) => `${r.商品コード}×${r.数量}`), "配送商品（商品コードと数量）").toEqual([`${a}×1`, `${b}×1`].sort());
  });
});
caseTest("IT-M05-11-206", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  const a = rc("DPM0511-206-A");
  let rows: ReturnType<typeof 受注明細> = [];
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("206"))); });
  await step(2, async () => { await 明細行(page, a).locator("button.btn-stockout").click({ timeout: 20_000 }); });
  await step(3, async () => { await 明細行(page, a).locator('input[name$="[stockout]"]').fill("2", { timeout: 20_000 }); });
  await step(4, async () => { await p.登録を押す(onDialog); });
  await step(5, async () => { rows = 受注明細(notes.get(key("206"))); });
  await expected(async () => {
    const r = rows.find((x) => x.商品コード === a);
    expect.soft(r?.数量, "受注数量").toBe("1");
    expect.soft(r?.欠品数量, "欠品数量").toBe("2");
    expect.soft(Number(r?.総原価 ?? "-1"), "受注総原価").toBe(500);
  });
});

// ---- 合計金額の上限と在庫 ----
caseTest("IT-M05-11-239", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  const x = rc("CBM0511-239-X");
  let r: Record<string, string | null> = {};
  let rows: ReturnType<typeof 受注明細> = [];
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("239"))); });
  await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(x, { 数量: "2" }); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { r = 受注(notes.get(key("239"))); rows = 受注明細(notes.get(key("239"))); });
  await expected(async () => {
    const row = rows.find((y) => y.商品コード === x);
    expect.soft([Number(row?.価格), Number(row?.数量)], "配送商品の価格・数量（1000・2）").toEqual([1000, 2]);
    expect.soft(r.受注ID !== undefined, "受注が保存された").toBe(true);
  });
});
caseTest("IT-M05-11-240", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  const x = rc("CBM0511-240-X");
  let rows: ReturnType<typeof 受注明細> = [];
  let na = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("240"))); });
  await step(2, async () => { await new OrderItemsEdit(page).明細に入れる(x, { 数量: "5" }); });
  await step(3, async () => { await p.登録を押す(onDialog).catch(() => undefined); });
  await step(4, async () => { rows = 受注明細(notes.get(key("240"))); na = await 在庫数(page, browser, x); });
  await expected(async () => {
    expect.soft(rows.find((y) => y.商品コード === x)?.数量, "受注数量（1のまま）").toBe("1");
    expect.soft(na, "商品の在庫（1のまま）").toBe(1);
  });
});

// ---- ポイント ----
caseTest("IT-M05-11-218", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let 画面 = "", db = "";
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("218"))); });
  await step(2, async () => { await p.ポイント設定(await p.還元率の値(), "100"); });
  await step(3, async () => { await p.登録を押す(onDialog); });
  await step(4, async () => { await p.お支払情報を開く(); 画面 = await p.ポイント発生の値(); });
  await step(5, async () => { db = String(受注(notes.get(key("218"))).発生ポイント ?? ""); });
  await expected(async () => {
    expect.soft(画面, "画面のポイント発生（99から94）").toBe("94");
    expect.soft(db, "DBの発生ポイント（99から94）").toBe("94");
  });
});
caseTest("IT-M05-11-219", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let pt = -1;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("219"))); });
  await step(2, async () => { await p.ステータスを選ぶ("出荷完了"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { pt = 会員ポイント(notes.get(key("219"))); });
  await expected(async () => { expect.soft(pt, "会員の保持ポイント（1000から1099）").toBe(1099); });
});
caseTest("IT-M05-11-220", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage;
  let v = { 還元率: "", 発生: "", 使用: "" };
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("220"))); });
  await step(2, async () => { await p.お支払情報を開く(); v = { 還元率: await p.還元率の値(), 発生: await p.ポイント発生の値(), 使用: await p.ポイント使用の値() }; });
  await expected(async () => {
    expect.soft(v.還元率, "ポイント還元率").toBe("5");
    expect.soft(v.発生, "ポイント発生").toBe("50");
    expect.soft(v.使用, "ポイント使用").toBe("100");
  });
});

// ---- 商品の追加のプルダウン ----
function プルダウン(n: string, 高額: boolean): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await loginAdmin(page, M0511_ADMIN_A);
    const code = rc(`M0511-${n}-ITM`);
    let options: string[] = [];
    await step(1, async () => { await 開く(browser, page, notes.get(key(n))); });
    await step(2, async () => { await page.locator('a[data-bs-target="#addProduct"]').first().click({ timeout: 20_000 }); });
    await step(3, async () => { await page.locator("#addProduct input[type=text]").first().fill(code); await page.locator("#searchProductModalButton").click({ timeout: 20_000 }); });
    await step(4, async () => {
      const row = page.locator("#searchProductModalList tr").filter({ has: page.locator(`option[data-product-code="${code}"]`) });
      await expect(row, `検索結果に商品コード「${code}」`).toHaveCount(1, { timeout: 60_000 });
      options = (await row.locator("select").first().locator("option").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    });
    await expected(async () => {
      const opt = options.find((o) => o.includes(code)) ?? "";
      const idx = [code, "日", "NM", "1000"].map((s) => opt.indexOf(s));
      expect.soft(idx.every((i) => i >= 0) && idx.every((v, i) => i === 0 || v > idx[i - 1]), `プルダウンの選択肢（商品コード・日・NM・基準価格1000がこの順）: 「${opt}」`).toBe(true);
      if (高額) expect.soft(opt.indexOf(rc(`M0511-${n}-HIGH`)) > opt.indexOf("1000"), "高額商品コードが基準価格のあとに表示される").toBe(true);
      else expect.soft(opt.includes("HIGH"), "高額商品コードが表示される").toBe(false);
    });
  };
}
caseTest("IT-M05-11-125", プルダウン("125", false));
caseTest("IT-M05-11-126", プルダウン("126", true));
