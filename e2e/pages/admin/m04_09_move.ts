/**
 * M04-08 在庫移動・振替検索一覧・M04-09 在庫移動・振替登録/編集 の画面操作（シードとテストで共通に使う）。
 * 画面の作りは、アプリのテンプレート（admin/Stock の move_*.twig・transfer_*.twig・MoveTransfer/index.twig）と
 * コントローラ（StockMoveController・StockTransferController・StockMoveTransferController）で確かめた。
 * - 在庫移動・振替登録: 在庫検索一覧で行を選び「在庫移動登録」→ 入庫先店舗・入庫先在庫区分・移動点数 →「登録」→ 確認モーダルの「登録」。
 * - ピック・出庫承認申請: 行の「欠品登録」で欠品点数の欄が入力できるようになり、もう一度押す（仮登録）と確定する。
 *   店舗間の移動は承認通知先（所属・メンバー）を選んで「承認申請」→ 確認モーダルの「承認申請」。店舗内の移動は「入庫確定」→ 確認モーダル。
 * - 出庫承認・入庫承認・在庫振替承認: 「承認」→ 確認モーダルの承認／「却下」（却下理由）→ 確認モーダルの却下。入庫承認は「入庫再確認」もある。
 * - 移動入庫承認申請: 行の「差分登録」で差分点数を入れ、「仮登録」で確定する。承認通知先を選んで「承認申請」→ 確認モーダル。
 * - 在庫振替登録: 在庫検索一覧で行を選び「在庫振替登録」→ 振替先の商品コード・振替点数・承認通知先 →「登録」（確認モーダルは無い）。
 * 画面のスクリプトの読み込み（load）を待ってから押す（確認モーダル・入力チェックはスクリプトで動く）。
 */
import { Dialog, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { searchStockList, stockRow, stockRowValues } from "./m04_13_setup";
import { StockApprovalListPage, StockEditInput, StockListPage } from "./stock_edit";

export const 店A = "試験店舗A";
export const 店B = "試験店舗B";
export const 所属A = "試験所属A";
export const 所属B = "試験所属B";
export const 作業者名 = "M04-09作業者";
export const 承認者名 = "M04-09承認者";
export const 入庫担当者名 = "M04-09入庫担当者";
export const 権限なし名 = "M04-09権限なしユーザー";

export type 店 = typeof 店A | typeof 店B;
export type 在庫区分 = "EC-CUBE" | "スマレジ";

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 画面が出したブラウザの確認・警告のポップアップを集める（押した操作が黙って止まったときの理由に使う） */
export function collectDialogs(page: Page): { messages: string[]; stop: () => void } {
  const messages: string[] = [];
  const handler = async (d: Dialog) => { messages.push(d.message()); await d.dismiss().catch(() => undefined); };
  page.on("dialog", handler);
  return { messages, stop: () => page.off("dialog", handler) };
}

/** 画面上部のメッセージ（成功・エラー）。開発用の帯は除く */
export async function topMessages(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map(clean).filter((t) => t && !t.includes("デバッグモードが有効"));
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")) };
}

// ---------------------------------------------------------------- 在庫検索一覧

/** 在庫検索一覧で、店舗・在庫区分・商品コード（部分一致の語）を指定して検索する */
export async function searchStock(page: Page, store: 店, zone: 在庫区分 | null, code: string): Promise<StockListPage> {
  await searchStockList(page, { store, zone, code });
  await page.waitForLoadState("load");
  return new StockListPage(page);
}

/** 在庫検索一覧の、商品コード・店舗・在庫区分が一致する行 */
export function stockListRow(page: Page, code: string, store: 店, zone: 在庫区分): Locator {
  return stockRow(page, code, store, zone);
}

/** 在庫検索一覧で、行の在庫と総原価（数値） */
export async function readStock(page: Page, code: string, store: 店, zone: 在庫区分): Promise<{ 在庫: number; 総原価: number }> {
  await searchStock(page, store, zone, code);
  const v = await stockRowValues(stockListRow(page, code, store, zone));
  return { 在庫: Number(v.在庫.replace(/[,\s¥]/g, "")), 総原価: Number(v.総原価.replace(/[,\s¥]/g, "")) };
}

/** 商品コードの並びに共通する最も長い部分（在庫検索一覧の商品コードは部分一致なので、1回の検索で全部を出す語） */
export function commonPart(codes: string[]): string {
  if (codes.length === 1) return codes[0];
  const first = codes[0];
  for (let len = first.length; len >= 3; len--) {
    for (let i = 0; i + len <= first.length; i++) {
      const sub = first.slice(i, i + len);
      if (codes.every((c) => c.includes(sub))) return sub;
    }
  }
  throw new Error(`商品コード ${codes.join("・")} に共通する部分が無い`);
}

/** 在庫検索一覧で行にチェックを入れる（何度呼んでもよい） */
export async function checkStockRows(page: Page, codes: string[], store: 店, zone: 在庫区分): Promise<void> {
  for (const code of codes) {
    const row = stockListRow(page, code, store, zone);
    await expect(row, `在庫検索一覧の「${code}」${store}・${zone}の行`).toHaveCount(1);
    await row.locator('input[name="productStockIds[]"]').check();
  }
}

/** 在庫検索一覧の「在庫移動登録」または「在庫振替登録」を押す。ポップアップが出たら、その文を返す（画面は移らない） */
export async function pressStockListAction(page: Page, which: "在庫移動登録" | "在庫振替登録", waitForPath: RegExp): Promise<{ moved: boolean; dialogs: string[] }> {
  const button = page.locator(which === "在庫移動登録" ? "#stockMoveBtn" : "#stockTransferBtn");
  await expect(button, `「${which}」`).toBeEnabled();
  const dialogs = collectDialogs(page);
  try {
    const moved = await Promise.all([
      page.waitForURL(waitForPath, { waitUntil: "load", timeout: 60_000 }).then(() => true).catch(() => false),
      button.click(),
    ]).then(([m]) => m);
    return { moved, dialogs: dialogs.messages };
  } finally {
    dialogs.stop();
  }
}

// ---------------------------------------------------------------- 在庫編集（入庫）と承認

export type 入庫 = { code: string; store: 店; zone: 在庫区分; qty: number; unit: number };

/**
 * 在庫検索一覧で店舗・在庫区分・商品コードで検索し、商品名のリンクから在庫編集を開いて、
 * 在庫変動区分「入庫/その他」・在庫変動理由・在庫増減数・仕入単価・承認通知先を入れて登録する（ログイン中の管理者で）。
 */
export async function registerStockIn(page: Page, s: 入庫, reason: string, approverName: string, onWarning: (w: string) => void, fallbackApprover?: string): Promise<void> {
  await searchStock(page, s.store, s.zone, s.code);
  await new StockListPage(page).openEdit(stockListRow(page, s.code, s.store, s.zone));
  const v: StockEditInput = { changeType: "入庫/その他", reason, quantity: String(s.qty), purchasePrice: String(s.unit), approverName };
  try {
    await fillStockInWithoutDepartment(page, v);
  } catch (e) {
    // 求める管理者が承認通知先のメンバーに出ないときは、代わりの管理者を選んで知らせる（補い）
    if (!fallbackApprover) throw e;
    onWarning(`${s.code}（${s.store}・${s.zone}）の在庫編集: 承認通知先のメンバーに「${approverName}」が出ない（${(e as Error).message.split("\n")[0]}）。「${fallbackApprover}」を選んだ`);
    await fillStockInWithoutDepartment(page, { ...v, approverName: fallbackApprover });
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
    page.locator('button[type="submit"][form="stock_approval_form"]').click(),
  ]);
  for (const w of await expectSaved(page, `${s.code}（${s.store}・${s.zone}）の在庫編集（入庫 ${s.qty}・仕入単価 ${s.unit}）`)) onWarning(w);
}

