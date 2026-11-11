/**
 * 自動送信メールテンプレート編集（メニュー「設定」→「基本情報設定」→「自動送信メール」）。M10-08 の画面操作。
 * 画面の作り（アプリのテンプレートで確かめた）: モール共有の自動送信メールのテンプレートだけを選べる（店舗で切り替える画面は無い）。
 * テンプレートを選ぶと /mall/auto_mail/<テンプレートID> へ移り、最終更新者・最終更新日・本文上部・本文下部と「登録」ボタンが出る。新規作成の画面は無い。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const BASE = "/mall/auto_mail";
const F = (n: string) => `[name="mail[${n}]"]`;

export class AutoMailPage {
  constructor(readonly page: Page) {}
  get パス(): string { return new URL(this.page.url()).pathname; }

  /** テンプレート未選択の画面（id なし）か、id を指定した画面を開く。HTTPステータスを返す */
  async 開く(id?: number | string): Promise<number> {
    const resp = await this.page.goto(adminUrl(id === undefined ? BASE : `${BASE}/${id}`), { timeout: 60_000, waitUntil: "load" });
    return resp?.status() ?? 0;
  }
  get テンプレ選択(): Locator { return this.page.locator(F("template")); }
  get 名称(): Locator { return this.page.locator(F("name")); }
  get 件名(): Locator { return this.page.locator(F("mail_subject")); }
  get 本文上部(): Locator { return this.page.locator(F("header")); }
  get 本文下部(): Locator { return this.page.locator(F("footer")); }
  get 登録ボタン(): Locator { return this.page.locator('#ex-conversion-action button[type="submit"]'); }
  private 行(ラベル: string): Locator {
    return this.page.locator("#form1 .row.mb-2, #form1 .row.mb-3").filter({ has: this.page.locator("div.col-2 span", { hasText: new RegExp(`^\\s*${ラベル}\\s*$`) }) });
  }
  /** 項目名の行が画面にあるか（最終更新者・最終更新日・本文上部・本文下部） */
  async 項目がある(ラベル: string): Promise<boolean> { return (await this.行(ラベル).count()) > 0; }
  async 行の値(ラベル: string): Promise<string> {
    return ((await this.行(ラベル).locator("div.col-10").first().innerText({ timeout: 30_000 })) ?? "").trim();
  }
  async 選択肢(): Promise<string[]> {
    return this.テンプレ選択.locator("option").evaluateAll((os) => (os as HTMLOptionElement[]).map((o) => (o.textContent ?? "").trim()).filter((t) => t !== ""));
  }
  /** テンプレ選択でテンプレート名を選ぶ。選ぶと画面が移る（選択肢に無ければ失敗する） */
  async 選ぶ(名称: string): Promise<void> {
    const 候補 = await this.選択肢();
    if (!候補.includes(名称)) throw new Error(`テンプレ選択の選択肢に「${名称}」が無い（ある選択肢: ${候補.slice(0, 30).join("、")}${候補.length > 30 ? "…" : ""}）`);
    await Promise.all([this.page.waitForURL(new RegExp(`${BASE}/\\d+$`), { timeout: 60_000 }), this.テンプレ選択.selectOption({ label: 名称 }, { timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
    await expect(this.名称, "選んだテンプレートの編集画面").toBeVisible({ timeout: 30_000 });
  }
  async 入れる(v: { 名称?: string; 件名?: string; 本文上部?: string; 本文下部?: string }): Promise<void> {
    // 長い文字列を fill で入れる（キー入力ではなく値の代入）
    if (v.名称 !== undefined) await this.名称.fill(v.名称, { timeout: 60_000 });
    if (v.件名 !== undefined) await this.件名.fill(v.件名, { timeout: 60_000 });
    if (v.本文上部 !== undefined) await this.本文上部.fill(v.本文上部, { timeout: 60_000 });
    if (v.本文下部 !== undefined) await this.本文下部.fill(v.本文下部, { timeout: 60_000 });
  }
  async 設定を押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.登録ボタン.click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  async 設定して保存を確かめる(what: string): Promise<void> { await this.設定を押す(); await expectSaved(this.page, what); }
  /** 設定ボタンを押し、送信（POST）の応答を返す */
  async 設定を押して応答を見る(): Promise<Response | null> {
    const wait = this.page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes(BASE), { timeout: 60_000 }).catch(() => null);
    await this.登録ボタン.click({ timeout: 30_000 });
    const r = await wait;
    await this.page.waitForLoadState("load").catch(() => undefined);
    return r;
  }
  /** 開発者ツールで、なりすまし対策トークンの入力要素を削除する */
  async トークンを消す(): Promise<void> { await this.page.locator(F("_token")).evaluate((el) => el.remove()); }
  async トークンを書き換える(値: string): Promise<void> { await this.page.locator(F("_token")).evaluate((el, v) => { (el as HTMLInputElement).value = v; }, 値); }
  /** 開発者ツールで、フォームの送信を止めるブラウザ側の処理を解除する */
  async 送信を止める処理を外す(): Promise<void> {
    await this.page.evaluate(() => {
      const w = window as unknown as { jQuery?: (s: string) => { off: (e: string) => void } };
      w.jQuery?.("#form1").off("submit");
    });
  }
  /** フォームを直接送り、送信（POST）の応答を返す（テンプレート未選択の画面には「登録」ボタンが無いため） */
  async フォームを送る(): Promise<Response | null> {
    const wait = this.page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes(BASE), { timeout: 60_000 }).catch(() => null);
    await this.page.evaluate(() => (document.getElementById("form1") as HTMLFormElement).submit());
    const r = await wait;
    await this.page.waitForLoadState("load").catch(() => undefined);
    return r;
  }
  /** 件名の欄で Enter を押して送信を試みる。画面の警告（ダイアログ）の文を返す（無ければ空） */
  async 未選択で送信を試みる(): Promise<string> {
    let 文 = "";
    this.page.once("dialog", (d) => { 文 = d.message(); void d.accept(); });
    await this.件名.press("Enter", { timeout: 30_000 });
    await this.page.waitForTimeout(1500);
    return 文;
  }
}

/** 文字を n 個並べた文字列 */
export const 並べる = (字: string, n: number): string => 字.repeat(n);
/** 表示の日時の数字の並び（「2026-08-01 09:10:11」「2026年8月1日9時10分11秒」を、どちらも [2026, 8, 1, 9, 10, 11] にする） */
export const 日時の数字 = (s: string): number[] => (s.match(/\d+/g) ?? []).map(Number);
