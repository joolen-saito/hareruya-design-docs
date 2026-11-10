/**
 * A17-05（商品名から商品詳細の情報を取得するAPI）のシードが使う、管理画面の操作。セレクタはここ（と流用する部品）だけに書く。
 * - 最上位カテゴリ「試験カテゴリA」「試験カテゴリB」をあれば使い、無ければカテゴリ登録で作る
 * - グッズ商品CSV登録（各行共通の値はシード表の「各行共通」のとおり）
 * - 商品登録編集でカテゴリを付け替えて「商品を登録」
 * - 商品規格登録編集で高額商品コード・状態別称を入れて「商品規格を登録」、商品規格の追加・削除
 * - 在庫編集で本店・EC-CUBE へ入庫し、別の管理者が在庫編集承認一覧で承認
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { 未承認の入庫の在庫編集番号 } from "../../db/a17_05";
import { RUN_MARK } from "../../lib/run_marker";
import { adminUrl, withAdminSession } from "../../lib/session";
import { CategoryPage } from "./category";
import { expectSaved } from "./common";
import { 本店の店名, 管理者 } from "./f04_setup";
import { downloadGoodsCsvTemplate } from "./m03_01_goods_csv";
import { registerGoodsCsv } from "./m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId } from "./m03_23_seed_products";
import { addClass, deleteClassOnEdit, openClassList } from "./m03_30_products";
import { searchStockByCode } from "./m04_02_rc_stock";
import { ensureMember } from "./member";
import { ProductSearchPage } from "./product_search";
import { fillStockEdit, loggedInMemberName, StockApprovalListPage } from "./stock_edit";

export type Issue = (m: string) => void;

const PASS = "Passw0rd!A1705";
/** 在庫編集の登録者と承認者（承認は登録した者と別のメンバーでないとできない）。どちらも本店を編集できるシステム管理者 */
export const A1705登録者: 管理者 = { 名前: `A1705登録者-${RUN_MARK}`, account: { loginId: `a1705reg${RUN_MARK}`.toLowerCase(), password: PASS } };
export const A1705承認者: 管理者 = { 名前: `A1705承認者-${RUN_MARK}`, account: { loginId: `a1705apr${RUN_MARK}`.toLowerCase(), password: PASS } };