/**
 * 在庫編集の入力。シード表は承認通知先をメンバー（M04-09承認者）だけで書き、所属を書かないので、所属は「指定なし」のままメンバーを選ぶ。
 * 所属の選択肢はその店舗を所属店舗とするメンバーの所属だけで（試験店舗B では試験所属B だけ）、所属を選ぶとメンバーがその所属に絞られる。
 * 共通の部品（stock_edit.ts の fillStockEdit）は、メンバーがいる所属を探して必ず選ぶ作りなので、試験店舗B では M04-09承認者 を選べない。
 */
async function fillStockInWithoutDepartment(page: Page, v: StockEditInput): Promise<void> {
  const form = page.locator("form#stock_approval_form");
  const changeType = form.locator("#admin_stock_approval_new_stock_change_type_detail");
  const options = await changeType.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).filter((o) => o.value));
  const match = options.filter((o) => o.label.replace(/^[^\p{L}\p{N}]+/u, "") === v.changeType);
  if (match.length !== 1) throw new Error(`在庫変動区分「${v.changeType}」が1つではない: ${options.map((o) => o.label).join("、")}`);
  await changeType.selectOption(match[0].value);
  await form.locator("#admin_stock_approval_new_stock_change_reason").fill(v.reason);
  await form.locator("#admin_stock_approval_new_stock_change_quantity").fill(v.quantity);
  await form.locator("#admin_stock_approval_new_purchase_price").fill(v.purchasePrice);
  const department = form.locator("#admin_stock_approval_new_approval_department");
  if (await department.count()) await department.selectOption("");
  const members = form.locator("#admin_stock_approval_new_approval_notification_target_members");
  const names = (await members.locator("option").allTextContents()).map((t) => t.trim()).filter(Boolean);
  if (!names.includes(v.approverName)) throw new Error(`承認通知先（所属は指定なし）のメンバーに「${v.approverName}」がいない（選択肢: ${names.join("、") || "なし"}）`);
  await form.locator("#admin_stock_approval_new_approval_notification_target_members + span.select2 .select2-selection").click();
  const option = page.locator(".select2-container--open .select2-results__option").filter({ hasText: new RegExp(`^\\s*${escapeRe(v.approverName)}\\s*$`) });
  await expect(option, `承認通知先の候補「${v.approverName}」`).toHaveCount(1);
  await option.click();
  await page.keyboard.press("Escape");
  const chosen = await members.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  expect(chosen, "承認通知先に選んだメンバー").toEqual([v.approverName]);
}

/**
 * 在庫編集承認一覧で、店舗を絞り込み、登録者の未承認の在庫編集を、入庫の並び（店舗・在庫区分・増減数）ごとに1行ずつ選んで一括承認する。
 * 一覧に商品コードは出ないので、店舗/在庫区分・増減数・登録者で行を決める（同じ条件の行が複数あれば一覧の先頭から使い、知らせる）。
 */
