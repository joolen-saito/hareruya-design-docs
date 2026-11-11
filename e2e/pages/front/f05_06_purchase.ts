/**
 * F05-06 ネット買取 買取手続き〜完了（フロント）の画面操作。セレクタ・アドレスはここだけに書く。正本: cases/F05-06_test_cases.tsv
 *
 * 画面の作り（アプリの Purchase/cart.twig・fill.twig・complete.twig と各画面のスクリプトで確かめた）:
 * - 買取カート（/ja/purchase/cart）は、開いたときに「ご案内」のモーダルが出ることがある（まとめて買取が入っていないとき）。「買取手続きへ」の前に閉じる。
 * - 数量の欄は欄から外れたときに 1〜20 へ丸められる（0 は 1 になる）。「買取手続きへ」は数量を送ってから買取ログイン画面（/ja/purchase/login）へ移り、
 *   ログイン済みならそのまま買取依頼内容の記入画面（/ja/purchase/fill）へ移る。カートが空なら買取カートへ戻る。
 * - 記入画面の「申込み」は確認のモーダルを開き、モーダルの「申込み」で送信する。完了すると /ja/purchase/complete に「買取番号　PUyymmdd-10桁」が出る。
 * - 買取価格が500円未満の商品は、買取商品詳細に「カートに追加」ボタンが出ない（画面の作り）。そのため買取カートへの追加は、
 *   ボタンが送る追加の要求（同じ宛先・同じ値）を、買取商品詳細の画面のスクリプトから送る（カートに入れるだけの事前準備）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { NetBuyCartPage, NetBuyDetailPage } from "./f05_04_net_detail";

const front = (p: string) => `${BASE_URL}/ja${p}`;
const OPEN = 30_000;
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

export type 記入の値 = {
  銀行名: string; 支店名: string; 口座種別: "普通" | "当座" | "貯蓄"; 口座番号: string; 口座名義: string; 箱数: string;
  承諾方法: "査定結果を確認してから承諾する" | "自動承諾を利用する";
  適格請求書発行事業者: boolean; 登録番号?: string; 規約同意: boolean;
  職業?: string; 生年月日?: [string, string, string];
};

/** 正本の通常申込入力値（S-F05-06-INPUT-BASE） */
export const 通常申込入力値: 記入の値 = {
  銀行名: "晴銀行", 支店名: "本店", 口座種別: "普通", 口座番号: "1234567", 口座名義: "ハレヤタロウ", 箱数: "1",
  承諾方法: "査定結果を確認してから承諾する", 適格請求書発行事業者: false, 規約同意: true,
};

export type 注文の行 = { 商品コード: string; 商品名: string; 数量: string; 合計: string };

export class PurchaseFlowPage {
  readonly cart: NetBuyCartPage;
  constructor(readonly page: Page) {
    page.setDefaultTimeout(OPEN);
    this.cart = new NetBuyCartPage(page);
  }

  get パス(): string { return new URL(this.page.url()).pathname.replace(/^\/ja/, ""); }

  // ---- 事前準備（ログイン・カートへ追加） ----