let adminsReady = false;
export async function 管理者を用意する(browser: Browser): Promise<void> {
  if (adminsReady) return;
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    for (const a of [A1705登録者, A1705承認者]) {
      await ensureMember(page, {
        名前: a.名前, 所属店舗: shop, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`,
        パスワード: a.account.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
      });
    }
  });
  adminsReady = true;
}

// ---- カテゴリ ----

export const 試験カテゴリ = ["試験カテゴリA", "試験カテゴリB"] as const;
let categoryIds: string[] | null = null;
/**
 * 最上位に「試験カテゴリA」「試験カテゴリB」が無ければ、最上位のカテゴリ登録画面でAを先に、Bを後に登録する。あれば使う。
 * 期待結果がカテゴリ名そのものを見るので、実行の印は付けない（共有の開発環境に1度だけ作り、以後は使い回す）。
 */
export async function 試験カテゴリを用意する(page: Page, issue: Issue): Promise<string[]> {
  if (categoryIds) return categoryIds;
  const c = new CategoryPage(page);
  const ids: string[] = [];
  for (const name of 試験カテゴリ) {
    await c.openTop();
    let hit = (await c.rowValues()).filter((r) => r.nameJp === name);
    if (hit.length === 0) {
      // カテゴリ登録の入力欄は親カテゴリを選んだときだけ出る作り（category.twig の isCategoryFormAvailable）。最上位には作れない
      if (!(await c.categoryScreenParts()).includes("カテゴリの入力欄")) {
        throw new Error(`最上位カテゴリ「${name}」が無い。最上位のカテゴリ登録画面には入力欄が無く（親カテゴリを選んだときだけ出る作り）、シード表のとおり最上位に登録できない`);
      }
      await c.fill({ nameJp: name });
      await c.submitAndWait();
      for (const w of await expectSaved(page, `最上位カテゴリ「${name}」の登録`)) issue(`最上位カテゴリ「${name}」の登録の警告「${w}」`);
      await c.openTop();
      hit = (await c.rowValues()).filter((r) => r.nameJp === name);
      issue(`最上位カテゴリ「${name}」が無かったので、カテゴリ登録で登録した（ID ${hit[0]?.id ?? "読めない"}）`);
    }
    if (hit.length !== 1) throw new Error(`最上位カテゴリ「${name}」が ${hit.length} 件ある（1件のはず）`);
    ids.push(hit[0].id);
  }
  categoryIds = ids;
  return ids;
}

// ---- グッズ商品CSV登録 ----

export type 取込の行 = { 商品コード: string; 商品名日: string; 商品名英: string; 価格: string; 規格画像?: string };

/**
 * シード表の「各行共通」の値でグッズ商品CSVを取り込む: 商品IDは空・言語(ID)=日本語・支店の商品公開ステータス=公開・サイズ1・重量1・
 * 商品カテゴリ(ID)=グッズのカテゴリ（最上位「サプライ・グッズ」）・購入グループ名称=通常商品・買取価格0・原価単価0・地域別販売制限0。
 * 商品公開ステータスは公開（正本の「2（公開）」は画面の説明の公開に当たる値で書く）。
 * スマレジ連携の列は0（外部のスマレジへ送らない。正本は値を定めない）。
 */
export async function グッズ商品を取り込む(page: Page, seedId: string, lines: 取込の行[], issue: Issue): Promise<void> {
  const categoryId = await readGoodsRootCategoryId(page);
  const template = await downloadGoodsCsvTemplate(page);
  const zeros = Object.fromEntries(template.headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
  await registerGoodsCsv(page, {
    what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
    common: { "購入グループ名称": "通常商品", "買取価格": "0", "原価単価": "0", ...zeros },
    lines: lines.map((l) => ({
      code: l.商品コード, nameJp: l.商品名日, nameEn: l.商品名英,
      values: { "基準価格": l.価格, "販売価格": l.価格, ...(l.規格画像 !== undefined ? { "規格画像": l.規格画像 } : {}) },
    })),
    onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 300_000,
  });
}

/** 商品マスターで商品コードを検索して商品IDを読み、商品規格一覧で取込で作られた商品規格の商品規格IDを読む（商品規格一覧を開いた状態で終わる） */
export async function 取込の商品と規格を読む(page: Page, 商品コード: string, issue: Issue): Promise<{ 商品ID: string; 規格ID: string }> {
  const 商品ID = await openProductEditByCode(page, 商品コード);
  const rows = await classRowsFromProductEdit(page, 商品ID);
  const hit = rows.filter((r) => r.商品コード === 商品コード);
  if (hit.length !== 1) throw new Error(`商品ID ${商品ID} の商品規格一覧に、商品コード ${商品コード} の行が ${hit.length} 件（1件のはず）: ${JSON.stringify(rows)}`);
  if (hit[0].公開状態 !== "公開" || hit[0].状態 !== "NM") issue(`${商品コード}: 取込で作られた商品規格は 公開状態「${hit[0].公開状態}」・状態「${hit[0].状態}」（シード表は変えると定めないので変えていない）`);
  return { 商品ID, 規格ID: hit[0].商品規格ID };
}

// ---- 商品登録編集 ----

/**
 * 商品登録編集で、商品カテゴリを ids のものだけにチェックし（ほかのチェックは外す）、割引率が未選択なら選択肢の先頭を選び、
 * 販売制限が「制限なし」・商品公開ステータスが「公開」であることを確かめて「商品を登録」を押す。
 */
export async function 商品のカテゴリを付け替える(page: Page, 商品ID: string, ids: string[], what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: 商品登録編集`).toBeVisible();
  const boxes = form.locator('input[type="checkbox"][name="admin_product[Category][]"]');
  for (const box of await boxes.all()) {
    const v = (await box.getAttribute("value")) ?? "";
    const want = ids.includes(v);
    if ((await box.isChecked()) !== want) await box.setChecked(want, { force: true });
  }
  const checked = await boxes.evaluateAll((ns) => ns.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).value));
  expect([...checked].sort(), `${what}: 商品カテゴリのチェック`).toEqual([...ids].sort());
  const discount = form.locator('select[name="admin_product[Discount]"]');
  if (!(await discount.inputValue())) {
    const first = await discount.locator("option").evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLOptionElement).value, t: (n.textContent ?? "").trim() })).find((o) => o.v !== ""));
    if (!first) throw new Error(`${what}: 割引率に選べる値が無い`);
    await discount.selectOption(first.v);
    issue(`${what}: 割引率は選択肢の先頭の「${first.t}」を選んだ`);
  }
  const region = form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked');
  await expect(region, `${what}: 販売制限が選ばれている`).toHaveCount(1);
  const regionId = (await region.getAttribute("id")) ?? "";
  const regionLabel = ((await form.locator(`label[for="${regionId}"]`).textContent()) ?? "").trim();
  expect(regionLabel, `${what}: 販売制限`).toBe("制限なし");
  await expect(form.locator('select[name="admin_product[Status]"] option:checked'), `${what}: 商品公開ステータス`).toHaveText(/^\s*公開\s*$/);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), form.locator("button[type=submit]").filter({ hasText: /^\s*商品を登録\s*$/ }).click()]);
  for (const w of await expectSaved(page, `${what}: 商品を登録`)) issue(`${what}: 警告「${w}」`);
}