export async function approveStockIns(page: Page, store: 店, ins: 入庫[], registrantName: string, onIssue: (m: string) => void): Promise<void> {
  const list = new StockApprovalListPage(page);
  await list.open(store);
  const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrantName
    && r.shop.startsWith(store) && r.changeType.endsWith("入庫/その他"));
  const ids: string[] = [];
  for (const s of ins) {
    const hit = rows.filter((r) => r.shop.endsWith(s.zone) && r.quantity.replace(/[,+]/g, "") === String(s.qty) && !ids.includes(r.id));
    if (hit.length === 0) throw new Error(`${s.code}（${s.store}・${s.zone}）の在庫編集（${s.qty}）の未承認の行が在庫編集承認一覧に無い`);
    if (hit.length > 1) onIssue(`${s.store}・${s.zone}・増減数 ${s.qty} の未承認の行が${hit.length}件あり、一覧の先頭を承認した`);
    ids.push(hit[0].id);
  }
  for (const id of ids) await page.locator(`#form_search_stock_approval_list_update input[name="approval_list_ids[]"][value="${id}"]`).check();
  const bulk = page.locator("#btn_bulk_approve");
  await expect(bulk, "「一括承認」").toBeVisible();
  // 確認のモーダルの明細の読み込みが終わってから押す（M04-13 の局所の部品と同じ理由。読み込みが後に終わると成功メッセージが消える）
  const lineItems = page.waitForResponse((r) => r.request().method() === "POST" && /\/approval_list\/line_items$/.test(new URL(r.url()).pathname), { timeout: 180_000 });
  await bulk.click();
  const modal = page.locator("#stockApprovalListConfirmModal");
  await expect(modal, "承認の確認").toBeVisible();
  const items = await lineItems;
  if (items.status() !== 200) throw new Error(`在庫編集の承認: 確認のモーダルの明細の読み込みの応答が ${items.status()}`);
  await page.waitForTimeout(500);
  await modal.locator("#btn_bulk_approve_submit").click();
  const ok = modal.locator('.modal-footer-confirm button[type="submit"]');
  await expect(ok, "最終確認の「OK」").toBeVisible();
  const updated = page.waitForResponse((r) => r.request().method() === "POST" && /\/approval_list\/updated$/.test(new URL(r.url()).pathname), { timeout: 180_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), ok.click()]);
  const res = await updated;
  if (res.status() !== 302) throw new Error(`在庫編集の承認: 承認の要求の応答が ${res.status()}（一覧へ戻る302ではない）`);
  for (const w of await expectSaved(page, `在庫編集の承認（${ids.length}件）`)) onIssue(w);
}

// ---------------------------------------------------------------- 在庫移動・振替登録（在庫移動）

export const moveNewPath = /\/product\/stock\/move\/new(\?.*)?$/;
export const transferNewPath = /\/product\/stock\/transfer\/new(\?.*)?$/;

/** 在庫移動・振替登録（在庫移動）の画面 */
export class MoveNewPage {
  readonly form: Locator;
  constructor(readonly page: Page) {
    this.form = page.locator("form#stock_move_new_form");
  }
  get toStore(): Locator { return this.form.locator('[name="admin_stock_move_new[move_to_base_info]"]'); }
  get toZone(): Locator { return this.form.locator('[name="admin_stock_move_new[move_to_stock_location_id]"]'); }
  get memo(): Locator { return this.form.locator('[name="admin_stock_move_new[memo]"]'); }
  get rows(): Locator { return this.form.locator("#stockMoveDetails tbody tr").filter({ has: this.page.locator('input[name$="[quantity]"]') }); }
  row(code: string): Locator {
    return this.rows.filter({ has: this.page.locator("td small", { hasText: new RegExp(`^\\s*${escapeRe(code)}\\s*$`) }) });
  }
  quantity(code: string): Locator { return this.row(code).locator('input[name$="[quantity]"]'); }
  async ready(): Promise<void> {
    await expect(this.form, "在庫移動・振替登録（在庫移動）の画面").toBeVisible();
    await this.page.waitForLoadState("load");
  }
  /** 入庫先店舗を店名で選ぶ（未選択は ""） */
  async chooseToStore(店名: string): Promise<void> {
    if (店名 === "") { await this.toStore.selectOption(""); return; }
    await chooseByLabel(this.toStore, 店名);
  }
  async chooseToZone(区分: 在庫区分 | ""): Promise<void> {
    if (区分 === "") { await this.toZone.selectOption(""); return; }
    await chooseByLabel(this.toZone, 区分);
  }
  /** 「登録」を押す。確認モーダルが出たかと、ブラウザの入力チェックで止められた項目を返す */
  async pressRegister(): Promise<{ modal: boolean; invalid: string[] }> {
    await this.page.locator("#stock_move_register_btn").click();
    const modal = this.page.locator("#stockMoveConfirmModal");
    const shown = await modal.waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false);
    const invalid = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).querySelectorAll("input, select, textarea"))
      .filter((e) => !(e as HTMLInputElement).validity.valid)
      .map((e) => `${(e as HTMLInputElement).name}: ${(e as HTMLInputElement).validationMessage}`));
    return { modal: shown, invalid };
  }
  /** 確認モーダルの「登録」を押す（画面の移り変わりを待つ） */
  async confirmRegister(): Promise<void> {
    const modal = this.page.locator("#stockMoveConfirmModal");
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
      modal.locator('button[type="submit"]').click(),
    ]);
  }
  /** 確認モーダルの「キャンセル」を押す */
  async cancelRegister(): Promise<void> {
    const modal = this.page.locator("#stockMoveConfirmModal");
    await modal.locator("button.btn-ec-sub").click();
    await expect(modal, "確認モーダルが閉じる").toBeHidden();
  }
}

