/** 店舗設定「カスタムCSV出力設定」画面（M10-13）の操作。セレクタはここだけに書く。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export class CustomCsvPage {
  readonly CSV選択: Locator;
  readonly 追加されたCSV選択: Locator;
  readonly 名前: Locator;
  readonly 出力しない項目: Locator;
  readonly 出力する項目: Locator;
  readonly 削除リンク: Locator;
  readonly 設定ボタン: Locator;

  constructor(readonly page: Page) {
    this.CSV選択 = page.locator("#csv-type");
    this.追加されたCSV選択 = page.locator('[name$="[csv_extensions]"]');
    this.名前 = page.locator('[name$="[name]"]');
    this.出力しない項目 = page.locator("#csv-not-output");
    this.出力する項目 = page.locator("#csv-output");
    this.削除リンク = page.locator('button[data-bs-target="#DeleteModal"]');
    this.設定ボタン = page.locator("#ex-conversion-action button[type=submit]");
  }

  async open(csvTypeId?: string, csvExtensionId?: string): Promise<void> {
    const path = `/setting/shop/custom_csv${csvTypeId ? `/${csvTypeId}${csvExtensionId ? `/${csvExtensionId}` : ""}` : ""}`;
    const res = await this.page.goto(adminUrl(path));
    expect(res?.status() ?? 0, "カスタムCSV出力設定画面の応答").toBeLessThan(400);
    await expect(this.CSV選択, "CSV選択の欄").toBeVisible({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }

  async 選択肢(l: Locator): Promise<string[]> {
    return (await l.locator("option").allInnerTexts()).map((t) => t.trim());
  }

  async 選択中の表示名(l: Locator): Promise<string> {
    return (await l.evaluate((n) => ((n as HTMLSelectElement).selectedOptions[0]?.textContent ?? "").trim(), undefined, { timeout: 20_000 }));
  }

  /** CSV選択で種別を選ぶ（選ぶと画面を開き直す） */
  async 種別を選ぶ(label: string): Promise<void> {
    if ((await this.選択中の表示名(this.CSV選択)) === label) return;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.CSV選択.selectOption({ label }, { timeout: 20_000 })]);
    await expect(this.CSV選択).toBeVisible();
  }

  /** 追加されたCSV選択で定義を選ぶ（選ぶと画面を開き直す） */
  async 定義を選ぶ(label: string): Promise<void> {
    if ((await this.選択中の表示名(this.追加されたCSV選択)) === label) return; // すでに選ばれていれば画面は開き直されない
    const option = label === "新規作成" ? { value: "" } : { label };
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.追加されたCSV選択.selectOption(option, { timeout: 20_000 })]);
    await expect(this.CSV選択).toBeVisible();
  }

  async 項目を出力へ移す(label: string): Promise<void> {
    await this.出力しない項目.selectOption({ label }, { timeout: 20_000 });
    await this.page.locator("#add").click({ timeout: 20_000 });
  }

  /** 設定ボタンで保存し、保存後のアドレス末尾の番号（カスタム定義ID）を返す */
  async 設定する(what: string): Promise<string> {
    await this.設定ボタン.click({ timeout: 20_000 });
    await this.page.waitForLoadState("load");
    await expectSaved(this.page, what);
    const m = /custom_csv\/\d+\/(\d+)/.exec(this.page.url());
    if (!m) throw new Error(`${what}: 保存後のアドレスからカスタム定義IDを読めない（${this.page.url()}）`);
    return m[1];
  }
}
