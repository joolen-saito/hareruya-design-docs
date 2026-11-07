/** F06-16 の続き（-b）で足す、大会デッキ登録編集画面のマイデッキ取得ポップアップの操作。セレクタはここだけ */
import { Locator } from "@playwright/test";
import { DeckEditPage } from "./f06_16_deck_entry";

/** ポップアップに、いま表示されているマイデッキの行（ページ送りで隠れているものは含まない） */
export function 表示中のマイデッキ(e: DeckEditPage): Locator {
  return e.page.locator("#deckentry-mydeck .p-hareruya-deckentry-edit__mydeck-item:not([hidden])");
}
export async function 表示中のマイデッキ名(e: DeckEditPage): Promise<string[]> {
  return (await 表示中のマイデッキ(e).locator(".p-hareruya-deckentry-edit__mydeck-item-name").allInnerTexts()).map((t) => t.trim());
}
/** ポップアップのページ送りで、n ページ目を選ぶ */
export async function マイデッキのページを選ぶ(e: DeckEditPage, n: number): Promise<void> {
  const b = e.page.locator(`#deckentry-mydeck button[name="pagination_button"][data-page="${n}"]:not([disabled])`).first();
  await b.click({ timeout: 30_000 });
}
/** ポップアップの行の表示内容（フォーマット・デッキ名・プレイヤー・作成日・更新日） */
export async function マイデッキの表示(row: Locator): Promise<{ フォーマット: string; デッキ名: string }> {
  return {
    フォーマット: ((await row.locator(".p-hareruya-deckentry-edit__mydeck-tag").first().innerText().catch(() => "")) ?? "").trim(),
    デッキ名: ((await row.locator(".p-hareruya-deckentry-edit__mydeck-item-name").innerText()) ?? "").trim(),
  };
}
