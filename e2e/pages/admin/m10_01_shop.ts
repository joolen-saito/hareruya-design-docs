/**
 * 店舗基本設定（メニュー「設定」→「店舗設定」→「基本設定」）。M10-01 の画面操作。共有の設定（店舗ID 1）を書き換えるので、
 * 書き換える前の全項目の値を控え（元の値）、ケースが終わったら画面から元の値へ戻す。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { adminUrl } from "../../lib/session";
import { ENV_BANNERS, expectSaved } from "./common";

const SHOP = "/setting/shop";
const nm = (n: string) => `shop_master[${n}]`;
const TOKEN = `[name="${nm("_token")}"]`;

/**
 * 保存を押したが、フォームの送信の印（CSRF）が保存の時点で無効になっていて保存されなかった。
 * 画面には出ない誤り（店舗基本設定の画面は、項目に付かない誤りを表示しない）。開き直して入れ直せば保存できる。
 *
 * 起きた事例（2026-11-11 夜の1本流し IT-F08-05-039。trace の解析）: ログイン直後のダッシュボードが売上グラフの読み込み要求を出し、
 * その途中で店舗基本設定を開いた。二つの要求が同じセッションを同時に読み書きし、あとから終わった売上グラフの要求が、
 * 店舗基本設定を開いたときにセッションへ入った送信の印を消した（応答の画面の印が送る前と別物に作り直されていた。
 * 画面共通の印は同じまま）。そのため送信は 200 で同じ画面に戻り、項目の誤りも「保存しました」も出なかった。
 */
export class 送信の印が無効 extends Error {}

