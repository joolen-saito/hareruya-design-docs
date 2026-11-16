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

  // ---- スライドバナー欄のスライド（Block/mv_carousel。slick が先頭と末尾に複製のスライドを足す。複製は data-slick-index が範囲の外） ----
  readonly バナーの帯 = (): Locator => this.スライドバナー欄().locator('[data-js-target="mv-slider"]');
  readonly バナーのスライド = (): Locator => this.バナーの帯().locator(".p-hareruya-carousel__slide");
  readonly 左スライドボタン = (): Locator => this.スライドバナー欄().locator(".p-hareruya-carousel__nav-prev");
  readonly 右スライドボタン = (): Locator => this.スライドバナー欄().locator(".p-hareruya-carousel__nav-next");
  /** バナー選択画像（並びの n 番目。0始まり。複製でないもの） */
  バナー選択画像(n: number): Locator {
    return this.スライドバナー欄().locator(`[data-js-target="mv-thumbs"] .slick-slide:not(.slick-cloned)[data-slick-index="${n}"]`);
  }
  /** スライドの動きが始まる状態（slick の初期化）まで待つ */
  async スライドの準備を待つ(): Promise<void> {
    await expect(this.バナーの帯(), "スライドバナー欄の動き（スライドの初期化）").toHaveClass(/slick-initialized/, { timeout: 30_000 });
  }
  /** 複製でないスライドの画像のアドレス（並びの順。slick はスライドを包む枠を足すことがあるので、複製の枠の中の画像を除く） */
  async バナーのaltの一覧(): Promise<string[]> {
    return this.バナーのスライド().locator("img").evaluateAll((ns) => ns.filter((n) => !n.closest(".slick-cloned")).map((n) => (n as HTMLImageElement).getAttribute("alt") ?? ""));
  }
  /** 画像alt属性が alt の、複製でないスライドのリンク */
  バナーのリンク(alt: string): Locator {
    return this.バナーの帯().locator(`.slick-slide:not(.slick-cloned) a.p-hareruya-carousel__slide-link:has(img[alt="${alt}"])`).first();
  }
  async バナーの画像の一覧(): Promise<string[]> {
    return this.バナーのスライド().locator("img").evaluateAll((ns) => ns.filter((n) => !n.closest(".slick-cloned")).map((n) => (n as HTMLImageElement).getAttribute("src") ?? ""));
  }
  /**
   * いま画面に見えているスライド（帯の見える範囲に少しでも入っているもの）を、左から順に返す。見える幅は帯の見える範囲に入っている幅。
   * 番号は slick の番号（複製も含めた通し番号）、画像はそのスライドの画像alt属性（バナーを見分ける）、x・幅は画面の上の位置。
   */
  async 見えているスライド(): Promise<{ 番号: string; 画像: string; x: number; 幅: number; 見える幅: number }[]> {
    return this.バナーの帯().evaluate((band) => {
      const list = band.querySelector(".slick-list") ?? band;
      const box = list.getBoundingClientRect();
      const out: { 番号: string; 画像: string; x: number; 幅: number; 見える幅: number }[] = [];
      const slides = band.querySelectorAll(".slick-slide").length ? band.querySelectorAll(".slick-slide") : band.querySelectorAll(".p-hareruya-carousel__slide");
      for (const el of Array.from(slides)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        const seen = Math.min(r.right, box.right) - Math.max(r.left, box.left);
        if (seen <= 0) continue;
        out.push({ 番号: el.getAttribute("data-slick-index") ?? "", 画像: el.querySelector("img")?.getAttribute("alt") ?? "", x: r.left, 幅: r.width, 見える幅: seen });
      }
      return out.sort((a, b) => a.x - b.x);
    });
  }
  /**
   * 表示中のバナー（PC版は2枚見えているうちの左側、SP版は見えている1枚）。見える幅の大きいスライドを、PC版は2枚・SP版は1枚選び、その左側。
   * 設計書 F01-01 の(1-2)「PC版では、画面内に(1-1)バナーが2枚表示されているうち、左側を対象とする」に合わせた読み方。
   */
  async 表示中のバナー(): Promise<{ 番号: string; 画像: string; x: number; 幅: number }> {
    const pc = (this.page.viewportSize()?.width ?? 1280) >= 1024;
    const seen = (await this.見えているスライド()).sort((a, b) => b.見える幅 - a.見える幅).slice(0, pc ? 2 : 1).sort((a, b) => a.x - b.x);
    if (seen.length === 0) throw new Error("スライドバナー欄に見えているバナーが無い");
    return seen[0];
  }
  /** slick の番号のスライドの、いまの画面の上の位置 */
  async スライドの位置(番号: string): Promise<{ x: number; 幅: number }> {
    const el = this.バナーの帯().locator(`.slick-slide[data-slick-index="${番号}"]`).first();
    const r = await el.evaluate((n) => { const b = n.getBoundingClientRect(); return { x: b.left, 幅: b.width }; });
    return r;
  }

  // ---- デッキ採用枚数ランキング欄（Block/ranking） ----
  readonly ランキング欄 = (): Locator => this.page.locator("section.p-hareruya-top__ranking");
  /** デッキ採用枚数ランキング（見出し「デッキ採用枚数ランキング」の内側の塊）。フォーマットのタブが1つも無いときは出ない */
  readonly デッキ採用枚数ランキング欄 = (): Locator => this.ランキング欄().locator(".p-hareruya-top__ranking-inner").filter({ has: this.page.locator('[data-tab-group="tournament-ranking"]') });
  readonly フォーマットのタブ = (): Locator => this.デッキ採用枚数ランキング欄().locator('[data-tab-group="tournament-ranking"] .c-hareruya-tabs__item');
  /** 表示名がちょうど 名前 のフォーマットのタブ */
  フォーマットのタブ名(名前: string): Locator {
    return this.フォーマットのタブ().filter({ hasText: new RegExp(`^\\s*${名前.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
  }
  /** フォーマットのタブの表示名（左から順） */
  async フォーマットのタブの一覧(): Promise<string[]> {
    return (await this.フォーマットのタブ().allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  /** いま選ばれている（表示中の）フォーマットのタブの表示名 */
  async 選択中のフォーマット(): Promise<string[]> {
    return (await this.フォーマットのタブ().evaluateAll((ns) => ns.filter((n) => n.classList.contains("is-active")).map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim())));
  }
  /** 選ばれているタブの文字の太さ・下線（「太字・アンダーライン付き」を画面の見た目で読む） */
  async タブの見た目(タブ: Locator): Promise<{ 太さ: string; 下線: string; 下の枠線: string }> {
    return タブ.evaluate((n) => {
      const s = getComputedStyle(n);
      const a = getComputedStyle(n, "::after");
      return { 太さ: s.fontWeight, 下線: s.textDecorationLine, 下の枠線: `${s.borderBottomStyle} ${s.borderBottomWidth} / 後ろの飾り ${a.content} ${a.borderBottomStyle} ${a.height}` };
    });
  }
  /** フォーマットのタブを押し、そのタブの中身が表示中になるまで待つ */
  async フォーマットを選ぶ(名前: string): Promise<void> {
    const tab = this.フォーマットのタブ名(名前);
    await expect(tab, `デッキ採用枚数ランキング欄のフォーマット「${名前}」のタブ`).toHaveCount(1);
    await tab.click();
    await expect(tab, `フォーマット「${名前}」のタブが選ばれる`).toHaveClass(/is-active/);
  }
  /** 表示中のフォーマットの中身 */
  readonly 表示中のランキング = (): Locator => this.デッキ採用枚数ランキング欄().locator('.c-hareruya-tabs__content.is-active[data-tab-content="tournament-ranking"]');
  /** 表示中のランキングの商品（slick の複製の枠の中のものを除く。順位の順）: 順位・商品名・SALEラベルの有無・カード言語 */
  async 表示中のランキングの商品(): Promise<{ 順位: string; 商品名: string; SALE: boolean; 言語: string }[]> {
    return this.表示中のランキング().locator(".p-hareruya-product-carousel__item").evaluateAll((ns) => ns.filter((n) => !n.closest(".slick-cloned")).map((n) => ({
      順位: (n.querySelector(".p-hareruya-ranking__number")?.textContent ?? "").trim(),
      商品名: (n.querySelector(".p-hareruya-product-card__name-text")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      SALE: !!n.querySelector(".p-hareruya-product-card__sale-label"),
      言語: (n.querySelector(".p-hareruya-product-card__language-label")?.textContent ?? "").trim(),
    })));
  }

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
  /** 欄の中の、slick の複製の枠の外にある（本物の）商品のカード */
  本物のカード(欄: Locator): Locator {
    return 欄.locator('xpath=.//div[contains(concat(" ",normalize-space(@class)," ")," p-hareruya-product-card ")][not(ancestor::*[contains(concat(" ",normalize-space(@class)," ")," slick-cloned ")])]');
  }
  /** 欄の中の、商品名に 名前 を含む本物の商品のカード */
  本物の商品のカード(欄: Locator, 名前: string): Locator {
    return this.本物のカード(欄).filter({ has: this.page.locator(".p-hareruya-product-card__name-text", { hasText: 名前 }) }).first();
  }
  /** 欄に出ている本物の商品の商品名（並びの順。空白は1つにそろえる） */
  async 欄の商品名の並び(欄: Locator): Promise<string[]> {
    return this.本物のカード(欄).locator(".p-hareruya-product-card__name-text").evaluateAll((ns) => ns.map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()));
  }
  /** 欄の上部の「もっと見る」（見出しの横のリンク） */
  欄の上部のもっと見る(欄: Locator): Locator { return 欄.locator("a.p-hareruya-heading--more-link"); }
  /** 欄の下部の「もっと見る」（商品の並びの最後の画像のリンク。slick の複製の枠の外のもの） */
  欄の下部のもっと見る(欄: Locator): Locator {
    return 欄.locator('xpath=.//a[contains(concat(" ",normalize-space(@class)," ")," p-hareruya-more-slide ")][not(ancestor::*[contains(concat(" ",normalize-space(@class)," ")," slick-cloned ")])]');
  }
  /** リンクの表示名（文字。画像だけのリンクは画像の代わりの文字） */
  async リンクの表示名(link: Locator): Promise<string[]> {
    return link.evaluateAll((ns) => ns.map((n) => `${(n.textContent ?? "").trim()} ${Array.from(n.querySelectorAll("img")).map((i) => i.getAttribute("alt") ?? "").join(" ")}`.replace(/\s+/g, " ").trim()));
  }
  カードの商品名(カード: Locator): Locator { return カード.locator(".p-hareruya-product-card__name-text").first(); }
  カードのカード言語(カード: Locator): Locator { return カード.locator(".p-hareruya-product-card__language-label"); }
  カードのSALEラベル(カード: Locator): Locator { return カード.locator(".p-hareruya-product-card__sale-label"); }
  カードのお気に入りボタン(カード: Locator): Locator { return カード.locator(".btn-favorite").first(); }
  /** 商品カードの状態の表示（カード商品だけに出る。Block/_product_card） */
  カードの状態(カード: Locator): Locator { return カード.locator(".p-hareruya-product-card__condition"); }
  /** 商品カードの商品名のリンク（カード言語と商品名を含む） */
  カードの商品名リンク(カード: Locator): Locator { return カード.locator("a.p-hareruya-product-card__name").first(); }
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

/** 本店ECTOPの画面か（トップだけが持つ body の印 front_page）。遷移の確かめで、アドレスだけでなく画面の中身も見るために使う */
export async function 本店ECTOPの画面か(page: Page): Promise<boolean> {
  return (await page.locator("body.front_page").count()) > 0 && (await page.locator("header a.p-hareruya-header__logo-link").count()) > 0;
}
