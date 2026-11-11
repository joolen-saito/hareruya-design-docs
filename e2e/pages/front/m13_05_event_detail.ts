/** 大会詳細検索（フロント）の結果のカードから大会詳細画面を開き、イベント名・ルール適用度・フォーマットを読む（M13-05 の公開側の確かめ） */
import { Page } from "@playwright/test";

/** 検索結果のカードのうち、イベント名が一致するもののリンク（カード全体が大会詳細画面へのリンク）を押す */
export async function カードから大会詳細を開く(page: Page, イベント名: string): Promise<void> {
  const card = page.locator("a.p-hareruya-event-card__link").filter({ has: page.locator(".p-hareruya-event-card__title", { hasText: イベント名 }) }).first();
  await Promise.all([page.waitForURL(/\/events\/\d+\/detail/, { waitUntil: "load" }), card.click({ timeout: 20_000 })]);
}

export type 大会詳細 = { イベント名: string; ルール適用度: string; フォーマット: string };

export async function 大会詳細を読む(page: Page): Promise<大会詳細> {
  const t = async (sel: string) => ((await page.locator(sel).first().textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
  const row = page.locator(".p-hareruya-event-detail__info-row").filter({ has: page.locator(".p-hareruya-event-detail__info-label", { hasText: /^\s*フォーマット\s*$/ }) });
  return {
    イベント名: await t(".p-hareruya-event-detail h1"),
    ルール適用度: await t(".p-hareruya-event-detail__tag-text"),
    フォーマット: (await row.count()) ? ((await row.locator(".p-hareruya-event-detail__info-value").first().textContent()) ?? "").replace(/\s+/g, " ").trim() : "",
  };
}
