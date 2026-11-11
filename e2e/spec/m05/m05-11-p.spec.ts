/** M05-11 受注情報編集（共有の基本受注・キャンセル済み受注・未設定値・商品の追加の検索）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 会員ポイント, 受注の全項目, 商品の在庫 } from "../../db/m05_11";
import { 受注のポイント履歴, 受注の日付, 週間販売数 } from "../../db/m05_11_write";
import { OrderEditPage, OrderItemsEdit, ブロック } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-n-k";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";
import "../../seeds/m05-11-o"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const onDialog = (m: string) => test.info().annotations.push({ type: "手順の注記", description: `ダイアログを受け入れた: ${m}` });
const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}
const 編集画面 = (page: Page) => new URL(page.url()).pathname;
const 履歴リンクの注記 = () => note("受注データ更新履歴のリンクの文言は「画面操作変更」。これを正本の「変更」として押した（別タブで履歴画面が開く）");
const 見える = (page: Page, sel: string) => page.locator(sel).first().waitFor({ state: "visible", timeout: 5_000 }).then(() => true, () => false);
const 隠れる = (page: Page, sel: string) => page.locator(sel).first().waitFor({ state: "hidden", timeout: 5_000 }).then(() => true, () => false);

// ---- キャンセル済みの受注 ----
caseTest("IT-M05-11-097", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("共有CANCELLED"));
  let p!: OrderEditPage;
  let 日: string | null = "";
  await step(1, async () => { p = await 開く(browser, page, no); });
  await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { 日 = 受注の日付(no, "キャンセル日"); });
  await expected(async () => { expect.soft(日, "キャンセル日（2026-08-01のまま。上書きされない）").toBe("2026-08-01"); });
});
caseTest("IT-M05-11-098", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("共有CANCELLED")), code = rc("M0511-CANCELLED-ITM");
  let p!: OrderEditPage;
  const 読む = () => ({ 在庫: 商品の在庫(code).在庫, 週: 週間販売数(code), 点: 会員ポイント(no), 履歴: 受注のポイント履歴(no) });
  let 前 = 読む(), 後 = 前;
  await step(1, async () => { p = await 開く(browser, page, no); 前 = 読む(); });
  await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { 後 = 読む(); });
  await expected(async () => {
    expect.soft(後.在庫, `商品の在庫（操作前の${前.在庫}のまま）`).toBe(前.在庫);
    expect.soft(後.週, "週間販売数の各比較欄（操作前のまま）").toEqual(前.週);
    expect.soft(後.点, `会員ポイント（操作前の${前.点}のまま）`).toBe(前.点);
    expect.soft(後.履歴, "ポイント履歴（操作前のまま）").toEqual(前.履歴);
  });
});

// ---- 商品の追加の検索 ----
async function 検索結果(page: Page, 語: string, 行: (tr: import("@playwright/test").Locator) => import("@playwright/test").Locator, 探す: string[]): Promise<boolean[]> {
  await page.locator("#addProduct input[type=text]").first().fill(語, { timeout: 20_000 });
  await page.locator("#searchProductModalButton").click({ timeout: 20_000 });
  const out: boolean[] = [];
  for (const k of 探す) out.push(await 行(page.locator("#searchProductModalList tr")).filter({ hasText: k }).first().waitFor({ timeout: 60_000 }).then(() => true, () => false));
  return out;
}
caseTest("IT-M05-11-084", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let r: boolean[] = [];
  await step(1, async () => { await 開く(browser, page, notes.get(key("共有BASE"))); });
  await step(2, async () => { await page.locator('a[data-bs-target="#addProduct"]').first().click({ timeout: 20_000 }); });
  await step(3, async () => { await expect(page.locator("#addProduct input[type=text]").first(), "商品名・ID・コードの入力欄").toBeVisible(); });
  await step(4, async () => { r = await 検索結果(page, "検索商品", (t) => t, [rc("日本語検索商品A"), rc("日本語検索商品B")]); });
  await expected(async () => {
    expect.soft(r[0], "検索結果に「日本語検索商品A」").toBe(true);
    expect.soft(r[1], "検索結果に「日本語検索商品B」").toBe(true);
  });
});
caseTest("IT-M05-11-085", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let r: boolean[] = [];
  await step(1, async () => { await 開く(browser, page, notes.get(key("共有BASE"))); });
  await step(2, async () => { await page.locator('a[data-bs-target="#addProduct"]').first().click({ timeout: 20_000 }); });
  await step(3, async () => { await expect(page.locator("#addProduct input[type=text]").first(), "商品名・ID・コードの入力欄").toBeVisible(); });
  await step(4, async () => {
    // 商品コードは規格の選択肢（option）の属性に出る
    await page.locator("#addProduct input[type=text]").first().fill("SRCH-A", { timeout: 20_000 });
    await page.locator("#searchProductModalButton").click({ timeout: 20_000 });
    for (const c of [rc("SRCH-A-001"), rc("SRCH-A-002")]) r.push(await page.locator("#searchProductModalList tr").filter({ has: page.locator(`option[data-product-code="${c}"]`) }).first().waitFor({ timeout: 60_000 }).then(() => true, () => false));
  });
  await expected(async () => {
    expect.soft(r[0], "検索結果に商品コードSRCH-A-001").toBe(true);
    expect.soft(r[1], "検索結果に商品コードSRCH-A-002").toBe(true);
  });
});