// ---- 商品規格 ----

/** 商品規格登録編集で、高額商品コード・状態別称を入れて「商品規格を登録」する（部門が未選択なら選択肢の先頭）。ほかの欄は変えない */
export async function 規格を書き換える(page: Page, 商品ID: string, 規格ID: string, v: { 高額商品コード?: string; 状態別称?: string }, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集`).toBeVisible();
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await smaregi.count()) === 1 && (await smaregi.getAttribute("value")) !== "0") {
    throw new Error(`${what}: スマレジ連携フラグが「連携する」になっている。保存すると外部のスマレジへ送られるので止める`);
  }
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLOptionElement).value, t: (n.textContent ?? "").trim() })).find((o) => o.v !== ""));
    if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
    await section.selectOption(first.v);
    issue(`${what}: 部門が未選択だったので選択肢の先頭の「${first.t}」を選んだ`);
  }
  if (v.高額商品コード !== undefined) await form.locator("#admin_product_class_high_price_code").fill(v.高額商品コード);
  if (v.状態別称 !== undefined) await form.locator("#admin_product_class_memo").fill(v.状態別称);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
  if (v.高額商品コード !== undefined) await expect(form.locator("#admin_product_class_high_price_code"), `${what}: 登録後の高額商品コード`).toHaveValue(v.高額商品コード);
  if (v.状態別称 !== undefined) await expect(form.locator("#admin_product_class_memo"), `${what}: 登録後の状態別称`).toHaveValue(v.状態別称);
}

export type 足す規格 = { 言語: "日本語" | "英語"; 状態: string; 商品コード: string; 価格: string; 高額商品コード?: string };
/** 商品規格一覧の「新規作成」で商品規格を登録し（買取価格0・部門は選択肢の先頭・公開ステータスは公開）、振られた商品規格IDを返す */
export async function 規格を足す(page: Page, 商品ID: string, v: 足す規格, what: string, issue: Issue): Promise<string> {
  await openClassList(page, 商品ID);
  return addClass(page, 商品ID, {
    言語: v.言語, 状態: v.状態, 商品コード: v.商品コード, 基準価格: v.価格, 販売価格: v.価格, 買取価格: "0", 高額商品コード: v.高額商品コード,
  }, what, issue);
}

/** 商品規格登録編集で「商品規格を削除」する（このシードが作った商品規格だけ） */
export async function 規格を削除する(page: Page, 商品ID: string, 規格ID: string, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`));
  await page.waitForLoadState("load");
  await deleteClassOnEdit(page, what, issue);
}

// ---- 在庫の入庫と承認 ----

/**
 * 在庫検索一覧で商品コード・本店・EC-CUBE の行から在庫編集を開き、入庫/その他・在庫変動理由「結合テスト用」・増減数・仕入単価0・承認通知先＝承認者で登録し、
 * 承認者で在庫編集承認一覧（その在庫編集の番号で絞り込む）の1行を承認する。正本の順（登録→承認を商品規格ごと）で行う。
 */
