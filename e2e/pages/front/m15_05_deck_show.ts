/** 店頭のデッキリスト詳細（M15-05 の連携試験が見る）。セレクタはここだけに置く。 */
import { Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

/**
 * デッキIDを指定して、日本語表示のデッキリスト詳細を開く。応答のHTTPステータスを返す。
 * 店頭の画面のアドレスは表示言語（/ja/）から始まる。言語の無いアドレスは、デッキの有無に関わらずページが見つからない扱いになる。
 */
export async function デッキリスト詳細を開く(page: Page, デッキID: string): Promise<number> {
  const res = await page.goto(`${BASE_URL}/ja/deck/${デッキID}/show/`);
  await page.waitForLoadState("load");
  return res?.status() ?? 0;
}

/** 情報欄の見出し→内容（例: 「デッキ名」→「…」）。情報欄が無ければ空 */
export async function 情報欄(page: Page): Promise<Record<string, string>> {
  return page.locator(".deckSearch-deckList__information__flex__list").evaluateAll((uls) => {
    const out: Record<string, string> = {};
    for (const ul of uls) {
      const h = (ul.querySelector(".deckSearch-deckList__information__list__header")?.textContent ?? "").trim();
      const b = ((ul.querySelector(".deckSearch-deckList__information__list__body") as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();
      if (h) out[h] = b;
    }
    return out;
  });
}

// ---- 連携試験（136・138・140）: デッキ検索結果・その他デッキ一覧の一覧（どちらも同じ組み立て） ----

/** 一覧の1行の表示 */
export type 一覧の行 = { プレイヤー: string; 大会名: string; 成績: string; 参加人数: string; 開催日: string; アーキタイプ: string };

/** 一覧の領域（デッキの行か、該当なしの案内）が出るまで待ち、行を読む（上から順）。該当なしの案内の文も返す */
export async function 一覧を読む(page: Page): Promise<{ 行: 一覧の行[]; 該当なし: string }> {
  await page.locator(".deckSearch-searchResult__item").first().waitFor({ state: "attached", timeout: 30_000 });
  const 行 = await page.locator(".deckSearch-searchResult__item:not(.deckSearch-searchResult__item--empty)").evaluateAll((lis) => lis.map((li) => {
    const t = (c: string) => (li.querySelector(c)?.textContent ?? "").replace(/\s+/g, " ").trim();
    return {
      プレイヤー: t(".deckSearch-searchResult__item__playerName__td"),
      大会名: t(".deckSearch-searchResult__item__tournamentName__td"),
      成績: t(".deckSearch-searchResult__item__result__td"),
      参加人数: t(".deckSearch-searchResult__item__playerNumber__td"),
      開催日: t(".deckSearch-searchResult__item__tournamentDate__td"),
      アーキタイプ: t(".deckSearch-searchResult__item__deckName"),
    };
  }));
  const 該当なし = (await page.locator(".deckSearch-searchResult__item--empty").allTextContents()).join(" ").replace(/\s+/g, " ").trim();
  return { 行, 該当なし };
}

/** フォーマットの番号を入れたアドレスで、採用枚数ランキング（日本語表示）を開く。応答の状態を返す */
export async function 採用枚数ランキングを開く(page: Page, フォーマットID: string): Promise<number> {
  const res = await page.goto(`${BASE_URL}/ja/deck/${フォーマットID}/usage_ranking/`, { waitUntil: "load", timeout: 90_000 });
  return res?.status() ?? 0;
}
