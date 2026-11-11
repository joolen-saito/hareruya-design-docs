/** M13-10 の連携ケースで見る、フロントのマイページ「マイイベント・デッキ登録」の一覧。セレクタはここだけに書く */
import { Page } from "@playwright/test";

const 整える = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();

export type 予約の一覧 = { 本文: string; イベントの件数: number; 開催日時: string };

/** いま開いているマイイベント・デッキ登録の一覧から、イベント名の大会の件数と、先頭の大会の開催日時の表示を読む */
export async function 予約の一覧を読む(page: Page, イベント名: string): Promise<予約の一覧> {
  const card = page.locator(".p-hareruya-deckentry-list__card").filter({ hasText: イベント名 });
  const n = await card.count();
  const 開催日時 = n ? 整える(await card.first().locator(".p-hareruya-deckentry-list__card-row").filter({ hasText: "開催" }).locator("dd").innerText().catch(() => "")) : "";
  return { 本文: 整える(await page.locator("main, body").first().innerText()), イベントの件数: n, 開催日時 };
}

/** 「2030/10/22 10:00」の表示を「2030年10月22日10時00分」の形に直す（形が違えばそのまま） */
export function 日時の文(表示: string): string {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{2})$/.exec(表示);
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日${m[4].padStart(2, "0")}時${m[5]}分` : 表示;
}
