/** 公開側のイベント詳細画面（日程ごと） */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class FrontEventDetail {
  constructor(readonly page: Page) {}
  /** フリー入力エリア n の見出し（押すと内容が開閉する） */
  フリー入力エリアの見出し(n: 1 | 2 | 3): Locator { return this.page.locator(`#event-free-area-trigger-${n}`); }
  /** フリー入力エリア n の内容 */
  フリー入力エリアの内容(n: 1 | 2 | 3): Locator { return this.page.locator(`#event-free-area-panel-${n}`); }
}

export async function openFrontEventDetail(page: Page, 日程ID: string): Promise<FrontEventDetail> {
  // 公開側のアドレスは言語の接頭辞つき（日本語は /ja）
  const res = await page.goto(`${BASE_URL}/ja/events/${日程ID}/detail`);
  if (!res || res.status() >= 400) throw new Error(`公開側のイベント詳細画面（日程ID ${日程ID}）を開けない（応答 ${res?.status()}）`);
  return new FrontEventDetail(page);
}
