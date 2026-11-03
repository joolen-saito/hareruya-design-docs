/** F06-27 パスワード設定（ポリシー違反用）画面の操作。アドレス・セレクタはここだけに書く。正本: cases/F06-27_test_cases.tsv */
import { Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class PolicyPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  get path(): string { return new URL(this.page.url()).pathname; }
  /** パスワード設定（ポリシー違反用）画面のアドレスを直接開く */
  async 直接開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/password_change`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** パスワード設定（ポリシー違反用）画面が表示されているか（新しいパスワードの入力欄がある） */
  async 設定画面である(): Promise<boolean> {
    return (await this.page.locator('form input[type="password"]').count()) > 0 && /password_change/.test(this.path);
  }
}
