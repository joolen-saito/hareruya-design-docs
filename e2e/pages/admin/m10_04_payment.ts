/** 支払方法設定（メニュー「設定」→「店舗設定」→「支払方法設定」）。M10-04 の画面操作。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { PurchaseGroupPage } from "./m03_22_purchase_group";

const LIST = "/setting/shop/payment";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sel = (n: string) => `[name="payment_register[${n}]"]`;

/** 手元に正本の「M10-04連携試験テンプレート」を作る画面操作（メール種別を選ぶ作り）は重いので、既存のメールテンプレートで代える */
export const メール日 = "【販売/日】注文確認-銀行振込";
export const メール英 = "【販売/英】注文確認-銀行振込";

export type 支払方法の入力 = { 方法: string; 英: string; 手数料: string; 下限?: string; 上限?: string };

const B64 = {
  png: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  gif: "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  jpg: "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
};
/** 1MB以下の有効な小さい画像（名前の拡張子で形式を決める） */
export function 画像(name: string): { name: string; mimeType: string; buffer: Buffer } {
  const ext = name.split(".").pop()!.toLowerCase() as "png" | "gif" | "jpg";
  const mime = { png: "image/png", gif: "image/gif", jpg: "image/jpeg" }[ext];
  return { name, mimeType: mime, buffer: Buffer.from(B64[ext], "base64") };
}

export class PaymentPage {
  constructor(readonly page: Page) {}

