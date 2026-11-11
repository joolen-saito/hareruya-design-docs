/**
 * M05-01 受注管理（受注一覧系）のシードが使う、受注を画面で作るための操作。DB は使わない（共有の開発環境で流すため）。
 *
 * - 管理者: メンバー管理で登録する。登録済みで内容が違えば、メンバー編集画面で所属店舗・編集可能店舗・デフォルト検索表示店舗をそろえる
 *   （M05-01試験管理者の店舗Aを、試験用に作った支店から本店へ読み替えたため。前回の実行で作った管理者を直して使う）。
 * - 商品: グッズ商品CSV登録で作り、在庫変更CSV登録で本店・EC-CUBE に入庫し、登録者と別のメンバー（M05-01試験管理者）が承認する。
 *   1回の実行（Playwright のプロセス）で1件だけ作り、その実行の注文で使い回す。
 * - 注文: フロントの本店の画面で試験用の会員が商品1点をカートに入れ、銀行振込以外で外部の画面へ移らない支払方法で注文する。
 *   ご注文完了の画面の注文番号を控え、管理画面の受注情報検索で注文番号から受注IDを読む。
 * - 対応状況: 受注情報編集画面の「変更後のステータス」で選んで「受注ステータスを変更」を押す。
 * - 表示件数マスタ: マスタデータ管理画面で読むだけ（共有のマスタなので書き換えない）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { Account, adminUrl, hideDebugToolbar, withAdminSession } from "../../lib/session";
import { expectSaved } from "./common";
import { findMemberId } from "./member";
import { downloadGoodsCsvTemplate } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { openProductEditByCode } from "./m03_23_seed_products";
import { goodsCategoryIdForCsv } from "./m04_19_masters";
import { registerStockChangeCsv } from "./m04_19_stock_change_csv";
import { createMemberByStoreIds, expectMemberByStoreIds, M0424MemberInput } from "./m04_24_member";
import { addToCart, checkout, clearCart, frontLogin } from "./m04_19_order_shortage";
import { OrderEditPage } from "./m05_11_order_edit";
import { OrderSearchPage } from "./m05_01_order_search_k";
import { loggedInMemberName, StockApprovalListPage } from "./stock_edit";
import { ensureFrontMember } from "../front/m05_front_order";
import { FrontMember } from "../front/member_entry";

/** 本店（店舗ID 1） */
export const 本店ID = "1";

/** メンバーを、あれば内容をそろえて使い、無ければ登録する。管理者IDを返す */
export async function ensureMemberAligned(page: Page, v: M0424MemberInput, onIssue: (m: string) => void): Promise<string> {
  const found = await findMemberId(page, v.名前);
  if (!found) return createMemberByStoreIds(page, v);
  try {
    await expectMemberByStoreIds(page, found, v);
    return found;
  } catch (e) {
    onIssue(`登録済みのメンバー「${v.名前}」の内容が違ったので、メンバー編集画面で所属店舗・編集可能店舗・デフォルト検索表示店舗・権限をそろえた（${(e as Error).message}）`);
  }
  const f = (name: string) => page.locator(`[name="admin_member[${name}]"]`);
  await page.goto(adminUrl(`/setting/system/member/${found}/edit`));
  await page.waitForLoadState("load");
  await f("baseInfo").selectOption(v.所属店舗ID);
  await page.locator('[name="admin_member[editableBaseInfos][]"]').selectOption(v.編集可能店舗ID);
  await expect(page.locator(`[name="admin_member[defaultSearchBaseInfo]"] option[value="${v.デフォルト検索表示店舗ID}"]`), "デフォルト検索表示店舗の選択肢").toHaveCount(1);
  await f("defaultSearchBaseInfo").selectOption(v.デフォルト検索表示店舗ID);
  await f("Authority").selectOption({ label: v.権限 });
  await page.getByLabel("稼働", { exact: true }).check();
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `メンバー「${v.名前}」の編集`);
  await expectMemberByStoreIds(page, found, v);
  return found;
}

/** 在庫を入庫する登録者（承認は登録者と別のメンバーでないとできない） */
const 在庫登録者 = { 名前: "M05-01在庫登録者", account: { loginId: "m0501_stockreg", password: "Passw0rd!M0501S" } };

export type 試験商品 = { 商品ID: string; 商品コード: string; 商品名: string };
let productPromise: Promise<試験商品> | null = null;

