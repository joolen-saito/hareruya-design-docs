/**
 * 税率設定（メニュー「設定」→「基本情報設定」→「税率設定」）。M10-07 の画面操作。セレクタはここだけに書く。
 * 画面の作り（アプリのテンプレートで確かめた）: 上に新規追加の行（form#form1）、その下に共通税率の一覧。一覧の各行は鉛筆で入力欄に切り替わり、
 * 「決定」で保存する。削除は行の×からモーダルを開き、モーダルの「削除」で行う。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const TAX = "/setting/shop/tax";
const NEW = "/setting/shop/tax/new";
const F = (n: string) => `[name="tax_rule[${n}]"]`;

export type 税率の行 = { id: string; 税率: string; 規則: string; 日時: string };
export type 税率の入力 = { 税率: string; 規則: string; 日時: string };

/** 「2032-01-01 10:00」→ 日時の入力欄の値「2032-01-01T10:00」 */
export const 入力用の日時 = (s: string): string => s.replace(" ", "T");
/** 一覧の表示「2030/01/01 09:00」→「2030-01-01 09:00」 */
export const 日時に直す = (s: string): string => s.trim().replace(/\//g, "-");

export class TaxPage {
  constructor(readonly page: Page) {}
  /** 税率設定画面（一覧）を開く。パスを渡すと、そのパスを開く。HTTPステータスを返す */
  async 開く(path = TAX): Promise<number> {
    const resp = await this.page.goto(adminUrl(path), { timeout: 60_000, waitUntil: "load" });
    return resp?.status() ?? 0;
  }
  async 新規追加状態で開く(): Promise<void> {
    await this.page.goto(adminUrl(NEW), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.新規行.locator(F("tax_rate")), "新規追加の消費税率欄").toBeVisible({ timeout: 30_000 });
  }
  get パス(): string { return new URL(this.page.url()).pathname; }
  get 一覧の画面か(): boolean { return this.パス.endsWith(TAX); }
  get 新規追加の画面か(): boolean { return this.パス.endsWith(NEW); }

  // ---- 新規追加の行 ----
  get 新規行(): Locator { return this.page.locator("#tax_rule_item_new"); }
  /** 数値・日時の入力欄は文字を入れられない種類なので、入れる前に種類をテキストへ書き換える（全角数字などの入力確認用） */
  private async 生で入れる(l: Locator, v: string): Promise<void> {
    await l.evaluate((el) => { (el as HTMLInputElement).type = "text"; });
    await l.fill(v, { timeout: 30_000 });
  }
  async 新規に入れる(v: Partial<税率の入力>, 生 = false): Promise<void> {
    const r = this.新規行;
    if (v.税率 !== undefined) { if (生) await this.生で入れる(r.locator(F("tax_rate")), v.税率); else await r.locator(F("tax_rate")).fill(v.税率, { timeout: 30_000 }); }
    if (v.規則 !== undefined) await r.locator(F("rounding_type")).selectOption({ label: v.規則 }, { timeout: 30_000 });
    if (v.日時 !== undefined) { if (生) await this.生で入れる(r.locator(F("apply_date")), v.日時); else await r.locator(F("apply_date")).fill(入力用の日時(v.日時), { timeout: 30_000 }); }
  }
  async 新規の規則の選択(): Promise<string> { return ((await this.新規行.locator(`${F("rounding_type")} option:checked`).textContent()) ?? "").trim(); }
  async 新規の入力値(): Promise<税率の入力> {
    const r = this.新規行;
    return { 税率: await r.locator(F("tax_rate")).inputValue(), 規則: await this.新規の規則の選択(), 日時: (await r.locator(F("apply_date")).inputValue()).replace("T", " ") };
  }
  async 登録を押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.新規行.locator('button[type="submit"]').click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  async 登録して保存を確かめる(what: string): Promise<void> { await this.登録を押す(); await expectSaved(this.page, what); }
  async 新規追加する(v: 税率の入力, what: string): Promise<void> {
    await this.新規追加状態で開く();
    await this.新規に入れる(v);
    await this.登録して保存を確かめる(what);
  }

  // ---- 一覧 ----
  行(id: string): Locator { return this.page.locator(`#ex-tax_rule-${id}`); }
  /** 一覧の全行（上から表示のまま）。表示の文字を読む */
  async 一覧を読む(): Promise<税率の行[]> {
    await expect(this.page.locator("#tax_rule_item_new"), "税率設定画面").toBeVisible({ timeout: 30_000 });
    return this.page.locator("tr.tax_rule_list_item").evaluateAll((trs) => (trs as HTMLElement[]).map((tr) => {
      const spans = Array.from(tr.querySelectorAll<HTMLElement>(".list span")).map((s) => (s.textContent ?? "").trim());
      // 表示の並び: 税率の数字・「%」・課税規則・適用日時
      return { id: tr.id.replace("ex-tax_rule-", ""), 税率: spans[0] ?? "", 規則: spans[2] ?? "", 日時: spans[3] ?? "" };
    }));
  }
  async 日時でIDを探す(日時: string): Promise<string | null> {
    const 行 = (await this.一覧を読む()).filter((r) => 日時に直す(r.日時) === 日時);
    return 行.length ? 行[0].id : null;
  }
  async 編集にする(id: string): Promise<void> {
    await this.行(id).locator("a.edit-button").click({ timeout: 30_000 });
    await expect(this.行(id).locator(F("tax_rate")), "行の入力欄").toBeVisible({ timeout: 30_000 });
  }
  async 行の入力値(id: string): Promise<税率の入力> {
    const r = this.行(id);
    return {
      税率: await r.locator(F("tax_rate")).inputValue(),
      規則: ((await r.locator(`${F("rounding_type")} option:checked`).textContent()) ?? "").trim(),
      日時: (await r.locator(F("apply_date")).inputValue()).replace("T", " "),
    };
  }
  async 行に入れる(id: string, v: Partial<税率の入力>): Promise<void> {
    const r = this.行(id);
    if (v.税率 !== undefined) await r.locator(F("tax_rate")).fill(v.税率, { timeout: 30_000 });
    if (v.規則 !== undefined) await r.locator(F("rounding_type")).selectOption({ label: v.規則 }, { timeout: 30_000 });
    if (v.日時 !== undefined) await r.locator(F("apply_date")).fill(入力用の日時(v.日時), { timeout: 30_000 });
  }
  async 決定を押す(id: string): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.行(id).locator(".edit button[type=submit]").click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  async 決定して保存を確かめる(id: string, what: string): Promise<void> { await this.決定を押す(id); await expectSaved(this.page, what); }

  // ---- 削除 ----
  async 削除のモーダルを開く(id: string): Promise<void> {
    await this.行(id).locator(`a[data-bs-target="#DeleteModal_${id}"]`).click({ timeout: 30_000 });
    await expect(this.page.locator(`#DeleteModal_${id}`), "削除確認モーダル").toBeVisible({ timeout: 30_000 });
  }
  async モーダルで削除する(id: string): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.locator(`#DeleteModal_${id} a.btn-ec-delete`).click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  async モーダルでキャンセルする(id: string): Promise<void> {
    await this.page.locator(`#DeleteModal_${id} button[data-bs-dismiss="modal"]`).last().click({ timeout: 30_000 });
    await expect(this.page.locator(`#DeleteModal_${id}`), "削除確認モーダルが閉じる").toBeHidden({ timeout: 30_000 });
  }
  /** 開いて、モーダルで削除する（後始末用。行が無ければ何もしない） */
  async あれば削除する(id: string): Promise<boolean> {
    await this.開く();
    if ((await this.行(id).count()) === 0) return false;
    await this.削除のモーダルを開く(id);
    await this.モーダルで削除する(id);
    return true;
  }
}
