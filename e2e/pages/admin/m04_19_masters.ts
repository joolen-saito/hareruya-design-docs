/**
 * M04-19 のシードで使う、マスタ・商品の画面操作。
 * - マスタデータ管理の表示件数マスタ（全管理画面の一覧の「表示件数」の選択肢）
 * - 商品マスター（検索結果）から、商品コードで商品IDを読む
 * - 商品規格一覧 → 商品規格登録の画面での状態別称・価格の変更
 * - 在庫編集の画面の商品ID・商品規格ID・在庫IDの表示
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { openClassListFromProductEdit } from "./m03_01_product_class";
import { openProductEdit } from "./product_edit";
import { goodsRootCategoryLink } from "./product_masters";
import { ProductSearchPage } from "./product_search";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * メンバー登録の画面の「所属店舗」の選択肢（値が店舗ID。すべての店舗が並ぶ）から、店舗IDの店名を読む。
 * 店舗一覧は親店舗（店舗ID 1）を表示せず、在庫検索一覧の店舗の選択肢は開店中の店舗だけなので、こちらで読む。
 */
export async function storeNameById(page: Page, 店舗ID: string): Promise<string> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const option = page.locator(`[name="admin_member[baseInfo]"] option[value="${店舗ID}"]`);
  await expect(option, `メンバー登録の所属店舗に店舗ID ${店舗ID} の選択肢が1件`).toHaveCount(1);
  const name = ((await option.textContent()) ?? "").trim();
  if (!name) throw new Error(`店舗ID ${店舗ID} の店名が空`);
  return name;
}

/**
 * グッズ商品CSVの商品カテゴリ(ID)に入れる登録済みのカテゴリID（最上位の「サプライ・グッズ」）。シードがデータを作る前に呼ぶ。
 * カテゴリ管理画面の最上位の「サプライ・グッズ」の表示「ID:… サプライ・グッズ (…)」から読み、グッズ商品CSV登録画面の
 * 商品カテゴリ(ID)の説明が示す「サプライ・グッズ」のIDと同じことを確かめる（グッズ商品CSVはそのIDの配下しか受け付けない）。
 * 違えば何も作らずに止める。説明から読めないときは、報告に出して画面のIDで進める。
 * 空から作ったDBでは「サプライ・グッズ」の下にカテゴリが無いことがあるので、下のカテゴリではなく最上位を使う（M04-24 と同じ）。
 */
export async function goodsCategoryIdForCsv(page: Page, onIssue: (m: string) => void): Promise<string> {
  await page.goto(adminUrl("/product/category"));
  await page.waitForLoadState("load");
  const link = goodsRootCategoryLink(page);
  await expect(link, "カテゴリ管理画面の最上位の「サプライ・グッズ」").toHaveCount(1);
  const onScreen = /^ID:(\d+)\s/.exec(((await link.innerText()) ?? "").trim())?.[1];
  if (!onScreen) throw new Error("「サプライ・グッズ」のカテゴリIDを画面から読めない");
  await page.goto(adminUrl("/product/product_goods_csv_upload"));
  await page.waitForLoadState("load");
  const rows = await page.locator("table.table-striped.table-bordered:not(#csv_import_history_table) tbody tr").evaluateAll((trs) => trs.map((tr) => {
    const cells = tr.querySelectorAll("td");
    return {
      label: cells.length ? [...cells[0].childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim() : "",
      description: cells.length > 1 ? (cells[1].textContent ?? "").trim() : "",
    };
  }));
  const description = rows.find((r) => r.label === "商品カテゴリ(ID)")?.description ?? "";
  const m = /(\d+)\s*[:：]\s*サプライ・グッズ/.exec(description);
  if (!m) {
    onIssue(`グッズ商品CSV登録画面の商品カテゴリ(ID)の説明から「サプライ・グッズ」のIDを読めない（説明「${description}」）。カテゴリ管理画面のID ${onScreen} で進めた`);
    return onScreen;
  }
  if (m[1] !== onScreen) {
    throw new Error(`グッズ商品CSV登録画面の説明は「サプライ・グッズ」を ID ${m[1]} とするが、カテゴリ管理画面の「サプライ・グッズ」は ID ${onScreen}。` +
      "グッズ商品CSVで商品を作れないので、データを作る前に止めた（手元のDBのカテゴリの初期データがアプリの固定のIDと合わない）");
  }
  return onScreen;
}

/** マスタデータ管理で表示件数マスタを開き、行（ID・名称）を読む */
async function openPageCountMaster(page: Page): Promise<{ id: string; name: string }[]> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  const master = page.locator("#admin_system_masterdata_masterdata");
  await expect(master.locator("option", { hasText: "mtb_page_max" }), "マスタデータ管理に表示件数マスタがある").toHaveCount(1);
  await master.selectOption({ label: "mtb_page_max" });
  await page.locator("form#form1 button[type=submit]").click();
  await expect(page.locator("form#form2"), "表示件数マスタの編集欄").toBeVisible();
  const out: { id: string; name: string }[] = [];
  for (const row of await page.locator("form#form2 tbody tr").all()) {
    out.push({ id: await row.locator('input[name$="[id]"]').inputValue(), name: await row.locator('input[name$="[name]"]').inputValue() });
  }
  return out;
}