/**
 * この実行の注文に使う商品を1件作って入庫する（1回の実行で1度だけ）。
 * 商品コード・商品名は印つき。価格100円・在庫90（100点以上の在庫変動は確認の窓が出るので、その手前の数）。
 */
export function 試験商品を用意する(browser: Browser, 承認者: { 名前: string; account: Account }, 商品コード: string, 商品名: string, onIssue: (m: string) => void): Promise<試験商品> {
  if (!productPromise) {
    productPromise = makeProduct(browser, 承認者, 商品コード, 商品名, onIssue);
    productPromise.catch(() => { productPromise = null; });
  }
  return productPromise;
}

async function makeProduct(browser: Browser, 承認者: { 名前: string; account: Account }, 商品コード: string, 商品名: string, onIssue: (m: string) => void): Promise<試験商品> {
  const 本店 = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await ensureMemberAligned(page, {
      名前: 在庫登録者.名前, ログインID: 在庫登録者.account.loginId, メールアドレス: `${在庫登録者.account.loginId}@example.test`, パスワード: 在庫登録者.account.password,
      権限: "システム管理者", 所属店舗ID: 本店ID, デフォルト検索表示店舗ID: 本店ID, 編集可能店舗ID: [本店ID],
    }, onIssue);
    return storeName(page, 本店ID);
  });
  const 入庫数 = "90";
  const { 商品ID, registrant } = await withAdminSession(browser, 在庫登録者.account, async (page) => {
    const categoryId = await goodsCategoryIdForCsv(page, onIssue);
    const region = Object.fromEntries((await downloadGoodsCsvTemplate(page)).headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: "M05-01 の試験商品のグッズ商品CSV登録", fileName: `m0501-item-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", ...region },
      lines: [{ code: 商品コード, nameJp: 商品名, nameEn: 商品名, values: { "基準価格": "100", "販売価格": "100", "買取価格": "10", "原価単価": "10" } }],
      onWarning: (w) => onIssue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    const id = await openProductEditByCode(page, 商品コード);
    await registerStockChangeCsv(page, {
      店舗: 本店, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/その他", 在庫変動理由: "シード作成", 承認者: 承認者.名前,
      行: [{ 商品コード, 在庫増減数: 入庫数, 仕入単価: "100" }], ファイル名: `m0501-stock-${Date.now()}.csv`,
    }, "M05-01 の試験商品の在庫変更CSV登録", onIssue);
    return { 商品ID: id, registrant: await loggedInMemberName(page) };
  });
  await withAdminSession(browser, 承認者.account, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(本店);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && r.quantity.replace(/[+,\s]/g, "") === 入庫数);
    if (rows.length === 0) throw new Error(`在庫編集承認一覧に、登録者「${registrant}」の未承認の行（増減数 ${入庫数}）が無い`);
    try {
      await list.approve(rows.map((r) => r.id), "M05-01 の試験商品の入庫の承認", onIssue);
    } catch (e) {
      if (!String(e).includes("成功メッセージ")) throw e;
      await list.open(本店);
      const remain = (await list.rowValues()).filter((r) => rows.some((x) => x.id === r.id) && r.status === "未承認");
      if (remain.length) throw e;
      onIssue("入庫の承認で成功の表示は出なかったが、承認一覧の該当の行は未承認でなくなった");
    }
  });
  return { 商品ID, 商品コード, 商品名 };
}

/** メンバー登録の所属店舗の選択肢から、店舗IDの店名を読む（店舗一覧は本店を出さないため） */
export async function storeName(page: Page, 店舗ID: string): Promise<string> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const option = page.locator(`[name="admin_member[baseInfo]"] option[value="${店舗ID}"]`);
  await expect(option, `メンバー登録の所属店舗に店舗ID ${店舗ID} の選択肢が1件`).toHaveCount(1);
  const name = ((await option.textContent()) ?? "").trim();
  if (!name) throw new Error(`店舗ID ${店舗ID} の店名が空`);
  return name;
}

let buyerReady = false;
/** フロントの本店の画面で、試験用の会員が商品1点を注文する。ご注文完了の画面の注文番号と支払方法を返す */
export async function 会員が商品を注文する(browser: Browser, 会員: FrontMember, 商品ID: string, what: string): Promise<{ 注文番号: string; 支払方法: string }> {
  if (!buyerReady) { await ensureFrontMember(browser, 会員); buyerReady = true; }
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, 会員);
    await clearCart(page, () => undefined);
    await addToCart(page, 商品ID, 1, what);
    return await checkout(page, ["代金引換", "郵便振替", "現金書留"], what);
  } finally {
    await context.close();
  }
}

/**
 * 受注情報検索 一覧(検索入力)で注文番号を入れ、対応状況を全部選んで検索し、注文番号が一致する行の受注IDを読む。
 * 店舗はログイン中の管理者のデフォルト検索表示店舗のまま。同じ注文番号の行が複数あれば（古い開発用データ）、受注IDの最大のものを選ぶ。
 */
export async function 注文番号から受注IDを読む(page: Page, 注文番号: string, onIssue: (m: string) => void): Promise<string> {
  const p = new OrderSearchPage(page);
  for (let i = 0; i < 6; i++) {
    await p.open();
    const chosen = await p.tenants.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value));
    if (chosen.length === 0) {
      onIssue("受注情報検索の店舗の選択が空だった（デフォルト検索表示店舗が選ばれていない）ので、本店を選んで受注を探した");
      await p.tenants.selectOption(本店ID);
    }
    await p.orderNumber.fill(注文番号);
    await p.showDetail();
    await page.locator('#admin_search_order_status input[type="checkbox"]').evaluateAll((ns) => ns.forEach((n) => { (n as HTMLInputElement).checked = true; }));
    await p.clickSearch();
    const ids = await page.locator("#search_result tbody tr").evaluateAll((trs, no) => trs
      .filter((tr) => (tr.querySelectorAll("td")[2]?.textContent ?? "").trim() === no)
      .map((tr) => /\/order\/(\d+)\/edit/.exec((tr.querySelector("td:nth-child(3) a") as HTMLAnchorElement | null)?.href ?? "")?.[1] ?? "")
      .filter(Boolean), 注文番号);
    const uniq = [...new Set(ids)];
    if (uniq.length === 1) return uniq[0];
    if (uniq.length > 1) {
      const max = String(Math.max(...uniq.map(Number)));
      onIssue(`受注情報検索で注文番号「${注文番号}」の受注が ${uniq.length} 件出た（開発用の古いデータと重なる）。受注IDの最大の ${max} を作った受注とした`);
      return max;
    }
    await page.waitForTimeout(5000);
  }
  throw new Error(`受注情報検索で注文番号「${注文番号}」の受注が出ない`);
}

/** 受注情報編集画面で対応状況を「変更後のステータス」で変える（同じなら何もしない）。変えた後の対応状況を返す */
export async function 対応状況をそろえる(page: Page, 受注ID: string, 状態: string, onIssue: (m: string) => void): Promise<string> {
  await page.goto(adminUrl(`/order/${受注ID}/edit`));
  await page.waitForLoadState("load");
  const edit = new OrderEditPage(page);
  await expect(edit.status, "受注情報編集画面の変更後のステータス").toBeVisible();
  const now = await edit.現在のステータス();
  if (now === 状態) return now;
  await edit.ステータスを選ぶ(状態);
  await edit.ステータスを変更する((m) => onIssue(`対応状況を「${状態}」にするときの表示: ${m}`));
  await page.goto(adminUrl(`/order/${受注ID}/edit`));
  await page.waitForLoadState("load");
  const after = await edit.現在のステータス();
  if (after !== 状態) throw new Error(`受注ID ${受注ID} の対応状況を「${状態}」に変えられない（いまは「${after}」）`);
  return after;
}

/** マスタデータ管理画面で表示件数マスタの名称（件数）を読む（書き換えない） */
export async function 表示件数マスタを読む(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  const master = page.locator("#admin_system_masterdata_masterdata");
  await expect(master.locator("option", { hasText: "mtb_page_max" }), "マスタデータ管理に表示件数マスタがある").toHaveCount(1);
  await master.selectOption({ label: "mtb_page_max" });
  await page.locator("form#form1 button[type=submit]").click();
  await expect(page.locator("form#form2"), "表示件数マスタの編集欄").toBeVisible();
  const names = await page.locator('form#form2 tbody tr input[name$="[name]"]').evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).value.trim()));
  return names.filter(Boolean);
}
