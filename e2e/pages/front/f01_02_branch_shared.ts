/**
 * F01-02 支店ECTOP の、共有の設定を書き換えて確かめるケース（047・058・060〜062・065・066・070・071・081）の公開側の画面の操作。
 * セレクタはここだけに書く。支店ECTOPそのものの部品は pages/front/f01_02_branch.ts（BranchTopPage）。
 */
import { Locator, Page } from "@playwright/test";

export type タイルの表示 = { 見出し: string; 商品の数: number; もっと見るのリンク: string };

export class BranchSharedParts {
  constructor(readonly page: Page) {}

  /** E2E が作ったブロックの外枠（id で引く） */
  ブロックの枠(id: string): Locator { return this.page.locator(`#${id}`); }

  /** 見出しが「アイテムを探す」の区画（支店ECTOPの中の全部） */
  get アイテムを探すの区画(): Locator {
    return this.page.locator("section").filter({ has: this.page.locator("h2", { hasText: /^\s*アイテムを探す\s*$/ }) });
  }

  /** 区画の中の項目（一覧の1行ずつ） */
  static 項目(区画: Locator): Locator { return 区画.locator("li"); }

  /** タイルの並び（バナーを除く。上段右・中段左・中段右・下段左の順）の見出し・商品カードの数・「もっと見る」のリンク先 */
  async タイルを読む(): Promise<タイルの表示[]> {
    return this.page.locator(".p-hareruya-branch-top__item-list .p-hareruya-feature-grid__item").filter({ has: this.page.locator(".p-hareruya-section__heading h2") })
      .evaluateAll((ns) => ns.map((n) => ({
        見出し: (n.querySelector(".p-hareruya-section__heading h2")?.textContent ?? "").replace(/\s+/g, " ").trim(),
        商品の数: n.querySelectorAll(".p-hareruya-product-card").length,
        もっと見るのリンク: (n.querySelector(".p-hareruya-section__more a") as HTMLAnchorElement | null)?.href ?? "",
      })));
  }

  /** タイル（番号は上からの順。0 始まり） */
  タイル(番号: number): Locator {
    return this.page.locator(".p-hareruya-branch-top__item-list .p-hareruya-feature-grid__item").filter({ has: this.page.locator(".p-hareruya-section__heading h2") }).nth(番号);
  }

  /** 採用情報（支店）のバナー */
  get 採用情報(): Locator { return this.page.locator("a.p-hareruya-branch-top__recruit-banner").first(); }

  // ---- 商品一覧 ----

  /** 商品一覧のパンくずリスト */
  get パンくず(): Locator { return this.page.locator(".p-hareruya-product-list__breadcrumb-wrap .p-hareruya-breadcrumb").first(); }
  /** 商品一覧の、パンくずリストの下の表示用HTMLの欄 */
  get 表示用HTMLの欄(): Locator { return this.page.locator(".p-hareruya-product-list__free-content"); }
  /** 商品一覧の商品カード（商品名で選ぶ） */
  商品カード(商品名: string): Locator { return this.page.locator(".p-hareruya-product-card").filter({ hasText: 商品名 }); }
  /** 商品一覧の商品カード（全部） */
  get 全部の商品カード(): Locator { return this.page.locator(".p-hareruya-product-card"); }

  /** a が b より前（文書の並びで上）にあるか。どちらかが無ければ null */
  static async 前にあるか(a: Locator, b: Locator): Promise<boolean | null> {
    if ((await a.count()) === 0 || (await b.count()) === 0) return null;
    const bh = await b.first().elementHandle();
    return a.first().evaluate((x, y) => !!(x.compareDocumentPosition(y as Node) & Node.DOCUMENT_POSITION_FOLLOWING), bh);
  }
}
