/** F01-02 支店ECTOP（フロントの支店トップページ）の操作。支店URLは /ja/<支店URL>/ */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

/** 画面の幅（PC は 1280px、スマートフォンは 375px。正本の事前準備の値） */
export const 画面幅 = { PC: { width: 1280, height: 900 }, スマートフォン: { width: 375, height: 812 } } as const;

export class BranchTopPage {
  constructor(readonly page: Page) {}
  async open(支店URL: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/${支店URL}/`);
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 支店ECTOPのURL（絶対） */
  url(支店URL: string): string { return `${BASE_URL}/ja/${支店URL}/`; }
  /** 見出し「今週の売れ筋商品」の区画 */
  get 今週の売れ筋(): Locator { return this.page.locator("section.p-hareruya-branch-top__best-sellers"); }
  /** 見出し「SALE中の商品」の区画 */
  get SALE中(): Locator { return this.page.locator("section.p-hareruya-section").filter({ has: this.page.getByRole("heading", { name: "SALE中の商品" }) }); }
  /** SALE中の商品のカード（商品名で選ぶ）。名称を省くと全部 */
  SALE中の商品(商品名?: string): Locator {
    const cards = this.SALE中.locator(".p-hareruya-product-card");
    return 商品名 ? cards.filter({ hasText: 商品名 }) : cards;
  }
  /** タイル（見出しに、タグの名称を含む区画）。見出しは「<タグの名称>のカード」 */
  タイル(タグ名: string): Locator {
    return this.page.locator(".p-hareruya-feature-grid__item").filter({ has: this.page.locator("h2", { hasText: タグ名 }) });
  }
  /** タイルの中の商品カード（商品名で選ぶ）。名称を省くと全部 */
  タイルの商品(タグ名: string, 商品名?: string): Locator {
    const cards = this.タイル(タグ名).locator(".p-hareruya-product-card");
    return 商品名 ? cards.filter({ hasText: 商品名 }) : cards;
  }
  link(text: string | RegExp): Locator { return this.page.getByRole("link", { name: text }); }
  async 開いている(): Promise<void> { await expect(this.page.locator("body.shop_top"), "支店ECTOPの画面").toBeAttached(); }
  /** 支店ECTOPの画面か（落とさずに数える） */
  async 支店ECTOPか(): Promise<boolean> { return (await this.page.locator("body.shop_top").count()) > 0; }

  // ---- 商品カードの中 ----
  static カード言語(card: Locator): Locator { return card.locator(".p-hareruya-product-card__language-label"); }
  static カードの状態(card: Locator): Locator { return card.locator(".p-hareruya-product-card__condition"); }
  static 商品名の文字(card: Locator): Locator { return card.locator(".p-hareruya-product-card__name-text"); }
  static SALEラベル(card: Locator): Locator { return card.locator(".p-hareruya-product-card__sale-label"); }
  static 商品画像(card: Locator): Locator { return card.locator("img.p-hareruya-product-card__img").first(); }
  /** 商品画像の押せるところ（SALE中の商品は拡大のボタン、タイルは商品詳細へのリンク） */
  static 商品画像の押せるところ(card: Locator): Locator { return card.locator(".p-hareruya-product-card__img-wrap").first(); }
  /** 商品画像拡大ボタン（右下の拡大の印） */
  static 商品画像拡大ボタン(card: Locator): Locator { return card.locator(".p-hareruya-product-card__expand-icon").first(); }

  /** 商品画像の拡大の表示（開いているとき is-active が付く） */
  get 画像の拡大(): Locator { return this.page.locator("#product-image-zoomer"); }
  get 拡大した画像(): Locator { return this.page.locator("#product-image-zoomer .p-imageZoomer__img"); }

  // ---- SALE中の商品の左右のスライド ----
  /** 左スライド（左側の矢印のボタン） */
  get 左スライド(): Locator { return this.SALE中.locator(".p-hareruya-product-carousel__nav-prev"); }
  /** 右スライド（右側の矢印のボタン） */
  get 右スライド(): Locator { return this.SALE中.locator(".p-hareruya-product-carousel__nav-next"); }
  /**
   * SALE中の商品の表示領域に見えている商品カードの商品名を、左から順に返す（表示領域の左端より左へ出たものは数えない）。
   * 商品名は画面の文字のまま（前後の空白は除く）。
   */
  async SALE中の見えている商品名(): Promise<string[]> {
    const area = this.SALE中.locator(".p-hareruya-product-carousel__wrapper").first();
    const box = await area.boundingBox();
    if (!box) return [];
    const items = await this.SALE中.locator(".p-hareruya-product-carousel__item:not(.p-hareruya-product-carousel__item--more)").evaluateAll((ns) => ns.map((n) => {
      const r = (n as HTMLElement).getBoundingClientRect();
      const name = (n.querySelector(".p-hareruya-product-card__name-text")?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { name, left: r.left, right: r.right, width: r.width };
    }));
    return items
      .filter((i) => i.width > 0 && i.left >= box.x - i.width / 2 && i.right <= box.x + box.width + i.width / 2)
      .sort((a, b) => a.left - b.left)
      .map((i) => i.name);
  }

  // ---- 注文方法・QRコード & 採用情報・バナー・ランキング ----
  /** 注文方法欄（吹き出しの文） */
  get 注文方法欄(): Locator { return this.page.locator(".p-hareruya-branch-top__info-text"); }
  /** 注文方法欄の「通販サイト」のリンク */
  get 通販サイトのリンク(): Locator { return this.page.locator("a.p-hareruya-branch-top__info-link"); }
  /** QRコード & 採用情報欄（QRコードのカード） */
  get QRコード欄(): Locator { return this.page.locator(".p-hareruya-branch-top__promo"); }
  /** QRコード & 採用情報欄の、見出しの文がその文のカード */
  QRのカード(見出し: string): Locator {
    return this.page.locator(".p-hareruya-branch-top__promo-card").filter({ has: this.page.locator(".p-hareruya-branch-top__promo-card-title", { hasText: 見出し }) });
  }
  /** カードのQRコードの画像 */
  static QRコードの画像(card: Locator): Locator { return card.locator("img.p-hareruya-branch-top__promo-card-qr-img").first(); }
  /** 採用情報（バナーのリンク） */
  get 採用情報(): Locator { return this.page.locator("a.p-hareruya-branch-top__recruit-banner"); }
  /** バナー欄（タイルの並びの左上のバナー）の画像とリンク */
  get バナー画像(): Locator { return this.page.locator("img.p-hareruya-branch-top__item-banner-img").first(); }
  get バナーのリンク(): Locator { return this.page.locator("a.p-hareruya-branch-top__item-banner-link").first(); }
  /** 商品人気ランキングの区画（見出し「ランキング」） */
  get 商品人気ランキング(): Locator { return this.page.locator("section.p-hareruya-top__ranking"); }

  /** 画像を、ブラウザの中で読み込んだ中身（読み込めなければ null） */
  async 画像の中身(src: string): Promise<Buffer | null> {
    const b64 = await this.page.evaluate(async (u) => {
      try {
        const r = await fetch(u);
        if (!r.ok) return null;
        const a = new Uint8Array(await r.arrayBuffer());
        let s = ""; for (const x of a) s += String.fromCharCode(x);
        return btoa(s);
      } catch { return null; }
    }, src);
    return b64 ? Buffer.from(b64, "base64") : null;
  }

  /**
   * QRコードの画像を、ブラウザの読み取りの機能（BarcodeDetector）で読み取って文字を返す。
   * ブラウザにその機能が無いときは、読み取れない理由を投げる（推測の値を返さない）。
   */
  async QRコードを読み取る(img: Locator): Promise<string> {
    await expect(img, "QRコードの画像").toBeVisible({ timeout: 30_000 });
    await img.evaluate(async (n) => { const i = n as HTMLImageElement; if (!i.complete) await new Promise((r) => { i.onload = r; i.onerror = r; }); });
    const r = await img.evaluate(async (n) => {
      const BD = (globalThis as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect(s: unknown): Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      if (!BD) return { error: "このブラウザには QRコードを読み取る機能（BarcodeDetector）が無い" };
      try {
        const found = await new BD({ formats: ["qr_code"] }).detect(n);
        return found.length ? { value: found[0].rawValue } : { error: "QRコードの画像から読み取れる値が無かった" };
      } catch (e) { return { error: `QRコードの読み取りに失敗した（${String(e)}）` }; }
    });
    if ("error" in r) throw new Error(r.error);
    return r.value as string;
  }
}
