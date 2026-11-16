/**
 * M13-04 の公開側・申込登録の確かめに使う部品（大会詳細検索の「検索」、検索結果のカードから大会詳細を開く、大会詳細の項目を読む、
 * イベント申込登録(検索入力)の結果表の日程の開始時間を読む）。
 * 押して画面が移る操作は pages/front/nav_click.ts の 押して移るのを待つ を使う（click は noWaitAfter、移るのは waitForNavigation で待つ）。
 */
import { Locator, Page, Response } from "@playwright/test";
import { EventSearchPage } from "./f07_02_event_search";
import { 押して移るのを待つ } from "./nav_click";

/** 詳細検索モーダルの「検索」を押し、結果の画面へ移るのを待つ。移った先の応答を返す */
export async function 大会詳細検索の検索を押す(s: EventSearchPage): Promise<Response | null> {
  return 押して移るのを待つ(s.page, s.モーダル.locator("[data-search-submit]"));
}

/** 検索結果のカードのうち、イベント名が一致するもの（カード全体が大会詳細画面へのリンク） */
export function イベント名のカード(page: Page, イベント名: string): Locator {
  return page.locator("a.p-hareruya-event-card__link").filter({ has: page.locator(".p-hareruya-event-card__title", { hasText: イベント名 }) });
}

/** カードを押して大会詳細画面へ移る。移った先の応答を返す */
export async function カードを押して大会詳細を開く(page: Page, イベント名: string): Promise<Response | null> {
  return 押して移るのを待つ(page, イベント名のカード(page, イベント名).first());
}

/** 大会詳細画面の基本情報の項目（「開催日時」「定員」「参加費」など）の表示の文字。無ければ "" */
export async function 大会詳細の項目(page: Page, 見出し: string): Promise<string> {
  const row = page.locator(".p-hareruya-event-detail__info").first().locator(".p-hareruya-event-detail__info-row")
    .filter({ has: page.locator(".p-hareruya-event-detail__info-label", { hasText: new RegExp(`^\\s*${見出し}\\s*$`) }) });
  if ((await row.count()) === 0) return "";
  return ((await row.first().locator(".p-hareruya-event-detail__info-value").innerText()) ?? "").replace(/\s+/g, " ").trim();
}

/** 大会詳細画面の開催日時の機械向けの値（time の datetime。「2030-10-15T10:00」の形）。無ければ "" */
export async function 大会詳細の開催日時の値(page: Page): Promise<string> {
  const row = page.locator(".p-hareruya-event-detail__info").first().locator(".p-hareruya-event-detail__info-row")
    .filter({ has: page.locator(".p-hareruya-event-detail__info-label", { hasText: /^\s*開催日時\s*$/ }) });
  if ((await row.count()) === 0) return "";
  return (await row.first().locator("time").first().getAttribute("datetime")) ?? "";
}

/** イベント申込登録(検索入力)の「検索する」を押し、結果の画面へ移るのを待つ */
export async function 申込登録の検索を押す(page: Page): Promise<Response | null> {
  return 押して移るのを待つ(page, page.locator("#search_form button[type='submit']"));
}

export type 申込登録の結果のイベント = { イベントID: string; 日程の開始時間: string[] };

/**
 * イベント申込登録(検索入力)の結果表を、イベントの束ごとに読む（イベントIDの欄は rowspan で束ねた日程の行数にまたがる）。
 * 日程の開始時間は、各行の「日程」の欄（rowspan の無い欄の先頭）の表示（「2026/11/02 10:00」の形。日程が無ければ「-」）。
 */
export async function 申込登録の結果を読む(page: Page): Promise<申込登録の結果のイベント[]> {
  return page.locator("table.table tbody tr").evaluateAll((trs) => {
    const out: { イベントID: string; 日程の開始時間: string[] }[] = [];
    for (const tr of trs) {
      const idCell = tr.querySelector("td[rowspan]");
      if (idCell) out.push({ イベントID: (idCell.textContent ?? "").trim(), 日程の開始時間: [] });
      const cell = Array.from(tr.querySelectorAll("td")).find((td) => !td.hasAttribute("rowspan"));
      if (out.length && cell) out[out.length - 1].日程の開始時間.push((cell.textContent ?? "").replace(/\s+/g, " ").trim());
    }
    return out;
  });
}
