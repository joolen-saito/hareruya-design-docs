/** 在庫検索一覧・在庫編集（承認依頼の登録）・在庫編集承認一覧の画面操作。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

/** 画面上部の「○○ 様」から、ログイン中の管理者の名前を読む */
export async function loggedInMemberName(page: Page): Promise<string> {
  const text = ((await page.locator("header").first().textContent()) ?? "").replace(/\s+/g, " ");
  const m = text.match(/(\S+)\s*様/);
  if (!m) throw new Error("画面上部からログイン中の管理者の名前を読めない");
  return m[1];
}

/** 在庫検索一覧 */
export class StockListPage {
  readonly form: Locator;
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#searchStockListForm");
    this.rows = page.locator("table tbody tr").filter({ has: page.locator('input[name="productStockIds[]"]') });
  }

  async searchByProductCode(code: string): Promise<void> {
    await this.page.goto(adminUrl("/product/stock"));
    await expect(this.form, "在庫検索一覧の検索欄").toBeVisible();
    await this.form.locator("#admin_search_stock_list_product_code").fill(code);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.form.locator('button[type="submit"]').click(),
    ]);
  }

  /** 店舗名と在庫区分（EC-CUBE・スマレジ）が一致する行 */
  row(code: string, shopName: string, locationName: string): Locator {
    return this.rows
      .filter({ has: this.page.locator("td.col-name .text-muted", { hasText: new RegExp(`^\\s*${code}\\s*$`) }) })
      .filter({ has: this.page.locator("td.col-shop > div:first-child", { hasText: new RegExp(`^\\s*${shopName}\\s*$`) }) })
      .filter({ has: this.page.locator("td.col-shop > div.text-muted", { hasText: new RegExp(`^\\s*${locationName}\\s*$`) }) });
  }

  /** 行の商品名リンクから在庫編集を開く */
  async openEdit(row: Locator): Promise<void> {
    await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
    await row.locator("td.col-name a").click();
    await expect(this.page.locator("form#stock_approval_form"), "在庫編集の画面").toBeVisible();
    await this.page.waitForLoadState("load");
  }
}

export type StockEditInput = {
  /** 在庫変動区分の表示名（先頭の印を除いた「区分/理由」の形。例: 入庫/その他） */
  changeType: string;
  reason: string;
  quantity: string;
  purchasePrice: string;
  /** 承認通知先に選ぶ管理者の名前（登録者とは別の、承認権限を持つ管理者） */
  approverName: string;
};

/** 在庫編集の入力と「登録する」 */
export async function registerStockEdit(page: Page, v: StockEditInput, what: string, onWarning: (w: string) => void): Promise<void> {
  await fillStockEdit(page, v);
  await page.locator('button[type="submit"][form="stock_approval_form"]').click();
  for (const warning of await expectSaved(page, what)) onWarning(warning);
}

/** 在庫編集の入力だけ（登録はしない） */
export async function fillStockEdit(page: Page, v: StockEditInput): Promise<void> {
  const form = page.locator("form#stock_approval_form");
  const changeType = form.locator("#admin_stock_approval_new_stock_change_type_detail");
  const options = await changeType.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).filter((o) => o.value));
  // 表示名の先頭には入庫・廃棄を表す印が付く
  const match = options.filter((o) => o.label.replace(/^[^\p{L}\p{N}]+/u, "") === v.changeType);
  if (match.length !== 1) throw new Error(`在庫変動区分「${v.changeType}」が1つではない: ${options.map((o) => o.label).join("、")}`);
  await changeType.selectOption(match[0].value);
  await form.locator("#admin_stock_approval_new_stock_change_reason").fill(v.reason);
  await form.locator("#admin_stock_approval_new_stock_change_quantity").fill(v.quantity);
  await form.locator("#admin_stock_approval_new_purchase_price").fill(v.purchasePrice);

  // 承認通知先: 部署を選ぶと、その部署のメンバーだけが選べる。承認する管理者のいる部署を探して選ぶ
  const department = form.locator("#admin_stock_approval_new_approval_department");
  const members = form.locator("#admin_stock_approval_new_approval_notification_target_members");
  const departments = await department.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).filter((o) => o.value));
  let found = false;
  for (const d of departments) {
    await department.selectOption(d.value);
    const names = (await members.locator("option").allTextContents()).map((t) => t.trim());
    if (names.includes(v.approverName)) { found = true; break; }
  }
  if (!found) throw new Error(`承認通知先のメンバーに「${v.approverName}」がいる部署が無い`);
  await form.locator("#admin_stock_approval_new_approval_notification_target_members + span.select2 .select2-selection").click();
  const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: new RegExp(`^\\s*${v.approverName}\\s*$`) });
  await expect(option, `承認通知先の候補「${v.approverName}」`).toHaveCount(1);
  await option.click();
  await page.keyboard.press("Escape");
  const chosen = await members.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, "承認通知先に選んだメンバー").toEqual([v.approverName]);
}