/** 画面上部の在庫移動・振替情報の欄（見出し→値）。表示されていない見出しは入らない */
export async function moveInfo(page: Page): Promise<Record<string, string>> {
  return page.locator("#stockMoveTransferInfo, #stockTransferBasicInfo, #stockMoveTransferInfoComplete").first().evaluate((root) => {
    const out: Record<string, string> = {};
    for (const label of Array.from(root.querySelectorAll("label"))) {
      const key = (label.textContent ?? "").replace(/\s+/g, " ").trim();
      const row = label.closest(".row");
      const value = row?.querySelector(".form-control-plaintext");
      if (key && value && !(key in out)) out[key] = (value.textContent ?? "").replace(/\s+/g, " ").trim();
    }
    return out;
  });
}

/** 画面に表示された在庫移動・振替ID（「在庫移動・振替ID」の欄。無ければ null） */
export async function shownMoveId(page: Page): Promise<string | null> {
  const info = await moveInfo(page);
  return info["在庫移動・振替ID"] ?? null;
}

/**
 * 在庫検索一覧で出庫元の行を選び「在庫移動登録」→ 入庫先・移動点数・メモを入れて「登録」→ 確認モーダルの「登録」。
 * 移ったピック・出庫承認申請画面のアドレスの在庫移動・振替IDと、画面に表示された番号が同じことを確かめて返す。
 */
export async function registerMove(page: Page, v: {
  from: { store: 店; zone: 在庫区分 }; to: { store: string; zone: 在庫区分 }; lines: { code: string; qty: number }[]; memo?: string;
}, what: string, onWarning: (w: string) => void): Promise<string> {
  const codes = v.lines.map((l) => l.code);
  await searchStock(page, v.from.store, v.from.zone, commonPart(codes));
  await checkStockRows(page, codes, v.from.store, v.from.zone);
  const r = await pressStockListAction(page, "在庫移動登録", moveNewPath);
  if (!r.moved) throw new Error(`${what}: 「在庫移動登録」を押しても在庫移動・振替登録画面へ移らない（ポップアップ: ${r.dialogs.join(" / ") || "なし"}）`);
  const form = new MoveNewPage(page);
  await form.ready();
  await form.chooseToStore(v.to.store);
  await form.chooseToZone(v.to.zone);
  for (const l of v.lines) await form.quantity(l.code).fill(String(l.qty));
  if (v.memo !== undefined) await form.memo.fill(v.memo);
  const p = await form.pressRegister();
  if (!p.modal) throw new Error(`${what}: 「登録」を押しても確認モーダルが出ない（入力チェック: ${p.invalid.join(" / ") || "なし"}）`);
  await form.confirmRegister();
  for (const w of await expectSaved(page, what)) onWarning(w);
  const m = /\/product\/stock\/move\/outbound_approval_request\/(\d+)/.exec(page.url());
  if (!m) throw new Error(`${what}: 登録のあと、ピック・出庫承認申請画面へ移らない（${page.url()}）`);
  const shown = await shownMoveId(page);
  if (shown !== m[1]) throw new Error(`${what}: 画面の在庫移動・振替ID「${shown}」がアドレスの番号 ${m[1]} と違う`);
  return m[1];
}

// ---------------------------------------------------------------- 承認通知先（所属・メンバー）

/** 承認通知先: 所属を選び（メンバーの選択肢がその所属に絞られる）、メンバーを選ぶ。所属を "" にすると未選択 */
export async function chooseApprovalTarget(page: Page, formName: string, 所属: string, メンバー: string[]): Promise<void> {
  const dept = page.locator(`#${formName}_approval_department`);
  const members = page.locator(`#${formName}_approval_notification_target_members`);
  await expect(members, "承認通知先のメンバーの欄").toHaveCount(1);
  if (所属) {
    const labels = (await dept.locator("option").allInnerTexts()).map(clean);
    if (labels.includes(所属)) {
      await dept.selectOption({ label: 所属 });
    } else {
      throw new Error(`承認通知先の所属に「${所属}」が無い（選択肢: ${labels.filter(Boolean).join("、")}）`);
    }
  } else if (await dept.count()) {
    await dept.selectOption("");
  }
  // 所属の切り替えで画面のスクリプトがメンバーの選択肢を作り直す。作り直したあとの選択肢から選ぶ
  const options = await members.locator("option").evaluateAll((os) => os.map((o) => ({ value: (o as HTMLOptionElement).value, label: (o.textContent ?? "").trim() })));
  const values: string[] = [];
  for (const name of メンバー) {
    const hit = options.filter((o) => o.value && o.label === name);
    if (hit.length !== 1) throw new Error(`承認通知先のメンバーに「${name}」が${hit.length}件（選択肢: ${options.map((o) => o.label).filter(Boolean).join("、") || "なし"}）`);
    values.push(hit[0].value);
  }
  await members.selectOption(values);
  await members.evaluate((n) => {
    const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
    if (w.jQuery) w.jQuery(n).trigger("change");
  });
  const chosen = await members.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  expect(chosen, "承認通知先に選んだメンバー").toEqual(メンバー);
}

// ---------------------------------------------------------------- ピック・出庫承認申請

