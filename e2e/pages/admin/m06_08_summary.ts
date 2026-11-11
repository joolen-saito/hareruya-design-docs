/**
 * 買取集計データ(検索入力)の、M06-08 で足す操作（基本の操作は pages/admin/m06_09_summary.ts の SummaryPage）。
 * 選択欄は複数選択で、画面では選択欄を飾る部品が重なって表示される。選択の状態と選択肢は元の選択欄から読む。
 */
import { expect } from "@playwright/test";
import { SummaryPage } from "./m06_09_summary";

const OPEN = 30_000;
const 部門欄 = 'select[name="admin_otc_buy_order_summary[section][]"]';
const 店舗欄 = 'select[name="admin_otc_buy_order_summary[shop][]"]';
const 日付From = 'input[name="admin_otc_buy_order_summary[summary_date_from]"]';
const 日付To = 'input[name="admin_otc_buy_order_summary[summary_date_to]"]';

export class M0608SummaryPage extends SummaryPage {
  async 選択中の部門(): Promise<string[]> { return this.選択中(部門欄); }
  async 選択中の店舗(): Promise<string[]> { return this.選択中(店舗欄); }
  async 部門の選択肢(): Promise<string[]> { return this.選択肢(部門欄); }
  async 店舗の選択肢(): Promise<string[]> { return this.選択肢(店舗欄); }

  private async 選択中(selector: string): Promise<string[]> {
    return this.page.locator(selector).evaluate((s) => Array.from((s as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  }
  private async 選択肢(selector: string): Promise<string[]> {
    return this.page.locator(selector).evaluate((s) => Array.from((s as HTMLSelectElement).options).map((o) => (o.textContent ?? "").trim()));
  }

  /** 集計日(From)・集計日(To)の入力値 */
  async 集計日(): Promise<{ from: string; to: string }> {
    return { from: await this.page.locator(日付From).inputValue({ timeout: OPEN }), to: await this.page.locator(日付To).inputValue({ timeout: OPEN }) };
  }

  /** 買取店舗・部門の選択をすべて外す（未選択にする） */
  async 買取店舗を未選択にする(): Promise<void> { await this.page.locator(店舗欄).selectOption([], { timeout: OPEN }); }
  async 部門を未選択にする(): Promise<void> { await this.page.locator(部門欄).selectOption([], { timeout: OPEN }); }

  /** 部門を複数選ぶ（名前の完全一致。それぞれ1件に決まること） */
  async 部門を複数選ぶ(名前: string[]): Promise<void> {
    const sel = this.page.locator(部門欄);
    await expect(sel, "部門の選択欄").toBeAttached({ timeout: OPEN });
    const values = await sel.evaluate((s, ns) => ns.flatMap((n) => Array.from((s as HTMLSelectElement).options).filter((o) => (o.textContent ?? "").trim() === n).map((o) => o.value)), 名前);
    if (values.length !== 名前.length) throw new Error(`部門の選択肢に ${名前.join("・")} が ${values.length} 件（${名前.length}件のはず）`);
    await sel.selectOption(values, { timeout: OPEN });
  }

  /** 「検索する」ボタンを押す（結果の欄が出るのを待たない。ブラウザの入力チェックで止まることもある） */
  async 検索するを押すだけ(): Promise<void> {
    await this.page.locator("#search_form").getByRole("button", { name: /検索する/ }).click({ timeout: OPEN });
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState("load");
  }

  /** 検索結果の欄（集計・日別）の数 */
  async 結果の欄の数(): Promise<number> {
    return (await this.期間全体の欄().count()) + (await this.日別の欄().count());
  }

  /** 期間全体の欄の文（集計が無いときの案内文を含む） */
  async 期間全体の文(): Promise<string> {
    return (await this.期間全体の欄().innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
  }

  /** 左のメニュー「店頭買取管理」→「買取集計データ」を押して開き直す（折りたたまれていれば親の見出しを順に開く） */
  async メニューから開き直す(): Promise<void> {
    const link = this.page.locator('.c-mainNavArea a[href$="/otcbuyorder/summary"]').first();
    await expect(link, "メニューの「買取集計データ」").toHaveCount(1, { timeout: OPEN });
    for (let i = 0; i < 3 && !(await link.isVisible()); i++) {
      const ids = await link.evaluate((a) => {
        const out: string[] = [];
        for (let e: Element | null = a.parentElement; e; e = e.parentElement) if (e.classList.contains("collapse") && e.id) out.push(e.id);
        return out.reverse();
      });
      for (const id of ids) {
        if (await this.page.locator(`#${id}`).isVisible()) continue;
        await this.page.locator(`.c-mainNavArea a[href="#${id}"]`).first().click({ timeout: OPEN });
        await this.page.waitForTimeout(500);
      }
    }
    await Promise.all([this.page.waitForLoadState("load"), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
    await expect(this.page.locator(日付From), "買取集計データ画面の集計日(From)").toBeVisible({ timeout: OPEN });
  }
}
