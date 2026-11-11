/**
 * F05-04 ネット買取商品詳細（フロント）と、ネット買取カートの画面操作。セレクタ・アドレスはここだけに書く。正本: cases/F05-04_test_cases.tsv
 *
 * 画面の作り（アプリの Purchase/detail.twig・Block/js/product_detail_js.twig・Block/js/Purchase/purchase_js.twig で確かめた）:
 * - アドレスは /ja/purchase/detail/<商品ID>。言語は ?lang=<言語のコード>（JP・EN）、商品クラスは &class=<商品規格ID> で指定する。
 * - 言語切替のボタン（c-hareruya-lang-btn）・言語ごとの価格の表（priceTable-<言語のコード>。選ばれた言語の表だけ見える）。
 *   表の行は、その言語の先頭の商品規格の1行。状態の欄の data-status-current が選ばれている商品クラス。
 * - 買取価格が500円以上のときだけ、数量の欄（マイナス・数量・プラス）と「カートに追加」が出る。
 * - 「カートに追加」は買取カートへの追加の要求を送り、結果を画面共通の知らせ（#hareruya-app-cart-popup）に出す。
 * - SNSでシェアする領域の X・LINE のリンクは、別のタブで共有の画面（twitter.com・line.me）を開く。
 */
import { BrowserContext, expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const front = (p: string) => `${BASE_URL}/ja${p}`;
const OPEN = 30_000;

export class NetBuyDetailPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(OPEN); }

  /** 買取商品詳細を開き、画面のスクリプトの読み込みを待つ。応答の状態を返す */
  async 開く(商品ID: string, 指定?: { 言語?: string; 商品クラス?: string }): Promise<number> {
    const q = new URLSearchParams();
    if (指定?.言語 !== undefined) q.set("lang", 指定.言語);
    if (指定?.商品クラス !== undefined) q.set("class", 指定.商品クラス);
    const qs = q.toString();
    const res = await this.page.goto(front(`/purchase/detail/${商品ID}${qs ? `?${qs}` : ""}`), { timeout: 60_000, waitUntil: "load" });
    return res?.status() ?? 0;
  }

  async 再読み込み(): Promise<void> { await this.page.reload({ timeout: 60_000, waitUntil: "load" }); }

  get url(): URL { return new URL(this.page.url()); }

  /** 商品名（見出し） */
  get 商品名(): Locator { return this.page.locator("h1.p-hareruya-product-detail__title-text"); }
  /** 商品名とは別の、見出しの先頭のカード言語ラベル */
  get 言語ラベル(): Locator { return this.page.locator(".p-hareruya-product-detail__title .c-hareruya-label--language"); }
  /** 見出しの中で、言語ラベルが商品名より前にあるか */
  async 言語ラベルは商品名の前にある(): Promise<boolean> {
    return this.page.locator(".p-hareruya-product-detail__title").evaluate((t) => {
      const label = t.querySelector(".c-hareruya-label--language");
      const name = t.querySelector("h1");
      return !!label && !!name && !!(label.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
  }

  get 言語切替(): Locator { return this.page.locator(".c-hareruya-lang-btn"); }
  言語ボタン(コード: string): Locator { return this.page.locator(`.c-hareruya-lang-btn[data-language="${コード}"]`); }
  async 言語ボタンを押す(コード: string): Promise<void> { await this.言語ボタン(コード).click(); }
  /** 言語ボタンが選ばれた状態か（選択の印・押された状態） */
  async 言語ボタンは選択状態(コード: string): Promise<boolean> {
    const b = this.言語ボタン(コード);
    return (await b.count()) === 1 && /\bis-selected\b/.test((await b.getAttribute("class")) ?? "") && (await b.getAttribute("aria-pressed")) === "true";
  }
  /** 言語ボタンが押せない状態か（無効、または無効の印） */
  async 言語ボタンは非活性(コード: string): Promise<boolean> {
    const b = this.言語ボタン(コード);
    return (await b.isDisabled()) || (await b.getAttribute("aria-disabled")) === "true";
  }

  価格の表(コード: string): Locator { return this.page.locator(`#priceTable-${コード}`); }
  get 見えている価格の表(): Locator { return this.page.locator('[id^="priceTable-"]:visible'); }
  /** 見えている価格の表の、選ばれている商品クラス（状態の欄）の商品規格ID */
  async 選ばれている商品クラス(): Promise<string | null> {
    const td = this.見えている価格の表.locator("[data-status-current]");
    return (await td.count()) === 1 ? td.getAttribute("data-classid") : null;
  }
  /** 状態の欄の、商品クラスを切り替えるリンク（商品規格ID） */
  商品クラスのリンク(商品規格ID: string): Locator { return this.page.locator(`.productClassChange[data-classid="${商品規格ID}"]`); }
  /** 状態の列（見出しか欄） */
  get 状態の列(): Locator { return this.page.locator(".p-hareruya-product-detail__col-status"); }
  /** 見えている価格の表の行（状態・価格の文） */
  async 見えている価格の行(): Promise<string[]> {
    return (await this.見えている価格の表.locator("tbody tr").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  /** 言語の価格の表の行（隠れている表も含む。状態・価格の文） */
  async 価格の行(コード: string): Promise<string[]> {
    return this.価格の表(コード).locator("tbody tr").evaluateAll((rows) => rows.map((r) => (r.textContent ?? "").replace(/\s+/g, " ").trim()));
  }

  get 数量(): Locator { return this.見えている価格の表.locator(".purchase-detail-qty .qty-input"); }
  get マイナス(): Locator { return this.見えている価格の表.locator(".purchase-detail-qty .btn-minus"); }
  get プラス(): Locator { return this.見えている価格の表.locator(".purchase-detail-qty .btn-plus"); }
  get カートに追加ボタン(): Locator { return this.見えている価格の表.locator("button.addCart.detail"); }

  async プラスを押す(回数: number): Promise<void> { for (let i = 0; i < 回数; i++) await this.プラス.click(); }
  /**
   * マイナスを押す。数量1のときは画面がマイナスを無効にしているので、利用者と同じく、その位置を押す（押しても何も起きない）。
   * 押したときに無効だった回数を返す。
   */
  async マイナスを押す(回数: number): Promise<number> {
    let disabled = 0;
    for (let i = 0; i < 回数; i++) {
      if (await this.マイナス.isDisabled()) { disabled++; await this.マイナス.click({ force: true }); }
      else await this.マイナス.click();
    }
    return disabled;
  }
  /** 数量の欄に直接入れて確定する（欄から外れたときに 1〜上限へ丸められる） */
  async 数量を入れる(n: string): Promise<void> { await this.数量.fill(n); await this.数量.blur(); }

  /** 「カートに追加」を押し、追加の要求の応答の状態と、画面に出た知らせの文を返す */
  async カートに追加を押す(): Promise<{ 応答: number; 知らせ: string }> {
    const res = this.page.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/purchase/add") && r.request().method() === "POST", { timeout: 30_000 });
    await this.カートに追加ボタン.click();
    const r = await res;
    const popup = this.page.locator("#hareruya-app-cart-popup.is-visible");
    await expect(popup, "「カートに追加」のあとの知らせ").toBeVisible({ timeout: 10_000 });
    const 知らせ = ((await popup.locator(".p-hareruya-cart-popup__message").innerText()) ?? "").trim();
    return { 応答: r.status(), 知らせ };
  }
  get 知らせ(): Locator { return this.page.locator("#hareruya-app-cart-popup"); }
  /** 「カートに追加」の規格の指定（data-productclass）を空にする（開発者ツールでの書き換えの代わり） */
  async カートに追加の規格の指定を空にする(): Promise<void> {
    await this.カートに追加ボタン.evaluate((b) => { b.setAttribute("data-productclass", ""); (window as unknown as { jQuery?: (e: Element) => { removeData: (k: string) => void } }).jQuery?.(b).removeData("productclass"); });
  }

  /** 画面上のモーダル（開いているもの）の数 */
  async 開いているモーダルの数(): Promise<number> { return this.page.locator(".modal.show:visible").count(); }

  get 他のバージョンボタン(): Locator { return this.page.locator('a[href="#purchase-other-versions"]'); }
  get 査定例はこちら(): Locator { return this.page.locator("a.p-hareruya-conditions-btn").filter({ hasText: /^\s*査定例はこちら\s*$/ }); }
  get カード説明(): Locator { return this.page.locator(".p-hareruya-product-detail__description"); }
  /** カード説明の項目名（dt）の並び */
  async カード説明の項目名(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-product-detail__specs-list dt").allInnerTexts()).map((t) => t.trim());
  }

  /** カード説明の項目名→値（項目名の dt と、同じ行の dd の文） */
  async カード説明の値(): Promise<Record<string, string>> {
    return this.page.locator(".p-hareruya-product-detail__specs-row").evaluateAll((rows) => Object.fromEntries(rows.map((r) => [
      (r.querySelector("dt")?.textContent ?? "").trim(), (r.querySelector("dd")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    ])));
  }

  /** 他のバージョンの一覧の区画（基本土地のときは画面に作られない） */
  get 同名カードの一覧(): Locator { return this.page.locator("#purchase-other-versions, #purchaseSameNameProducts"); }

  /** パンくずリスト（画面幅によって、見えるときと隠れるときがある） */
  get パンくず(): Locator { return this.page.locator(".p-hareruya-product-detail__breadcrumb-wrap nav.p-hareruya-breadcrumb"); }
  /** パンくずの項目（並び順）。ホームはアイコンだけなので、ホームかどうかの印で持つ。現在のページの項目も印を付ける */
  async パンくずの項目(): Promise<{ ホーム: boolean; 現在: boolean; 名称: string; href: string | null }[]> {
    return this.パンくず.locator("li.p-hareruya-breadcrumb__item").evaluateAll((lis) => lis.map((li) => ({
      ホーム: li.querySelector(".icon-hareruya-home") !== null,
      現在: li.classList.contains("p-hareruya-breadcrumb__item--current"),
      名称: (li.querySelector('[itemprop="name"]')?.textContent ?? "").replace(/\s+/g, " ").trim(),
      href: li.querySelector("a")?.getAttribute("href") ?? null,
    })));
  }
  /** カテゴリ一覧（サイドバー）。第一階層の項目は、画面のスクリプトが描く */
  get カテゴリ一覧(): Locator { return this.page.locator(".p-hareruya-category-sidebar"); }
  /** カテゴリ一覧の第一階層の項目（3つの枠すべて） */
  get カテゴリ一覧の第一階層(): Locator { return this.カテゴリ一覧.locator("[data-category-level1-container] > .p-hareruya-category-item"); }

  /** サイドバーで、名称が一致する第一階層の項目を展開し、その下の名称が一致する子カテゴリのリンクを押して、移った先の読み込みを待つ */
  async サイドバーの子カテゴリを押す(親: string, 子: string): Promise<void> {
    const exact = (s: string) => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);
    const item = this.カテゴリ一覧.locator("[data-category-level1-container] > .p-hareruya-category-item")
      .filter({ has: this.page.locator(".p-hareruya-category-button__text", { hasText: exact(親) }) });
    await item.locator(":scope > button[data-category-toggle]").click({ timeout: 30_000 });
    const root = item.locator(":scope > .p-hareruya-category-accordion");
    await root.locator(".p-hareruya-category-accordion__item").first().waitFor({ state: "attached", timeout: 30_000 });
    const link = root.locator(":scope > ul > .p-hareruya-category-accordion__item > a")
      .filter({ has: this.page.locator("[class$='__text']", { hasText: exact(子) }) });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), link.click({ timeout: 20_000 })]);
  }

  get シェアの領域(): Locator { return this.page.locator(".p-hareruya-product-detail__share"); }
  get Xのアイコン(): Locator { return this.シェアの領域.locator('a[aria-label="Xリンク"]'); }
  get LINEのアイコン(): Locator { return this.シェアの領域.locator('a[aria-label="LINEリンク"]'); }
  /**
   * SNSのアイコンを押し、開いた別のタブのアドレスを返す。外部のサービス（X・LINE）へは繋がず、空の画面を返して止める。
   */
  async SNSのアイコンを押す(アイコン: Locator, context: BrowserContext): Promise<string> {
    await context.route(/^https:\/\/([a-z0-9.-]*\.)?(twitter\.com|x\.com|line\.me)\//, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>stub</body></html>" }));
    const [popup] = await Promise.all([this.page.waitForEvent("popup"), アイコン.click()]);
    const url = popup.url();
    await popup.close();
    return url;
  }

  /** 商品画像の拡大ボタン（先頭） */
  get 画像拡大ボタン(): Locator { return this.page.locator('[data-js-target="product-img-zoom"]:visible').first(); }
  get 拡大表示(): Locator { return this.page.locator("#product-image-zoomer.is-active"); }
  get 拡大画像(): Locator { return this.page.locator("#product-image-zoomer .p-imageZoomer__img"); }
  /** 見えている商品画像（メイン）のアドレス */
  async 見えている商品画像(): Promise<string[]> {
    return this.page.locator('[data-js-target="product-detail-main-slider"] img.p-hareruya-product-card__img:visible')
      .evaluateAll((ns) => ns.map((n) => (n as HTMLImageElement).getAttribute("src") ?? ""));
  }

  /** 画面の本文に、その文が出ている数 */
  async 文の数(文: string): Promise<number> { return this.page.getByText(文).count(); }
}

/** ネット買取カート（/ja/purchase/cart） */
export class NetBuyCartPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(OPEN); }
  async 開く(): Promise<void> {
    await this.page.goto(front("/purchase/cart"), { timeout: 60_000, waitUntil: "load" });
    await expect(this.page.locator("#purchase-cart-form"), "ネット買取カートの画面").toBeVisible();
  }
  /** 商品IDの商品の行（商品名のリンク先で見分ける） */
  行(商品ID: string): Locator {
    return this.page.locator(".purchase-cart__line").filter({ has: this.page.locator(`a.p-hareruya-cart-item__name[href*="/purchase/detail/${商品ID}?"]`) });
  }
  /** 商品IDの商品の行ごとの数量（行の並び順） */
  async 数量(商品ID: string): Promise<string[]> {
    const out: string[] = [];
    for (const row of await this.行(商品ID).all()) out.push(await row.locator(".qty-input").inputValue());
    return out;
  }
}

