/**
 * M08-05 ポイント付与・M08-06 ポイント履歴確認・M08-07 メール配信履歴の画面操作。セレクタはここだけに書く。
 * ポイント付与画面（/customer/point/{会員ID}/select）→「キャンペーン、特別対応によるポイント付与」（…/granted）・「返金によるポイント付与」（…/purchase）。
 * ポイント履歴確認画面は …/history（付与のフォームが無い）。メール配信履歴画面は /customer/mail/{会員ID}/history。
 * メール一括送信の操作は M08-02 の部品（pages/admin/m08_customer_mail.ts）を使う。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { M08CustomerMailPage } from "./m08_customer_mail";
import { searchCustomer } from "./f06_customer";

const T = 30_000;
export type ポイントの画面 = "select" | "granted" | "purchase" | "history";

export class PointPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get パス(): string { return new URL(this.page.url()).pathname; }

  /** ポイント付与画面・キャンペーン画面・返金画面・履歴確認画面をアドレスで開く。応答を返す */
  async 開く(会員ID: string, 画面: ポイントの画面): Promise<Response | null> {
    const res = await this.page.goto(adminUrl(`/customer/point/${会員ID}/${画面}`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }
  /** いまのアドレスの会員IDだけを置き換えて開く。応答を返す */
  async 会員IDを置き換えて開く(会員ID: string): Promise<Response | null> {
    const u = new URL(this.page.url());
    u.pathname = u.pathname.replace(/\/customer\/point\/\d+\//, `/customer/point/${会員ID}/`);
    const res = await this.page.goto(u.toString(), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }

  get キャンペーンのリンク(): Locator { return this.page.locator("a.point-type-select").filter({ hasText: /キャンペーン/ }).first(); }
  get 返金のリンク(): Locator { return this.page.locator("a.point-type-select").filter({ hasText: /返金/ }).first(); }
  get 会員編集画面に戻る(): Locator { return this.page.locator(".c-conversionArea a.c-baseLink").first(); }

  /** リンク・ボタンを押して移った先の応答を返す（移らなければ null） */
  async 押して移る(l: Locator): Promise<Response | null> {
    await expect(l, "押す要素").toHaveCount(1, { timeout: T });
    const [res] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => null),
      l.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    return res;
  }

  // ---- 付与のフォーム（キャンペーン・返金の画面） ----
  get フォーム(): Locator { return this.page.locator("#pointFormInfo"); }
  get フォームの開閉(): Locator { return this.page.locator('a[data-bs-toggle="collapse"][href="#pointFormInfo"]'); }
  get 注文番号(): Locator { return this.page.locator("#admin_customer_point_orderNumber"); }
  get 増減量(): Locator { return this.page.locator("#admin_customer_point_pointChange"); }
  get 備考(): Locator { return this.page.locator("#admin_customer_point_note"); }
  get 発行日(): Locator { return this.page.locator("#admin_customer_point_issueDate"); }

  /** 開閉の部品を押し、開閉の動き（bootstrap の collapse）が落ち着くまで待つ */
  async 開閉を押す(): Promise<void> {
    await this.フォームの開閉.click({ timeout: T });
    await this.page.waitForFunction(() => !document.querySelector("#pointFormInfo.collapsing"), undefined, { timeout: T });
    await this.page.waitForTimeout(300);
  }
  async フォームが見えるか(): Promise<boolean> { return this.増減量.isVisible(); }
  /** 付与のフォームが見えていなければ開閉の部品を押して見せる。押したかを返す */
  async フォームを見せる(): Promise<boolean> {
    if (await this.フォームが見えるか()) return false;
    await this.開閉を押す();
    await expect(this.増減量, "ポイント追加フォームのポイント増減量の欄").toBeVisible({ timeout: T });
    return true;
  }
  async 備考の選択肢(): Promise<string[]> {
    return (await this.備考.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
  async 備考の選ばれている値(): Promise<string> {
    return this.備考.evaluate((s) => { const e = s as HTMLSelectElement; return e.options[e.selectedIndex]?.textContent?.trim() ?? ""; });
  }

  /** いまの画面（キャンペーン・返金）で付与のフォームに入れて保存する。発行日は YYYY-MM-DD */
  async 付与する(v: { 注文番号?: string; 増減量: number; 備考: string; 発行日: string }, what: string): Promise<void> {
    await this.フォームを見せる();
    if (v.注文番号) await this.注文番号.fill(v.注文番号, { timeout: T });
    await this.増減量.fill(String(v.増減量), { timeout: T });
    await this.備考.selectOption({ label: v.備考 }, { timeout: T });
    await this.発行日.fill(v.発行日, { timeout: T });
    await this.発行日.press("Escape").catch(() => undefined);
    await expect(this.発行日, `${what}: ポイント発行日`).toHaveValue(v.発行日);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }),
      this.page.locator("form[name=customer_point_form] button[type=submit]").click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    await expectSaved(this.page, what);
  }

  // ---- ポイント残高・履歴の一覧 ----
  /** 「ポイント残高: Npt」の N（読めなければ null） */
  async ポイント残高(): Promise<number | null> {
    const t = await this.page.locator(".card-header").filter({ hasText: "ポイント残高" }).first().innerText({ timeout: T }).catch(() => "");
    const m = /ポイント残高[:：]\s*(-?[\d,]+)\s*pt/.exec(t);
    return m ? Number(m[1].replace(/,/g, "")) : null;
  }
  get 履歴の行(): Locator { return this.page.locator("#pointHistory table tbody tr"); }
  /** 履歴の一覧の見出し（列の名前） */
  async 履歴の見出し(): Promise<string[]> {
    return (await this.page.locator("#pointHistory table thead th").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  /** 履歴の一覧の行（上から順に。列: ID・会員名・注文番号・増減量・備考・発行日・設定日・有効期限） */
  async 履歴(): Promise<{ ID: string; 会員名: string; 注文番号: string; 増減量: string; 備考: string; 発行日: string; 設定日: string; 有効期限: string; 注文番号のリンク: number }[]> {
    const out = [];
    for (const r of await this.履歴の行.all()) {
      const td = (await r.locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
      out.push({
        ID: td[0] ?? "", 会員名: td[1] ?? "", 注文番号: td[2] ?? "", 増減量: td[3] ?? "", 備考: td[4] ?? "", 発行日: td[5] ?? "", 設定日: td[6] ?? "", 有効期限: td[7] ?? "",
        注文番号のリンク: await r.locator("td").nth(2).locator("a").count(),
      });
    }
    return out;
  }
  /** 履歴の行の注文番号の欄のリンク */
  注文番号のリンク(履歴ID: string): Locator {
    return this.履歴の行.filter({ has: this.page.locator("td:first-child", { hasText: new RegExp(`^\\s*${履歴ID}\\s*$`) }) }).locator("td").nth(2).locator("a");
  }
  /** ページ送りの操作部の数 */
  async ページ送りの数(): Promise<number> { return this.page.locator(".pagination, ul.pagination, nav[aria-label*=page]").count(); }
}

/** 会員検索一覧(検索結果)で、会員の行の「メール履歴」のアイコンを押す */
export async function メール履歴のアイコンを押す(page: Page, 会員ID: string): Promise<void> {
  const icon = page.locator(`tr#ex-customer-${会員ID} a[href*="/customer/mail/${会員ID}/history"]`);
  await expect(icon, `会員ID ${会員ID} の行の「メール履歴」アイコン`).toHaveCount(1, { timeout: T });
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), icon.click({ timeout: T })]);
  await page.waitForLoadState("load");
}

/** 会員検索一覧から会員を選んでメール一括送信で1通送る（M08-02 の部品）。宛先は E2E の会員だけ */
export async function 会員にメールを送る(page: Page, メール: string, 会員ID: string, 件名: string, 本文: string, what: string): Promise<void> {
  await searchCustomer(page, メール);
  const m = new M08CustomerMailPage(page);
  await m.一覧で選ぶ([会員ID]);
  const r = await m.その他からメール一括送信を押す();
  if (!r.遷移した || !(await m.入力画面である())) throw new Error(`${what}: メール一括送信の画面へ移れない（ダイアログ: ${r.ダイアログ ?? "なし"}）`);
  await m.入力する(件名, 本文);
  await m.送信内容を確認を押す();
  const 宛先 = await m.配信対象者();
  if (宛先.length !== 1 || 宛先[0].会員ID !== 会員ID) throw new Error(`${what}: 配信対象者が会員ID ${会員ID} の1人でない（${JSON.stringify(宛先)}）`);
  await m.メール送信を押す();
  if (!(await m.完了画面である())) throw new Error(`${what}: メール送信の完了画面にならない`);
}

/** メール配信履歴画面 */
export class MailHistoryPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  async 開く(会員ID: string): Promise<Response | null> {
    const res = await this.page.goto(adminUrl(`/customer/mail/${会員ID}/history`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }
  get 絞り込み(): Locator { return this.page.locator("#template-change"); }
  get 行(): Locator { return this.page.locator("table tbody tr"); }
  /** 一覧の行（上から順に。列: 処理日・通知メール・件名） */
  async 一覧(): Promise<{ 処理日: string; 通知メール: string; 件名: string }[]> {
    const out = [];
    for (const r of await this.行.all()) {
      const td = (await r.locator("> td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
      const 件名 = ((await r.locator("> td").nth(2).locator("a.btn-link").first().innerText().catch(() => "")) ?? "").trim();
      out.push({ 処理日: td[0] ?? "", 通知メール: td[1] ?? "", 件名 });
    }
    return out;
  }
  async 絞り込みの選択肢(): Promise<{ 値: string; 名前: string }[]> {
    return this.絞り込み.locator("option").evaluateAll((os) => os.map((o) => ({ 値: (o as HTMLOptionElement).value, 名前: (o.textContent ?? "").trim() })));
  }
  async 絞り込みの選ばれている値(): Promise<string> { return this.絞り込み.inputValue({ timeout: T }); }
  /** 「テンプレートで絞り込む」でテンプレートIDを選ぶ（選ぶと画面のスクリプトが送信して読み込み直す）。読み込み直したかを返す */
  async 絞り込みを選ぶ(テンプレートID: string): Promise<boolean> {
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 }).then(() => true, () => false);
    await this.絞り込み.selectOption(テンプレートID, { timeout: T });
    const moved = await nav;
    await this.page.waitForLoadState("load");
    return moved;
  }
  件名のリンク(件名: string): Locator { return this.page.locator("a.btn-link", { hasText: 件名 }).first(); }
  get 開いているポップアップ(): Locator { return this.page.locator(".modal.show"); }
  async 件名を押す(件名: string): Promise<{ 件名: string; 本文: string }> {
    await this.件名のリンク(件名).click({ timeout: T });
    const m = this.開いているポップアップ;
    await expect(m, "件名リンクのポップアップ").toBeVisible({ timeout: T });
    return { 件名: (await m.locator(".modal-title").innerText()).trim(), 本文: (await m.locator("p.text-start").innerText()).trim() };
  }
  async ポップアップを閉じる(): Promise<void> {
    await this.開いているポップアップ.locator("button[data-bs-dismiss=modal]").click({ timeout: T });
    await expect(this.開いているポップアップ, "ポップアップが閉じた").toHaveCount(0, { timeout: T });
  }
}
