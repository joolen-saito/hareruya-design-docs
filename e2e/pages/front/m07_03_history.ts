/**
 * フロントのマイページの買取履歴一覧と、ネット買取の買取履歴詳細（M07-03 の会員側の確認）。
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 一覧（/ja/mypage/purchase_history）は買取ごとの箱に、買取番号のリンク・買取依頼内容・処理状態・買取金額合計を出す。
 * - 詳細（/ja/mypage/purchase_history/net/<買取の番号>）は、えらんで買取の明細（商品名・査定価格・数量・小計・売却する/しない）を出す。
 */
import { expect, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const OPEN = 30_000;
const front = (p: string) => `${BASE_URL}/ja${p}`;

export type 明細 = { 商品名: string; 査定価格: string; 数量: string; 小計: string; 売却: string };

export class NetHistoryPage {
  constructor(readonly page: Page) {}

  async 一覧を開く(): Promise<void> {
    const res = await this.page.goto(front("/mypage/purchase_history"), { timeout: 60_000 });
    expect(res?.status() ?? 0, "買取履歴一覧画面の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
  }

  /** 一覧の、買取の番号（数字）の箱 */
  private 箱(番号: string) {
    return this.page.locator(".p-hareruya-history-list__box").filter({ has: this.page.locator(`a[href$="/mypage/purchase_history/net/${Number(番号)}"]`) }).first();
  }

  /** 買取番号のリンクを押して買取履歴詳細画面を開く */
  async 詳細を開く(番号: string): Promise<void> {
    const link = this.page.locator(`a.c-hareruya-link[href$="/mypage/purchase_history/net/${Number(番号)}"]`).first();
    await expect(link, `買取履歴一覧の買取番号（${番号}）のリンク`).toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 一覧の箱の項目（処理状態・買取金額合計・買取依頼内容の文） */
  async 箱の文(番号: string): Promise<{ 全文: string; 処理状態: string; 買取金額合計: string; 買取依頼内容: string }> {
    const box = this.箱(番号);
    await expect(box, `買取履歴一覧の買取番号（${番号}）の箱`).toBeVisible({ timeout: OPEN });
    const rows = await box.locator(".p-hareruya-history-list__order-info-row").evaluateAll((rs) => rs.map((r) => ({
      見出し: (r.querySelector("dt")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      値: (r.querySelector("dd")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    })));
    const v = (re: RegExp) => rows.find((r) => re.test(r.見出し))?.値 ?? "";
    return {
      全文: (await box.innerText()).replace(/\s+/g, " ").trim(),
      処理状態: v(/処理状態|ステータス|状態/), 買取金額合計: v(/金額/), 買取依頼内容: v(/依頼内容|内容|商品/),
    };
  }

  /** 詳細の、えらんで買取の明細（上から順） */
  async 明細(): Promise<明細[]> {
    const rows = this.page.locator(".p-hareruya-purchase-list__item--select .p-hareruya-purchase-list__row");
    if ((await rows.count()) === 0) return [];
    return rows.evaluateAll((rs) => rs.map((r) => {
      const t = (sel: string) => (r.querySelector(sel)?.textContent ?? "").replace(/\s+/g, " ").trim();
      const sel = r.querySelector("select.js-purchase-history-sale-select") as HTMLSelectElement | null;
      return {
        商品名: t(".p-hareruya-purchase-list__name-text"),
        査定価格: t(".p-hareruya-purchase-list__col-assessment-price .p-hareruya-purchase-list__value"),
        数量: t(".p-hareruya-purchase-list__col-quantity .p-hareruya-purchase-list__value"),
        小計: t(".p-hareruya-purchase-list__col-total .p-hareruya-purchase-list__value"),
        売却: sel ? (sel.selectedOptions[0]?.textContent ?? "").trim() : "",
      };
    }));
  }

  /** 詳細の項目（見出し → 値）。「処理状態」など */
  async 項目(見出し: string): Promise<string> {
    const dt = this.page.locator("dl.p-hareruya-history-detail__order-info dt").filter({ hasText: 見出し }).first();
    await expect(dt, `買取履歴詳細の「${見出し}」`).toBeVisible({ timeout: OPEN });
    return (await dt.locator("xpath=following-sibling::dd[1]").innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
  }

  承諾確定ボタン() { return this.page.getByRole("button", { name: /承諾確定|承諾/ }); }
}