export const outboundRequestPath = (id: string) => new RegExp(`/product/stock/move/outbound_approval_request/${id}$`);
export const outboundApprovalPath = (id: string) => new RegExp(`/product/stock/move/outbound_approval/${id}$`);
export const inboundRequestPath = (id: string) => new RegExp(`/product/stock/move/inbound_approval_request/${id}$`);
export const inboundApprovalPath = (id: string) => new RegExp(`/product/stock/move/inbound_approval/${id}$`);
export const moveCompletePath = (id: string) => new RegExp(`/product/stock/move/${id}$`);
export const transferApprovalPath = (id: string) => new RegExp(`/product/stock/transfer/${id}/approval$`);
export const transferCompletePath = (id: string) => new RegExp(`/product/stock/transfer/${id}$`);
export const moveTransferListPath = /\/product\/stock\/move_transfer(\/page\/\d+)?(\?.*)?$/;
export const stockListPath = /\/product\/stock(\?.*)?$/;

/** ピック・出庫承認申請画面 */
export class OutboundRequestPage {
  readonly form: Locator;
  constructor(readonly page: Page) {
    this.form = page.locator("form#stock_move_outbound_approval_request_form");
  }
  async open(id: string): Promise<void> {
    await this.page.goto(adminUrl(`/product/stock/move/outbound_approval_request/${id}`));
    await this.page.waitForLoadState("load");
  }
  row(code: string): Locator {
    return this.page.locator("tr.js-shortage-row").filter({ has: this.page.locator("td small", { hasText: new RegExp(`^\\s*${escapeRe(code)}\\s*$`) }) });
  }
  toggle(code: string): Locator { return this.row(code).locator(".js-shortage-toggle-btn"); }
  shortage(code: string): Locator { return this.row(code).locator(".js-shortage-quantity-input"); }
  get submit(): Locator { return this.page.locator("#stock_move_outbound_approval_request_submit_btn"); }
  /**
   * シード表の「欠品点数に n を入れて「欠品登録」を押す」。欠品点数の欄が入力できればその順で入れて押す。
   * 画面は「欠品登録」を押すまで欄が読み取り専用なので、入れられないときは画面の順（registerShortage）で仮登録し、補いとして知らせる。
   */
  async registerShortageAsWritten(code: string, qty: number, onSupplement: (m: string) => void): Promise<void> {
    await expect(this.toggle(code), `「${code}」の「欠品登録」`).toHaveText(/^\s*欠品登録\s*$/);
    if (await this.shortage(code).isEditable()) {
      await this.shortage(code).fill(String(qty));
      await this.toggle(code).click();
      return;
    }
    onSupplement(`${code} の欠品点数: シード表は「欠品点数に${qty}を入れて「欠品登録」を押す」。画面は「欠品登録」を押すまで欠品点数の欄が読み取り専用で入れられないので、`
      + "画面の順（「欠品登録」→ 入れる →「仮登録」）で仮登録した（補い。設計書 L0303 の順とも違う）");
    await this.registerShortage(code, qty);
  }
  /** 欠品点数を仮登録する（「欠品登録」→ 入力 →「仮登録」） */
  async registerShortage(code: string, qty: number): Promise<void> {
    await expect(this.toggle(code), `「${code}」の「欠品登録」`).toHaveText(/^\s*欠品登録\s*$/);
    await this.toggle(code).click();
    await expect(this.shortage(code), `「${code}」の欠品点数が入力できる`).not.toHaveAttribute("readonly", /.*/);
    await this.shortage(code).fill(String(qty));
    await this.toggle(code).click();
    await expect(this.shortage(code), `「${code}」の欠品点数が確定する`).toHaveAttribute("readonly", /.*/);
    await expect(this.shortage(code)).toHaveValue(String(qty));
  }
  /** 行の表示（移動前在庫数・移動後在庫数・移動点数） */
  async rowValues(code: string): Promise<{ 移動前在庫数: string; 移動後在庫数: string; 移動点数: string }> {
    const row = this.row(code);
    await expect(row, `ピック・出庫承認申請画面の「${code}」の行`).toHaveCount(1);
    return row.evaluate((tr) => {
      const td = tr.querySelectorAll("td");
      const t = (i: number) => (td[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { 移動前在庫数: t(5), 移動後在庫数: t(6), 移動点数: t(7) };
    });
  }
}

/** ピック・出庫承認申請画面で、承認通知先を選んで「承認申請」→ 確認モーダルの「承認申請」。出庫承認画面へ移ること */
export async function requestOutbound(page: Page, id: string, v: { 所属: string; メンバー: string; shortages?: { code: string; qty: number }[] },
  what: string, onWarning: (w: string) => void): Promise<void> {
  const p = new OutboundRequestPage(page);
  if (!outboundRequestPath(id).test(new URL(page.url()).pathname)) await p.open(id);
  await page.waitForLoadState("load");
  await expect(p.form, `${what}: ピック・出庫承認申請画面`).toBeVisible();
  for (const s of v.shortages ?? []) await p.registerShortageAsWritten(s.code, s.qty, onWarning);
  await chooseApprovalTarget(page, "admin_stock_move_outbound_approval_request", v.所属, [v.メンバー]);
  await expect(p.submit, `${what}: 「承認申請」`).toHaveText(/^\s*承認申請\s*$/);
  await p.submit.click();
  const modal = page.locator("#stockMoveConfirmModalInterStore");
  await expect(modal, `${what}: 承認申請の確認モーダル`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
  for (const w of await expectSaved(page, what)) onWarning(w);
  if (!outboundApprovalPath(id).test(new URL(page.url()).pathname)) throw new Error(`${what}: 承認申請のあと、出庫承認画面へ移らない（${page.url()}）`);
}

/** 店舗内の移動: ピック・出庫承認申請画面で（欠品点数を仮登録して）「入庫確定」→ 確認モーダルの「入庫確定」 */
export async function confirmInStore(page: Page, id: string, v: { shortages?: { code: string; qty: number }[] }, what: string, onWarning: (w: string) => void): Promise<void> {
  const p = new OutboundRequestPage(page);
  if (!outboundRequestPath(id).test(new URL(page.url()).pathname)) await p.open(id);
  await page.waitForLoadState("load");
  for (const s of v.shortages ?? []) await p.registerShortageAsWritten(s.code, s.qty, onWarning);
  await p.submit.click();
  const modal = page.locator("#stockMoveConfirmModalSameStore");
  await expect(modal, `${what}: 入庫確定の確認モーダル`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
  for (const w of await expectSaved(page, what)) onWarning(w);
}

// ---------------------------------------------------------------- 在庫移動・振替検索一覧

/** 在庫移動・振替検索一覧 */
export class MoveTransferList {
  readonly form: Locator;
  constructor(readonly page: Page) {
    this.form = page.locator("form#form_search_stock_move_transfer");
  }
  async open(): Promise<void> {
    await this.page.goto(adminUrl("/product/stock/move_transfer"));
    await this.page.waitForLoadState("load");
    await expect(this.form, "在庫移動・振替検索一覧の検索欄").toBeVisible();
  }
  field(name: string): Locator { return this.form.locator(`[name="admin_search_stock_move_transfer[${name}]"]`); }
  async pressSearch(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
      this.form.locator('button[type="submit"]').first().click(),
    ]);
  }
  /** 在庫移動・振替IDだけを入れて検索する */
  async searchById(id: string): Promise<void> {
    await this.open();
    await this.field("stock_move_transfer_id").fill(id);
    await this.pressSearch();
  }
  check(id: string): Locator { return this.page.locator(`input.js-move-transfer-row-check[value="${id}"]`); }
  row(id: string): Locator { return this.page.locator("table tbody tr").filter({ has: this.check(id) }); }
  /** 一覧の行の在庫移動・振替ID（上から） */
  async listedIds(): Promise<string[]> {
    return this.page.locator("input.js-move-transfer-row-check").evaluateAll((cs) => cs.map((c) => (c as HTMLInputElement).value));
  }
  /** 行の在庫移動・振替IDのリンクを押す（新しいタブで開く作りなので、リンク先を同じタブで開く）。移った先のアドレスを返す */
  async openFromRow(id: string): Promise<string> {
    const link = this.row(id).locator("td").nth(1).locator(":scope > span").first().getByRole("link", { name: id, exact: true });
    await expect(link, `在庫移動・振替ID ${id} のリンク`).toHaveCount(1);
    const href = await link.getAttribute("href");
    if (!href) throw new Error(`在庫移動・振替ID ${id} のリンク先が無い`);
    await this.page.goto(new URL(href, this.page.url()).toString());
    await this.page.waitForLoadState("load");
    return this.page.url();
  }
  /** 行の表示（ステータス・移動指示リストID） */
  async rowState(id: string): Promise<{ ステータス: string; 移動指示リストID: string }> {
    const row = this.row(id);
    await expect(row, `在庫移動・振替検索一覧の在庫移動・振替ID ${id} の行`).toHaveCount(1);
    return row.evaluate((tr) => {
      const td = tr.querySelectorAll("td");
      const spans = td[1]?.querySelectorAll(":scope > span") ?? [];
      return {
        ステータス: (td[6]?.textContent ?? "").replace(/\s+/g, " ").trim(),
        移動指示リストID: (spans[1]?.textContent ?? "").replace(/\s+/g, " ").trim(),
      };
    });
  }
  /** 行を選んで「在庫移動指示作成」を押す。画面が移ったか・ポップアップの文を返す */
  async pressCreateInstruction(ids: string[]): Promise<{ moved: boolean; dialogs: string[]; url: string }> {
    for (const id of ids) {
      await expect(this.check(id), `在庫移動・振替ID ${id} の行の選択欄`).toHaveCount(1);
      await this.check(id).check();
    }
    const dialogs = collectDialogs(this.page);
    try {
      const moved = await Promise.all([
        this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).then(() => true).catch(() => false),
        this.page.locator("#stockMoveTransferCreateInstruction").click(),
      ]).then(([m]) => m);
      return { moved, dialogs: dialogs.messages, url: this.page.url() };
    } finally {
      dialogs.stop();
    }
  }
}

/** 出庫承認画面・入庫承認画面・在庫振替承認画面の「承認」→ 確認モーダルの承認 */
export async function pressApprove(page: Page, buttonId: string): Promise<void> {
  await page.waitForLoadState("load");
  await page.locator(`#${buttonId}`).click();
  const modal = page.locator("#approveConfirmModal");
  await expect(modal, "承認の確認モーダル").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator("#approve_confirm_submit_btn").click()]);
}

