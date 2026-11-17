/**
 * M04-33 戻しリストCSV の画面操作。セレクタはここだけに書く。正本: cases/M04-33_test_cases.tsv
 * - 店舗編集画面の高額商品閾値1〜3（≪共有の設定≫。店舗ID 1（本店）と 1574（試験支店。2026-11-18 までは 13）は全員が使うので、ケースの開始時に書き換え、終わるたびに戻す）
 * - 在庫移動・振替検索一覧: 作成日の範囲で検索し、表示件数を選び、在庫移動の行を選んで「戻しリストCSV出力」を押し、ダウンロードしたCSVを読む
 */
import { expect, Locator, Page } from "@playwright/test";
import { csvRecords, decodeCsvBytes } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { downloadedBytes } from "./m03_21_shelf_number";
import { 店舗の高額商品閾値, 流す前の高額商品閾値の店舗別 } from "../../db/m04_33";
import { 印を置く } from "../../lib/shared_threshold_marker";

const T = 60_000;
const storeField = (page: Page, name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);

/** 店舗編集画面の高額商品閾値1〜3（空は ""） */
export async function readStoreThresholds(page: Page, 店舗ID: string): Promise<[string, string, string]> {
  const res = await page.goto(adminUrl(`/mall/tenant/detail/${店舗ID}`), { timeout: T });
  if (!res || !res.ok()) throw new Error(`店舗ID ${店舗ID} の店舗編集画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  const out: string[] = [];
  for (const n of [1, 2, 3]) out.push((await storeField(page, `expensive_threshold${n}`).inputValue({ timeout: T })).replace(/,/g, "").trim());
  return [out[0], out[1], out[2]];
}

/**
 * 店舗編集画面で高額商品閾値1〜3だけを入れ直して登録する（ほかの項目は画面に出ている値のまま送る）。
 * 保存するかどうか・保存できたかは、画面でなく DB の値で決める（空と null は同じ）。合わなければ3回まで登録し直し、それでも合わなければ落とす
 * （2026-11-15 画面の読み取りで「同じ」と見て保存せずに返り、共有の設定が戻らなかった）
 */
export async function setStoreThresholds(page: Page, 店舗ID: string, 閾値: readonly [string, string, string], what: string, opt: { 印を置かない?: boolean } = {}): Promise<void> {
  const 整える = (v: readonly string[]) => v.map((x) => (x ?? "").replace(/,/g, "").trim()).join("/");
  const 求める = 整える(閾値);
  if (整える(店舗の高額商品閾値(店舗ID)) === 求める) return;
  // ≪共有の設定≫（店舗ID 1・1574）を決まった値から書き換える前に印を置く。テストが打ち切られても、起動の終わり（lib/teardown_shared_thresholds.ts）が戻す（2026-11-15）
  // 2026-11-18: 支店を店舗ID 13 から試験支店（1574）へ読み替え。店舗ごとの流す前の値（本店 980/4800/空・試験支店 空/空/空）を戻す先にする
  const 基準 = 流す前の高額商品閾値の店舗別[店舗ID];
  if (!opt.印を置かない && 基準 && 求める !== 整える(基準)) 印を置く(店舗ID, 基準);
  let 最後 = "";
  for (let 回 = 1; 回 <= 3; 回++) {
    await readStoreThresholds(page, 店舗ID); // 店舗編集画面を開く
    await page.waitForLoadState("load");
    for (const [i, n] of [1, 2, 3].entries()) await storeField(page, `expensive_threshold${n}`).fill(閾値[i] ?? "", { timeout: T });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: T }).catch(() => undefined),
      page.getByRole("button", { name: "登録", exact: true }).click({ timeout: T }),
    ]);
    try { await expectSaved(page, `${what}（${回}回目）`); } catch (e) { 最後 = String(e).split("\n")[0]; }
    const db = 整える(店舗の高額商品閾値(店舗ID));
    if (db === 求める) return;
    最後 = `${最後 ? 最後 + "・" : ""}DB の値が「${db}」`;
  }
  throw new Error(`${what}: 3回登録しても、DB の高額商品閾値が求める「${求める}」にならない（${最後}）`);
}

/** 在庫移動・振替検索一覧 */
export class ReturnListPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get form(): Locator { return this.page.locator("form#form_search_stock_move_transfer"); }
  row(在庫移動ID: string): Locator {
    return this.page.locator("table tbody tr").filter({ has: this.page.locator(`input.js-move-transfer-row-check[value="${在庫移動ID}"]`) });
  }
  check(在庫移動ID: string): Locator { return this.row(在庫移動ID).locator("input.js-move-transfer-row-check"); }
  get 戻しリストCSV出力(): Locator { return this.page.locator("#stockMoveTransferReturnListCsvExport"); }
  get 表示件数(): Locator { return this.page.locator("#page_count_pulldown"); }

  /** 一覧を開き、作成日の範囲（"YYYY-MM-DD"）だけを入れて検索する */
  async 作成日で検索する(開始: string, 終了: string): Promise<void> {
    await this.page.goto(adminUrl("/product/stock/move_transfer"), { timeout: T });
    await this.page.waitForLoadState("load");
    await expect(this.form, "在庫移動・振替検索一覧の検索欄").toBeVisible();
    // 作成日は畳まれた「詳細検索」（#stockMoveTransferSearchDetail）の中にある。畳まれていれば開いてから入れる（2026-11-15 欄が見えず60秒で止まった）
    const 作成日 = this.form.locator('[name="admin_search_stock_move_transfer[create_date_start]"]');
    if (!(await 作成日.isVisible())) {
      await this.page.locator('[href="#stockMoveTransferSearchDetail"]').first().click({ timeout: T });
      await expect(作成日, "詳細検索の作成日の欄").toBeVisible({ timeout: T });
    }
    await 作成日.fill(開始);
    await this.form.locator('[name="admin_search_stock_move_transfer[create_date_end]"]').fill(終了);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: T }),
      this.form.locator('button[type="submit"]').first().click(),
    ]);
  }

  /** 表示件数を選ぶ（選択欄は選んだ件数の一覧へ移る作り）。選べたら true */
  async 表示件数を選ぶ(件数: string): Promise<boolean> {
    if ((await this.表示件数.count()) === 0) return false;
    const opt = await this.表示件数.locator("option").evaluateAll((os, n) => {
      const hit = (os as HTMLOptionElement[]).find((o) => (o.textContent ?? "").replace(/\s+/g, "").startsWith(n as string));
      return hit ? { value: hit.value, selected: hit.selected } : null;
    }, 件数);
    if (!opt) return false;
    if (opt.selected) return true;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: T }), this.表示件数.selectOption(opt.value)]);
    return true;
  }

  /** 一覧に出ている在庫移動の行のID */
  async 行のID(): Promise<string[]> {
    return this.page.locator("input.js-move-transfer-row-check").evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).value));
  }

  /** 在庫移動の行だけを選ぶ（ほかの行の選択は外す） */
  async 選ぶ(在庫移動ID: string[]): Promise<void> {
    for (const id of await this.行のID()) {
      const box = this.check(id);
      if (在庫移動ID.includes(id)) await box.check({ timeout: T });
      else if (await box.isChecked()) await box.uncheck({ timeout: T });
    }
    for (const id of 在庫移動ID) await expect(this.check(id), `在庫移動・振替ID ${id} の行が選ばれた`).toBeChecked();
  }

  /** 「戻しリストCSV出力」を押してダウンロードを待つ。ファイル名と、見出しを列名にした行を返す */
  async 戻しリストCSVを出力する(): Promise<{ ファイル名: string; 見出し: string[]; 行: Record<string, string>[] }> {
    await this.page.waitForLoadState("load");
    const [download] = await Promise.all([
      this.page.waitForEvent("download", { timeout: T }),
      this.戻しリストCSV出力.click({ timeout: T }),
    ]);
    const text = decodeCsvBytes(await downloadedBytes(download));
    const 見出し = (text.split(/\r?\n/)[0] ?? "").split(",").map((s) => s.replace(/^"|"$/g, ""));
    return { ファイル名: download.suggestedFilename(), 見出し, 行: csvRecords(text) };
  }
}
