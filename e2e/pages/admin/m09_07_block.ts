/** M09-07 ブロック管理（一覧・登録・編集・削除）の画面操作。セレクタはここにだけ書く */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type ブロックの値 = { ブロック名?: string; ファイル名?: string; コード?: string };

export class ブロック管理 {
  constructor(readonly page: Page) {}

  // ---- 一覧 ----
  async 一覧を開く(): Promise<void> {
    await this.page.goto(adminUrl("/content/block"), { waitUntil: "load" });
    await expect(this.page.locator("#search-block"), "ブロック管理(一覧)の検索ボックス").toBeVisible({ timeout: 30_000 });
  }
  get 検索ボックス(): Locator { return this.page.locator("#search-block"); }
  async 検索する(text: string): Promise<void> { await this.検索ボックス.fill(text, { timeout: 30_000 }); }
  get 全行(): Locator { return this.page.locator("li.list-group-item[id^='ex-block-']"); }
  get 見えている行(): Locator { return this.page.locator("li.list-group-item[id^='ex-block-']:visible"); }
  行(ID: string): Locator { return this.page.locator(`#ex-block-${ID}`); }
  名前リンク(ID: string): Locator { return this.行(ID).locator("a[href$='/edit']").first(); }
  編集リンク(ID: string): Locator { return this.行(ID).locator("a.btn-ec-actionIcon[href$='/edit']"); }
  削除ボタン(ID: string): Locator { return this.行(ID).locator(`a[data-bs-target='#confirmModal-${ID}']`); }
  モーダル(ID: string): Locator { return this.page.locator(`#confirmModal-${ID}`); }
  async 新規作成を押す(): Promise<void> {
    await this.page.getByRole("link", { name: "新規作成" }).click({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }
  async 削除確認を開く(ID: string): Promise<void> {
    await this.削除ボタン(ID).click({ timeout: 30_000 });
    await expect(this.モーダル(ID), "削除確認モーダル").toBeVisible({ timeout: 30_000 });
  }
  async モーダルで削除する(ID: string): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => r.request().method() === "POST" && /\/content\/block\/\d+\/delete/.test(r.url()), { timeout: 60_000 }),
      this.モーダル(ID).getByRole("link", { name: "削除" }).click({ timeout: 30_000 }),
    ]);
    await expect(this.page.locator(".alert").filter({ hasNotText: "デバッグモード" }).first(), "削除のあとのブロック管理(一覧)の帯").toBeVisible({ timeout: 60_000 });
  }
  /** 削除確認モーダルの削除ボタンを押し、削除の送信の応答と、そのあとの画面の読み込みまで待つ（帯の表示は待たない。削除できなかったときも使う） */
  async モーダルで削除を押す(ID: string): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => r.request().method() === "POST" && /\/content\/block\/\d+\/delete/.test(r.url()), { timeout: 60_000 }),
      this.モーダル(ID).getByRole("link", { name: "削除" }).click({ timeout: 30_000 }),
    ]);
    await this.page.waitForLoadState("load");
  }
  /** アドレスでブロック管理(編集)画面を開き、応答の状態コードを返す（エディタの読み込みは待たない） */
  async 編集をアドレスで開く(ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/content/block/${ID}/edit`), { waitUntil: "load" });
    return res?.status() ?? 0;
  }
  async モーダルでキャンセルする(ID: string): Promise<void> {
    await this.モーダル(ID).getByRole("button", { name: "キャンセル" }).click({ timeout: 30_000 });
    await expect(this.モーダル(ID), "削除確認モーダルが閉じた").toBeHidden({ timeout: 30_000 });
  }

  // ---- 登録・編集 ----
  async エディタを待つ(): Promise<void> {
    await this.page.waitForFunction(() => typeof (window as unknown as { editor?: { getValue(): string } }).editor?.getValue === "function", undefined, { timeout: 60_000 });
  }
  async 新規画面を開く(言語: "ja" | "en" = "ja"): Promise<void> {
    await this.page.goto(adminUrl(`/content/block/new?locale=${言語}`), { waitUntil: "load" });
    await this.エディタを待つ();
  }
  async 編集を開く(ID: string, 言語?: "ja" | "en"): Promise<void> {
    const res = await this.page.goto(adminUrl(`/content/block/${ID}/edit${言語 ? `?locale=${言語}` : ""}`), { waitUntil: "load" });
    if (res && res.status() < 400) await this.エディタを待つ();
  }
  async 言語を選ぶ(言語: "日本語" | "英語"): Promise<void> {
    const ja = 言語 === "日本語";
    const already = await this.page.locator(ja ? "#locale-ja" : "#locale-en").isChecked();
    await this.page.locator(ja ? "label[for='locale-ja']" : "label[for='locale-en']").click({ timeout: 30_000 });
    if (already) return;
    await this.page.waitForURL(new RegExp(`locale=${ja ? "ja" : "en"}`), { timeout: 30_000 });
    await this.page.waitForLoadState("load");
    await this.エディタを待つ();
  }
  async コードを読む(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as { editor: { getValue(): string } }).editor.getValue());
  }
  async コードを入れる(code: string): Promise<void> {
    await this.page.evaluate((c) => (window as unknown as { editor: { setValue(v: string): void } }).editor.setValue(c), code);
  }
  async 入力する(v: ブロックの値): Promise<void> {
    if (v.ブロック名 !== undefined) await this.page.locator("#block_name").fill(v.ブロック名, { timeout: 30_000 });
    if (v.ファイル名 !== undefined) await this.page.locator("#block_file_name").fill(v.ファイル名, { timeout: 30_000 });
    if (v.コード !== undefined) await this.コードを入れる(v.コード);
  }
  async 登録して結果を読む(): Promise<{ 成功: boolean; 入力エラー: string[]; システムエラー: boolean }> {
    const p = this.page;
    await p.locator("button.btn-ec-conversion[type=submit]").click({ timeout: 30_000 });
    await p.waitForLoadState("load");
    const ok = p.locator(".alert-success");
    const ng = p.locator(".alert-danger, .invalid-feedback, .form-error-message");
    const sys = p.getByText("システムエラーが発生しました");
    // 登録はテンプレートの保存・ファイル置き場への送信を含み、手元の環境では1分を超えることがある
    await expect(ok.or(ng).or(sys).first(), "登録の結果が表示されない").toBeVisible({ timeout: 240_000 });
    const texts = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return { 成功: (await ok.count()) > 0 && (await ok.first().isVisible()), 入力エラー: await texts(ng), システムエラー: await sys.first().isVisible().catch(() => false) };
  }
  ブロックIDを読む(): string {
    const m = /\/content\/block\/(\d+)\/edit/.exec(this.page.url());
    if (!m) throw new Error(`ブロック管理(編集)画面に遷移していない（${this.page.url()}）`);
    return m[1];
  }
  async 作る(v: ブロックの値 & { 言語?: "ja" | "en" }): Promise<string> {
    await this.新規画面を開く(v.言語 ?? "ja");
    await this.入力する(v);
    const r = await this.登録して結果を読む();
    if (!r.成功) throw new Error(`ブロック「${v.ブロック名}」を登録できない: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`);
    return this.ブロックIDを読む();
  }
  get ファイル名欄(): Locator { return this.page.locator("#block_file_name"); }
  get ファイル名の右横(): Locator { return this.page.locator("#blockEdit .row.align-items-center .col-auto.ps-0, #blockEdit span.col-auto.ps-0").first(); }
  get 設定の開閉ボタン(): Locator { return this.page.locator("a[data-bs-toggle='collapse'][href='#blockEdit']"); }
  get 設定欄(): Locator { return this.page.locator("#blockEdit"); }
  get 一覧へのリンク(): Locator { return this.page.locator(".c-conversionArea a.c-baseLink"); }
}
