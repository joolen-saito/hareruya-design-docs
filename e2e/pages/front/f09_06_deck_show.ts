/**
 * 公開側のデッキリスト詳細（F09-06）。セレクタはここだけに置く。
 * 情報欄の読み取りは M15-05 の部品（pages/front/m15_05_deck_show.ts の 情報欄）を使い、ここはそれ以外（カードリストの区画・
 * 画像・書き出しの入口・画面下部の導線・通知）と、遷移の先（デッキ検索結果の検索条件・デッキ一括購入・デッキ検索TOP）の読み取りを置く。
 *
 * 画面の表示名（アプリの翻訳ファイル・Twig で確かめたもの）:
 * - 区画の見出し: 統率者(n)・メインボード(n)・土地(n)・クリーチャー(n)・呪文(n)・Unknown(n)・サイドボード(n)
 * - 書き出しの入口: 「アリーナ用インポートテキスト」「Magic Online用テキスト」「日本語テキスト」（カードリストの上と下に同じ組が2つある）
 * - 画面下部: 「同じ大会のデッキを見る」「同じアーキタイプのデッキを見る」「戻る」、上部「このデッキを一括購入する」
 */
import { Locator, Page, Request, Response } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { FrontRecommend } from "./f03_05_recommend";

const 正規 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const 文 = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();

export class DeckShowPage {
  constructor(readonly page: Page) {}

  /** デッキIDを指定して、日本語表示のデッキリスト詳細を開く。応答を返す */
  async 開く(デッキID: string): Promise<Response | null> {
    const res = await this.page.goto(`${BASE_URL}/ja/deck/${デッキID}/show/`, { waitUntil: "load", timeout: 60_000 });
    return res;
  }

  /** デッキの識別子を空にして（/deck//show/）開く。応答を返す */
  async 識別子なしで開く(): Promise<Response | null> {
    return this.page.goto(`${BASE_URL}/ja/deck//show/`, { waitUntil: "load", timeout: 60_000 });
  }

