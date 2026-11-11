/**
 * 公開側のデッキ検索結果（F09-02）。検索条件の入力（デッキ詳細検索のモーダル）とデッキ検索TOPは F09-01 の部品
 * （pages/front/f09_01_deck_top.ts）を使う。ここは結果の画面の読み取りと、表示件数・ページ送りの操作だけを置く。
 */
import { expect, Locator, Page, Response } from "@playwright/test";

const 文 = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();
const 正規 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 一覧の1行の表示 */
export type 結果の行 = {
  プレイヤー: string; 大会名: string; 成績: string; 参加人数: string; 開催日: string;
  タグ: string[]; アーキタイプ: string;
  /** 画像の表示（背景画像の参照先） */
  画像: string;
  /** デッキリストが非公開の印（private）が付いているか */
  非公開の印: boolean;
};

/** デッキ検索結果への画面の移動の応答を待つ（戻り値の応答の状態で HTTP ステータスを見る） */
export const 結果の応答 = (page: Page): Promise<Response> =>
  page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().frame() === page.mainFrame() && /\/deck\/result\//.test(new URL(r.url()).pathname), { timeout: 90_000 });

export class DeckResultPage {
  constructor(readonly page: Page) {}

  get 一覧の項目(): Locator { return this.page.locator(".deckSearch-searchResult__item:not(.deckSearch-searchResult__item--empty)"); }
  get 該当なしの案内(): Locator { return this.page.locator(".deckSearch-searchResult__item--empty"); }
  get 表示件数の選択欄(): Locator { return this.page.locator("select#selectPageSize"); }
  get 総件数の表示(): Locator { return this.page.locator(".eventSearchResult__count__text span").first(); }
  get 見出し(): Locator { return this.page.locator("h1.c-hareruya-heading--lev1").first(); }
  /** 上側のページ送り */
  get ページ送り(): Locator { return this.page.locator(".p-hareruya-deck-result__pagination-wrap .p-hareruya-pagination__list").first(); }

  /** 結果の画面の組み立てが済むのを待つ（一覧の行か、該当なしの案内のどちらかが出る） */
  async 読み込みを待つ(): Promise<void> {
    await expect(this.page.locator(".deckSearch-searchResult__item").first(), "デッキ検索結果の一覧の領域").toBeAttached({ timeout: 30_000 });
    await expect(this.表示件数の選択欄, "デッキ検索結果の表示件数の選択欄").toBeAttached();
  }

  /** いま表示しているページの一覧の行（上から順） */
  async 行(): Promise<結果の行[]> {
    await this.読み込みを待つ();
    return this.一覧の項目.evaluateAll((lis) => lis.map((li) => {
      const t = (c: string) => (li.querySelector(c)?.textContent ?? "").replace(/\s+/g, " ").trim();
      const img = li.querySelector(".deckSearch-searchResult__item__img") as HTMLElement | null;
      const bg = img ? (img.style.backgroundImage || getComputedStyle(img).backgroundImage) : "";
      return {
        プレイヤー: t(".deckSearch-searchResult__item__playerName__td"),
        大会名: t(".deckSearch-searchResult__item__tournamentName__td"),
        成績: t(".deckSearch-searchResult__item__result__td"),
        参加人数: t(".deckSearch-searchResult__item__playerNumber__td"),
        開催日: t(".deckSearch-searchResult__item__tournamentDate__td"),
        タグ: Array.from(li.querySelectorAll(".deckSearch-searchResult__item__deckTag__link")).map((e) => (e.textContent ?? "").trim()),
        アーキタイプ: t(".deckSearch-searchResult__item__deckName"),
        画像: bg.replace(/^url\(["']?/, "").replace(/["']?\)$/, ""),
        非公開の印: !!li.querySelector(".deckSearch-searchResult__item__link.private"),
      };
    }));
  }

  /** いま表示しているページのプレイヤー名（上から順） */
  async プレイヤー名(): Promise<string[]> { return (await this.行()).map((r) => r.プレイヤー); }

  /** 総件数の表示（数字の部分） */
  async 総件数(): Promise<string> { return 文(await this.総件数の表示.textContent()); }

  /** 表示件数の選択肢（表示名、上から順）と、選ばれている選択肢の表示名 */
  async 表示件数の選択肢(): Promise<{ 選択肢: string[]; 選択中: string }> {
    await expect(this.表示件数の選択欄, "表示件数の選択欄").toBeVisible();
    const 選択肢 = (await this.表示件数の選択欄.locator("option").allInnerTexts()).map(文);
    const 選択中 = 文(await this.表示件数の選択欄.locator("option:checked").textContent());
    return { 選択肢, 選択中 };
  }

  /** 表示件数の選択欄に手を置く（ブラウザの選択の一覧は画面の外に開くので、欄を押して選択肢を読む） */
  async 表示件数の選択欄を開く(): Promise<void> {
    await this.表示件数の選択欄.scrollIntoViewIfNeeded();
    await this.表示件数の選択欄.focus();
  }

  /** 表示件数の選択欄で件数を選ぶ（画面は選んだ時点で検索し直す）。移った先の応答を返す */
  async 表示件数を選ぶ(件数: "20" | "40" | "60" | "80" | "100"): Promise<Response> {
    await this.表示件数の選択欄.scrollIntoViewIfNeeded();
    const res = 結果の応答(this.page);
    await Promise.all([
      this.page.waitForURL((u) => /\/deck\/result\//.test(u.pathname) && u.searchParams.get("pageSize") === 件数, { waitUntil: "load", timeout: 90_000 }),
      this.表示件数の選択欄.selectOption(件数),
    ]);
    const r = await res;
    await this.読み込みを待つ();
    return r;
  }

  /** ページ送り（上側）の表示: 並ぶ番号（リンクと現在ページ）、現在ページ、省略の印の位置 */
  async ページ送りの表示(): Promise<{ 並び: string[]; 現在: string }> {
    if ((await this.ページ送り.count()) === 0) return { 並び: [], 現在: "" };
    const 並び = await this.ページ送り.locator(".p-hareruya-pagination__item").evaluateAll((lis) => lis
      .filter((li) => !li.classList.contains("p-hareruya-pagination__item--prev") && !li.classList.contains("p-hareruya-pagination__item--next"))
      .map((li) => li.classList.contains("p-hareruya-pagination__item--ellipsis") ? "…" : (li.textContent ?? "").replace(/\s+/g, "").trim()));
    const 現在 = 文(await this.ページ送り.locator(".p-hareruya-pagination__item--current").textContent().catch(() => ""));
    return { 並び, 現在 };
  }

  /** ページ送り（上側）のページ番号を押す。移った先の応答を返す */
  async ページ番号を押す(n: number): Promise<Response> {
    const link = this.ページ送り.locator(`a.p-hareruya-pagination__link[data-page="${n}"]`).filter({ hasText: new RegExp(`^\\s*${正規(String(n))}\\s*$`) });
    await expect(link, `ページ送りの「${n}」`).toHaveCount(1);
    await link.scrollIntoViewIfNeeded();
    const res = 結果の応答(this.page);
    await Promise.all([this.page.waitForURL((u) => u.searchParams.get("page") === String(n), { waitUntil: "load", timeout: 90_000 }), link.click()]);
    const r = await res;
    await this.読み込みを待つ();
    return r;
  }

  /** 画面の題名（ブラウザのタブに出る題名） */
  async 題名(): Promise<string> { return this.page.title(); }
}
