/** M05-11 受注情報編集（メニュー「受注管理」→受注一覧→注文番号）の操作 */
import { Locator, Page, expect } from "@playwright/test";
import { 受注, 受注の商品のカテゴリID } from "../../db/m05_11";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

/** 画面のスクリプトが出すダイアログを記録して受け入れる */
function acceptDialogs(page: Page, onDialog: (m: string) => void): () => void {
  const handler = (d: import("@playwright/test").Dialog) => { onDialog(`${d.type()}「${d.message()}」`); void d.accept(); };
  page.on("dialog", handler);
  return () => page.off("dialog", handler);
}

/** 検索欄が詳細検索の折りたたみの中で隠れていれば、開閉ボタン（1つ目）を押して表示してから使う */
async function 表示する(page: Page, l: Locator): Promise<void> {
  if (await l.isVisible()) return;
  await page.locator('button[data-bs-target="#searchDetail"]').first().click({ timeout: 20_000 });
  await expect(l, "詳細検索条件の欄").toBeVisible();
}

/** 受注ステータスの検索条件を全部選ぶ（既定ではキャンセル・引渡し済みの受注が一覧に出ない）。詳細検索の折りたたみの中 */
async function 全ステータスを選ぶ(page: Page): Promise<void> {
  const box = page.locator("#admin_search_order_status");
  if ((await box.count()) === 0) return;
  if (!(await box.isVisible())) await page.locator('button[data-bs-target="#searchDetail"]').first().click({ timeout: 20_000 });
  const boxes = box.locator('input[type="checkbox"]');
  // 強制のクリックは、ほかの要素（画面下に固定の帯など）に重なった箇所を押して状態が変わらないことがある（2026-11-10 の開発環境の実行
  // M05-11 076・128・129・142）。重なりを避けて押し、それでも変わらなければ、その選択肢の文字（ラベル）を押す
  for (let i = 0; i < (await boxes.count()); i++) {
    const cb = boxes.nth(i);
    if (await cb.isChecked()) continue;
    try {
      await cb.check({ timeout: 10_000 });
    } catch {
      const id = await cb.getAttribute("id");
      if (id) await box.locator(`label[for="${id}"]`).click({ timeout: 10_000 });
    }
    await expect(cb, "受注ステータスの検索条件の選択肢を選んだ").toBeChecked();
  }
}

/** 受注一覧をメールアドレスで検索し、その受注の受注情報編集画面を開く。受注IDと注文番号を返す（1件のはず） */
export async function メールで受注を開く(page: Page, メール: string, 本店: string, what: string): Promise<{ 受注ID: string; 注文番号: string }> {
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
  const emailBox = form.locator("#admin_search_order_email");
  await 表示する(page, emailBox);
  await emailBox.fill(メール);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator("#search_submit").click()]);
  await page.waitForLoadState("load");
  const hrefs = await page.locator('a.action-edit[href*="/order/"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  const ids = [...new Set(hrefs.map((h) => /\/order\/(\d+)\/edit/.exec(h)?.[1]).filter((v): v is string => !!v))];
  if (ids.length !== 1) throw new Error(`${what}: 受注一覧でメールアドレス「${メール}」の受注が ${ids.length} 件（1件のはず）`);
  await Promise.all([page.waitForURL(new RegExp(`/order/${ids[0]}/edit`)), page.locator(`a.action-edit[href$="/order/${ids[0]}/edit"]`).first().click()]);
  await page.waitForLoadState("load");
  const no = page.locator("a.order-history-order-no-link").first();
  await expect(no, `${what}: 受注情報編集画面の注文番号`).toBeVisible();
  return { 受注ID: ids[0], 注文番号: ((await no.textContent()) ?? "").trim() };
}

/**
 * 会員一覧をメールアドレスで検索し、その会員の行に表示された会員IDを返す。
 * 共有の開発環境では、フロントで登録した直後の会員が会員一覧の検索にすぐ出ないことがある（2026-11-11 M05-11 の 127・210・219・247）ので、
 * 0 人のときは10秒おいて最大6回、検索し直す。
 */
