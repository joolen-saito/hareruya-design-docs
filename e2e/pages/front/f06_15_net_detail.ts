/** F06-15 買取履歴詳細（フロントのマイページ）の操作。アドレスはここだけに書く。正本: cases/F06-15_test_cases.tsv */
import { Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class NetDetailPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  get path(): string { return new URL(this.page.url()).pathname; }
  /** 買取履歴詳細のアドレス（番号が undefined なら番号を付けない）を開く。応答の状態を返す */
  async 開く(番号?: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/mypage/purchase_history/net/${番号 ?? ""}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  async 詳細画面である(): Promise<boolean> { return (await this.page.getByRole("heading", { name: /買取履歴詳細/ }).count()) > 0; }
}
