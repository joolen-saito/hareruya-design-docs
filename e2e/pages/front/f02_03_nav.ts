/**
 * F02-03 支店のグローバルナビ（PC版）。支店ECTOP（/ja/<支店URL>/）のヘッダ・フッタ・店舗情報の操作と読み取り。
 */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;

export class BranchNavPage {
  constructor(readonly page: Page) {}

  支店トップのURL(支店URL: string): string { return `${BASE_URL}/ja/${支店URL}/`; }

  async 支店トップを開く(支店URL: string): Promise<number> {
    const res = await this.page.goto(this.支店トップのURL(支店URL), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 支店サイトのトップ以外の画面（ログイン画面）を開く */
  async 支店のログイン画面を開く(支店URL: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/${支店URL}/mypage/login`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }

  readonly ヘッダの支店名 = () => this.page.locator(".p-hareruya-header__branch-name").first();
  readonly フッタの支店名 = () => this.page.locator(".p-hareruya-footer__branch-name").first();
  readonly ヘッダのロゴ = () => this.page.locator("a.p-hareruya-header__logo-link").first();
  readonly フッタのロゴ = () => this.page.locator("a.p-hareruya-footer__logo").first();
  readonly ご当地晴れる屋くん = () => this.page.locator("img.p-hareruya-header__branch-mascot").first();
  readonly 詳細検索ボタン = () => this.page.locator('.p-hareruya-header__nav-right-link[data-modal-open="search"]:visible, .p-hareruya-header__search-detail button:visible').first();
  readonly 詳細検索モーダル = () => this.page.locator("#product-detailed-search-modal");
  /** ヘッダのポイント表示（保有ポイントの数字） */
  readonly ポイントの数字 = () => this.page.locator(".p-hareruya-header__point-value, .p-hareruya-header__point-value-large");
  readonly ポイントの導線 = () => this.page.locator("a.p-hareruya-header__nav-right-link:has(.p-hareruya-header__point-display):visible, a.p-hareruya-header__point-link:visible").first();
  readonly ログインの導線 = () => this.page.locator("header a.p-hareruya-header__nav-right-link", { hasText: "ログイン" }).first();
  readonly マイページの導線 = () => this.page.locator("header a.p-hareruya-header__nav-right-link", { hasText: "マイページ" }).first();
  readonly ログアウトの導線 = () => this.page.getByRole("link", { name: "ログアウト" });
  readonly 店舗情報の郵便番号 = () => this.page.locator(".p-hareruya-footer__address-postal").first();
  readonly 店舗情報の住所 = () => this.page.locator(".p-hareruya-footer__address-text").first();
  readonly 店舗情報の電話 = () => this.page.locator(".p-hareruya-footer__tel").first();
  readonly 店舗情報の営業時間 = () => this.page.locator(".p-hareruya-footer__hours").first();
  readonly 地図のリンク = () => this.page.locator(".p-hareruya-footer__map-link").first();
  フッタのリンク(名前: string): Locator { return this.page.locator("footer a.p-hareruya-footer__nav-link", { hasText: 名前 }).first(); }
  readonly カートの商品数 = () => this.page.locator(".p-hareruya-header__nav-right-item--cart .p-hareruya-header__nav-right-badge");
  readonly カートのリンク = () => this.page.locator("[data-cart-toggle]").first();
  readonly カートの商品概要 = () => this.page.locator("[data-cart-dropdown] .p-hareruya-header__cart-item");

  /** マウスを要素の中心へ動かす（開いたドロップダウンが要素の上に重なっても、動かしたことになる） */
  async マウスオーバーする(l: Locator): Promise<void> {
    const box = await l.boundingBox({ timeout: T });
    if (!box) throw new Error("マウスを動かす先の要素が表示されていない");
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  }

  // ---- カードセット選択・商品検索（ヘッダ） ----
  readonly カードセット選択メニュー = () => this.page.locator("header button[data-search-category-toggle]").first();
  readonly カードセットの表示 = () => this.page.locator("header [data-search-category-text]").first();
  readonly カードセットの値 = () => this.page.locator("header input[data-search-category-input]").first();
  /** 選択肢（「カードセット」の未選択の項目を除く）の名前と値 */
  async カードセットの選択肢(): Promise<{ 名前: string; 値: string }[]> {
    return this.page.locator("header [data-search-category-item]").evaluateAll((bs) => bs
      .map((b) => ({ 名前: (b.textContent ?? "").replace(/\s+/g, " ").trim(), 値: (b as HTMLElement).dataset.value ?? "" }))
      .filter((o) => o.値 !== ""));
  }
  async カードセットメニューを開く(): Promise<void> {
    await this.カードセット選択メニュー().click({ timeout: T });
    await expect(this.page.locator("header [data-search-category-dropdown]").first(), "カードセットの選択肢の一覧").toBeVisible({ timeout: T });
  }
  /** メニューを開いて値（カードセットID）の選択肢を選ぶ */
  async カードセットを選ぶ(値: string): Promise<void> {
    await this.カードセットメニューを開く();
    await this.page.locator(`header [data-search-category-item][data-value="${値}"]`).first().click({ timeout: T });
  }
  readonly 商品検索の入力 = () => this.page.locator("header input[data-search-keyword-input]").first();
  readonly 検索ボタン = () => this.page.locator("header #leftmenu_search_goods_submit").first();
  readonly 検索の候補 = () => this.page.locator("#header_search_suggest");
  /** 商品検索テキストボックスに1文字ずつ入れる（入力のたびに候補を求める画面の作りに合わせる） */
  async 商品検索に入れる(語: string): Promise<void> {
    const box = this.商品検索の入力();
    await expect(box, "商品検索テキストボックス").toBeVisible({ timeout: T });
    await box.click({ timeout: T });
    await box.pressSequentially(語, { delay: 80 });
  }

  // ---- カテゴリバー（PC） ----
  readonly カテゴリバーのボタン = (type: string) => this.page.locator(`.p-hareruya-header__category-btn[data-category="${type}"]`).first();
  readonly カテゴリバーの全ボタン = () => this.page.locator(".p-hareruya-header__category-btn");
  readonly カテゴリのドロップダウン = (type: string) => this.page.locator(`[data-category-dropdown][data-category-type="${type}"]`).first();
  /** ドロップダウンの n 列目（1始まり）の項目（表示名と、子を持つか） */
  カテゴリの項目(type: string, 列: number): Locator {
    return this.カテゴリのドロップダウン(type).locator(`[data-column="${列}"] .p-hareruya-header__category-dropdown-item`);
  }
  async カテゴリの項目の名前(type: string, 列: number): Promise<string[]> {
    return (await this.カテゴリの項目(type, 列).locator(".p-hareruya-header__category-dropdown-item-text").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  // ---- カート（マウスオーバーで開く一覧） ----
  readonly カートのドロップダウン = () => this.page.locator("[data-cart-dropdown]").first();
  readonly カートの合計数の表示 = () => this.page.locator("[data-cart-dropdown] .p-hareruya-header__cart-dropdown-count span").first();
  readonly カートページへの導線 = () => this.page.locator("[data-cart-dropdown] .p-hareruya-header__cart-dropdown-footer a").first();
  /** カート内の商品の名前の並び（表示順。【Foil】の接頭辞を含む） */
  async カートの商品名の並び(): Promise<string[]> {
    return (await this.カートの商品概要().locator(".p-hareruya-header__cart-item-name-text").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  /** 商品名（接頭辞の【Foil】を除いた名前）で引くカート内の商品概要 */
  カートの商品(名前: string): Locator {
    const esc = 名前.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.カートの商品概要().filter({ has: this.page.locator(".p-hareruya-header__cart-item-name-text", { hasText: new RegExp(`^\\s*(【Foil】)?${esc}\\s*$`) }) });
  }
  /** カートにマウスを乗せて、一覧が開いたことを待つ */
  async カートを開く(): Promise<void> {
    await this.マウスオーバーする(this.カートのリンク());
    await expect(this.カートのドロップダウン(), "カートの商品一覧が開く").toHaveClass(/is-active/, { timeout: T });
  }

  // ---- 狭い画面（画面幅390px）の画面下部の並び ----
  readonly 下のナビ = () => this.page.locator("nav.p-hareruya-bottom-nav");
  readonly 下のナビのリンク = (名前: string) => this.下のナビ().locator("a.p-hareruya-bottom-nav__link", { hasText: 名前 });
  readonly ヘッダのリンク = (名前: string) => this.page.locator("header a", { hasText: 名前 });

  /** 新しいタブで開くリンクを押し、開いた先のアドレス（読み込めなければ、最初に要求したアドレス）を返す */
  async 押して新しいタブのアドレスを読む(l: Locator): Promise<string> {
    const ctx = this.page.context();
    const 要求: string[] = [];
    const on = (r: import("@playwright/test").Request) => { try { if (r.isNavigationRequest() && r.frame() === r.frame().page()?.mainFrame() && r.frame().page() !== this.page) 要求.push(r.url()); } catch { /* 閉じたフレーム */ } };
    ctx.on("request", on);
    try {
      const [tab] = await Promise.all([ctx.waitForEvent("page", { timeout: T }), l.click({ timeout: T })]);
      await tab.waitForLoadState("domcontentloaded", { timeout: 60_000 }).catch(() => undefined);
      const url = tab.url();
      return /^https?:/.test(url) ? url : (要求[0] ?? url);
    } finally { ctx.off("request", on); }
  }

  async テキスト(l: Locator): Promise<string> { return (await l.innerText({ timeout: T })).replace(/\s+/g, " ").trim(); }

  /** ご当地晴れる屋くんの画像（表示されている画像）の中身のバイト列 */
  async ご当地晴れる屋くんのバイト列(): Promise<Buffer | null> {
    const img = this.ご当地晴れる屋くん();
    if ((await img.count()) === 0) return null;
    const src = await img.getAttribute("src", { timeout: T });
    if (!src) return null;
    const res = await this.page.request.get(new URL(src, this.page.url()).toString());
    return res.ok() ? await res.body() : null;
  }

  /** リンクを押して遷移する（同じタブ） */
  async 押して遷移する(l: Locator): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), l.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  /** 新しいタブで開くリンクを押し、開いたタブを返す */
  async 押して新しいタブを開く(l: Locator): Promise<Page> {
    const [p] = await Promise.all([this.page.context().waitForEvent("page", { timeout: T }), l.click({ timeout: T })]);
    await p.waitForLoadState("domcontentloaded");
    return p;
  }
  async 表示されている(l: Locator, 何: string): Promise<void> { await expect(l, 何).toBeVisible({ timeout: T }); }
}