export async function 会員IDを一覧から読む(page: Page, メール: string): Promise<string> {
  for (let i = 0; ; i++) {
    await page.goto(adminUrl("/customer"));
    await page.waitForLoadState("load");
    await page.locator('[name="admin_search_customer[multi]"]').fill(メール);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click(),
    ]);
    await page.waitForLoadState("load");
    const rows = page.locator('tr[id^="ex-customer-"]');
    const n = await rows.count();
    if (n === 0 && i < 6) { await page.waitForTimeout(10_000); continue; }
    if (n !== 1) throw new Error(`会員一覧でメールアドレス「${メール}」の会員が ${n} 人（1人のはず）`);
    return ((await rows.first().getAttribute("id")) ?? "").replace("ex-customer-", "");
  }
}

/** 会員情報編集画面でショップ用メモ欄を入れて登録する */
export async function 会員のメモを登録する(page: Page, 会員ID: string, メモ: string): Promise<void> {
  await page.goto(adminUrl(`/customer/${会員ID}/edit`));
  await page.waitForLoadState("load");
  await page.locator("#admin_customer_note").fill(メモ);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }), page.locator("#register_btn").click({ timeout: 20_000 })]);
  await page.waitForLoadState("load");
  await expectSaved(page, "会員情報の保存");
}

/** 会員情報のポイント履歴追加（キャンペーン、特別対応）で、注文番号は空のままポイントを増減する */
export async function ポイントを付与する(page: Page, 会員ID: string, 増減量: number, 注文番号?: string): Promise<void> {
  await page.goto(adminUrl(`/customer/point/${会員ID}/select`));
  await page.waitForLoadState("load");
  await Promise.all([page.waitForURL(/\/customer\/point\/\d+\/granted/), page.locator("a.point-type-select").first().click({ timeout: 20_000 })]);
  await page.waitForLoadState("load");
  if (注文番号) await page.locator("#admin_customer_point_orderNumber").fill(注文番号, { timeout: 20_000 });
  await page.locator("#admin_customer_point_pointChange").fill(String(増減量), { timeout: 20_000 });
  await page.locator("#admin_customer_point_note").selectOption({ index: 1 }, { timeout: 20_000 });
  // ポイント発行日: 1つの入力欄のときは日付を入れ、年・月・日の選択のときは今日を選ぶ
  const d = page.locator("#admin_customer_point_issueDate");
  const today = new Date();
  if ((await d.count()) > 0) {
    const tag = await d.first().evaluate((e) => e.tagName.toLowerCase());
    if (tag === "input") {
      if ((await d.first().inputValue()) === "") await d.first().fill(today.toISOString().slice(0, 10), { timeout: 20_000 });
    } else {
      const sel = async (suffix: string, v: number) => {
        const s = page.locator(`#admin_customer_point_issueDate_${suffix}`);
        if ((await s.count()) > 0) await s.selectOption({ value: String(v) }, { timeout: 20_000 });
      };
      await sel("year", today.getFullYear()); await sel("month", today.getMonth() + 1); await sel("day", today.getDate());
    }
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }), page.locator("form[name=customer_point_form] button[type=submit]").click({ timeout: 20_000 })]);
  await page.waitForLoadState("load");
  await expectSaved(page, "ポイント履歴の保存");
}

