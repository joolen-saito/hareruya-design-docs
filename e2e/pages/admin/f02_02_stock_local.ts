/**
 * F02-02 のシードが使う、在庫の増減と承認（在庫検索一覧の店舗の選択欄を閉じてから在庫区分を押す版）。
 * pages/admin/f02_01_setup.ts の「在庫を増減して承認する」と同じ流れ・同じ登録者と承認者（決まった印で1度だけ作って使い回す）。
 * 共通の在庫検索（pages/admin/m04_02_rc_stock.ts）は、店舗の選択欄の候補一覧が開いたまま残ると在庫区分のチェック欄を押せず時間切れになるので、
 * 共通の部品は変えず、ここに候補一覧を閉じる処理を足した検索を書いた。
 */
import { Browser, expect, Locator, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { FIXED_MARK } from "../../lib/run_marker";
import { BASE_URL } from "../../config/env";
import { Account, adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 本店の店名 } from "./f04_setup";
import { ensureMember } from "./member";
import { stockInRow } from "./m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage, approveAndSettle } from "./stock_edit";

type Issue = (m: string) => void;

/** PC幅の管理画面でログインして処理する。この機能の試験はスマホ幅が既定で、在庫の画面は狭い幅だと部品が重なって押せないので、画面幅を決めて開く（seeds/f02-02.ts と同じ作り） */
async function PCの管理画面で<T>(browser: Browser, account: Account, fn: (page: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext({
    baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    await loginAdmin(page, account);
    return await fn(page);
  } finally { await context.close(); }
}

const PASS = "Passw0rd!F0201stock";
const 登録者 = { 名前: `F0201在庫登録者-${FIXED_MARK}`, account: { loginId: `f0201reg${FIXED_MARK}`.toLowerCase(), password: PASS } as Account };
const 承認者 = { 名前: `F0201在庫承認者-${FIXED_MARK}`, account: { loginId: `f0201apr${FIXED_MARK}`.toLowerCase(), password: PASS } as Account };
let 用意した = false;

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 店舗の選択欄（複数選択の select2）で、いまの選択を外して1店を選び、候補一覧が閉じるまで確かめる */
async function 店舗を選ぶ(page: Page, select: Locator, label: string): Promise<void> {
  const box = select.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
  await expect(box, "在庫検索一覧の店舗の選択欄").toBeVisible();
  for (let i = 0; i < 100 && await box.locator(".select2-selection__choice__remove").count() > 0; i++) {
    await box.locator(".select2-selection__choice__remove").first().click();
    await page.keyboard.press("Escape");
  }
  await box.locator(".select2-selection").click();
  const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: exact(label) });
  await expect(option, `在庫検索一覧の店舗の候補「${label}」は1件`).toHaveCount(1);
  await option.click();
  await page.keyboard.press("Escape");
  // 候補一覧が開いたまま残ることがある。閉じるまで待ち、残っていれば選択欄の部品の閉じる操作と、画面の空き地の押下で閉じる
  const open = page.locator(".select2-container--open");
  for (let i = 0; i < 10 && (await open.count()) > 0; i++) {
    await select.evaluate((n) => { const w = window as unknown as { jQuery?: (x: Element) => { select2: (c: string) => void } }; try { w.jQuery?.(n).select2("close"); } catch { /* 閉じられなければ次の手 */ } }).catch(() => undefined);
    if ((await open.count()) > 0) await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
  await expect(open, "店舗の候補一覧が閉じた").toHaveCount(0, { timeout: 10_000 });
  const chosen = await select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, "在庫検索一覧の店舗に選んだもの").toEqual([label]);
}

async function 在庫を検索する(page: Page, v: { 商品コード: string; 店舗: string; 在庫区分: string }): Promise<StockListPage> {
  const list = new StockListPage(page);
  const res = await page.goto(adminUrl("/product/stock"));
  expect(res?.status(), "在庫検索一覧の応答").toBe(200);
  await expect(list.form, "在庫検索一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
  await list.form.locator("#admin_search_stock_list_product_code").fill(v.商品コード);
  await 店舗を選ぶ(page, list.form.locator("#admin_search_stock_list_base_info"), v.店舗);
  const zone = list.form.locator('input[name="admin_search_stock_list[stock_zone][]"]').and(page.getByLabel(v.在庫区分, { exact: true }));
  await expect(zone, `在庫区分「${v.在庫区分}」のチェック欄は1つ`).toHaveCount(1);
  await zone.check();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    list.form.locator('button[type="submit"]').first().click(),
  ]);
  return list;
}

/** 在庫編集を開く。固定の見出しや検索欄が行のリンクに重なって押せないことがあるので、リンクの宛先を読んで直接開く */
async function 在庫編集を開く(page: Page, row: Locator): Promise<void> {
  await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
  const href = await row.locator("td.col-name a").getAttribute("href");
  if (!href) throw new Error("在庫検索一覧の行の商品名のリンクの宛先を読めない");
  await page.goto(href);
  await expect(page.locator("form#stock_approval_form"), "在庫編集の画面").toBeVisible();
  await page.waitForLoadState("load");
}

async function 在庫の管理者を用意する(browser: Browser): Promise<string> {
  const shop = await 本店の店名(browser);
  if (用意した) return shop;
  await PCの管理画面で(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const a of [登録者, 承認者]) {
      await ensureMember(page, {
        名前: a.名前, 所属店舗: shop, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`,
        パスワード: a.account.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
      });
    }
  });
  用意した = true;
  return shop;
}

export type 在庫の増減 = { 商品コード: string; 数: number; 区分: "入庫/その他" | "廃棄/廃棄(その他)"; 承認後の在庫: number };

export async function 在庫を増減して承認する(browser: Browser, seedId: string, items: 在庫の増減[], issue: Issue): Promise<void> {
  if (items.length === 0) return;
  const shop = await 在庫の管理者を用意する(browser);
  await PCの管理画面で(browser, 登録者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const it of items) {
      const stock = await 在庫を検索する(page, { 商品コード: it.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      await 在庫編集を開く(page, stock.row(it.商品コード, shop, "EC-CUBE"));
      await registerStockEdit(page, {
        changeType: it.区分, reason: "結合試験", quantity: String(it.数), purchasePrice: "0", approverName: 承認者.名前,
      }, `${seedId}: ${it.商品コード} の在庫編集（${it.区分}・${it.数}）`, issue);
    }
    const registrant = await loggedInMemberName(page);
    if (registrant !== 登録者.名前) issue(`在庫の登録者の表示名が「${registrant}」（「${登録者.名前}」のはず）`);
  });
  await PCの管理画面で(browser, 承認者.account, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === 登録者.名前);
    if (rows.length < items.length) throw new Error(`${seedId}: 在庫編集承認一覧に、登録者「${登録者.名前}」の未承認の行が ${rows.length} 件（${items.length} 件はあるはず）`);
    if (rows.length > items.length) issue(`在庫編集承認一覧に、同じ登録者の前の回の未承認の行が ${rows.length - items.length} 件あり、合わせて承認した（どれも E2E の印つきの商品）`);
    await approveAndSettle(list, rows.map((r) => r.id), `${seedId}: 在庫編集の一括承認（${rows.length}件）`, issue);
    for (const it of items) {
      const after = await 在庫を検索する(page, { 商品コード: it.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      const n = await stockInRow(after.row(it.商品コード, shop, "EC-CUBE"));
      expect(n, `${seedId}: ${it.商品コード} の承認後の在庫`).toBe(it.承認後の在庫);
    }
  });
}
