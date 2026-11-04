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
