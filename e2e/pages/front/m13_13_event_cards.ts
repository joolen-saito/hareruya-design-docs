/** 大会詳細検索（フロント）の検索結果のカードを読む（M13-13 の公開側の確かめに使う）。開く・検索するは pages/front/f07_02_event_search.ts */
import { Page } from "@playwright/test";

export type イベントカード = {
  イベント名: string;
  フォーマット: string[];
  /** 開催日時の機械向けの値（「2030-10-21T10:00」の形） */
  開催日時の値: string;
  /** 開催日時の表示（「2030年10月21日 10時〜」の形） */
  開催日時の表示: string;
  開催店舗: string;
};

/** 検索結果に並んだカード（上から） */
export async function 検索結果のカード(page: Page): Promise<イベントカード[]> {
  const out: イベントカード[] = [];
  for (const card of await page.locator(".p-hareruya-event-card__item").all()) {
    const t = async (sel: string) => ((await card.locator(sel).first().textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    out.push({
      イベント名: await t(".p-hareruya-event-card__title"),
      フォーマット: (await card.locator(".p-hareruya-event-label").allInnerTexts()).map((s) => s.trim()).filter(Boolean),
      開催日時の値: (await card.locator("time.p-hareruya-event-card__datetime").getAttribute("datetime")) ?? "",
      開催日時の表示: await t("time.p-hareruya-event-card__datetime"),
      開催店舗: (await card.locator(".p-hareruya-event-card__store").count()) ? await t(".p-hareruya-event-card__store") : "",
    });
  }
  return out;
}

/** 検索結果が無いときに出る文（無ければ ""） */
export async function 結果なしの文(page: Page): Promise<string> {
  const l = page.locator(".p-hareruya-event-list__result-none");
  if ((await l.count()) === 0) return "";
  return ((await l.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
}
