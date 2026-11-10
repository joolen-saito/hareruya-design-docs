/**
 * F04-01 買い物かご画面（本店 /ja/cart・支店 /ja/<支店URL>/cart）の操作と読み取り。セレクタはここだけに書く。
 * 画面の作りは Cart/index.twig（数量の増減・入力は /cart/{up|down|set}/{商品規格ID} への要求で、画面全体は読み込み直さない）。
 */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

export class CartPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }

  /** 買い物かご画面を開く。base は支店のページ（例 "/f0401a"。本店は空） */
  async 開く(base = ""): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja${base}/cart`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await this.読み込み直しの印を付ける();
  }
  get パス(): string { return new URL(this.page.url()).pathname; }

  // ---- 画面全体を読み込み直したかの見分け（印は読み込み直すと消える） ----
  async 読み込み直しの印を付ける(): Promise<void> { await this.page.evaluate(() => { (window as unknown as { __e2e_cart_mark?: boolean }).__e2e_cart_mark = true; }); }
  async 読み込み直していない(): Promise<boolean> { return this.page.evaluate(() => (window as unknown as { __e2e_cart_mark?: boolean }).__e2e_cart_mark === true).catch(() => false); }

  // ---- 商品の行 ----
  get 商品の行(): Locator { return this.page.locator(".p-hareruya-cart-item"); }
  行(商品規格ID: string): Locator {
    return this.商品の行.filter({ has: this.page.locator(`[data-quantity-input][data-product-class-id="${商品規格ID}"]`) });
  }
  数量欄(商品規格ID: string): Locator { return this.行(商品規格ID).locator("[data-quantity-input]"); }
  加算(商品規格ID: string): Locator { return this.行(商品規格ID).locator('button[data-operation="up"]'); }
  減算(商品規格ID: string): Locator { return this.行(商品規格ID).locator('button[data-operation="down"]'); }
  削除(商品規格ID: string): Locator { return this.行(商品規格ID).locator("a.p-hareruya-cart-item__delete"); }
  画像(商品規格ID: string): Locator { return this.行(商品規格ID).locator("img.p-hareruya-cart-item__image"); }
  async 行の商品規格ID(): Promise<string[]> {
    return this.page.locator(".p-hareruya-cart-item [data-quantity-input]").evaluateAll((els) => els.map((e) => String((e as HTMLElement).dataset.productClassId ?? "")));
  }
  async 数量(商品規格ID: string): Promise<string> { return this.数量欄(商品規格ID).inputValue(); }
  async 小計(商品規格ID: string): Promise<string> { return norm(await this.行(商品規格ID).locator("[data-subtotal]").innerText()); }

  // ---- 集計欄・ボタン ----
  get 集計欄(): Locator { return this.page.locator(".p-hareruya-cart__summary"); }
  get 合計金額(): Locator { return this.page.locator("[data-total-amount]"); }
  get 送料無料の案内(): Locator { return this.page.locator("[data-delivery-progress]"); }
  get 購入手続きへ(): Locator { return this.page.locator("a.p-hareruya-cart__checkout-btn"); }
  get 一括削除(): Locator { return this.page.locator("#cart-clear-btn"); }
  get 他の商品を見る(): Locator { return this.page.locator("a.p-hareruya-cart__continue-btn:visible, .p-hareruya-cart__empty-button a:visible").first(); }
  get 空の案内(): Locator { return this.page.locator(".p-hareruya-cart__empty"); }
  get エラー(): Locator { return this.page.locator(".p-hareruya-cart__error"); }
  async テキスト(l: Locator): Promise<string> { return (await l.count()) ? norm(await l.first().innerText()) : ""; }
  async 集計欄の文(): Promise<string> { return this.テキスト(this.集計欄); }

  // ---- 操作 ----
  /** 数量の増減のボタンを押し、更新の要求の応答を待つ。押せない（無効の）ボタンは押す操作だけ送り、要求が出ないことを返す */
  async 増減を押す(ボタン: Locator): Promise<{ 押せた: boolean; 応答: number | null }> {
    await expect(ボタン, "数量の増減のボタン").toHaveCount(1);
    const 押せる = await ボタン.isEnabled();
    const wait = this.page.waitForResponse((r) => /\/cart\/(up|down|set)\/\d+/.test(r.url()), { timeout: 15_000 }).catch(() => null);
    if (押せる) await ボタン.click(); else await ボタン.click({ force: true, timeout: 5_000 }).catch(() => undefined);
    const res = await wait;
    await this.page.waitForTimeout(500);
    return { 押せた: 押せる, 応答: res ? res.status() : null };
  }
  /** 数量の欄に値を入れて欄から離れ（数量変更を確定し）、更新の要求の応答を待つ（要求が出なければ空） */
  async 数量を入れる(商品規格ID: string, 値: string): Promise<number | null> {
    const input = this.数量欄(商品規格ID);
    await input.focus();
    await input.fill(値);
    const wait = this.page.waitForResponse((r) => /\/cart\/(up|down|set)\/\d+/.test(r.url()), { timeout: 15_000 }).catch(() => null);
    await input.blur();
    await input.dispatchEvent("change");
    const res = await wait;
    await this.page.waitForTimeout(500);
    return res ? res.status() : null;
  }
  /** 削除・一括削除・購入手続きへなど、画面を移すものを押して移るのを待つ */
  async 押して移る(l: Locator): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), l.click()]);
    await this.page.waitForLoadState("load");
  }
  /** カート一括削除を押し、確認ダイアログで実行（true）かキャンセル（false）を選ぶ。ダイアログの文を返す */
  async 一括削除を押す(実行: boolean): Promise<string> {
    let msg = "";
    this.page.once("dialog", (d) => { msg = d.message(); (実行 ? d.accept() : d.dismiss()).catch(() => undefined); });
    if (実行) {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.一括削除.click()]);
      await this.page.waitForLoadState("load");
    } else {
      await this.一括削除.click();
      await this.page.waitForTimeout(1_000);
    }
    return msg;
  }
}
