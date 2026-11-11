/**
 * 公開側のその他デッキ一覧（F09-05）。画面はデッキ検索結果と同じ組み立て（一覧・件数の表示領域・ページ送り）。
 * デッキ検索TOPの「その他」から開く。デッキ検索TOP・デッキ詳細検索のモーダルは F09-01 の部品（f09_01_deck_top）を使う。
 */
import { expect, Locator, Page } from "@playwright/test";
import { DeckTopPage } from "./f09_01_deck_top";

export type 一覧の行 = {
  プレイヤー: string; 大会名: string; 成績: string; 参加人数: string; タグ: string[];
  /** 画像の上の印に「非公開」の印（private）が付いている */
  非公開の印: boolean;
};

export class OthersListPage {
  constructor(readonly page: Page) {}

  /**
   * デッキ検索TOPの「その他」を押して、その他デッキ一覧を開く。その他デッキ一覧のページ取得の応答の状態を返す。
   * 応答が 404 でも画面は返るので、ここでは落とさない（応答の状態を確かめるケースがある）。
   */
  async 開く(top: DeckTopPage): Promise<number> {
    const res = this.page.waitForResponse((r) => r.request().isNavigationRequest() && /\/deck\/others\//.test(new URL(r.url()).pathname), { timeout: 60_000 });
    await top.その他の入口.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForURL(/\/deck\/others\//, { waitUntil: "load", timeout: 60_000 }), top.その他の入口.click()]);
    const status = (await res).status();
    await this.読み込みを待つ();
    return status;
  }

  /** アドレスを直に開く（手順の「アドレスの末尾に…を付けて開き直す」）。応答の状態を返す */
  async アドレスで開く(url: string): Promise<number> {
    const res = await this.page.goto(url, { waitUntil: "load", timeout: 60_000 });
    await this.読み込みを待つ();
    return res?.status() ?? 0;
  }

  /** 一覧の領域（デッキの行か、該当なしの案内のどちらか）が出るまで待つ */
  async 読み込みを待つ(): Promise<void> {
    await expect(this.page.locator(".deckSearch-searchResult__item").first(), "一覧の領域（デッキの行か、該当なしの案内）").toBeAttached({ timeout: 30_000 });
  }

  get 一覧の項目(): Locator { return this.page.locator(".contents .deckSearch-searchResult__item:not(.deckSearch-searchResult__item--empty)"); }
  get 該当なしの案内(): Locator { return this.page.locator(".deckSearch-searchResult__item--empty"); }

  /** 一覧に並ぶデッキ（上から順） */
  async 行(): Promise<一覧の行[]> {
    await this.読み込みを待つ();
    return this.一覧の項目.evaluateAll((lis) => lis.map((li) => {
      const t = (c: string) => (li.querySelector(c)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return {
        プレイヤー: t(".deckSearch-searchResult__item__playerName__td"),
        大会名: t(".deckSearch-searchResult__item__tournamentName__td"),
        成績: t(".deckSearch-searchResult__item__result__td"),
        参加人数: t(".deckSearch-searchResult__item__playerNumber__td"),
        タグ: Array.from(li.querySelectorAll(".deckSearch-searchResult__item__deckTag__link")).map((s) => (s.textContent ?? "").replace(/\s+/g, " ").trim()),
        非公開の印: !!li.querySelector(".deckSearch-searchResult__item__link.private"),
      };
    }));
  }

  /** 一覧に並ぶプレイヤー名（上から順） */
  async プレイヤー名(): Promise<string[]> { return (await this.行()).map((r) => r.プレイヤー); }

  /** 件数の表示領域（「検索結果 N 件」） */
  get 件数の表示領域(): Locator { return this.page.locator(".eventSearchResult__count__wrapper"); }
  /** 件数の表示領域に示された総件数（桁区切りを外した数字） */
  async 総件数(): Promise<string> {
    return ((await this.件数の表示領域.locator(".eventSearchResult__count__text span").first().textContent()) ?? "").replace(/[\s,]/g, "");
  }

  /** 一覧のページ送りの、ページ番号のリンク（上下に1つずつある。上の方） */
  ページ番号(n: number): Locator {
    return this.page.locator(`a.p-hareruya-pagination__link[data-page="${n}"]`).filter({ has: this.page.locator(".p-hareruya-pagination__number", { hasText: new RegExp(`^\\s*${n}\\s*$`) }) }).first();
  }

  /** ページ送りでページ番号を押し、デッキ検索結果へ移るのを待つ */
  async ページ番号を押す(n: number): Promise<void> {
    const link = this.ページ番号(n);
    await expect(link, `一覧のページ送りの「${n}」`).toBeVisible();
    await link.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForURL(/\/deck\/result\//, { waitUntil: "load", timeout: 60_000 }), link.click()]);
  }
}