  /** 会員ログイン画面でログインする（買取ログイン画面はカートが空だとカートへ戻されるので、同じログインの画面を使う） */
  async 会員ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(front("/mypage/login"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await this.page.locator("#login_email").fill(メール);
    await this.page.locator("#login_pass").fill(パスワード);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.page.locator("form#login_mypage button[type=submit]").click(),
    ]);
    await this.page.waitForLoadState("load");
    expect(new URL(this.page.url()).pathname, "ログイン後の画面（ログイン画面のままではない）").not.toMatch(/\/login/);
  }

  /** 買取商品詳細の画面から、商品規格を数量ぶん買取カートへ追加する（500円未満の商品は「カートに追加」ボタンが無いので、ボタンと同じ要求を送る） */
  async カートへ追加する(商品ID: string, 規格ID: string, 数量: number): Promise<void> {
    const d = new NetBuyDetailPage(this.page);
    expect(await d.開く(商品ID, { 言語: "JP", 商品クラス: 規格ID }), "買取商品詳細の応答").toBeLessThan(400);
    const r = await this.page.evaluate(async ({ id, n }) => {
      const $ = (window as unknown as { jQuery: (...a: unknown[]) => unknown; }).jQuery as unknown as {
        ajax: (o: unknown) => { done: (f: () => void) => { fail: (f: (x: { status: number; responseText: string }) => void) => void } };
      };
      return new Promise<string>((resolve) => {
        $.ajax({ url: `${location.origin}/ja/purchase/add`, type: "POST", data: { product_class_id: id, quantity: n } })
          .done(() => resolve("ok"))
          .fail((x) => resolve(`ng ${x.status} ${x.responseText}`));
      });
    }, { id: 規格ID, n: 数量 });
    expect(r, `商品規格 ${規格ID} を数量 ${数量} で買取カートへ追加した結果`).toBe("ok");
  }

  // ---- 買取カート ----

  async カートを開く(): Promise<void> {
    await this.cart.開く();
    await this.お知らせを閉じる();
  }

  /** カートを開いたときに出る「ご案内」のモーダルを閉じる（出ていなければ何もしない） */
  async お知らせを閉じる(): Promise<void> {
    const modal = this.page.locator("#purchase-cart-alert-modal");
    const shown = await modal.waitFor({ state: "visible", timeout: 4_000 }).then(() => true, () => false);
    if (shown) {
      await modal.locator("button[data-js-modal-close]").last().click();
      await expect(modal, "ご案内のモーダルが閉じる").toBeHidden();
    }
  }

  get カートの行(): Locator { return this.page.locator(".purchase-cart__line"); }
  /** 商品名のリンクの文で行を探す */
  商品名の行(商品名: string): Locator { return this.カートの行.filter({ has: this.page.locator("a.p-hareruya-cart-item__name", { hasText: 商品名 }) }); }
  /** カートの行の数量の欄 */
  数量欄(商品名: string): Locator { return this.商品名の行(商品名).locator(".qty-input"); }
  async 数量を入れる(商品名: string, 値: string): Promise<void> {
    const f = this.数量欄(商品名);
    await f.fill(値);
    await f.blur();
  }

  /** 「買取手続きへ」を押して、移った先（記入画面・買取ログイン画面・カート）までの画面の移動を待つ */
  async 買取手続きへを押す(): Promise<void> {
    await this.お知らせを閉じる();
    const nav = this.page.waitForURL(/\/purchase\/(fill|login)(\?.*)?$/, { timeout: 60_000, waitUntil: "load" });
    await this.page.locator(".js-purchase-cart-proceed").click();
    await nav;
    await this.page.waitForLoadState("load");
    // カートの数量の送信のあと、買取ログイン画面を経て記入画面へ移る（途中の移動を待つ）
    if (/\/purchase\/login/.test(this.page.url())) await this.page.waitForURL(/\/purchase\/(fill|cart)(\?.*)?$/, { timeout: 15_000 }).catch(() => undefined);
    await this.page.waitForLoadState("load");
  }

  // ---- 記入画面 ----

  get 記入画面の印(): Locator { return this.page.locator("#purchase-form"); }
  get 注文主の名前(): Locator { return this.page.locator(".p-hareruya-shipping__address-name"); }
  get 注文主の郵便番号(): Locator { return this.page.locator(".p-hareruya-shipping__address-postal"); }
  get 注文主の住所(): Locator { return this.page.locator(".p-hareruya-shipping__address-street"); }
  get 注文主の電話番号(): Locator { return this.page.locator(".p-hareruya-shipping__address-tel"); }
  get 買取金額合計(): Locator { return this.page.locator(".p-hareruya-order-list__subtotal-value"); }

  async 注文の商品(): Promise<注文の行[]> {
    return this.page.locator(".p-hareruya-order-list__row").evaluateAll((rows) => rows.map((r) => {
      const t = (c: string) => (r.querySelector(c)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return {
        商品コード: t(".p-hareruya-order-list__code"), 商品名: t(".p-hareruya-order-list__name-text"),
        数量: t(".p-hareruya-order-list__quantity"), 合計: t(".p-hareruya-order-list__total"),
      };
    }));
  }

  private f(name: string): Locator { return this.page.locator(`[name="purchase_confirm[${name}]"]`); }
  get 職業の欄(): Locator { return this.f("job"); }
  get 生年月日の欄(): Locator { return this.f("birth][year"); }

  async 入力する(v: 記入の値): Promise<void> {
    if (v.職業 !== undefined) await this.職業の欄.selectOption({ label: v.職業 });
    if (v.生年月日) {
      await this.f("birth][year").selectOption(v.生年月日[0]);
      await this.f("birth][month").selectOption(v.生年月日[1]);
      await this.f("birth][day").selectOption(v.生年月日[2]);
    }
    await this.f("bankCode").fill(v.銀行名);
    await this.f("branchCode").fill(v.支店名);
    await this.page.locator("label.c-hareruya-radio").filter({ has: this.f("accountTypeId") }).filter({ hasText: new RegExp(`^\\s*${v.口座種別}\\s*$`) }).click();
    await this.f("accountNo").fill(v.口座番号);
    await this.f("accountHolder").fill(v.口座名義);
    await this.f("packageCount").selectOption(v.箱数);
    await this.page.locator("label.c-hareruya-radio").filter({ has: this.f("autoApprovalFlg") }).filter({ hasText: v.承諾方法 }).click();
    await this.page.locator(`#isQualifiedInvoiceIssuer_${v.適格請求書発行事業者 ? "true" : "false"}`).check({ force: true });
    if (v.適格請求書発行事業者 && v.登録番号 !== undefined) await this.page.locator("[data-js-invoice-code-validation]").fill(v.登録番号);
    if (v.規約同意) await this.page.locator("#confirm-purchase").check({ force: true });
  }

  get 申込みボタン(): Locator { return this.page.locator("#purchase-confirm-button"); }
  get 確認モーダル(): Locator { return this.page.locator("#purchase-confirm-modal"); }

  /** 記入画面の「申込み」を押し、確認のモーダルが開くのを待つ */
  async 申込みを押す(): Promise<void> {
    await this.申込みボタン.click();
    await expect(this.確認モーダル, "申込みの確認モーダル").toHaveClass(/is-active/);
  }

  /** 確認モーダルの「申込み」を押し、移った先を待つ（完了・カート・ログイン画面のどれか） */
  async モーダルの申込みを押す(): Promise<void> {
    const nav = this.page.waitForURL(/\/purchase\/(complete|cart|login)(\?.*)?$/, { timeout: 90_000, waitUntil: "load" });
    await this.確認モーダル.locator("[data-js-confirm-modal-submit]").click();
    await nav;
    await this.page.waitForLoadState("load");
  }

  /** 完了画面の「買取番号　PUyymmdd-10桁」から、買取の番号（数字）を読む */
  async 完了した買取の番号(): Promise<string> {
    const t = norm(await this.page.locator(".c-hareruya-heading--lev3").filter({ hasText: "買取番号" }).first().innerText());
    const m = /PU\d{6}-(\d+)/.exec(t);
    if (!m) throw new Error(`完了画面に買取番号が読めない（${t}）`);
    return String(Number(m[1]));
  }
}
