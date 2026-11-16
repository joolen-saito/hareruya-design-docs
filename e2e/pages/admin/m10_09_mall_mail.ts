/**
 * M10-09 メール設定（メールテンプレート編集・新規作成・テンプレート一覧）と、連携で使う受注のメール通知画面。セレクタはここだけに書く。
 *
 * 画面の作り（アプリのテンプレート・コントローラ・フォームで確かめた。期待値はここに書かない）:
 * - 編集画面 /mall/mail（テンプレート未選択）・/mall/mail/<テンプレートID>。モール共有の手動送信のテンプレートだけを扱う（店舗で切り替える仕組みは無い）。
 *   「テンプレート」の選択（テンプレート名の昇順。自動送信のものは出ない）を変えると、その場で選んだテンプレートの編集画面へ移る（空に戻すと未選択の画面）。
 *   見出しの横に「新規作成」「テンプレート一覧」。最終更新者・最終更新日の行は、更新履歴があるときだけ出る。
 *   入力欄はテンプレート名・件名・ヘッダー・フッター（本文の雛形の前文・本文・後文は読み取り専用の表示）。下の「登録」で保存する。
 * - 新規作成画面 /mall/mail/new/<メール種別>。「メール種別」を選ぶと、その種別の画面へ移る。保存すると作ったテンプレートの編集画面へ移る。
 *   作ったテンプレートは削除できない作り（削除のボタンが出ない）。
 * - テンプレート一覧 /mall/mail/list。手動送信のテンプレートごとに、名前・件名と、本文（雛形にヘッダー・フッターを差し込んだ文面）を並べる。
 * - 受注のメール通知画面 /order/<受注ID>/mail。「テンプレート」を選ぶと画面を送り直し、件名欄に選んだテンプレートの件名が入る。
 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const T = 30_000;
const F = (n: string) => `[name="mail[${n}]"]`;
const 整える = (s: string) => s.replace(/\s+/g, " ").trim();

export type テンプレートの値 = { 名称: string; 件名: string; ヘッダー?: string; フッター?: string };

export class MallMailPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get パス(): string { return new URL(this.page.url()).pathname; }

  /** テンプレート未選択の画面か、ID のテンプレートの編集画面を開く。HTTPステータスを返す */
  async 開く(id?: string | number): Promise<number> {
    const res = await this.page.goto(adminUrl(id === undefined ? "/mall/mail" : `/mall/mail/${id}`), { timeout: 60_000, waitUntil: "load" });
    return res?.status() ?? 0;
  }
  async 編集画面である(): Promise<boolean> { return (await this.テンプレ選択.count()) > 0 && (await this.件名.count()) > 0; }

  get テンプレ選択(): Locator { return this.page.locator(F("template")); }
  get 名称(): Locator { return this.page.locator(F("name")); }
  get 件名(): Locator { return this.page.locator(F("mail_subject")); }
  get ヘッダー(): Locator { return this.page.locator(F("header")); }
  get フッター(): Locator { return this.page.locator(F("footer")); }
  get 登録ボタン(): Locator { return this.page.locator('#ex-conversion-action button[type="submit"]'); }
  get 見出し(): Locator { return this.page.locator(".card-header").first(); }
  get 新規作成への導線(): Locator { return this.見出し.getByRole("link", { name: "新規作成", exact: true }); }
  get 一覧への導線(): Locator { return this.見出し.getByRole("link", { name: "テンプレート一覧", exact: true }); }
  /** 本文として入力できる欄（書き込める textarea。読み取り専用の雛形の表示は含まない） */
  get 本文の編集欄(): Locator { return this.page.locator("#form1 textarea:not([readonly])"); }

  private 行(ラベル: string): Locator {
    return this.page.locator("#form1 .row").filter({ has: this.page.locator("div.col-2 > span:first-child", { hasText: new RegExp(`^\\s*${ラベル}\\s*$`) }) });
  }
  async 項目がある(ラベル: string): Promise<boolean> { return (await this.行(ラベル).count()) > 0; }
  async 行の値(ラベル: string): Promise<string> { return 整える(await this.行(ラベル).first().locator("div.col-10").first().innerText()); }

  /** テンプレートの選択肢（表示名と値。「選択してください」を除く） */
  async 選択肢(): Promise<{ 名前: string; 値: string }[]> {
    return this.テンプレ選択.locator("option").evaluateAll((os) => (os as HTMLOptionElement[])
      .map((o) => ({ 名前: (o.textContent ?? "").trim(), 値: o.value })).filter((o) => o.値 !== ""));
  }
  async 選ばれている(): Promise<string> { return this.テンプレ選択.inputValue(); }

  /** テンプレートで名前を選ぶ（選ぶと画面が移る）。選択肢に無ければ失敗する */
  async 選ぶ(名前: string): Promise<void> {
    const 候補 = (await this.選択肢()).map((o) => o.名前);
    if (!候補.includes(名前)) throw new Error(`テンプレートの選択肢に「${名前}」が無い（選択肢は${候補.length}件）`);
    await Promise.all([this.page.waitForURL(/\/mall\/mail\/\d+$/, { timeout: 120_000}), this.テンプレ選択.selectOption({ label: 名前 })]);
    await this.page.waitForLoadState("load");
  }
  /** テンプレートの選択を「選択してください」に戻す（戻すと画面が移る） */
  async 未選択に戻す(): Promise<void> {
    await Promise.all([this.page.waitForURL(/\/mall\/mail\/?$/, { timeout: 120_000}), this.テンプレ選択.selectOption({ value: "" })]);
    await this.page.waitForLoadState("load");
  }

  async 入れる(v: Partial<テンプレートの値>): Promise<void> {
    if (v.名称 !== undefined) await this.名称.fill(v.名称, { timeout: 60_000 });
    if (v.件名 !== undefined) await this.件名.fill(v.件名, { timeout: 60_000 });
    if (v.ヘッダー !== undefined) await this.ヘッダー.fill(v.ヘッダー, { timeout: 60_000 });
    if (v.フッター !== undefined) await this.フッター.fill(v.フッター, { timeout: 60_000 });
  }
  async 値を読む(): Promise<{ 件名: string; ヘッダー: string; フッター: string }> {
    const nl = (s: string) => s.replace(/\r\n/g, "\n");
    return { 件名: await this.件名.inputValue(), ヘッダー: nl(await this.ヘッダー.inputValue()), フッター: nl(await this.フッター.inputValue()) };
  }
  /** 読み取り専用で出る雛形の表示（前文・本文・後文）を上から順に */
  async 雛形の表示(): Promise<string[]> {
    return this.page.locator("#form1 textarea[readonly], #form1 pre").evaluateAll((els) => els.map((e) => ((e as HTMLTextAreaElement).value ?? e.textContent ?? "").replace(/\r\n/g, "\n")));
  }

  /** 「登録」を押す（画面の移り・読み込みを待つ） */
  async 登録を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined), this.登録ボタン.click({ noWaitAfter: true })]);
    await this.page.waitForLoadState("load");
  }
  async 登録して保存を確かめる(what: string): Promise<void> { await this.登録を押す(); await expectSaved(this.page, what); }
  /**
   * 登録ボタンを押し、送信（POST）の応答と、応答の画面への移動を待つ。応答の状態コードを返す（送られなかったときは null）。
   * 「再表示される」「増えない」を確かめる手順で、送信が送られたかを見るのに使う（登録を押す は画面が移らなくても先へ進む）。
   */
  async 登録を押して応答を見る(): Promise<number | null> {
    const wait = this.page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname.includes("/mall/mail"), { timeout: 60_000 }).catch(() => null);
    const 移動 = this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null);
    await this.登録ボタン.click();
    const r = await wait;
    if (r) await 移動;
    await this.page.waitForLoadState("load");
    return r ? r.status() : null;
  }

  /** 成功・エラーの表示（開発環境の帯を除く） */
  async お知らせ(): Promise<{ 成功: string[]; エラー: string[] }> {
    const 文 = async (l: Locator) => (await l.allInnerTexts()).map(整える).filter((t) => t && t !== "デバッグモードが有効になっています。");
    return { 成功: await 文(this.page.locator(".alert-success")), エラー: await 文(this.page.locator(".alert-danger, .invalid-feedback, .form-error-message")) };
  }
}

