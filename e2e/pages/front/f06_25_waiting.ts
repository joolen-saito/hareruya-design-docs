/** F06-25 店頭モニター（番号札表示）の操作。アドレス・セレクタはここだけに書く。正本: cases/F06-25_test_cases.tsv */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class WaitingPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  /** 店頭モニターを開く。応答の状態を返す */
  async 開く(path: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${path}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  get 番号札の枠(): Locator { return this.page.locator("#numberOuter"); }
  get WiFi欄(): Locator { return this.page.locator("#wifi"); }
  async モニター画面である(): Promise<boolean> { return (await this.番号札の枠.count()) > 0; }
}
