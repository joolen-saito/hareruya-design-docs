/**
 * A05-03 の管理画面の操作: 店頭注文番号札管理（受注管理 › 店頭注文番号札）で、店舗を選んで番号札を登録する。セレクタはここだけに書く。
 * 画面の作り（新アプリのテンプレート）: 店名の選択を変えると、画面のスクリプトがフォームを一覧の画面へ送り直して読み込み直す。
 * 番号札の欄に入れて「登録」を押すと登録され、一覧の画面へ戻る。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 60_000;

export class WaitingTagPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }

  async 開く(): Promise<void> {
    const res = await this.page.goto(adminUrl("/order/waiting_tag"), { timeout: T });
    expect(res?.status(), "店頭注文番号札管理画面の応答").toBe(200);
    await this.page.waitForLoadState("load");
  }

  get 店名の選択() { return this.page.locator("#waiting_tag_BaseInfo"); }
  get 番号札の欄() { return this.page.locator("#waiting_tag_waiting_tag"); }
  get 登録ボタン() { return this.page.locator('button[type="submit"][form="add_new_waiting_tag"]'); }

  /** 検索店舗（店名）を選ぶ。選ぶと画面が読み込み直す */
  async 店舗を選ぶ(店名: string): Promise<void> {
    await expect(this.店名の選択, "店名の選択欄").toBeVisible();
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: T }).catch(() => undefined),
      this.店名の選択.selectOption({ label: 店名 }),
    ]);
    await this.page.waitForLoadState("load");
    const chosen = await this.店名の選択.evaluate((n) => (n as HTMLSelectElement).selectedOptions[0]?.textContent?.trim() ?? "");
    expect(chosen, "選ばれた店名").toBe(店名);
  }

  /** 番号札の欄に入れて「登録」を押し、画面が移るのを待つ */
  async 番号札を登録する(札: string): Promise<void> {
    await this.番号札の欄.fill(札);
    await expect(this.登録ボタン, "「登録」ボタン（店舗を編集できるメンバーのときだけ出る）").toBeVisible();
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: T }),
      this.登録ボタン.click(),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 一覧に出ている番号札 */
  async 一覧の番号札(): Promise<string[]> {
    return (await this.page.locator("table tbody tr td").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
}
