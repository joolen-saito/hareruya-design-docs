/**
 * F04 ご注文方法指定画面（/shopping）と配送先の新規登録・変更画面（/shopping/shipping_edit）の操作。
 * 画面の作りはアプリのテンプレートで確かめた。期待値はここに書かない（ケースの spec が正本から確かめる）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export const front = (p: string) => `${BASE_URL}/ja${p}`;
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

export class ShoppingPage {
  constructor(readonly page: Page) {}

  /** 買い物かご画面の「購入手続きへ」を押してご注文方法指定画面へ進む */
  async 買い物かごから開く(base = ""): Promise<void> {
    await this.page.goto(front(`${base}/cart`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const toShopping = this.page.locator("a.p-hareruya-cart__checkout-btn");
    await expect(toShopping, "買い物かごの「購入手続きへ」").toHaveCount(1, { timeout: 30_000 });
    await Promise.all([this.page.waitForURL(/\/shopping(\?.*)?$/, { waitUntil: "domcontentloaded", timeout: 60_000 }), toShopping.click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }

  /** アドレスバーから直接開く（正本の手順が「ご注文方法指定画面を開く」で、カートの有無を試すケース用） */
  async 直接開く(): Promise<void> {
    await this.page.goto(front("/shopping"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }

  get パス(): string { return new URL(this.page.url()).pathname; }

  // ---- お届け先 ----
  get お届け先の各行(): Locator { return this.page.locator("li.p-hareruya-shipping__address-item"); }
  get お届け先の欄(): Locator { return this.page.locator("section.p-hareruya-shipping__address-selector"); }
  行(配送先名称: string): Locator {
    return this.お届け先の各行.filter({ has: this.page.locator("span.p-hareruya-shipping__address-title", { hasText: new RegExp(`^\\s*${esc(配送先名称)}\\s*(/[\\s\\S]*)?$`) }) });
  }
  async 選択中のお届け先名(): Promise<string> {
    const checked = this.page.locator('input[name="address_id"]:checked');
    if ((await checked.count()) === 0) return "";
    return norm(await checked.locator("xpath=ancestor::li[1]").locator("span.p-hareruya-shipping__address-title").innerText()).replace(/\s*\/\s*[A-Za-z ]+$/, "");
  }
  /** お届け先名称のラジオを選ぶ（選ぶと画面が再読み込みされる） */
  async お届け先を選ぶ(配送先名称: string): Promise<void> {
    const row = this.行(配送先名称);
    await expect(row, `お届け先「${配送先名称}」の行`).toHaveCount(1, { timeout: 30_000 });
    const radio = row.locator('input[name="address_id"]');
    if (await radio.isChecked()) return;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), radio.check({ force: true, timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  /** 行に表示された文（郵便番号・住所・氏名・電話番号） */
  async 行の文(配送先名称: string): Promise<string> {
    return norm(await this.行(配送先名称).innerText());
  }
  get お届け先情報を変更するボタン(): Locator {
    return this.page.locator('button[data-path*="/shopping/shipping_edit/"]').filter({ hasText: "お届け先情報を変更する" });
  }
  get 新しいお届け先を登録するボタン(): Locator {
    return this.page.locator('button[data-path*="/shopping/shipping_edit/"]').filter({ hasText: "新しいお届け先" });
  }
  async 押して配送先画面へ(btn: Locator): Promise<void> {
    await Promise.all([this.page.waitForURL(/\/shopping\/shipping_edit\//, { waitUntil: "domcontentloaded", timeout: 60_000 }), btn.click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 注文の商品 ----
  get 商品の各行(): Locator { return this.page.locator("section.p-hareruya-shipping__order-items .p-hareruya-order-list__row"); }
  async 商品の行(): Promise<{ 言語: string; 商品名: string; 数量: string; 合計: string }[]> {
    return this.商品の各行.evaluateAll((rows) => rows.map((r) => {
      const t = (sel: string) => (r.querySelector(sel)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { 言語: t(".c-hareruya-label--language"), 商品名: t(".p-hareruya-order-list__name-text"), 数量: t(".p-hareruya-order-list__quantity"), 合計: t(".p-hareruya-order-list__total") };
    }));
  }
  async 商品金額合計(): Promise<string> {
    return norm(await this.page.locator("section.p-hareruya-shipping__order-items .p-hareruya-order-list__subtotal-value").first().innerText());
  }

  // ---- 配送方法・支払方法 ----
  get 配送方法の選択肢(): Locator { return this.page.locator('input[name="_shopping_order[Shippings][0][Delivery]"]'); }
  get 配送方法の欄(): Locator { return this.page.locator("section.p-hareruya-shipping__delivery-method-selector"); }
  async 配送方法の名前(): Promise<string[]> {
    return this.配送方法の選択肢.evaluateAll((ns) => ns.map((n) => ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim()));
  }
  async 配送についてリンクを押す(): Promise<void> {
    await this.page.locator('button[data-js-modal-trigger^="shipping-help-modal"]').first().click({ timeout: 30_000 });
  }
  async お支払いについてリンクを押す(): Promise<void> {
    await this.page.locator('button[data-js-modal-trigger="shipping-payment-modal"]').click({ timeout: 30_000 });
  }
  モーダル(id: string): Locator { return this.page.locator(`#${id}`); }
  get 配送についてモーダル(): Locator { return this.page.locator('[id^="shipping-help-modal"]').first(); }
  get お支払いについてモーダル(): Locator { return this.page.locator("#shipping-payment-modal"); }
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 配送先の新規登録・変更画面（お届け先情報を入れて確認画面へ進む前の画面）の項目 */
export class ShippingEditPage {
  constructor(readonly page: Page) {}
  private f(name: string): Locator { return this.page.locator(`form.h-adr [name$="[${name}]"]`).first(); }
  get 画面(): Locator { return this.page.locator("form.h-adr"); }
  get 配送先名称() { return this.f("address_name"); }
  get 姓() { return this.f("name01"); }
  get 名() { return this.f("name02"); }
  get カナ姓() { return this.f("kana01"); }
  get カナ名() { return this.f("kana02"); }
  get 電話1() { return this.f("tel01"); }
  get 電話2() { return this.f("tel02"); }
  get 電話3() { return this.f("tel03"); }
  get 国() { return this.f("country"); }
  get 郵便番号1() { return this.f("postalCode01"); }
  get 郵便番号2() { return this.f("postalCode02"); }
  get 海外郵便番号() { return this.f("abroadPostalCode"); }
  get 都道府県() { return this.f("pref"); }
  get 住所1() { return this.f("addr01"); }
  get 住所2() { return this.f("addr02"); }
  get 住所3() { return this.f("addr03"); }
  get 会社名() { return this.f("company_name"); }
  async 値(l: Locator): Promise<string> {
    if ((await l.count()) === 0) return "";
    return l.evaluate((n) => (n instanceof HTMLSelectElement ? (n.selectedOptions[0]?.textContent ?? "").trim() : (n as HTMLInputElement).value));
  }
  async 表示されている(l: Locator): Promise<boolean> {
    return (await l.count()) > 0 && l.isVisible();
  }
  /** 「確認画面へ」を押す */
  async 確認画面へ(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.page.locator("form.h-adr button[type=submit]").first().click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  /** 確認画面の「登録する」を押す（戻るボタンは押さない） */
  async 確認画面で登録する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.page.getByRole("button", { name: "登録する" }).click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
}
