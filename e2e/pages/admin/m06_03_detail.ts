/**
 * 店頭買取管理の買取詳細（M06-03）。メニュー「店頭買取管理」→「買取一覧」→ 査定番号のリンク。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 上から「操作履歴」「ステータス変更履歴」「買取情報」「実在庫情報」「査定申込者情報」の枠。枠は見出し（card-header）で特定する。
 * - 実在庫情報は表示モード（#detail_stock_display）と増減数編集モード（#detail_stock_edit）。「編集」を押すと編集モードになり、押下のボタン名は「編集解除」に変わる。
 *   編集解除は確認ダイアログ（OK で破棄して表示モードに戻る）。
 * - 増減数の入力欄は、行の商品コードの行にある。「追加品確定」は編集モード内の送信ボタン、フリーコメントの「保存」は画面下部。
 * - 経理払い出し済・入庫済みにするは、画面下部のボタン（別フォームの送信）。経理払い出し済は確認ダイアログ付き。
 */
import { Dialog, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { withoutEnvBanners } from "./common";

const OPEN = 30_000;

export class OtcDetail {
  constructor(readonly page: Page) {}

  async open(受注ID: string): Promise<void> {
    const res = await this.page.goto(adminUrl(`/otcbuyorder/${受注ID}`), { timeout: 60_000 });
    expect(res?.status() ?? 0, "買取詳細画面の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
    await expect(this.枠("操作履歴"), "買取詳細画面の操作履歴の枠").toBeVisible({ timeout: OPEN });
  }

  /** いまの画面が、その買取の買取詳細か */
  詳細のURL(受注ID: string): RegExp {
    return new RegExp(`/otcbuyorder/${受注ID}(\\?.*)?$`);
  }

  枠(見出し: string): Locator {
    return this.page.locator(".card").filter({ has: this.page.locator(".card-header", { hasText: 見出し }) }).first();
  }

  /** 項目名の行（入れ子の行は除き、いちばん内側の行） */
  private 行(枠: string, 項目名: string): Locator {
    return this.枠(枠).locator(".row").filter({ has: this.page.locator("strong", { hasText: new RegExp(`^\\s*${項目名}\\s*$`) }) })
      .filter({ hasNot: this.page.locator(".row") }).first();
  }

  /** 枠の中の「項目名 → 値」の文（行の1つ目の列が項目名、2つ目以降が値） */
  async 値(枠: string, 項目名: string): Promise<string> {
    const row = this.行(枠, 項目名);
    await expect(row, `「${枠}」の「${項目名}」の行`).toBeVisible({ timeout: OPEN });
    const cols = await row.locator("> div").allInnerTexts();
    return cols.slice(1).join(" ").replace(/\s+/g, " ").trim();
  }

  /** 項目名の行のラジオ（無効かどうか、選択中のラベル） */
  async ラジオ(枠: string, 項目名: string): Promise<{ 選択中: string[]; 全て無効: boolean }> {
    const row = this.行(枠, 項目名);
    const items = row.locator(".form-check");
    const n = await items.count();
    const 選択中: string[] = [];
    let 全て無効 = n > 0;
    for (let i = 0; i < n; i++) {
      const input = items.nth(i).locator("input[type=radio]");
      if (await input.isChecked()) 選択中.push((await items.nth(i).locator("label").innerText()).trim());
      if (await input.isEnabled()) 全て無効 = false;
    }
    return { 選択中, 全て無効 };
  }

  /** 枠の中の表の行（セルの文字列）。見出し行は含まない */
  async 表の行(枠: string, 表の見出し?: string): Promise<string[][]> {
    const scope = 表の見出し
      ? this.枠(枠).locator("table").filter({ has: this.page.locator("th", { hasText: 表の見出し }) }).first()
      : this.枠(枠).locator("table").first();
    const rows = scope.locator("tbody tr");
    const n = await rows.count();
    const out: string[][] = [];
    for (let i = 0; i < n; i++) out.push((await rows.nth(i).locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()));
    return out;
  }

  // ---- 実在庫情報 ----
  readonly 表示モードの表 = () => this.page.locator("#detail_stock_display");
  readonly 編集モードの表 = () => this.page.locator("#detail_stock_edit");
  readonly 編集ボタン = () => this.page.locator("#edit_stock_switch");

  async 実在庫の表示行(): Promise<string[][]> {
    const rows = this.表示モードの表().locator("tbody tr");
    const out: string[][] = [];
    for (let i = 0; i < await rows.count(); i++) out.push((await rows.nth(i).locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()));
    return out;
  }

  async 実在庫の編集行(): Promise<string[][]> {
    const rows = this.編集モードの表().locator("tbody tr");
    const out: string[][] = [];
    for (let i = 0; i < await rows.count(); i++) out.push((await rows.nth(i).locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()));
    return out;
  }

  async 編集を押す(): Promise<void> {
    await this.編集ボタン().click({ timeout: OPEN });
    await expect(this.編集モードの表(), "増減数編集モードの表").toBeVisible({ timeout: OPEN });
  }

  private ダイアログ?: Promise<Dialog>;
  private 押下?: Promise<void>;

  /** 確認ダイアログが出るボタンを押す（ダイアログは出たまま。応えるのは「確認ダイアログに応える」） */
  private async ダイアログつきで押す(btn: Locator): Promise<void> {
    this.ダイアログ = this.page.waitForEvent("dialog", { timeout: OPEN });
    this.押下 = btn.click({ timeout: OPEN * 2 });
    this.押下.catch(() => undefined);
    await this.ダイアログ;
  }

  /** 出ている確認ダイアログに「OK」（accept=true）または「キャンセル」で応える。ダイアログの文を返す */
  async 確認ダイアログに応える(accept: boolean): Promise<string> {
    if (!this.ダイアログ || !this.押下) throw new Error("確認ダイアログが出ていない");
    const dlg = await this.ダイアログ;
    const msg = dlg.message();
    if (accept) await dlg.accept(); else await dlg.dismiss();
    await this.押下;
    this.ダイアログ = undefined; this.押下 = undefined;
    await this.page.waitForLoadState("load");
    await this.page.waitForTimeout(300);
    return msg;
  }

  async 編集解除を押す(): Promise<void> {
    await this.ダイアログつきで押す(this.編集ボタン());
  }

  private 増減数の欄(商品コード: string): Locator {
    return this.編集モードの表().locator("tbody tr").filter({ has: this.page.locator("td", { hasText: new RegExp(`^\\s*${商品コード.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) }).locator('input[type="number"]');
  }

  async 増減数を入れる(商品コード: string, 値: number): Promise<void> {
    const f = this.増減数の欄(商品コード);
    await expect(f, `商品コード ${商品コード} の増減数の欄`).toHaveCount(1, { timeout: OPEN });
    await f.fill(String(値), { timeout: OPEN });
  }

  async 増減数の値(商品コード: string): Promise<string> {
    return this.増減数の欄(商品コード).inputValue({ timeout: OPEN });
  }

  async 全行の増減数に入れる(値: number): Promise<void> {
    const inputs = this.編集モードの表().locator('input[type="number"]');
    const n = await inputs.count();
    for (let i = 0; i < n; i++) await inputs.nth(i).fill(String(値), { timeout: OPEN });
  }

  async 追加品確定を押す(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("load"),
      this.編集モードの表().getByRole("button", { name: "追加品確定", exact: true }).click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
  }

  async 商品追加を押す(): Promise<void> {
    await this.編集モードの表().getByRole("button", { name: "商品追加", exact: true }).click({ timeout: OPEN });
  }

  readonly 商品検索モーダル = () => this.page.locator("#registModal");

  // ---- フリーコメント・保存 ----
  readonly フリーコメント = () => this.枠("査定申込者情報").locator("textarea");

  async フリーコメントを入れる(文: string): Promise<void> {
    await this.フリーコメント().fill(文, { timeout: OPEN });
  }

  async 保存を押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.getByRole("button", { name: "保存", exact: true }).click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 画面下部の操作 ----
  readonly ステータス変更のリンク = () => this.page.getByRole("link", { name: "ステータス変更", exact: true });
  readonly 一覧へ戻るリンク = () => this.page.getByRole("link", { name: "店頭買取一覧", exact: true });
  readonly 経理払い出し済のボタン = () => this.page.getByRole("button", { name: "経理払い出し済", exact: true });
  readonly 入庫済みにするボタン = () => this.page.getByRole("button", { name: "入庫済みにする", exact: true });

  async 経理払い出し済を押す(): Promise<void> {
    await this.ダイアログつきで押す(this.経理払い出し済のボタン());
  }

  async 入庫済みにするを押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.入庫済みにするボタン().click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 開発者ツールの操作の代わり: なりすまし対策トークンの入力要素を消す／値を変える（フォームは id で指す） */
  async トークンを消す(フォームのid: string): Promise<void> {
    const n = await this.page.locator(`form#${フォームのid} input[name="_token"]`).evaluateAll((els) => { els.forEach((e) => e.remove()); return els.length; });
    if (n !== 1) throw new Error(`フォーム ${フォームのid} のなりすまし対策トークンの入力要素が ${n} 個（1個のはず）`);
  }

  async トークンを変える(フォームのid: string, 値: string): Promise<void> {
    const f = this.page.locator(`form#${フォームのid} input[name="_token"]`);
    await expect(f, `フォーム ${フォームのid} のトークン`).toHaveCount(1);
    await f.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }

  /** 画面上部の通知（成功・エラー）の文 */
  async 通知の文(): Promise<{ 成功: string[]; エラー: string[] }> {
    const t = async (sel: string) => (await this.page.locator(sel).allInnerTexts()).map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
    return { 成功: await t(".alert-success"), エラー: withoutEnvBanners(await t(".alert-danger")) }; // 開発用の設定のときに常に出る帯は除く
  }

  // ---- 2026-11-12 追加: 個別入力商品の実在庫情報登録・商品検索モーダル（実在庫情報の商品追加と共通のモーダル #registModal） ----

  /** 個別入力商品情報の表で、商品名の行 */
  個別入力商品の行(商品名: string): Locator {
    const table = this.枠("買取情報").locator("table").filter({ has: this.page.locator("th", { hasText: "実在庫情報登録" }) }).first();
    return table.locator("tbody tr").filter({ has: this.page.locator("td", { hasText: new RegExp(`^\\s*${esc(商品名)}\\s*$`) }) });
  }

  /** 個別入力商品の行の「実在庫情報登録」ボタン（未登録の行だけにある） */
  実在庫登録ボタン(商品名: string): Locator {
    return this.個別入力商品の行(商品名).getByRole("button", { name: "実在庫情報登録", exact: true });
  }

  /** 個別入力商品の行の「実在庫情報登録」ボタンを押して、商品検索モーダルが開くのを待つ */
  async 実在庫登録を押す(商品名: string): Promise<void> {
    const b = this.実在庫登録ボタン(商品名);
    await expect(b, `個別入力商品「${商品名}」の実在庫情報登録ボタン`).toHaveCount(1, { timeout: OPEN });
    await b.click({ timeout: OPEN });
    await expect(this.商品検索モーダル(), "商品検索モーダル").toBeVisible({ timeout: OPEN });
  }

  /** 実在庫情報の増減数編集モードの「商品追加」を押して、商品検索モーダルが開くのを待つ */
  async 商品追加でモーダルを開く(): Promise<void> {
    await this.商品追加を押す();
    await expect(this.商品検索モーダル(), "商品検索モーダル").toBeVisible({ timeout: OPEN });
  }

  readonly モーダルの検索語 = () => this.商品検索モーダル().locator("#admin_search_product_id");
  readonly モーダルのカテゴリ = () => this.商品検索モーダル().locator("#admin_search_product_category_id");
  readonly モーダルの結果 = () => this.商品検索モーダル().locator("#searchProductModalList");
  /** モーダルの結果の、商品ごとの行（決定ボタンのある行） */
  readonly モーダルの結果の行 = () => this.モーダルの結果().locator("tr").filter({ has: this.page.locator("button.add-order-item") });

  /** モーダルの「商品名・ID・コード」に入れ（null なら変えない）、カテゴリを表示名で選び（null なら変えない）、検索を押して結果が出るのを待つ */
  async モーダルで検索する(語: string | null, カテゴリ: string | null = null): Promise<void> {
    if (語 !== null) await this.モーダルの検索語().fill(語, { timeout: OPEN });
    if (カテゴリ !== null) {
      const opts = await this.モーダルのカテゴリ().locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").replace(/[\s　]+/g, " ").trim() })));
      const hit = opts.filter((o) => o.v !== "" && o.t.replace(/^[└├─│\s]+/, "") === カテゴリ);
      if (hit.length !== 1) throw new Error(`商品検索モーダルのカテゴリに「${カテゴリ}」の選択肢が ${hit.length} 件（1件のはず）`);
      await this.モーダルのカテゴリ().selectOption(hit[0].v, { timeout: OPEN });
    }
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/search\/product$/.test(new URL(r.url()).pathname), { timeout: 60_000 });
    await this.商品検索モーダル().locator("#searchProductModalButton").click({ timeout: OPEN });
    const r = await res;
    expect(r.status(), "商品検索の応答").toBeLessThan(400);
    await expect(this.モーダルの結果().locator("table"), "商品検索モーダルの検索結果の表").toHaveCount(1, { timeout: 60_000 });
  }

  /** モーダルの結果（商品ID・商品名・商品コードの選択肢） */
  async モーダルの結果を読む(): Promise<{ 商品ID: string; 商品名: string; 選択肢: { 値: string; 表示: string; 商品コード: string }[] }[]> {
    return this.モーダルの結果の行().evaluateAll((trs) => trs.map((tr) => {
      const tds = Array.from(tr.querySelectorAll(":scope > td"));
      const opts = Array.from(tr.querySelectorAll('select[name="product_class"] option')) as HTMLOptionElement[];
      return {
        商品ID: (tds[0]?.textContent ?? "").replace(/\s+/g, " ").trim(),
        商品名: (tds[1]?.textContent ?? "").replace(/\s+/g, " ").trim(),
        選択肢: opts.map((o) => ({ 値: o.value, 表示: (o.textContent ?? "").replace(/\s+/g, " ").trim(), 商品コード: o.dataset.productCode ?? "" })),
      };
    }));
  }

  /** 商品コードの規格を持つ結果の行 */
  モーダルの規格の行(商品コード: string): Locator {
    return this.モーダルの結果の行().filter({ has: this.page.locator(`option[data-product-code="${商品コード}"]`) });
  }

  /** 結果の行で、商品コードの規格を選ぶ（その行を返す） */
  async モーダルで規格を選ぶ(商品コード: string): Promise<Locator> {
    const row = this.モーダルの規格の行(商品コード);
    await expect(row, `商品検索の結果に商品コード「${商品コード}」の規格を持つ商品が1件`).toHaveCount(1, { timeout: OPEN });
    const value = await row.locator(`option[data-product-code="${商品コード}"]`).first().getAttribute("value");
    if (!value) throw new Error(`商品コード「${商品コード}」の選択肢に値が無い`);
    await row.locator('select[name="product_class"]').selectOption(value, { timeout: OPEN });
    return row;
  }

  /** 開発者ツールの操作の代わり: 選んでいる規格の選択肢の値（送られる商品規格ID）を書き換える */
  async 選んだ規格の値を変える(row: Locator, 値: string): Promise<void> {
    const sel = row.locator('select[name="product_class"]');
    await sel.evaluate((s, v) => {
      const e = s as HTMLSelectElement;
      const o = e.selectedOptions[0];
      if (!o) throw new Error("規格が選ばれていない");
      o.value = v;
      e.value = v;
    }, 値);
    expect(await sel.inputValue(), "書き換えた商品規格IDの値").toBe(値);
  }

  /**
   * 開発者ツールの操作の代わり: 実在庫情報登録の送信フォーム（決定を押すと画面のスクリプトが作って送る）の、なりすまし対策トークンを
   * 消す（null）・値を変える。フォームは押した瞬間に作られて送られるので、フォームを送る関数を差し替えて、送る直前に細工する
   * （送信先が実在庫情報登録のフォームだけ。ほかのフォームはそのまま送る）。
   */
  async 実在庫登録のトークンを細工する(値: string | null): Promise<void> {
    await this.page.evaluate((v) => {
      const proto = HTMLFormElement.prototype as unknown as { submit: () => void; __m0603?: boolean };
      if (proto.__m0603) throw new Error("送信の差し替えは1度だけ");
      const orig = proto.submit;
      proto.submit = function (this: HTMLFormElement) {
        if (/register-individual-stock/.test(this.action)) {
          const t = this.querySelector('input[name="_token"]') as HTMLInputElement | null;
          if (!t) throw new Error("実在庫情報登録の送信フォームにトークンの入力要素が無い");
          if (v === null) t.remove(); else t.value = v;
        }
        return orig.call(this);
      };
      proto.__m0603 = true;
    }, 値);
  }

  /**
   * 送信を見張る。pathname が re に当たる POST の要求を待つ関数を返す（要求の本文と、応答の状態を返す）。
   * 更新を拒否されるケースで、操作が送られずに「変わらない」で合格になるのを防ぐため、要求が送られたことを確かめるのに使う。
   */
  送信を見張る(re: RegExp): () => Promise<{ 本文: string; 状態: number }> {
    const req = this.page.waitForRequest((r) => r.method() === "POST" && re.test(new URL(r.url()).pathname), { timeout: 60_000 });
    req.catch(() => undefined);
    return async () => {
      const r = await req;
      const res = await r.response();
      return { 本文: r.postData() ?? "", 状態: res?.status() ?? 0 };
    };
  }

  /** モーダルの結果の行の「決定」を押す（実在庫情報登録のモード: 画面のスクリプトが送信して画面が移る） */
  async 決定して送る(row: Locator): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000}),
      row.locator("button.add-order-item").click({ timeout: OPEN, noWaitAfter: true }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** モーダルの結果の行の「決定」を押す（商品追加のモード: モーダルが閉じ、増減数編集モードの表に行が足される） */
  async 決定して足す(row: Locator): Promise<void> {
    await row.locator("button.add-order-item").click({ timeout: OPEN });
    await expect(this.商品検索モーダル(), "商品検索モーダルが閉じる").toBeHidden({ timeout: OPEN });
  }

  /** 増減数編集モードで、商品追加で足された行（画面のスクリプトが足した行） */
  readonly 足された行 = () => this.編集モードの表().locator("tbody tr.js-added-stock-row");

  /** 足された行の増減数の欄に入れる */
  async 足された行の増減数を入れる(商品コード: string, 値: number): Promise<void> {
    const f = this.足された行().filter({ has: this.page.locator("td", { hasText: new RegExp(`^\\s*${esc(商品コード)}\\s*$`) }) }).locator('input[type="number"]');
    await expect(f, `足した商品コード ${商品コード} の増減数の欄`).toHaveCount(1, { timeout: OPEN });
    await f.fill(String(値), { timeout: OPEN });
  }

  /** 入庫済みにするを押し、その送信の応答の状態を返す（送られたことを確かめる） */
  async 入庫済みにするを押して応答を待つ(): Promise<number> {
    const [res] = await Promise.all([
      this.page.waitForResponse((r) => r.request().method() === "POST" && /\/otcbuyorder\/\d+\/restocked$/.test(new URL(r.url()).pathname), { timeout: 60_000 }),
      this.入庫済みにするボタン().click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
    return res.status();
  }
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 画面の通知・本文から、権限で止められたことを示す文を探す（「この機能は管理者によって制限されています。」・アクセス拒否の画面「アクセスできません。」） */
export async function 権限エラーの文(page: Page): Promise<string[]> {
  const alerts = withoutEnvBanners((await page.locator(".alert-danger").allInnerTexts()).map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean));
  const body = ((await page.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ");
  const found = alerts.filter((t) => t.includes("制限されています"));
  for (const w of ["この機能は管理者によって制限されています", "アクセスできません"]) {
    if (body.includes(w) && !found.some((f) => f.includes(w))) found.push(w);
  }
  return found;
}

/** 金額などの表示から数字だけを取り出す（「¥ 2,200」→ 2200） */
export const 数 = (t: string): number => Number(t.replace(/[^\d.-]/g, ""));

/** 送信を見張るときの送信先（アドレスの形） */
export const 送信先 = {
  詳細の更新: /\/otcbuyorder\/\d+\/update$/,
  実在庫情報登録: /\/otcbuyorder\/\d+\/register-individual-stock\/\d+$/,
  経理払い出し済: /\/otcbuyorder\/\d+\/account_team_paid$/,
} as const;

/** 送られた内容（フォームの本文）から、項目の値を読む。項目が無ければ null */
export function 送られた値(本文: string, 項目: "商品規格ID" | "トークン"): string | null {
  const name = 項目 === "商品規格ID" ? "product_class_id" : "_token";
  const p = new URLSearchParams(本文);
  return p.has(name) ? p.get(name) : null;
}
