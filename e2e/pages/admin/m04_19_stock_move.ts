/**
 * M04-19 のシードで使う、在庫移動（在庫検索一覧 → 在庫移動・振替登録 → ピック・出庫承認申請 → 出庫承認 →
 * 在庫移動振替一覧の在庫移動指示作成 → 在庫移動指示詳細の送状No.の登録）の画面操作。
 * 画面の作りは、アプリの在庫移動のテンプレート・フォームの型・コントローラで確かめた:
 * - 在庫検索一覧で行にチェックを付けて「在庫移動登録」を押すと、在庫移動・振替登録の画面へ移る。
 * - 在庫移動・振替登録の「登録」を押すと確認の窓が出て、窓の「登録」で登録し、ピック・出庫承認申請の画面へ移る。
 * - ピック・出庫承認申請の画面では、行の「欠品登録」を押すと欠品点数の欄が入力できるようになり、もう一度押す（仮登録）と確定する。
 *   店舗間の移動は承認通知先の所属とメンバーが必須。「承認申請」を押すと確認の窓が出て、窓の「承認申請」で出庫承認の画面へ移る。
 * - 出庫承認は、登録した者とは別の、出庫元の店舗に承認の権限を持つメンバーが行う。「承認」→確認の窓の「承認」。
 *   出庫承認のとき、欠品点数のぶんの欠品の在庫変動履歴（欠品減算(移動)）ができる。
 * - 在庫移動振替一覧で移動にチェックを付けて「在庫移動指示作成」を押すと、在庫移動指示ができて在庫移動指示一覧へ移る。
 * - 在庫移動指示詳細で送状No.を入れると「登録」が押せる。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { chooseMembers } from "./m04_19_stock_change_csv";
import { StockListPage } from "./stock_edit";

/** 在庫移動・振替の情報の欄で、見出しの右に表示された値 */
async function infoValue(page: Page, 見出し: string): Promise<string> {
  const row = page.locator(".row.mb-3.align-items-center").filter({ has: page.locator("label", { hasText: new RegExp(`^\\s*${見出し}\\s*$`) }) });
  await expect(row.first(), `「${見出し}」の欄`).toBeVisible();
  return ((await row.first().locator(".form-control-plaintext").first().textContent()) ?? "").trim();
}

/** 在庫移動・振替IDの表示 */
export async function displayedMoveId(page: Page): Promise<string> {
  return infoValue(page, "在庫移動・振替ID");
}

/** 「在庫移動・振替ID」の欄が画面にあればその値（見出しの名前が完全に一致する欄）。無ければ null */
export async function moveIdFieldIfShown(page: Page): Promise<string | null> {
  const row = page.locator(".row.mb-3.align-items-center").filter({ has: page.locator("label", { hasText: /^\s*在庫移動・振替ID\s*$/ }) });
  if ((await row.count()) === 0) return null;
  return ((await row.first().locator(".form-control-plaintext").first().textContent()) ?? "").trim();
}

/** 画面のアドレスのパスのうち、数字だけの区切り（画面が表示している番号）を前から順に返す */
export function idsInAddress(page: Page): string[] {
  return new URL(page.url()).pathname.split("/").filter((s) => /^\d+$/.test(s));
}

/**
 * 在庫検索一覧で商品コードを検索し、出庫元の店舗・在庫区分の行にチェックを付けて「在庫移動登録」を押し、
 * 在庫移動・振替登録の画面で入庫先と移動点数を入れて登録する。登録した在庫移動・振替IDを返す。
 */
