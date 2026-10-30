/**
 * F03-03 商品詳細検索の選択肢のもとになる管理画面の操作。
 * - MTGマスターデータ管理（カードタイプ・イラストレーター・サブタイプの行を見る・足す・直す）
 * - フォーマット一覧とフォーマット詳細（登録・編集）
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type マスタ行 = { id: string; 日本語名: string; 英語名: string; 並び順: string; 商品検索に表示: string };
export type マスタ種別 = "cardtype" | "illustrator" | "subtype";
const 種別の表示名: Record<マスタ種別, string> = { cardtype: "カードタイプ", illustrator: "イラストレーター", subtype: "サブタイプ" };

export class MtgMasterPage {
  constructor(readonly page: Page) {}

  /** MTGマスターデータ管理を開き、種別を選んで「選択」を押す */
  async open(種別: マスタ種別): Promise<void> {
    await this.page.goto(adminUrl("/data/mtg_master_data"));
    await this.page.waitForLoadState("load");
    await this.page.locator('select[name="entity"]').selectOption({ label: 種別の表示名[種別] });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.page.locator('form[method="get"] button[type="submit"]').click(),
    ]);
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("form#edit_form table.mtg-master-table"), `${種別の表示名[種別]}の一覧`).toBeVisible();
  }

  /** 既存の行（新規入力行を除く）。番号は入力欄の名前から読む（一覧には出ない） */
  async rows(): Promise<マスタ行[]> {
    return this.page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
      const out: { id: string; 日本語名: string; 英語名: string; 並び順: string; 商品検索に表示: string }[] = [];
      for (const tr of trs) {
        const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
        const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
        if (!m || m[1] === "new") continue;
        const id = m[1];
        const v = (f: string) => ((tr.querySelector(`[name="rows[${id}][${f}]"]`) as HTMLInputElement | null)?.value ?? "");
        out.push({ id, 日本語名: v("name_jp"), 英語名: v("name_en"), 並び順: v("sort_no"), 商品検索に表示: v("product_search_flg") });
      }
      return out;
    });
  }

  /** 並び順の最大値 + 1（新しい行の並び順に使う。任意の有効な値でよい） */
  async nextSortNo(): Promise<string> {
    const nums = (await this.rows()).map((r) => Number(r.並び順)).filter((n) => Number.isFinite(n));
    return String((nums.length ? Math.max(...nums) : 0) + 1);
  }

  /** 新規の行に値を入れる（指定しない欄は触らない） */
  async fillNewRow(v: { 日本語名?: string; 英語名?: string; 並び順?: string; 商品検索に表示?: "0" | "1" }): Promise<void> {
    const f = (name: string) => this.page.locator(`[name="rows[new][${name}]"]`);
    if (v.日本語名 !== undefined) await f("name_jp").fill(v.日本語名);
    if (v.英語名 !== undefined) await f("name_en").fill(v.英語名);
    if (v.並び順 !== undefined) await f("sort_no").fill(v.並び順);
    if (v.商品検索に表示 !== undefined) await f("product_search_flg").selectOption(v.商品検索に表示);
  }

  /** 既存の行の「商品検索に表示するか」を選ぶ。固定の行などで選べなければ false */
  async setSearchFlag(id: string, value: "0" | "1"): Promise<boolean> {
    const sel = this.page.locator(`[name="rows[${id}][product_search_flg]"]`);
    if (await sel.isDisabled()) return false;
    await sel.selectOption(value);
    return true;
  }

  /** 「登録」を押して保存の結果を確かめる */
  async save(what: string): Promise<string[]> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.page.locator('button[type="submit"][form="edit_form"]').click(),
    ]);
    await this.page.waitForLoadState("load");
    return expectSaved(this.page, what);
  }
}

export type フォーマット行 = { id: string; 名称: string };

export class FormatPage {
  constructor(readonly page: Page) {}

  async openList(): Promise<void> {
    await this.page.goto(adminUrl("/format"));
    await this.page.waitForLoadState("load");
  }

  /** 一覧の行（「日本語名 / 英語名」のリンク）。番号は編集画面へのリンクから読む */
  async listRows(): Promise<フォーマット行[]> {
    return this.page.locator('table a[href*="/format/"][href$="/edit"]').evaluateAll((links) => links
      .map((a) => ({ id: /\/format\/(\d+)\/edit/.exec((a as HTMLAnchorElement).getAttribute("href") ?? "")?.[1] ?? "", 名称: (a.textContent ?? "").trim() }))
      .filter((r, i, all) => r.id && all.findIndex((x) => x.id === r.id) === i && r.名称.includes(" / ")));
  }

  /** 一覧の「新規登録」からフォーマット詳細(登録)を開く */
  async openNew(): Promise<void> {
    await this.openList();
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.page.locator('a.btn[href$="/format/new"]').first().click(),
    ]);
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("#admin_format_nameJp"), "フォーマット詳細(登録)のフォーマット名(日)").toBeVisible();
  }

  async openEdit(id: string): Promise<void> {
    await this.page.goto(adminUrl(`/format/${id}/edit`));
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("#admin_format_nameJp"), "フォーマット詳細(編集)のフォーマット名(日)").toBeVisible();
  }

  async fill(v: { 名称日?: string; 名称英?: string; 並び順?: string; 商品検索に表示?: boolean }): Promise<void> {
    if (v.名称日 !== undefined) await this.page.locator("#admin_format_nameJp").fill(v.名称日);
    if (v.名称英 !== undefined) await this.page.locator("#admin_format_nameEn").fill(v.名称英);
    if (v.並び順 !== undefined) await this.page.locator("#admin_format_rank").fill(v.並び順);
    if (v.商品検索に表示 !== undefined) await this.page.locator("#admin_format_productSearchFlg").setChecked(v.商品検索に表示);
  }

  async values(): Promise<{ 名称日: string; 並び順: string; 商品検索に表示: boolean }> {
    return {
      名称日: await this.page.locator("#admin_format_nameJp").inputValue(),
      並び順: await this.page.locator("#admin_format_rank").inputValue(),
      商品検索に表示: await this.page.locator("#admin_format_productSearchFlg").isChecked(),
    };
  }

  /** 「登録」を押す。登録のあとは編集画面へ移るので、そのアドレスの番号を返す */
  async register(what: string): Promise<string> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.page.locator('button[type="submit"]:has-text("登録")').last().click(),
    ]);
    await this.page.waitForLoadState("load");
    await expectSaved(this.page, what);
    const m = /\/format\/(\d+)\/edit/.exec(this.page.url());
    if (!m) throw new Error(`${what}: 登録後のアドレスから番号を読めない（${this.page.url()}）`);
    return m[1];
  }
}
