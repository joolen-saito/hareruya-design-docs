/**
 * F06-22 お問い合わせ件名のマスタ（管理画面「データ管理」→「MTGマスターデータ」で、対象に「お問い合わせ件名」を選ぶ）の読み書き。
 * 共有の設定を書き換えるので、書き換える前の値を控え、終わったら控えた値へ戻す（seeds/f06-22-b.ts）。
 */
import { Page } from "@playwright/test";
import { expectSaved } from "./common";
import { MtgMasterEditPage } from "./m16_04_master";

export const 件名の項目 = ["subject", "subject_en", "email", "shop_flg", "attached_info_name", "attached_info_name_en", "sort_no"] as const;
export type 件名の値 = Record<(typeof 件名の項目)[number], string>;
/** 件名ID → 値 */
export type 件名の表 = Record<string, 件名の値>;

async function 件名の画面を開く(page: Page): Promise<MtgMasterEditPage> {
  const m = new MtgMasterEditPage(page);
  await m.open();
  await m.選択欄.selectOption({ label: "お問い合わせ件名" });
  await m.選択を押す();
  await m.一覧の領域.waitFor({ state: "visible", timeout: 30_000 });
  return m;
}

/** 画面に出ている既存の行（新規入力行を除く）の値 */
export async function 件名の表を読む(page: Page): Promise<件名の表> {
  await 件名の画面を開く(page);
  return page.locator("form#edit_form").evaluate((form, 項目) => {
    const out: Record<string, Record<string, string>> = {};
    for (const el of Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name^="rows["]'))) {
      const m = /^rows\[(\d+)\]\[([a-z_]+)\]$/.exec(el.name);
      if (!m || !(項目 as readonly string[]).includes(m[2])) continue;
      (out[m[1]] ??= {})[m[2]] = el.value;
    }
    return out;
  }, 件名の項目) as Promise<件名の表>;
}

/** 件名ごとに、指定した項目だけを書き換えて登録する（指定しない項目と新規入力行はそのまま） */
export async function 件名を書き換える(page: Page, 変更: Record<string, Partial<件名の値>>): Promise<void> {
  const m = await 件名の画面を開く(page);
  for (const [id, v] of Object.entries(変更)) {
    for (const [k, val] of Object.entries(v)) {
      const el = page.locator(`[name="rows[${id}][${k}]"]`);
      if ((await el.count()) !== 1) throw new Error(`件名ID ${id} の項目 ${k} の入力欄が画面に無い`);
      if (k === "shop_flg") await el.selectOption(val);
      else await el.fill(val);
    }
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), m.登録ボタン.click({ timeout: 20_000 })]);
  await page.waitForLoadState("load");
  await expectSaved(page, "お問い合わせ件名のマスタの登録");
}
