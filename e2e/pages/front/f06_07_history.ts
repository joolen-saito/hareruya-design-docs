/** F06-07 購入履歴詳細（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-07_test_cases.tsv */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const clean = (t: string | null | undefined): string => (t ?? "").replace(/\s+/g, " ").trim();
/** 金額・数量の文字から数字だけを取り出す（「¥4,500」「4,500円」→ 4500。先頭の「-」は落とす） */
export const 数字 = (t: string): string => t.replace(/[^\d]/g, "");

export type 項目 = { 見出し: string; 値: string };
export type 明細の行 = { 名前: string; 数量: string; 合計: string };

export class HistoryDetailPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  get path(): string { return new URL(this.page.url()).pathname; }

  /** 購入履歴詳細のURLを開く。注文IDが undefined なら注文IDを付けない。応答の状態を返す */
  async 開く(注文ID?: string): Promise<number> {
    const url = `${BASE_URL}/ja/mypage/shopping_history_detail/${注文ID ?? ""}`;
    const res = await this.page.goto(url, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 購入履歴詳細の見出し（購入履歴詳細画面にだけある） */
  get 詳細の見出し(): Locator { return this.page.getByRole("heading", { name: "購入履歴詳細" }); }
  async 詳細画面である(): Promise<boolean> { return (await this.詳細の見出し.count()) > 0; }

  /** 画面の項目（見出しと値）。注文情報の行と、金額の集計の行を上から */
  async 項目一覧(): Promise<項目[]> {
    const rows = this.page.locator(".p-hareruya-history-detail__order-info-row, .p-hareruya-order-list__summary-item");
    return rows.evaluateAll((nodes) => nodes.map((n) => {
      const dt = n.querySelector(":scope > dt, :scope > .p-hareruya-order-list__summary-item-label");
      const dd = n.querySelector(":scope > dd, :scope > .p-hareruya-order-list__summary-item-value");
      const c = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();
      return { 見出し: c(dt?.textContent), 値: c(dd?.textContent) };
    }));
  }
  async 見出しの一覧(): Promise<string[]> { return (await this.項目一覧()).map((x) => x.見出し).filter(Boolean); }
  /** 見出しの値（無ければ null）。注文内容の行は値が長いので、明細は 明細() で読む */
  async 値(見出し: string): Promise<string | null> {
    return (await this.項目一覧()).find((x) => x.見出し === 見出し)?.値 ?? null;
  }

  /** 会員名の見出し（「結合 花子 様」） */
  async 会員名(): Promise<string> { return clean(await this.page.locator(".p-hareruya-history-detail__member-name").first().textContent()); }

  // ---- 注文内容（商品の明細） ----
  get 明細の見出し(): Locator { return this.page.locator(".p-hareruya-order-list__header > div"); }
  async 明細の見出しの文(): Promise<string[]> { return (await this.明細の見出し.allInnerTexts()).map(clean); }
  get 明細の行(): Locator { return this.page.locator(".p-hareruya-order-list__row"); }
  async 明細(): Promise<明細の行[]> {
    return this.明細の行.evaluateAll((nodes) => nodes.map((n) => {
      const c = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();
      return {
        名前: c(n.querySelector(".p-hareruya-order-list__name-cell")?.textContent),
        数量: c(n.querySelector(".p-hareruya-order-list__quantity")?.textContent),
        合計: c(n.querySelector(".p-hareruya-order-list__total")?.textContent),
      };
    }));
  }
  /** 注文時から商品価格が変わっていることを示す「【現在価格】」の表示 */
  get 現在価格の表示(): Locator { return this.page.locator(".p-hareruya-order-list__name-cell").getByText("【現在価格】"); }
  get 再注文の注意文(): Locator { return this.page.getByText("※金額が変更されている商品があるため、再注文時はご注意ください。"); }

  // ---- リンク・ボタン ----
  get 領収書発行リンク(): Locator { return this.page.getByRole("link", { name: "領収書発行", exact: true }); }
  /** 「この注文品をもう一度購入する」などの再購入のボタン */
  get 再購入のボタン(): Locator {
    const re = /もう一度購入|再注文|再購入/;
    return this.page.getByRole("button", { name: re }).or(this.page.getByRole("link", { name: re }));
  }
  get マイページへ戻る(): Locator { return this.page.getByRole("link", { name: "マイページへ戻る" }); }
  async マイページへ戻るを押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.マイページへ戻る.click()]);
    await this.page.waitForLoadState("load");
  }

  // ---- 住所 ----
  async 送り主の文(): Promise<string> { return clean(await this.page.locator("address.p-hareruya-history-detail__sender").first().textContent()); }
  async お届け先の文(): Promise<string> { return clean(await this.page.locator("address.p-hareruya-history-detail__receiver").first().textContent()); }
  async 送り主の郵便番号(): Promise<string> { return clean(await this.page.locator(".p-hareruya-history-detail__sender-postal").first().textContent()); }
  async 送り主の住所(): Promise<string> { return clean(await this.page.locator(".p-hareruya-history-detail__sender-address").first().textContent()); }
  async お届け先の郵便番号(): Promise<string> { return clean(await this.page.locator(".p-hareruya-history-detail__receiver-postal").first().textContent()); }
  async お届け先の住所(): Promise<string> { return clean(await this.page.locator(".p-hareruya-history-detail__receiver-address").first().textContent()); }
}
