/**
 * M05-08 スタック用紙印刷（受注一覧の検索結果から受注を選んで押し、窓が閉じるまでを見る）。
 * 受付の応答・ダイアログ・窓の開閉を記録する。ブラウザの開発者ツールでの要求の書き換え・遮断は、通信の途中で書き換えて代える。
 */
import { expect, Page } from "@playwright/test";
import { OrderSearchPage } from "./m05_01_order_search_k";

/** スタック用紙印刷受付の応答（窓の中の通信を、通りがけに記録する） */
export type 受付の応答 = { ステータス: number; 形式: string; 本文: string; 送った内容: string };

type 書き換え = (p: URLSearchParams) => void;

export class OrderListStackFlow {
  readonly dialogs: string[] = [];
  /** 窓の画面（スタック用紙印刷中の画面）を取りに行った要求の数 */
  窓の要求 = 0;
  readonly 受付: 受付の応答[] = [];
  開いた窓 = 0;
  遮断した回数 = 0;
  private 書き換え: 書き換え | null = null;
  private 遮断 = false;
  private 窓: Page | null = null;

  constructor(private readonly page: Page) {}

  /** 通信の記録・ダイアログの受け取りを始める（ログイン後、一覧を開く前に呼ぶ） */
  async 準備(): Promise<void> {
    const ctx = this.page.context();
    const onDialog = (p: Page) => p.on("dialog", (d) => { this.dialogs.push(d.message().replace(/\s+/g, " ")); void d.accept(); });
    onDialog(this.page);
    ctx.on("page", (p) => { this.開いた窓 += 1; this.窓 = p; onDialog(p); });
    ctx.on("request", (r) => { if (/\/order\/print\/stack\/window(\?|$)/.test(r.url())) this.窓の要求 += 1; });
    // 受付（POST）だけを通りがけに記録し、必要なら要求を書き換える・遮断する。窓の画面（/window）は対象にしない
    await ctx.route(/\/order\/print\/stack(\?.*)?$/, async (route) => {
      if (this.遮断) { this.遮断した回数 += 1; await route.abort("failed"); return; }
      let postData = route.request().postData() ?? "";
      if (this.書き換え) { const p = new URLSearchParams(postData); this.書き換え(p); postData = p.toString(); }
      const res = await route.fetch({ postData });
      const body = await res.text();
      this.受付.push({ ステータス: res.status(), 形式: res.headers()["content-type"] ?? "", 本文: body, 送った内容: postData });
      await route.fulfill({ response: res, body });
    });
  }

  /** 受注情報検索 一覧(検索入力)画面を開き、注文者名で検索して、結果の一覧を出す */
  async 開いて検索する(注文者名: string): Promise<void> {
    const p = new OrderSearchPage(this.page);
    await p.open();
    await p.name.fill(注文者名);
    await p.clickSearch();
  }

  /** 受注IDの行のチェックを入れる */
  async 選ぶ(受注ID: string): Promise<void> {
    const box = this.page.locator(`#search_result input[name="ids[]"][data-order-id="${受注ID}"]`);
    await expect(box, `受注ID ${受注ID} の行のチェック`).toHaveCount(1);
    await box.check();
  }

  /** 検索結果にある、受注IDの行の数 */
  async 行の数(受注ID: string): Promise<number> {
    return this.page.locator(`#search_result input[name="ids[]"][data-order-id="${受注ID}"]`).count();
  }

  // ---- 要求の書き換え（押す前に呼ぶ） ----
  トークンを外す(): void { this.書き換え = (p) => { p.delete("_token"); }; }
  トークンを変える(値: string): void { this.書き換え = (p) => { p.set("_token", 値); }; }
  /** 送る選択の値（ids）を、指定の1件に置き換える。選択の値は配送の番号 */
  選択の値を置き換える(値: string): void { this.書き換え = (p) => { p.delete("ids[]"); p.delete("ids"); p.append("ids[]", 値); }; }
  /** 担当者IDの項目を足す（受付の要求にもともと担当者の項目は無い） */
  担当者IDを足す(値: string): void { this.書き換え = (p) => { p.set("operator_id", 値); p.set("member_id", 値); }; }
  通信を遮断する(): void { this.遮断 = true; }
  書き換えを戻す(): void { this.書き換え = null; this.遮断 = false; }

  /**
   * スタック用紙印刷ボタンを押し、窓が開いて閉じる（または開かない）まで待つ。
   * 窓が開いたあと、60秒たっても閉じないときは、閉じていないまま戻る。
   */
  async 押して終わりを待つ(): Promise<void> {
    const before = this.開いた窓;
    const button = this.page.locator("#printStack");
    await expect(button, "スタック用紙印刷ボタン").toBeVisible();
    await button.click();
    const limit = Date.now() + 5_000;
    while (this.開いた窓 === before && Date.now() < limit) await this.page.waitForTimeout(200);
    if (this.開いた窓 === before) { await this.page.waitForTimeout(500); return; }
    const popup = this.窓;
    const end = Date.now() + 60_000;
    while (popup && !popup.isClosed() && Date.now() < end) await this.page.waitForTimeout(250);
  }

  /** 元の画面以外の窓が、すべて閉じているか */
  窓が閉じているか(): boolean {
    return this.page.context().pages().filter((p) => p !== this.page && !p.isClosed()).length === 0;
  }
}
