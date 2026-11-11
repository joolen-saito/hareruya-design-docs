/**
 * M05-10 納品書印刷（英語）の画面操作。受注情報検索 一覧(検索結果)の「納品書印刷（英語）」と、
 * 開いた新しい窓の英語の納品書（HTML。@admin/ShippingStandby/delivery_slips.en.twig）を読む。セレクタはここだけに書く。
 * 一覧の検索・選択は M05-09 の部品（pages/admin/m05_09_delivery_slips.ts の SlipOrderListPage）を使う。
 * 正本: cases/M05-10_test_cases.tsv
 */
import { expect, Locator, Page } from "@playwright/test";
import { SlipOrderListPage } from "./m05_09_delivery_slips";

export type 英語の明細行 = { 商品名: string; 価格: string; 数量: string; 合計: string };
export type 英語の納品書のページ = {
  見出し: string; 注文番号: string; ページ: string;
  お届け先: string[]; 送り主: string[]; 会社: string[];
  お買上額: string; 送料: string; 手数料: string; ポイント使用: string; 発送方法: string; 請求金額: string;
  明細: 英語の明細行[]; 合計の数量: string;
};

/** 受注情報検索 一覧(検索結果)の「納品書印刷（英語）」 */
export class SlipEnOrderListPage extends SlipOrderListPage {
  get 英語の印刷ボタン(): Locator { return this.page.locator("#printDeliverySlipsEn"); }
  /** 「納品書印刷（英語）」を押し、開いた新しい窓（納品書）を返す */
  async 英語の納品書印刷を押す(): Promise<Page> {
    await this.page.waitForLoadState("load");
    await expect(this.英語の印刷ボタン, "納品書印刷（英語）ボタン").toBeVisible();
    const [popup] = await Promise.all([this.page.waitForEvent("popup", { timeout: 60_000 }), this.英語の印刷ボタン.click()]);
    await popup.waitForLoadState("load");
    // 空の窓を開いてからフォームを送る作りなので、納品書の画面へ移るまで待つ
    await popup.waitForURL(/\/order\/print\/delivery_slips\/en/, { timeout: 60_000 }).catch(() => undefined);
    await popup.waitForLoadState("load");
    return popup;
  }
  /** 開発者ツールの代わりに、選んだ行のチェックボックスと同じ名前・同じ値の隠し入力を、送信するフォームに1個足す */
  async 同じ値の隠し入力を足す(配送先ID: string): Promise<{ 名前: string; 値: string; 同じ名前と値の数: number }> {
    return this.page.evaluate((id) => {
      const box = document.querySelector(`#check_${id}`) as HTMLInputElement | null;
      if (!box) throw new Error(`配送先ID ${id} の行のチェックボックスが無い`);
      const form = box.form ?? document.querySelector("#form_bulk");
      if (!form) throw new Error("一括の操作を送るフォームが無い");
      const h = document.createElement("input");
      h.type = "hidden"; h.name = box.name; h.value = box.value;
      form.appendChild(h);
      const n = Array.from(form.querySelectorAll("input")).filter((e) => (e as HTMLInputElement).name === box.name && (e as HTMLInputElement).value === box.value).length;
      return { 名前: box.name, 値: box.value, 同じ名前と値の数: n };
    }, 配送先ID);
  }
}

/** 英語の納品書の画面の、ページごとの内容を読む */
export async function 英語の納品書を読む(popup: Page): Promise<英語の納品書のページ[]> {
  await expect(popup.locator(".ContentsAll"), "納品書（英語）の画面").toBeAttached({ timeout: 30_000 });
  return popup.locator(".ContentsAll .multipage").evaluateAll((pages) => pages.map((p) => {
    const t = (e: Element | null | undefined) => (e?.textContent ?? "").replace(/\s+/g, " ").trim();
    const lines = (e: Element | null | undefined) => ((e as HTMLElement | null)?.innerText ?? "").split("\n").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
    const divs = Array.from(p.children) as HTMLElement[];
    const head = divs.map((d) => t(d));
    const ページ = head.find((s) => /^\d+\/\d+$/.test(s)) ?? "";
    const 番号 = /OrderID:\s*(\S+)/.exec(head.find((s) => s.startsWith("OrderID")) ?? "")?.[1] ?? "";
    const blocks = Array.from(p.querySelectorAll(":scope > div > div[style*='float: left']"));
    const c = (cls: string) => t(p.querySelector(`table.sales_ td.${cls}`));
    const rows = Array.from(p.querySelectorAll("table.detail tr")).filter((tr) => tr.querySelector("td"));
    const items = rows.map((tr) => ({ 商品名: t(tr.querySelector("td.gname")), 価格: t(tr.querySelector("td.price")), 数量: t(tr.querySelector("td.qty")), 合計: t(tr.querySelector("td.amt")) }));
    // ページの最後の行は合計欄（商品名の欄が「Total」、数量の欄が「今までの数/受注の総数」）
    const last = items.length > 0 && /^\d+\/\d+$/.test(items[items.length - 1].数量) && items[items.length - 1].価格 === "" ? items[items.length - 1] : null;
    return {
      見出し: head[0] ?? "", 注文番号: 番号, ページ,
      お届け先: lines(blocks[0]), 送り主: lines(blocks[1]), 会社: lines(blocks[2]),
      お買上額: c("subtotal_"), 送料: c("postage_"), 手数料: c("charge_"), ポイント使用: c("point_out_"), 発送方法: c("delivery_method_"),
      請求金額: t(p.querySelector("table.total_ td.total_")),
      明細: last ? items.slice(0, -1) : items, 合計の数量: last?.数量 ?? "",
    };
  }));
}

/** 金額の欄（「￥1,234」「¥1,234」）を数として読む。読めなければ NaN */
export const 金額 = (s: string): number => {
  const v = s.replace(/[,\s円￥¥]/g, "");
  return /^-?\d+$/.test(v) ? Number(v) : NaN;
};