export async function registerStockMove(page: Page, v: {
  商品コード: string; 出庫元店舗: string; 入庫先店舗: string; 在庫区分: string; 移動点数: number;
}, what: string, onWarning: (w: string) => void): Promise<string> {
  const stock = new StockListPage(page);
  await stock.searchByProductCode(v.商品コード);
  await page.waitForLoadState("load");
  const row = stock.row(v.商品コード, v.出庫元店舗, v.在庫区分);
  await expect(row, `${what}: 在庫検索一覧の「${v.商品コード}」${v.出庫元店舗}・${v.在庫区分}の行`).toHaveCount(1);
  await row.locator('input[name="productStockIds[]"]').check();
  const moveButton = page.locator("#stockMoveBtn");
  await expect(moveButton, `${what}: 「在庫移動登録」`).toBeEnabled();
  await Promise.all([page.waitForURL(/\/product\/stock\/move\/new/), moveButton.click()]);
  await page.waitForLoadState("load");

  const form = page.locator("form#stock_move_new_form");
  await expect(form, `${what}: 在庫移動・振替登録の画面`).toBeVisible();
  await chooseByLabel(form.locator("#admin_stock_move_new_move_to_base_info"), v.入庫先店舗);
  await chooseByLabel(form.locator("#admin_stock_move_new_move_to_stock_location_id"), v.在庫区分);
  const qty = form.locator('input[name$="[quantity]"]');
  await expect(qty, `${what}: 移動点数の欄は1行`).toHaveCount(1);
  await qty.fill(String(v.移動点数));
  await form.locator("#stock_move_register_btn").click();
  const modal = page.locator("#stockMoveConfirmModal");
  await expect(modal, `${what}: 登録の確認の窓`).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/product\/stock\/move\/outbound_approval_request\/\d+/),
    modal.locator('button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, `${what}（在庫移動の登録）`)) onWarning(w);
  const id = /\/outbound_approval_request\/(\d+)/.exec(page.url())?.[1];
  if (!id) throw new Error(`${what}: 在庫移動の登録のあとのアドレスに在庫移動・振替IDが無い`);
  return id;
}

/** ピック・出庫承認申請の画面で、欠品登録で欠品点数を入れ、承認通知先を選んで「承認申請」を押す */
export async function requestOutboundApproval(page: Page, 在庫移動振替ID: string, v: { 欠品点数: number; 承認者: string },
  what: string, onWarning: (w: string) => void): Promise<void> {
  if (!new RegExp(`/outbound_approval_request/${在庫移動振替ID}$`).test(new URL(page.url()).pathname)) {
    await page.goto(adminUrl(`/product/stock/move/outbound_approval_request/${在庫移動振替ID}`));
  }
  await page.waitForLoadState("load");
  const form = page.locator("form#stock_move_outbound_approval_request_form");
  await expect(form, `${what}: ピック・出庫承認申請の画面`).toBeVisible();
  const rows = form.locator("tr.js-shortage-row");
  await expect(rows, `${what}: 在庫移動内容の行は1行`).toHaveCount(1);
  const toggle = rows.locator(".js-shortage-toggle-btn");
  const input = rows.locator(".js-shortage-quantity-input");
  await expect(toggle, `${what}: 「欠品登録」`).toHaveText(/^\s*欠品登録\s*$/);
  await toggle.click();
  await expect(input, `${what}: 「欠品登録」を押すと欠品点数を入れられる`).not.toHaveAttribute("readonly", /.*/);
  await input.fill(String(v.欠品点数));
  // もう一度押すと仮登録になり、欠品点数の欄が確定する
  await toggle.click();
  await expect(input, `${what}: 仮登録で欠品点数が確定する`).toHaveAttribute("readonly", /.*/);
  await expect(input, `${what}: 欠品点数`).toHaveValue(String(v.欠品点数));

  // 承認通知先: 承認者の所属を選び（選ぶとメンバーの選択肢がその所属に絞られる）、承認者を選ぶ
  const members = form.locator("#admin_stock_move_outbound_approval_request_approval_notification_target_members");
  const option = members.locator("option").filter({ hasText: new RegExp(`^\\s*${v.承認者}\\s*$`) });
  await expect(option, `${what}: 承認通知先に「${v.承認者}」`).toHaveCount(1);
  const department = await option.getAttribute("data-department");
  if (department) {
    await form.locator("#admin_stock_move_outbound_approval_request_approval_department").evaluate((node, d) => {
      const s = node as HTMLSelectElement;
      s.value = d;
      const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
      if (w.jQuery) w.jQuery(s).trigger("change");
      else s.dispatchEvent(new Event("change", { bubbles: true }));
    }, department);
  }
  await chooseMembers(members, [v.承認者]);

  const submit = page.locator("#stock_move_outbound_approval_request_submit_btn");
  await expect(submit, `${what}: 「承認申請」`).toHaveText(/^\s*承認申請\s*$/);
  await submit.click();
  const modal = page.locator("#stockMoveConfirmModalInterStore");
  await expect(modal, `${what}: 承認申請の確認の窓`).toBeVisible();
  await Promise.all([
    page.waitForURL(new RegExp(`/product/stock/move/outbound_approval/${在庫移動振替ID}$`)),
    modal.locator('button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, `${what}（出庫承認の申請）`)) onWarning(w);
}

/** 出庫承認の画面を開き、在庫移動・振替IDの表示を読んでから「承認」→確認の窓の「承認」を押す。表示の在庫移動・振替IDを返す */
export async function approveOutbound(page: Page, 在庫移動振替ID: string, what: string, onWarning: (w: string) => void): Promise<string> {
  await page.goto(adminUrl(`/product/stock/move/outbound_approval/${在庫移動振替ID}`));
  await page.waitForLoadState("load");
  const approve = page.locator("#outbound_approval_approve_btn");
  await expect(approve, `${what}: 出庫承認の画面の「承認」`).toBeVisible();
  const shown = await displayedMoveId(page);
  await approve.click();
  const modal = page.locator("#approveConfirmModal");
  await expect(modal, `${what}: 承認の確認の窓`).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    modal.locator("#approve_confirm_submit_btn").click(),
  ]);
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, `${what}（出庫承認）`)) onWarning(w);
  return shown;
}

