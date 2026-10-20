/**
 * M04-24 のシードが在庫移動と在庫移動指示を画面から作るための操作。
 * - 在庫検索一覧: 商品コードと店舗で検索し、行を選んで「在庫移動登録」を押す。
 * - 在庫移動・振替登録: 入庫先店舗（店舗IDで選ぶ。同じ店名の閉店の店舗があるため）・入庫先在庫区分・移動点数を入れて「登録」→確認の「登録」。
 * - ピック・出庫承認申請: 承認通知先のメンバーを選んで「承認申請」→確認の「承認申請」。
 * - 在庫移動・振替検索一覧: 在庫移動・振替IDで検索し、行のIDのリンクから出庫承認画面を開く／行を選んで「在庫移動指示作成」を押す／
 *   行の移動指示リストIDを読む。
 * - 出庫承認: 「承認」→確認の「承認する」。
 * 画面のスクリプトが読み込まれる前に押すと、確認のポップアップや入力チェックが働かないので、読み込みを待ってから押す。
 */
import { Dialog, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { StockApprovalListPage, StockListPage } from "./stock_edit";

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 画面が出したブラウザの確認・警告のポップアップを集める（押した操作が黙って止まったときの理由に使う） */
function collectDialogs(page: Page): { messages: string[]; stop: () => void } {
  const messages: string[] = [];
  const handler = async (d: Dialog) => { messages.push(d.message()); await d.dismiss().catch(() => undefined); };
  page.on("dialog", handler);
  return { messages, stop: () => page.off("dialog", handler) };
}

/** 在庫検索一覧で、商品コードと店舗（指定の1店だけ）で検索する */
export async function searchStock(page: Page, 商品コード: string, 店舗ID: string): Promise<StockListPage> {
  const list = new StockListPage(page);
  await page.goto(adminUrl("/product/stock"));
  await page.waitForLoadState("load");
  await expect(list.form, "在庫検索一覧の検索欄").toBeVisible();
  await list.form.locator("#admin_search_stock_list_product_code").fill(商品コード);
  const store = list.form.locator("#admin_search_stock_list_base_info");
  const values = await store.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  if (!values.includes(店舗ID)) throw new Error(`在庫検索一覧の検索欄「店舗」に店舗ID ${店舗ID} の選択肢が無い（開店の店舗だけが出る）`);
  await store.selectOption([店舗ID]);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    list.form.locator('button[type="submit"]').first().click(),
  ]);
  return list;
}

/** 在庫検索一覧の行の在庫数 */
export async function stockOf(row: Locator): Promise<number> {
  await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
  const text = (await row.locator("td.col-stock > div").first().innerText()).replace(/[,\s]/g, "");
  if (!/^-?\d+$/.test(text)) throw new Error(`在庫検索一覧の在庫数を読めない: 「${text}」`);
  return Number(text);
}

export type MoveInput = { 入庫先店舗ID: string; 入庫先在庫区分: string; 移動点数: string };

/**
 * 在庫検索一覧の行を選んで「在庫移動登録」を押し、在庫移動・振替登録画面で入力して「登録」→確認の「登録」を押す。
 * 移ったピック・出庫承認申請画面に表示された在庫移動・振替IDを返す（アドレスの番号と同じであること）。
 */
export async function registerMove(page: Page, row: Locator, v: MoveInput, what: string): Promise<string> {
  await expect(row, `${what}: 在庫検索一覧の対象の行は1件`).toHaveCount(1);
  await row.locator('input[name="productStockIds[]"]').check();
  const dialogs = collectDialogs(page);
  try {
    const moveBtn = page.locator("#stockMoveBtn");
    await expect(moveBtn, `${what}: 「在庫移動登録」が押せる`).toBeEnabled();
    await Promise.all([
      page.waitForURL((u) => u.pathname.endsWith("/product/stock/move/new"), { waitUntil: "load", timeout: 30_000 }).catch(() => {
        throw new Error(`${what}: 「在庫移動登録」を押しても在庫移動・振替登録画面へ移らない（ポップアップ: ${dialogs.messages.join(" / ") || "なし"}）`);
      }),
      moveBtn.click(),
    ]);
  } finally {
    dialogs.stop();
  }
  const form = page.locator("form#stock_move_new_form");
  await expect(form, `${what}: 在庫移動・振替登録画面`).toBeVisible();
  const to = form.locator('[name="admin_stock_move_new[move_to_base_info]"]');
  const toValues = await to.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  if (!toValues.includes(v.入庫先店舗ID)) throw new Error(`${what}: 入庫先店舗に店舗ID ${v.入庫先店舗ID} の選択肢が無い`);
  await to.selectOption(v.入庫先店舗ID);
  await form.locator('[name="admin_stock_move_new[move_to_stock_location_id]"]').selectOption({ label: v.入庫先在庫区分 });
  const quantities = form.locator('input[name^="admin_stock_move_new[stock_move_quantities]"][name$="[quantity]"]');
  await expect(quantities, `${what}: 移動点数の欄は1つ（選んだ在庫1件）`).toHaveCount(1);
  await quantities.fill(v.移動点数);
  await page.locator("#stock_move_register_btn").click();
  const modal = page.locator("#stockMoveConfirmModal");
  await expect(modal, `${what}: 登録の確認`).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    modal.locator('button[type="submit"]').click(),
  ]);
  await expectSaved(page, what);
  const m = /\/product\/stock\/move\/outbound_approval_request\/(\d+)/.exec(page.url());
  if (!m) throw new Error(`${what}: 登録のあと、ピック・出庫承認申請画面へ移らない（${page.url()}）`);
  const shown = await readMoveIdOnScreen(page);
  if (shown !== m[1]) throw new Error(`${what}: 画面の在庫移動・振替ID ${shown} がアドレスの番号 ${m[1]} と違う`);
  return shown;
}