export class OrderEditPage {
  readonly status: Locator;
  readonly note: Locator;
  constructor(readonly page: Page) {
    this.status = page.locator("#order_OrderStatus");
    this.note = page.locator("#order_note");
  }
  /** 注文番号から受注情報検索 一覧(検索入力)を経て受注情報編集画面を開く */
  async openByOrderNo(注文番号: string, 本店: string): Promise<void> {
    await this.page.goto(adminUrl("/order"));
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#search_form");
    const tenants = form.locator("#admin_search_order_tenants");
    if ((await tenants.count()) > 0) {
      const selected = await tenants.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value));
      if (selected.length === 0) {
        await tenants.evaluate((node, shop) => {
          const s = node as HTMLSelectElement;
          const hit = Array.from(s.options).find((o) => (o.textContent ?? "").trim() === shop) ?? s.options[0];
          hit.selected = true;
          const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
          if (w.jQuery) w.jQuery(s).trigger("change"); else s.dispatchEvent(new Event("change", { bubbles: true }));
        }, 本店);
      }
    }
    const noBox = form.locator("#admin_search_order_order_number");
    await 表示する(this.page, noBox);
    await noBox.fill(注文番号);
    await 全ステータスを選ぶ(this.page);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator("#search_submit").click()]);
    await this.page.waitForLoadState("load");
    // 古い開発用データに同じ注文番号の受注があるので、受注IDが最大（最新）の行を開く
    await expect(this.page.locator('a.action-edit[href*="/order/"]').first(), `注文番号「${注文番号}」の受注`).toBeVisible();
    const hrefs = await this.page.locator('a.action-edit[href*="/order/"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    const newest = Math.max(...hrefs.map((h) => Number(/\/order\/(\d+)\/edit/.exec(h)?.[1] ?? 0)));
    const link = this.page.locator(`a.action-edit[href$="/order/${newest}/edit"]`).first();
    await Promise.all([this.page.waitForURL(/\/order\/\d+\/edit/), link.click()]);
    await this.page.waitForLoadState("load");
    const opened = /\/order\/(\d+)\/edit/.exec(this.page.url())?.[1];
    const want = 受注(注文番号).受注ID;
    if (opened !== want) throw new Error(`注文番号「${注文番号}」の受注（受注ID ${want}）が受注一覧の検索に出ず、同じ注文番号の別の受注（受注ID ${opened}）が開いた。画面からは目的の受注を開けない`);
    await expect(this.status, "受注情報編集画面の変更後のステータス").toBeVisible();
    // 「商品の追加」の検索は、画面で選ばれているカテゴリの商品に絞られる（空の選択肢が無く、先頭のカテゴリが選ばれている）。
    // 受注の商品が属するカテゴリを選んでから検索する（補い。ケースはカテゴリに触れない）
    const cat = 受注の商品のカテゴリID(注文番号);
    if (cat) {
      await this.page.evaluate((id) => {
        const btn = document.getElementById("searchProductModalButton");
        btn?.addEventListener("click", () => {
          const sel = document.getElementById("admin_search_product_category_id") as HTMLSelectElement | null;
          if (sel) { sel.value = id; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        }, true);
      }, cat);
    }
  }
  async 現在のステータス(): Promise<string> {
    return ((await this.status.locator("option:checked").first().textContent()) ?? "").trim();
  }
  async ステータスを選ぶ(label: string): Promise<void> {
    const have = (await this.status.locator("option").allInnerTexts()).map((t) => t.trim());
    if (!have.includes(label)) throw new Error(`変更後のステータスに「${label}」が無い（${have.join("、")}）`);
    await this.status.selectOption({ label });
  }
  /** 注文者情報の折りたたみを開く（開いていれば何もしない） */
  async 注文者情報を開く(): Promise<void> {
    if (await this.問い合わせ.isVisible()) return;
    await this.page.locator('a[href="#ordererInfo"]').first().click({ timeout: 20_000 });
    await expect(this.問い合わせ, "注文者情報の問い合わせ欄").toBeVisible();
  }
  /** 注文者情報の「会員備考」の表示（文） */
  async 会員備考(): Promise<string> {
    await this.注文者情報を開く();
    const cell = this.page.locator('div.row:has(> label:text-is("会員備考")) > div.col');
    return ((await cell.first().textContent()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 会員備考の欄に入力できる要素（入力欄）の数 */
  async 会員備考の入力欄の数(): Promise<number> {
    await this.注文者情報を開く();
    return this.page.locator('div.row:has(> label:text-is("会員備考")) input, div.row:has(> label:text-is("会員備考")) textarea, div.row:has(> label:text-is("会員備考")) [contenteditable]').count();
  }
  /** 会員IDのリンク */
  get 会員IDのリンク(): Locator { return this.page.locator("#order_CustomerId a"); }
  /** 受注データ更新履歴の行（変更日時・リンクの履歴ID） */
  async 履歴の行(): Promise<{ 日時: string; 履歴ID: number; index: number }[]> {
    const rows = this.page.locator("#orderEditHistory tbody tr");
    const n = await rows.count();
    const out: { 日時: string; 履歴ID: number; index: number }[] = [];
    for (let i = 0; i < n; i++) {
      const href = (await rows.nth(i).locator("a").first().getAttribute("href")) ?? "";
      out.push({ 日時: ((await rows.nth(i).locator("td").first().textContent()) ?? "").trim(), 履歴ID: Number(/(\d+)\/?$/.exec(href.split("?")[0])?.[1] ?? 0), index: i });
    }
    return out;
  }
  /** 受注データ更新履歴の n 行目のリンク（開く履歴画面は別タブ）を押し、開いた履歴画面を返す */
  async 履歴を開く(index = 0): Promise<OrderEditPage> {
    const link = this.page.locator("#orderEditHistory tbody tr").nth(index).locator("a").first();
    await expect(link, "受注データ更新履歴のリンク").toBeVisible();
    const [popup] = await Promise.all([this.page.context().waitForEvent("page", { timeout: 60_000 }), link.click({ timeout: 20_000 })]);
    await popup.waitForLoadState("load");
    return new OrderEditPage(popup);
  }
  /** 店頭販売用整理番号の表示数 */
  async 整理番号の表示数(): Promise<number> { return this.page.getByText("店頭販売用整理番号").count(); }
  async スマレジ取引IDの表示数(): Promise<number> { return this.page.getByText("スマレジ取引ID").count(); }
  /** 画面上部の注文番号の欄の文（括弧内の注文番号を含めて） */
  async 注文番号の欄(): Promise<string> {
    const cell = this.page.locator('div.row:has(.order-history-order-no-link, .order-history-inert) > div.col').filter({ has: this.page.locator(".order-history-order-no-link, .order-history-inert") }).first();
    return ((await cell.textContent()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 注文者の住所3・お届け先の住所3・お届け先の姓 */
  /** 注文者とお届け先の同じ項目（例: "name_name01"）に値を入れる。折りたたみを開いてから */
  async 両方に入れる(items: [string, string][]): Promise<void> {
    await this.注文者情報を開く();
    await this.お届け先情報を開く();
    for (const [id, v] of items) {
      await this.page.locator(`#order_${id}`).fill(v, { timeout: 20_000 });
      await this.page.locator(`#order_Shipping_${id}`).fill(v, { timeout: 20_000 });
    }
  }
  /** 受注商品情報の先頭の明細の価格を入れる（数量1の明細なら、小計がその額になる） */
  async 先頭明細の価格(v: string): Promise<void> {
    const price = this.page.locator('#table-form-field tr.item_box input[name$="[price]"]').first();
    await price.fill(v, { timeout: 20_000 });
  }
  /** お支払情報を開いて、ポイント還元率・ポイント使用を入れる */
  async ポイント設定(還元率: string, 使用: string): Promise<void> {
    const rate = this.page.locator("#order_pointPercentage");
    if (!(await rate.isVisible())) await this.page.locator('a[href="#paymentInfo"]').first().click({ timeout: 20_000 });
    await rate.fill(還元率, { timeout: 20_000 });
    await this.page.locator("#order_spendedPoints").fill(使用, { timeout: 20_000 });
  }
  /** 「受注情報を登録」を押して、画面の移動を待つ（成功メッセージは確かめない）。入力チェックで止まる場合は押しただけで戻る */
  async 登録を押す(onDialog: (m: string) => void): Promise<void> {
    const register = this.page.locator('button[type="submit"][name="mode"][value="register"]').filter({ hasText: /^\s*受注情報を登録\s*$/ }).first();
    await expect(register, "「受注情報を登録」").toBeVisible();
    const off = acceptDialogs(this.page, onDialog);
    try {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), register.click({ timeout: 20_000 })]);
    } catch (e) {
      // 画面の入力チェックで送信されず、画面に留まることもある（明細が無いなど）。留まったことは確かめる側が見る
      if (!/waitForNavigation/.test((e as Error).message)) throw e;
    } finally { off(); }
    await this.page.waitForLoadState("load");
  }
  async お支払情報を開く(): Promise<void> {
    if (!(await this.page.locator("#order_pointPercentage").isVisible())) await this.page.locator('a[href="#paymentInfo"]').first().click({ timeout: 20_000 });
    await expect(this.page.locator("#order_pointPercentage"), "お支払情報のポイント還元率").toBeVisible();
  }
  async 還元率の値(): Promise<string> { await this.お支払情報を開く(); return this.page.locator("#order_pointPercentage").inputValue(); }
  async ポイント発生の値(): Promise<string> { await this.お支払情報を開く(); return this.page.locator("#order_gainedPoints").inputValue(); }
  async ポイント使用の値(): Promise<string> { await this.お支払情報を開く(); return this.page.locator("#order_spendedPoints").inputValue(); }
  get 注文者姓欄(): Locator { return this.page.locator("#order_name_name01"); }
  get 注文者住所3(): Locator { return this.page.locator("#order_address_addr03"); }
  get お届け先姓(): Locator { return this.page.locator("#order_Shipping_name_name01"); }
  get お届け先住所3(): Locator { return this.page.locator("#order_Shipping_address_addr03"); }
  get お届け先の折りたたみ(): Locator { return this.page.locator('a[href="#shippingInfo"]').first(); }
  async お届け先情報を開く(): Promise<void> {
    if (await this.お届け先姓.isVisible()) return;
    await this.お届け先の折りたたみ.click({ timeout: 20_000 });
    await expect(this.お届け先姓, "お届け先情報のお名前（姓）").toBeVisible();
  }
  get 問い合わせ(): Locator { return this.page.locator("#order_message"); }
  /** 注文者のお名前（姓）を入れる（注文者情報の折りたたみを開いてから） */
  async 注文者姓を入れる(v: string): Promise<void> {
    await this.注文者情報を開く();
    await this.page.locator("#order_name_name01").fill(v);
  }
  /** 注文者のメールアドレスを入れる（注文者情報の折りたたみを開いてから） */
  async メールを入れる(v: string): Promise<void> {
    await this.注文者情報を開く();
    await this.page.locator("#order_email").fill(v);
  }
  async ステータスを変更する(onDialog: (m: string) => void): Promise<void> {
    const off = acceptDialogs(this.page, onDialog);
    try {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }),
        this.page.locator("button.change-status").first().click(),
      ]);
    } finally { off(); }
    await this.page.waitForLoadState("load");
  }
  async 受注情報を登録する(onDialog: (m: string) => void): Promise<string[]> {
    const register = this.page.locator('button[type="submit"][name="mode"][value="register"]').filter({ hasText: /^\s*受注情報を登録\s*$/ }).first();
    await expect(register, "「受注情報を登録」").toBeVisible();
    const off = acceptDialogs(this.page, onDialog);
    try {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }), register.click()]);
    } finally { off(); }
    await this.page.waitForLoadState("load");
    return expectSaved(this.page, "受注情報の保存");
  }
}

