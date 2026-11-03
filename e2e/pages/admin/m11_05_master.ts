/** システム設定「マスターデータ管理」の職業マスタ（M11-05）の操作と、フロントの会員登録画面の職業の選択肢。 */
import { Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type 職業の行 = { index: number; id: string; name: string };

/** マスターデータ管理で職業マスタを選び、編集欄を開く */
export async function 職業マスタを開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  const master = page.locator("#admin_system_masterdata_masterdata");
  await expect(master.locator("option", { hasText: "mtb_job" }), "マスターデータ管理に職業マスタがある").toHaveCount(1, { timeout: 30_000 });
  await master.selectOption({ label: "mtb_job" }, { timeout: 20_000 });
  await page.locator("form#form1 button[type=submit]").click({ timeout: 20_000 });
  await expect(page.locator("form#form2"), "職業マスタの編集欄").toBeVisible({ timeout: 30_000 });
}

export async function 職業の行を読む(page: Page): Promise<職業の行[]> {
  const out: 職業の行[] = [];
  const rows = page.locator("form#form2 tbody tr");
  for (let i = 0; i < (await rows.count()); i++) {
    out.push({ index: i, id: await rows.nth(i).locator('input[name$="[id]"]').inputValue(), name: await rows.nth(i).locator('input[name$="[name]"]').inputValue() });
  }
  return out;
}

export async function 保存する(page: Page, what: string): Promise<string[]> {
  await page.locator("form#form2 button[type=submit]").click({ timeout: 20_000 });
  return expectSaved(page, what);
}

/** 行のIDと名称を入れる（index の行） */
export async function 行に入れる(page: Page, index: number, id: string, name: string): Promise<void> {
  const row = page.locator("form#form2 tbody tr").nth(index);
  await row.locator('input[name$="[id]"]').fill(id, { timeout: 20_000 });
  await row.locator('input[name$="[name]"]').fill(name, { timeout: 20_000 });
}

/** 新しいブラウザの状態で会員登録画面を開き、職業の選択肢の表示名を返す */
export async function 会員登録の職業の選択肢(page: Page): Promise<string[]> {
  await page.goto(`${BASE_URL}/ja/entry`);
  await page.waitForLoadState("load");
  const sel = page.locator('form#entry_form [name="entry[job]"]');
  await expect(sel, "会員登録画面の職業の選択欄").toHaveCount(1, { timeout: 30_000 });
  return (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
}
