/**
 * 公開側の採用枚数ランキング（F09-04）。メタゲーム一覧の画面（F09-03 の部品 pages/front/f09_03_metagame.ts）から
 * 「採用枚数ランキング」を押して開く。英語表示のときの入口（メタゲーム一覧の「Top Cards Ranking」）もここに置く。
 *
 * 画面の作り（アプリの画面の作りと翻訳ファイルで確かめた）:
 * - 切替の見出しは「スペル」「土地」に、画面幅の広いときだけ「採用枚数ランキング」が続く（英語は「Spell」「Land」と「 Top Cards Ranking」）。
 * - スペル・土地のランキングは、画面にはどちらの区画も置かれ、選んでいない方を隠す。各件はカード画像（代替の文がカード名）・順位・枚数
 *   （「4枚」。英語は「×4」）。カード名は文字では出ず、画像の代替の文（日本語表示は日本語名、英語表示は英語名）にだけ出る。
 * - 各件のカード画像はリンク（別のタブで開く）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 言語 = "ja" | "en";
export type 区分 = "スペル" | "土地";

/** ランキングの1件の表示 */
export type ランキングの件 = {
  /** 順位の欄の文 */
  順位: string;
  /** 画像の代替の文（カード名） */
  名前: string;
  /** 枚数の欄の文（「4枚」「×4」） */
  枚数の文: string;
  /** 枚数の欄の数（数字だけを読んだもの。読めなければ NaN） */
  枚数: number;
  /** 画像の参照先 */
  画像: string;
  /** 画像のファイル名（参照先の最後の「/」より後ろ） */
  画像のファイル名: string;
  /** リンク先 */
  リンク: string;
};

const 正規 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 画面上部の言語切替（日本語表示のとき「EN」、英語表示のとき「JP」）を押して、切り替わるのを待つ */
export async function 言語を切り替える(page: Page): Promise<void> {
  const link = page.locator(".p-hareruya-header__nav-item--lang a").first();
  await link.waitFor({ state: "visible", timeout: 30_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 90_000 }), link.click()]);
}

