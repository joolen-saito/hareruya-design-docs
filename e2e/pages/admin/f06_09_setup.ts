/**
 * F06-09 お気に入り商品一覧のシードで使う管理画面の操作（新しく足した部品。既存の部品は変えていない）。
 * - 取り込みで作られた商品規格を、セール対象（セールフラグ・基準価格・販売価格）にして公開で登録する。
 * - 商品規格一覧の「新規作成」で、状態を記号（NM・EX）で選んで商品規格を足す（既存の addClass は状態を表示名で選ぶので、記号から表示名を読んで渡す）。
 * - 在庫検索一覧で商品コードの本店・EC-CUBE の行を全部開き、在庫編集画面に表示された在庫ID・商品規格ID・在庫数を読み、
 *   必要な商品規格だけ在庫を入れて（承認通知先に全権限の管理者）、その管理者が在庫編集承認一覧で承認する。
 * セレクタはここだけに書く。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { adminUrl, withAdminSession } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { ensureStockAdmin, STOCK_ADMIN } from "./f03_08_masters";
import { addClass, openClassList } from "./m03_30_products";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage } from "./stock_edit";

type Issue = (m: string) => void;

/** 部門が未選択なら選択肢の先頭を選ぶ（シード表: 部門は選択肢の先頭） */
async function 部門を選ぶ(page: Page, what: string, issue: Issue): Promise<void> {
  const section = page.locator("form#form #admin_product_class_Section");
  if (await section.inputValue()) return;
  const first = await section.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
  if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
  await section.selectOption(first.value);
  issue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ`);
}

/**
 * 商品規格登録編集画面を開き、セールフラグにチェックを入れ、基準価格・販売価格を入れ、部門（先頭）・公開ステータス「公開」で「商品規格を登録」を押す。
 * スマレジ連携フラグが「連携する」なら止める（外部へ送られるため）。
 */
export async function セールの規格にして公開する(page: Page, a: { productId: string; classId: string; 基準価格: string; 販売価格: string }, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${a.productId}/edit/${a.classId}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await smaregi.count()) === 1 && (await smaregi.getAttribute("value")) !== "0") throw new Error(`${what}: スマレジ連携フラグが「連携する」になっている`);
  await form.locator("#admin_product_class_sale_flg").check();
  await form.locator("#admin_product_class_standard_price").fill(a.基準価格);
  await form.locator("#admin_product_class_price02").fill(a.販売価格);
  await 部門を選ぶ(page, what, issue);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
  await expect(form.locator("#admin_product_class_sale_flg"), `${what}: 登録後のセールフラグ`).toBeChecked();
  expect((await form.locator("#admin_product_class_price02").inputValue()).replace(/,/g, ""), `${what}: 登録後の販売価格`).toBe(a.販売価格);
  await expect(form.locator("#admin_product_class_Status option:checked"), `${what}: 登録後の公開ステータス`).toHaveText(/^\s*公開\s*$/);
}

/** 商品規格登録編集画面の状態の欄で、記号（NM・EX）の選択肢の表示名 */
async function 状態の表示名(page: Page, 記号: string): Promise<string> {
  const option = page.locator(`form#form #admin_product_class_CardCondition option[data-code="${記号}"]`);
  if ((await option.count()) === 1) return ((await option.textContent()) ?? "").trim();
  // 記号の印が無い作りなら、表示名が記号そのもの・記号を含むものを探す
  const labels = (await page.locator("form#form #admin_product_class_CardCondition option").allTextContents()).map((t) => t.trim()).filter(Boolean);
  const hit = labels.filter((l) => l === 記号 || l.includes(`(${記号})`) || l.includes(`（${記号}）`));
  if (hit.length !== 1) throw new Error(`商品規格の状態の欄に、記号 ${記号} の選択肢を1つに決められない（${labels.join("、")}）`);
  return hit[0];
}

export type 足す規格 = { 言語: "日本語" | "英語"; 状態: "NM" | "EX"; 商品コード: string; 価格: string; 買取価格: string; 高額商品コード?: string };

/**
 * 商品規格一覧の「新規作成」で、言語・状態（記号）・商品コード・基準価格＝販売価格・買取価格（・高額商品コード）を入れ、部門は先頭、公開ステータス「公開」で登録する。
 * 登録後の商品規格登録編集画面に表示された商品規格IDを返す。
 */
export async function 規格を足す(page: Page, productId: string, v: 足す規格, what: string, issue: Issue): Promise<string> {
  // 状態の表示名は、商品規格登録編集画面（新規）の選択肢から読む
  await page.goto(adminUrl(`/product/product/class/${productId}/new`));
  await page.waitForLoadState("load");
  await expect(page.locator("form#form"), `${what}: 商品規格登録編集画面（新規）`).toBeVisible();
  const label = await 状態の表示名(page, v.状態);
  await openClassList(page, productId);
  return addClass(page, productId, {
    言語: v.言語, 状態: label, 商品コード: v.商品コード, 基準価格: v.価格, 販売価格: v.価格, 買取価格: v.買取価格,
    ...(v.高額商品コード !== undefined ? { 高額商品コード: v.高額商品コード } : {}),
  }, what, issue);
}

// ---- 在庫 ----