/** 受注情報編集の、商品コードの明細の行（商品コードが一致する行） */
export function 明細行(page: Page, 商品コード: string): Locator {
  const esc = 商品コード.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.locator("#table-form-field tr.item_box").filter({ has: page.locator("span.product-code", { hasText: new RegExp(`^\\s*${esc}\\s*$`) }) });
}

export class OrderItemsEdit {
  constructor(readonly page: Page) {}
  /** 明細の「削除」を押す（削除の確認モーダルが開く） */
  async 削除を押す(商品コード: string): Promise<void> {
    const row = 明細行(this.page, 商品コード);
    await expect(row, `明細に商品コード「${商品コード}」の行が1行`).toHaveCount(1);
    await row.locator("button.btn-order-item-delete").click({ timeout: 20_000 });
    await expect(this.page.locator("#deleteOrderItemModal"), "明細の削除確認モーダル").toBeVisible();
  }
  /** 削除の確認モーダルで削除を確定する */
  async 削除を確定する(商品コード: string): Promise<void> {
    await this.page.locator("#deleteOrderItemModalConfirm").click({ timeout: 20_000 });
    await expect(明細行(this.page, 商品コード), `削除した商品コード「${商品コード}」の行`).toHaveCount(0);
  }
  /** 「商品の追加」を押し、検索語で検索して、商品コードの規格を選んで「決定」（追加ボタン）を押す */
  async 商品を追加する(検索語: string, 商品コード: string): Promise<void> {
    await this.page.locator('a[data-bs-target="#addProduct"]').first().click({ timeout: 20_000 });
    const modal = this.page.locator("#addProduct");
    await expect(modal, "商品の追加モーダル").toBeVisible();
    await modal.locator('input[type="text"]').first().fill(検索語, { timeout: 20_000 });
    await modal.locator("#searchProductModalButton").click({ timeout: 20_000 });
    const list = this.page.locator("#searchProductModalList");
    const row = list.locator("tr").filter({ has: this.page.locator(`option[data-product-code="${商品コード}"]`) });
    await expect(row, `検索結果に商品コード「${商品コード}」の規格を持つ商品が1件`).toHaveCount(1, { timeout: 60_000 });
    const value = await row.locator(`option[data-product-code="${商品コード}"]`).first().getAttribute("value");
    await row.locator("select").first().selectOption(value!, { timeout: 20_000 });
    await row.locator("button.add-order-item").click({ timeout: 20_000 });
    await expect(明細行(this.page, 商品コード), `追加した商品コード「${商品コード}」の明細`).toHaveCount(1, { timeout: 60_000 });
  }
  async 明細に入れる(商品コード: string, v: { 価格?: string; 数量?: string }): Promise<void> {
    const row = 明細行(this.page, 商品コード);
    await expect(row, `明細に商品コード「${商品コード}」の行が1行`).toHaveCount(1);
    if (v.価格 !== undefined) await row.locator('input[name$="[price]"]').fill(v.価格, { timeout: 20_000 });
    if (v.数量 !== undefined) await row.locator('input[name$="[quantity]"]').fill(v.数量, { timeout: 20_000 });
  }
  /** 送料・手数料・値引き */
  async 金額欄(v: { 送料?: string; 手数料?: string; 値引き?: string }): Promise<void> {
    if (v.送料 !== undefined) await this.page.locator("#order_delivery_fee_total").fill(v.送料, { timeout: 20_000 });
    if (v.手数料 !== undefined) await this.page.locator("#order_charge").fill(v.手数料, { timeout: 20_000 });
    if (v.値引き !== undefined) await this.page.locator("#order_discount").fill(v.値引き, { timeout: 20_000 });
  }
}