/** 出庫承認画面・在庫振替承認画面で、却下理由を入れて「却下」→ 確認モーダルの却下。確認モーダルが出なければ false（入力チェックで止まった） */
export async function pressReject(page: Page, buttonId: string, reason: string | null): Promise<{ modal: boolean; invalid: string[] }> {
  await page.waitForLoadState("load");
  const memo = page.locator('textarea[name$="[rejected_memo]"]');
  if (reason !== null) await memo.fill(reason);
  await page.locator(`#${buttonId}`).click();
  const modal = page.locator("#rejectConfirmModal");
  const shown = await modal.waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false);
  const invalid = shown ? [] : await memo.evaluate((e) => (e as HTMLTextAreaElement).validity.valid ? [] : [(e as HTMLTextAreaElement).validationMessage]);
  if (!shown) return { modal: false, invalid };
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator("#reject_confirm_submit_btn").click()]);
  return { modal: true, invalid };
}

/** 却下理由の欄に、キー入力でなく値として長い文字列を入れる（65535文字などをキー入力すると時間がかかるため） */
export async function setRejectReason(page: Page, value: string): Promise<void> {
  const memo = page.locator('textarea[name$="[rejected_memo]"]');
  await expect(memo, "却下理由の欄").toBeVisible();
  await memo.evaluate((e, v) => { (e as HTMLTextAreaElement).value = v; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); }, value);
}