/** 在庫移動の画面上部（在庫移動・振替情報）に表示された在庫移動・振替ID */
export async function readMoveIdOnScreen(page: Page): Promise<string> {
  const label = page.locator("#stockMoveTransferInfo label", { hasText: exact("在庫移動・振替ID") });
  await expect(label, "在庫移動・振替IDの欄").toHaveCount(1);
  const value = label.locator("xpath=ancestor::div[contains(@class,'row')][1]").locator(".form-control-plaintext").first();
  const text = (await value.innerText()).trim();
  if (!/^\d+$/.test(text)) throw new Error(`在庫移動・振替IDを画面から読めない: 「${text}」`);
  return text;
}

/** ピック・出庫承認申請画面で、承認通知先のメンバーに承認者を選び「承認申請」→確認の「承認申請」を押す */
export async function requestOutboundApproval(page: Page, 在庫移動ID: string, 承認者名: string, what: string): Promise<void> {
  if (!page.url().includes(`/product/stock/move/outbound_approval_request/${在庫移動ID}`)) {
    await page.goto(adminUrl(`/product/stock/move/outbound_approval_request/${在庫移動ID}`));
  }
  await page.waitForLoadState("load");
  const members = page.locator("#admin_stock_move_outbound_approval_request_approval_notification_target_members");
  const options = await members.locator("option").evaluateAll((os) => os.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent?.trim() ?? "" })));
  const hit = options.filter((o) => o.value && o.label === 承認者名);
  if (hit.length !== 1) throw new Error(`${what}: 承認通知先のメンバーに「${承認者名}」が${hit.length}件（選択肢: ${options.map((o) => o.label).filter(Boolean).join("、")}）`);
  await members.selectOption([hit[0].value]);
  const chosen = await members.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, `${what}: 承認通知先に選んだメンバー`).toEqual([承認者名]);
  await page.locator("#stock_move_outbound_approval_request_submit_btn").click();
  const modal = page.locator("#stockMoveConfirmModalInterStore");
  await expect(modal, `${what}: 承認申請の確認`).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    modal.locator('button[type="submit"]').click(),
  ]);
  await expectSaved(page, what);
}

