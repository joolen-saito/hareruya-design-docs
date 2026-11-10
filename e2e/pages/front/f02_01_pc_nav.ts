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