/** 公開側のトップ（日本語表示）を開く */
export async function トップを開く(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/ja/`, { waitUntil: "load", timeout: 90_000 });
}

/** いまの表示言語（アドレスの先頭の言語） */
export function 表示言語(page: Page): string { return new URL(page.url()).pathname.split("/")[1] ?? ""; }

/** メタゲーム一覧（言語つき）を、フォーマットの番号を入れたアドレスで開く。応答の状態を返す */
export async function メタゲーム一覧を開く(page: Page, 番号: string, lang: 言語): Promise<number> {
  const res = await page.goto(`${BASE_URL}/${lang}/deck/${番号}/metagame/`, { waitUntil: "load", timeout: 90_000 });
  return res?.status() ?? 0;
}

/** メタゲーム一覧の画面上部の、採用枚数ランキングへの入口（日本語「採用枚数ランキング」・英語「Top Cards Ranking」） */
export function ランキングへの入口(page: Page, lang: 言語): Locator {
  const name = lang === "en" ? "Top Cards Ranking" : "採用枚数ランキング";
  return page.locator(".p-hareruya-deck-metagame__header-container a").filter({ hasText: new RegExp(`^\\s*${正規(name)}\\s*$`) });
}

export class UsageRankingPage {
  constructor(readonly page: Page, readonly lang: 言語 = "ja") {}

  /** メタゲーム一覧で入口を押し、採用枚数ランキングへ移るのを待つ */
  async 入口を押す(): Promise<void> {
    const a = ランキングへの入口(this.page, this.lang);
    await expect(a, "メタゲーム一覧の、採用枚数ランキングへの入口").toHaveCount(1);
    await Promise.all([this.page.waitForURL(/\/deck\/\d+\/usage_ranking\//, { waitUntil: "load", timeout: 90_000 }), a.click()]);
    await this.読み込みを待つ();
  }

  get 見出し(): Locator { return this.page.locator(".deckSearch-cardAmount__headWrapper h1.c-hareruya-heading--lev1").first(); }
  /** 集計期間の表示（「yyyy/mm/dd～」） */
  get 集計期間(): Locator { return this.page.locator(".deckSearch-cardAmount__headWrapper__date").first(); }

  async 読み込みを待つ(): Promise<void> {
    await expect(this.見出し, "採用枚数ランキングの見出し").toBeVisible({ timeout: 30_000 });
    await expect(this.page.locator("#js-card-ranking-spell"), "スペルのランキングの区画").toBeAttached();
    await expect(this.page.locator("#js-card-ranking-land"), "土地のランキングの区画").toBeAttached();
  }

  /** 見出しの文（空白を詰める） */
  async 見出しの文(): Promise<string> { return ((await this.見出し.textContent()) ?? "").replace(/\s+/g, ""); }
  /** 見出しの文（改行の位置の空白を1つにする。英語の見出しの語の区切りを残す） */
  async 見出しの文_空白つき(): Promise<string> {
    return this.見出し.evaluate((h) => Array.from(h.childNodes).map((n) => (n.nodeName === "BR" ? " " : n.textContent ?? "")).join("").replace(/\s+/g, " ").trim());
  }
  /** 集計期間の開始日（末尾の「～」を外す） */
  async 開始日(): Promise<string> { return ((await this.集計期間.textContent()) ?? "").replace(/\s+/g, "").replace(/～$/, ""); }

  /** 切替の見出し（スペル・土地） */
  切替(k: 区分): Locator {
    return this.page.locator(k === "スペル" ? "label.deckSearch-cardAmount__tab--spell" : "label.deckSearch-cardAmount__tab--land");
  }
  /** 切替の見出しの表示名（画面幅の広いときの文） */
  async 切替の名前(k: 区分): Promise<string> { return ((await this.切替(k).innerText()) ?? "").replace(/\s+/g, " ").trim(); }
  /** 切替の見出しを押し、その区画が表示されるのを待つ。押した見出しの表示名を返す */
  async 切替を押す(k: 区分): Promise<string> {
    const t = this.切替(k);
    await expect(t, `切替の見出し（${k}）`).toBeVisible();
    const name = await this.切替の名前(k);
    await t.click();
    await expect(this.区画(k), `${k}のランキングの区画が表示に切り替わる`).toHaveCSS("display", "grid");
    return name;
  }

  区画(k: 区分): Locator { return this.page.locator(k === "スペル" ? "#js-card-ranking-spell" : "#js-card-ranking-land"); }
  件(k: 区分): Locator { return this.区画(k).locator(".deckSearch-cardAmount__rk__li"); }
  /** 区画が表示されているか（隠されていないか） */
  async 表示されている(k: 区分): Promise<boolean> { return this.区画(k).isVisible(); }

  /** 区画の件（上から順） */
  async 件を読む(k: 区分): Promise<ランキングの件[]> {
    return this.件(k).evaluateAll((lis) => lis.map((li) => {
      const t = (c: string) => (li.querySelector(c)?.textContent ?? "").replace(/\s+/g, " ").trim();
      const img = li.querySelector("img") as HTMLImageElement | null;
      const src = img?.getAttribute("src") ?? "";
      const 枚数の文 = t(".deckSearch-cardAmount__rk__li__da__am");
      const digits = 枚数の文.replace(/[^0-9]/g, "");
      return {
        順位: t(".deckSearch-cardAmount__rk__li__da__pl"),
        名前: (img?.getAttribute("alt") ?? "").trim(),
        枚数の文,
        枚数: digits === "" ? NaN : Number(digits),
        画像: src,
        画像のファイル名: src.split("?")[0].split("/").pop() ?? "",
        リンク: (li.querySelector("a") as HTMLAnchorElement | null)?.href ?? "",
      };
    }));
  }

  /** 区画の、カード名（画像の代替の文）が一致する件の画像のリンク */
  件のリンク(k: 区分, 名前: string): Locator {
    return this.件(k).filter({ has: this.page.locator(`img[alt="${名前.replace(/"/g, '\\"')}"]`) }).locator("a.popup_product").first();
  }

  /** 件のカード画像を押す。別のタブで開いた画面を返す（開かなければ null） */
  async 件を押す(k: 区分, 名前: string): Promise<Page | null> {
    const a = this.件のリンク(k, 名前);
    await expect(a, `${k}のランキングの「${名前}」の件`).toBeVisible();
    const popup = this.page.context().waitForEvent("page", { timeout: 30_000 }).catch(() => null);
    await a.click();
    const p = await popup;
    if (p) await p.waitForLoadState("load", { timeout: 90_000 }).catch(() => undefined);
    return p;
  }

  /** 商品ポップアップ */
  get ポップアップ(): Locator { return this.page.locator("#popupProduct"); }
  /** 件のカード画像にマウスを乗せ、商品ポップアップが出るのを待つ（画面幅が広いときは、乗せると出る作り） */
  async ポップアップを開く(k: 区分, 名前: string): Promise<void> {
    const a = this.件のリンク(k, 名前);
    await expect(a, `${k}のランキングの「${名前}」の件`).toBeVisible();
    await a.scrollIntoViewIfNeeded();
    await a.hover();
    await expect(this.ポップアップ, "商品ポップアップが出る").toBeVisible({ timeout: 30_000 });
    await expect(this.ポップアップ.locator(".popupName"), "商品ポップアップの商品名").not.toHaveText("", { timeout: 30_000 });
  }
  /** 商品ポップアップの「カートに追加」 */
  get カートに追加(): Locator { return this.ポップアップ.locator("button.btn_cart_"); }
  /** 「カートに追加」を押し、「商品をカートに入れました」が出るのを待つ */
  async カートに追加を押す(): Promise<void> {
    await expect(this.カートに追加, "商品ポップアップの「カートに追加」").toBeVisible();
    await this.カートに追加.click();
    await expect(this.ポップアップ.locator(".cartSuccess"), "「商品をカートに入れました」").toBeVisible({ timeout: 30_000 });
  }
  /** 「買い物かごを見る」（画像のリンク。別のタブで開く）を押し、開いたタブを返す */
  async 買い物かごを見るを押す(): Promise<Page> {
    const a = this.ポップアップ.locator(".cart_to_order_ a").filter({ has: this.page.locator('img[alt="買い物かごを見る"]') });
    await expect(a, "「買い物かごを見る」").toBeVisible();
    const [p] = await Promise.all([this.page.context().waitForEvent("page", { timeout: 30_000 }), a.click()]);
    await p.waitForLoadState("load", { timeout: 90_000 });
    return p;
  }

  /** 画面上部の「デッキ検索ページ」 */
  get デッキ検索ページ(): Locator {
    return this.page.locator("a.deckSearch-cardAmount__toDeckTopButton").filter({ hasText: /^\s*デッキ検索ページ\s*$/ });
  }
  async デッキ検索ページを押す(): Promise<void> {
    await expect(this.デッキ検索ページ, "画面上部の「デッキ検索ページ」").toHaveCount(1);
    await Promise.all([this.page.waitForURL((u) => /\/deck\/$/.test(u.pathname), { waitUntil: "load", timeout: 90_000 }), this.デッキ検索ページ.click()]);
  }

  /** 画面下部の「戻る」 */
  get 戻る(): Locator { return this.page.locator(".button__container-return a.eventSearch__button-return").filter({ hasText: /^\s*戻る\s*$/ }); }
  async 戻るを押す(): Promise<void> {
    await expect(this.戻る, "画面下部の「戻る」").toHaveCount(1);
    await this.戻る.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForURL(/\/deck\/\d+\/metagame\//, { waitUntil: "load", timeout: 90_000 }), this.戻る.click()]);
  }
}
