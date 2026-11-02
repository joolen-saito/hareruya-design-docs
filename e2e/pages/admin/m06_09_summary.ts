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
}
