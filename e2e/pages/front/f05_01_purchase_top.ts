/**
 * F05-01 ネット買取トップページ（フロント）の画面操作。セレクタ・アドレスはここだけに書く。正本: cases/F05-01_test_cases.tsv
 *
 * 画面の作り（アプリの Purchase/index.twig と、買取トップ用レイアウトのブロック Block/purchase_*.twig で確かめた）:
 * - アドレスは /ja/purchase。画面の body に purchase_page の印が付く（ネット買取商品一覧は purchase_search の印も付く）。
 * - 買取トップバナー（先頭の区画）に、ネット買取・店頭買取の2枚のリンク（user_data/purchase_net・purchase_store）。
 *   設計書の画面項目「買取方法・流れ」はこの区画のリンクと読む。
 * - 「選べる2つの買取スタイル」の区画（見出しつき）にも、ネット買取・店頭買取の2枚のリンク。
 * - まとめて買取バナーは、まとめて買取商品IDが設定されているときだけ出る画像のリンク（買取商品詳細 /purchase/detail/<商品ID>?lang=JP）。
 * - カテゴリ一覧（見出し「買取アイテムを探す」）は、ECTOP と同じ部品（Block/_category_content.twig と画面のスクリプト）で描く。
 *   枠は最新セット（latest-set）・フォーマット別（formats）・その他（others）の3つ。第一階層は枠ごとに並び、子は押すと展開する。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { FrontCategoryList } from "./f03_04_category_list";

export const ネット買取トップのパス = "/ja/purchase";
export type カテゴリの枠 = "latest-set" | "formats" | "others";

/** 商品カード1枚から読んだ表示内容（目玉買取商品・買取特集コーナー） */
export type カードの内容 = {
  商品名: string; 商品ID: string; 規格ID: string | null; 言語ラベル: string | null;
  /** 買取価格（円）。「—」のときは null */
  買取価格: number | null;
  同名商品検索あり: boolean;
  数量の操作: { 入力: boolean; マイナス: boolean; プラス: boolean; カートに入れる: boolean };
  /** 商品画像が画像なしの代替画像か */
  画像なし: boolean;
};

/** ツリーの1項目（第一階層）の、比べる表示項目 */
export type ツリーの項目 = { 名称: string; 画像あり: boolean; 子: { 名称: string; 画像あり: boolean }[] | null };

export class PurchaseTopPage {
  readonly カテゴリ: FrontCategoryList;
  constructor(readonly page: Page) { this.カテゴリ = new FrontCategoryList(page); }

  /** ネット買取トップページを開く。応答の状態を返す */
  async 開く(): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${ネット買取トップのパス}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** カテゴリ一覧の3つの枠の取得が済むのを待つ */
  async カテゴリの描画を待つ(): Promise<void> { await this.カテゴリ.描画を待つ(); }

  /** ネット買取トップページの画面の印（ネット買取商品一覧ではない） */
  get 画面の印(): Locator { return this.page.locator("body.purchase_page:not(.purchase_search)"); }
  /** ネット買取商品一覧の画面の印 */
  get ネット買取商品一覧の印(): Locator { return this.page.locator("body.purchase_search"); }
  /** 販売側の商品一覧の画面の印 */
  get 販売側の商品一覧の印(): Locator { return this.page.locator("body.product"); }

  /** 買取トップバナー（買取方法・流れ）のネット買取リンク */
  get 買取方法流れのネット買取リンク(): Locator { return this.page.locator('a.p-hareruya-purchase-top__mv-card[href*="purchase_net"]'); }
  /** 「選べる2つの買取スタイル」の区画の店頭買取リンク */
  get 買取スタイルの店頭買取リンク(): Locator {
    return this.page.locator('section.p-hareruya-purchase-top__style a.p-hareruya-purchase-banner__item[href*="purchase_store"]');
  }
  /** まとめて買取バナーのリンク */
  get まとめて買取リンク(): Locator { return this.page.locator("a.p-hareruya-purchase-bundle__link"); }

