/**
 * F02-01 PC版ナビゲーション（本店）。ヘッダの部品は支店と同じ作り（Block/header_user.twig）なので、F02-03 の部品を継いで本店のトップを開く操作と、
 * お気に入り欄を足す。セレクタはここだけに書く。正本: cases/F02-01_test_cases.tsv
 */
import { Locator } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { BranchNavPage } from "./f02_03_nav";

export class MainNavPage extends BranchNavPage {
  async 本店トップを開く(): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await this.マウスを離す();
    return res?.status() ?? 0;
  }
  /** マウスの位置でヘッダの「商品詳細検索」の欄が開き、ヘッダを覆うので、マウスを画面の下の方へ動かして閉じる（画面の証拠のため） */
  async マウスを離す(): Promise<void> {
    await this.page.mouse.move(640, 700);
    await this.page.waitForTimeout(300);
  }
  readonly ヘッダ = (): Locator => this.page.locator("header").first();
  readonly お気に入りのアイコン = (): Locator => this.page.locator("header .p-hareruya-header__nav-right-item--favorite .icon-hareruya-favorite").first();
  /** お気に入り登録済み商品数（見えているものだけ） */
  readonly お気に入りの件数 = (): Locator => this.page.locator('header .p-hareruya-header__nav-right-item--favorite [data-js-target="favorite-count"]:visible');
  /** カートの商品数（見えているものだけ） */
  readonly 見えているカートの商品数 = (): Locator => this.page.locator(".p-hareruya-header__nav-right-item--cart .p-hareruya-header__nav-right-badge:visible");
}

/**
 * F02-01 の続き（-b）で足した、ヘッダのお気に入り・カートの操作（MainNavPage は変えない。継いで足す）。
 * カートのドロップダウンは、カートへマウスを乗せると開く（Block/js/header_cart_js.twig）。数量の増減・削除は cart_handle_item へ要求を送り、
 * ヘッダのカートを /block/cart で取り直す。
 */
export class MainNavCartPage extends MainNavPage {
  readonly お気に入りのリンク = (): Locator => this.page.locator("header .p-hareruya-header__nav-right-item--favorite a.p-hareruya-header__nav-right-link").first();
  readonly カートのドロップダウン = (): Locator => this.page.locator("[data-cart-dropdown]").first();
  /** ドロップダウンの「合計 n 点」 */
  readonly カート内の合計 = (): Locator => this.page.locator("[data-cart-dropdown] .p-hareruya-header__cart-dropdown-count").first();
  readonly カートページへ = (): Locator => this.page.locator("[data-cart-dropdown] .p-hareruya-header__cart-dropdown-footer a").first();
  カートの行(商品名: string): Locator {
    return this.page.locator("[data-cart-dropdown] .p-hareruya-header__cart-item")
      .filter({ has: this.page.locator(".p-hareruya-header__cart-item-name-text", { hasText: 商品名 }) }).first();
  }
  行の削除 = (行: Locator): Locator => 行.locator("[data-cart-item-delete]").first();
  行のマイナス = (行: Locator): Locator => 行.locator("[data-cart-item-decrement]").first();
  行のプラス = (行: Locator): Locator => 行.locator("[data-cart-item-increment]").first();
  行の商品数 = (行: Locator): Locator => 行.locator(".p-hareruya-header__cart-item-quantity-input").first();
  行の商品名 = (行: Locator): Locator => 行.locator(".p-hareruya-header__cart-item-name-text").first();

  /** ヘッダのカートの商品数が出るまで待つ（ヘッダのカートは読み込みのあとに取り直されることがある） */
  async カートの商品数を待つ(timeout = 30_000): Promise<void> {
    await this.見えているカートの商品数().first().waitFor({ state: "visible", timeout }).catch(() => undefined);
  }
  /** カートへマウスを乗せ、ドロップダウンが開くのを待つ */
  async カートへマウスオーバーする(): Promise<void> {
    await this.マウスオーバーする(this.カートのリンク());
    await this.page.waitForTimeout(500);
  }
  /** 行のボタンを押し、数量の更新とヘッダのカートの取り直しの応答を待つ */
  async 行のボタンを押す(ボタン: Locator): Promise<{ 更新の応答: number; 取り直し: boolean }> {
    const 更新 = this.page.waitForResponse((r) => /\/cart\/(up|down|remove|set)\/\d+/.test(new URL(r.url()).pathname), { timeout: 30_000 }).catch(() => null);
    const 取り直し = this.page.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/block/cart"), { timeout: 30_000 }).catch(() => null);
    await ボタン.click({ timeout: 30_000 });
    const u = await 更新;
    const t = await 取り直し;
    await this.page.waitForTimeout(500);
    return { 更新の応答: u?.status() ?? 0, 取り直し: !!t };
  }
}