export async function 入庫して承認する(browser: Browser, seedId: string, items: { 商品コード: string; 数量: number }[], issue: Issue): Promise<void> {
  if (items.length === 0) return;
  await 管理者を用意する(browser);
  const shop = await 本店の店名(browser);
  for (const it of items) {
    const what = `${seedId}: ${it.商品コード} の入庫（${it.数量}）`;
    const registrant = await withAdminSession(browser, A1705登録者.account, async (page) => {
      const list = await searchStockByCode(page, { 商品コード: it.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      await list.openEdit(list.row(it.商品コード, shop, "EC-CUBE"));
      await fillStockEdit(page, { changeType: "入庫/その他", reason: "結合テスト用", quantity: String(it.数量), purchasePrice: "0", approverName: A1705承認者.名前 });
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), page.locator('button[type="submit"][form="stock_approval_form"]').click()]);
      for (const w of await expectSaved(page, `${what}の在庫編集`)) issue(`${what}: 警告「${w}」`);
      return loggedInMemberName(page);
    });
    const found = 未承認の入庫の在庫編集番号(it.商品コード, shop, it.数量);
    if (found.length === 0) throw new Error(`${what}: 未承認の在庫編集がDBに無い`);
    await withAdminSession(browser, A1705承認者.account, async (page) => {
      const list = new StockApprovalListPage(page);
      await page.goto(adminUrl(`/product/stock/approval_list?id=${found[0]}`));
      await expect(page.locator("#form_search_stock_approval_list_update"), "在庫編集承認一覧の結果").toBeVisible();
      await page.waitForLoadState("load");
      const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && r.changeType.endsWith("入庫/その他")
        && r.quantity.replace(/,/g, "") === String(it.数量));
      if (rows.length !== 1) throw new Error(`${what}: 在庫編集の番号 ${found[0]} で絞り込んだ在庫編集承認一覧に、合う未承認の行が ${rows.length} 件（1件のはず）`);
      await 承認する(page, rows[0].id, `${what}の承認`, issue);
    });
  }
}

/**
 * 在庫編集承認一覧で行を選び「一括承認」→（確認のモーダルの明細の読み込みを待つ）→「承認する」→「OK」。
 * 明細の読み込みより先に「OK」を押すと成功の表示が消えることがある（M04-13 の記録）ので、読み込みを待ってから押す。
 */
async function 承認する(page: Page, id: string, what: string, issue: Issue): Promise<void> {
  await page.locator(`#form_search_stock_approval_list_update input[name="approval_list_ids[]"][value="${id}"]`).check();
  const bulk = page.locator("#btn_bulk_approve");
  await expect(bulk, "「一括承認」").toBeVisible();
  const lineItems = page.waitForResponse((r) => r.request().method() === "POST" && /\/approval_list\/line_items$/.test(new URL(r.url()).pathname), { timeout: 180_000 });
  await bulk.click();
  const modal = page.locator("#stockApprovalListConfirmModal");
  await expect(modal, "承認の確認").toBeVisible();
  const items = await lineItems;
  if (items.status() !== 200) throw new Error(`${what}: 確認のモーダルの明細の読み込みの応答が ${items.status()}`);
  await page.waitForTimeout(500);
  await modal.locator("#btn_bulk_approve_submit").click();
  const ok = modal.locator('.modal-footer-confirm button[type="submit"]');
  await expect(ok, "最終確認の「OK」").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), ok.click()]);
  for (const w of await expectSaved(page, what)) issue(`${what}: 警告「${w}」`);
}

/** 商品マスターで商品名（日/英）を検索し、該当なしであることを確かめる（010 の「0件であることを確かめる」） */
export async function 商品名で0件を確かめる(page: Page, 商品名: string): Promise<void> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field("product_name").fill(商品名);
  await search.submitAndWaitForResult();
  await expect(page.getByText(/^検索条件に合致するデータが見つかりませんでした$/).first(), `商品名「${商品名}」の商品が商品マスターに無い`).toBeVisible();
}

