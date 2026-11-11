/** M16-03 祝日追加・削除（メニュー「データ管理」→「祝日管理」） */
import { Dialog, Locator, Page, Response, expect } from "@playwright/test";
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

  // ---- 祝日一覧の行・削除（追加の部品。既存の操作は変えない） ----

  get 一覧の行(): Locator { return this.page.locator("table.holiday-table tbody tr"); }
  /** 日付（2040/04/15 の形）の行 */
  日付の行(日付: string): Locator { return this.一覧の行.filter({ hasText: 日付 }); }
  /** 祝日IDの行（削除リンクのリンク先に含まれる番号で探す） */
  番号の行(祝日ID: string): Locator { return this.一覧の行.filter({ has: this.page.locator(`a[href$="/holiday/${祝日ID}/delete"]`) }); }
  削除リンク(祝日ID: string): Locator { return this.page.locator(`a[href$="/holiday/${祝日ID}/delete"]`); }
  /** 行の削除リンクのリンク先に含まれる番号 */
  async 行の番号(行: Locator): Promise<string> {
    const href = (await 行.locator("a", { hasText: "削除" }).first().getAttribute("href")) ?? "";
    return /\/holiday\/(\d+)\/delete/.exec(href)?.[1] ?? "";
  }
  /** 一覧の全行の（名称, 日付）を上から順に */
  async 一覧の内容(): Promise<{ 名称: string; 日付: string }[]> {
    const rows = await this.一覧の行.all();
    const out: { 名称: string; 日付: string }[] = [];
    for (const r of rows) {
      const tds = r.locator("td");
      out.push({ 名称: ((await tds.nth(0).innerText()) ?? "").trim(), 日付: ((await tds.nth(1).innerText()) ?? "").trim() });
    }
    return out;
  }

  /** 削除リンクを押して、確認ダイアログ（ブラウザの確認）が出るまで待つ。答えるのは ダイアログに答える */
  async 削除を選ぶ(祝日ID: string): Promise<Dialog> {
    const dialogP = this.page.waitForEvent("dialog", { timeout: 20_000 });
    void this.削除リンク(祝日ID).click({ timeout: 20_000 }).catch(() => {});
    return dialogP;
  }
  /** OK（accept=true）またはキャンセルを押す。OK のときは、削除要求の応答を返す（キャンセルのときは null） */
  async ダイアログに答える(d: Dialog, ok: boolean): Promise<Response | null> {
    if (!ok) { await d.dismiss(); return null; }
    const resP = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/data\/holiday\/\d+\/delete/.test(r.url()), { timeout: 30_000 });
    await d.accept();
    const res = await resP;
    await this.page.waitForLoadState("load");
    return res;
  }
  /** 開発者ツールで行うのと同じに、削除リンクのなりすまし対策トークンを書き換える */
  async 削除要求のトークンを書き換える(祝日ID: string, 値: string): Promise<void> {
    await this.削除リンク(祝日ID).evaluate((e, v) => e.setAttribute("token-for-anchor", v), 値);
  }

  /** 画面上部のメッセージ（帯）の文。開発用の設定の赤い帯は除く */
  async 画面上部のメッセージ(): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.page.locator(".alert").all()) {
      if (!(await e.isVisible())) continue;
      const t = (await e.innerText()).replace(/\s+/g, " ").trim();
      if (t && !t.includes("デバッグモードが有効になっています")) out.push(t);
    }
    return out;
  }
  /** 期間指定の入力（開始日・終了日）をして決定を押す。要求が送られた結果を返す */
  async 期間を指定して決定する(開始: string, 終了: string): Promise<{ sent: boolean; status: number; path: string }> {
    await this.取得開始日.fill(開始);
    await this.取得終了日.fill(終了);
    return this.送信する(this.決定ボタン);
  }
}
