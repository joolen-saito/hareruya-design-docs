/** F06-12 ネット買取の一括買取確認（マイページ）の操作。アドレスはここだけに書く。正本: cases/F06-12_test_cases.tsv */
import { Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class NetBulkPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  /** 指定のアドレス（言語の部分を除く）を開く。応答の状態を返す */
  async 開く(path: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja${path}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
}
