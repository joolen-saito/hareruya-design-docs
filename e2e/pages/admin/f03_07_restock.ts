/**
 * F03-07 入荷時通知の試験で使う管理画面の操作。
 * - 会員一覧からメールアドレスで会員IDを読む
 * - 追加システム設定の入荷通知最大数を読む／設定する（共有の設定）
 * - 入荷通知依頼一覧（分析）の検索と結果の読み取り
 * - 商品の取込後の商品規格の整え（公開・高額商品コード）
 */
import { Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

// ---- 会員 ----

/** 会員一覧をメールアドレスで検索し、その会員の会員IDを返す（行の id から読む）。いなければ落とす */
export async function customerIdByEmail(page: Page, メール: string): Promise<string> {
  await page.goto(adminUrl("/customer"));
  await page.waitForLoadState("load");
  await page.locator('[name="admin_search_customer[multi]"]').fill(メール);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click(),
  ]);
  await page.waitForLoadState("load");
  const esc = メール.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rows = page.locator('tr[id^="ex-customer-"]').filter({ has: page.locator("td", { hasText: new RegExp(`^\\s*${esc}\\s*$`) }) });
  const n = await rows.count();
  if (n !== 1) throw new Error(`会員一覧でメールアドレス ${メール} の会員が ${n} 人（1人のはず）`);
  return ((await rows.first().getAttribute("id")) ?? "").replace("ex-customer-", "");
}

// ---- 追加システム設定 ----

const ADD_SYSTEM = "/setting/shop/additional_system";

/** 追加システム設定の入荷通知最大数の、いまの値 */
export async function readArrivalMax(page: Page): Promise<string> {
  await page.goto(adminUrl(ADD_SYSTEM));
  await page.waitForLoadState("load");
  return page.locator('[name="add_system[arrival_alert_max]"]').inputValue();
}

/** 追加システム設定の入荷通知最大数を設定して登録する */
export async function setArrivalMax(page: Page, value: string): Promise<void> {
  await page.goto(adminUrl(ADD_SYSTEM));
  await page.waitForLoadState("load");
  const input = page.locator('[name="add_system[arrival_alert_max]"]');
  await input.fill(value);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('form#point_form button[type="submit"]').click()]);
  await expectSaved(page, `追加システム設定の入荷通知最大数を ${value} にする`);
  expect(await input.inputValue(), "登録後の入荷通知最大数").toBe(value);
}

// ---- 入荷通知依頼一覧（分析） ----

export type 依頼一覧の行 = { 商品ID: string; 言語: string; 商品名: string; 通知待ち: string; 削除: string };

/** 入荷通知依頼一覧（検索項目）の画面を開く */
export async function openRequestSearch(page: Page): Promise<void> {
  await page.goto(adminUrl("/analysis/product-request"));
  await page.waitForLoadState("load");
  await expect(page.locator("form#search_form"), "入荷通知依頼 一覧表示(検索項目)の画面").toBeVisible();
}

/** 依頼日(From)・依頼日(To)を空にし、キーワード検索に商品名を入れて検索ボタンを押し、結果の行を返す（検索項目の画面を開いた状態から） */
export async function searchProductRequests(page: Page, 商品名: string): Promise<依頼一覧の行[]> {
  const form = page.locator("form#search_form");
  await form.locator('[name="admin_analysis_product_request[create_date_from]"]').fill("");
  await form.locator('[name="admin_analysis_product_request[create_date_to]"]').fill("");
  await form.locator('[name="admin_analysis_product_request[multi]"]').fill(商品名);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), form.locator('button[type="submit"]').click()]);
  const rows = await page.locator("#result_list_main__list tbody tr").all();
  return Promise.all(rows.map(async (tr) => {
    const c = async (i: number) => (((await tr.locator(`td:nth-child(${i})`).textContent()) ?? "").replace(/\s+/g, " ").trim());
    return { 商品ID: await c(1), 言語: await c(2), 商品名: await c(3), 通知待ち: await c(4), 削除: await c(5) };
  }));
}

// ---- 商品規格の整え ----

/**
 * 商品規格登録編集画面を直接開き（商品ID・商品規格IDは取込後に一覧で読んだもの）、公開ステータスを公開にし、必要なら高額商品コードを入れて登録する。
 * 部門が未選択なら選択肢の先頭を選ぶ（正本: 任意の部門）。
 */
export async function savePublishedClass(page: Page, a: { productId: string; classId: string; highPriceCode?: string }, what: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${a.productId}/edit/${a.classId}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  const smaregi = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"]:checked');
  if ((await smaregi.count()) === 1 && (await smaregi.getAttribute("value")) !== "0") {
    throw new Error(`${what}: スマレジ連携フラグが「連携する」になっている。保存すると外部のスマレジへ送られるので止める`);
  }
  const section = form.locator("#admin_product_class_Section");
  if (!(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((nodes) => nodes
      .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
    if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
    await section.selectOption(first.value);
    onIssue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ`);
  }
  if (a.highPriceCode !== undefined) await form.locator("#admin_product_class_high_price_code").fill(a.highPriceCode);
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click()]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) onIssue(`${what}: 警告「${w}」`);
  await expect(form.locator("#admin_product_class_Status option:checked"), `${what}: 登録後の公開ステータス`).toHaveText(/^\s*公開\s*$/);
  if (a.highPriceCode !== undefined) await expect(form.locator("#admin_product_class_high_price_code"), `${what}: 登録後の高額商品コード`).toHaveValue(a.highPriceCode);
}