  /** 買取商品詳細の商品名（見出し。F05-04 の買取商品詳細と同じ） */
  get 買取商品詳細の商品名(): Locator { return this.page.locator("h1.p-hareruya-product-detail__title-text"); }

  /** リンクを押して、移った先の読み込みを待つ */
  async 押して移る(link: Locator): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), link.click({ timeout: 20_000 })]);
  }

  /** 枠に並ぶ第一階層の名称（表示順） */
  async 枠の第一階層の名称(枠: カテゴリの枠): Promise<string[]> {
    return this.page.locator(`[data-category-level1-container="${枠}"]:visible > .p-hareruya-category-item > .p-hareruya-category-button .p-hareruya-category-button__text`)
      .evaluateAll((ns) => ns.map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()));
  }

  /** 展開した第一階層の下の、名称がちょうど一致する子カテゴリのリンク */
  子カテゴリのリンク(第一階層: string, 子: string): Locator {
    const root = this.カテゴリ.項目(第一階層).locator(":scope > .p-hareruya-category-accordion");
    return root.locator(":scope > ul > .p-hareruya-category-accordion__item > a")
      .filter({ has: this.page.locator("[class$='__text']", { hasText: new RegExp(`^\\s*${esc(子)}\\s*$`) }) });
  }

  /** カテゴリ一覧の区画（見出し「買取アイテムを探す」） */
  get カテゴリ一覧の区画(): Locator { return this.page.locator("section.p-hareruya-top__category-list"); }

  /**
   * カテゴリ一覧の区画と、その前後の区画に出ている、決済・受取・発送・ポイントを表す文字（文と画像の代替の文）。
   * 販促バナーの有無を見るため、区画の中と、すぐ前・すぐ後の兄弟の要素を対象にする。
   */
  async 販促バナーらしき表示(): Promise<string[]> {
    return this.カテゴリ一覧の区画.first().evaluate((sec) => {
      const words = /決済|受取|受け取り|発送|ポイント/;
      const targets = [sec.previousElementSibling, sec, sec.nextElementSibling].filter((e): e is Element => !!e);
      const hits: string[] = [];
      for (const t of targets) {
        const walker = document.createTreeWalker(t, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const s = (n.textContent ?? "").replace(/\s+/g, " ").trim();
          const el = n.parentElement;
          if (s && words.test(s) && el && el.offsetParent !== null) hits.push(s);
        }
        for (const img of Array.from(t.querySelectorAll("img"))) {
          const alt = img.getAttribute("alt") ?? "";
          if (words.test(alt) && (img as HTMLElement).offsetParent !== null) hits.push(`画像「${alt}」`);
        }
      }
      return hits;
    });
  }

  /**
   * カテゴリ一覧の枠ごとの構成（第一階層の名称・画像の有無と、展開した子の名称・画像の有無）。
   * 子を持つ第一階層（展開のボタンがあるもの）は、順に展開して子を読む。展開できなければ子は null。
   */
  async ツリーの構成(): Promise<Record<カテゴリの枠, ツリーの項目[]>> {
    const out = {} as Record<カテゴリの枠, ツリーの項目[]>;
    for (const 枠 of ["latest-set", "formats", "others"] as カテゴリの枠[]) {
      const items = await this.page.locator(`[data-category-level1-container="${枠}"]:visible > .p-hareruya-category-item`).evaluateAll((els) => els.map((el) => ({
        名称: (el.querySelector(":scope > .p-hareruya-category-button .p-hareruya-category-button__text, :scope > a .p-hareruya-category-button__text")?.textContent ?? "")
          .replace(/\s+/g, " ").trim(),
        画像あり: !!el.querySelector(":scope > .p-hareruya-category-button img, :scope > a img"),
        展開できる: !!el.querySelector(":scope > button[data-category-toggle]"),
      })));
      const list: ツリーの項目[] = [];
      for (const it of items) {
        let 子: ツリーの項目["子"] = null;
        if (it.展開できる) {
          try {
            await this.カテゴリ.展開する(it.名称);
            const root = this.カテゴリ.項目(it.名称).locator(":scope > .p-hareruya-category-accordion");
            子 = await root.locator(":scope > ul > .p-hareruya-category-accordion__item").evaluateAll((lis) => lis.map((li) => ({
              名称: (li.querySelector(":scope > :first-child [class$='__text']")?.textContent ?? "").replace(/\s+/g, " ").trim(),
              画像あり: !!li.querySelector(":scope > :first-child img"),
            })));
          } catch {
            子 = null;
          }
        }
        list.push({ 名称: it.名称, 画像あり: it.画像あり, 子 });
      }
      out[枠] = list;
    }
    return out;
  }
  // ---- 目玉買取商品・買取特集コーナー（タグ別の商品。外部の検索サービスの結果を、画面のスクリプトが後から描く） ----

  /** 目玉買取商品の区画（見出し「目玉買取商品」） */
  get 目玉の区画(): Locator { return this.page.locator("section.p-hareruya-purchase-top__highlight"); }
  /** 目玉買取商品の「もっと見る」 */
  get 目玉のもっと見る(): Locator { return this.目玉の区画.locator("a.p-hareruya-heading--more-link"); }
  /** 買取特集コーナーの、タグごとの枠（見出し・商品カード・「もっと見る」） */
  get 特集の枠すべて(): Locator { return this.page.locator(".p-hareruya-feature-grid__item"); }
  /** 買取特集コーナーの、タグIDの枠（「もっと見る」のリンク先で見分ける） */
  特集の枠(タグID: string): Locator {
    return this.特集の枠すべて.filter({ has: this.page.locator(`a[href$="/purchase/search/tag/${タグID}"]`) });
  }
  特集のもっと見る(タグID: string): Locator { return this.特集の枠(タグID).locator(`a[href$="/purchase/search/tag/${タグID}"]`); }
  /** 区画の中の商品カード */
  カード(区画: Locator): Locator { return 区画.locator(".p-hareruya-product-card"); }

  /** 区画の商品の描画（カードか「商品が見つかりません」の案内）が出るのを待つ。区画が画面に無ければ false */
  async 区画の描画を待つ(区画: Locator): Promise<boolean> {
    if ((await 区画.count()) === 0) return false;
    await 区画.first().locator(".p-hareruya-product-card, .ec-tagged-products-unisearch__empty").first().waitFor({ state: "attached", timeout: 60_000 });
    return true;
  }
  /** 買取特集コーナーのすべての枠の描画を待つ */
  async 特集の描画を待つ(): Promise<void> {
    await this.特集の枠すべて.first().waitFor({ state: "attached", timeout: 30_000 });
    for (const 枠 of await this.特集の枠すべて.all()) await 枠.locator(".p-hareruya-product-card, .ec-tagged-products-unisearch__empty").first().waitFor({ state: "attached", timeout: 60_000 });
  }
  /** 買取特集コーナーの枠のタグID（画面の並び順）と見出し */
  async 特集の枠の一覧(): Promise<{ タグID: string; 見出し: string }[]> {
    return this.特集の枠すべて.evaluateAll((els) => els.map((el) => {
      const a = el.querySelector('a[href*="/purchase/search/tag/"]') as HTMLAnchorElement | null;
      return { タグID: a?.getAttribute("href")?.match(/\/tag\/(\d+)/)?.[1] ?? "", 見出し: (el.querySelector("h3")?.textContent ?? "").replace(/\s+/g, " ").trim() };
    }));
  }

  /** 商品カードの表示内容（上から順） */
  async カードを読む(カード: Locator): Promise<カードの内容[]> {
    return カード.evaluateAll((els) => els.map((el) => {
      const visible = (e: Element | null) => !!e && (e as HTMLElement).offsetParent !== null;
      const a = el.querySelector("a.p-hareruya-product-card__name") as HTMLAnchorElement | null;
      const u = a ? new URL(a.href) : null;
      const price = (el.querySelector(".p-hareruya-product-card__price")?.textContent ?? "").replace(/\s+/g, " ").trim();
      const q = (sel: string) => visible(el.querySelector(sel));
      return {
        商品名: (el.querySelector(".p-hareruya-product-card__name-text")?.textContent ?? "").replace(/\s+/g, " ").trim(),
        商品ID: u?.pathname.match(/\/purchase\/detail\/(\d+)/)?.[1] ?? "",
        規格ID: u?.searchParams.get("class") ?? null,
        言語ラベル: (el.querySelector(".p-hareruya-product-card__language-label")?.textContent ?? "").trim() || null,
        買取価格: /\d/.test(price) ? parseInt(price.replace(/[^\d]/g, ""), 10) : null,
        同名商品検索あり: q('a[href*="cardId="]'),
        数量の操作: { 入力: q(".purchase-detail-qty .qty-input"), マイナス: q(".purchase-detail-qty .btn-minus"), プラス: q(".purchase-detail-qty .btn-plus"), カートに入れる: q("button.addCart") },
        画像なし: /noimg/.test(el.querySelector("img.p-hareruya-product-card__img")?.getAttribute("src") ?? ""),
      };
    }));
  }

  /** 商品IDの商品のカード（区画の中の先頭） */
  商品のカード(区画: Locator, 商品ID: string): Locator {
    return this.カード(区画).filter({ has: this.page.locator(`a.p-hareruya-product-card__name[href*="/purchase/detail/${商品ID}?"]`) }).first();
  }
  数量の欄(カード: Locator): Locator { return カード.locator(".purchase-detail-qty .qty-input"); }
  マイナス(カード: Locator): Locator { return カード.locator(".purchase-detail-qty .btn-minus"); }
  プラス(カード: Locator): Locator { return カード.locator(".purchase-detail-qty .btn-plus"); }
  カートに入れるボタン(カード: Locator): Locator { return カード.locator("button.addCart"); }
  画像ボタン(カード: Locator): Locator { return カード.locator('[data-js-target="product-img-zoom"]'); }

  /** 数量のボタンを押す。上限・下限で画面が無効にしているボタンは、利用者と同じく、その位置を押す（押しても何も起きない） */
  async 数量のボタンを押す(ボタン: Locator, 回数: number): Promise<number> {
    let 無効だった = 0;
    for (let i = 0; i < 回数; i++) {
      if (await ボタン.isDisabled()) { 無効だった++; await ボタン.click({ force: true }); }
      else await ボタン.click();
    }
    return 無効だった;
  }

  /** 「カートに入れる」を押し、追加の要求の応答の状態と、画面に出た知らせの文を返す */
  async カートに入れる(カード: Locator): Promise<{ 応答: number; 知らせ: string }> {
    const res = this.page.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/purchase/add") && r.request().method() === "POST", { timeout: 30_000 });
    await this.カートに入れるボタン(カード).click();
    const r = await res;
    const popup = this.page.locator("#hareruya-app-cart-popup.is-visible");
    await popup.waitFor({ state: "visible", timeout: 10_000 });
    return { 応答: r.status(), 知らせ: ((await popup.locator(".p-hareruya-cart-popup__message").innerText()) ?? "").trim() };
  }

  /** 画像の拡大表示（開いているもの）と、その拡大画像 */
  get 拡大表示(): Locator { return this.page.locator("#product-image-zoomer.is-active"); }
  get 拡大画像(): Locator { return this.page.locator("#product-image-zoomer .p-imageZoomer__img"); }

  /** 画面の見出し（h1〜h6）の文（見えているもの。上から順） */
  async 見出しの文(): Promise<string[]> {
    return this.page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((els) => els
      .filter((e) => (e as HTMLElement).offsetParent !== null)
      .map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()).filter((t) => t !== ""));
  }

  // ---- ネット買取商品一覧（「もっと見る」の遷移先） ----
  /** 一覧の商品カードの商品ID（遷移先。描画を待つ） */
  async 一覧の商品IDs(): Promise<string[]> {
    const shelf = this.page.locator("#purchase-list-unisearch-shelf");
    await shelf.locator(".p-hareruya-product-card").first().waitFor({ state: "attached", timeout: 60_000 }).catch(() => undefined);
    return shelf.locator("a.p-hareruya-product-card__name").evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).href.match(/\/purchase\/detail\/(\d+)/)?.[1] ?? "").filter((x) => x !== ""));
  }
}

function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