  async openList(): Promise<void> {
    await this.page.goto(adminUrl(LIST), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("li.sortable-item").first(), "支払方法一覧").toBeVisible({ timeout: 30_000 });
  }
  async openNew(): Promise<void> {
    await this.page.goto(adminUrl(`${LIST}/new`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator(sel("method")), "支払方法の編集画面の支払方法欄").toBeVisible({ timeout: 30_000 });
  }
  行(名前: string): Locator {
    return this.page.locator("li.sortable-item").filter({ has: this.page.locator("div.col-2 a", { hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }) });
  }
  async 新規登録ボタンを押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.locator('a[href$="/payment/new"]').first().click({ timeout: 30_000 })]);
    await expect(this.page.locator(sel("method"))).toBeVisible({ timeout: 30_000 });
  }
  get 支払方法欄() { return this.page.locator(sel("method")); }
  get 手数料欄() { return this.page.locator(sel("charge")); }
  async 入れる(v: 支払方法の入力, メール = { 日: メール日, 英: メール英 }): Promise<void> {
    await this.page.locator(sel("method")).fill(v.方法, { timeout: 30_000 });
    await this.page.locator(sel("payment_method_en")).fill(v.英, { timeout: 30_000 });
    await this.page.locator(sel("charge")).fill(v.手数料, { timeout: 30_000 });
    await this.page.locator(sel("mail_template_jp")).selectOption({ label: メール.日 }, { timeout: 30_000 });
    await this.page.locator(sel("mail_template_en")).selectOption({ label: メール.英 }, { timeout: 30_000 });
    await this.page.locator(sel("rule_min")).fill(v.下限 ?? "", { timeout: 30_000 });
    await this.page.locator(sel("rule_max")).fill(v.上限 ?? "", { timeout: 30_000 });
  }
  get 登録ボタン() { return this.page.locator("form#form1 button[type=submit]").first(); }
  async 登録を押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.登録ボタン.click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  /** 登録後の編集画面のアドレスから支払方法IDを読む */
  idFromUrl(): string {
    const m = new URL(this.page.url()).pathname.match(/\/payment\/(\d+)\/edit$/);
    if (!m) throw new Error(`支払方法の編集画面に移っていない（${this.page.url()}）`);
    return m[1];
  }
  /** ロゴ画像欄のファイル選択（画面の部品が作る入力欄）へファイルを渡す */
  async ロゴを選ぶ(f: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    const input = this.page.locator("input.filepond--browser[type=file]");
    await expect(input, "ロゴ画像のファイル選択欄").toHaveCount(1, { timeout: 30_000 });
    await input.setInputFiles(f, { timeout: 30_000 });
  }
  get ロゴのプレビュー() { return this.page.locator(".filepond--item"); }
  get ロゴの値() { return this.page.locator(sel("payment_image")); }
  /** ロゴ画像のプレビューの削除（取消）操作 */
  async ロゴを取り消す(): Promise<void> {
    const 取消 = this.page.locator(".filepond--action-revert-item-processing");
    // アップロード済みの画像は「取り消し（revert）」のボタン、そうでなければ「削除」のボタンで外す
    if ((await 取消.count()) > 0) await 取消.first().click({ timeout: 30_000 });
    else await this.page.locator(".filepond--action-remove-item").first().click({ timeout: 30_000 });
    await expect(this.ロゴのプレビュー, "取り消したあとのプレビュー").toHaveCount(0, { timeout: 30_000 });
  }

  /** 一覧の行の読み取り */
  async 行を読む(行: Locator): Promise<{ ID: string; 名称: string; 手数料: string; 利用条件: string; 操作: string[] }> {
    const cells = row_cells(行);
    return {
      ID: ((await cells.id.innerText()) ?? "").trim(),
      名称: ((await 行.locator("div.col-2 a").innerText()) ?? "").trim(),
      手数料: ((await 行.locator("div.col-1").innerText()) ?? "").replace(/\s+/g, " ").trim(),
      利用条件: ((await 行.locator("div.col.d-flex").innerText()) ?? "").replace(/\s+/g, " ").trim(),
      操作: await 行.locator("div.col-3 a, div.col-3 [data-bs-target]").evaluateAll((els) => els.map((e) => (e.getAttribute("data-bs-original-title") || e.getAttribute("title") || e.getAttribute("aria-label") || e.className).trim())),
    };
  }

  /** 行の削除を押して、確認モーダルを開く（文を返す） */
  async 削除を押す(行: Locator): Promise<{ 文: string }> {
    await expect(行, "削除する支払方法の行").toHaveCount(1, { timeout: 30_000 });
    await this.page.waitForLoadState("load");
    await 行.locator('a[data-bs-target="#DeleteModal"]').click({ timeout: 30_000 });
    const modal = this.page.locator("#DeleteModal");
    await expect(modal, "削除確認モーダル").toBeVisible({ timeout: 30_000 });
    const confirm = modal.locator('a.btn-ec-delete[data-method="delete"]');
    await expect.poll(async () => (await confirm.getAttribute("href")) ?? "#", "削除確認モーダルの削除の送り先（開き終わると入る）").toMatch(/payment\/\d+\/delete/);
    return { 文: ((await modal.locator("p.modal-message").innerText()) ?? "").trim() };
  }
  get 削除ボタン() { return this.page.locator('#DeleteModal a.btn-ec-delete[data-method="delete"]'); }
  async モーダルで削除する(): Promise<number | null> {
    const resp = this.page.waitForResponse((r) => r.request().method() === "POST" && /payment\/\d+\/delete$/.test(r.url()), { timeout: 60_000 });
    const nav = this.page.waitForLoadState("load");
    await this.削除ボタン.click({ timeout: 30_000 });
    const r = await resp; await nav;
    return r.status();
  }
  async なりすまし対策トークンを書き換える(token: string): Promise<void> {
    await expect(this.削除ボタン, "削除ボタンのなりすまし対策トークン").toHaveAttribute("token-for-anchor", /.+/);
    await this.削除ボタン.evaluate((a, t) => a.setAttribute("token-for-anchor", t), token);
  }

  /** 画面の部品を介さず、ロゴ画像の追加の要求を、画面から読んだなりすまし対策トークンで送る（開発者ツールのコンソールからの送信に当たる） */
  async 画像追加を送る(f: { name: string; mimeType: string; buffer: Buffer }, opt: { 非同期の見出し: boolean }): Promise<{ status: number; body: string }> {
    return this.page.evaluate(async ({ name, mimeType, b64, async }) => {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const fd = new FormData();
      fd.append("payment_register[payment_image_file]", new Blob([bin], { type: mimeType }), name);
      const headers: Record<string, string> = { "ECCUBE-CSRF-TOKEN": document.querySelector('meta[name="eccube-csrf-token"]')!.getAttribute("content")! };
      if (async) headers["X-Requested-With"] = "XMLHttpRequest";
      const res = await fetch(location.pathname.replace(/\/payment\/.*$/, "/payment/image/process"), { method: "POST", headers, body: fd });
      return { status: res.status, body: (await res.text()).slice(0, 200) };
    }, { name: f.name, mimeType: f.mimeType, b64: f.buffer.toString("base64"), async: opt.非同期の見出し });
  }

  /** 購入グループ管理画面の支払方法の選択肢 */
  async 購入グループの選択肢(): Promise<string[]> {
    const g = new PurchaseGroupPage(this.page);
    await g.openNew();
    return g.支払方法.evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? (n as HTMLInputElement).value));
  }
}

function row_cells(行: Locator) { return { id: 行.locator("div.col-auto.d-flex").nth(1) }; }
