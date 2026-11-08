/**
 * F06-08 入荷待ち商品一覧の続き（-b）の操作。商品カード1枚ごとの表示（言語・規格の行・解除ボタン・同名検索・まとめて入荷通知・画像と名前のリンク）を読む。
 * 既存の pages/front/f06_08_notifylist.ts は変えず、継承して足す。セレクタはここだけに書く。正本: cases/F06-08_test_cases.tsv
 */
import { Locator } from "@playwright/test";
import { NotifyListPage } from "./f06_08_notifylist";

export type 規格の行 = { 状態: string; 価格: string; 規格ID: string; 解除ボタン: boolean };
export type カード情報 = {
  /** 画面の上から数えた商品カードの番号 */
  番号: number;
  /** 商品名の表示（【Foil】などの前置きを含む） */
  名前: string;
  /** 言語の表示（カード商品だけ。無ければ空） */
  言語: string;
  規格: 規格の行[];
  /** まとめて入荷通知の解除ボタンが表示されている */
  まとめて解除: boolean;
  /** まとめて入荷通知の枠（ラベル）が表示されている */
  まとめて枠: boolean;
  同名検索: boolean;
  同名検索のリンク: string;
  画像のsrc: string;
  画像のリンク: string;
  名前のリンク: string;
};

export class NotifyListB extends NotifyListPage {
  /** 一覧のすべての商品カードを読む */
  async 全カード(): Promise<カード情報[]> {
    const root = this.商品カード;
    return root.evaluateAll((nodes) => nodes.map((el, i) => {
      const t = (n: Element | null | undefined): string => (n?.textContent ?? "").replace(/\s+/g, " ").trim();
      const items = Array.from(el.querySelectorAll(".p-hareruya-product-card__condition-item"));
      const aImg = el.querySelector("a.p-hareruya-product-card__img-wrap");
      const aName = el.querySelector("a.p-hareruya-product-card__name");
      const same = el.querySelector(".p-hareruya-product-card__same-search a");
      const bulkBtn = el.querySelector("button.js-notifylist-bulk-restock");
      return {
        番号: i,
        名前: t(el.querySelector(".p-hareruya-product-card__name-text")).replace(/^【Foil】\s+/, "【Foil】"),
        言語: t(el.querySelector(".c-hareruya-label--language")),
        規格: items.map((it) => {
          const btn = it.querySelector("button[data-productclass]");
          return {
            状態: t(it.querySelector(".p-hareruya-product-card__condition-type")),
            価格: t(it.querySelector(".p-hareruya-product-card__price")),
            規格ID: btn?.getAttribute("data-productclass") ?? "",
            解除ボタン: !!btn && btn.classList.contains("is-selected"),
          };
        }),
        まとめて解除: !!bulkBtn && bulkBtn.classList.contains("is-selected"),
        まとめて枠: !!el.querySelector(".p-hareruya-product-card__notify-all"),
        同名検索: !!same,
        同名検索のリンク: same?.getAttribute("href") ?? "",
        画像のsrc: el.querySelector("img.p-hareruya-product-card__img")?.getAttribute("src") ?? "",
        画像のリンク: aImg?.getAttribute("href") ?? "",
        名前のリンク: aName?.getAttribute("href") ?? "",
      };
    }));
  }

  /** 商品名（実際の値）に当たるカード。【Foil】などの前置きは外して比べる */
  async カード(商品名: string): Promise<カード情報[]> {
    return (await this.全カード()).filter((c) => c.名前.replace(/^【Foil】\s*/, "") === 商品名);
  }

  カードの場所(番号: number): Locator { return this.商品カード.nth(番号); }
  名前を押す(番号: number): Promise<void> { return this.押して遷移する(this.カードの場所(番号).locator("a.p-hareruya-product-card__name")); }
  画像を押す(番号: number): Promise<void> { return this.押して遷移する(this.カードの場所(番号).locator("a.p-hareruya-product-card__img-wrap")); }
  同名検索を押す(番号: number): Promise<void> { return this.押して遷移する(this.カードの場所(番号).locator(".p-hareruya-product-card__same-search a")); }
  async 再読み込みする(): Promise<void> {
    await this.page.reload({ timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** 開いている画面の検索条件（クエリ）を読む */
  get クエリ(): URLSearchParams { return new URL(this.page.url()).searchParams; }
}
