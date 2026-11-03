/** F06-10 ポイント履歴（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-10_test_cases.tsv */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class PointHistoryPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  get path(): string { return new URL(this.page.url()).pathname; }

  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/point_history`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ポイント履歴画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-history-list--point").count()) > 0; }
  /** 履歴の行（1件1枠） */
  get 履歴の行(): Locator { return this.page.locator(".p-hareruya-history-list__list--point .p-hareruya-history-list__box"); }
  /** 一覧上部のポイント情報の文（現在のポイント・次に消失するポイント） */
  async 一覧上部の文(): Promise<string> {
    const c = this.page.locator(".p-hareruya-history-list__point-info");
    return (await c.count()) === 0 ? "" : ((await c.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 一覧上部に「次に消失するポイント」の行があるか（ポイント情報の段落が2つ目以降にあるか） */
  async 次に消失するポイントの行数(): Promise<number> {
    return this.page.locator(".p-hareruya-history-list__point-info p").count();
  }
}