/** 在庫編集画面に表示された項目（ラベルの右の値） */
async function 在庫編集の表示(page: Page, ラベル: string): Promise<string> {
  const label = page.locator("label.form-label", { hasText: new RegExp(`^\\s*${ラベル}\\s*$`) });
  await expect(label, `在庫編集画面の「${ラベル}」の項目`).toHaveCount(1);
  const row = label.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' row ')][1]");
  return ((await row.locator(".col-7 > div").first().textContent()) ?? "").replace(/[,\s]/g, "");
}

export type 在庫の対象 = { 商品コード: string; 商品規格ID: string; 数: number };
export type 在庫の結果 = { 在庫ID: string; 在庫数: number };

/**
 * 商品コードごとに、在庫検索一覧の本店・EC-CUBE の行を全部開き（同じ商品コードの商品規格が複数ある）、在庫編集画面に表示された在庫ID・商品規格IDを読む。
 * 対象の商品規格で数が1以上のものは、在庫を入れる管理者が「入庫/その他」・在庫変動理由・在庫増減数・仕入単価0・承認通知先に全権限の管理者を入れて登録する。
 * 全権限の管理者が在庫編集承認一覧で、登録の前に無かった未承認の行（登録者・数が一致するもの）を承認する。承認のあと在庫編集画面の在庫数を読み直して確かめる。
 * 商品規格IDごとの在庫ID・在庫数を返す。
 */
export async function 在庫を入れて在庫IDを読む(browser: Browser, what: string, 対象: 在庫の対象[], issue: Issue): Promise<Map<string, 在庫の結果>> {
  const out = new Map<string, 在庫の結果>();
  if (対象.length === 0) return out;
  const 入れる = 対象.filter((t) => t.数 > 0);
  const approverName = await withAdminSession(browser, SETUP_ADMIN, (page) => loggedInMemberName(page));
  const shop = await withAdminSession(browser, SETUP_ADMIN, (page) => new StockListPage(page).shopNameById("1"));
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStockAdmin(page));
  const before = 入れる.length === 0 ? new Set<string>() : await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    return new Set((await list.rowValues()).map((r) => r.id));
  });
  const hrefs = new Map<string, string>();
  const registeredBy = await withAdminSession(browser, STOCK_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const registrant = await loggedInMemberName(page);
    if (入れる.length && registrant === approverName) throw new Error(`${what}: 在庫の登録者と承認者が同じ管理者になっている`);
    const stock = new StockListPage(page);
    for (const code of [...new Set(対象.map((t) => t.商品コード))]) {
      await stock.searchByProductCode(code);
      const rows = stock.row(code, shop, "EC-CUBE");
      const links = await rows.locator("td.col-name a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
      if (links.length === 0) throw new Error(`${what}: 在庫検索一覧に ${code} の本店・EC-CUBE の行が無い`);
      for (const href of links) {
        await page.goto(href);
        await page.waitForLoadState("load");
        await expect(page.locator("form#stock_approval_form"), `${what}: 在庫編集の画面`).toBeVisible();
        const classId = await 在庫編集の表示(page, "商品規格ID");
        const stockId = await 在庫編集の表示(page, "在庫ID");
        if (!/^\d+$/.test(stockId) || !/^\d+$/.test(classId)) throw new Error(`${what}: 在庫編集画面の在庫ID「${stockId}」・商品規格ID「${classId}」を読めない`);
        const t = 対象.find((x) => x.商品規格ID === classId && x.商品コード === code);
        if (!t) continue;
        hrefs.set(classId, href);
        out.set(classId, { 在庫ID: stockId, 在庫数: Number(await 在庫編集の表示(page, "在庫数")) });
        if (t.数 > 0) {
          await registerStockEdit(page, { changeType: "入庫/その他", reason: "F06-09試験データ", quantity: String(t.数), purchasePrice: "0", approverName }, `${what}: ${code}（商品規格ID ${classId}）の在庫編集`, issue);
        }
      }
    }
    return registrant;
  });
  for (const t of 対象) if (!out.has(t.商品規格ID)) throw new Error(`${what}: 商品規格ID ${t.商品規格ID}（${t.商品コード}）の在庫の行が在庫検索一覧に無い`);
  if (入れる.length) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const list = new StockApprovalListPage(page);
      await list.open(shop);
      const qty = new Set(入れる.map((t) => String(t.数)));
      const rows = (await list.rowValues()).filter((r) => !before.has(r.id) && r.status === "未承認" && r.registrant === registeredBy
        && r.changeType.endsWith("入庫/その他") && qty.has(r.quantity));
      if (rows.length !== 入れる.length) throw new Error(`${what}: 在庫編集のあとに増えた未承認の行が ${rows.length} 件（${入れる.length} 件のはず）`);
      await list.approve(rows.map((r) => r.id), `${what}: 在庫編集の承認（${rows.length}件）`, issue);
      for (const t of 入れる) {
        await page.goto(hrefs.get(t.商品規格ID)!);
        await page.waitForLoadState("load");
        const n = Number(await 在庫編集の表示(page, "在庫数"));
        if (n !== t.数) throw new Error(`${what}: ${t.商品コード}（商品規格ID ${t.商品規格ID}）の本店の在庫が ${n}（${t.数} のはず）`);
        out.set(t.商品規格ID, { 在庫ID: out.get(t.商品規格ID)!.在庫ID, 在庫数: n });
      }
    });
  }
  issue(`${what}: 在庫検索一覧で開いた在庫編集画面の在庫ID・在庫数: ${[...out.entries()].map(([c, r]) => `商品規格ID ${c}→在庫ID ${r.在庫ID}（在庫 ${r.在庫数}）`).join("、")}`);
  return out;
}
