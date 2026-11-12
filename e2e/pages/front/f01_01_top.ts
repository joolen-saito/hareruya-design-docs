/**
 * F01-01 本店ECTOP（/ja/・/en/）の操作と読み取り。セレクタはここだけに書く。正本: cases/F01-01_test_cases.tsv
 * 画面の作りはアプリのテンプレート（index・Block/mv_carousel・Block/favorites・Block/_top_favorite_login_modal・Block/header_user）で確かめた。期待値はここに書かない。
 */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 言語 = "ja" | "en";
const T = 30_000;

export class F0101TopPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); page.setDefaultNavigationTimeout(60_000); }

  path(): string { return new URL(this.page.url()).pathname; }

  /** 言語区分つきの本店TOPを開く */
  async 本店TOPを開く(言語: 言語): Promise<void> {
    await this.page.goto(`${BASE_URL}/${言語}/`);
    await this.page.waitForLoadState("load");
    await this.開いている();
  }
  /** 言語区分を含まないサイトルートを開く（遷移したあとの画面の読み込みまで待つ） */
  async サイトルートを開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/`);
    await this.page.waitForLoadState("load");
  }
  async 開く(path: string): Promise<void> {
    await this.page.goto(`${BASE_URL}${path}`);
    await this.page.waitForLoadState("load");
  }
  async 開いている(): Promise<void> {
    await expect(this.page.locator("header a.p-hareruya-header__logo-link").first(), "本店TOPのヘッダ").toBeVisible();
  }

  async タイトル(): Promise<string> { return (await this.page.title()).trim(); }

  // ---- スライドバナー欄 ----
  readonly スライドバナー欄 = (): Locator => this.page.locator(".p-hareruya-top__mv");
  readonly スライドバナー欄の入力欄 = (): Locator => this.スライドバナー欄().locator("input, form, [role=search], button[type=submit]");

  // ---- あなたのお気に入り欄 ----
  readonly お気に入り欄 = (): Locator => this.page.locator("section.p-hareruya-section").filter({ has: this.page.locator("h2.c-hareruya-heading--lev2", { hasText: /あなたのお気に入り|Your Favorites/ }) });

  // ---- ログイン用モーダル ----
  readonly ログイン用モーダル = (): Locator => this.page.locator("#favorite-login-modal").first();
  readonly ログイン用モーダルの見出し = (): Locator => this.ログイン用モーダル().locator("h3").first();
  /** 未ログインのヘッダのお気に入り（押すとログイン用モーダルが開く） */
  readonly モーダルを開くお気に入り = (): Locator => this.page.locator('header [data-js-modal-trigger="favorite-login-modal"]:visible').first();
  async ログイン用モーダルを開く(): Promise<"押して開いた" | "画面のスクリプトの開閉の印を付けて開いた"> {
    const trigger = this.モーダルを開くお気に入り();
    if ((await trigger.count()) > 0) {
      await trigger.click({ timeout: T });
      await expect(this.ログイン用モーダル(), "押したあとのログイン用モーダル").toHaveClass(/is-active/);
      return "押して開いた";
    }
    // ログイン済みのときは、お気に入りの導線がモーダルではなくお気に入り一覧へ移るので、押して開けない。モーダルの開いた状態の印を付けて見える状態にする
    await this.ログイン用モーダル().evaluate((el) => { el.classList.add("is-active"); el.setAttribute("aria-hidden", "false"); });
    return "画面のスクリプトの開閉の印を付けて開いた";
  }

  // ---- 商品の欄（最新入荷アイテム・Trending Now・SALE開催中・値下げしました！・補充しました！・あなたのお気に入りなど） ----
  /** 見出しの文がちょうど 見出し の欄。無ければ count() が 0 */
  欄(見出し: string): Locator {
    const exact = new RegExp(`^\\s*${見出し.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);
    return this.page.locator("section.p-hareruya-section").filter({ has: this.page.locator("h2.c-hareruya-heading--lev2").filter({ hasText: exact }) });
  }
  /** 欄の中の商品のカード（スライダーが複製したものも含む） */
  カード(欄: Locator): Locator { return 欄.locator(".p-hareruya-product-card"); }
  /** 欄に出ている商品の商品名（上から順・重複なし。【Foil】の接頭も含む。空白は1つにそろえる） */
  async 商品名の一覧(欄: Locator): Promise<string[]> {
    const names = await this.カード(欄).locator(".p-hareruya-product-card__name-text").evaluateAll((ns) => ns.map((n) => ((n as HTMLElement).textContent ?? "").replace(/\s+/g, " ").trim()));
    return [...new Set(names)];
  }
  /** 欄の中の、商品名に 名前 を含む商品のカード（【Foil】の接頭は商品名に含めて数える） */
  商品のカード(欄: Locator, 名前: string): Locator {
    return this.カード(欄).filter({ has: this.page.locator(".p-hareruya-product-card__name-text", { hasText: 名前 }) }).first();
  }
  カードの商品名(カード: Locator): Locator { return カード.locator(".p-hareruya-product-card__name-text").first(); }
  カードのカード言語(カード: Locator): Locator { return カード.locator(".p-hareruya-product-card__language-label"); }
  カードのSALEラベル(カード: Locator): Locator { return カード.locator(".p-hareruya-product-card__sale-label"); }
  カードのお気に入りボタン(カード: Locator): Locator { return カード.locator(".btn-favorite").first(); }
  カードの数量欄(カード: Locator): Locator { return カード.locator(".p-hareruya-product-card__quantity-input"); }
  カードの数量ボタン(カード: Locator, 向き: "マイナス" | "プラス"): Locator {
    const b = カード.locator(".p-hareruya-product-card__quantity-controls button");
    return 向き === "マイナス" ? b.first() : b.last();
  }
  カードのカートボタン(カード: Locator): Locator { return カード.locator("button.add-cart").first(); }
  async 画面のどこにも出ていない(商品名: string): Promise<boolean> {
    return (await this.page.locator(".p-hareruya-product-card__name-text", { hasText: 商品名 }).count()) === 0;
  }
}
