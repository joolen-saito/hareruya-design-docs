/**
 * M08-08 手動メール通知（会員）の画面操作。会員登録/編集画面の「手動メール通知」→ 手動メール通知(入力画面) → 確認 → 手動メール通知(確認画面) → 送信、
 * と、会員検索一覧(検索結果)の「メール履歴」から開くメール配信履歴画面。セレクタはここだけに書く。
 * 会員の検索は F06 の部品（pages/admin/f06_customer.ts）を使う。正本: cases/M08-08_test_cases.tsv
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { resultRow, searchCustomer } from "./f06_customer";

const T = 30_000;
const 整える = (s: string): string => s.replace(/\s+/g, " ").trim();

export class CustomerManualMailPage {
  readonly template: Locator;
  readonly subject: Locator;
  readonly body: Locator;
  constructor(readonly page: Page) {
    page.setDefaultTimeout(T);
    this.template = page.locator("#template-change");
    this.subject = page.locator('#manual-mail-form [name$="[mail_subject]"]');
    this.body = page.locator('#manual-mail-form textarea[name$="[body]"]');
  }
  get パス(): string { return new URL(this.page.url()).pathname; }

  /** 会員登録/編集画面を開く。応答のステータスを返す */
  async 会員編集を開く(会員ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/customer/${会員ID}/edit`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 会員登録/編集画面の「手動メール通知」ボタンを押す */
  async 手動メール通知ボタンを押す(会員ID: string): Promise<void> {
    const a = this.page.locator(`a[href*="/customer/manual_mail/${会員ID}"]`).first();
    await expect(a, "会員登録/編集画面の「手動メール通知」ボタン").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), a.click()]);
  }
  /** 手動メール通知(入力画面)のアドレス（テンプレートを指定しない） */
  入力画面のURL(会員ID: string): string { return adminUrl(`/customer/manual_mail/${会員ID}`); }
  /** アドレスを開く。応答のステータスを返す */
  async アドレスを開く(url: string): Promise<number> {
    const res = await this.page.goto(url, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async 入力画面を開く(会員ID: string): Promise<number> { return this.アドレスを開く(this.入力画面のURL(会員ID)); }

  async 入力画面か(): Promise<boolean> { return (await this.page.locator("#manual-mail-form").count()) > 0; }
  async 確認画面か(): Promise<boolean> { return (await this.page.locator("#customer-mail-form").count()) > 0; }

  /** 入力画面の会員名（「会員名」の行の値） */
  async 会員名(): Promise<string> {
    const row = this.page.locator(".card-header .row.mb-2").filter({ has: this.page.locator(".col-3", { hasText: "会員名" }) }).first();
    return 整える(await row.locator(".col").last().innerText());
  }
  /** テンプレ選択の選択肢（値と表示の名前。表示の順） */
  async テンプレの選択肢(): Promise<{ 値: string; 名前: string }[]> {
    return this.template.locator("option").evaluateAll((os) => os.map((o) => ({ 値: (o as HTMLOptionElement).value, 名前: (o.textContent ?? "").replace(/\s+/g, " ").trim() })));
  }
  async 選ばれているテンプレ(): Promise<string> { return this.template.inputValue(); }
  /** テンプレ選択でテンプレートを選ぶ（選ぶと、テンプレートの番号つきのアドレスへ移る）。移った先の応答のステータスを返す */
  async テンプレを選ぶ(値: string): Promise<number> {
    const resp = this.page.waitForResponse((r) => r.request().isNavigationRequest() && r.url().includes("/customer/manual_mail/"), { timeout: 60_000 });
    await this.template.selectOption(値);
    const r = await resp;
    await this.page.waitForLoadState("load");
    return r.status();
  }
  /** テンプレ選択に選択肢を足して選び、change を起こす（開発者ツールで選択肢を足す操作の代わり）。移った先の応答のステータスを返す */
  async 選択肢を足して選ぶ(値: string, 名前: string): Promise<number> {
    const resp = this.page.waitForResponse((r) => r.request().isNavigationRequest() && r.url().includes("/customer/manual_mail/"), { timeout: 60_000 });
    await this.template.evaluate((s, v) => {
      const sel = s as HTMLSelectElement;
      const o = document.createElement("option"); o.value = v.値; o.textContent = v.名前; sel.appendChild(o);
      sel.value = v.値;
      const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
      if (w.jQuery) w.jQuery(sel).trigger("change"); else sel.dispatchEvent(new Event("change", { bubbles: true }));
    }, { 値, 名前 });
    const r = await resp;
    await this.page.waitForLoadState("load");
    return r.status();
  }
  async 件名(): Promise<string> { return this.subject.inputValue(); }
  async 本文(): Promise<string> { return (await this.body.inputValue()).replace(/\r\n/g, "\n"); }
  async 件名を入れる(v: string): Promise<void> { await this.subject.fill(v); }
  async 本文を入れる(v: string): Promise<void> { await this.body.fill(v); }
  /** 入力欄の required を外す（開発者ツールで属性を消す操作の代わり）。外した欄の数を返す */
  async 必須を外す(欄: ("テンプレ" | "件名" | "本文")[]): Promise<number> {
    let n = 0;
    for (const k of 欄) {
      const l = k === "テンプレ" ? this.template : k === "件名" ? this.subject : this.body;
      n += await l.evaluate((e) => { const had = e.hasAttribute("required"); e.removeAttribute("required"); return had ? 1 : 0; });
    }
    return n;
  }
  /** テンプレ選択を未選択にする（再読み込みを起こさない） */
  async テンプレを空にする(): Promise<void> {
    await this.template.evaluate((s) => {
      const sel = s as HTMLSelectElement;
      if (!Array.from(sel.options).some((o) => o.value === "")) { const o = document.createElement("option"); o.value = ""; sel.insertBefore(o, sel.firstChild); }
      sel.value = "";
    });
  }
  /** なりすまし対策のトークンの値を変える（開発者ツールの操作の代わり） */
  async トークンを変える(値: string): Promise<void> {
    await this.page.locator('#manual-mail-form input[name$="[_token]"]').evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }
  /** 「確認」を押す。移った先の応答のステータスを返す */
  async 確認を押す(): Promise<number> {
    const resp = this.page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().method() === "POST", { timeout: 60_000 });
    await this.page.locator("#confirm").click();
    const r = await resp;
    await this.page.waitForLoadState("load");
    return r.status();
  }
  /** 入力画面の「会員編集画面へ戻る」を押す */
  async 入力画面の戻るを押す(): Promise<void> {
    const a = this.page.locator("#manual-mail-form .c-conversionArea__leftBlockItem a.c-baseLink").first();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), a.click()]);
  }

  // ---- 確認画面 ----
  /** 確認画面の項目（会員名・テンプレート・件名）をラベルの名前で読み、本文（画面に出る文）を「本文」に入れて返す */
  async 確認画面の項目(): Promise<Record<string, string>> {
    const out: Record<string, string> = await this.page.locator("#mailCreate .card-header .row.mb-2").evaluateAll((rows) => {
      const o: Record<string, string> = {};
      for (const r of rows) {
        const label = (r.querySelector(".col-3")?.textContent ?? "").replace(/\s+/g, " ").trim();
        const cols = r.querySelectorAll(":scope > .col");
        const val = (cols[cols.length - 1] as HTMLElement | undefined)?.innerText ?? "";
        if (label) o[label] = val.replace(/\u00a0/g, " ").trim();
      }
      return o;
    });
    out["本文"] = (await this.page.locator("#mailCreate .card-body").first().innerText()).replace(/\u00a0/g, " ").trim();
    return out;
  }
  /** 確認画面の「送信」を押し、移った先まで待つ（送信の確認の窓が出たら OK を押す） */
  async 送信を押す(): Promise<void> {
    this.page.once("dialog", (d) => { void d.accept(); });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), this.page.locator("#complete").click()]);
  }
  /** 確認画面の「会員編集画面へ戻る」を押す */
  async 確認画面の戻るを押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.page.locator("#back").click()]);
  }
  /** 画面上部のお知らせ */
  async お知らせ(): Promise<string[]> {
    return (await this.page.locator(".alert").allInnerTexts()).map(整える).filter(Boolean);
  }

  // ---- メール配信履歴 ----
  /** 会員検索一覧で「会員ID・メールアドレス・お名前」に語を入れて検索する */
  async 会員を検索する(語: string): Promise<void> { await searchCustomer(this.page, 語); }
  /** 会員検索一覧(検索結果)の、メールアドレスの行の「メール履歴」アイコンを押す */
  async 行のメール履歴を押す(メール: string): Promise<void> {
    const row = resultRow(this.page, メール);
    await expect(row, `会員検索一覧(検索結果)にメールアドレス ${メール} の行が1つある`).toHaveCount(1);
    const a = row.locator('a[href$="/history"]').first();
    await expect(a, "行の「メール履歴」アイコン").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), a.click()]);
  }
  /** 会員検索一覧で語を入れて検索し、メールアドレスの行の「メール履歴」アイコンを押す */
  async 一覧からメール履歴を開く(語: string, メール: string): Promise<void> {
    await this.会員を検索する(語);
    await this.行のメール履歴を押す(メール);
  }
  /** メール配信履歴画面の行（処理日・通知メール・件名。表示の順） */
  async 配信履歴(): Promise<{ 処理日: string; 通知メール: string; 件名: string; モーダルID: string }[]> {
    const rows = this.page.locator("table.table-striped tbody tr").filter({ has: this.page.locator("a.btn-link[data-bs-toggle=modal]") });
    const out: { 処理日: string; 通知メール: string; 件名: string; モーダルID: string }[] = [];
    for (const r of await rows.all()) {
      const tds = r.locator(":scope > td");
      out.push({
        処理日: 整える(await tds.nth(0).innerText()), 通知メール: 整える(await tds.nth(1).innerText()),
        件名: 整える(await tds.nth(2).locator("a.btn-link").first().innerText()),
        モーダルID: ((await tds.nth(2).locator("a.btn-link").first().getAttribute("data-bs-target")) ?? "").replace(/^#/, ""),
      });
    }
    return out;
  }
  /** 件名リンクを押し、出たポップアップの件名と本文を読む */
  async 件名のポップアップ(モーダルID: string): Promise<{ 件名: string; 本文: string }> {
    await this.page.locator(`a.btn-link[data-bs-target="#${モーダルID}"]`).click();
    const m = this.page.locator(`#${モーダルID}`);
    await expect(m, "件名のポップアップ").toBeVisible();
    return { 件名: 整える(await m.locator(".modal-title").innerText()), 本文: (await m.locator(".modal-body p").innerText()).trim() };
  }
}
