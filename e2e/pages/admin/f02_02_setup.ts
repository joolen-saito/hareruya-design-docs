/**
 * F02-02 スマホ版ナビゲーションのシードで使う画面操作（会員・グッズ商品・在庫・お気に入り・ゲストカート）。
 * 既存の部品（会員登録画面・会員一覧・会員登録/編集・グッズ商品CSV登録・在庫編集・在庫編集承認一覧・お気に入り・カートに入れる）を組み合わせる。
 *
 * 共有の開発環境で流せるように、DB の参照もメールの受け口も使わない。
 * - 会員: フロントの会員登録画面で登録し（仮会員になっても本登録のメールは読まない）、管理画面の会員登録/編集で会員ステータスを本会員にする（シード表の投入方法のとおり。
 *   作り方は共通の pages/admin/member_activate.ts）。
 * - 在庫の承認: 登録の前に在庫編集承認一覧に出ている行の番号を控え、登録のあとに増えた未承認の行だけを承認する。
 */
import { Browser, BrowserContext, Cookie, expect, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { hideDebugToolbar, withAdminSession } from "../../lib/session";
import { FrontFavorite } from "../front/f03_08_favorite";
import { カートに入れる } from "../front/f04_shopping";
import { ポイントを付与する } from "./m05_11_order_edit";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId } from "./m03_23_seed_products";
import { savePublishedClass } from "./f03_07_restock";
import { ensureStockAdmin, STOCK_ADMIN } from "./f03_08_masters";
import { searchStockByCode, stockInRow } from "./m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage } from "./stock_edit";

type Issue = (m: string) => void;

async function frontContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  return context;
}

// ---- 会員 ----

// 会員を登録して本会員にする作り方は、メールを読めない環境の共通の作り方として pages/admin/member_activate.ts へ移した
export { 会員を登録して本会員にする } from "./member_activate";
export type { 登録する会員 } from "./member_activate";

/** 会員登録編集画面の「ポイント管理・履歴一覧」から、キャンペーン・特別対応によるポイント付与で増減量を入れて保存する */
export async function ポイントを付ける(browser: Browser, 会員ID: string, 増減量: number): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ポイントを付与する(page, 会員ID, 増減量); });
}

/** 本店の画面上部に出る保有ポイントの数字（ログイン中だけ出る） */
async function 画面上部のポイント(page: Page): Promise<string> {
  await page.goto(`${BASE_URL}/ja/`, { timeout: 60_000 });
  await page.waitForLoadState("load");
  const v = page.locator(".p-hareruya-header__point-value").first();
  await expect(v, "画面上部の保有ポイント").toHaveCount(1, { timeout: 30_000 });
  return ((await v.textContent()) ?? "").replace(/\s+/g, "").trim();
}

/**
 * 本店のログイン画面でログインできることを確かめてログアウトする。
 * ポイントを付けた会員なら、ログイン中の画面上部の保有ポイントの数字も返す（シード表の「ポイント残高が500であることを確かめる」の代わり）。
 */
export async function ログインできることを確かめる(browser: Browser, メール: string, パスワード: string): Promise<string> {
  const context = await frontContext(browser);
  try {
    const f = new FrontFavorite(await context.newPage());
    await f.login(メール, パスワード);
    const point = await 画面上部のポイント(f.page);
    await f.logout();
    return point;
  } finally { await context.close(); }
}

/** 本店にログインし、商品詳細画面のお気に入りボタンを押して登録し、お気に入り商品一覧に出る商品名を返してログアウトする */
export async function お気に入りに追加する(browser: Browser, メール: string, パスワード: string, 商品ID: string[], issue: Issue): Promise<string[]> {
  const context = await frontContext(browser);
  try {
    const f = new FrontFavorite(await context.newPage());
    await f.login(メール, パスワード);
    for (const id of 商品ID) {
      await f.openDetail(id, "JP");
      const r = await f.押す();
      if (!r.通知が出た || r.ログインモーダルが開いた) throw new Error(`商品ID ${id} のお気に入りボタンを押しても、登録完了の通知が出ない（${JSON.stringify(r)}）`);
      await f.通知を閉じる();
    }
    if (商品ID.length) issue(`会員 ${メール} がお気に入りを ${商品ID.length} 件登録した（完了の表示は画面右下の通知）`);
    await f.openFavoriteList();
    const names = await f.一覧の商品名();
    await f.logout();
    return names;
  } finally { await context.close(); }
}

// ---- グッズ商品 ----

export type 作る商品 = { 商品コード: string; 商品名: string };

/**
 * グッズ商品CSV登録で商品を登録し（商品カテゴリはサプライ・グッズ）、商品マスターで商品コードを検索して商品IDを読む。
 * 取り込んだ商品規格が公開でなければ公開にして登録する。商品コードの順に商品IDを返す。
 */
