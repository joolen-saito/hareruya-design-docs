/**
 * F06-17 の連携ケースが使う、管理画面のイベント申込一覧の「デッキ表示」と、別に開くデッキ表示画面（印刷用のデッキリスト）。
 * 画面の作り（アプリの Twig: admin/Event/Entry/index.twig・decklist.twig）:
 * - 「デッキ表示」ボタン（#decklist）は、いまの検索条件のデッキを別の窓（window.open）に開く。
 * - デッキ表示画面は、ページごとに Name・Event（イベント名(英)）・Date（開催日 年/月/日）と、メインボード（見出し「メインボード(枚数)」、
 *   カードの種類ごとのまとまり）・サイドボード（見出し「サイドボード(枚数)」）のカードの行（枚数・カード名(日)・「カード名(英)」）を出す。
 * 検索条件の入力・検索結果の行は M13-06 の部品（m13_06_entry_list.ts）を使う。
 */
import { Locator, Page } from "@playwright/test";

const 文 = (s: string) => s.replace(/\s+/g, " ").trim();

export type デッキ表示の行 = { 枚数: string; 名日: string; 名英: string };
export type デッキ表示 = {
  Name: string; Event: string; Date: string;
  メイン見出し: string; メインの行: デッキ表示の行[];
  サイド見出し: string; サイドの行: デッキ表示の行[];
};

/** イベント申込一覧の検索結果の上にある「デッキ表示」ボタン */
export function デッキ表示ボタン(page: Page): Locator { return page.locator("button#decklist"); }

/** 「デッキ表示」を押し、別に開いたデッキ表示画面を返す */
export async function デッキ表示を開く(page: Page): Promise<Page> {
  const popup = page.context().waitForEvent("page", { timeout: 30_000 });
  await デッキ表示ボタン(page).click();
  const p = await popup;
  await p.waitForLoadState("load");
  return p;
}

/** デッキ表示画面の先頭のページを読む */
export async function デッキ表示を読む(p: Page): Promise<デッキ表示> {
  const w = p.locator(".wrapper").first();
  const 行 = async (sec: Locator): Promise<デッキ表示の行[]> => sec.locator("li.decklist-type__row").evaluateAll((rs) => rs.map((r) => ({
    枚数: (r.querySelector(".decklist-type__count")?.textContent ?? "").trim(),
    名日: (r.querySelector(".decklist-type__name-jp")?.textContent ?? "").trim(),
    名英: ((r.querySelector(".decklist-type__name-en")?.textContent ?? "").replace(/^「/, "")).trim(),
  })));
  const サイド = w.locator(".decklist-type").filter({ has: p.locator(".decklist-type__title", { hasText: /^\s*サイドボード/ }) });
  const メインのまとまり = w.locator(".decklist-mainboard .decklist-type").filter({ hasNot: p.locator(".decklist-type__title", { hasText: /^\s*サイドボード/ }) });
  const メインの行: デッキ表示の行[] = [];
  for (const s of await メインのまとまり.all()) メインの行.push(...(await 行(s)));
  return {
    Name: 文(await w.locator(".decklist-header__name-value").innerText()),
    Event: 文(await w.locator(".decklist-meta__item").filter({ hasText: /^\s*Event:/ }).locator(".decklist-meta__value").innerText()),
    Date: 文(await w.locator(".decklist-meta__item").filter({ hasText: /^\s*Date:/ }).locator(".decklist-meta__value").innerText()),
    メイン見出し: 文(await w.locator(".decklist-mainboard__title").first().innerText()),
    メインの行,
    サイド見出し: (await サイド.count()) ? 文(await サイド.locator(".decklist-type__title").innerText()) : "",
    サイドの行: (await サイド.count()) ? await 行(サイド) : [],
  };
}