/** 送信の印は表示のたびに乱数で包まれる（「鍵.包んだ鍵.包んだ値」）。中身を取り出して、セッション側の印が同じかを比べる */
function 印の中身(t: string): string {
  const p = t.split(".");
  if (p.length !== 3) return t;
  const b = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const k = b(p[1]);
  const v = b(p[2]);
  if (!k.length) return t;
  return Buffer.from(v.map((x, i) => x ^ k[i % k.length])).toString("base64");
}

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
    // 前の画面（ログイン直後のダッシュボードなど）の読み込み要求が終わってから開く。重なると、開いたときに
    // セッションへ入った送信の印を、あとから終わった要求が消し、保存が黙って失敗する（送信の印が無効 を参照）
    await this.page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
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
  /**
   * 「設定」を押し、送信の応答（POST）と、応答の画面への移動を待つ。応答の状態コードを返す（送られなかったときは null）。
   * 押す は読み込み済みの画面の load を待つだけで画面の移動を待たないので、「再表示された」「更新されない」「エラーが出ない」を確かめる手順はこちらを使う。
   */
  async 押して送信を待つ(): Promise<number | null> {
    const path = new URL(adminUrl(SHOP)).pathname;
    const 応答 = this.page
      .waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === path, { timeout: 90_000 })
      .catch(() => null);
    const 移動 = this.page.waitForNavigation({ waitUntil: "load", timeout: 90_000 }).catch(() => null);
    await this.設定ボタン.click({ timeout: 30_000 });
    const res = await 応答;
    await 移動;
    await this.page.waitForLoadState("load");
    return res ? res.status() : null;
  }
  /**
   * 「設定」を押し、保存されたこと（「保存しました」）を確かめる。
   * 保存に成功すると画面が移る（302）。同じ画面に戻った（200）ときは、成功の表示を60秒待たずに、保存されなかった理由を出す:
   * 項目の誤り（項目名つき）／送信の印が無効（送信の印が無効 で投げる）／画面に出ない誤り。
   */
  async 押して保存を確かめる(what: string): Promise<void> {
    const 送る前の印 = (await this.page.locator(TOKEN).first().inputValue().catch(() => "")) || "";
    const path = new URL(adminUrl(SHOP)).pathname;
    const 応答 = this.page
      .waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === path, { timeout: 90_000 })
      .catch(() => null);
    await this.押す();
    const res = await 応答;
    if (res && res.status() === 200 && 送る前の印) {
      // 同じ画面が描き直された（印は描くたびに包み直されるので、値が変わったら応答の画面）
      await expect(this.page.locator(TOKEN).first(), `${what}: 送信後の画面`).not.toHaveValue(送る前の印, { timeout: 60_000 });
      await this.保存されなかった理由を出す(what, 送る前の印);
    }
    await expectSaved(this.page, what);
  }
  /** 送信が 200 で同じ画面に戻ったときに呼ぶ。必ず投げる */
  private async 保存されなかった理由を出す(what: string, 送る前の印: string): Promise<never> {
    const 項目の誤り = await this.page.evaluate((banners) => {
      const out: string[] = [];
      for (const e of Array.from(document.querySelectorAll<HTMLElement>(".invalid-feedback, .form-error-message, .alert-danger"))) {
        if (!e.offsetParent) continue;
        const 文 = (e.innerText || "").replace(/\s+/g, " ").trim();
        if (!文 || banners.some((b) => 文.includes(b))) continue;
        const 行 = e.closest(".row");
        const 項目 = (行?.querySelector(".col-3")?.textContent ?? "").replace(/\s+/g, " ").trim();
        out.push(項目 ? `${項目}: ${文}` : 文);
      }
      return [...new Set(out)];
    }, ENV_BANNERS);
    if (項目の誤り.length) throw new Error(`${what}: 保存できなかった（項目の誤り）: ${項目の誤り.join(" / ")}`);
    const 応答の印 = await this.page.locator(TOKEN).first().inputValue().catch(() => "");
    const 頭 = `${what}: 保存されなかった（送信の応答が 200 で同じ画面に戻り、項目の誤りも「保存しました」も出ていない）`;
    if (応答の印 && 印の中身(応答の印) !== 印の中身(送る前の印)) {
      throw new 送信の印が無効(`${頭}。フォームの送信の印（CSRF）が、開いたときと保存の時点とで別物になっていた` +
        "（同じログインの別の要求と重なり、セッションから消えた）。開き直して入れ直せば保存できる");
    }
    throw new Error(`${頭}。送信の印は同じだったので、画面に出ない誤り（画面に欄の無い項目など）の疑い`);
  }
  /**
   * 開き直して入れ、保存を確かめる。送信の印が無効で保存されなかったときだけ、開き直して入れ直す（最大 回数 回）。
   * 保存されていないので、入れ直しても二重に保存されることはない。シードの書き換えと、共有の設定を元へ戻すときに使う
   * （画面の動きを確かめるケースの手順には使わない）。
   */
  async 入れて保存する(what: string, 入れる: () => Promise<void>, 回数 = 3): Promise<void> {
    for (let i = 1; ; i++) {
      await this.open();
      await 入れる();
      try {
        await this.押して保存を確かめる(what);
        return;
      } catch (e) {
        if (!(e instanceof 送信の印が無効) || i >= 回数) throw e;
      }
    }
  }
  /**
   * 画面で編集できる全項目の値（元へ戻すための控え）。送信の印・隠し欄・無効の欄・読み取り専用の欄・ボタン・ファイルの欄は含めない。
   * 値は画面の表示のまま（金額の桁区切り「4,800」なども）。全部書く へそのまま渡せば、同じ表示の値として入る。
   */
  async 全部読む(): Promise<控え> {
    return this.page.evaluate(() => {
      const out: Record<string, string | boolean> = {};
      const 除く = new Set(["hidden", "submit", "button", "reset", "image", "file"]);
      for (const e of Array.from(document.querySelectorAll<HTMLInputElement>("#point_form input, #point_form select, #point_form textarea"))) {
        if (!e.name || e.name.endsWith("[_token]") || e.disabled || e.readOnly || 除く.has(e.type)) continue;
        out[e.name] = e.type === "checkbox" ? e.checked : e.value;
      }
      return out;
    });
  }
  /**
   * 控えの値へ戻す。いまの値と違う項目だけを入れ直す（同じ項目は触らない）。入れ直した項目の名前を返す。
   * 控えにある項目が画面に無いときは止める（黙って飛ばさない）。
   */
  async 全部書く(v: 控え): Promise<string[]> {
    const 今 = await this.全部読む();
    const 無い = Object.keys(v).filter((name) => !(name in 今));
    if (無い.length) throw new Error(`店舗基本設定: 控えの項目が画面に無い（編集できる欄として見つからない）: ${無い.join("、")}`);
    const 変えた: string[] = [];
    for (const [name, val] of Object.entries(v)) {
      if (今[name] === val) continue;
      const l = this.page.locator(`[name="${name}"]`);
      if (typeof val === "boolean") await this.page.locator(`label[for="${await l.getAttribute("id")}"]`).click({ timeout: 30_000 });
      else if (name.endsWith("[pref]")) await l.selectOption(val, { timeout: 30_000 });
      else await l.fill(val, { timeout: 60_000 });
      変えた.push(name);
    }
    const 後 = await this.全部読む();
    const 違う = Object.keys(v).filter((name) => 後[name] !== v[name]);
    if (違う.length) throw new Error(`店舗基本設定: 控えの値を入れたが、画面の値が控えと違う: ${違う.map((n) => `${n}（控え「${String(v[n])}」・画面「${String(後[n])}」）`).join("、")}`);
    return 変えた;
  }
  /** 控えの値へ戻して保存する（送信の印が無効のときは開き直して入れ直す） */
  async 控えへ戻して保存する(v: 控え, what: string): Promise<void> {
    await this.入れて保存する(what, async () => { await this.全部書く(v); });
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