/** 受注情報の日付の「クリア」を押す（押すと画面が再読込される）。ピック中は注文確定日 */
export type 日付欄 = "ピック中" | "入金日" | "出荷指示日" | "出荷日" | "キャンセル日" | "店頭予約";
const 日付の対象: Record<日付欄, string> = { ピック中: "confirm_date", 入金日: "payment_date", 出荷指示日: "commit_date", 出荷日: "shipping_date", キャンセル日: "cancel_date", 店頭予約: "otc_rsv_date" };
export async function 日付をクリアする(page: Page, 欄: 日付欄): Promise<void> {
  const btn = page.locator(`button.clear-date[data-target="${日付の対象[欄]}"]`);
  await expect(btn, `${欄}の「クリア」ボタン`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }), btn.click({ timeout: 20_000 })]);
  await page.waitForLoadState("load");
}
/** 折りたたみのブロック（タイトルのリンクと中身） */
export const ブロック: Record<"注文者情報" | "お支払情報" | "お届け先情報" | "ポイント連携エラー", { 見出し: string; 中身: string }> = {
  注文者情報: { 見出し: 'a[href="#ordererInfo"]', 中身: "#ordererInfo" },
  お支払情報: { 見出し: 'a[href="#paymentInfo"]', 中身: "#paymentInfo" },
  お届け先情報: { 見出し: 'a[href="#shippingInfo"]', 中身: "#shippingInfo" },
  ポイント連携エラー: { 見出し: 'a[href="#pointErrorMessage"]', 中身: "#pointErrorMessage" },
};
