/**
 * 買取集計データ(検索入力・検索結果)（メニュー「店頭買取管理」→「買取集計データ」）。
 * 検索すると、期間全体の集計（部門別）と日別の集計が出る。日別に集計があるときだけ CSVダウンロードのボタンが出る。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const OPEN = 30_000;

export class SummaryPage {
  constructor(readonly page: Page) {}

  readonly 日別の欄 = () => this.page.locator("#result_list_days");
  readonly 日別の表の行 = () => this.page.locator("#result_list_days__list tbody tr");
  readonly 期間全体の欄 = () => this.page.locator("#result_list_entire");
  readonly CSVダウンロードのボタン = () => this.page.locator("#result_list_days__csv_menu");

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/otcbuyorder/summary"), { timeout: 60_000 });
    expect(res?.status() ?? 0, "買取集計データ画面の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
    await expect(this.page.locator('input[name="admin_otc_buy_order_summary[summary_date_from]"]'), "買取集計データ画面の集計日(From)").toBeVisible({ timeout: OPEN });
  }

  /** 集計日の期間（YYYY-MM-DD）を入れる */
  async 集計日を入れる(from: string, to: string): Promise<void> {
    await this.page.locator('input[name="admin_otc_buy_order_summary[summary_date_from]"]').fill(from, { timeout: OPEN });
    await this.page.locator('input[name="admin_otc_buy_order_summary[summary_date_to]"]').fill(to, { timeout: OPEN });
  }

  /** 検索ボタンを押し、結果が出るまで待つ */
  async 検索する(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("load"),
      this.page.locator("#search_form").getByRole("button", { name: /検索/ }).click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
    await expect(this.日別の欄(), "検索結果の日別の集計欄").toBeVisible({ timeout: 60_000 });
  }

  /** 日別の欄の文（集計が無いときの案内文を含む） */
  async 日別の文(): Promise<string> {
    return (await this.日別の欄().innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
  }

  /** 部門（複数選択）を、部門名を含む選択肢だけにする */
  async 部門を選ぶ(部門名: string): Promise<void> {
    await this.選択肢だけにする('select[name="admin_otc_buy_order_summary[section][]"]', 部門名, "部門");
  }

  /** 買取店舗（複数選択）を、店名の選択肢だけにする */
  async 買取店舗を選ぶ(店名: string): Promise<void> {
    await this.選択肢だけにする('select[name="admin_otc_buy_order_summary[shop][]"]', 店名, "買取店舗");
  }

  private async 選択肢だけにする(selector: string, 名前: string, 何: string): Promise<void> {
    const sel = this.page.locator(selector);
    await expect(sel, `買取集計データ画面の${何}の選択欄`).toBeAttached({ timeout: OPEN });
    const values = await sel.evaluate((s, n) => Array.from((s as HTMLSelectElement).options).filter((o) => (o.textContent ?? "").trim() === n).map((o) => o.value), 名前);
    if (values.length !== 1) throw new Error(`${何}の選択肢に「${名前}」が ${values.length} 件（1件のはず）`);
    await sel.selectOption(values, { timeout: OPEN });
  }

  /** 期間全体の集計の行（部門コード・部門・買取金額・販売金額。金額は数字だけ） */
  async 期間全体の行(): Promise<{ 部門コード: string; 部門: string; 買取金額: number; 販売金額: number }[]> {
    return this.集計の行("#result_list_entire tbody tr", 0);
  }

  /** 日別の集計の行（集計日・部門コード・部門・買取金額・販売金額） */
  async 日別の行(): Promise<{ 集計日: string; 部門コード: string; 部門: string; 買取金額: number; 販売金額: number }[]> {
    const rows = await this.集計の行("#result_list_days tbody tr", 1);
    return rows as { 集計日: string; 部門コード: string; 部門: string; 買取金額: number; 販売金額: number }[];
  }

  private async 集計の行(selector: string, 日付の列: 0 | 1) {
    const cells = await this.page.locator(selector).evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim())));
    const num = (t: string) => Number(t.replace(/[^0-9-]/g, ""));
    return cells.map((c) => ({
      ...(日付の列 === 1 ? { 集計日: c[0] } : {}), 部門コード: c[日付の列], 部門: c[日付の列 + 1], 買取金額: num(c[日付の列 + 2]), 販売金額: num(c[日付の列 + 3]),
    }));
  }

  /** 期間全体の欄の文（集計が無いときの案内文を含む） */
  async 期間全体の文(): Promise<string> {
    return (await this.期間全体の欄().innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
  }
}
