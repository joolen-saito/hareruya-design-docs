/**
 * F04 カート（ご注文方法指定・配送先）のシードが使う、管理画面の操作。
 * - 商品を作って本店に入庫する（グッズ商品CSV登録 → 在庫変更CSV登録 → 別のメンバーが在庫編集承認一覧で承認）
 * - 会員のお届け先を管理画面で足す
 * - 処理中（購入処理中）の受注を、メールアドレスで探して開く
 * 画面の部品は M04-19・F01-02 のものを使う。
 */
import { Browser, expect, Page } from "@playwright/test";
import { BASE_URL, ENV_NAME, MAIL_URL, SETUP_ADMIN } from "../../config/env";
import { customerStateByEmail } from "./customer";
import { FrontMember, registerFrontMember } from "../front/member_entry";
import { 在庫承認の最大ID } from "../../db/f03_08";
import { 未承認の在庫編集ID, 未承認の行の絞り込みの値 } from "../../db/f04_setup";
import { Account, adminUrl, hideDebugToolbar, withAdminSession } from "../../lib/session";
import { rc, RUN_MARK } from "../../lib/run_marker";
import { chooseByLabel, expectSaved } from "./common";
import { ensureMember } from "./member";
import { downloadGoodsCsvTemplate, readExistingGoodsChildCategoryId } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { openProductEditByCode, readLanguageIds } from "./m03_23_seed_products";
import { storeNameById } from "./m04_19_masters";
import { registerStockChangeCsv } from "./m04_19_stock_change_csv";
import { searchStockByCode } from "./m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "./stock_edit";

const PASS = "Passw0rd!F04";
export type 管理者 = { 名前: string; account: Account };

/** F04 の在庫入庫で使う登録者と承認者（どちらも本店を編集できるシステム管理者。承認は登録した者と別のメンバーでないとできない） */
export const F04登録者: 管理者 = { 名前: `F04登録者-${RUN_MARK}`, account: { loginId: `f04reg${RUN_MARK}`.toLowerCase(), password: PASS } };
export const F04承認者: 管理者 = { 名前: `F04承認者-${RUN_MARK}`, account: { loginId: `f04apr${RUN_MARK}`.toLowerCase(), password: PASS } };

let mainShop: string | null = null;
/** 本店（店舗ID 1）の店名。画面から読む */
export async function 本店の店名(browser: Browser): Promise<string> {
  if (!mainShop) mainShop = await withAdminSession(browser, SETUP_ADMIN, (page) => storeNameById(page, "1"));
  return mainShop;
}

