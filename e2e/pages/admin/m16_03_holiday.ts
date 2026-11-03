/** M16-03 祝日追加・削除（メニュー「データ管理」→「祝日管理」） */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class HolidayPage {
  constructor(readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(adminUrl("/data/holiday"));
    await this.page.waitForLoadState("load");
    await expect(this.新規登録ボタン, "祝日追加・削除画面の新規登録ボタン").toBeVisible();
  }
  get 新規登録ボタン(): Locator { return this.page.locator("#holidayAddToggle"); }
  get 追加枠(): Locator { return this.page.locator("#holidayAddForm"); }
  get 名称欄(): Locator { return this.page.locator('#holidayAddForm input[name$="[name]"]'); }
  get 日付欄(): Locator { return this.page.locator('#holidayAddForm input[name$="[date]"]'); }
  get 追加ボタン(): Locator { return this.page.locator('#holidayAddForm button[type="submit"]'); }
  get 追加のトークン(): Locator { return this.page.locator('#holidayAddForm input[name$="[_token]"]'); }
  get 取得開始日(): Locator { return this.page.locator('form:has(input[name$="[start_date]"]) input[name$="[start_date]"]'); }
  get 取得終了日(): Locator { return this.page.locator('form:has(input[name$="[start_date]"]) input[name$="[end_date]"]'); }
  get 決定ボタン(): Locator { return this.page.locator('form:has(input[name$="[start_date]"]) button[type="submit"]'); }

  /** 新規登録の枠が開いているか（開くと、日付などの入力欄が見える） */
  async 追加枠が表示されている(): Promise<boolean> { return this.名称欄.isVisible(); }

  async 新規登録を押す(): Promise<void> {
    await this.新規登録ボタン.click({ timeout: 20_000 });
    await expect(this.名称欄, "新規登録の枠の名称欄").toBeVisible({ timeout: 15_000 });
  }
  /** 開いているとき、同じボタン（表示は「戻る」）を押して閉じる */
  async 戻るを押す(): Promise<void> {
    await this.新規登録ボタン.click({ timeout: 20_000 });
    await expect(this.名称欄, "新規登録の枠の名称欄").toBeHidden({ timeout: 15_000 });
  }

  /** 送信ボタンを押し、送信の応答（POST の状態）と、そのあと表示された画面のアドレスを返す。ブラウザの入力チェックが送信を止めたら sent=false */
  async 送信する(button: Locator): Promise<{ sent: boolean; status: number; path: string }> {
    const reqP = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/data\/holiday/.test(r.url()), { timeout: 8_000 }).then((r) => r, () => null);
    await button.click({ timeout: 20_000 });
    const res = await reqP;
    await this.page.waitForLoadState("load");
    return { sent: res !== null, status: res?.status() ?? 0, path: new URL(this.page.url()).pathname };
  }
  /** 開発者ツールで行うのと同じに、属性を消す・書き換える */
  async 属性を消す(欄: Locator, 属性: string): Promise<void> { await 欄.evaluate((e, a) => e.removeAttribute(a), 属性); }
  async 属性を書き換える(欄: Locator, 属性: string, 値: string): Promise<void> { await 欄.evaluate((e, [a, v]) => e.setAttribute(a, v), [属性, 値]); }
}
