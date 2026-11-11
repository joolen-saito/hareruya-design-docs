/**
 * F05-05 ネット買取カート（フロント）の画面操作。セレクタ・アドレスはここだけに書く。正本: cases/F05-05_test_cases.tsv
 *
 * 画面の作り（アプリの Purchase/cart.twig・Block/js/Purchase/purchase_cart_js.twig・purchase_cart_sync_js.twig で確かめた）:
 * - アドレスは /ja/purchase/cart。明細の行は data-product-class-id（商品規格ID）を持つ。商品名は同じ名前が並ぶことがあるので、行は商品規格IDで探す。
 * - 数量の欄から外れたとき・プラス・マイナス・削除を押したとき、画面が合計を計算し直して、数量の一覧をサーバーへ送る（画面は読み込み直さない）。
 * - まとめて買取がカートに無く、明細があるときは、読み込み後に「ご案内」のモーダルが開く。ほかの操作の前に閉じる。
 * - 追加のあとに出る「知らせ」（画面共通のポップアップ）に「カートを見る」のリンクがある。正本の「ダイアログ」はこれに当てた。
 * - 金額は「¥1,000」の形。比べるときは「¥」と空白を除き「1,000」にする。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { NetBuyDetailPage } from "./f05_04_net_detail";

const front = (p: string) => `${BASE_URL}/ja${p}`;
const OPEN = 30_000;
export const 金額 = (t: string): string => t.replace(/[¥\s]/g, "");
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

export type 行の値 = { 数量: string; 合計: string };

export class NetBuyCart05Page {
  /** 画面が出した alert の文（更新の失敗など。Playwright は自動で閉じるので、ここに溜める） */
  readonly アラート: string[] = [];
  constructor(readonly page: Page) {
    page.setDefaultTimeout(OPEN);
    page.on("dialog", (d) => { this.アラート.push(d.message()); void d.dismiss().catch(() => undefined); });
  }

  get パス(): string { return new URL(this.page.url()).pathname; }

  // ---- 事前準備（ログイン・カートへ追加） ----

  /** 会員ログイン画面でログインする */
  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(front("/mypage/login"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await this.page.locator("#login_email").fill(メール);
    await this.page.locator("#login_pass").fill(パスワード);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.page.locator("form#login_mypage button[type=submit]").click(),
    ]);
    await this.page.waitForLoadState("load");
    expect(this.パス, "ログイン後の画面（ログイン画面のままではない）").not.toMatch(/\/login/);
  }

  /** 商品詳細を開く（言語は ?lang、規格は &class） */
  async 詳細を開く(商品ID: string, 規格ID: string, 言語: "JP" | "EN"): Promise<NetBuyDetailPage> {
    const d = new NetBuyDetailPage(this.page);
    expect(await d.開く(商品ID, { 言語, 商品クラス: 規格ID }), "買取商品詳細の応答").toBeLessThan(400);
    await expect(d.商品名, "ネット買取商品詳細の商品名の見出し").toBeVisible();
    return d;
  }

  /**
   * 事前準備: 商品詳細から数量ぶん買取カートへ入れる。「カートに追加」ボタンがある（買取価格500円以上）ときは画面のとおりに押し、
   * 無い（500円未満）ときは、ボタンが送る追加の要求（同じ宛先・同じ値）を画面のスクリプトから送る。
   */
  async カートへ入れる(商品ID: string, 規格ID: string, 言語: "JP" | "EN", 数量: number): Promise<"ボタン" | "要求"> {
    const d = await this.詳細を開く(商品ID, 規格ID, 言語);
    if ((await d.カートに追加ボタン.count()) > 0) {
      await d.数量を入れる(String(数量));
      await d.カートに追加を押す();
      return "ボタン";
    }
    const r = await this.page.evaluate(async ({ id, n }) => {
      const $ = (window as unknown as { jQuery: unknown }).jQuery as {
        ajax: (o: unknown) => { done: (f: () => void) => { fail: (f: (x: { status: number; responseText: string }) => void) => void } };
      };
      return new Promise<string>((resolve) => {
        $.ajax({ url: `${location.origin}/ja/purchase/add`, type: "POST", data: { product_class_id: id, quantity: n } })
          .done(() => resolve("ok"))
          .fail((x) => resolve(`ng ${x.status} ${x.responseText}`));
      });
    }, { id: 規格ID, n: 数量 });
    expect(r, `商品規格 ${規格ID} を数量 ${数量} で買取カートへ追加した結果`).toBe("ok");
    return "要求";
  }

  // ---- カート ----

  async 開く(): Promise<void> {
    await this.page.goto(front("/purchase/cart"), { timeout: 60_000, waitUntil: "load" });
    await expect(this.page.locator("#purchase-cart-form"), "ネット買取カートの画面").toBeVisible();
  }
  async 再読み込み(): Promise<void> {
    await this.page.reload({ timeout: 60_000, waitUntil: "load" });
    await expect(this.page.locator("#purchase-cart-form"), "ネット買取カートの画面").toBeVisible();
  }

  get お知らせモーダル(): Locator { return this.page.locator("#purchase-cart-alert-modal"); }
  /** カートを開いたときに出る「ご案内」のモーダルを閉じる（出ていなければ何もしない）。閉じたかを返す */
  async お知らせを閉じる(): Promise<boolean> {
    const shown = await this.お知らせモーダル.waitFor({ state: "visible", timeout: 4_000 }).then(() => true, () => false);
    if (shown) {
      await this.お知らせモーダル.locator("button[data-js-modal-close]").last().click();
      await expect(this.お知らせモーダル, "ご案内のモーダルが閉じる").toBeHidden();
    }
    return shown;
  }
  /** カートを開き、ご案内のモーダルがあれば閉じる */
  async 開いて整える(): Promise<void> { await this.開く(); await this.お知らせを閉じる(); }
  async 再読み込みして整える(): Promise<void> { await this.再読み込み(); await this.お知らせを閉じる(); }

  get 明細の行(): Locator { return this.page.locator(".purchase-cart__line"); }
  行(規格ID: string): Locator { return this.page.locator(`.purchase-cart__line[data-product-class-id="${規格ID}"]`); }
  数量欄(規格ID: string): Locator { return this.行(規格ID).locator(".qty-input"); }
  合計(規格ID: string): Locator { return this.行(規格ID).locator(".js-purchase-cart-line-subtotal"); }
  get 小計(): Locator { return this.page.locator(".js-purchase-cart-total"); }
  プラス(規格ID: string): Locator { return this.行(規格ID).locator(".btn-plus"); }
  マイナス(規格ID: string): Locator { return this.行(規格ID).locator(".btn-minus"); }
  削除ボタン(規格ID: string): Locator { return this.行(規格ID).locator(".js-purchase-cart-remove"); }
  商品名リンク(規格ID: string): Locator { return this.行(規格ID).locator("a.p-hareruya-cart-item__name"); }
  画像(規格ID: string): Locator { return this.行(規格ID).locator("img.p-hareruya-cart-item__image"); }

  /** 行の数量の欄の値と商品ごとの合計金額（行が無ければ null） */
  async 行を読む(規格ID: string): Promise<行の値 | null> {
    if ((await this.行(規格ID).count()) === 0) return null;
    return { 数量: await this.数量欄(規格ID).inputValue(), 合計: 金額(await this.合計(規格ID).innerText()) };
  }
  async 小計を読む(): Promise<string> { return 金額(await this.小計.innerText()); }

  get 空の案内(): Locator { return this.page.locator("#purchase-cart-empty"); }
  get 空の案内の文(): Locator { return this.空の案内.locator(".p-hareruya-cart__empty"); }
  get TOPへ戻るボタン(): Locator { return this.空の案内.locator("a", { hasText: "TOPへ戻る" }); }
  async 空の案内の文を読む(): Promise<string> { return norm(await this.空の案内の文.innerText()).replace(/\s/g, ""); }

  // ---- 操作（画面を読み込み直さないことを、画面の印で確かめられるようにする） ----

  /** 画面の印を付ける（読み込み直すと消える） */
  async 画面の印を付ける(): Promise<void> { await this.page.evaluate(() => { (window as unknown as { __f0505Mark?: string }).__f0505Mark = "kept"; }); }
  async 画面の印が残っている(): Promise<boolean> { return this.page.evaluate(() => (window as unknown as { __f0505Mark?: string }).__f0505Mark === "kept"); }

  /** 操作をして、数量の一覧の更新の応答（無ければ null）を返す */
  async 更新の応答を待つ(操作: () => Promise<void>): Promise<number | null> {
    const res = this.page.waitForResponse(
      (r) => new URL(r.url()).pathname === "/ja/purchase/cart" && r.request().method() === "POST", { timeout: 8_000 },
    ).then((r) => r.status(), () => null);
    await 操作();
    return res;
  }

  async 数量を入れて外す(規格ID: string, 値: string): Promise<void> {
    const f = this.数量欄(規格ID);
    await f.fill(値);
    await f.blur();
  }
  /** 開発者ツールの代わり: 数量の欄の値を直接書き換える（欄から外れる処理は走らせない） */
  async 数量の値を書き換える(規格ID: string, 値: string): Promise<void> {
    await this.数量欄(規格ID).evaluate((el, v) => { (el as HTMLInputElement).value = v; }, 値);
  }
  /** 開発者ツールの代わり: 数量の欄を文字を入れられる欄に直して、数字でない値を入れる */
  async 数量に文字を設定する(規格ID: string, 値: string): Promise<void> {
    await this.数量欄(規格ID).evaluate((el, v) => { (el as HTMLInputElement).type = "text"; (el as HTMLInputElement).value = v; }, 値);
  }
  async 数量の欄から外す(規格ID: string): Promise<void> {
    const f = this.数量欄(規格ID);
    await f.focus();
    await f.blur();
  }

  // ---- なりすまし対策トークン ----

  get トークン入力(): Locator { return this.page.locator('#purchase-cart-form input[name="_token"]'); }

  // ---- 商品詳細の追加のあとの知らせ ----

  get 知らせ(): Locator { return this.page.locator("#hareruya-app-cart-popup.is-visible"); }
  async 知らせの文(): Promise<string> {
    await expect(this.知らせ, "「カートに追加」のあとの知らせ").toBeVisible({ timeout: 10_000 });
    return norm(await this.知らせ.locator(".p-hareruya-cart-popup__message").innerText());
  }
  /** 知らせを閉じる */
  async 知らせを閉じる(): Promise<void> {
    await this.知らせ.locator(".p-hareruya-cart-popup__close").click();
    await expect(this.page.locator("#hareruya-app-cart-popup.is-visible"), "知らせが閉じる").toHaveCount(0);
  }
  /** 知らせの「カートを見る」で買取カートへ進む */
  async 知らせからカートへ進む(): Promise<void> {
    const link = this.知らせ.locator("a.p-hareruya-cart-popup__link");
    await expect(link, "知らせのカートへのリンク").toBeVisible();
    await Promise.all([this.page.waitForURL(/\/purchase\/cart(\?.*)?$/, { timeout: 60_000, waitUntil: "load" }), link.click()]);
    await expect(this.page.locator("#purchase-cart-form"), "ネット買取カートの画面").toBeVisible();
  }

  /** 詳細の「カートに追加」を押し、追加の応答の状態と知らせの文を返す（ボタンは画面のとおり押す） */
  async 追加を押す(d: NetBuyDetailPage): Promise<{ 応答: number; 知らせ: string }> {
    const res = this.page.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/purchase/add") && r.request().method() === "POST", { timeout: 30_000 });
    await d.カートに追加ボタン.click();
    const r = await res;
    return { 応答: r.status(), 知らせ: await this.知らせの文() };
  }

  /**
   * 開発者ツールの代わり: 商品数の入力欄の値を書き換えて（欄から外れる処理を走らせないよう、欄を押さず）、「カートに追加」を押す。
   * 値を空にすると数量の指定なしで送られる。
   */
  async 数量を書き換えて追加を押す(d: NetBuyDetailPage, 値: string): Promise<{ 応答: number; 知らせ: string }> {
    await d.数量.evaluate((el, v) => { (el as HTMLInputElement).value = v; }, 値);
    const res = this.page.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/purchase/add") && r.request().method() === "POST", { timeout: 30_000 });
    await d.カートに追加ボタン.evaluate((b) => (b as HTMLElement).click());
    const r = await res;
    return { 応答: r.status(), 知らせ: await this.知らせの文() };
  }

  // ---- 画面内のボタン ----

  /** 画面内のボタン（button・押せる input）の表示名 */
  async ボタンの表示名(): Promise<string[]> {
    return this.page.locator('button:visible, input[type="button"]:visible, input[type="submit"]:visible, [role="button"]:visible').evaluateAll((ns) => ns.map((n) => {
      const e = n as HTMLInputElement;
      return ((n.tagName === "INPUT" ? e.value : n.textContent) ?? "").replace(/\s+/g, " ").trim() || (n.getAttribute("aria-label") ?? "");
    }));
  }
}
