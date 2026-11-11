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
  // ---- 左右の項目リスト・並べ替え・削除 ----

  async 出力する項目名(): Promise<string[]> { return this.選択肢(this.出力する項目); }
  async 出力しない項目名(): Promise<string[]> { return this.選択肢(this.出力しない項目); }
  /** 追加されたCSV選択の選択肢（「新規作成」を含む） */
  async 定義名の一覧(): Promise<string[]> { return this.選択肢(this.追加されたCSV選択); }

  /** 「CSV出力しない項目」で項目を（複数）選ぶ。移動ボタンは押さない */
  async 出力しない項目を選ぶ(labels: string[]): Promise<void> {
    await this.出力しない項目.selectOption(labels.map((label) => ({ label })), { timeout: 20_000 });
  }
  /** 「CSV出力する項目」で項目を（複数）選ぶ。ボタンは押さない */
  async 出力する項目を選ぶ(labels: string[]): Promise<void> {
    await this.出力する項目.selectOption(labels.map((label) => ({ label })), { timeout: 20_000 });
  }
  async 右向きの項目移動を押す(): Promise<void> { await this.page.locator("#add").click({ timeout: 20_000 }); }
  async 左向きの項目移動を押す(): Promise<void> { await this.page.locator("#remove").click({ timeout: 20_000 }); }
  async 下向きの順序入替を押す(): Promise<void> { await this.page.locator('.move[data-value="down"]').click({ timeout: 20_000 }); }

  /** 「CSV出力しない項目」から複数の項目を選び、右向きの項目移動ボタンを1回押す */
  async 項目を複数選んで出力へ移す(labels: string[]): Promise<void> {
    await this.出力しない項目.selectOption(labels.map((label) => ({ label })), { timeout: 20_000 });
    await this.page.locator("#add").click({ timeout: 20_000 });
  }

  /** 「CSV出力する項目」から複数の項目を選び、左向きの項目移動ボタンを1回押す */
  async 項目を複数選んで出力から外す(labels: string[]): Promise<void> {
    await this.出力する項目.selectOption(labels.map((label) => ({ label })), { timeout: 20_000 });
    await this.page.locator("#remove").click({ timeout: 20_000 });
  }

  /** 「CSV出力する項目」で項目を選び、下向きの順序入替ボタンを押す */
  async 出力項目を下へ入れ替える(label: string): Promise<void> {
    await this.出力する項目.selectOption({ label }, { timeout: 20_000 });
    await this.page.locator('.move[data-value="down"]').click({ timeout: 20_000 });
  }

  /** 設定ボタンを押し、保存の要求の応答まで待つ（保存の成否は確かめない。ブラウザの入力チェックで送られなかったときは null） */
  async 設定ボタンを押して応答を待つ(): Promise<number | null> {
    const resp = this.page.waitForResponse((r) => /custom_csv\/\d+\/update/.test(r.url()), { timeout: 15_000 }).catch(() => null);
    await this.設定ボタン.click({ timeout: 20_000 });
    const r = await resp;
    await this.page.waitForLoadState("load");
    return r ? r.status() : null;
  }

  /** 名前の入力欄がブラウザの必須チェックで空を拒むか */
  async 名前の必須チェックに掛かるか(): Promise<boolean> {
    return this.名前.evaluate((n) => (n as HTMLInputElement).validity.valueMissing);
  }

  /** 削除リンク→確認モーダルの削除ボタンを押し、削除後の画面の読み込みまで待つ */
  async 削除する(): Promise<void> {
    await this.削除リンク.click({ timeout: 30_000 });
    const modal = this.page.locator("#DeleteModal");
    await expect(modal).toBeVisible({ timeout: 30_000 });
    const ok = modal.locator('a.btn-ec-delete[data-method="delete"]');
    await expect.poll(async () => (await ok.getAttribute("href")) ?? "#", "削除の送り先（モーダルが開き終わると入る）").toMatch(/custom_csv\/delete\/\d+/);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), ok.click({ timeout: 30_000 })]);
  }

  /** 画面の項目名から、その場で定義を新規作成する（種別を選び、名前を入れ、項目を渡した順に移して設定する）。定義IDを返す */
  async 新規作成して設定する(csvTypeId: string, 名前: string, 項目: string[], what: string): Promise<string> {
    await this.open(csvTypeId);
    await this.定義を選ぶ("新規作成");
    await this.名前.fill(名前);
    for (const l of 項目) await this.項目を出力へ移す(l);
    return this.設定する(what);
  }
}

