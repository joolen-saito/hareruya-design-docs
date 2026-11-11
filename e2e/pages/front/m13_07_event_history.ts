/**
 * M13-07（IT-M13-07-014）が読む、フロントのマイページ「マイイベント・デッキ登録」の一覧のカード。セレクタはここだけに書く。
 * ログインと画面を開く操作は F06-14 の部品（pages/front/f06_14_event_history.ts の EventHistoryPage）を使い、変えない。
 */
import { Locator, Page } from "@playwright/test";

const 整える = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();

/** 一覧のうち、イベント名を含むカード */
export function イベントのカード(page: Page, イベント名: string): Locator {
  return page.locator(".p-hareruya-deckentry-list__card").filter({ hasText: イベント名 });
}

/** カードの「開催」の行の値（「2030/10/23 10:00」の形のまま） */
export async function カードの開催日時(card: Locator): Promise<string> {
  return 整える(await card.first().locator(".p-hareruya-deckentry-list__card-row").filter({ hasText: "開催" }).locator("dd").innerText().catch(() => ""));
}

/** 画面の本文（見えている文字） */
export async function 画面の本文(page: Page): Promise<string> {
  return 整える(await page.locator("main, body").first().innerText());
}
