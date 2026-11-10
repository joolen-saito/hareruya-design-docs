/**
 * F06-06 購入履歴一覧の続き。再購入（「この注文内容で再度購入する」）の操作と、買い物かごの読み取り。セレクタ・アドレスはここだけに書く。
 * 既存の pages/front/f06_06_history.ts は変えず、継ぐ。正本: cases/F06-06_test_cases.tsv
 */
import { APIResponse, Locator, Request } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { HistoryListPage } from "./f06_06_history";

export type 取得した要求 = { method: string; url: string; postData: string | null; headers: Record<string, string> };

export class RepurchasePage extends HistoryListPage {
  /** 注文番号の注文の枠 */
  注文の枠の(注文番号: string): Locator { return this.注文の枠.filter({ hasText: 注文番号 }); }
  /** 注文番号の注文の「この注文内容で再度購入する」（ボタンでもリンクでも） */
  再購入(注文番号: string): Locator { return this.注文の枠の(注文番号).locator("a, button").filter({ hasText: "この注文内容で再度購入する" }); }

  /** 再購入を押して買い物かご画面へ進む */
  async 再購入を押す(注文番号: string): Promise<void> {
    const l = this.再購入(注文番号).first();
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
    await l.click({ timeout: 10_000 });
    await nav;
    await this.page.waitForLoadState("load");
  }

  /** 開発者ツールの Network で再購入の要求を取得するのと同じ（再購入を押して、送られた要求を読む） */
  async 再購入の要求を取得する(注文番号: string): Promise<取得した要求> {
    const l = this.再購入(注文番号).first();
    const reqP = this.page.waitForRequest((r: Request) => r.isNavigationRequest() || r.method() !== "GET", { timeout: 20_000 });
    await l.click({ timeout: 10_000 });
    const r = await reqP;
    return { method: r.method(), url: r.url(), postData: r.postData(), headers: r.headers() };
  }

  /** 取得した要求の注文IDを差し替えて（新しい注文IDが null なら取り除いて）再送し、応答を返す */
  async 注文IDを差し替えて再送する(req: 取得した要求, 旧注文ID: string, 新注文ID: string | null): Promise<APIResponse> {
    const swap = (s: string): string => 新注文ID === null
      ? s.replace(new RegExp(`/${旧注文ID}(?=[/?#]|$)`), "").replace(new RegExp(`([?&])[^=&]*=${旧注文ID}(&|$)`), "$1").replace(/[?&]$/, "")
      : s.split(旧注文ID).join(新注文ID);
    const url = swap(req.url);
    const { host: _h, "content-length": _c, ...headers } = req.headers;
    return this.page.context().request.fetch(url, { method: req.method, headers, data: req.postData === null ? undefined : swap(req.postData), maxRedirects: 0, timeout: 30_000 });
  }

  // ---- 買い物かご ----
  async カートを開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/cart`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** 買い物かごの明細（行の文と数量） */
  async カートの明細(): Promise<{ 文: string; 数量: number }[]> {
    return this.page.locator("[data-quantity-input]").evaluateAll((els) => els.map((e) => {
      const row = e.closest("li, tr, article, [class*='cart__item'], [class*='cart-item']") ?? e.parentElement!;
      return { 文: (row.textContent ?? "").replace(/\s+/g, " ").trim(), 数量: Number((e as HTMLInputElement).value) };
    }));
  }
}