/**
 * 表示件数マスタに、求める件数の選択肢が無ければ空欄の行に足して保存する（あるものは変えない・消さない）。
 * 保存後の表示件数マスタの名称（件数）の一覧を返す。
 */
export async function ensurePageCounts(page: Page, values: string[], onWarning: (w: string) => void): Promise<string[]> {
  for (const value of values) {
    const rows = await openPageCountMaster(page);
    const same = rows.filter((r) => r.name === value);
    if (same.length > 1) throw new Error(`表示件数マスタに ${value} の行が ${same.length} 件ある`);
    if (same.length === 1) continue;
    if (rows.some((r) => r.id === value)) throw new Error(`表示件数マスタのID ${value} が別の名称に使われている`);
    const index = rows.findIndex((r) => r.id === "" && r.name === "");
    if (index < 0) throw new Error(`表示件数マスタに ${value} を足す空欄の行が無い`);
    const blank = page.locator("form#form2 tbody tr").nth(index);
    await blank.locator('input[name$="[id]"]').fill(value);
    await blank.locator('input[name$="[name]"]').fill(value);
    await page.locator("form#form2 button[type=submit]").click();
    for (const w of await expectSaved(page, `表示件数マスタに ${value} を足す`)) onWarning(w);
  }
  return (await openPageCountMaster(page)).map((r) => r.name).filter(Boolean);
}

export type 商品の行 = { 商品ID: string; 商品コード: string; 商品名: string };

/**
 * 商品マスター（検索入力）の商品コードの欄に語を入れて検索し、結果の行（商品ID・商品コード・商品名）を読む。
 * 結果が1ページに収まらないときは、表示件数を件数以上の選択肢に変えて読む。
 */
export async function productRowsByCode(page: Page, 語: string): Promise<商品の行[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field("product_code").fill(語);
  await search.submitAndWaitForResult();
  const total = await resultCount(page);
  const rows = page.locator('tr[id^="ex-product-"]');
  if (total > (await rows.count())) {
    const options = await page.locator("#page_count_pulldown option").evaluateAll((nodes) => nodes.map((n) => {
      const o = n as HTMLOptionElement;
      return { value: o.value, count: Number(new URL(o.value, location.href).searchParams.get("page_count") ?? "0") };
    }));
    const bigger = options.filter((o) => o.count >= total).sort((a, b) => a.count - b.count)[0];
    if (!bigger) throw new Error(`商品マスターの表示件数に ${total} 件以上の選択肢が無い`);
    await page.goto(new URL(bigger.value, page.url()).toString());
    await page.waitForLoadState("load");
  }
  const read = await rows.evaluateAll((trs) => trs.map((tr) => ({
    商品ID: (tr.querySelector("td:nth-child(2)")?.textContent ?? "").trim(),
    商品名: (tr.querySelector("td:nth-child(3)")?.textContent ?? "").trim(),
    商品コード: (tr.querySelector("td:nth-child(4)")?.textContent ?? "").trim(),
  })));
  if (read.length !== total) throw new Error(`商品マスターの検索結果が ${total} 件なのに、読めた行は ${read.length} 行`);
  for (const r of read) if (!/^\d+$/.test(r.商品ID)) throw new Error(`商品マスターの結果の行から商品IDを読めない: ${r.商品ID}`);
  return read;
}

