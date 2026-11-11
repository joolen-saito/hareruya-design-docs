/**
 * M14-10 フォーマットの設定が公開側に効くことを確かめるための、公開側の小さな読み取り（セレクタはここだけ）。
 * 画面ごとの部品（デッキ検索TOP・イベント詳細検索・デッキリスト詳細）は各機能の部品を使い、ここには足りない読み取りだけを置く。
 *
 * 画面の作り（アプリの Twig で確かめたもの）:
 * - デッキ検索TOP（Deck/index.twig）: ランキング表示のフォーマットは「<名前>メタゲーム」の区画（採用デッキ数の多いアーキタイプの一覧と、
 *   見出し・「もっと見る」のメタゲームへのリンク）。メタ分布簡易化のフォーマットは、その他フォーマットの案内の「<名前>メタゲーム」のリンク。
 *   メタ分布（メタゲーム一覧）へのリンクの行き先は /deck/<フォーマットID>/metagame/。
 * - イベント詳細検索のモーダル（Block/event_detailed_search_modal.twig）: フォーマットはチェック（id「event-search-format-<ID>」）で、
 *   「イベントに表示」のフォーマットだけが並ぶ。結果のイベントの枠（Event/_search_event_card.twig）は、イベント名と、イベントに表示の
 *   フォーマットの名前の札を出す。
 * - デッキリスト詳細の「日本語テキスト」は、画面のスクリプトがテキストの書き出しへ要求を送り、返った本文をクリップボードに入れる。
 */
import { expect, Locator, Page } from "@playwright/test";

const 文 = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();

/** デッキ検索TOPの、フォーマットIDのメタ分布（メタゲーム一覧）へのリンク */
export function メタ分布へのリンク(page: Page, フォーマットID: string): Locator {
  return page.locator(`a[href*="/deck/${フォーマットID}/metagame"]`);
}

/** イベント詳細検索のモーダルの、フォーマットのチェックの表示名（上から順） */
export async function イベント検索のフォーマットの選択肢(page: Page): Promise<string[]> {
  return (await page.locator('[data-modal="event-search"] .p-hareruya-search-form__event-format label.p-hareruya-search-form__checkbox').allInnerTexts()).map(文).filter(Boolean);
}

/** イベント詳細検索のモーダルで、フォーマットIDのチェックを入れる */
export async function イベント検索でフォーマットを選ぶ(page: Page, フォーマットID: string): Promise<void> {
  const box = page.locator(`[data-modal="event-search"] #event-search-format-${フォーマットID}`);
  await expect(box, `フォーマットID ${フォーマットID} のチェック`).toHaveCount(1);
  if (!(await box.isChecked())) await page.locator(`[data-modal="event-search"] label[for="event-search-format-${フォーマットID}"]`).click();
  await expect(box, `フォーマットID ${フォーマットID} のチェックが入る`).toBeChecked();
}

/** イベント一覧（検索結果）のイベントの枠: イベント名と、フォーマットの札（上から順） */
export async function イベントの枠(page: Page): Promise<{ イベント名: string; フォーマット: string[] }[]> {
  return page.locator(".p-hareruya-event-card__item").evaluateAll((lis) => lis.map((li) => ({
    イベント名: (li.querySelector(".p-hareruya-event-card__title")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    フォーマット: Array.from(li.querySelectorAll(".p-hareruya-event-label")).map((s) => (s.textContent ?? "").replace(/\s+/g, " ").trim()),
  })));
}

/** 商品詳細画面のカード情報の「使用可能フォーマット」の名前（表示の並び。カンマ区切りを分ける）。欄が無ければ null */
export async function 使用可能フォーマット(page: Page): Promise<string[] | null> {
  const dd = page.locator("dt").filter({ hasText: /^\s*使用可能フォーマット\s*$/ }).first().locator("xpath=following-sibling::dd[1]");
  if ((await dd.count()) === 0) return null;
  return 文(await dd.textContent()).split(",").map((s) => s.trim()).filter(Boolean);
}

/** デッキリスト詳細の「日本語テキスト」を押し、書き出しの要求の応答の本文を返す */
export async function 日本語テキストを受け取る(page: Page): Promise<{ 状態: number; 本文: string }> {
  const link = page.locator("a.deckSearch-deckList__export__button").filter({ hasText: /^\s*日本語テキスト\s*$/ }).filter({ visible: true }).first();
  await expect(link, "「日本語テキスト」の入口が表示されている").toBeVisible();
  const resP = page.waitForResponse((r) => /\/deck\/arena\/[^/]*$/.test(new URL(r.url()).pathname), { timeout: 30_000 });
  await link.click();
  const res = await resP;
  const raw = await res.text();
  // 本文が JSON なら、文字の逃がし（\uXXXX）を戻した形で返す
  let 本文 = raw;
  try { const j = JSON.parse(raw) as unknown; 本文 = typeof j === "string" ? j : JSON.stringify(j); } catch { /* JSON でなければそのまま */ }
  return { 状態: res.status(), 本文 };
}
