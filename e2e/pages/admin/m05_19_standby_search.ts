/** M05-19 出荷指示リスト検索（メニュー「受注管理」→「出荷指示リスト」） */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class StandbySearchPage {
  constructor(private readonly page: Page) {}
  private f = (name: string): Locator => this.page.locator(`#search_form [name="admin_shipping_standby[${name}]"]`);

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/standby/search"));
    await this.page.waitForLoadState("load");
    expect(res?.status() ?? 0, "出荷指示リスト検索画面の応答").toBeLessThan(400);
    await expect(this.page.locator("#search_form"), "出荷指示リスト検索画面の検索欄").toBeVisible();
  }

  /** テキストの欄に入れる。日時の欄が日時入力の型なら、同じ日時を入力できる形（年-月-日T時:分）にして入れる */
  private async fillDate(l: Locator, ymd: string): Promise<void> {
    const type = await l.getAttribute("type");
    if (type === "datetime-local") await l.fill(`${ymd.replace(/\//g, "-")}T00:00`);
    else await l.fill(ymd);
  }

  async 出荷指示番号と注文番号と日付を入れる(v: { 出荷指示番号: string; 注文番号: string; 登録日: string; 更新日: string }): Promise<string[]> {
    await this.f("standby_id").fill(v.出荷指示番号);
    await this.f("order_id").fill(v.注文番号);
    await this.fillDate(this.f("create_date_from"), v.登録日);
    await this.fillDate(this.f("create_date_to"), v.登録日);
    await this.fillDate(this.f("update_date_from"), v.更新日);
    await this.fillDate(this.f("update_date_to"), v.更新日);
    return [await this.f("create_date_from").getAttribute("type") ?? ""];
  }

  /** 注文区分のチェック欄（ラベルの文） */
  private orderType(label: string): Locator {
    return this.page.locator("#search_form").getByLabel(label, { exact: true });
  }
  async 注文区分を選ぶ(labels: string[]): Promise<void> {
    for (const l of labels) await this.orderType(l).check();
  }
  async 注文区分の選択肢(): Promise<string[]> {
    return (await this.page.locator('#search_form [name="admin_shipping_standby[order_type][]"]').evaluateAll((ns) => ns.map((n) => (n.closest("label")?.textContent ?? "").trim())));
  }

  async 検索条件をクリアする(): Promise<void> {
    const clear = this.page.locator("#search_form a.search-clear, a.search-clear").first();
    await expect(clear, "「検索条件をクリア」").toBeVisible();
    await clear.click();
  }

  /** 検索フォームが画面にあるか（システムエラーの画面などには無い） */
  async 検索フォームがある(): Promise<boolean> { return (await this.page.locator("#search_form").count()) > 0; }

  async 欄の値(): Promise<{ 出荷指示番号: string; 注文番号: string; 登録日From: string; 登録日To: string; 更新日From: string; 更新日To: string; 選択中の注文区分: number }> {
    return {
      出荷指示番号: await this.f("standby_id").inputValue(), 注文番号: await this.f("order_id").inputValue(),
      登録日From: await this.f("create_date_from").inputValue(), 登録日To: await this.f("create_date_to").inputValue(),
      更新日From: await this.f("update_date_from").inputValue(), 更新日To: await this.f("update_date_to").inputValue(),
      選択中の注文区分: await this.page.locator('#search_form [name="admin_shipping_standby[order_type][]"]:checked').count(),
    };
  }

  /** 検索要求の並び順の送信値を「invalid」にして送信する（開発者ツールで、検索欄に並び順の項目を足して送る操作） */
  async 並び順をinvalidにして検索する(): Promise<number> {
    await this.page.locator("#search_form").evaluate((form) => {
      const input = document.createElement("input");
      input.type = "hidden"; input.name = "order"; input.value = "invalid";
      form.appendChild(input);
    });
    const resP = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/standby\/search/.test(r.url()), { timeout: 90_000 }).then((r) => r, () => null);
    await this.page.locator('button[type="submit"][form="search_form"]').click({ noWaitAfter: true });
    const res = await resP;
    if (res) await this.page.waitForLoadState("load", { timeout: 30_000 }).catch(() => undefined);
    return res ? res.status() : 0;
  }

  /** 検索結果まわりの表示（件数見出し・一覧・表示件数・ページング・結果なしの案内）と、エラー表示 */
  async 結果まわりの表示(): Promise<{ 件数見出し: number; 一覧: number; 表示件数: number; ページング: number; 結果なしの案内: number; エラー表示: string[] }> {
    const p = this.page;
    return {
      件数見出し: await p.locator("#search_total_count").count(),
      一覧: await p.locator("#result_list_main__list").count(),
      表示件数: await p.locator("#page_count_pulldown").count(),
      ページング: await p.locator("#result_list_main nav.pagination, #result_list_main .pagination, #result_list .pagination").count(),
      結果なしの案内: await p.getByText("検索結果がありません", { exact: false }).count(),
      エラー表示: (await p.locator(".alert-danger, .alert-warning").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean),
    };
  }

  // ---- 出荷指示リスト作成条件（生成欄） ----
  /** 作成条件の見出し（文字） */
  get 作成条件の見出し(): Locator { return this.page.locator("#generate_form .card-title"); }
  get 作成条件の本体(): Locator { return this.page.locator("#generateList"); }
  get 注文番号の範囲の欄(): Locator { return this.page.locator('#generate_form [name="admin_generate_shipping_standby[order_id_from]"], #generate_form [name="admin_generate_shipping_standby[order_id_to]"]'); }
  get 注文日の範囲の欄(): Locator { return this.page.locator('#generate_form [name="admin_generate_shipping_standby[order_date_from]"], #generate_form [name="admin_generate_shipping_standby[order_date_to]"]'); }
}
