/**
 * M04-22 在庫移動・振替CSV登録の画面操作と、試験用の権限（承認権限なし）の用意。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのソースで確かめたこと）:
 * - 在庫移動・振替検索一覧の上部に「在庫移動CSV登録」「在庫振替CSV登録」のボタンがあり、押すとそれぞれのモーダルが開く
 *   （画面のスクリプト（Bootstrap のモーダル）で開くので、読み込みを待ってから押す）。
 * - 権限管理は、権限（行）ごとに「承認権限」の列のチェック欄を持つ表。チェックが付いている＝許可、外す＝拒否。
 *   新しい権限は拒否の設定を持たないので、はじめは承認権限を含めてすべて許可になる。
 *   画面には承認権限のほかの列（在庫管理の機能ごとの列）は無い。
 * - マスタデータ管理で権限のマスター（mtb_authority）を選ぶと、ID・名称の入力欄の行と、追加用の空の行が出る。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

/** マスタデータ管理でマスターを選んで開く。行は「ID」「名称」の2つの入力欄 */
async function openMaster(page: Page, table: string): Promise<Locator> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  const select = page.locator("form#form1 select").first();
  await expect(select, "マスタデータ管理のマスタの選択欄").toBeVisible();
  await chooseByLabel(select, table);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("form#form1 button[type=submit]").click()]);
  const rows = page.locator("form#form2 tbody tr");
  await expect(rows.first(), `マスター ${table} の行`).toBeVisible();
  return rows;
}

async function masterRows(rows: Locator): Promise<{ id: string; name: string; row: Locator }[]> {
  const out: { id: string; name: string; row: Locator }[] = [];
  for (const row of await rows.all()) {
    const inputs = row.locator("input[type=text], input:not([type])");
    if ((await inputs.count()) < 2) continue;
    out.push({ id: (await inputs.nth(0).inputValue()).trim(), name: (await inputs.nth(1).inputValue()).trim(), row });
  }
  return out;
}

/**
 * マスタデータ管理で、権限のマスターに名称の行が無ければ、空の行に「いまの最大のID＋1」と名称を入れて登録する。
 * あればそのまま使う。権限のIDを返す。
 */
export async function ensureAuthorityMasterRow(page: Page, name: string): Promise<string> {
  const table = "mtb_authority";
  let rows = await openMaster(page, table);
  const all = await masterRows(rows);
  const found = all.filter((r) => r.name === name);
  if (found.length > 1) throw new Error(`権限のマスターに名称「${name}」の行が複数ある`);
  if (found.length === 1) return found[0].id;
  const empty = all.filter((r) => r.id === "" && r.name === "");
  if (empty.length !== 1) throw new Error(`権限のマスターに、追加用の空の行が1行ではない（${empty.length}行）`);
  const next = String(Math.max(0, ...all.map((r) => Number(r.id)).filter((n) => Number.isInteger(n) && n > 0)) + 1);
  const inputs = empty[0].row.locator("input[type=text], input:not([type])");
  await inputs.nth(0).fill(next);
  await inputs.nth(1).fill(name);
  await page.locator("form#form2 button[type=submit]").click();
  await expectSaved(page, `権限のマスターへの「${name}」の登録`);
  rows = await openMaster(page, table);
  const saved = (await masterRows(rows)).filter((r) => r.name === name);
  if (saved.length !== 1) throw new Error(`権限「${name}」を登録したが、マスターに1行として出ない`);
  return saved[0].id;
}

/** 権限管理の表で、権限の名前の行の「承認権限」のチェック欄 */
function approvalBox(page: Page, authorityName: string): Locator {
  const row = page.locator("#table-authority tbody tr").filter({
    has: page.locator("th:first-child", { hasText: new RegExp(`^\\s*${authorityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }),
  });
  return row.locator('input.permission-checkbox[data-url="/approval_authority"]');
}

/** 権限管理を開き、見出しに「承認権限」の列があることを確かめる */
async function openAuthorityMatrix(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/setting/system/authority"));
  expect(res?.status(), "権限管理の応答").toBe(200);
  await expect(page.locator("#table-authority"), "権限管理の表").toBeVisible();
  await page.waitForLoadState("load");
  const heads = (await page.locator("#table-authority thead tr").nth(1).locator("th").allInnerTexts()).map((t) => t.trim());
  if (!heads.includes("承認権限")) throw new Error(`権限管理の表に「承認権限」の列が無い（列: ${heads.join("、")}）`);
}

/**
 * 権限管理で、権限の名前の行の「承認権限」のチェックを外して「登録」を押す（外れていれば何もしない）。
 * 開き直して外れていることを確かめる。
 */
export async function denyApprovalForAuthority(page: Page, authorityName: string): Promise<void> {
  await openAuthorityMatrix(page);
  const box = approvalBox(page, authorityName);
  await expect(box, `権限管理に権限「${authorityName}」の承認権限のチェック欄が1つ`).toHaveCount(1);
  if (await box.isChecked()) {
    await box.uncheck();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      page.locator('button[type="submit"][form="form1"]').click(),
    ]);
    await expectSaved(page, `権限「${authorityName}」の承認権限を外す登録`);
    await openAuthorityMatrix(page);
  }
  await expect(approvalBox(page, authorityName), `権限「${authorityName}」の承認権限のチェックは外れている`).not.toBeChecked();
}

// ---- 在庫移動・振替検索一覧 ----

export type CsvModalKind = "在庫移動CSV登録" | "在庫振替CSV登録";
const MODAL_ID: Record<CsvModalKind, string> = { 在庫移動CSV登録: "#stockMoveCsvRegisterModal", 在庫振替CSV登録: "#stockTransferCsvRegisterModal" };

/** 在庫移動・振替検索一覧を開く（メニューから開くのと同じ画面） */
export async function openMoveTransferList(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock/move_transfer"));
  expect(res?.status(), "在庫移動・振替検索一覧の応答").toBe(200);
  await expect(page.locator("form#form_search_stock_move_transfer"), "在庫移動・振替検索一覧の検索欄").toBeVisible();
  await page.waitForLoadState("load");
}

/** 「在庫移動CSV登録」「在庫振替CSV登録」のボタンを押す */
export async function pressCsvRegisterButton(page: Page, kind: CsvModalKind): Promise<void> {
  const button = page.getByRole("button", { name: kind, exact: true });
  await expect(button, `「${kind}」ボタンは1つ`).toHaveCount(1);
  await button.click();
}

/** モーダル（いま表示されているもの）と、その見出し */
export function csvModal(page: Page, kind: CsvModalKind): { modal: Locator; title: Locator } {
  const modal = page.locator(MODAL_ID[kind]);
  return { modal, title: modal.locator(".modal-title") };
}