let adminsReady = false;
/** 登録者と承認者を、この実行で一度だけ用意する */
export async function 管理者を用意する(browser: Browser): Promise<void> {
  if (adminsReady) return;
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const a of [F04登録者, F04承認者]) {
      await ensureMember(page, {
        名前: a.名前, 所属店舗: shop, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`,
        パスワード: a.account.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
      });
    }
  });
  adminsReady = true;
}

export type 商品の定め = {
  商品コード: string; 商品名: string; 価格: string; 入庫数?: number; 言語?: "英語"; 入庫方法?: "在庫変更CSV" | "在庫編集";
  /** 入庫の仕入単価（省略すると在庫編集は0・在庫変更CSVは100） */
  仕入単価?: string;
  /** 入庫の在庫変動理由（省略すると在庫編集は「試験用」・在庫変更CSVは「シード作成」） */
  在庫変動理由?: string;
  /** グッズ商品CSVの列の値で、共通の値を上書きするもの（販売制限数・売上分析タグ(ID) など） */
  CSVの値?: Record<string, string>;
};
export type 作った商品 = { productId: string; 商品コード: string; 商品名: string };

let fileSeq = 0;
/** 在庫変更CSVのファイル名（同じ名前を1か月以内に登録すると登録されないので毎回変える） */
const stockCsvName = (seedId: string) => `${seedId.toLowerCase()}-${Date.now()}-${++fileSeq}.csv`;

/**
 * 商品を1〜数件、グッズ商品CSV登録で作り（購入グループ「通常商品」・地域別販売制限0）、本店・EC-CUBE に入庫して承認する。
 * 商品コード・商品名は渡された値のまま使う（印は呼ぶ側で付ける）。
 */
export async function 商品を作って入庫する(browser: Browser, seedId: string, defs: 商品の定め[], issue: (m: string) => void, opt: { 店舗名?: string; 登録者?: 管理者; 承認者?: 管理者 } = {}): Promise<作った商品[]> {
  if (!opt.登録者) await 管理者を用意する(browser);
  const shop = opt.店舗名 ?? (await 本店の店名(browser));
  const 登録者 = opt.登録者 ?? F04登録者;
  const 承認者 = opt.承認者 ?? F04承認者;
  const made: 作った商品[] = [];
  if (defs.length === 0) return made;
  await withAdminSession(browser, 登録者.account, async (page) => {
    const categoryId = await readExistingGoodsChildCategoryId(page);
    const region = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    const langs = defs.some((d) => d.言語) ? await readLanguageIds(page) : null;
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", ...region },
      lines: defs.map((d) => ({
        code: d.商品コード, nameJp: d.商品名, nameEn: d.商品名,
        values: { "基準価格": d.価格, "販売価格": d.価格, "買取価格": "100", "原価単価": "10", ...(d.言語 === "英語" && langs ? { "言語(ID)": langs.英語 } : {}), ...(d.CSVの値 ?? {}) },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const d of defs) {
      const productId = await openProductEditByCode(page, d.商品コード);
      made.push({ productId, 商品コード: d.商品コード, 商品名: d.商品名 });
    }
    const baseline = 在庫承認の最大ID();
    if (defs.every((d) => d.入庫方法 === "在庫編集")) {
      // 在庫検索一覧から本店・EC-CUBE の在庫編集画面を開いて入庫を申請する（シード表が在庫編集で入庫すると定める場合）
      for (const d of defs) {
        const stock = await searchStockByCode(page, { 商品コード: d.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
        await stock.openEdit(stock.row(d.商品コード, shop, "EC-CUBE"));
        await registerStockEdit(page, { changeType: "入庫/その他", reason: d.在庫変動理由 ?? "試験用", quantity: String(d.入庫数 ?? 10), purchasePrice: d.仕入単価 ?? "0", approverName: 承認者.名前 }, `${seedId}: ${d.商品コード} の在庫編集`, issue);
      }
      const registrant2 = await loggedInMemberName(page);
      await withAdminSession(browser, 承認者.account, async (ap) => {
        const list = new StockApprovalListPage(ap);
        // 一覧は「未承認が上・登録日の古い順」で、開発環境では前の実行で残った未承認の行が1ページ目を埋め、今回の行が後ろのページに回る
        // （2026-11-11 の F04-04 の 041・042・046 で「未承認の行が 0 件」）。今回の在庫編集の番号を DB で読み、一覧をその番号で絞り込んで開く
        const srcs = 未承認の在庫編集ID(baseline, defs.map((d) => d.商品コード));
        if (srcs.length < defs.length) throw new Error(`${seedId}: 今回の在庫編集の未承認の行が DB に ${srcs.length} 件（${defs.length} 件のはず）`);
        for (const src of srcs.slice(0, defs.length)) {
          await ap.goto(adminUrl(`/product/stock/approval_list?id=${src}`), { timeout: 60_000 });
          await ap.waitForLoadState("load");
          const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant2 && Number(r.id) > baseline);
          if (rows.length !== 1) throw new Error(`${seedId}: 在庫編集ID ${src} で絞り込んだ在庫編集承認一覧に、未承認の行が ${rows.length} 件（1件のはず）`);
          await 承認する(list, shop, [rows[0].id], `${seedId} の在庫編集の承認`, issue);
        }
      });
      return;
    }
    const total = defs.reduce((s, d) => s + (d.入庫数 ?? 100), 0);
    await registerStockChangeCsv(page, {
      店舗: shop, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/その他", 在庫変動理由: "シード作成", 承認者: 承認者.名前,
      行: defs.map((d) => ({ 商品コード: d.商品コード, 在庫増減数: String(d.入庫数 ?? 100), 仕入単価: d.仕入単価 ?? "100" })),
      ファイル名: stockCsvName(seedId),
    }, `${seedId} の在庫変更CSV登録`, (w) => issue(w));
    const registrant = await loggedInMemberName(page);
    await withAdminSession(browser, 承認者.account, async (ap) => {
      const list = new StockApprovalListPage(ap);
      // 一覧の1ページ目が前の実行の未承認の行で埋まり、今回の行が後ろのページに回る（2026-11-11 の M05-09 で「未承認の行が無い」）。
      // 今回の行の絞り込みの値を DB で読み、一覧をその値で開く。DB で見つからなければ、これまでどおり1ページ目から探す
      const srcs = 未承認の行の絞り込みの値(baseline, registrant, total);
      if (srcs.length > 0) {
        await ap.goto(adminUrl(`/product/stock/approval_list?id=${srcs[0]}`), { timeout: 60_000 });
        await ap.waitForLoadState("load");
      } else {
        await list.openAll(shop);
      }
      const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && Number(r.id) > baseline && r.quantity === String(total));
      if (rows.length === 0) throw new Error(`${seedId}: 在庫編集承認一覧に、登録者「${registrant}」の未承認の行（合計 ${total}）が無い`);
      await 承認する(list, shop, [rows[0].id], `${seedId} の在庫変更CSV登録の承認`, issue);
    });
  });
  return made;
}

/** 承認の成功の表示が出ないことがある（複数件など）ので、その場合は承認一覧の該当行が未承認でなくなったかで確かめて先へ進む */
async function 承認する(list: StockApprovalListPage, shop: string, ids: string[], what: string, issue: (m: string) => void): Promise<void> {
  try {
    await list.approve(ids, what, issue);
  } catch (e) {
    if (!String(e).includes("成功メッセージ")) throw e;
    await list.openAll(shop);
    const remain = (await list.rowValues()).filter((r) => ids.includes(r.id) && r.status === "未承認");
    if (remain.length) throw e;
    issue(`${what}: 成功の表示は出なかったが、承認一覧の該当の行は未承認でなくなった`);
  }
}

export type 配送先の定め = {
  配送先名称: string; 国?: string; 郵便番号?: string; 海外郵便番号?: string; 都道府県?: string;
  住所1: string; 住所2: string; 住所3?: string; 姓: string; 名: string; 電話: string;
};

/** 管理画面の会員の配送先編集画面で、お届け先を足す */
export async function 会員のお届け先を足す(page: Page, 会員ID: string, v: 配送先の定め, what: string): Promise<void> {
  await page.goto(adminUrl(`/customer/${会員ID}/delivery/new`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`[name="customer_address[${name}]"]`);
  await expect(f("address_name"), `${what}: 配送先編集の配送先名称欄`).toBeVisible({ timeout: 30_000 });
  await f("address_name").fill(v.配送先名称);
  const country = v.国 ?? "Japan";
  if (country !== "Japan") {
    await chooseByLabel(f("country"), country);
  }
  await f("name][name01").fill(v.姓);
  await f("name][name02").fill(v.名);
  if (country === "Japan") {
    const zip = (v.郵便番号 ?? "").replace(/\D/g, "");
    await f("postalCode][postalCode01").fill(zip.slice(0, 3));
    await f("postalCode][postalCode02").fill(zip.slice(3));
    await chooseByLabel(f("address][pref"), v.都道府県 ?? "東京都");
  } else {
    await f("abroadPostalCode").fill(v.海外郵便番号 ?? "");
    if (v.都道府県) await chooseByLabel(f("address][pref"), v.都道府県);
  }
  await f("address][addr01").fill(v.住所1);
  await f("address][addr02").fill(v.住所2);
  if (v.住所3 !== undefined && (await f("address][addr03").count()) > 0) await f("address][addr03").fill(v.住所3);
  const tel = v.電話.replace(/\D/g, "");
  await f("tel][tel01").fill(tel.slice(0, 2));
  await f("tel][tel02").fill(tel.slice(2, 6));
  await f("tel][tel03").fill(tel.slice(6));
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), page.locator("form button[type=submit]").filter({ hasText: /登録/ }).first().click({ timeout: 30_000 })]);
  await expectSaved(page, `${what}: お届け先の登録`);
}

/** 受注情報検索の既定は購入処理中などを含まない。全ステータスを選んでメールで探し、1件の受注情報編集画面を開く。受注IDを返す */
async function 処理中の受注IDを1回読む(page: Page, メール: string, 本店: string, what: string): Promise<string> {
  await page.goto(adminUrl("/order"));
  await page.waitForLoadState("load");
  const form = page.locator("form#search_form");
  await expect(form, "受注情報検索の検索欄").toBeVisible();
  const tenants = form.locator("#admin_search_order_tenants");
  if ((await tenants.count()) > 0) {
    const selected = await tenants.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value));
    if (selected.length === 0) {
      await tenants.evaluate((node, shop) => {
        const s = node as HTMLSelectElement;
        const hit = Array.from(s.options).find((o) => (o.textContent ?? "").trim() === shop) ?? s.options[0];
        hit.selected = true;
        const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
        if (w.jQuery) w.jQuery(s).trigger("change");
        else s.dispatchEvent(new Event("change", { bubbles: true }));
      }, 本店);
    }
  }
  const email = form.locator("#admin_search_order_email");
  if (!(await email.isVisible())) await page.locator('button[data-bs-target="#searchDetail"]').first().click({ timeout: 20_000 });
  await email.fill(メール);
  const box = page.locator("#admin_search_order_status");
  if ((await box.count()) > 0) {
    if (!(await box.isVisible())) await page.locator('button[data-bs-target="#searchDetail"]').first().click({ timeout: 20_000 });
    await expect(box, "詳細検索条件の対応状況の欄").toBeVisible({ timeout: 20_000 });
    // 対応状況は全部選ぶ（購入処理中を含める）。見た目の部品が押下を受けないことがあるので、選択欄の状態を直接そろえる
    await box.locator('input[type="checkbox"]').evaluateAll((ns) => ns.forEach((n) => { (n as HTMLInputElement).checked = true; }));
    expect(await box.locator('input[type="checkbox"]:not(:checked)').count(), "対応状況がすべて選ばれた").toBe(0);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator("#search_submit").click()]);
  await page.waitForLoadState("load");
  const hrefs = await page.locator('a.action-edit[href*="/order/"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  const ids = [...new Set(hrefs.map((h) => /\/order\/(\d+)\/edit/.exec(h)?.[1]).filter((v): v is string => !!v))];
  if (ids.length !== 1) throw new Error(`${what}: 受注情報検索でメールアドレス「${メール}」の受注が ${ids.length} 件（1件のはず）`);
  return ids[0];
}

export { rc };

/** 登録の直後は会員一覧に出るまで間があるので、出るまで少し待って（最大90秒）読み直す */
async function 本会員になるまで待つ(browser: Browser, メール: string): Promise<string | null> {
  let state: string | null = null;
  for (let i = 0; i < 18; i++) {
    state = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, メール));
    if (state === "本会員") return state;
    await new Promise((r) => setTimeout(r, 5000));
  }
  return state;
}

/** 会員を本会員として用意する（m05_11_order の 会員を用意する と同じ。登録直後の一覧への反映待ちを入れた） */
export async function 会員を登録して待つ(browser: Browser, m: FrontMember): Promise<void> {
  const state = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, m.メール));
  if (state === "本会員") return;
  if (state === "仮会員") throw new Error(`試験用の会員 ${m.メール} が仮会員のまま`);
  // 本登録のメールは、メールの受け口（手元の受け口、または開発環境の受け口 E2E_MAIL_URL）で読む（依頼者決定 2026-10-31・2026-11-10）
  if (ENV_NAME !== "local" && !MAIL_URL) throw new Error(`E2E_ENV=${ENV_NAME} では試験用の会員を登録できない（メールの受け口 E2E_MAIL_URL が無い）`);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), m);
  } finally {
    await context.close();
  }
  const after = await 本会員になるまで待つ(browser, m.メール);
  if (after !== "本会員") throw new Error(`試験用の会員 ${m.メール} を登録したが、会員一覧で本会員にならない（${after ?? "見つからない"}）`);
}

/** 受注情報検索で購入処理中の受注を探す。作った直後は一覧に出るまで間があるので、0件のときは少し待って（最大60秒）探し直す */
export async function 処理中の受注IDを読む(page: Page, メール: string, 本店: string, what: string): Promise<string> {
  let last: unknown;
  for (let i = 0; i < 12; i++) {
    try { return await 処理中の受注IDを1回読む(page, メール, 本店, what); } catch (e) {
      last = e;
      if (!String(e).includes("受注が 0 件")) throw e;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw last;
}

/** 支店（トーナメントセンター 大阪＝店舗ID 5。フロントの店舗ページは /ja/osaka/）でも在庫を扱える登録者と承認者（本店と大阪を編集できるシステム管理者） */
export const 大阪の店名 = "トーナメントセンター 大阪";
export const 大阪の店舗ページ = "/osaka";
export const F04大阪登録者: 管理者 = { 名前: `F04大阪登録者-${RUN_MARK}`, account: { loginId: `f04oreg${RUN_MARK}`.toLowerCase(), password: PASS } };
export const F04大阪承認者: 管理者 = { 名前: `F04大阪承認者-${RUN_MARK}`, account: { loginId: `f04oapr${RUN_MARK}`.toLowerCase(), password: PASS } };
let osakaAdminsReady = false;
export async function 大阪の管理者を用意する(browser: Browser): Promise<void> {
  if (osakaAdminsReady) return;
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const a of [F04大阪登録者, F04大阪承認者]) {
      await ensureMember(page, {
        名前: a.名前, 所属店舗: shop, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`,
        パスワード: a.account.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop, 大阪の店名],
      });
    }
  });
  osakaAdminsReady = true;
}