export async function グッズ商品を登録する(browser: Browser, what: string, defs: 作る商品[], issue: Issue): Promise<string[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readGoodsRootCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${what} のグッズ商品CSV登録`, fileName: `${what.toLowerCase().replace(/[^0-9a-z-]/g, "")}-${Date.now()}.csv`, categoryId,
      lines: defs.map((d) => ({ code: d.商品コード, nameJp: d.商品名, nameEn: d.商品名 })),
      onWarning: (w) => issue(`${what}: グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 120_000,
    });
    const ids: string[] = [];
    for (const d of defs) {
      const productId = await openProductEditByCode(page, d.商品コード);
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1 || rows[0].商品コード !== d.商品コード) throw new Error(`${what}: ${d.商品コード} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      if (rows[0].公開状態 !== "公開") await savePublishedClass(page, { productId, classId: rows[0].商品規格ID }, `${what}: ${d.商品コード}`, issue);
      ids.push(productId);
    }
    return ids;
  });
}

/**
 * 本店の在庫を入れる。在庫を入れる管理者（登録者）が在庫編集で「入庫/その他」・在庫変動理由「試験データ」・在庫増減数・仕入単価0を入れ、
 * 承認通知先に全権限の管理者を選んで登録し、その管理者が在庫編集承認一覧で承認する。承認のあと在庫数を確かめる。
 */
export async function 本店の在庫を入れる(browser: Browser, what: string, 商品コード: string[], 数: number, issue: Issue): Promise<void> {
  const approverName = await withAdminSession(browser, SETUP_ADMIN, (page) => loggedInMemberName(page));
  const shop = await withAdminSession(browser, SETUP_ADMIN, (page) => new StockListPage(page).shopNameById("1"));
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStockAdmin(page));
  // 登録の前に一覧に出ている行（承認済み・未承認とも）を控え、登録のあとに増えた行だけを承認する
  const before = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    return new Set((await list.rowValues()).map((r) => r.id));
  });
  const registeredBy = await withAdminSession(browser, STOCK_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const registrant = await loggedInMemberName(page);
    if (registrant === approverName) throw new Error(`${what}: 在庫の登録者と承認者が同じ管理者になっている`);
    const stock = new StockListPage(page);
    for (const code of 商品コード) {
      await stock.searchByProductCode(code);
      await stock.openEdit(stock.row(code, shop, "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "試験データ", quantity: String(数), purchasePrice: "0", approverName }, `${what}: ${code} の在庫編集`, issue);
    }
    return registrant;
  });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => !before.has(r.id) && r.status === "未承認" && r.registrant === registeredBy
      && r.changeType.endsWith("入庫/その他") && r.quantity === String(数));
    if (rows.length !== 商品コード.length) throw new Error(`${what}: 在庫編集のあとに増えた未承認の行が ${rows.length} 件（${商品コード.length} 件のはず）`);
    await list.approve(rows.map((r) => r.id), `${what}: 在庫編集の承認（${rows.length}件）`, issue);
    for (const code of 商品コード) {
      const after = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
      const n = await stockInRow(after.row(code, shop, "EC-CUBE"));
      if (n !== 数) throw new Error(`${what}: ${code} の本店の在庫が ${n}（${数} のはず）`);
    }
  });
}

// ---- ゲストカート ----

/** カート画面に入っている商品の行（商品名と数量） */
async function カートの中身(page: Page): Promise<{ 商品名: string; 数量: string }[]> {
  await page.goto(`${BASE_URL}/ja/cart`, { timeout: 60_000 });
  await page.waitForLoadState("load");
  return page.locator(".p-hareruya-cart-item").evaluateAll((items) => items.map((it) => ({
    商品名: (it.textContent ?? "").replace(/\s+/g, " ").trim(),
    数量: (it.querySelector("[data-quantity-input]") as HTMLInputElement | null)?.value ?? "",
  })));
}

export type カートのブラウザ = { cookies: Cookie[]; 識別子: string; 中身: { 商品名: string; 数量: string }[] };

/**
 * ブラウザ保存状態の無いブラウザで、ログインせずに本店の商品詳細画面を開いて数量1で「カートに追加」を押す（商品IDの順）。
 * 削除する商品があれば、カート画面でその商品の削除を押す。カート画面の中身と、このブラウザの状態（クッキー）を返す。
 * ケースは、返したクッキーを自分のブラウザへ移して「カート状態が設定されたブラウザ」として使う。
 */
export async function ゲストカートを作る(browser: Browser, what: string, 商品ID: string[], 削除する商品名?: string): Promise<カートのブラウザ> {
  const context = await frontContext(browser);
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await page.goto(`${BASE_URL}/ja/`, { timeout: 60_000 });
    for (const id of 商品ID) await カートに入れる(page, "", id, 1, `${what}: 商品ID ${id}`);
    if (削除する商品名 !== undefined) {
      await page.goto(`${BASE_URL}/ja/cart`, { timeout: 60_000 });
      await page.waitForLoadState("load");
      const item = page.locator(".p-hareruya-cart-item").filter({ hasText: 削除する商品名 });
      await expect(item, `${what}: カート画面の ${削除する商品名} の行`).toHaveCount(1);
      page.once("dialog", (d) => { d.accept().catch(() => {}); });
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), item.locator("a.p-hareruya-cart-item__delete").click()]);
    }
    const 中身 = await カートの中身(page);
    const cookies = await context.cookies();
    const session = cookies.find((c) => c.httpOnly && /sess|eccube/i.test(c.name)) ?? cookies.find((c) => c.httpOnly) ?? cookies[0];
    if (!session) throw new Error(`${what}: カートに入れたブラウザにクッキーが無い`);
    return { cookies, 識別子: `${session.name}（このブラウザのセッションのクッキー。値の先頭 ${session.value.slice(0, 6)}…）`, 中身 };
  } finally { await context.close(); }
}
