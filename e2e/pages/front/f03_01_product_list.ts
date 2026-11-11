/**
 * 公開側の商品一覧（F03-01）。公開側の部品は機能ごとにファイルを分けている（F03-03・F03-07 など別の担当と二重に作らない）。
 * 商品詳細検索のモーダルそのものの操作は pages/front/f03_03_detail_search.ts を使う。
 */
import { Browser, BrowserContext, Dialog, Locator, Page, Request } from "@playwright/test";
import { hideDebugToolbar } from "../../lib/session";
import { BASE_URL } from "../../config/env";

export const 店舗の入口 = { 本店: "/ja", TC大阪支店: "/ja/osaka" } as const;

export class FrontProductList {
  constructor(readonly page: Page) {}

  /** 商品一覧を開く（検索条件なし）。shop は本店なら "/ja"、支店なら "/ja/osaka" */
  async open(shop: string, path = "/products/search"): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${shop}${path}`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 画面の読み込みと、検索サービスへの問い合わせ（あれば）が落ち着くのを待つ。商品が「無い」ことを数える前に呼ぶ */
  async 描画を待つ(): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  // ---- パンくず ----
  パンくずのホーム(): Locator {
    return this.page.locator(".p-hareruya-breadcrumb__link[aria-label], .p-hareruya-breadcrumb__item:first-child .p-hareruya-breadcrumb__link").first();
  }
  async パンくずのホームを押す(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.パンくずのホーム().click({ timeout: 30_000 }),
    ]);
    await this.page.waitForLoadState("load");
  }

  // ---- 検索エンジン向けの指定 ----
  /** HTMLのheadのロボット向け指定（meta robots）の内容 */
  async ロボット向け指定(): Promise<string[]> {
    return this.page.locator('head meta[name="robots"]').evaluateAll((ms) => ms.map((m) => (m as HTMLMetaElement).content));
  }

  // ---- 商品詳細検索の入口 ----
  画面上部の商品詳細検索(): Locator {
    return this.page.locator('.p-hareruya-header__nav-right-link[data-modal-open="search"]:visible').first();
  }
  /** 絞り込み領域（商品一覧の左の欄・SP版は絞り込みの並び）の詳細検索ボタン */
  絞り込み領域の詳細検索(): Locator {
    return this.page.locator('.p-hareruya-product-list__filter-detail-btn.js-product-detailed-search-open:visible, #product-list-detailed-search:visible').first();
  }
  async 絞り込み領域の詳細検索を押す(): Promise<"絞り込み領域の詳細検索ボタン" | "画面上部の詳細検索ボタン"> {
    await this.page.mouse.move(640, 400);
    const button = this.絞り込み領域の詳細検索();
    await button.waitFor({ state: "visible", timeout: 30_000 });
    await button.evaluate((e) => e.scrollIntoView({ block: "center" }));
    try {
      await button.click({ timeout: 8_000 });
      return "絞り込み領域の詳細検索ボタン";
    } catch {
      // 固定のヘッダーがボタンに重なって押せないときは、画面上部の入口を押す（F03-03 と同じ）
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await this.画面上部の商品詳細検索().click({ timeout: 30_000 });
      return "画面上部の詳細検索ボタン";
    }
  }

  // ---- 表示されている部品（検索条件なしで開いたときの確認） ----
  get 検索フォーム(): Locator { return this.page.locator("form#frmSearch"); }
  get ログイン用フォーム(): Locator { return this.page.locator("form#favorite-login-form, form#notify-login-form"); }
  get 商品の一覧(): Locator { return this.page.locator(".p-hareruya-product-list__grid"); }
  get 商品カード(): Locator { return this.page.locator('[class*="p-hareruya-product-card"]:visible'); }
  get 商品数(): Locator { return this.page.locator(".p-hareruya-toolbar__count"); }
  get ページ送り(): Locator { return this.page.locator(".p-hareruya-pagination"); }

  // ==== 以下、既存データ・画面で作ったデータで前提を作るケース（依頼者の方針 2026-11-10）のための操作 ====

  /** カテゴリを指定して商品一覧を開き、結果の描画を待つ */
  async openCategory(shop: string, categoryId: string, query = ""): Promise<number> {
    const s = await this.open(shop, `/products/search/cate/${categoryId}${query ? `?${query}` : ""}`);
    await this.結果を待つ();
    return s;
  }
  /** 商品名（キーワード）をアドレスで指定して商品一覧を開き、結果の描画を待つ */
  async openKeyword(shop: string, keyword: string): Promise<number> {
    const s = await this.open(shop, `/products/search?product=${encodeURIComponent(keyword)}`);
    await this.結果を待つ();
    return s;
  }

  /** 商品の結果領域（検索サービスの結果から描く棚） */
  get 結果領域(): Locator { return this.page.locator("#product-list-unisearch-shelf"); }

  /**
   * 検索サービスへの問い合わせと、商品の情報の読み込み（仮の表示→本表示）が済むのを待つ。
   * 読み込み中の印・仮の表示のカードが無くなるまで待つ（0件の案内・読み込み失敗の表示でも終わる）。
   */
  async 結果を待つ(timeout = 90_000): Promise<void> {
    await this.page.waitForLoadState("load");
    await this.page.waitForFunction(() => {
      const s = document.querySelector("#product-list-unisearch-shelf");
      if (!s) return true;
      if (s.querySelector(".product-list-unisearch-loading")) return false;
      if (s.querySelector(".p-hareruya-product-card--unisearch-temp")) return false;
      return s.children.length > 0;
    }, null, { timeout });
    await this.page.waitForTimeout(800);
  }

  /** 商品数の表示（「商品数: N点」）から読んだ件数。読めなければ null */
  async 商品数の値(): Promise<number | null> {
    const t = (await this.商品数.first().innerText().catch(() => "")) ?? "";
    const m = /([\d,]+)\s*点/.exec(t);
    return m ? Number(m[1].replace(/,/g, "")) : null;
  }
  /** 結果領域の「お探しの商品は見つかりませんでした」の案内 */
  get 該当なしの案内(): Locator { return this.結果領域.getByText("お探しの商品は見つかりませんでした"); }
  /** 結果領域の上の「ご指定の条件に一致する商品が多すぎます。…」の案内 */
  get 多すぎるの案内(): Locator { return this.page.locator(".js-unisearch-exceeded-message"); }
  /** 本表示になった商品カード（仮の表示のカードを除く） */
  get 本表示のカード(): Locator { return this.結果領域.locator(".p-hareruya-product-card:not(.p-hareruya-product-card--unisearch-temp)"); }

  // ---- ページ送り（上部・下部） ----
  ページ送りの場所(where: "上部" | "下部"): Locator {
    return where === "上部"
      ? this.page.locator("#product-list-unisearch-pager")
      : this.page.locator(".p-hareruya-product-list__pagination-bottom .product-list-unisearch-pager");
  }
  /** ページ送りの並び（前へ・次へを除く。省略は「...」、表示中のページは番号のまま） */
  async ページ送りの並び(where: "上部" | "下部" = "上部"): Promise<string[]> {
    return this.ページ送りの場所(where).locator("li.p-hareruya-pagination__item:not(.p-hareruya-pagination__item--prev):not(.p-hareruya-pagination__item--next)")
      .evaluateAll((lis) => lis.map((li) => li.classList.contains("p-hareruya-pagination__item--ellipsis") ? "..." : (li.textContent ?? "").replace(/\s+/g, "")));
  }
  /** 表示中のページ番号（ページ送りの「表示中」の項目） */
  async 表示中のページ(where: "上部" | "下部" = "上部"): Promise<string> {
    return ((await this.ページ送りの場所(where).locator(".p-hareruya-pagination__item--current").first().innerText().catch(() => "")) ?? "").trim();
  }
  ページ番号の項目(where: "上部" | "下部", n: number): Locator {
    return this.ページ送りの場所(where).locator("li.p-hareruya-pagination__item:not(.p-hareruya-pagination__item--prev):not(.p-hareruya-pagination__item--next)")
      .filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) }).first();
  }
  前へ(where: "上部" | "下部"): Locator { return this.ページ送りの場所(where).locator(".p-hareruya-pagination__item--prev").first(); }
  省略の項目(where: "上部" | "下部"): Locator { return this.ページ送りの場所(where).locator(".p-hareruya-pagination__item--ellipsis").first(); }
  /** ページ送りの項目（li）の中のリンクを押して、結果の描画を待つ */
  async ページ送りを押す(item: Locator): Promise<void> {
    await item.scrollIntoViewIfNeeded();
    await item.locator("a").first().click({ timeout: 30_000 });
    await this.結果を待つ();
  }
  /** 項目（li）がページ遷移のリンクか（中にリンク先を持つ a 要素があるか）と、重ねたときの指先の形 */
  async リンクか(item: Locator): Promise<{ リンク: boolean; 指先の形: string }> {
    await item.hover().catch(() => {});
    return item.evaluate((el) => {
      const a = el.querySelector("a[href]");
      const target = (a ?? el.firstElementChild ?? el) as HTMLElement;
      return { リンク: a !== null, 指先の形: window.getComputedStyle(target).cursor };
    });
  }
  /** アドレスのページ番号（pageno。無ければ 1） */
  アドレスのページ(): number {
    const v = new URL(this.page.url()).searchParams.get("pageno");
    return v ? Number(v) : 1;
  }

  // ---- 並び順 ----
  get 並び順のボタン(): Locator { return this.page.locator(".js-product-list-orderby-btn:visible"); }
  /** 選ばれている並び順の名前（並び順のタブの選択中の印） */
  async 選ばれている並び順(): Promise<string> {
    return ((await this.page.locator(".js-product-list-orderby-btn.is-active").first().innerText().catch(() => "")) ?? "").trim();
  }
  async 並び順を選ぶ(名前: string): Promise<void> {
    const btn = this.並び順のボタン.filter({ hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }).first();
    await btn.click({ timeout: 30_000 });
    await this.結果を待つ();
  }
  /** 並び順のタブの名前（画面の並び） */
  async 並び順の名前(): Promise<string[]> {
    return (await this.並び順のボタン.allInnerTexts()).map((t) => t.trim());
  }

  // ---- 絞り込み（クイックフィルター） ----
  /** 絞り込みのボタン。row は送る欄（rarity・colors など）、label はボタンの文か色の名前 */
  絞り込みボタン(row: "rarity" | "colors" | "language" | "foilFlg" | "cardtypes", label: string): Locator {
    const base = `[data-product-list-quick-filters] [data-qf-row="${row}"]`;
    return this.page.locator(`${base}[aria-label="${label}"]`)
      .or(this.page.locator(base).filter({ hasText: new RegExp(`^\\s*${esc(label)}\\s*$`) })).first();
  }
  /** 絞り込みのボタンが送る欄の名前と値 */
  async 絞り込みの欄(button: Locator): Promise<{ name: string; value: string }> {
    const row = (await button.getAttribute("data-qf-row")) ?? "";
    const value = (await button.getAttribute("data-qf-value")) ?? "";
    const name = (await this.page.locator(`[data-qf-hidden-row="${row}"] input[value="${value}"]`).first().getAttribute("name")) ?? "";
    return { name, value };
  }
  async 絞り込みを押す(button: Locator): Promise<void> {
    await button.scrollIntoViewIfNeeded();
    await button.click({ timeout: 30_000 });
    await this.結果を待つ();
  }
  /** カードタイプ（クリーチャーなど）の絞り込みの並び */
  get カードタイプの絞り込み(): Locator { return this.page.locator('[data-filter-row="category"]'); }

  // ---- パンくず・関連キーワード・バナー・おすすめタグ ----
  get パンくずの欄(): Locator { return this.page.locator(".p-hareruya-product-list__breadcrumb-wrap").first(); }
  async パンくずの文(): Promise<string> {
    return ((await this.パンくずの欄.innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
  }
  get 関連キーワード(): Locator { return this.page.locator("#product-list-related-keywords"); }
  /** パンくずの下のバナー（カテゴリ・タグの表示用HTMLを出す欄） */
  get パンくず下のバナー(): Locator { return this.page.locator(".p-hareruya-product-list__free-content"); }
  /** 要素の上端の位置（ページの上端から。無ければ null） */
  async 上端の位置(target: Locator): Promise<number | null> {
    if ((await target.count()) === 0) return null;
    return target.first().evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
  }
  get おすすめ商品から探す(): Locator { return this.page.locator(".p-hareruya-product-list__recommended"); }
  async おすすめタグの名前(): Promise<string[]> {
    return (await this.おすすめ商品から探す.locator(".p-hareruya-tag-list__item a").allInnerTexts()).map((t) => t.trim());
  }
  /** おすすめタグの名前と、リンク先のタグID */
  async おすすめタグのリンク(): Promise<{ name: string; id: string }[]> {
    return this.おすすめ商品から探す.locator(".p-hareruya-tag-list__item a").evaluateAll((as) => as.map((a) => ({
      name: (a.textContent ?? "").trim(), id: /\/tags\/(\d+)/.exec((a as HTMLAnchorElement).href)?.[1] ?? "",
    })));
  }
  async おすすめタグを押す(名前: string): Promise<void> {
    const a = this.おすすめ商品から探す.locator(".p-hareruya-tag-list__item a").filter({ hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }).first();
    await a.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), a.click()]);
    await this.結果を待つ();
  }

  // ---- 左メニュー（カテゴリ一覧） ----
  get カテゴリ一覧(): Locator { return this.page.locator(".p-hareruya-category-sidebar"); }
  /** 左メニューのカテゴリのリンク（読み込みを待つ。既定は見えているものだけ。閉じた階層の中のリンクも含めるときは false）。id はリンク先のパスのカテゴリID */
  async 左メニューのカテゴリ(見えるものだけ = true): Promise<{ id: string; name: string; href: string; query: string }[]> {
    await this.page.waitForFunction(() => document.querySelectorAll('.p-hareruya-category-sidebar a[href*="/products/search/cate/"]').length > 0, null, { timeout: 30_000 }).catch(() => {});
    return this.カテゴリ一覧.locator('a[href*="/products/search/cate/"]').evaluateAll((as, onlyVisible) => as
      .filter((a) => !onlyVisible || (a as HTMLElement).offsetParent !== null)
      .map((a) => {
        const u = new URL((a as HTMLAnchorElement).href);
        return { id: /\/products\/search\/cate\/(\d+)/.exec(u.pathname)?.[1] ?? "", name: (a.textContent ?? "").replace(/\s+/g, " ").trim(), href: a.getAttribute("href") ?? "", query: u.search };
      })
      .filter((x) => x.id !== ""), 見えるものだけ);
  }
  /**
   * 左メニューのカテゴリを名前で押す。閉じた階層の中にあれば、外側の階層から順に開閉のボタンを押して開く。
   * 開いた階層の名前（開閉のボタンの文）を返す。
   */
  async 左メニューのカテゴリを名前で押す(名前: string): Promise<string[]> {
    await this.page.waitForFunction(() => document.querySelectorAll('.p-hareruya-category-sidebar a[href*="/products/search/cate/"]').length > 0, null, { timeout: 30_000 }).catch(() => {});
    const link = this.カテゴリ一覧.locator("a").filter({ hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }).first();
    await link.waitFor({ state: "attached", timeout: 30_000 });
    const ids = await link.evaluate((a) => {
      const out: string[] = [];
      for (let e = a.parentElement; e; e = e.parentElement) {
        if (e.id && e.classList.contains("p-hareruya-category-accordion")) out.unshift(e.id);
        if (e.classList.contains("p-hareruya-category-sidebar")) break;
      }
      return out;
    });
    const 開いた: string[] = [];
    for (const id of ids) {
      const toggle = this.カテゴリ一覧.locator(`[data-category-toggle][aria-controls="${id}"]`).first();
      if ((await toggle.count()) === 0) continue;
      if ((await toggle.getAttribute("aria-expanded")) !== "true") {
        await toggle.scrollIntoViewIfNeeded();
        await toggle.click();
        await this.page.waitForTimeout(600);
        開いた.push(((await toggle.innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim());
      }
    }
    await link.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click()]);
    await this.結果を待つ();
    return 開いた;
  }
  /** 並び順のタブの番号（並び順のID） */
  async 並び順のID(名前: string): Promise<string> {
    return (await this.page.locator(".js-product-list-orderby-btn").filter({ hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }).first().getAttribute("data-orderby-id")) ?? "";
  }
  /** 並び順を送る欄の名前（アドレスの引数名） */
  async 並び順の欄の名前(): Promise<string> {
    return (await this.page.locator("#product-list-orderby-input").getAttribute("name")) ?? "orderby";
  }
  /** パンくずの項目の文（ホームは🏠と読む） */
  async パンくずの項目(): Promise<string[]> {
    return this.パンくずの欄.locator(".p-hareruya-breadcrumb__item").evaluateAll((lis) => lis.map((li) => {
      if (li.querySelector(".icon-hareruya-home")) return "🏠";
      return (li.textContent ?? "").replace(/\s+/g, " ").trim();
    }));
  }
  /** 一覧の隠れた検索の欄（form の中）の名前。key は欄の名前の末尾（format・category など） */
  async 検索の欄の名前(key: string): Promise<string> {
    return (await this.page.locator(`[data-product-list-search-preserve] [name="${key}"], [data-product-list-search-preserve] [name$="[${key}]"]`).first().getAttribute("name").catch(() => null)) ?? key;
  }
  /** 検索の欄（選ぶ欄）に、その値の選択肢があるか */
  async 選択肢があるか(key: string, value: string): Promise<boolean> {
    const name = await this.検索の欄の名前(key);
    return (await this.page.locator(`[name="${name}"] option[value="${value}"], [name="${name}"][value="${value}"]`).count()) > 0;
  }
  async 左メニューのカテゴリを押す(href: string): Promise<void> {
    const a = this.カテゴリ一覧.locator(`a[href="${href}"]`).first();
    await a.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), a.click()]);
    await this.結果を待つ();
  }

  // ---- ヘッダーの商品検索 ----
  async ヘッダーで検索する(keyword: string): Promise<void> {
    const input = this.page.locator("input.p-hareruya-header__search-input[name=product]:visible").first();
    await input.fill(keyword);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.page.locator("button.p-hareruya-header__search-btn:visible").first().click(),
    ]);
    await this.結果を待つ();
  }

  // ---- 商品カード ----
  /** 商品ID（と言語）で引く本表示のカード */
  カード(商品ID: string, 言語 = ""): Locator {
    const sel = 言語
      ? `a.p-hareruya-product-card__name[href*="/products/detail/${商品ID}?lang=${言語}"]`
      : `a.p-hareruya-product-card__name[href*="/products/detail/${商品ID}"]`;
    return this.本表示のカード.filter({ has: this.page.locator(sel) }).first();
  }
  /** 本表示のカードを全部読む（並び順） */
  async カードを読む(): Promise<カード情報[]> {
    return this.本表示のカード.evaluateAll((cards) => cards.map((card) => {
      const vis = (e: Element | null) => !!e && (e as HTMLElement).offsetParent !== null && !(e as HTMLElement).closest("[hidden]");
      const num = (t: string | null | undefined) => { const m = /([\d,]+)/.exec(t ?? ""); return m ? Number(m[1].replace(/,/g, "")) : null; };
      const nameA = card.querySelector("a.p-hareruya-product-card__name") as HTMLAnchorElement | null;
      const href = nameA?.href ?? "";
      const optVid = (card.querySelector("select.js-product-list-variant option") as HTMLOptionElement | null)?.value ?? "";
      const rows = Array.from(card.querySelectorAll(".p-hareruya-product-card__condition-item")).map((r) => {
        const stockText = (r.querySelector(".p-hareruya-product-card__stock")?.textContent ?? "").trim();
        const qtyInput = r.querySelector(".qty-input") as HTMLInputElement | null;
        const stepper = r.querySelector(".js-product-list-bulk-stepper") as HTMLElement | null;
        const label = r.querySelector(".js-product-list-bulk-qty-label") as HTMLInputElement | null;
        const vidFromName = /quantity_(\d+)/.exec(qtyInput?.name ?? "")?.[1] ?? "";
        return {
          状態: (r.querySelector(".p-hareruya-product-card__condition")?.textContent ?? "").trim(),
          在庫: /∞/.test(stockText) ? 999 : num(stockText),
          価格: num(r.querySelector(".p-hareruya-product-card__price")?.textContent),
          数量: label ? Number(label.value) : null,
          増減あり: stepper !== null,
          規格ID: stepper?.dataset.variantId || vidFromName || optVid,
          見えている: vis(r),
          状態がリンク: r.querySelector("a.p-hareruya-product-card__condition") !== null,
        };
      });
      const notify = Array.from(card.querySelectorAll(".js-product-list-notify")).filter((b) => vis(b))
        .map((b) => ({ 規格ID: (b as HTMLElement).dataset.productclass ?? "", 依頼済み: b.classList.contains("is-selected") }));
      const fav = card.querySelector(".js-product-list-favorite");
      return {
        商品ID: /\/products\/detail\/(\d+)/.exec(href)?.[1] ?? "",
        言語: /[?&]lang=([A-Z]+)/.exec(href)?.[1] ?? "",
        商品名: (card.querySelector("img.p-hareruya-product-card__img") as HTMLImageElement | null)?.alt ?? "",
        表示名: (card.querySelector(".p-hareruya-product-card__name-text")?.textContent ?? "").replace(/\s+/g, " ").trim(),
        言語ラベル: vis(card.querySelector(".p-hareruya-product-card__language-label")) ? (card.querySelector(".p-hareruya-product-card__language-label")?.textContent ?? "").trim() : "",
        セール: vis(card.querySelector(".p-hareruya-product-card__sale-label")),
        カード商品: card.querySelector(".p-hareruya-product-card__condition") !== null,
        売切: card.classList.contains("is-soldout"),
        行: rows,
        同名商品: vis(card.querySelector('a[href*="cardId="]')),
        他の状態ボタン: vis(card.querySelector(".js-product-list-toggle-variants")),
        他の状態があります: vis(card.querySelector(".p-hareruya-product-card__other-conditions-notice")),
        お気に入りボタン: vis(fav),
        お気に入り済み: !!fav && fav.classList.contains("is-selected"),
        通知ボタン: notify,
        カートボタン: Array.from(card.querySelectorAll(".add-cart")).some((b) => vis(b)),
        増減の部品: Array.from(card.querySelectorAll(".js-product-list-bulk-minus, .js-product-list-bulk-plus, .js-product-list-bulk-qty-label")).filter((b) => vis(b)).length,
        画像: (card.querySelector("img.p-hareruya-product-card__img") as HTMLImageElement | null)?.getAttribute("src") ?? "",
      };
    }));
  }
  /** 1枚のカードを読む（商品IDと言語で引く） */
  async カード1枚を読む(商品ID: string, 言語 = ""): Promise<カード情報 | undefined> {
    return (await this.カードを読む()).find((c) => c.商品ID === 商品ID && (!言語 || c.言語 === 言語));
  }

  /** カードの中の部品 */
  カードのお気に入り(card: Locator): Locator { return card.locator(".js-product-list-favorite").first(); }
  カードの同名商品(card: Locator): Locator { return card.locator('a[href*="cardId="]:visible').first(); }
  カードの他の状態ボタン(card: Locator): Locator { return card.locator(".js-product-list-toggle-variants").first(); }
  カードの他の状態があります(card: Locator): Locator { return card.locator(".p-hareruya-product-card__other-conditions-notice").first(); }
  カードのカートボタン(card: Locator): Locator { return card.locator(".add-cart:visible").first(); }
  カードの画像(card: Locator): Locator { return card.locator("button.p-hareruya-product-card__img-wrap").first(); }
  カードの通知ボタン(card: Locator, 規格ID: string): Locator { return card.locator(`.js-product-list-notify[data-productclass="${規格ID}"]`).first(); }
  /** 状態の行（規格IDで引く。増減の印の規格IDか、数量の欄の名前で見る。単一の規格のカードは先頭の行） */
  カードの状態の行(card: Locator, 規格ID: string): Locator {
    return card.locator(".p-hareruya-product-card__condition-item").filter({
      has: this.page.locator(`[data-variant-id="${規格ID}"], .qty-input[name*="quantity_${規格ID}]"]`),
    }).first();
  }
  カードの先頭の行(card: Locator): Locator { return card.locator(".p-hareruya-product-card__condition-item").first(); }
  行のマイナス(row: Locator): Locator { return row.locator(".js-product-list-bulk-minus").first(); }
  行のプラス(row: Locator): Locator { return row.locator(".js-product-list-bulk-plus").first(); }
  行の数量(row: Locator): Locator { return row.locator(".js-product-list-bulk-qty-label").first(); }
  async 行の数量の値(row: Locator): Promise<number> { return Number(await this.行の数量(row).inputValue()); }
  /** 状態の行が画面に見えているか（閉じた「他の状態」の中にあるときは見えない） */
  async 行が見えている(row: Locator): Promise<boolean> {
    if ((await row.count()) === 0) return false;
    return row.evaluate((e) => {
      const el = e as HTMLElement;
      if (el.offsetParent === null || window.getComputedStyle(el).visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      if (r.height < 2) return false;
      // 開閉する入れ物（高さを絞って隠す）の外にはみ出していれば見えていない
      const box = el.closest('[data-js-target="product-card-conditions"]') as HTMLElement | null;
      if (box) {
        const b = box.getBoundingClientRect();
        const clipped = window.getComputedStyle(box).overflow !== "visible";
        if (clipped && (r.top >= b.bottom - 1 || r.bottom <= b.top + 1)) return false;
      }
      return true;
    });
  }
  /** 状態の行の、見えている文（状態・在庫・価格） */
  async 行の文(row: Locator): Promise<string> { return ((await row.innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim(); }

  /** 商品画像の拡大表示（モーダルの画像） */
  get 拡大画像(): Locator { return this.page.locator("#product-image-zoomer.is-active .p-imageZoomer__img, #product-image-zoomer.is-active img").first(); }

  /** 「カートに入れる」を押し、カートへ入れる要求の応答を待つ。応答の状態・本文と、出た警告（alert）を返す */
  async カートに入れるを押す(card: Locator): Promise<{ status: number; body: string; 警告: string[] }> {
    const 警告: string[] = [];
    const onDialog = (d: Dialog) => { 警告.push(d.message()); d.accept().catch(() => {}); };
    this.page.on("dialog", onDialog);
    try {
      const btn = this.カードのカートボタン(card);
      await btn.scrollIntoViewIfNeeded();
      const res = this.page.waitForResponse((r) => /\/products\/(search\/cart_add_bulk|add_cart)\/\d+/.test(r.url()) && r.request().method() === "POST", { timeout: 30_000 }).catch(() => null);
      await btn.click();
      const r = await res;
      await this.page.waitForTimeout(1000);
      return { status: r?.status() ?? 0, body: r ? await r.text().catch(() => "") : "", 警告 };
    } finally {
      this.page.off("dialog", onDialog);
    }
  }
}

/** 商品カードの状態の行（1行＝1つの状態・規格） */
export type 状態の行 = {
  状態: string; 在庫: number | null; 価格: number | null; 数量: number | null;
  増減あり: boolean; 規格ID: string; 見えている: boolean; 状態がリンク: boolean;
};
/** 本表示の商品カード1枚の読み取り */
export type カード情報 = {
  商品ID: string; 言語: string; 商品名: string; 表示名: string; カード商品: boolean; 売切: boolean;
  行: 状態の行[]; 同名商品: boolean; 他の状態ボタン: boolean; 他の状態があります: boolean;
  お気に入りボタン: boolean; お気に入り済み: boolean; 通知ボタン: { 規格ID: string; 依頼済み: boolean }[];
  カートボタン: boolean; 増減の部品: number; 画像: string;
  /** 商品名の前のカード言語の表示（無ければ空） */
  言語ラベル: string;
  /** 画像の上の Sale の表示が見えているか */
  セール: boolean;
};

function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/** 公開側のショッピングカート（買い物かご）を開き、規格IDごとの数量を読む */
export async function カートの中身(page: Page, shop = "/ja"): Promise<{ 規格ID: string; 数量: number; 名前: string }[]> {
  await page.goto(`${BASE_URL}${shop}/cart`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  return page.locator(".p-hareruya-cart-item").evaluateAll((items) => items.map((it) => {
    const q = it.querySelector("[data-quantity-input]") as HTMLInputElement | null;
    return {
      規格ID: q?.dataset.productClassId ?? "",
      数量: q ? Number(q.value) : 0,
      名前: (it.querySelector(".p-hareruya-cart-item__name-text")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    };
  }));
}

/** 公開側を見るための新しいブラウザの場（ログアウトの状態・閲覧履歴やカートが空） */
export async function 公開側の場(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  return context;
}

/** 画面の文書の取得（ページ全体の読み直し）・商品検索・関連ワード検索の要求を記録する */
export class 通信の記録 {
  readonly 記録: { 種類: "画面の文書" | "商品検索" | "関連ワード検索"; url: string }[] = [];
  private readonly handler = (r: Request) => {
    const u = r.url();
    if (r.resourceType() === "document" && r.frame() === this.page.mainFrame()) this.記録.push({ 種類: "画面の文書", url: u });
    else if (/\/products\/search\/unisearch_rword_api/.test(u)) this.記録.push({ 種類: "関連ワード検索", url: u });
    else if (/\/products\/search\/unisearch_api/.test(u)) this.記録.push({ 種類: "商品検索", url: u });
  };
  constructor(readonly page: Page) {}
  開始(): void { this.page.on("request", this.handler); }
  終了(): void { this.page.off("request", this.handler); }
  件数(種類: "画面の文書" | "商品検索" | "関連ワード検索", from = 0): number { return this.記録.slice(from).filter((x) => x.種類 === 種類).length; }
  get 位置(): number { return this.記録.length; }
}