  /**
   * 画面上部の言語切替（「English」）で表示言語を英語に切り替えた状態で、デッキリスト詳細を開く。
   * 日本語表示で開いてから言語切替を押す（言語切替は同じ画面の英語版へ移る）。英語版のアドレスでなければ、英語版を開き直す。
   */
  async 英語に切り替えて開く(デッキID: string): Promise<Response | null> {
    const first = await this.開く(デッキID);
    if (!first || first.status() >= 400) return first;
    const res = this.page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().frame() === this.page.mainFrame(), { timeout: 60_000 }).catch(() => null);
    await new FrontRecommend(this.page).言語を切り替える();
    const r = await res;
    if (!new RegExp(`/en/deck/${デッキID}/show/`).test(new URL(this.page.url()).pathname)) {
      return this.page.goto(`${BASE_URL}/en/deck/${デッキID}/show/`, { waitUntil: "load", timeout: 60_000 });
    }
    return r;
  }

  /** 英語表示のデッキリスト詳細を開く（表示言語を英語に切り替えたあとの開き直し） */
  async 英語版を開く(デッキID: string): Promise<Response | null> {
    return this.page.goto(`${BASE_URL}/en/deck/${デッキID}/show/`, { waitUntil: "load", timeout: 60_000 });
  }

  /** 旧URLからの入口（/deck/<旧デッキID>/old/）を開き、最初の応答（転送の応答）と、最後に開いた画面の応答を返す */
  async 旧URLで開く(旧デッキID: string): Promise<{ 最初: { 状態: number; 転送先: string }; 最後: Response | null }> {
    const box: { v: { 状態: number; 転送先: string } | null } = { v: null };
    const on = (r: Response) => {
      if (box.v || r.request().frame() !== this.page.mainFrame() || !r.request().isNavigationRequest()) return;
      if (!/\/old\/?$/.test(new URL(r.url()).pathname)) return;
      box.v = { 状態: r.status(), 転送先: r.headers()["location"] ?? "" };
    };
    this.page.on("response", on);
    try {
      const 最後 = await this.page.goto(`${BASE_URL}/ja/deck/${encodeURIComponent(旧デッキID)}/old/`, { waitUntil: "load", timeout: 60_000 });
      if (!box.v) throw new Error(`旧URLからの入口の応答を受け取れない（${this.page.url()}）`);
      return { 最初: box.v, 最後 };
    } finally { this.page.off("response", on); }
  }

  /** 画面上部の言語切替を押す（日本語表示なら英語へ） */
  async 言語を切り替える(): Promise<void> { await new FrontRecommend(this.page).言語を切り替える(); }

  /** 表示言語（html の lang） */
  async 表示言語(): Promise<string> { return (await this.page.locator("html").getAttribute("lang")) ?? ""; }

  /** 情報欄（デッキリスト詳細であることの印） */
  get 情報欄の領域(): Locator { return this.page.locator(".deckSearch-deckList__information"); }

  // ---- カードリスト ----

  get カードリスト(): Locator { return this.page.locator(".deckSearch-deckList__deckList__wrapper"); }

  /** カードリストの区画（見出し「名前(n)」の区画）。メインボードは見出しだけの区画 */
  区画(名前: string): Locator {
    if (名前 === "メインボード" || 名前 === "Mainboard") return this.カードリスト.locator(".deckSearch-deckList__deckList__container__text--main");
    return this.カードリスト.locator(".deckSearch-deckList__deckList__container__text").filter({
      has: this.page.locator(".deckSearch-deckList__deckList__totalNumber", { hasText: new RegExp(`^\\s*${正規(名前)}\\(\\d+\\)\\s*$`) }),
    });
  }

  /** 区画の見出しの枚数（区画が無ければ null） */
  async 区画の枚数(名前: string): Promise<number | null> {
    const s = this.区画(名前);
    if ((await s.count()) === 0) return null;
    const head = 名前 === "メインボード" ? await s.first().innerText() : await s.first().locator(".deckSearch-deckList__deckList__totalNumber").innerText();
    const m = /\((\d+)\)/.exec(head);
    return m ? Number(m[1]) : null;
  }

  /** 区画に並ぶカードの行の文（例「4 《…》」） */
  async 区画の行(名前: string): Promise<string[]> {
    const s = this.区画(名前);
    if ((await s.count()) === 0) return [];
    return s.first().locator(":scope > div:not(.deckSearch-deckList__deckList__totalNumber)").evaluateAll((ds) => ds.map((d) => (d.textContent ?? "").replace(/\s+/g, " ").trim()));
  }

  /** カードリストに並ぶカードの行（すべての区画）と、カードの画像の数 */
  async 表示されたカード(): Promise<{ 行: number; 画像: number }> {
    const 行 = await this.カードリスト.locator(".deckSearch-deckList__deckList__container__text > div:not(.deckSearch-deckList__deckList__totalNumber)").count();
    const 画像 = await this.page.locator(".mo_visualize .vOuter").count();
    return { 行, 画像 };
  }

  /** カードリストの領域の文 */
  async カードリストの文(): Promise<string> { return 文(await this.カードリスト.innerText()); }

  // ---- カードの画像 ----

  /** カードの画像（カード名(日)か(英)を代わりの文に持つ画像。画像の区画の中）の取得元（src）と、画像に商品への入口（リンク）が付いているか */
  async 画像の状態(名: string[]): Promise<{ 数: number; 取得元: string; 入口: string }> {
    const img = this.page.locator(".mo_visualize .vOuter img").and(this.page.locator(名.map((n) => `img[alt="${n.replace(/"/g, '\\"')}"]`).join(", ")));
    const 数 = await img.count();
    if (数 === 0) return { 数, 取得元: "", 入口: "" };
    const 取得元 = (await img.first().getAttribute("src")) ?? "";
    const 入口 = await img.first().evaluate((e) => (e.closest("a") as HTMLAnchorElement | null)?.href ?? "");
    return { 数, 取得元, 入口 };
  }

  // ---- 書き出し ----

  /** 書き出しの入口（表示名で。上下2つの組の両方を含む） */
  書き出しの入口(表示名: string): Locator {
    return this.page.locator("a.deckSearch-deckList__export__button").filter({ hasText: new RegExp(`^\\s*${正規(表示名)}\\s*$`) });
  }
  /** 見えている書き出しの入口の数 */
  async 見えている入口の数(表示名: string): Promise<number> {
    let n = 0;
    for (const e of await this.書き出しの入口(表示名).all()) if (await e.isVisible()) n++;
    return n;
  }
  /** 見えている書き出しの入口の、最初の1つ */
  async 入口(表示名: string): Promise<Locator> {
    for (const e of await this.書き出しの入口(表示名).all()) if (await e.isVisible()) return e;
    throw new Error(`書き出しの入口「${表示名}」が見えていない`);
  }

  /** 書き出しの入口を押し、送られた取得要求（デッキリストの取得）を返す */
  async 入口を押して要求を待つ(表示名: string): Promise<Request> {
    const e = await this.入口(表示名);
    const req = this.page.waitForRequest((r) => /\/deck\/arena\/\d+/.test(new URL(r.url()).pathname), { timeout: 30_000 });
    await e.scrollIntoViewIfNeeded();
    await e.click();
    return req;
  }

  /** 画面中央に出る通知（トースト）の文（見えているもの） */
  get 通知(): Locator { return this.page.locator(".jq-toast-single"); }

  // ---- 情報欄のリンク ----

  /** 情報欄の見出しの欄にある、文が一致するリンク */
  情報欄のリンク(見出し: string, 文字: string): Locator {
    return this.page.locator("ul.deckSearch-deckList__information__flex__list")
      .filter({ has: this.page.locator(".deckSearch-deckList__information__list__header", { hasText: new RegExp(`^\\s*${正規(見出し)}\\s*$`) }) })
      .locator(".deckSearch-deckList__information__list__body a").filter({ hasText: new RegExp(`^\\s*${正規(文字)}\\s*$`) });
  }

  // ---- 画面下部の導線 ----

  get 同じ大会のデッキを見る(): Locator { return this.page.locator(".deckSearch-deckList__button__sameTournament a").filter({ hasText: /^\s*同じ大会のデッキを見る\s*$/ }); }
  get 同じアーキタイプのデッキを見る(): Locator { return this.page.locator(".deckSearch-deckList__button__sameArchetype a").filter({ hasText: /^\s*同じアーキタイプのデッキを見る\s*$/ }); }
  get 戻る(): Locator { return this.page.locator(".button__container-return a").filter({ hasText: /^\s*戻る\s*$/ }); }
  get 一括購入(): Locator { return this.page.locator(".deckSearch-deckList__buyAllButtonWrapper a.deckSearch-deckList__buyAllButton").filter({ hasText: /^\s*このデッキを一括購入する\s*$/ }); }

  /** 見えているリンクを押して、移った先の読み込みを待つ */
  async 押して移る(l: Locator, what: string): Promise<void> {
    let target: Locator | null = null;
    for (const e of await l.all()) if (await e.isVisible()) { target = e; break; }
    if (!target) throw new Error(`「${what}」が見えていない`);
    await target.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), target.click()]);
  }
}

