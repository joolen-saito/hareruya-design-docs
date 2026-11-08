/** F06-15 買取履歴詳細（ネット買取）の追加の操作。基本情報・明細・承諾確定。セレクタはここだけに書く。正本: cases/F06-15_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { NetDetailPage } from "./f06_15_net_detail";

const T = 30_000;

export class NetDetailPageB extends NetDetailPage {
  constructor(page: Page) { super(page); }

  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/login`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#login_mypage");
    await form.locator("#login_email").fill(メール, { timeout: T });
    await form.locator("#login_pass").fill(パスワード, { timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), form.locator("button[type=submit]").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  async 履歴一覧を開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/purchase_history`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** 一覧の買取番号（7桁）のリンクを押して詳細を開く */
  async 一覧から詳細を開く(買取番号: string): Promise<void> {
    const link = this.page.locator(".p-hareruya-history-list__box a.c-hareruya-link", { hasText: 買取番号 }).first();
    await link.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), link.dispatchEvent("click")]);
    await this.page.waitForLoadState("load");
  }
  /** 基本情報の項目の値（見出し → 値の文字。見出しが無ければ null） */
  async 項目(見出し: string): Promise<string | null> {
    const row = this.page.locator(".p-hareruya-history-detail__order-info-row").filter({ has: this.page.locator("dt", { hasText: new RegExp(`^\\s*${見出し}\\s*$`) }) }).first();
    if ((await row.count()) === 0) return null;
    return ((await row.locator("dd").first().innerText({ timeout: T })) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 金額欄の数値（桁区切りと通貨記号を除く） */
  async 金額(見出し: string): Promise<number | null> {
    const v = await this.項目(見出し);
    if (v === null) return null;
    const d = v.replace(/[^\d]/g, "");
    return d === "" ? null : Number(d);
  }
  get 承諾確定ボタン(): Locator { return this.page.locator("#purchase-history-net-consent-form .p-hareruya-history-detail__actions button[type=submit]"); }
  get 売却しない件数の表示(): Locator { return this.page.locator("#purchase-history-decline-summary"); }
  get 表示件数の表示(): Locator { return this.page.locator(".p-hareruya-history-detail__table .p-hareruya-toolbar__count p").first(); }
  get マイページボタン(): Locator { return this.page.locator(".p-hareruya-history-detail__btn a, a.c-hareruya-btn[href$='/mypage']").filter({ hasText: "マイページ" }).first(); }
  明細の行(商品名: string): Locator { return this.page.locator(".p-hareruya-purchase-list__row").filter({ has: this.page.locator(".p-hareruya-purchase-list__name-text", { hasText: 商品名 }) }).first(); }
  async 明細の文(商品名: string): Promise<string> { return ((await this.明細の行(商品名).innerText({ timeout: T })) ?? "").replace(/\s+/g, " ").trim(); }
  売却の選択(商品名: string): Locator { return this.明細の行(商品名).locator("select.js-purchase-history-sale-select"); }
  商品名のリンク(商品名: string): Locator { return this.明細の行(商品名).locator("a.p-hareruya-purchase-list__link"); }
  async 明細の査定価格欄(商品名: string): Promise<string> {
    return ((await this.明細の行(商品名).locator(".p-hareruya-purchase-list__col-assessment-price dd").first().innerText({ timeout: T })) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 明細の行の列の値（列: 言語・状態・申込時買取価格・査定価格・数量・小計） */
  async 明細の値(商品名: string, 列: "言語" | "状態" | "申込時買取価格" | "査定価格" | "数量" | "小計"): Promise<string> {
    const cls = { 言語: "language", 状態: "condition", 申込時買取価格: "original-price", 査定価格: "assessment-price", 数量: "quantity", 小計: "total" }[列];
    return ((await this.明細の行(商品名).locator(`.p-hareruya-purchase-list__col-${cls} dd`).first().innerText({ timeout: T })) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 明細の表の見出しの文（見出しの行） */
  async 明細の見出し(): Promise<string> { return ((await this.page.locator(".p-hareruya-purchase-list__header").first().textContent({ timeout: T })) ?? "").replace(/\s+/g, " ").trim(); }
  get まとめて買取の一覧(): Locator { return this.page.locator("#matomete_list"); }
  get 全部売却するチェック(): Locator { return this.page.locator("#purchase-bulk-low-agree"); }
  /** 画面全体の文（確かめの補助） */
  async 本文(): Promise<string> { return ((await this.page.locator("main, body").first().innerText({ timeout: T })) ?? "").replace(/\s+/g, " "); }
  /** 要素を押して画面が移るのを待つ（固定ヘッダーに覆われて押せないときは、クリックの操作を直接送って注記を残す） */
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