/** 承認画面の確認モーダルの「キャンセル」 */
export async function cancelModal(page: Page, modalId: string): Promise<void> {
  const modal = page.locator(`#${modalId}`);
  await expect(modal, "確認モーダル").toBeVisible();
  await modal.locator("button.btn-ec-sub").click();
  await expect(modal, "確認モーダルが閉じる").toBeHidden();
}

// ---------------------------------------------------------------- 移動入庫承認申請

export class InboundRequestPage {
  readonly form: Locator;
  constructor(readonly page: Page) {
    this.form = page.locator("form#stock_move_inbound_approval_request_form");
  }
  async open(id: string): Promise<void> {
    await this.page.goto(adminUrl(`/product/stock/move/inbound_approval_request/${id}`));
    await this.page.waitForLoadState("load");
  }
  row(code: string): Locator {
    return this.page.locator("tr.js-difference-row").filter({ has: this.page.locator("td small", { hasText: new RegExp(`^\\s*${escapeRe(code)}\\s*$`) }) });
  }
  toggle(code: string): Locator { return this.row(code).locator(".js-difference-toggle-btn"); }
  diff(code: string): Locator { return this.row(code).locator(".js-difference-quantity-input"); }
  get submit(): Locator { return this.page.locator("#stock_move_inbound_approval_request_submit_btn"); }
  /**
   * シード表の「差分点数に n を入れて「差分登録」を押す」。差分点数の欄が入力できればその順で入れて押す。
   * 画面は「差分登録」を押すまで欄が読み取り専用なので、入れられないときは画面の順（registerDiff）で仮登録し、補いとして知らせる。
   */
  async registerDiffAsWritten(code: string, qty: number, onSupplement: (m: string) => void): Promise<void> {
    await expect(this.toggle(code), `「${code}」の「差分登録」`).toHaveText(/^\s*差分登録\s*$/);
    if (await this.diff(code).isEditable()) {
      await this.diff(code).fill(String(qty));
      await this.toggle(code).click();
      return;
    }
    onSupplement(`${code} の差分点数: シード表は「差分点数に${qty}を入れて「差分登録」を押す」。画面は「差分登録」を押すまで差分点数の欄が読み取り専用で入れられないので、`
      + "画面の順（「差分登録」→ 入れる →「仮登録」）で仮登録した（補い。設計書 L0499 の順とも違う）");
    await this.registerDiff(code, qty);
  }
  /** 差分点数を仮登録する（「差分登録」→ 入力 →「仮登録」） */
  async registerDiff(code: string, qty: number): Promise<void> {
    await expect(this.toggle(code), `「${code}」の「差分登録」`).toHaveText(/^\s*差分登録\s*$/);
    await this.toggle(code).click();
    await expect(this.diff(code), `「${code}」の差分点数が入力できる`).not.toHaveAttribute("readonly", /.*/);
    await this.diff(code).fill(String(qty));
    await this.toggle(code).click();
    await expect(this.diff(code), `「${code}」の差分点数が確定する`).toHaveAttribute("readonly", /.*/);
  }
}

/** 移動入庫承認申請画面で（差分を仮登録し）承認通知先を選んで「承認申請」→ 確認モーダル。入庫承認画面へ移ること */
export async function requestInbound(page: Page, id: string, v: { 所属: string; メンバー: string; diffs?: { code: string; qty: number }[] },
  what: string, onWarning: (w: string) => void): Promise<void> {
  const p = new InboundRequestPage(page);
  if (!inboundRequestPath(id).test(new URL(page.url()).pathname)) await p.open(id);
  await expect(p.form, `${what}: 移動入庫承認申請画面`).toBeVisible();
  for (const d of v.diffs ?? []) await p.registerDiffAsWritten(d.code, d.qty, onWarning);
  await chooseApprovalTarget(page, "admin_stock_move_inbound_approval_request", v.所属, [v.メンバー]);
  await p.submit.click();
  const modal = page.locator("#stockMoveInboundConfirmModal");
  await expect(modal, `${what}: 承認申請の確認モーダル`).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }), modal.locator('button[type="submit"]').click()]);
  for (const w of await expectSaved(page, what)) onWarning(w);
  if (!inboundApprovalPath(id).test(new URL(page.url()).pathname)) throw new Error(`${what}: 承認申請のあと、入庫承認画面へ移らない（${page.url()}）`);
}

// ---------------------------------------------------------------- 在庫振替登録

