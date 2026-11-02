/** M05-08 スタック用紙印刷（受注情報検索の一覧のボタン） */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class OrderListStackPrint {
  /** 画面に出たダイアログの文 */
  readonly dialogs: string[] = [];
  /** 押したあとに開いたウィンドウ（元の画面以外）の数の最大 */
  開いたウィンドウ = 0;

  constructor(private readonly page: Page) {
    page.on("dialog", (d) => { this.dialogs.push(d.message()); void d.accept(); });
    page.context().on("page", () => { this.開いたウィンドウ += 1; });
  }

  async openList(): Promise<void> {
    const res = await this.page.goto(adminUrl("/order"));
    await this.page.waitForLoadState("load");
    expect(res?.status() ?? 0, "受注一覧画面の応答").toBeLessThan(400);
  }

  /** 受注を選択せずに、スタック用紙印刷ボタンを押す */
  async スタック用紙印刷を押す(): Promise<void> {
    const button = this.page.locator("#printStack");
    await expect(button, "スタック用紙印刷ボタン").toBeVisible();
    await button.click();
    // ダイアログとウィンドウが出る・閉じるのを待つ
    await this.page.waitForTimeout(2_500);
  }

  /** 元の画面以外に、いま開いているウィンドウの数 */
  いま開いているほかのウィンドウ(): number {
    return this.page.context().pages().filter((p) => p !== this.page && !p.isClosed()).length;
  }
}