/** サイドバーのカテゴリ一覧（ネット買取商品詳細・販売側の商品一覧の両方にある）を、構成として読む */
export type カテゴリ一覧の構成 = { 枠: string; 第一階層: string[]; 展開した項目: string | null; 子: string[] }[];

const 枠の名前 = ["latest-set", "formats", "others"] as const;

export async function カテゴリ一覧の描画を待つ(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const cs = Array.from(document.querySelectorAll(".p-hareruya-category-sidebar [data-category-level1-container]"));
    return cs.length > 0 && cs.every((c) => c.getAttribute("aria-busy") === "false");
  }, undefined, { timeout: 60_000 });
}

/**
 * 3つの枠（最新セット・フォーマット別・その他）の第一階層の名称（表示順）と、各枠の先頭の「子のある項目」を展開したときの子の名称（表示順）を読む。
 * 販売側とネット買取側で同じ操作をして比べる。
 */
export async function カテゴリ一覧の構成を読む(page: Page): Promise<カテゴリ一覧の構成> {
  await カテゴリ一覧の描画を待つ(page);
  const out: カテゴリ一覧の構成 = [];
  for (const 枠 of 枠の名前) {
    const container = page.locator(`.p-hareruya-category-sidebar [data-category-level1-container="${枠}"]`).first();
    const items = container.locator(":scope > .p-hareruya-category-item");
    const 第一階層 = await items.locator(":scope > .p-hareruya-category-button .p-hareruya-category-button__text").evaluateAll(
      (ns) => ns.map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()));
    let 展開した項目: string | null = null;
    let 子: string[] = [];
    const withChildren = items.filter({ has: page.locator("button[data-category-toggle]") }).first();
    if (await withChildren.count() > 0) {
      展開した項目 = ((await withChildren.locator(":scope > .p-hareruya-category-button .p-hareruya-category-button__text").first().innerText()) ?? "").replace(/\s+/g, " ").trim();
      await withChildren.locator(":scope > button[data-category-toggle]").click({ timeout: 30_000 });
      const root = withChildren.locator(":scope > .p-hareruya-category-accordion");
      await root.locator(".p-hareruya-category-accordion__item").first().waitFor({ state: "attached", timeout: 30_000 });
      await page.waitForFunction((el) => el?.getAttribute("data-rendered") === "true", await root.elementHandle(), { timeout: 30_000 });
      子 = await root.locator(":scope > ul > .p-hareruya-category-accordion__item > :first-child [class$='__text']").evaluateAll(
        (ns) => ns.map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()));
    }
    out.push({ 枠, 第一階層, 展開した項目, 子 });
  }
  return out;
}

/** 販売側の商品一覧（検索条件なし）を開く。応答の状態を返す */
export async function 販売側の商品一覧を開く(page: Page): Promise<number> {
  const res = await page.goto(front("/products/search"), { timeout: 60_000, waitUntil: "load" });
  return res?.status() ?? 0;
}
