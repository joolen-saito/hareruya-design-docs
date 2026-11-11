/**
 * ネット買取商品一覧（/ja/purchase/search）の検索結果と、ネット買取商品詳細の「他のバージョン商品」の読み取り・操作（F05-02〜F05-04）。
 * セレクタはここだけに書く。モーダルの入力は PurchaseSearchPage（f05_02_purchase_search.ts）を使う。
 *
 * 画面の作り（アプリの Purchase/search.twig・hareruya-unisearch-list-client-core.js・Block/_purchase_product_card_common.twig・
 * Purchase/detail.twig・Block/js/purchase_detail_same_name_js.twig で確かめた）:
 * - 一覧は、検索サービスの結果（docs）から、まず仮の行（読み込み中の印つき）を出し、続けて買取価格・数量・カートつきの行に差し替える。
 *   行は #purchase-list-unisearch-shelf の .ec-purchaseSearch__results__item。0件は「お探しの商品は見つかりませんでした」の案内。
 * - 行の商品名のリンクは /ja/purchase/detail/<商品ID>?lang=<言語>&class=<商品規格ID>。言語ラベルはカード商品だけ。
 *   数量（マイナス・数量・プラス）と「カートに追加」は買取価格が500円以上のときだけ。カードの商品には「同名商品検索」（?cardId=<カードID>）。
 * - 並べ替えはタブ .js-purchase-search-orderby-btn（data-orderby-id: 1 発売日順・2 色順・3 価格（高い順）・4 価格（低い順））。
 * - 一覧上の絞り込み: [data-qf-row="language|foilFlg|rarity|colors|cardtypes"][data-qf-value=…] のボタン。
 * - ページ送り: 上部 #purchase-list-unisearch-pager-top、下部 .p-hareruya-product-list__pagination-bottom（.p-hareruya-pagination__item）。
 * - 商品詳細の他のバージョン商品: #purchaseSameNameProducts の .purchaseSameNameProduct（見えている行が今のページ）。
 *   絞り込み .purchase-same-name-filter[data-filter=jp|en|other|nonFoil|foil|foilSpecial]、並べ替え .purchase-same-name-sort[data-sort-key]、
 *   件数 .purchase-same-name-filtered-count、ページ送り .purchase-same-name-pagenation の .purchase-same-name-page-num-<n>。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 一覧の行 = {
  商品ID: string; 規格ID: string; 言語: string; 商品名: string; 言語ラベル: string; 買取価格: string;
  数量欄: boolean; 数量: string; カートに追加: boolean; 同名商品検索: string | null; 画像: string;
};

async function 行を読む(items: Locator, onlyVisible: boolean): Promise<一覧の行[]> {
  return items.evaluateAll((els, vis) => els.filter((e) => !vis || (e as HTMLElement).offsetParent !== null || getComputedStyle(e).display !== "none").map((e) => {
    const a = e.querySelector("a.p-hareruya-product-card__name") as HTMLAnchorElement | null;
    const u = a ? new URL(a.href, location.href) : null;
    const same = e.querySelector('a[href*="cardId="]') as HTMLAnchorElement | null;
    const qty = e.querySelector(".qty-input") as HTMLInputElement | null;
    const img = e.querySelector("img.p-hareruya-product-card__img") as HTMLImageElement | null;
    return {
      商品ID: u ? (/\/purchase\/detail\/(\d+)/.exec(u.pathname)?.[1] ?? "") : "",
      規格ID: u?.searchParams.get("class") ?? "",
      言語: u?.searchParams.get("lang") ?? "",
      商品名: (e.querySelector(".p-hareruya-product-card__name-text")?.textContent ?? "").trim(),
      言語ラベル: (e.querySelector(".p-hareruya-product-card__language-label")?.textContent ?? "").trim(),
      買取価格: (e.querySelector(".p-hareruya-product-card__price")?.textContent ?? "").replace(/\s+/g, "").trim(),
      数量欄: !!e.querySelector(".purchase-detail-qty"),
      数量: qty?.value ?? "",
      カートに追加: !!e.querySelector("button.addCart"),
      同名商品検索: same ? same.getAttribute("href") : null,
      画像: img?.getAttribute("src") ?? "",
    };
  }), onlyVisible);
}

export class ネット買取の検索結果 {
  constructor(readonly page: Page) {}

  get 棚(): Locator { return this.page.locator("#purchase-list-unisearch-shelf"); }
  get 行(): Locator { return this.棚.locator(".ec-purchaseSearch__results__item"); }
  get 商品数(): Locator { return this.page.locator("#purchase-list-unisearch-hit-count"); }
  get 案内(): Locator { return this.棚.locator(".ec-purchaseSearch__results-status"); }
  get 多すぎる案内(): Locator { return this.page.locator(".js-unisearch-exceeded-message:not([hidden])"); }
  get 上部のページ送り(): Locator { return this.page.locator("#purchase-list-unisearch-pager-top"); }
  get 下部のページ送り(): Locator { return this.page.locator(".p-hareruya-product-list__pagination-bottom .purchase-list-unisearch-pager"); }
  get 説明の欄(): Locator { return this.page.locator(".p-hareruya-product-list__free-content"); }
  get まとめて買取(): Locator { return this.page.locator("a.p-hareruya-purchase-bundle__link"); }
  get ページタイトル(): Promise<string> { return this.page.title(); }

  /** アドレス（BASE_URL からのパスと引数）を開く */
  async 開く(pathAndQuery: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${pathAndQuery}`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 検索結果の差し替え（仮の行→正式な行）が済むまで待つ。0件の案内・失敗の案内が出たときも返る */
  async 結果を待つ(): Promise<void> {
    await this.page.waitForFunction(() => {
      const shelf = document.querySelector("#purchase-list-unisearch-shelf");
      if (!shelf) return false;
      if (shelf.querySelector(".purchase-list-unisearch-loading")) return false;
      return shelf.children.length > 0;
    }, undefined, { timeout: 90_000 });
    await this.page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  }

  async 行を読む(): Promise<一覧の行[]> { return 行を読む(this.行, false); }

  /** 商品数の表示の数（「商品数: N点」の N。読めなければ null） */
  async 商品数の値(): Promise<string | null> {
    const t = ((await this.商品数.textContent()) ?? "").trim();
    return /商品数:\s*([\d,+]+)点/.exec(t)?.[1] ?? null;
  }

  /** ヘッダのキーワード検索に入れて検索する（一覧の画面へ移るのを待つ） */
  async ヘッダで検索する(語: string): Promise<void> {
    await this.page.locator("#purchase_header_search_goods_name").fill(語);
    await Promise.all([
      this.page.waitForURL((u) => u.pathname.includes("/purchase/search"), { waitUntil: "load", timeout: 60_000 }),
      this.page.locator("#purchase_header_search_goods_submit").click(),
    ]);
  }

  /** 並べ替えのタブを押す（1 発売日順・2 色順・3 価格（高い順）・4 価格（低い順））。押したタブの表示名を返す */
  async 並べ替える(id: "1" | "2" | "3" | "4"): Promise<string> {
    const tab = this.page.locator(`.js-purchase-search-orderby-btn[data-orderby-id="${id}"]:visible`).first();
    const name = ((await tab.textContent()) ?? "").trim();
    await tab.click();
    await this.page.waitForTimeout(500);
    await this.結果を待つ();
    return name;
  }

  /** 選ばれている並べ替えのタブの表示名 */
  async 選ばれている並び順(): Promise<string[]> {
    return (await this.page.locator(".js-purchase-search-orderby-btn.is-active").allTextContents()).map((t) => t.trim());
  }

  /** 一覧上の絞り込みのボタン（行・値） */
  絞り込みのボタン(行: "language" | "foilFlg" | "rarity" | "colors" | "cardtypes", 値: string): Locator {
    return this.page.locator(`#purchase-search-form [data-qf-row="${行}"][data-qf-value="${値}"]:visible`).first();
  }

  /** 絞り込みの行のボタンの表示名と値（見えているもの） */
  async 絞り込みの選択肢(行: "language" | "foilFlg" | "rarity" | "colors" | "cardtypes"): Promise<{ 値: string; 名: string }[]> {
    return this.page.locator(`#purchase-search-form [data-qf-row="${行}"]:visible`).evaluateAll((bs) => bs.map((b) => ({
      値: b.getAttribute("data-qf-value") ?? "", 名: ((b.textContent ?? "").trim() || b.getAttribute("aria-label") || "").trim(),
    })));
  }

  /** 絞り込みのボタンを押して、結果の差し替えを待つ */
  async 絞り込みを押す(button: Locator): Promise<void> {
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await this.page.waitForTimeout(800);
    await this.結果を待つ();
  }

  /** 「全色」を押す（色の選択をすべて外す） */
  get 全色(): Locator { return this.page.locator('#purchase-search-form [data-filter="all-color"]:visible').first(); }

  /** ページ送りの項目の表記（上から順。番号・前へ・次へ・省略の印） */
  async ページ送りの表記(where: "上部" | "下部"): Promise<string[]> {
    const host = where === "上部" ? this.上部のページ送り : this.下部のページ送り;
    return (await host.locator(".p-hareruya-pagination__item").allTextContents()).map((t) => t.replace(/\s+/g, "").trim());
  }

  /** ページ送りで、表記が一致する項目を返す */
  ページ送りの項目(where: "上部" | "下部", 表記: string): Locator {
    const host = where === "上部" ? this.上部のページ送り : this.下部のページ送り;
    return host.locator(".p-hareruya-pagination__item").filter({ hasText: new RegExp(`^\\s*${表記.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }).first();
  }

  /** いま表示中のページ番号（ページ送りの現在の項目） */
  async 現在のページ(): Promise<string> {
    return ((await this.上部のページ送り.locator(".p-hareruya-pagination__item--current").first().textContent().catch(() => "")) ?? "").trim();
  }

  /** ページ送りの項目を押す（リンクがあれば押して結果を待つ）。押せるリンクだったかを返す */
  async ページ送りを押す(item: Locator): Promise<boolean> {
    const link = item.locator("a");
    const 押せる = (await link.count()) > 0;
    await item.scrollIntoViewIfNeeded();
    await (押せる ? link.first() : item).click();
    await this.page.waitForTimeout(800);
    await this.結果を待つ();
    return 押せる;
  }

  /** 行の「同名商品検索」を押して移った先のアドレスを返す */
  async 同名商品検索を押す(row: Locator): Promise<void> {
    await Promise.all([
      this.page.waitForURL((u) => u.searchParams.has("cardId"), { waitUntil: "load", timeout: 60_000 }),
      row.locator('a[href*="cardId="]').first().click(),
    ]);
  }

  /** 行の数量・マイナス・プラス・カートに追加 */
  数量の欄(row: Locator): Locator { return row.locator(".purchase-detail-qty .qty-input"); }
  async プラスを押す(row: Locator, 回数: number): Promise<void> { for (let i = 0; i < 回数; i++) await row.locator(".purchase-detail-qty .btn-plus").click(); }
  /** マイナスを押す。無効のときも利用者と同じくその位置を押す。押したときに無効だった回数を返す */
  async マイナスを押す(row: Locator, 回数: number): Promise<number> {
    let disabled = 0;
    const b = row.locator(".purchase-detail-qty .btn-minus");
    for (let i = 0; i < 回数; i++) {
      if (await b.isDisabled()) { disabled++; await b.click({ force: true }); } else await b.click();
    }
    return disabled;
  }
  /** 行の「カートに追加」を押し、追加の要求の応答の状態を返す */
  async カートに追加を押す(row: Locator): Promise<number> {
    const res = this.page.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/purchase/add") && r.request().method() === "POST", { timeout: 30_000 });
    await row.locator("button.addCart").click();
    return (await res).status();
  }

  /** 商品IDで行を引く（商品名のリンクの商品ID） */
  行の要素(商品ID: string): Locator {
    return this.行.filter({ has: this.page.locator(`a.p-hareruya-product-card__name[href*="/purchase/detail/${商品ID}?"], a.p-hareruya-product-card__name[href$="/purchase/detail/${商品ID}"]`) }).first();
  }
}

/** ネット買取商品詳細の「他のバージョン商品」 */
export class 他のバージョン商品 {
  constructor(readonly page: Page) {}
  get 枠(): Locator { return this.page.locator("#purchase-other-versions"); }
  get 行(): Locator { return this.page.locator("#purchaseSameNameProducts .purchaseSameNameProduct"); }
  get 件数(): Locator { return this.page.locator(".purchase-same-name-filtered-count").first(); }

  /** 他のバージョン商品の行が出る（読み込みが済む）まで待つ */
  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForFunction(() => {
      const g = document.querySelector("#purchaseSameNameProducts");
      return !!g && g.querySelectorAll(".purchaseSameNameProduct:not(.purchase-same-name-loading)").length > 0
        && !g.querySelector(".purchase-same-name-loading, .purchase-list-unisearch-loading");
    }, undefined, { timeout: 90_000 });
    await this.page.waitForTimeout(500);
  }

  /** 今見えている行（今のページ） */
  async 見えている行(): Promise<一覧の行[]> {
    return this.行.evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").map((e) => {
      const a = e.querySelector("a.p-hareruya-product-card__name") as HTMLAnchorElement | null;
      const u = a ? new URL(a.href, location.href) : null;
      const same = e.querySelector('a[href*="cardId="]') as HTMLAnchorElement | null;
      const qty = e.querySelector(".qty-input") as HTMLInputElement | null;
      const img = e.querySelector("img.p-hareruya-product-card__img") as HTMLImageElement | null;
      return {
        商品ID: u ? (/\/purchase\/detail\/(\d+)/.exec(u.pathname)?.[1] ?? "") : "",
        規格ID: u?.searchParams.get("class") ?? "", 言語: u?.searchParams.get("lang") ?? "",
        商品名: (e.querySelector(".p-hareruya-product-card__name-text")?.textContent ?? "").trim(),
        言語ラベル: (e.querySelector(".p-hareruya-product-card__language-label")?.textContent ?? "").trim(),
        買取価格: (e.querySelector(".p-hareruya-product-card__price")?.textContent ?? "").replace(/\s+/g, "").trim(),
        数量欄: !!e.querySelector(".purchase-detail-qty"), 数量: qty?.value ?? "",
        カートに追加: !!e.querySelector("button.addCart"), 同名商品検索: same ? same.getAttribute("href") : null,
        画像: img?.getAttribute("src") ?? "",
      };
    }));
  }

  /** 絞り込みのボタンを押す（jp・en・other・nonFoil・foil・foilSpecial） */
  async 絞り込む(key: "jp" | "en" | "other" | "nonFoil" | "foil" | "foilSpecial"): Promise<void> {
    await this.page.locator(`.purchase-same-name-filter[data-filter="${key}"]:visible`).first().click();
    await this.page.waitForTimeout(500);
  }

  /** 並べ替え（buy_price_desc＝価格（高い順）・buy_price_asc＝価格（低い順））。見えているタブ、無ければ選択欄で選ぶ */
  async 並べ替える(key: "buy_price_desc" | "buy_price_asc"): Promise<void> {
    const tab = this.page.locator(`.purchase-same-name-sort[data-sort-key="${key}"]:visible`).first();
    if (await tab.count()) await tab.click();
    else await this.page.locator(".purchase-same-name-sort-select:visible").first().selectOption(key);
    await this.page.waitForTimeout(1500);
    await this.読み込みを待つ();
  }

  /** ページ送りの番号を押す */
  async ページを選ぶ(n: number): Promise<void> {
    await this.page.locator(`.purchase-same-name-page-num-${n} a`).first().click();
    await this.page.waitForTimeout(500);
  }

  async 現在のページ(): Promise<string> {
    return ((await this.page.locator(".purchaseSameNamePageNow").first().textContent()) ?? "").trim();
  }
}

/** ネット買取商品検索モーダルの論理演算子（色・カードタイプ）を選ぶ（値 0＝or・1＝and。ラジオのラベルを押す） */
export async function 論理演算子を選ぶ(フォーム: Locator, 欄: "色" | "カードタイプ", 値: "or" | "and"): Promise<void> {
  const name = 欄 === "色" ? "colorsType" : "cardtypesType";
  const input = フォーム.locator(`input[type="radio"][name$="${name}"][value="${値 === "or" ? "0" : "1"}"]`);
  if ((await input.count()) !== 1) throw new Error(`ネット買取商品検索モーダルに${欄}の論理演算子「${値}」が ${await input.count()} 件（1件のはず）`);
  await input.locator("xpath=ancestor::label[1]").click();
  if (!(await input.isChecked())) await input.check({ force: true });
}

/** モーダルのチェックの並び（frame・foil など）で選ばれている選択肢をすべて外す */
export async function 選択を外す(フォーム: Locator, cls: "frame" | "foil" | "color" | "card-type" | "language" | "rarity" | "mana-cost"): Promise<void> {
  const checked = フォーム.locator(`.p-hareruya-search-form__${cls} input[type="checkbox"]:checked`);
  for (let n = await checked.count(); n > 0; n = await checked.count()) {
    const input = checked.first();
    await input.locator("xpath=ancestor::label[1]").click();
    if (await input.isChecked()) await input.uncheck({ force: true });
  }
}
