/** M05-19 出荷指示リスト検索（メニュー「受注管理」→「出荷指示リスト」） */
import { Dialog, expect, Locator, Page } from "@playwright/test";
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
      結果なしの案内: await p.getByText("検索条件に合致するデータが見つかりませんでした", { exact: false }).count(),
      エラー表示: (await p.locator(".alert-danger, .alert-warning").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean),
    };
  }

  // ---- 検索の実行・結果の読み取り ----
  /** 「検索する」を押して、結果の画面が出るまで待つ */
  async 検索する(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.page.locator('button[type="submit"][form="search_form"]').click(),
    ]);
    await this.page.waitForLoadState("load");
  }

  async 出荷指示番号を入れる(v: string): Promise<void> { await this.f("standby_id").fill(v); }
  async 注文番号を入れる(v: string): Promise<void> { await this.f("order_id").fill(v); }
  /** 登録日（From・To）に同じ日付を入れる */
  async 登録日を入れる(ymd: string): Promise<void> {
    await this.fillDate(this.f("create_date_from"), ymd);
    await this.fillDate(this.f("create_date_to"), ymd);
  }
  async 更新日を入れる(ymd: string): Promise<void> {
    await this.fillDate(this.f("update_date_from"), ymd);
    await this.fillDate(this.f("update_date_to"), ymd);
  }
  async 日付の欄の型(): Promise<string> { return (await this.f("create_date_from").getAttribute("type")) ?? "text"; }

  /** 一覧に出ている出荷指示番号（表示順） */
  async 一覧の出荷指示番号(): Promise<string[]> {
    return this.page.locator('tr[id^="result_list_main__item--"]').evaluateAll((rs) => rs.map((r) => r.id.replace("result_list_main__item--", "")));
  }
  /** 件数見出し「検索結果：N件が該当しました」の N（見出しが無ければ null） */
  async 件数見出しの件数(): Promise<number | null> {
    const l = this.page.locator("#search_total_count");
    if ((await l.count()) === 0) return null;
    const m = /(\d+)\s*件/.exec((await l.innerText()).replace(/,/g, ""));
    return m ? Number(m[1]) : null;
  }
  /** 一覧の1行の中身（区分・注文件数・登録日・最終更新日の表示の文字） */
  async 行の内容(id: string): Promise<{ 区分: string; 注文件数: string; 登録日: string; 最終更新日: string } | null> {
    const row = this.page.locator(`#result_list_main__item--${id}`);
    if ((await row.count()) === 0) return null;
    const t = async (k: string) => ((await this.page.locator(`#result_list_main__${k}--${id}`).innerText()).replace(/\s+/g, " ").trim());
    return { 区分: await t("type"), 注文件数: await t("count"), 登録日: await t("create_date"), 最終更新日: await t("update_date") };
  }
  /** 出荷指示番号のリンク（編集画面へ） */
  番号のリンク(id: string): Locator { return this.page.locator(`#result_list_main__id--${id} a`); }
  /** 行のポップアップメニュー（…ボタン）と、その中の操作 */
  メニューボタン(id: string): Locator { return this.page.locator(`#dropdown_${id}`); }
  メニューの操作(id: string, 名前: "編集" | "削除"): Locator {
    return this.page.locator(`#result_list_main__item_menu_box--${id} .dropdown-menu a.dropdown-item`).filter({ hasText: new RegExp(`^\\s*${名前}\\s*$`) });
  }

  // ---- 削除の確認ダイアログ ----
  private dialog: Dialog | null = null;
  private clicking: Promise<unknown> | null = null;
  /** 確認ダイアログを受けるしかけ（削除を押す前に1回呼ぶ） */
  ダイアログを見張る(): void { this.page.on("dialog", (d) => { this.dialog = d; }); }
  /** メニューの「削除」を押し、確認ダイアログが出るまで待つ（OKは別の手順で押す） */
  async 削除を押す(id: string): Promise<{ 確認の文: string | null }> {
    this.dialog = null;
    this.clicking = this.メニューの操作(id, "削除").click({ noWaitAfter: true }).catch(() => undefined);
    for (let i = 0; i < 50 && !this.dialog; i++) await this.page.waitForTimeout(100);
    const d = this.dialog as Dialog | null;
    return { 確認の文: d ? d.message() : null };
  }
  /** 確認ダイアログでOKを押し、画面が移り終わるまで待つ */
  async 確認でOKを押す(): Promise<boolean> {
    const d = this.dialog as Dialog | null;
    if (!d) return false;
    await d.accept();
    await this.clicking;
    await this.page.waitForURL(/\/standby\/(search|page)/, { timeout: 30_000 }).catch(() => undefined);
    await this.page.waitForLoadState("load");
    return true;
  }
  /** 画面に出ている成功のメッセージ */
  async 成功のメッセージ(): Promise<string[]> {
    return (await this.page.locator(".alert-success").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  // ---- 出荷指示リスト作成条件（生成欄） ----
  /** 作成条件の見出し（文字） */
  get 作成条件の見出し(): Locator { return this.page.locator("#generate_form .card-title"); }
  get 作成条件の本体(): Locator { return this.page.locator("#generateList"); }
  get 注文番号の範囲の欄(): Locator { return this.page.locator('#generate_form [name="admin_generate_shipping_standby[order_id_from]"], #generate_form [name="admin_generate_shipping_standby[order_id_to]"]'); }
  get 注文日の範囲の欄(): Locator { return this.page.locator('#generate_form [name="admin_generate_shipping_standby[order_date_from]"], #generate_form [name="admin_generate_shipping_standby[order_date_to]"]'); }
}