/** 在庫移動振替一覧で在庫移動・振替IDを検索し、その行にチェックを付けて「在庫移動指示作成」を押す */
export async function createMoveInstruction(page: Page, 在庫移動振替ID: string, what: string, onWarning: (w: string) => void): Promise<void> {
  await page.goto(adminUrl("/product/stock/move_transfer"));
  await page.waitForLoadState("load");
  const search = page.locator("form#form_search_stock_move_transfer");
  await expect(search, `${what}: 在庫移動振替一覧の検索欄`).toBeVisible();
  await search.locator("#admin_search_stock_move_transfer_stock_move_transfer_id").fill(在庫移動振替ID);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), search.locator('button[type="submit"]').click()]);
  await page.waitForLoadState("load");
  const check = page.locator(`input.js-move-transfer-row-check[value="${在庫移動振替ID}"]`);
  await expect(check, `${what}: 在庫移動振替一覧の在庫移動・振替ID ${在庫移動振替ID} の行`).toHaveCount(1);
  await check.check();
  await Promise.all([
    page.waitForURL(/\/product\/stock\/move-instruction(\?.*)?$/),
    page.locator("#stockMoveTransferCreateInstruction").click(),
  ]);
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, `${what}（在庫移動指示の作成）`)) onWarning(w);
}

/** 画面の移動を待つ上限（入力チェックで送信が止まったときに、テストの制限時間まで待ち続けないため） */
const NAVIGATION_WAIT_MS = 180_000;

/**
 * 在庫移動指示一覧で在庫移動振替IDを検索して在庫移動指示詳細を開き、送状No.を入れて「登録」を押す。
 * 在庫移動指示一覧の検索欄は「出庫元店舗」「入庫先店舗」が必須（ブラウザの入力チェックで、空のままでは送信されない）なので、
 * 在庫移動の出庫元・入庫先の店舗を選んでから検索する。
 */
export async function registerTrackingNo(page: Page, 在庫移動振替ID: string, 送状No: string, 店舗: { 出庫元店舗: string; 入庫先店舗: string },
  what: string, onWarning: (w: string) => void): Promise<void> {
  await page.goto(adminUrl("/product/stock/move-instruction"));
  await page.waitForLoadState("load");
  const search = page.locator('form[name="admin_search_stock_move_instruction"]');
  await expect(search, `${what}: 在庫移動指示一覧の検索欄`).toBeVisible();
  await chooseByLabel(search.locator("#admin_search_stock_move_instruction_move_from_base_info"), 店舗.出庫元店舗);
  await chooseByLabel(search.locator("#admin_search_stock_move_instruction_move_to_base_info"), 店舗.入庫先店舗);
  await search.locator("#admin_search_stock_move_instruction_stock_move_transfer_id").fill(在庫移動振替ID);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: NAVIGATION_WAIT_MS }),
    search.locator('button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  const links: Locator = page.locator('table tbody a[href*="/product/stock/move-instruction/"]').filter({ hasText: /^\s*\d+\s*$/ });
  await expect(links, `${what}: 在庫移動振替ID ${在庫移動振替ID} の在庫移動指示は1件`).toHaveCount(1);
  await Promise.all([page.waitForURL(/\/product\/stock\/move-instruction\/\d+$/), links.click()]);
  await page.waitForLoadState("load");
  const tracking = page.locator("#admin_stock_move_instruction_detail_trackingNo");
  await expect(tracking, `${what}: 在庫移動指示詳細の送状No.`).toBeVisible();
  await tracking.fill(送状No);
  const register = page.locator("#stockMoveInstructionRegisterButton");
  await expect(register, `${what}: 送状No.を入れると「登録」が押せる`).toBeEnabled();
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: NAVIGATION_WAIT_MS }), register.click()]);
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, `${what}（送状No.の登録）`)) onWarning(w);
}
