/** 日別・月別集計 集計一覧表示（日次 /analysis/summary/daily・月次 /analysis/summary/monthly）の操作。セレクタはここだけに書く。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { CSVを読む } from "./m07_buy";

export class SummaryPage {
  readonly 検索枠: Locator;
  readonly 検索枠ボタン: Locator;
  readonly 集計タイプ: Locator;
  readonly 集計日From: Locator;
  readonly 集計日To: Locator;
  readonly 通販: Locator;
  readonly 店舗全選択: Locator;
  readonly 各店舗: Locator;
  readonly 検索ボタン: Locator;

  constructor(readonly page: Page) {
    this.検索枠 = page.locator("#summarySearchDetail");
    this.検索枠ボタン = page.locator('[data-bs-target="#summarySearchDetail"]');
    this.集計タイプ = page.locator('input[name="admin_summary[summary_type]"]');
    this.集計日From = page.locator("#admin_summary_summary_date_from");
    this.集計日To = page.locator("#admin_summary_summary_date_to");
    this.通販 = page.locator("#admin_summary_mail_order_enabled");
    this.店舗全選択 = page.locator("#admin_summary_store_sales_all");
    this.各店舗 = page.locator('input[name="admin_summary[store_sales_targets][]"]');
    this.検索ボタン = page.locator('form#search_form button[type="submit"]');
  }

  async open(種類: "daily" | "monthly"): Promise<void> {
    const res = await this.page.goto(adminUrl(`/analysis/summary/${種類}`));
    expect(res?.status() ?? 0, "日別・月別集計 集計一覧表示画面の応答").toBeLessThan(400);
    await expect(this.検索ボタン, "検索ボタン").toBeVisible({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }

  /** 検索フォームの文字（利用端末・表示項目などの有無を調べる） */
  async 検索フォームの文字(): Promise<string> { return ((await this.page.locator("#search_form").innerText()) ?? "").replace(/\s+/g, " "); }

  /** 集計対象(各店舗)に出ている店舗の表示名 */
  async 店舗の表示名(): Promise<string[]> {
    return this.各店舗.evaluateAll((ns) => ns.map((n) => (document.querySelector(`label[for="${(n as HTMLInputElement).id}"]`)?.textContent ?? "").trim()));
  }

  /** 期間（日別は YYYY-MM-DD、月別は YYYY-MM）を入れる */
  async 期間を入れる(from: string, to: string): Promise<void> {
    for (const [l, v] of [[this.集計日From, from], [this.集計日To, to]] as const) {
      await l.fill(v, { timeout: 20_000 });
      await l.press("Escape");
    }
  }

  /** 集計対象(通販)の ON/OFF を入れ、各店舗は表示名の店舗だけを ON にする（ほかは OFF） */
  async 集計対象を選ぶ(通販: boolean, 店舗: string[]): Promise<void> {
    await this.通販.setChecked(通販, { timeout: 20_000 });
    const names = await this.店舗の表示名();
    for (let i = 0; i < names.length; i++) await this.各店舗.nth(i).setChecked(店舗.includes(names[i]), { timeout: 20_000 });
    for (const w of 店舗) if (!names.includes(w)) throw new Error(`集計対象(各店舗)に「${w}」が無い（ある店舗: ${names.join("、")}）`);
  }

  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.検索ボタン.click({ timeout: 20_000 })]);
  }

  /** 結果の表の見出し以外の行（セルの文字）。日付が前の行と結合されている行は、日付を補う。最後が総合計の行 */
  async 結果の行(): Promise<{ 日: string; 店舗: string; 値: string[] }[]> {
    const rows = await this.page.locator("#result_list__list tbody tr").all();
    const out: { 日: string; 店舗: string; 値: string[] }[] = [];
    let 日 = "";
    for (const tr of rows) {
      const cells = (await tr.locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
      if (cells.length === 12) { 日 = cells[0]; out.push({ 日, 店舗: cells[1], 値: cells.slice(2) }); }
      else out.push({ 日, 店舗: cells[0], 値: cells.slice(1) });
    }
    return out;
  }

  /** CSVダウンロードのリンクを押し、ファイル名と先頭のバイトを返す */
  async CSVをダウンロードする(): Promise<{ fileName: string; 先頭: Buffer } | null> {
    const download = this.page.waitForEvent("download", { timeout: 60_000 }).catch(() => null);
    await this.page.locator("#result_list_main__csv_menu").click({ timeout: 20_000 });
    const d = await download;
    if (!d) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of await d.createReadStream()) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return { fileName: d.suggestedFilename(), 先頭: Buffer.concat(chunks).subarray(0, 3) };
  }

  /** CSVダウンロードのリンクを押し、ダウンロードしたCSVの中身（見出し・行）を読む。ダウンロードされなければ null */
  async CSVを取得する(): Promise<{ fileName: string; 見出し: string[]; 行: Record<string, string>[] } | null> {
    const download = this.page.waitForEvent("download", { timeout: 60_000 }).catch(() => null);
    await this.page.locator("#result_list_main__csv_menu").click({ timeout: 20_000 });
    const d = await download;
    if (!d) return null;
    const csv = await CSVを読む(d);
    return { fileName: d.suggestedFilename(), 見出し: csv.見出し, 行: csv.行 };
  }

  /** 各店舗のチェック状態 */
  async 各店舗の状態(): Promise<boolean[]> { return this.各店舗.evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).checked)); }
}
