/** F06-07 購入履歴詳細（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-07_test_cases.tsv */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class HistoryDetailPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }

  /** 購入履歴詳細のURLを開く。注文IDが undefined なら注文IDを付けない。応答の状態を返す */
  async 開く(注文ID?: string): Promise<number> {
    const url = `${BASE_URL}/ja/mypage/shopping_history_detail/${注文ID ?? ""}`;
    const res = await this.page.goto(url, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 購入履歴詳細の見出し（購入履歴詳細画面にだけある） */
  get 詳細の見出し(): Locator { return this.page.getByRole("heading", { name: "購入履歴詳細" }); }
}
