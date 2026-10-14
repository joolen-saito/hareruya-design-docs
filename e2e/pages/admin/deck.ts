/** デッキ一覧・デッキ登録（メニュー「デッキ管理」→「デッキ一覧」） */
import { Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

export type DeckInput = {
  デッキ名: string; フォーマット: string;
  /** デッキを登録する日程。イベント検索でイベント名を検索し、その日程の行の「選択」を押す */
  イベント名: string; 日程ID: string;
  /** 「2026-11-01 10:00」の形。選ぶ行の開催日がこれと同じであることを確かめる */
  開催日: string;
};

/**
 * デッキ一覧の「新規登録」からデッキを登録し、振られたデッキIDを返す（登録後に遷移したデッキ編集画面のアドレスから読む）。
 * アーキタイプは登録済みの任意のもの（選択肢の先頭）。デッキタイプと公開状態は初期表示のまま。カード情報は空のまま。
 */
export async function registerDeck(page: Page, v: DeckInput): Promise<string> {
  await page.goto(adminUrl("/deck"));
  await page.getByRole("link", { name: "新規登録", exact: true }).click();
  await page.waitForURL(/\/deck\/new$/, { waitUntil: "load" });
  const f = (name: string) => page.locator(`[name="admin_deck[${name}]"]`);
  await f("deckName").fill(v.デッキ名);
  await chooseByLabel(f("Format"), v.フォーマット);
  const archetypes = (await f("Archetype").locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value))).filter(Boolean);
  if (archetypes.length === 0) throw new Error("アーキタイプが1件も登録されていない（デッキを登録できない）");
  await f("Archetype").selectOption(archetypes[0]);
  await page.locator('[data-bs-target="#searchEventModal"]').click();
  const modal = page.locator("#searchEventModal");
  await expect(modal).toBeVisible();
  await modal.locator("#event_search_word").fill(v.イベント名);
  await modal.locator("#btn_search_event").click();
  const 選択 = modal.locator(`button.select-event[data-id="${v.日程ID}"]`);
  await expect(選択, `イベント検索の結果に「${v.イベント名}」の日程 ${v.日程ID} の行が出ない`).toBeVisible({ timeout: 30_000 });
  expect(await 選択.getAttribute("data-date"), "選ぶ行の開催日").toBe(v.開催日.replace(/-/g, "/"));
  await 選択.click();
  await expect(f("eventDetailId"), "イベントを選ぶと、デッキに日程が設定される").toHaveValue(v.日程ID);
  // 「選択」を押すと検索の画面は閉じる
  await expect(modal).toBeHidden();
  await page.locator('button[type="submit"][form="admin_deck"]').click();
  await expectSaved(page, `デッキ「${v.デッキ名}」の登録`);
  const m = /\/deck\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`デッキ「${v.デッキ名}」を登録したが、デッキ編集画面へ遷移しない（${page.url()}）`);
  return m[1];
}
