/** F06-11 買取履歴一覧（フロントのマイページ）の追加の操作。ページ送り・行の中身・並び。セレクタはここだけに書く。正本: cases/F06-11_test_cases.tsv */
import { Locator } from "@playwright/test";
import { PurchaseHistoryPage } from "./f06_11_purchase_history";

export type ページ送りの位置 = "上部" | "下部";

export class PurchaseHistoryPageB extends PurchaseHistoryPage {
  /** 一覧の買取番号（表示されている順） */
  async 買取番号の並び(): Promise<string[]> {
    const links = this.page.locator(".p-hareruya-history-list__box a.c-hareruya-link");
    const n = await links.count();
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(((await links.nth(i).innerText()) ?? "").trim());
    return out;
  }
  ページ送り(位置: ページ送りの位置): Locator {
    return this.page.locator(位置 === "上部" ? ".p-hareruya-toolbar__pagination .p-hareruya-pagination" : ".p-hareruya-history-list__pagination-wrap--bottom .p-hareruya-pagination");
  }
  ページ送りのリンク(位置: ページ送りの位置, 種類: "最初" | "最後"): Locator {
    return this.ページ送り(位置).locator(`a.p-hareruya-pagination__link[aria-label="${種類 === "最初" ? "最初のページへ" : "最後のページへ"}"]`);
  }
  ページ番号のリンク(位置: ページ送りの位置, 番号: number): Locator {
    return this.ページ送り(位置).locator(`a.p-hareruya-pagination__link[data-page="${番号}"][aria-label="ページ${番号}へ"]`);
  }
  /** 一覧の行（買取番号の行） */
  行(買取番号: string): Locator {
    return this.page.locator(".p-hareruya-history-list__box").filter({ has: this.page.locator(`a.c-hareruya-link:text-is("${買取番号}")`) });
  }
  /** 行の中の項目（見出しの文字 → 値の文字） */
  async 行の項目(買取番号: string, 見出し: string): Promise<string> {
    const dd = this.行(買取番号).locator(".p-hareruya-history-list__order-info-row").filter({ has: this.page.locator("dt", { hasText: 見出し }) }).locator("dd").first();
    return ((await dd.innerText({ timeout: 30_000 })) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 行の詳細へのリンク（買取番号のリンク） */
  買取番号のリンク(買取番号: string): Locator { return this.行(買取番号).locator("a.c-hareruya-link"); }
  /** 行の「詳細を見る」ボタン */
  詳細を見るボタン(買取番号: string): Locator { return this.行(買取番号).locator(".p-hareruya-history-list__more-btn a"); }
  /** 詳細画面に表示された買取番号（見出し「買取番号」の値。無ければ空） */
  async 詳細の買取番号(): Promise<string> {
    const dd = this.page.locator("dl dt", { hasText: "買取番号" }).first().locator("xpath=following-sibling::dd[1]");
    return (await dd.count()) === 0 ? "" : ((await dd.innerText({ timeout: 30_000 })) ?? "").trim();
  }
}
