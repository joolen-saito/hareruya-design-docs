/**
 * 店舗基本設定（メニュー「設定」→「店舗設定」→「基本設定」）。M10-01 の画面操作。共有の設定（店舗ID 1）を書き換えるので、
 * 書き換える前の全項目の値を控え（元の値）、ケースが終わったら画面から元の値へ戻す。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const SHOP = "/setting/shop";
const nm = (n: string) => `shop_master[${n}]`;

/** 正本の項目名 → 画面の項目 */
export const 項目名: Record<string, string> = {
  会社名: "company_name", "会社名(フリガナ)": "company_kana", 店名: "shop_name", "店名(フリガナ)": "shop_kana", "店名(英語表記)": "shop_name_eng",
  郵便番号: "postal_code", 都道府県: "address][pref", 市区町村名: "address][addr01", "番地・ビル名": "address][addr02", "住所(英語表記)": "address_en",
  電話番号: "phone_number", FAX番号: "fax_number", 店舗営業時間: "business_hour",
  送信元メールアドレス: "email01", 返信先メールアドレス: "email03", 送信エラー通知メールアドレス: "email04", 問い合わせ専用メールアドレス: "email02",
  取扱商品: "good_traded", メッセージ: "message", X公式アカウントURL: "x_account_url", "ショップ名略称(英語表記)": "short_name_en",
  スマレジ店舗ID: "smaregi_shop_id", スマレジ店舗コード: "smaregi_shop_code", "送料無料条件(金額)": "delivery_free_amount", "送料無料条件(数量)": "delivery_free_quantity",
};
export const トグル名: Record<string, string> = {
  商品ごとの送料設定: "option_product_delivery_fee", 複数配送: "option_multiple_shipping", 仮会員: "option_customer_activate",
  マイページの注文状況表示: "option_mypage_order_status_display", お気に入り商品: "option_favorite_product", 自動ログイン: "option_remember_me", 在庫切れ商品の非表示: "option_nostock_hidden",
};
export const 七つのトグル = Object.keys(トグル名);
/** 画面に入力欄が無い項目（アプリの店舗基本設定に無い） */
export const 画面に無い項目 = ["経度", "緯度"];

export type 控え = Record<string, string | boolean>;

const loc = (page: Page, key: string) => page.locator(`[name="${key.includes("][") ? `shop_master[${key}]` : nm(key)}"]`);

export class ShopBasicPage {
  constructor(readonly page: Page) {}
  async open(): Promise<void> {
    await this.page.goto(adminUrl(SHOP), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(loc(this.page, "shop_name"), "店舗基本設定の店名欄").toBeVisible({ timeout: 30_000 });
  }
  欄(項目: string) { return loc(this.page, 項目名[項目]); }
  スイッチ(項目: string) { return loc(this.page, トグル名[項目]); }
  async 欄がある(項目: string): Promise<boolean> {
    if (画面に無い項目.includes(項目)) return false;
    return (await this.欄(項目).count()) > 0;
  }
  async 入れる(項目: string, 値: string): Promise<void> {
    const l = this.欄(項目);
    if (項目 === "都道府県") { await l.selectOption({ label: 値 }, { timeout: 30_000 }); return; }
    await l.fill(値, { timeout: 60_000 });
  }
  async 値(項目: string): Promise<string> {
    const l = this.欄(項目);
    if (項目 === "都道府県") return (await l.locator("option:checked").innerText()).trim();
    return l.inputValue();
  }
  async トグルを(項目: string, 有効: boolean): Promise<void> {
    const l = this.スイッチ(項目);
    if ((await l.isChecked()) === 有効) return;
    // 入力欄そのものは隠れていて、横のラベルを押して切り替える
    await this.page.locator(`label[for="${await l.getAttribute("id")}"]`).click({ timeout: 30_000 });
    expect(await l.isChecked(), "スイッチの切り替え後の状態").toBe(有効);
  }
  async 有効か(項目: string): Promise<boolean> { return this.スイッチ(項目).isChecked(); }
  get 設定ボタン() { return this.page.locator("form#point_form button[type=submit]").first(); }
  /** 「設定」（画面上の名前は「登録」）を押す。送信されたら応答の画面に移る */
  async 押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.設定ボタン.click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  async 押して保存を確かめる(what: string): Promise<void> {
    await this.押す();
    await expectSaved(this.page, what);
  }
  /** 画面の全項目の値（元へ戻すための控え） */
  async 全部読む(): Promise<控え> {
    return this.page.evaluate(() => {
      const out: Record<string, string | boolean> = {};
      for (const e of Array.from(document.querySelectorAll<HTMLInputElement>("#point_form input, #point_form select, #point_form textarea"))) {
        if (!e.name || e.name.endsWith("[_token]")) continue;
        out[e.name] = e.type === "checkbox" ? e.checked : e.value;
      }
      return out;
    });
  }
  async 全部書く(v: 控え): Promise<void> {
    for (const [name, val] of Object.entries(v)) {
      const l = this.page.locator(`[name="${name}"]`);
      if (typeof val === "boolean") { if ((await l.isChecked()) !== val) await this.page.locator(`label[for="${await l.getAttribute("id")}"]`).click({ timeout: 30_000 }); }
      else if (name.endsWith("[pref]")) await l.selectOption(val, { timeout: 30_000 });
      else await l.fill(val, { timeout: 60_000 });
    }
  }
}

const FILE = path.join(STATE_DIR, "m10_01_shop_original.json");

/** 書き換える前の値を控える（控えのファイルがあればそれが元の値。前の実行が途中で止まって書き換えたままでも、元へ戻せる） */
export async function 元の値を控える(page: Page): Promise<控え> {
  if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf-8")) as 控え;
  const p = new ShopBasicPage(page);
  await p.open();
  const v = await p.全部読む();
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(v, null, 1));
  return v;
}
export function 控えがある(): boolean { return fs.existsSync(FILE); }
export function 控えを読む(): 控え { return JSON.parse(fs.readFileSync(FILE, "utf-8")) as 控え; }
export function 控えを捨てる(): void { fs.rmSync(FILE, { force: true }); }
