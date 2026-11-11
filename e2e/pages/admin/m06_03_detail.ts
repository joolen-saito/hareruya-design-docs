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
    return { 成功: await t(".alert-success"), エラー: await t(".alert-danger") };
  }
}

/** 金額などの表示から数字だけを取り出す（「¥ 2,200」→ 2200） */
export const 数 = (t: string): number => Number(t.replace(/[^\d.-]/g, ""));