/** 商品マスター（商品一覧）の検索と、商品のカスタムCSV出力（プルダウン）の操作 */
export class ProductCustomCsvPage {
  readonly 商品コード: Locator;
  readonly 検索ボタン: Locator;
  readonly カスタムCSV出力: Locator;
  constructor(readonly page: Page) {
    this.商品コード = page.locator("#admin_search_product_product_code");
    this.検索ボタン = page.locator("button.admin-product-search-submit");
    this.カスタムCSV出力 = page.locator("#csv_pulldown");
  }

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/product"));
    expect(res?.status() ?? 0, "商品マスター(検索入力)の応答").toBeLessThan(400);
    await expect(this.商品コード, "商品コードの検索欄").toBeVisible({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }

  async 商品コードで検索する(code: string): Promise<void> {
    await this.商品コード.fill(code);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.検索ボタン.click()]);
  }

  /** カスタムCSV出力のプルダウンの選択肢（先頭の見出しと、設定画面への行き先を含む） */
  async 出力の選択肢(): Promise<string[]> {
    return (await this.カスタムCSV出力.locator("option").allInnerTexts()).map((t) => t.trim());
  }

  /** プルダウンで定義の名前を選んでダウンロードする。バイト列とファイル名を返す */
  async ダウンロードする(定義名: string): Promise<{ ファイル名: string; バイト: Buffer }> {
    const dl = this.page.waitForEvent("download", { timeout: 120_000 });
    await this.カスタムCSV出力.selectOption({ label: 定義名 }, { timeout: 20_000 });
    const d = await dl;
    const fs = await import("node:fs");
    return { ファイル名: d.suggestedFilename(), バイト: fs.readFileSync(await d.path()) };
  }

  /** プルダウンの定義の行き先（開発者ツールで読む要求先）。定義IDだけ置き換えて開き、ダウンロードされたか・応答の状態を返す */
  async 要求先を読む(定義名: string): Promise<string> {
    const v = await this.カスタムCSV出力.locator("option").filter({ hasText: new RegExp(`^\\s*${定義名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }).first().getAttribute("value");
    if (!v) throw new Error(`カスタムCSV出力の選択肢に「${定義名}」の行き先が無い`);
    return v;
  }

  async 定義IDを置き換えて開く(元のURL: string, 新しい定義ID: string): Promise<{ ダウンロードされた: boolean; 応答: number | null }> {
    const url = new URL(元のURL, this.page.url());
    url.pathname = url.pathname.replace(/\/\d+$/, `/${新しい定義ID}`);
    const dl = this.page.waitForEvent("download", { timeout: 15_000 }).then((d) => d, () => null);
    const nav = this.page.goto(url.toString()).then((r) => r, (e: Error) => e);
    const [d, r] = await Promise.all([dl, nav]);
    if (d) return { ダウンロードされた: true, 応答: null };
    return { ダウンロードされた: false, 応答: r && !(r instanceof Error) ? r.status() : null };
  }
}

/** 在庫検索一覧の「在庫情報カスタムCSV出力」のプルダウン（検索結果があるときだけ出る） */
export const 在庫カスタムCSV出力 = (page: Page): Locator => page.locator("#stock_csv_pulldown");

/** プルダウンを押して開き、選択肢の表示（先頭の見出し・設定画面への行き先を含む）を返す */
export async function 在庫カスタムCSV出力を押して選択肢を読む(page: Page): Promise<string[]> {
  const select = 在庫カスタムCSV出力(page);
  await expect(select, "在庫情報カスタムCSV出力のプルダウン（検索結果があるときだけ出る）").toBeVisible({ timeout: 30_000 });
  await select.click({ timeout: 20_000 });
  return (await select.locator("option").allInnerTexts()).map((t) => t.trim());
}
