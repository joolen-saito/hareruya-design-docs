/**
 * 公開側の商品詳細画面（F03-02）。本店・TC大阪支店、日本語版・英語版。セレクタはここだけに書く。
 * 画面の作りはアプリのテンプレート（Product/detail.twig・_card_detail_specs.twig・breadcrumb_nav.twig）で確かめた。期待値はここに書かない。
 * 会員のログインと入荷通知のボタンの押し方は、F03-07 の部品（pages/front/f03_07_restock_notify.ts）を使う。
 */
import { Locator, Page, Response } from "@playwright/test";
import { BASE_URL } from "../../config/env";

/** 店の入口（本店・TC大阪支店、日本語版・英語版） */
export const 店 = { 本店: "/ja", TC大阪支店: "/ja/osaka", 本店英語版: "/en" } as const;

const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

export class FrontDetail {
  constructor(readonly page: Page) {}

  /** 商品IDを指定して商品詳細画面を開く（クエリ: 言語 lang・規格 class）。応答を返す（404 のときもそのまま返す） */
  async open(入口: string, 商品ID: string, query: Record<string, string> = {}): Promise<Response | null> {
    const q = new URLSearchParams(query).toString();
    const res = await this.page.goto(`${BASE_URL}${入口}/products/detail/${商品ID}${q ? `?${q}` : ""}`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    return res;
  }

  /** 商品名の見出し */
  get 商品名(): Locator { return this.page.locator("h1.p-hareruya-product-detail__title-text"); }
  async 商品名の文(): Promise<string> { return (await this.商品名.count()) ? norm(await this.商品名.first().textContent()) : ""; }

  /** カード言語の欄（商品名の前の言語の表示） */
  get カード言語(): Locator { return this.page.locator(".p-hareruya-product-detail__title .c-hareruya-label--language"); }
  /** カード専用の言語切替 */
  get 言語切替(): Locator { return this.page.locator(".p-hareruya-product-detail__lang-tabs"); }

  /** 表示中の価格・在庫の表（言語ごとの表のうち見えているもの） */
  get 価格表(): Locator { return this.page.locator('table.p-hareruya-product-detail__table[id^="priceTable-"]:visible'); }
  get 価格表の行(): Locator { return this.価格表.locator("tr.p-hareruya-product-detail__table-row"); }
  /** 状態の列（見出し・各行） */
  get 状態の列(): Locator { return this.page.locator(".p-hareruya-product-detail__col-status:visible"); }
  /** 表示中の表の各行の状態の欄の文（高額商品コードを含む） */
  async 状態の欄の文(): Promise<string[]> { return (await this.価格表.locator("td.p-hareruya-product-detail__col-status").allInnerTexts()).map(norm); }
  /** 表示中の表の各行（状態・価格・在庫の文） */
  async 行の文(): Promise<{ 状態: string; 価格: string; 在庫: string }[]> {
    return this.価格表の行.evaluateAll((trs) => trs.map((tr) => {
      const t = (sel: string) => (tr.querySelector(sel)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { 状態: t("td.p-hareruya-product-detail__col-status"), 価格: t("td.p-hareruya-product-detail__col-price"), 在庫: t("td.p-hareruya-product-detail__col-stock") };
    }));
  }
  /** 数量（商品数）を入れる操作部 */
  get 数量の操作部(): Locator { return this.page.locator(".p-hareruya-product-detail__table:visible .p-hareruya-product-card__quantity-controls"); }
  get 数量の欄(): Locator { return this.page.locator(".p-hareruya-product-detail__table:visible input.qty-label"); }
  get カートに追加(): Locator { return this.page.locator("button.add-cart"); }

  /** 商品規格ごとの入荷通知/通知待ちのボタン */
  get 入荷通知のボタン(): Locator { return this.page.locator("button[data-productclass]"); }
  入荷通知のボタン_規格(classId: string): Locator { return this.page.locator(`button[data-productclass="${classId}"]`); }
  get まとめて入荷通知(): Locator { return this.page.locator("#bulk_restock_notice"); }
  get お気に入り(): Locator { return this.page.locator("#add_favorite"); }

  /** ボタンの見えている文言（「入荷通知」「通知待ち」の、表示中の方） */
  async 見えている文言(button: Locator): Promise<string> {
    return norm(await button.evaluate((el) => Array.from(el.querySelectorAll("span"))
      .filter((s) => { const st = window.getComputedStyle(s); return st.display !== "none" && st.visibility !== "hidden"; })
      .map((s) => s.textContent ?? "").join(" ")));
  }

  /** 「使われているデッキ」のボタンと、「このカードはこんなデッキで使われています」の欄 */
  get 使われているデッキのボタン(): Locator { return this.page.locator('a[href="#used-in-decks"]'); }
  get デッキの欄(): Locator { return this.page.locator("#used-in-decks"); }
  /** デッキの欄のフォーマットごとのブロック */
  get デッキのフォーマット(): Locator { return this.page.locator("#used-in-decks .p-hareruya-product-detail__deck-block-item"); }
  async デッキのフォーマット名(): Promise<string[]> { return (await this.page.locator("#used-in-decks h3.p-hareruya-product-detail__deck-title").allInnerTexts()).map(norm); }
  フォーマットのブロック(名: string): Locator {
    return this.デッキのフォーマット.filter({ has: this.page.locator("h3.p-hareruya-product-detail__deck-title", { hasText: new RegExp(`^\\s*${名}\\s*$`) }) });
  }
  /** フォーマットのブロックの「もっと見る」 */
  もっと見る(名: string): Locator { return this.フォーマットのブロック(名).locator(".p-hareruya-section__more a"); }

  /** 「他のバージョン」のボタンと欄 */
  get 他のバージョンのボタン(): Locator { return this.page.locator('a[href="#other-versions"]'); }
  get 他のバージョンの欄(): Locator { return this.page.locator("#other-versions"); }
  /** 「掲載記事一覧」のリンク */
  get 掲載記事一覧(): Locator { return this.page.locator("a.p-hareruya-kiji-btn"); }
  /** 「買取情報を見る」のリンク（買取商品詳細画面へ） */
  get 買取情報を見る(): Locator { return this.page.locator("a.p-hareruya-kaitori-btn"); }
  /** SNSでシェアする */
  get SNSでシェア(): Locator { return this.page.locator(".p-hareruya-product-detail__share"); }

  /** カード情報の欄（表面） */
  get カード情報(): Locator { return this.page.locator(".p-hareruya-product-detail__description"); }
  /** カード情報の項目（見出し → 値）。表面の欄だけ */
  async カード情報の項目(): Promise<Record<string, string>> {
    return this.page.locator(".p-hareruya-product-detail__description-box.face_info .p-hareruya-product-detail__specs-row").evaluateAll((rows) => {
      const out: Record<string, string> = {};
      for (const r of rows) {
        const dt = (r.querySelector("dt")?.textContent ?? "").replace(/\s+/g, " ").trim();
        out[dt] = (r.querySelector("dd")?.textContent ?? "").replace(/\s+/g, " ").trim();
      }
      return out;
    });
  }
  /** 裏面のカード画像と、カード説明を裏面に切り替える操作 */
  get 裏面のカード画像(): Locator { return this.page.locator('[data-card-face="back"]'); }
  get 裏面へ切り替える操作(): Locator { return this.page.locator("a.ChangePhotoToBack"); }
  get 裏面のカード説明(): Locator { return this.page.locator(".p-hareruya-product-detail__description-box.back_info"); }

  /** パンくずの項目（先頭はホームのアイコン。アイコンの項目は「ホームアイコン」と読む） */
  async パンくず(): Promise<string[]> {
    return this.page.locator("nav.p-hareruya-breadcrumb li.p-hareruya-breadcrumb__item").evaluateAll((lis) => lis.map((li) => {
      if (li.querySelector("i.icon-hareruya-home")) return "ホームアイコン";
      return (li.querySelector('[itemprop="name"]')?.textContent ?? li.textContent ?? "").replace(/\s+/g, " ").trim();
    }));
  }
  /** パンくずの2つ目以降の項目の前の区切り（「>」の形の飾り）が付いているか（項目ごと） */
  async パンくずの区切り(): Promise<boolean[]> {
    return this.page.locator("nav.p-hareruya-breadcrumb li.p-hareruya-breadcrumb__item").evaluateAll((lis) => lis.slice(1).map((li) => {
      const st = window.getComputedStyle(li, "::before");
      return st.content !== "none" && st.transform !== "none";
    }));
  }

  /** 英語版ページとの対応付け（hreflang="en" の alternate） */
  get 英語版の対応付け(): Locator { return this.page.locator('link[rel="alternate"][hreflang="en"]'); }
  /** ページの言語ごとの対応付け（「言語=アドレス」の並び） */
  async 言語の対応付け(): Promise<string[]> {
    return this.page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => `${l.getAttribute("hreflang")}=${l.getAttribute("href")}`));
  }
  /** 画面の本文の文（空白をまとめたもの） */
  async 本文(): Promise<string> {
    return norm(await this.page.locator("main, body").first().innerText());
  }
  /** フォーマットのブロックに並ぶデッキの数 */
  デッキ(名: string): Locator { return this.フォーマットのブロック(名).locator(".p-hareruya-product-detail__deck-item"); }
  /** 完了の通知（画面右下）の「OK」ボタン */
  完了の通知のOK(通知: Locator): Locator { return 通知.getByRole("button", { name: "OK", exact: true }); }

