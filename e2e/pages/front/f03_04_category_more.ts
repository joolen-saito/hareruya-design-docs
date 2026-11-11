/**
 * F03-04 カテゴリ一覧の追加の部品: 子カテゴリの展開と押下・スマホ版のモーダル・商品一覧の左メニュー・PC版ナビゲーションの「カテゴリ」・フォーマット別ヘルプ。
 * 画面の作りはアプリのテンプレート（Block/_category_content.twig・category_modal.twig・category_nav_pc.twig・bottom_nav.twig）と
 * 公開側の描画スクリプトで確かめた。期待値はここに書かない。
 */
import { Locator, Page } from "@playwright/test";
import { FrontCategoryList } from "./f03_04_category_list";

export type 枠 = "latest-set" | "formats" | "others";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exact = (s: string) => new RegExp(`^\\s*${esc(s)}\\s*$`);
const texts = (l: Locator): Promise<string[]> => l.evaluateAll((ns) => ns.map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()));

export class FrontCategoryListMore extends FrontCategoryList {
  /** 枠の見出しの文（見えているもの。ECTOPの一覧・モーダル・商品一覧の左メニュー） */
  async 見出し(): Promise<string[]> {
    return texts(this.root.locator(".p-hareruya-category-group__heading:visible, .p-hareruya-category-sidebar__group .c-hareruya-heading--lev4:visible"));
  }
  /** 見えている枠の並び（画面の上から下の順） */
  async 枠の並び(): Promise<string[]> {
    return this.root.locator("[data-category-level1-container]:visible").evaluateAll((ns) => ns.map((n) => n.getAttribute("data-category-level1-container") ?? ""));
  }
  /** 枠の第一階層の名称（表示順） */
  async 枠の名称(group: 枠): Promise<string[]> {
    return texts(this.root.locator(`[data-category-level1-container="${group}"]:visible > .p-hareruya-category-item > .p-hareruya-category-button .p-hareruya-category-button__text`));
  }

  /** 展開した枠の直下の子の名称（「すべて見る」を除く、表示順） */
  async 子の名称Of(accordion: Locator): Promise<string[]> {
    const names = await texts(accordion.locator(":scope > ul > .p-hareruya-category-accordion__item > .p-hareruya-category-accordion__link > .p-hareruya-category-accordion__text"));
    return names.filter((n) => n !== "すべて見る" && n !== "View all");
  }

  /** 第一階層の項目の下の枠 */
  第一階層の子の枠(名称: string): Locator { return this.項目(名称).locator(":scope > .p-hareruya-category-accordion"); }
  /** 枠の中の、子を持つ親のボタン（名称が一致するもの） */
  子のボタン(accordion: Locator, 名称: string): Locator {
    return accordion.locator(":scope > ul > .p-hareruya-category-accordion__item > button[data-category-toggle]")
      .filter({ has: this.page.locator(".p-hareruya-category-accordion__text", { hasText: exact(名称) }) }).first();
  }
  /** 枠の中の、子を持たない項目のリンク（名称が一致するもの） */
  子のリンク(accordion: Locator, 名称: string): Locator {
    return accordion.locator(":scope > ul > .p-hareruya-category-accordion__item > a.p-hareruya-category-accordion__link")
      .filter({ has: this.page.locator(".p-hareruya-category-accordion__text", { hasText: exact(名称) }) }).first();
  }
  /** 子を持つボタンを押して、その下の枠を返す（開くのを待つ） */
  async 子を展開する(accordion: Locator, 名称: string): Promise<Locator> {
    const button = this.子のボタン(accordion, 名称);
    await button.scrollIntoViewIfNeeded();
    await button.click({ timeout: 30_000 });
    await this.page.waitForFunction((el) => el?.getAttribute("aria-expanded") === "true", await button.elementHandle(), { timeout: 30_000 });
    const next = button.locator("xpath=following-sibling::div[contains(@class,'p-hareruya-category-accordion')]").first();
    await next.locator(".p-hareruya-category-accordion__item").first().waitFor({ state: "attached", timeout: 30_000 });
    return next;
  }

  /** 第一階層の、子を持たない項目（リンク）を押して、遷移を待つ */
  async 第一階層のリンクを押す(名称: string): Promise<void> {
    const link = this.項目(名称).locator(":scope > a.p-hareruya-category-button--link").first();
    await link.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  /** 展開した枠の中の子のリンクを押して、遷移を待つ */
  async 子のリンクを押す(accordion: Locator, 名称: string): Promise<void> {
    const link = this.子のリンク(accordion, 名称);
    await link.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }

  // ---- フォーマット別ヘルプ ----
  get ヘルプのボタン(): Locator { return this.root.locator(".p-hareruya-category-group__help-button:visible").first(); }
  /** ヘルプの説明の文（見えているもの） */
  get ヘルプの説明(): Locator { return this.root.locator(".p-hareruya-category-group__help [data-popover] .p-hareruya-popover__body p:visible").first(); }
}

/** スマホ版の画面下のナビゲーションの「カテゴリ」と、押すと開くモーダル */
export class FrontCategoryModal {
  constructor(readonly page: Page) {}
  get カテゴリのボタン(): Locator { return this.page.locator(".p-hareruya-bottom-nav__category-btn:visible").first(); }
  get モーダル(): Locator { return this.page.locator('[data-modal="category"]'); }
  async 画面の幅をスマホにする(): Promise<void> { await this.page.setViewportSize({ width: 390, height: 844 }); }
  async 開く(): Promise<void> {
    await this.カテゴリのボタン.click({ timeout: 30_000 });
    await this.モーダル.waitFor({ state: "visible", timeout: 30_000 });
  }
}

/** PC版ナビゲーションの「カテゴリ」（ECTOPの上部。マウスを重ねると一覧が開き、項目に重ねると次の列に子が並ぶ） */
export class FrontCategoryNavPc {
  constructor(readonly page: Page) {}
  get カテゴリのボタン(): Locator { return this.page.locator('.p-hareruya-header__category-btn[data-category="all"]:visible').first(); }
  get 開く枠(): Locator { return this.page.locator('[data-category-dropdown][data-category-type="all"]'); }
  列の項目(列: number): Locator { return this.開く枠.locator(`[data-column="${列}"] .p-hareruya-header__category-dropdown-item`); }
  async 列の名称(列: number): Promise<string[]> {
    return texts(this.列の項目(列).locator(".p-hareruya-header__category-dropdown-item-text"));
  }
  /** 「カテゴリ」にマウスを重ねて、一覧の最初の列が出るのを待つ */
  async カテゴリにホバーする(): Promise<void> {
    await this.カテゴリのボタン.hover({ timeout: 30_000 });
    await this.列の項目(1).first().waitFor({ state: "visible", timeout: 30_000 });
  }
  /** 列の項目（名称が一致するもの）にマウスを重ねて、次の列に子が出るのを待つ */
  async 項目にホバーする(列: number, 名称: string): Promise<void> {
    const item = this.列の項目(列).filter({ has: this.page.locator(".p-hareruya-header__category-dropdown-item-text", { hasText: exact(名称) }) }).first();
    await item.hover({ timeout: 30_000 });
    await this.列の項目(列 + 1).first().waitFor({ state: "visible", timeout: 30_000 });
  }
}
