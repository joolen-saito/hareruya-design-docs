/** M09-04 ページ管理（一覧・登録・編集・削除）の画面操作。セレクタはここにだけ書く */
import { Locator, Page, expect, test } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type ページの値 = {
  ページ名?: string; URL?: string; ファイル名?: string; コード?: string;
  PC?: string | null; モバイル?: string | null;
  author?: string; description?: string; keyword?: string; robot?: string; metatag?: string;
};

export class ページ管理 {
  constructor(readonly page: Page) {}

  // ---- 一覧 ----
  async 一覧を開く(): Promise<void> {
    await this.page.goto(adminUrl("/content/page"), { waitUntil: "load" });
    await expect(this.page.locator("#search-page"), "ページ管理(一覧)の検索ボックス").toBeVisible({ timeout: 30_000 });
  }
  get 検索ボックス(): Locator { return this.page.locator("#search-page"); }
  async 検索する(text: string): Promise<void> {
    await this.検索ボックス.fill(text, { timeout: 30_000 });
  }
  /** 一覧に見えている行（検索で隠れた行を除く） */
  get 見えている行(): Locator { return this.page.locator("table.table tr[id^='ex-page-']:visible"); }
  行(ページID: string): Locator { return this.page.locator(`#ex-page-${ページID}`); }
  async 新規作成を押す(): Promise<void> {
    await this.page.getByRole("link", { name: "新規作成" }).click({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }
  async 行の削除を押す(ページID: string): Promise<void> {
    await this.行(ページID).locator("a[data-bs-target^='#delete_']").click({ timeout: 30_000 });
    await expect(this.page.locator(`#delete_${ページID}`), "削除の確認モーダル").toBeVisible({ timeout: 30_000 });
  }
  モーダル(ページID: string): Locator { return this.page.locator(`#delete_${ページID}`); }
  async モーダルで削除する(ページID: string): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => r.request().method() === "POST" && /\/content\/page\/\d+\/delete/.test(r.url()), { timeout: 60_000 }),
      this.モーダル(ページID).getByRole("link", { name: "削除" }).click({ timeout: 30_000 }),
    ]);
    await expect(this.page.locator(".alert").filter({ hasNotText: "デバッグモード" }).first(), "削除のあとのページ管理(一覧)の帯").toBeVisible({ timeout: 60_000 });
  }
  async モーダルでキャンセルする(ページID: string): Promise<void> {
    await this.モーダル(ページID).getByRole("button", { name: "キャンセル" }).click({ timeout: 30_000 });
    await expect(this.モーダル(ページID), "削除の確認モーダルが閉じた").toBeHidden({ timeout: 30_000 });
  }

  // ---- 登録・編集 ----
  async 新規画面を開く(言語: "ja" | "en" = "ja"): Promise<void> {
    await this.page.goto(adminUrl(`/content/page/new?locale=${言語}`), { waitUntil: "load" });
    await this.エディタを待つ();
  }
  async 編集を開く(ページID: string, 言語?: "ja" | "en"): Promise<void> {
    const res = await this.page.goto(adminUrl(`/content/page/${ページID}/edit${言語 ? `?locale=${言語}` : ""}`), { waitUntil: "load" });
    if (res && res.status() < 400) await this.エディタを待つ();
  }
  async エディタを待つ(): Promise<void> {
    await this.page.waitForFunction(() => typeof (window as unknown as { editor?: { getValue(): string } }).editor?.getValue === "function", undefined, { timeout: 60_000 });
  }
  async 言語を選ぶ(言語: "日本語" | "英語"): Promise<void> {
    const ja = 言語 === "日本語";
    const already = await this.page.locator(ja ? "#locale-ja" : "#locale-en").isChecked();
    await this.page.locator(ja ? "label[for='locale-ja']" : "label[for='locale-en']").click({ timeout: 30_000 });
    if (already) return; // すでにその言語。画面は切り替わらない
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
  async 入力する(v: ページの値): Promise<void> {
    const p = this.page;
    const f = (id: string) => p.locator(`#main_edit_${id}`);
    if (v.ページ名 !== undefined) await f("name").fill(v.ページ名, { timeout: 30_000 });
    if (v.URL !== undefined) await f("url").fill(v.URL, { timeout: 30_000 });
    if (v.ファイル名 !== undefined) await f("file_name").fill(v.ファイル名, { timeout: 30_000 });
    if (v.コード !== undefined) await this.コードを入れる(v.コード);
    if (v.PC !== undefined) await this.レイアウトを選ぶ("PcLayout", v.PC);
    if (v.モバイル !== undefined) await this.レイアウトを選ぶ("SpLayout", v.モバイル);
    if (v.author !== undefined) await f("author").fill(v.author, { timeout: 30_000 });
    if (v.description !== undefined) await f("description").fill(v.description, { timeout: 30_000 });
    if (v.keyword !== undefined) await f("keyword").fill(v.keyword, { timeout: 30_000 });
    if (v.robot !== undefined) await f("meta_robots").fill(v.robot, { timeout: 30_000 });
    if (v.metatag !== undefined) await f("meta_tags").fill(v.metatag, { timeout: 30_000 });
  }
  private async レイアウトを選ぶ(id: "PcLayout" | "SpLayout", 名称: string | null): Promise<void> {
    const sel = this.page.locator(`#main_edit_${id}`);
    if (名称 === null) { await sel.selectOption({ value: "" }, { timeout: 30_000 }); return; }
    const have = (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
    if (!have.includes(名称)) throw new Error(`レイアウトの選択肢「${名称}」が無い（ある選択肢: ${have.join("、")}）`);
    await sel.selectOption({ label: 名称 }, { timeout: 30_000 });
  }
  async 登録を押す(): Promise<void> {
    await this.page.locator("button.btn-ec-conversion[type=submit]").click({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }
  /**
   * 登録を押して、結果（成功の帯・入力エラー・システムエラー）が出るまで待ち、その要約を返す。
   * ファイル名を変えて保存すると、保存後の画面が「該当ファイルが見つかりませんでした。…1分ほど待ってから再度アクセスしてください」の案内になることがある
   * （新しいファイル名のテンプレートがまだ無いため。保存そのものはDBに残る）。その場合も保存は行われたものとして続け、注記に残す。
   */
  async 登録して結果を読む(): Promise<{ 成功: boolean; 入力エラー: string[]; システムエラー: boolean; 遷移先: string; 同期待ちの案内: boolean }> {
    const p = this.page;
    await this.登録を押す();
    const ok = p.locator(".alert-success");
    const ng = p.locator(".alert-danger, .invalid-feedback, .form-error-message").filter({ hasNotText: "デバッグモード" });
    const sys = p.getByText("システムエラーが発生しました");
    const wait = p.getByText("該当ファイルが見つかりませんでした。");
    // 登録はテンプレートの保存・ファイル置き場への送信を含み、手元の環境では1分を超えることがあり、開発環境の遅い時間帯（朝〜14時）は4分でも返らなかった（2026-11-11）ので7分まで待つ
    await expect(ok.or(ng).or(sys).or(wait).first(), "登録の結果が表示されない").toBeVisible({ timeout: 420_000 });
    const texts = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    const 案内 = await wait.first().isVisible().catch(() => false);
    if (案内) test.info().annotations.push({ type: "手順の注記", description: "登録後の画面が「該当ファイルが見つかりませんでした。同期が完了していない可能性があります。…1分ほど待ってから再度アクセスしてください。」の案内になった（保存そのものはDBに残る）" });
    return { 成功: 案内 || ((await ok.count()) > 0 && (await ok.first().isVisible())), 入力エラー: await texts(ng), システムエラー: await sys.first().isVisible().catch(() => false), 遷移先: p.url(), 同期待ちの案内: 案内 };
  }
  /** 登録後の編集画面のアドレスからページIDを読む */
  ページIDを読む(): string {
    const m = /\/content\/page\/(\d+)\/edit/.exec(this.page.url());
    if (!m) throw new Error(`ページ管理(登録・編集)画面に遷移していない（${this.page.url()}）`);
    return m[1];
  }
  /** 新規登録して、登録後のページIDを返す（シード用。失敗したら止める） */
  async 作る(v: ページの値 & { 言語?: "ja" | "en" }): Promise<string> {
    await this.新規画面を開く(v.言語 ?? "ja");
    await this.入力する(v);
    const r = await this.登録して結果を読む();
    if (!r.成功) throw new Error(`ページ「${v.ページ名}」を登録できない: ${r.システムエラー ? "システムエラー" : r.入力エラー.join(" / ")}`);
    return this.ページIDを読む();
  }
  /** 登録・編集画面の「ページ設定」に出ている値 */
  async 画面の値(): Promise<{ ページ名: string; URL: string; ファイル名: string; コード: string; author: string; description: string; keyword: string; robot: string; metatag: string; PC: string; モバイル: string }> {
    const v = (id: string) => this.page.locator(`#main_edit_${id}`).inputValue();
    const sel = async (id: string) => (await this.page.locator(`#main_edit_${id} option:checked`).innerText()).trim();
    return {
      ページ名: await v("name"), URL: await v("url"), ファイル名: await v("file_name"), コード: await this.コードを読む(),
      author: await v("author"), description: await v("description"), keyword: await v("keyword"), robot: await v("meta_robots"), metatag: await v("meta_tags"),
      PC: await sel("PcLayout"), モバイル: await sel("SpLayout"),
    };
  }
  /** URL欄の左に出ている文（公開側のアドレスの前置き） */
  get URLの前置き(): Locator { return this.page.locator("#pageDetail .col-3.pe-0").first(); }
  /** ファイル名欄の右に出ている文 */
  get ファイル名の後置き(): Locator { return this.page.locator("#pageDetail .col-2.ps-0"); }
  get ページ確認ボタン(): Locator { return this.page.locator("#btn-page-preview"); }
  get 一覧へのリンク(): Locator { return this.page.locator(".c-conversionArea a.c-baseLink"); }
  /** 設定欄（ページ設定・レイアウト設定・メタ設定）の開閉ボタン */
  開閉ボタン(欄: "ページ設定" | "レイアウト設定" | "メタ設定"): Locator {
    const id = { ページ設定: "pageDetail", レイアウト設定: "pageLayout", メタ設定: "pageMeta" }[欄];
    return this.page.locator(`a[data-bs-toggle='collapse'][href='#${id}']`);
  }
  設定欄(欄: "ページ設定" | "レイアウト設定" | "メタ設定"): Locator {
    const id = { ページ設定: "pageDetail", レイアウト設定: "pageLayout", メタ設定: "pageMeta" }[欄];
    return this.page.locator(`#${id}`);
  }
}