export class TransferNewPage {
  readonly form: Locator;
  constructor(readonly page: Page) {
    this.form = page.locator("form#stock_transfer_new_form");
  }
  async ready(): Promise<void> {
    await expect(this.page.locator("#stockTransferNewTransferTbody"), "在庫振替初期登録画面").toBeVisible();
    await this.page.waitForLoadState("load");
  }
  get rows(): Locator { return this.page.locator("#stockTransferNewTransferTbody > tr").filter({ has: this.page.locator('input[name$="[dest_product_code]"]') }); }
  row(code: string): Locator {
    return this.rows.filter({ has: this.page.locator("td:first-child small", { hasText: new RegExp(`^\\s*${escapeRe(code)}\\s*$`) }) });
  }
  dest(code: string): Locator { return this.row(code).locator('input[name$="[dest_product_code]"]'); }
  qty(code: string): Locator { return this.row(code).locator('input[name$="[move_transfer_quantity]"]'); }
  /** 振替先の欄の表示（商品名/商品コード・言語・状態・Foil・基準価格） */
  async destInfo(code: string): Promise<Record<string, string>> {
    return this.row(code).evaluate((tr) => {
      const out: Record<string, string> = {};
      for (const td of Array.from(tr.querySelectorAll("[data-destKey], [data-destkey]"))) {
        const k = td.getAttribute("data-destKey") ?? td.getAttribute("data-destkey") ?? "";
        out[k] = (td.textContent ?? "").replace(/\s+/g, " ").trim();
      }
      return out;
    });
  }
  async pressRegister(): Promise<{ moved: boolean; invalid: string[] }> {
    const invalidBefore = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).querySelectorAll("input, select, textarea"))
      .filter((e) => !(e as HTMLInputElement).validity.valid)
      .map((e) => `${(e as HTMLInputElement).name}: ${(e as HTMLInputElement).validationMessage}`));
    const moved = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }).then(() => true).catch(() => false),
      this.form.locator('.c-conversionArea button[type="submit"]').click(),
    ]).then(([m]) => m);
    return { moved, invalid: invalidBefore };
  }
}

/** 在庫検索一覧で振替元の行を選び「在庫振替登録」→ 振替先の商品コード・振替点数・承認通知先を入れて「登録」。在庫振替承認画面の番号を返す */
export async function registerTransfer(page: Page, v: {
  store: 店; zone: 在庫区分; lines: { code: string; dest: string; qty: number }[]; 所属: string; メンバー: string; memo?: string;
}, what: string, onWarning: (w: string) => void): Promise<string> {
  const codes = v.lines.map((l) => l.code);
  await searchStock(page, v.store, v.zone, commonPart(codes));
  await checkStockRows(page, codes, v.store, v.zone);
  const r = await pressStockListAction(page, "在庫振替登録", transferNewPath);
  if (!r.moved) throw new Error(`${what}: 「在庫振替登録」を押しても在庫振替初期登録画面へ移らない（ポップアップ: ${r.dialogs.join(" / ") || "なし"}）`);
  const form = new TransferNewPage(page);
  await form.ready();
  for (const l of v.lines) {
    await form.dest(l.code).fill(l.dest);
    await form.dest(l.code).blur();
    await form.qty(l.code).fill(String(l.qty));
  }
  await chooseApprovalTarget(page, "admin_stock_transfer_new", v.所属, [v.メンバー]);
  if (v.memo !== undefined) await page.locator('[name="admin_stock_transfer_new[memo]"]').fill(v.memo);
  const p = await form.pressRegister();
  if (!p.moved) throw new Error(`${what}: 「登録」を押しても画面が移らない（入力チェック: ${p.invalid.join(" / ") || "なし"}）`);
  for (const w of await expectSaved(page, what)) onWarning(w);
  const m = /\/product\/stock\/transfer\/(\d+)\/approval/.exec(page.url());
  if (!m) throw new Error(`${what}: 登録のあと、在庫振替承認画面へ移らない（${page.url()}）`);
  const shown = await shownMoveId(page);
  if (shown !== m[1]) throw new Error(`${what}: 画面の在庫移動・振替ID「${shown}」がアドレスの番号 ${m[1]} と違う`);
  return m[1];
}

/**
 * 別のウィンドウに開いた画面が、印刷に最適化した画面か（裁定 E13・2026-10-23）。設計（在庫移動戻しリストPDF L0032・L0046・L0066）は、
 * 戻しリストをポップアップで表示し、ページ内で印刷に最適化した状態で表示し、「印刷する」ボタンで印刷ダイアログを出すとする。
 * 文書の種類（PDFのファイルではなく画面か）と、「印刷」を含むボタン・印刷用のスタイル（@media print）の有無を読む。
 */
export async function printWindowFacts(win: Page): Promise<{ contentType: string; printButton: string[]; printRules: boolean; text: string; title: string }> {
  await win.waitForFunction(() => !document.body.innerText.includes("読み込み中"), undefined, { timeout: 60_000 }).catch(() => undefined);
  const v = await win.evaluate(() => {
    const printRules = Array.from(document.styleSheets).some((sh) => {
      try { return Array.from(sh.cssRules).some((r) => r instanceof CSSMediaRule && /print/.test(r.conditionText)); } catch { return false; }
    }) || Array.from(document.querySelectorAll("link[media], style[media]")).some((e) => /print/.test(e.getAttribute("media") ?? ""));
    const buttons = Array.from(document.querySelectorAll("button, input[type=button], a")).map((e) => ((e as HTMLElement).innerText || (e as HTMLInputElement).value || "").trim());
    return { contentType: document.contentType, printButton: buttons.filter((t) => t.includes("印刷")), printRules, text: (document.body.innerText || "").replace(/\s+/g, " ").trim() };
  });
  return { ...v, title: await win.title() };
}
