/**
 * 公開側のECTOPにあるカテゴリ一覧（F03-04）。最新セット・フォーマット別・その他の3つの枠からなり、
 * 第一階層はそれぞれの枠に並ぶ。子カテゴリは、親のカテゴリを押すと展開する。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export const 入口 = { 本店: "/ja", TC大阪支店: "/ja/osaka" } as const;

export class FrontCategoryList {
  constructor(readonly page: Page) {}

  /** ECTOPを開き、カテゴリ一覧の描画（3つの枠の取得）が終わるのを待つ */
  async ECTOPを開く(店の入口: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${店の入口}`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    await this.描画を待つ();
    return res?.status() ?? 0;
  }

  /** 3つの枠の取得が済む（読み込み中の印が外れる）のを待つ。カテゴリが「無い」ことを数える前に呼ぶ */
  async 描画を待つ(): Promise<void> {
    await this.page.waitForFunction(() => {
      const cs = Array.from(document.querySelectorAll("[data-category-level1-container]"));
      return cs.length > 0 && cs.every((c) => c.getAttribute("aria-busy") === "false");
    }, undefined, { timeout: 60_000 });
  }

  /** 「その他」の枠（第一階層が最新セット・フォーマット以外のカテゴリ） */
  get その他の枠(): Locator { return this.page.locator('[data-category-level1-container="others"]:visible').first(); }
  /** 3つの枠すべての第一階層 */
  get 第一階層の項目(): Locator { return this.page.locator("[data-category-level1-container]:visible > .p-hareruya-category-item"); }

  private 名称(button: Locator): Promise<string[]> {
    return button.evaluateAll((ns) => ns.map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()));
  }

  /** 「その他」の枠に並ぶ第一階層の名称（表示順） */
  async その他の第一階層の名称(): Promise<string[]> {
    return this.名称(this.その他の枠.locator(":scope > .p-hareruya-category-item > .p-hareruya-category-button .p-hareruya-category-button__text"));
  }
  /** 3つの枠すべての第一階層の名称 */
  async 第一階層の名称(): Promise<string[]> {
    return this.名称(this.第一階層の項目.locator(":scope > .p-hareruya-category-button .p-hareruya-category-button__text"));
  }

  /** 第一階層の項目（名称が一致するもの） */
  項目(名称: string): Locator {
    return this.第一階層の項目.filter({ has: this.page.locator(".p-hareruya-category-button__text", { hasText: new RegExp(`^\\s*${名称.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });
  }

  /** 第一階層のカテゴリを押して、子カテゴリを展開する（子の取得と描画が済むのを待つ） */
  async 展開する(名称: string): Promise<void> {
    const item = this.項目(名称);
    const toggle = item.locator(":scope > button[data-category-toggle]");
    await toggle.click({ timeout: 30_000 });
    const root = item.locator(":scope > .p-hareruya-category-accordion");
    await root.locator(".p-hareruya-category-accordion__item").first().waitFor({ state: "attached", timeout: 30_000 });
    await this.page.waitForFunction((el) => el?.getAttribute("data-rendered") === "true", await root.elementHandle(), { timeout: 30_000 });
    // 展開した枠を画面に入れる（エビデンスに子カテゴリが写るように）
    await item.scrollIntoViewIfNeeded();
  }

  /** 展開した第一階層のカテゴリの、直下の子カテゴリの名称（表示順） */
  async 子の名称(名称: string): Promise<string[]> {
    const root = this.項目(名称).locator(":scope > .p-hareruya-category-accordion");
    return this.名称(root.locator(":scope > ul > .p-hareruya-category-accordion__item > :first-child [class$='__text']"));
  }
}