/** 在庫移動・振替検索一覧 */
export class MoveTransferListPage {
  readonly form: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form_search_stock_move_transfer");
  }

  /** 在庫移動・振替IDで検索する（ほかの条件は初期値のまま） */
  async searchById(在庫移動ID: string): Promise<void> {
    await this.page.goto(adminUrl("/product/stock/move_transfer"));
    await this.page.waitForLoadState("load");
    await expect(this.form, "在庫移動・振替検索一覧の検索欄").toBeVisible();
    await this.form.locator('[name="admin_search_stock_move_transfer[stock_move_transfer_id]"]').fill(在庫移動ID);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      this.form.locator('button[type="submit"]').first().click(),
    ]);
  }

  row(在庫移動ID: string): Locator {
    return this.page.locator("table tbody tr").filter({ has: this.page.locator(`input.js-move-transfer-row-check[value="${在庫移動ID}"]`) });
  }

  /** 行のステータスと移動指示リストID（無ければ「-」） */
  async rowState(在庫移動ID: string): Promise<{ ステータス: string; 移動指示リストID: string }> {
    const row = this.row(在庫移動ID);
    await expect(row, `在庫移動・振替検索一覧の在庫移動・振替ID ${在庫移動ID} の行`).toHaveCount(1);
    return row.evaluate((tr) => {
      const td = tr.querySelectorAll("td");
      const spans = td[1]?.querySelectorAll(":scope > span") ?? [];
      return {
        ステータス: (td[6]?.textContent ?? "").replace(/\s+/g, " ").trim(),
        移動指示リストID: (spans[1]?.textContent ?? "").replace(/\s+/g, " ").trim(),
      };
    });
  }

  /** 行のIDのリンク先（ステータスに応じた画面へ移る）を、同じタブで開く（リンクは新しいタブで開く作り） */
  async openFromRow(在庫移動ID: string): Promise<void> {
    // 同じ欄の2行目は移動指示リストIDのリンク。番号が同じこともあるので、1行目（在庫移動・振替ID）のリンクだけを見る
    const link = this.row(在庫移動ID).locator("td").nth(1).locator(":scope > span").first().getByRole("link", { name: 在庫移動ID, exact: true });
    await expect(link, `在庫移動・振替ID ${在庫移動ID} のリンク`).toHaveCount(1);
    const href = await link.getAttribute("href");
    if (!href) throw new Error(`在庫移動・振替ID ${在庫移動ID} のリンク先が無い`);
    await this.page.goto(new URL(href, this.page.url()).toString());
    await this.page.waitForLoadState("load");
  }

  /** 行を選んで「在庫移動指示作成」を押す。在庫移動指示一覧へ移り、成功のメッセージが出ること */
  async createInstruction(在庫移動IDs: string[], what: string): Promise<void> {
    for (const id of 在庫移動IDs) await this.row(id).locator("input.js-move-transfer-row-check").check();
    const dialogs = collectDialogs(this.page);
    try {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }).catch(() => {
          throw new Error(`${what}: 「在庫移動指示作成」を押しても画面が移らない（ポップアップ: ${dialogs.messages.join(" / ") || "なし"}）`);
        }),
        this.page.locator("#stockMoveTransferCreateInstruction").click(),
      ]);
    } finally {
      dialogs.stop();
    }
    await expectSaved(this.page, what);
    if (!new URL(this.page.url()).pathname.endsWith("/product/stock/move-instruction")) {
      throw new Error(`${what}: 作成のあと、在庫移動指示一覧へ移らない（${this.page.url()}）`);
    }
  }
}

/**
 * 在庫編集承認一覧を開き、店舗の絞り込みを指定の店舗（店舗IDで選ぶ）だけにして検索する。
 * 共通の部品（stock_edit.ts の StockApprovalListPage.open）は店名で選び、同じ店名の開店の店舗が2つあると止まる
 * （手元のDBには、ほかの機能のシードが作った「本店」（会社名「試験用会社」）もある）ので、店舗IDで選ぶ局所の部品にした。
 * 行の読み取りと承認は、共通の部品の rowValues・approve をそのまま使う。
 */
export async function openStockApprovalListForStore(page: Page, 店舗ID: string): Promise<StockApprovalListPage> {
  await page.goto(adminUrl("/product/stock/approval_list"));
  const form = page.locator("form#form_search_stock_approval_list");
  await expect(form, "在庫編集承認一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
  const store = form.locator("#admin_search_stock_approval_list_base_info");
  const values = await store.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
  if (!values.includes(店舗ID)) throw new Error(`在庫編集承認一覧の店舗の絞り込みに店舗ID ${店舗ID} の選択肢が無い（開店の店舗だけが出る）`);
  await store.selectOption([店舗ID]);
  const chosen = await store.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value));
  expect(chosen, "店舗の絞り込み").toEqual([店舗ID]);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator('button[type="submit"]').first().click()]);
  await expect(page.locator("#form_search_stock_approval_list_update"), "在庫編集承認一覧の結果").toBeVisible();
  await page.waitForLoadState("load");
  return new StockApprovalListPage(page);
}

/** 出庫承認画面で「承認」→確認の「承認する」を押す（承認者のセッションで） */
export async function approveOutbound(page: Page, 在庫移動ID: string, what: string): Promise<void> {
  if (!page.url().includes(`/product/stock/move/outbound_approval/${在庫移動ID}`)) {
    throw new Error(`${what}: 出庫承認画面ではない（${page.url()}）。在庫移動のステータスが出庫承認待ちでない`);
  }
  await page.locator("#outbound_approval_approve_btn").click();
  const modal = page.locator("#approveConfirmModal");
  await expect(modal, `${what}: 承認の確認`).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    modal.locator("#approve_confirm_submit_btn").click(),
  ]);
  await expectSaved(page, what);
}
