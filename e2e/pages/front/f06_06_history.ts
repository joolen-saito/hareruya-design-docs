/**
 * F06-06 購入履歴一覧（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-06_test_cases.tsv
 */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;

export class HistoryListPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/shopping_history`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async 履歴一覧画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-history-list--shopping").count()) > 0; }
  get 注文の枠(): Locator { return this.page.locator(".p-hareruya-history-list__box"); }
  /** 表示されている注文番号を上から */
  async 注文番号を上から(): Promise<string[]> {
    return (await this.注文の枠.locator("a.c-hareruya-link").allInnerTexts()).map((t) => t.trim());
  }
  /** 件数の表示（「件数: 11件」など）。ツールバーの文を返す */
  async 件数の表示(): Promise<string> {
    const c = this.page.locator(".p-hareruya-toolbar").first();
    return (await c.count()) === 0 ? "" : ((await c.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  async 履歴なしの案内(): Promise<string> {
    const m = this.page.locator(".p-hareruya-message-box--info");
    return (await m.count()) === 0 ? "" : ((await m.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  // ---- ページング・表示件数 ----
  /** 画面上部のページング */
  get 上のページング(): Locator { return this.page.locator(".p-hareruya-toolbar__pagination"); }
  /** 画面下部のページング */
  get 下のページング(): Locator { return this.page.locator(".p-hareruya-history-list__pagination-wrap--bottom"); }
  async 現在のページ(): Promise<string> {
    const c = this.page.locator(".p-hareruya-pagination__item--current .p-hareruya-pagination__number").first();
    return (await c.count()) === 0 ? "" : ((await c.innerText()) ?? "").trim();
  }
  async ページを押す(場所: Locator, ページ: number): Promise<void> {
    const l = 場所.locator(`a.p-hareruya-pagination__link[data-page="${ページ}"]`).first();
    await this.押して遷移する(l);
  }
  get 表示件数の選択欄(): Locator { return this.page.locator("#js-shopping-history-disp-number"); }
  async 表示件数を選ぶ(表示: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.表示件数の選択欄.selectOption({ label: 表示 }, { timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }
  async 表示件数の選択肢(): Promise<string[]> { return (await this.表示件数の選択欄.locator("option").allInnerTexts()).map((t) => t.trim()); }


  // ---- 注文の行（1件の枠）の読み取り ----
  /** 注文番号（リンク）またはレシートNo（リンク）を含む行 */
  行(キー: string): Locator {
    return this.注文の枠.filter({ has: this.page.locator("a", { hasText: キー }) });
  }
  /** 行の項目（見出しの文字を含む行）の読み取り。無ければ 有=false */
  async 項目(行: Locator, 見出し: string): Promise<{ 有: boolean; 文: string; リンクあり: boolean }> {
    const r = 行.locator(".p-hareruya-history-list__order-info-row").filter({ has: this.page.locator("dt", { hasText: 見出し }) });
    if ((await r.count()) === 0) return { 有: false, 文: "", リンクあり: false };
    const dd = r.first().locator("dd");
    return { 有: true, 文: ((await dd.innerText()) ?? "").replace(/\s+/g, " ").trim(), リンクあり: (await dd.locator("a").count()) > 0 };
  }
  /** 行の処理状態の表示（ラベルの文字と画像の説明・出どころ）。処理状態の項目が無ければ 表示=false */
  async 処理状態(行: Locator): Promise<{ 表示: boolean; 文: string; 画像: string[] }> {
    const r = 行.locator(".p-hareruya-history-list__order-info-row").filter({ has: this.page.locator("dt", { hasText: "処理状態" }) });
    if ((await r.count()) === 0) return { 表示: false, 文: "", 画像: [] };
    const dd = r.first().locator("dd");
    const 画像 = await dd.locator("img").evaluateAll((ns) => ns.map((n) => `${(n as HTMLImageElement).alt}|${(n as HTMLImageElement).getAttribute("src") ?? ""}`));
    const 文 = ((await dd.innerText()) ?? "").replace(/\s+/g, " ").trim();
    return { 表示: 文 !== "" || 画像.length > 0, 文, 画像 };
  }
  /** 行の「注文番号」のリンク */
  注文番号のリンク(行: Locator): Locator { return 行.locator("a.c-hareruya-link").first(); }
  /** 行の処理状態のリンク */
  処理状態のリンク(行: Locator): Locator {
    return 行.locator(".p-hareruya-history-list__order-info-row").filter({ has: this.page.locator("dt", { hasText: "処理状態" }) }).locator("dd a").first();
  }
  /** 行の「詳細を見る」ボタン */
  詳細を見るボタン(行: Locator): Locator { return 行.locator("a.c-hareruya-btn", { hasText: "詳細を見る" }).first(); }
  /** 行の「この注文内容で再度購入する」ボタン */
  再購入ボタン(行: Locator): Locator { return 行.getByText("この注文内容で再度購入する", { exact: false }).first(); }
  /** 画面上部の会員名 */
  async 会員名(): Promise<string> {
    const c = this.page.locator(".p-hareruya-history-list__member-name");
    return (await c.count()) === 0 ? "" : ((await c.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 買い物かご画面の商品の行（商品名の文と数量） */
  async かごの行(): Promise<{ 文: string; 数量: string }[]> {
    const items = this.page.locator(".p-hareruya-cart-item");
    const n = await items.count();
    const out: { 文: string; 数量: string }[] = [];
    for (let i = 0; i < n; i++) {
      out.push({
        文: ((await items.nth(i).innerText()) ?? "").replace(/\s+/g, " ").trim(),
        数量: (await items.nth(i).locator("[data-quantity-input]").first().inputValue().catch(() => "")),
      });
    }
    return out;
  }

  // ---- ボタン ----
  get マイページボタン(): Locator { return this.page.locator(".p-hareruya-history-list__btn a").first(); }

  async 押して遷移する(l: Locator): Promise<void> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      test.info().annotations.push({ type: "正本の外の補い", description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    await nav;
    await this.page.waitForLoadState("load");
  }
}
