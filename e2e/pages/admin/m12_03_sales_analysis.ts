/** 受注売上分析 集計一覧表示（M12-03）の画面の操作。セレクタはここだけに書く。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type 検索条件 = {
  キーワード?: string;
  /** 「YYYY/MM/DD hh:mm:ss」 */
  集計日From?: string;
  集計日To?: string;
  集計日対象項目?: string;
  集計単位?: string;
  並び替え項目?: string;
  並び順?: "昇順" | "降順";
  件数?: string;
  平均単価From?: number; 平均単価To?: number;
  数量From?: number; 数量To?: number;
  売上分析タグ?: string[];
};

export type 結果の行 = { 商品コード: string; 商品名: string; カテゴリ: string; 平均単価: string; 数量: string; 合計: string; 件数: string };

const num = (t: string) => t.replace(/[,\s]/g, "");

/** 画面の日時（YYYY/MM/DD hh:mm:ss）を、日時入力欄の値（YYYY-MM-DDThh:mm:ss）にする。年は指定の年に読み替える */
export function 入力欄の日時(日時: string, 年: number): string {
  return 日時.replace(/^\d{4}/, String(年)).replace(/\//g, "-").replace(" ", "T");
}
/** 日時入力欄の値は、秒が0だと省かれることがある。比べるために秒を揃える */
export function 日時を揃える(v: string): string {
  return /T\d{2}:\d{2}$/.test(v) ? `${v}:00` : v;
}

export class SalesAnalysisPage {
  readonly 検索枠: Locator;
  readonly 検索枠ボタン: Locator;
  readonly キーワード: Locator;
  readonly 通販: Locator;
  readonly 店舗全選択: Locator;
  readonly 店舗一覧: Locator;
  readonly 集計日From: Locator;
  readonly 集計日To: Locator;
  readonly 集計日対象項目: Locator;
  readonly 集計単位: Locator;
  readonly 並び替え項目: Locator;
  readonly 並び順: Locator;
  readonly 件数: Locator;
  readonly カテゴリ: Locator;
  readonly 状態: Locator;
  readonly 売上分析タグ: Locator;
  readonly カードセット: Locator;
  readonly 平均単価From: Locator;
  readonly 平均単価To: Locator;
  readonly 数量From: Locator;
  readonly 数量To: Locator;
  readonly クリア: Locator;
  readonly 検索ボタン: Locator;
  readonly 検索結果の件数: Locator;
  readonly 結果の表: Locator;

  constructor(readonly page: Page) {
    const f = (n: string) => page.locator(`[name="admin_analysis_sales[${n}]"]`);
    this.検索枠 = page.locator("#salesSearchDetail");
    this.検索枠ボタン = page.locator('button[data-bs-target="#salesSearchDetail"]');
    this.キーワード = f("multi");
    this.通販 = f("mail_order_enabled");
    this.店舗全選択 = f("store_sales_all");
    this.店舗一覧 = page.locator("#admin_analysis_sales_store_sales_targets");
    this.集計日From = f("summary_date_from");
    this.集計日To = f("summary_date_to");
    this.集計日対象項目 = page.locator("#admin_analysis_sales_date_type");
    this.集計単位 = f("summary_type");
    this.並び替え項目 = f("sort_key");
    this.並び順 = page.locator("#admin_analysis_sales_asc_desc");
    this.件数 = f("page_count");
    this.カテゴリ = f("category_id");
    this.状態 = page.locator("#admin_analysis_sales_card_condition");
    this.売上分析タグ = page.locator('select[name^="admin_analysis_sales[tag_sales_analysis]"]');
    this.カードセット = page.locator('select[name^="admin_analysis_sales[cardset]"]');
    this.平均単価From = f("price_from");
    this.平均単価To = f("price_to");
    this.数量From = f("quantity_from");
    this.数量To = f("quantity_to");
    this.クリア = page.locator("#search_form").getByRole("link", { name: "検索条件をクリア", exact: true });
    this.検索ボタン = page.locator('form#search_form button[type="submit"]');
    this.検索結果の件数 = page.locator("#search_total_count");
    this.結果の表 = page.locator("#result_list__list table");
  }

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/analysis/sales"));
    expect(res?.status() ?? 0, "受注売上分析 集計一覧表示画面の応答").toBeLessThan(400);
    await expect(this.キーワード, "キーワード検索の欄").toBeVisible({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }

  // ---- 集計対象（通販・店舗）

  async 通販を選ぶ(on: boolean): Promise<void> { await this.通販.setChecked(on, { timeout: 20_000 }); }

  async 店舗の名前一覧(): Promise<string[]> {
    return (await this.店舗一覧.locator("label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  店舗(名前: string): Locator { return this.店舗一覧.getByLabel(名前, { exact: true }); }
  async 全店舗のチェック状態(): Promise<Record<string, boolean>> {
    const boxes = await this.店舗一覧.locator('input[type="checkbox"]').all();
    const out: Record<string, boolean> = {};
    for (const b of boxes) {
      const id = await b.getAttribute("id");
      const label = id ? ((await this.店舗一覧.locator(`label[for="${id}"]`).first().innerText()) ?? "").replace(/\s+/g, " ").trim() : "";
      out[label || (id ?? "")] = await b.isChecked();
    }
    return out;
  }
  async 全選択を切り替える(on: boolean): Promise<void> { await this.店舗全選択.setChecked(on, { timeout: 20_000 }); }
  /** 店舗全選択/全解除を一度チェックONにしてからチェックOFFにする */
  async 全選択して全解除する(): Promise<void> {
    await this.全選択を切り替える(true);
    await this.全選択を切り替える(false);
  }
  /** 指定の店舗だけをチェックONにする（ほかの店舗はチェックOFFにする） */
  async 店舗だけを選ぶ(名前: string[]): Promise<void> {
    const states = await this.全店舗のチェック状態();
    for (const name of Object.keys(states)) {
      if (!名前.includes(name) && states[name]) await this.店舗(name).setChecked(false, { timeout: 20_000 });
    }
    for (const name of 名前) await this.店舗(name).setChecked(true, { timeout: 20_000 });
  }

  // ---- 検索条件

  async 日時を入れる(欄: Locator, 日時: string, 年: number): Promise<void> {
    await 欄.fill(入力欄の日時(日時, 年), { timeout: 20_000 });
  }
  async 日対象項目を選ぶ(表示名: string): Promise<void> {
    await this.集計日対象項目.getByLabel(表示名, { exact: true }).check({ timeout: 20_000 });
  }
  async 並び順を選ぶ(表示名: string): Promise<void> {
    await this.並び順.getByLabel(表示名, { exact: true }).check({ timeout: 20_000 });
  }
  /** 売上分析タグ・カードセットの複数選択（見た目の部品の裏の選択欄）で、指定の名前の選択肢だけを選んだ状態にする。空配列なら全部外す */
  async 複数選択を設定する(欄: Locator, 名前: string[]): Promise<void> {
    await 欄.evaluate((el, names) => {
      const s = el as HTMLSelectElement;
      Array.from(s.options).forEach((o) => { o.selected = names.includes((o.textContent ?? "").trim()); });
      s.dispatchEvent(new Event("change", { bubbles: true }));
    }, 名前);
    const got = await 欄.evaluate((el) => Array.from((el as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
    expect(got.sort(), "複数選択の選択状態").toEqual([...名前].sort());
  }
  async 選択肢の名前(欄: Locator): Promise<string[]> {
    return (await 欄.locator("option").allInnerTexts()).map((t) => t.trim()).filter((t) => t !== "");
  }

  /** 検索条件を入れる（検索ボタンは押さない） */
  async 条件を入れる(c: 検索条件, 年: number): Promise<void> {
    if (c.キーワード !== undefined) await this.キーワード.fill(c.キーワード, { timeout: 20_000 });
    if (c.集計日From !== undefined) await this.日時を入れる(this.集計日From, c.集計日From, 年);
    if (c.集計日To !== undefined) await this.日時を入れる(this.集計日To, c.集計日To, 年);
    if (c.集計日対象項目 !== undefined) await this.日対象項目を選ぶ(c.集計日対象項目);
    if (c.集計単位 !== undefined) await this.集計単位.selectOption({ label: c.集計単位 }, { timeout: 20_000 });
    if (c.並び替え項目 !== undefined) await this.並び替え項目.selectOption({ label: c.並び替え項目 }, { timeout: 20_000 });
    if (c.並び順 !== undefined) await this.並び順を選ぶ(c.並び順);
    if (c.件数 !== undefined) await this.件数.selectOption({ label: c.件数 }, { timeout: 20_000 });
    if (c.平均単価From !== undefined) await this.平均単価From.fill(String(c.平均単価From), { timeout: 20_000 });
    if (c.平均単価To !== undefined) await this.平均単価To.fill(String(c.平均単価To), { timeout: 20_000 });
    if (c.数量From !== undefined) await this.数量From.fill(String(c.数量From), { timeout: 20_000 });
    if (c.数量To !== undefined) await this.数量To.fill(String(c.数量To), { timeout: 20_000 });
    if (c.売上分析タグ !== undefined) await this.複数選択を設定する(this.売上分析タグ, c.売上分析タグ);
  }

  /** 検索ボタンを押し、結果の画面（同じ画面）が出るのを待つ */
  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.検索ボタン.click({ timeout: 20_000 })]);
    await expect(this.検索結果の件数, "検索結果の件数の表示").toBeVisible({ timeout: 30_000 });
  }

  // ---- 検索結果

  /** 結果の表の行（最後の合計の行を除く）と、合計の行。集計単位が商品なら 商品コード・商品名、カテゴリなら カテゴリ に入る */
  async 結果を読む(): Promise<{ 行: 結果の行[]; 合計: { 数量: string; 合計: string; 件数: string } | null }> {
    if ((await this.結果の表.count()) === 0) return { 行: [], 合計: null };
    const isCategory = (await this.結果の表.locator("thead th").first().innerText()).trim() === "カテゴリ";
    const rows = await this.結果の表.locator("tbody tr").all();
    const cells = await Promise.all(rows.map(async (tr) => (await tr.locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())));
    const toRow = (c: string[]): 結果の行 => isCategory
      ? { 商品コード: "", 商品名: "", カテゴリ: c[0], 平均単価: num(c[1]), 数量: num(c[2]), 合計: num(c[3]), 件数: num(c[4]) }
      : { 商品コード: c[0], 商品名: c[1], カテゴリ: "", 平均単価: num(c[2]), 数量: num(c[3]), 合計: num(c[4]), 件数: num(c[5]) };
    const total = cells[cells.length - 1];
    const off = isCategory ? 1 : 2;
    return {
      行: cells.slice(0, -1).map(toRow),
      合計: { 数量: num(total[off + 1]), 合計: num(total[off + 2]), 件数: num(total[off + 3]) },
    };
  }

  /** 検索条件の現在の値を読む（クリアで初期値へ戻ることの確認・検索後の保持の確認用） */
  async 値を読む(): Promise<Record<string, string>> {
    const checkedLabels = async (box: Locator) => {
      const ids = await box.locator("input:checked").evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).id));
      const out: string[] = [];
      for (const id of ids) out.push(((await box.locator(`label[for="${id}"]`).first().innerText()) ?? "").replace(/\s+/g, " ").trim());
      return out.join(",");
    };
    const selected = async (l: Locator) => (await l.evaluate((el) => Array.from((el as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()))).join(",");
    const stores = await this.全店舗のチェック状態();
    return {
      キーワード: await this.キーワード.inputValue(),
      通販: String(await this.通販.isChecked()),
      店舗全選択: String(await this.店舗全選択.isChecked()),
      店舗: Object.entries(stores).filter(([, v]) => v).map(([k]) => k).join(","),
      集計日From: 日時を揃える(await this.集計日From.inputValue()),
      集計日To: 日時を揃える(await this.集計日To.inputValue()),
      集計日対象項目: await checkedLabels(this.集計日対象項目),
      集計単位: await selected(this.集計単位),
      並び替え項目: await selected(this.並び替え項目),
      並び順: await checkedLabels(this.並び順),
      件数: await selected(this.件数),
      カテゴリ: await selected(this.カテゴリ),
      状態: await checkedLabels(this.状態),
      売上分析タグ: await selected(this.売上分析タグ),
      カードセット: await selected(this.カードセット),
      平均単価From: await this.平均単価From.inputValue(),
      平均単価To: await this.平均単価To.inputValue(),
      数量From: await this.数量From.inputValue(),
      数量To: await this.数量To.inputValue(),
    };
  }
}