/** 商品マスター（検索入力）の欄（商品名・カード名・商品コード）に語を入れて検索した結果の件数 */
export async function productCountBy(page: Page, 欄: "商品名" | "カード名" | "商品コード", 語: string): Promise<number> {
  const field = { 商品名: "product_name", カード名: "card_name", 商品コード: "product_code" }[欄];
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field(field).fill(語);
  await search.submitAndWaitForResult();
  return resultCount(page);
}

/** 商品マスターの検索結果の「検索結果：N件が該当しました」の N（該当なしの表示なら0） */
async function resultCount(page: Page): Promise<number> {
  const found = page.getByText(/^検索結果：\d+件が該当しました$/);
  if ((await found.count()) === 0) return 0;
  return Number(/(\d+)件/.exec((await found.first().textContent()) ?? "")?.[1] ?? "0");
}

/** 商品コードが完全に一致する商品の商品IDを、商品コードごとに返す（無い・2件以上は誤り） */
export function idsByExactCode(rows: 商品の行[], codes: string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const code of codes) {
    const hit = rows.filter((r) => r.商品コード === code);
    if (hit.length !== 1) throw new Error(`商品コード「${code}」の商品が ${hit.length} 件（1件のはず）`);
    out.set(code, hit[0].商品ID);
  }
  return out;
}

/** 商品詳細/編集画面の「規格設定」から商品規格一覧へ移り、商品コードの規格の「編集」を押して商品規格登録の画面を開く */
export async function openClassEdit(page: Page, 商品ID: string, 商品コード: string): Promise<void> {
  await openProductEdit(page, 商品ID);
  await openClassListFromProductEdit(page, 商品ID);
  const row = page.locator("#ex-product_class tbody tr").filter({ has: page.getByRole("cell", { name: 商品コード, exact: true }) });
  await expect(row, `商品規格一覧の商品コード「${商品コード}」の行`).toHaveCount(1);
  const edit = row.getByRole("link", { name: "編集", exact: true });
  await Promise.all([page.waitForURL(new RegExp(`/product/product/class/${商品ID}/edit/\\d+$`)), edit.click()]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#form"), "商品規格登録の画面").toBeVisible();
}

/** 商品規格登録の画面の状態別称の欄 */
export const classMemo = (page: Page) => page.locator("form#form #admin_product_class_memo");

/** 商品規格登録の画面で「商品規格を登録」を押す */
export async function saveClass(page: Page, what: string, onWarning: (w: string) => void): Promise<void> {
  const button = page.getByRole("button", { name: "商品規格を登録", exact: true });
  await expect(button, "「商品規格を登録」").toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  for (const w of await expectSaved(page, what)) onWarning(w);
}

/** 商品規格登録の画面で、状態別称を入れて登録する */
export async function setClassMemo(page: Page, 状態別称: string, what: string, onWarning: (w: string) => void): Promise<void> {
  await classMemo(page).fill(状態別称);
  await saveClass(page, what, onWarning);
  await expect(classMemo(page), `${what}: 保存後の状態別称`).toHaveValue(状態別称);
}

/** 商品規格登録の画面で、販売価格と基準価格を入れて登録する */
export async function setClassPrices(page: Page, 価格: string, what: string, onWarning: (w: string) => void): Promise<void> {
  await page.locator("form#form #admin_product_class_price02").fill(価格);
  await page.locator("form#form #admin_product_class_standard_price").fill(価格);
  await saveClass(page, what, onWarning);
  await expect(page.locator("form#form #admin_product_class_price02"), `${what}: 保存後の販売価格`).toHaveValue(new RegExp(`^${価格.replace(/\B(?=(\d{3})+(?!\d))/g, ",?")}$`));
}

/** 在庫編集の画面で、見出しの右に表示された値（商品ID・商品規格ID・在庫IDなど） */
export async function stockEditValue(page: Page, 見出し: string): Promise<string> {
  const row = page.locator(".row.mb-3").filter({ has: page.locator("label.form-label", { hasText: new RegExp(`^\\s*${escapeRe(見出し)}\\s*$`) }) });
  await expect(row.first(), `在庫編集の画面の「${見出し}」`).toBeVisible();
  return ((await row.first().locator(".col-7 > div").first().textContent()) ?? "").trim();
}