/** 新規作成画面でメール種別を選び、値を入れて登録する。作ったテンプレートの ID（移った編集画面のアドレス）を返す */
export async function テンプレートを新規作成する(page: Page, 種別: string, v: テンプレートの値): Promise<string> {
  const res = await page.goto(adminUrl("/mall/mail/new"), { timeout: 60_000, waitUntil: "load" });
  if (!res || !res.ok()) throw new Error(`メールテンプレートの新規作成画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  const 種別欄 = page.locator('[name="mail[base_type]"]');
  await Promise.all([page.waitForURL(/\/mall\/mail\/new\/\d+$/, { timeout: 120_000}), 種別欄.selectOption({ label: 種別 })]);
  await page.waitForLoadState("load");
  const p = new MallMailPage(page);
  await p.入れる(v);
  await p.登録して保存を確かめる(`メールテンプレート「${v.名称}」の新規作成`);
  const m = /\/mall\/mail\/(\d+)$/.exec(new URL(page.url()).pathname);
  if (!m) throw new Error(`メールテンプレート「${v.名称}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** テンプレート一覧画面 */
export class MallMailListPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get パス(): string { return new URL(this.page.url()).pathname; }
  get 見出し(): Locator { return this.page.locator(".card-header .card-title").first(); }
  get 区画(): Locator { return this.page.locator("section[data-mail-template-id]"); }
  /** 並んでいるテンプレート名（上から順） */
  async 名前の並び(): Promise<string[]> { return (await this.区画.locator("h5").allInnerTexts()).map(整える); }
  区画の(id: string): Locator { return this.page.locator(`section[data-mail-template-id="${id}"]`); }
  /** テンプレートの区画に出ている本文（文面の表示）。無ければ null */
  async 本文(id: string): Promise<string | null> {
    const pre = this.区画の(id).locator("pre");
    if (!(await pre.count())) return null;
    return (await pre.first().innerText()).replace(/\r\n/g, "\n");
  }
  /** 区画の中の入力欄（textarea・input）の数 */
  async 入力欄の数(id: string): Promise<number> { return this.区画の(id).locator("textarea, input").count(); }
}

/** 受注のメール通知画面（受注詳細から開くメール通知） */
export class OrderMailPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get テンプレ選択(): Locator { return this.page.locator("#template-change"); }
  get 件名(): Locator { return this.page.locator('#order-mail-form [name$="[mail_subject]"]'); }
  async 開く(受注ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/order/${受注ID}/mail`), { timeout: 60_000, waitUntil: "load" });
    await expect(this.テンプレ選択, "受注のメール通知画面のテンプレート").toBeVisible({ timeout: T });
    return res?.status() ?? 0;
  }
  /** テンプレートで名前を選ぶ（選ぶと画面を送り直す） */
  async 選ぶ(名前: string): Promise<void> {
    const 候補 = await this.テンプレ選択.locator("option").allInnerTexts();
    if (!候補.map((t) => t.trim()).includes(名前)) throw new Error(`受注のメール通知画面のテンプレートの選択肢に「${名前}」が無い`);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), this.テンプレ選択.selectOption({ label: 名前 })]);
    await expect(this.テンプレ選択, "送り直したあとの受注のメール通知画面").toBeVisible({ timeout: T });
  }
}