  /** 最近チェックした商品の欄の商品名（表示順）。欄の描画（画面のスクリプト）を待ってから読む */
  async 最近チェックした商品(): Promise<string[]> {
    await this.page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
    const heading = this.page.locator("h2").filter({ hasText: /^\s*(最近チェックした商品|Recently Viewed)\s*$/ });
    if ((await heading.count()) === 0) return [];
    const block = heading.first().locator("xpath=ancestor::*[contains(@class,'__history') or contains(@class,'p-hareruya-section')][1]");
    return block.locator(".p-hareruya-product-card .p-hareruya-product-card__name-text").evaluateAll((ns) => ns.map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()));
  }
  /** 最近チェックした商品の欄の見出しがあるか */
  async 最近チェックした商品の見出しがある(): Promise<boolean> {
    return (await this.page.locator("h2").filter({ hasText: /^\s*(最近チェックした商品|Recently Viewed)\s*$/ }).count()) > 0;
  }

  /** 詳細画面のスクリプトが閲覧履歴を書き込むのを待つ */
  async 閲覧履歴の書き込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  // ---- 初期表示・状態の行・言語切替・共有・リンク（F03-02 の残りのケース） ----

  /** 初期表示の言語（商品名の前の言語の表示）と、現在地の状態（見えている表の「現在地」の状態コード） */
  async 初期表示(): Promise<{ 言語: string; 状態: string }> {
    const 言語 = (await this.カード言語.count()) ? norm(await this.カード言語.first().textContent()) : "";
    const cur = this.価格表.locator("td[data-status-current]");
    const 状態 = (await cur.count()) ? norm(await cur.first().textContent()).split(" ")[0] : "";
    return { 言語, 状態 };
  }

  /** 見えている表の、状態の行（状態コードで始まる行） */
  状態の行(状態: string): Locator {
    return this.価格表の行.filter({ has: this.page.locator("td.p-hareruya-product-detail__col-status", { hasText: new RegExp(`^\\s*${状態}(\\s|$|\\()`) }) });
  }
  /** 状態の行の商品数の欄・マイナス・プラス */
  商品数の欄(状態: string): Locator { return this.状態の行(状態).locator("input.qty-label"); }
  マイナス(状態: string): Locator { return this.状態の行(状態).locator("button.c-hareruya-btn-quantity").first(); }
  プラス(状態: string): Locator { return this.状態の行(状態).locator("button.c-hareruya-btn-quantity").last(); }
  /** 状態の行の状態表記のリンク（現在地でない状態） */
  状態のリンク(状態: string): Locator { return this.価格表.locator("a.productClassChange").filter({ hasText: new RegExp(`^\\s*${状態}(\\s|$|\\()`) }); }
  /** 状態の欄の見出しの「状態」リンク（状態表記の画面へ） */
  get 状態表記のリンク(): Locator { return this.page.locator("th.p-hareruya-product-detail__col-status a.p-hareruya-product-detail__col-status-link:visible"); }

  /** 言語切替のボタン */
  言語ボタン(言語: string): Locator { return this.言語切替.locator(`button[data-language="${言語}"]`); }
  /** 週間販売数の表示 */
  get 週間販売数(): Locator { return this.page.locator(".p-hareruya-product-detail__sales-count"); }

  /** SNSでシェアするのリンク（X・LINE） */
  get Xでシェア(): Locator { return this.SNSでシェア.locator("a.p-hareruya-product-detail__share-link").nth(0); }
  get LINEでシェア(): Locator { return this.SNSでシェア.locator("a.p-hareruya-product-detail__share-link").nth(1); }

  /** パンくず（先頭のホームアイコンのリンク・名前で引く項目のリンク） */
  get パンくずのホーム(): Locator { return this.page.locator("nav.p-hareruya-breadcrumb a.p-hareruya-breadcrumb__link").first(); }
  パンくずのリンク(名: string): Locator { return this.page.locator("nav.p-hareruya-breadcrumb a.p-hareruya-breadcrumb__link").filter({ hasText: 名 }); }

  /** 注意書きのリンク（「商品画像について」「返品特約に関する重要事項について」） */
  get 商品画像についてのリンク(): Locator { return this.page.locator("a.p-hareruya-product-detail__note-link", { hasText: "商品画像について" }); }
  get 返品特約のリンク(): Locator { return this.page.locator("a.p-hareruya-product-detail__note-link", { hasText: "返品特約に関する重要事項について" }); }

  /** 商品詳細の左の（カテゴリ一覧の）サイドバー */
  get カテゴリ一覧(): Locator { return this.page.locator("aside.p-hareruya-product-detail__sidebar"); }

  /** デッキの欄のデッキ（表示中のものだけ）の文 */
  async 見えているデッキの文(フォーマット: string): Promise<string[]> {
    return this.デッキ(フォーマット).evaluateAll((els) => els
      .filter((e) => { const r = e.getBoundingClientRect(); const s = window.getComputedStyle(e); return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0; })
      .map((e) => ((e as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim()));
  }
  /** デッキの欄の項目（画像・デッキの名称・項目の見出し）の数。デッキごと */
  async デッキの部品(フォーマット: string): Promise<{ 画像: number; 名称: number; 項目: number }[]> {
    return this.デッキ(フォーマット).evaluateAll((els) => els.map((e) => ({
      画像: e.querySelectorAll("img.p-hareruya-product-detail__deck-img-image").length,
      名称: (e.querySelector(".p-hareruya-product-detail__deck-name")?.textContent ?? "").trim() ? 1 : 0,
      項目: e.querySelectorAll(".p-hareruya-product-detail__deck-detail-row").length,
    })));
  }
}

/** ショッピングカート画面 */
export class FrontCart {
  constructor(readonly page: Page) {}
  async open(入口: string = 店.本店): Promise<Response | null> {
    const res = await this.page.goto(`${BASE_URL}${入口}/cart`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    return res;
  }
  /** カートの行（商品名の文・数量） */
  async 行(): Promise<{ 商品名: string; 数量: string }[]> {
    return this.page.locator(".p-hareruya-cart-item").evaluateAll((items) => items.map((it) => ({
      商品名: (it.querySelector(".p-hareruya-cart-item__name-text")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      数量: ((it.querySelector("[data-quantity-input]") as HTMLInputElement | null)?.value ?? "").trim(),
    })));
  }
}
