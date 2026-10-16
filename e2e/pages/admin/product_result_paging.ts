/** 商品マスター(検索結果)の表示件数・ページ送り・該当件数。 */
import { expect, Locator, Page } from "@playwright/test";

export class ProductResultPaging {
  readonly countSelect: Locator;
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.countSelect = page.locator("#page_count_pulldown");
    this.rows = page.locator('tr[id^="ex-product-"]');
  }

  /** 件数欄で「n件」を選ぶ。画面は選んだ件数の1ページ目へ移動する */
  async chooseCount(n: number): Promise<void> {
    await expect(this.countSelect, "商品マスター(検索結果)の件数欄").toBeVisible();
    const label = `${n}件`;
    await expect(this.countSelect.locator("option").filter({ hasText: new RegExp(`^${n}件$`) }), `件数「${label}」の選択肢`).toHaveCount(1);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.countSelect.selectOption({ label }),
    ]);
    await expect(this.countSelect).toBeVisible();
  }

  /** ページ送りの「n」を押す */
  async goToPage(n: number): Promise<void> {
    const link = this.page.locator("ul.pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
    await expect(link, `ページ送りの ${n} ページ目`).toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click()]);
  }

  /** ページ送りで現在のページとして示されている番号。ページ送りが無い（1ページだけ）ときは null */
  async currentPage(): Promise<string | null> {
    const active = this.page.locator("ul.pagination li.page-item.active .page-link");
    if (await active.count() === 0) return null;
    return ((await active.first().textContent()) ?? "").trim();
  }

  /** 件数欄で選択中の表示名（例: 10件）。件数欄が無いときは null */
  async selectedCountLabel(): Promise<string | null> {
    if (await this.countSelect.count() === 0) return null;
    const selected = this.countSelect.locator("option:checked");
    await expect(selected, "選択中の件数は1つ").toHaveCount(1);
    return ((await selected.textContent()) ?? "").trim();
  }

  /** 「検索結果：N件が該当しました」の N。表示が無ければ null */
  async totalCount(): Promise<number | null> {
    const text = this.page.getByText(/^検索結果：\d+件が該当しました$/);
    if (await text.count() === 0) return null;
    const m = ((await text.first().textContent()) ?? "").match(/検索結果：(\d+)件/);
    return m ? Number(m[1]) : null;
  }

  /**
   * 1商品の規格の行（表示順）。1つ目の規格は商品の行に、2つ目以降は続く行に並ぶ。
   * 商品の行は先頭3列（選択・商品ID・商品名）が多いので、列の位置をずらして読む。
   */
  async classRows(productId: string): Promise<{ code: string; condition: string; mainStock: string; branchStock: string }[]> {
    const head = this.page.locator(`#ex-product-${productId}`);
    await expect(head, `商品ID ${productId} の結果行`).toHaveCount(1);
    return head.evaluate((tr) => {
      const rows: { code: string; condition: string; mainStock: string; branchStock: string }[] = [];
      const read = (row: Element, offset: number) => {
        const td = (i: number) => (row.querySelectorAll(":scope > td")[i + offset]?.textContent ?? "").replace(/\s+/g, " ").trim();
        rows.push({ code: td(0), condition: td(2), mainStock: td(5), branchStock: td(6) });
      };
      read(tr, 3);
      for (let next = tr.nextElementSibling; next && !next.id.startsWith("ex-product-"); next = next.nextElementSibling) read(next, 0);
      return rows;
    });
  }

  /** 結果の各行の商品名（表示順） */
  async productNames(): Promise<string[]> {
    return (await this.rows.locator("td:nth-child(3) a").allInnerTexts()).map((t) => t.trim());
  }
}