/** デッキ検索結果の一覧に並ぶデッキのデッキID（いま表示しているページ。デッキリスト詳細へのリンクから読む） */
export async function 結果のデッキID(page: Page): Promise<string[]> {
  await page.locator(".deckSearch-searchResult__item").first().waitFor({ state: "attached", timeout: 30_000 });
  return page.locator("a.deckSearch-searchResult__itemWrapper").evaluateAll((as) => as
    .map((a) => /\/deck\/(\d+)\/show/.exec((a as HTMLAnchorElement).getAttribute("href") ?? "")?.[1] ?? "").filter(Boolean));
}

/** デッキ詳細検索の欄（デッキ検索結果・デッキ検索TOPの画面にある）で、選ばれているアーキタイプとタグの名前、成績・公開/非公開の選択 */
export async function 検索条件の選択(page: Page): Promise<{ アーキタイプ: string[]; タグ: string[]; 成績: string; 公開: string }> {
  const form = page.locator("form#search_block");
  const アーキタイプ = await page.locator('input[type="checkbox"][id^="arche-"]:checked').evaluateAll((es) => es.map((e) =>
    ((e.closest("label")?.querySelector(".deckSearch-top__archetypedetail__area__archetype-name")?.textContent) ?? "").trim()));
  const タグ = await form.locator('input[name="tagId[]"]:checked').evaluateAll((es) => es.map((e) => {
    const l = e.closest("label") as HTMLElement | null;
    return (l?.dataset.nameJp ?? l?.textContent ?? "").trim();
  }));
  const radio = async (n: string) => {
    const c = form.locator(`input[name="${n}"]:checked`);
    return (await c.count()) ? 文(await c.first().evaluate((e) => (e.parentElement?.querySelector("span")?.textContent) ?? "")) : "";
  };
  return { アーキタイプ, タグ, 成績: await radio("grades"), 公開: await radio("public_status") };
}

/** デッキ一括購入画面のカードリスト欄の行 */
export async function 一括購入のカードリスト(page: Page): Promise<string[]> {
  const v = await page.locator('textarea[name="card_list"]').inputValue();
  return v.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}