/** 在庫編集承認一覧。未承認の行を選び「一括承認」→「承認する」→「OK」 */
export class StockApprovalListPage {
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.rows = page.locator("#form_search_stock_approval_list_update tbody tr").filter({ has: page.locator('input[name="approval_list_ids[]"]') });
  }

  /**
   * 一覧を開き、店舗の絞り込みを指定の店舗だけにして検索する。
   * 店舗の絞り込みの初期値はログイン中の管理者の既定の検索店舗で、承認したい行の店舗とは限らない（ローカルの初期管理者は成田店）。
   */
  async open(shopName: string): Promise<void> {
    await this.page.goto(adminUrl("/product/stock/approval_list"));
    const form = this.page.locator("form#form_search_stock_approval_list");
    await expect(form, "在庫編集承認一覧の検索欄").toBeVisible();
    await this.page.waitForLoadState("load");
    const box = form.locator("#admin_search_stock_approval_list_base_info + span.select2");
    for (let i = 0; i < 50 && await box.locator(".select2-selection__choice__remove").count() > 0; i++) {
      await box.locator(".select2-selection__choice__remove").first().click();
      await this.page.keyboard.press("Escape");
    }
    await box.locator(".select2-selection").click();
    const option = this.page.locator(".select2-container--open .select2-results__option").filter({ hasText: new RegExp(`^\\s*${shopName}\\s*$`) });
    await expect(option, `店舗の候補「${shopName}」`).toHaveCount(1);
    await option.click();
    await this.page.keyboard.press("Escape");
    const chosen = await form.locator("#admin_search_stock_approval_list_base_info").evaluate((n) =>
      Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
    expect(chosen, "店舗の絞り込み").toEqual([shopName]);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator('button[type="submit"]').click()]);
    await expect(this.page.locator("#form_search_stock_approval_list_update"), "在庫編集承認一覧の結果").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /** 行の表示（承認状態・店舗/在庫区分・増減数・在庫変動区分・登録者） */
  async rowValues(): Promise<{ id: string; status: string; shop: string; quantity: string; changeType: string; registrant: string }[]> {
    return this.rows.evaluateAll((trs) => trs.map((tr) => {
      const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
      return {
        id: (tr.querySelector('input[name="approval_list_ids[]"]') as HTMLInputElement).value,
        status: td(1), shop: td(3), quantity: td(5), changeType: td(7), registrant: td(9),
      };
    }));
  }

  async approve(ids: string[], what: string, onWarning: (w: string) => void): Promise<void> {
    for (const id of ids) await this.page.locator(`#form_search_stock_approval_list_update input[name="approval_list_ids[]"][value="${id}"]`).check();
    const bulk = this.page.locator("#btn_bulk_approve");
    await expect(bulk, "「一括承認」").toBeVisible();
    await bulk.click();
    const modal = this.page.locator("#stockApprovalListConfirmModal");
    await expect(modal, "承認の確認").toBeVisible();
    await modal.locator("#btn_bulk_approve_submit").click();
    const ok = modal.locator('.modal-footer-confirm button[type="submit"]');
    await expect(ok, "最終確認の「OK」").toBeVisible();
    await ok.click();
    for (const warning of await expectSaved(this.page, what)) onWarning(warning);
  }
}

/** 商品規格一覧の「新規作成」から、日本語・指定の状態の規格を1件登録する（057） */
export async function addClassFromList(page: Page, v: {
  conditionCode: string; code: string; japaneseLanguageId: string; sectionName: string; sectionId: string;
}, onWarning: (w: string) => void): Promise<void> {
  await page.locator('#ex-product_class-header a[href$="/new"]').click();
  const form = page.locator("form#form");
  await expect(form, "商品規格登録").toBeVisible();
  const language = form.locator("#admin_product_class_Language");
  await chooseByLabel(language, "日本語");
  await expect(language, "商品CSVと同じ日本語の番号").toHaveValue(v.japaneseLanguageId);
  const condition = form.locator("#admin_product_class_CardCondition");
  const option = condition.locator(`option[data-code="${v.conditionCode}"]`);
  await expect(option, `状態 ${v.conditionCode} の選択肢`).toHaveCount(1);
  await condition.selectOption((await option.getAttribute("value"))!);
  await form.locator("#admin_product_class_code").fill(v.code);
  await form.locator("#admin_product_class_price02").fill("100");
  await form.locator("#admin_product_class_standard_price").fill("100");
  await form.locator("#admin_product_class_buy_price").fill("10");
  const section = form.locator("#admin_product_class_Section");
  await chooseByLabel(section, v.sectionName);
  await expect(section, "部門の選択値と共有シードの採番ID").toHaveValue(v.sectionId);
  if (!(await form.locator("#admin_product_class_sale_type").inputValue())) throw new Error("商品規格画面で必須の販売種別が未選択。正本に指定がなく補えない");
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await form.getByRole("button", { name: "商品規格を登録" }).click();
  for (const warning of await expectSaved(page, `${v.code} の ${v.conditionCode} 商品規格登録`)) onWarning(warning);
  await page.getByRole("link", { name: "商品規格一覧", exact: true }).click();
  await expect(page.locator("#ex-product_class tbody tr").filter({ has: page.getByRole("cell", { name: v.code, exact: true }) }), `${v.code} が規格一覧にある`).toHaveCount(1);
}
