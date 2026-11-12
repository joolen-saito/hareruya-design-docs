/**
 * ネット買取の「買取商品履歴」画面（検索入力と検索結果が同じ画面）。M07-10 が使う。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 検索の入力欄は ID admin_purchase_history_<項目>。ステータス・言語・状態はチェックボックス（name は admin_purchase_history[項目][]）。
 * - 「検索する」を押すと同じ画面に結果が出る。結果は表（#result_list_main）で、先頭の列は CSV 対象のチェック、続いて 買取番号・申込者・商品コード・商品名・
 *   基準価格・買取価格・査定担当者・買取数・入庫数・増減数・振込完了日・更新日時。
 * - 件数の選択は #page_count_pulldown（選ぶと画面が開き直る）。ページングは ul.pagination のリンク。
 * - CSVダウンロードは、ボタン「CSVダウンロード」を押して出る「選択した商品履歴取得」「検索結果全件取得」。
 */
import { Download, expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const OPEN = 30_000;

export type 履歴の行 = {
  買取番号: string; 申込者: string; 商品コード: string; 商品名: string; 基準価格: string; 買取価格: string;
  査定担当者: string; 買取数: string; 入庫数: string; 増減数: string; 振込完了日: string; 更新日時: string;
};

/** 画面の金額（「¥2,200」「2,200」など）の数字だけ */
export const 金額の数 = (s: string): number => Number(s.replace(/[^\d-]/g, ""));
/** 状況名の（…）の補足を除いた名前（画面は「入庫済み」、正本は「入庫済み（仕入れ完了）」） */
export const 状況の名前 = (s: string): string => s.replace(/（[^）]*）$/, "").trim();

export class HistoryPage {
  constructor(readonly page: Page) {}

  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/purchase/history"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("#search_form"), "買取商品履歴の検索入力").toBeVisible({ timeout: OPEN });
  }

  private 欄(項目: string) { return this.page.locator(`#admin_purchase_history_${項目}`); }

  readonly 入力欄の項目 = [
    "buy_order_id", "customer_id", "customer_name", "assessment_member_name", "product_code", "product_name",
    "transfer_complete_date_from", "transfer_complete_date_to", "standard_price_from", "standard_price_to", "buy_price_from", "buy_price_to",
  ] as const;

  /** 入力欄の値を 項目→値 で返す（無い欄は「（欄が無い）」） */
  async 入力欄の値(): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const k of this.入力欄の項目) {
      const loc = this.欄(k);
      out[k] = (await loc.count()) === 0 ? "（欄が無い）" : await loc.inputValue();
    }
    return out;
  }

  async 買取番号を入れる(s: string): Promise<void> { await this.欄("buy_order_id").fill(s, { timeout: OPEN }); }
  async 会員IDを入れる(s: string): Promise<void> { await this.欄("customer_id").fill(s, { timeout: OPEN }); }
  async 査定担当者名を入れる(s: string): Promise<void> { await this.欄("assessment_member_name").fill(s, { timeout: OPEN }); }
  async 商品コードを入れる(s: string): Promise<void> { await this.欄("product_code").fill(s, { timeout: OPEN }); }
  async 基準価格を入れる(from: string, to: string): Promise<void> {
    await this.欄("standard_price_from").fill(from, { timeout: OPEN });
    await this.欄("standard_price_to").fill(to, { timeout: OPEN });
  }
  async 買取価格を入れる(from: string, to: string): Promise<void> {
    await this.欄("buy_price_from").fill(from, { timeout: OPEN });
    await this.欄("buy_price_to").fill(to, { timeout: OPEN });
  }

  private チェック(項目: "buy_order_status" | "language" | "condition") {
    return this.page.locator(`input[type=checkbox][name="admin_purchase_history[${項目}][]"]`);
  }

  private async 名前たち(項目: "buy_order_status" | "language" | "condition"): Promise<string[]> {
    return (await this.チェック(項目).evaluateAll((os) => os.map((o) => ((o as HTMLInputElement).labels?.[0]?.textContent ?? "").trim())));
  }

  /** ステータスのチェックボックスの選択肢（表示名） */
  async ステータスの選択肢(): Promise<string[]> { return this.名前たち("buy_order_status"); }
  async ステータスの付いた数(): Promise<number> { return this.チェック("buy_order_status").evaluateAll((os) => os.filter((o) => (o as HTMLInputElement).checked).length); }
  async 言語の選択肢(): Promise<string[]> { return this.名前たち("language"); }
  async 言語の付いた数(): Promise<number> { return this.チェック("language").evaluateAll((os) => os.filter((o) => (o as HTMLInputElement).checked).length); }
  async 状態の選択肢(): Promise<string[]> { return this.名前たち("condition"); }
  async 状態の付いた数(): Promise<number> { return this.チェック("condition").evaluateAll((os) => os.filter((o) => (o as HTMLInputElement).checked).length); }

  /** ステータスのチェックボックスに、表示名（補足の（…）は除いて比べる）でチェックを付ける */
  async ステータスを選ぶ(名前: string[]): Promise<void> {
    const have = await this.ステータスの選択肢();
    for (const n of 名前) {
      const i = have.findIndex((h) => 状況の名前(h) === 状況の名前(n));
      if (i < 0) throw new Error(`ステータスの選択肢に「${n}」が無い（ある選択肢: ${have.join("、")}）`);
      await this.チェック("buy_order_status").nth(i).check({ timeout: OPEN });
    }
  }

  async 検索する(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
      this.page.locator("#search_form button[type=submit]").click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 検索結果の該当件数（結果の見出しの文「検索結果 N 件が該当しました」の N）。見出しが出ていなければ null */
  async 該当件数(): Promise<number | null> {
    const t = this.page.locator("#search_form .fw-bold");
    if ((await t.count()) === 0) return null;
    const m = /([\d,]+)\s*件/.exec((await t.first().innerText()).replace(/\s+/g, " "));
    return m ? Number(m[1].replace(/,/g, "")) : null;
  }

  /** 表示されている結果の行 */
  async 行(): Promise<履歴の行[]> {
    const rows = this.page.locator("#result_list_main tbody tr");
    const n = await rows.count();
    const out: 履歴の行[] = [];
    for (let i = 0; i < n; i++) {
      const cells = (await rows.nth(i).locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
      if (cells.length < 13) continue; // 「検索条件に該当するデータがありませんでした。」の行
      out.push({
        買取番号: cells[1], 申込者: cells[2], 商品コード: cells[3], 商品名: cells[4], 基準価格: cells[5], 買取価格: cells[6],
        査定担当者: cells[7], 買取数: cells[8], 入庫数: cells[9], 増減数: cells[10], 振込完了日: cells[11], 更新日時: cells[12],
      });
    }
    return out;
  }

  /** 1ページ目から順にページングをたどって、全ページの行を集める（最大 30 ページ。ほかの買取履歴で結果が多いときに備える） */
  async 全ページの行(): Promise<履歴の行[]> {
    const out = await this.行();
    for (let p = 2; p <= 30; p++) {
      const link = this.page.locator("ul.pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${p}\\s*$`) }).first();
      if ((await link.count()) === 0) break;
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), link.click({ timeout: OPEN })]);
      await this.page.waitForLoadState("load");
      out.push(...(await this.行()));
    }
    return out;
  }

  /** 件数の選択肢（表示名） */
  async 件数の選択肢(): Promise<string[]> {
    return (await this.page.locator("#page_count_pulldown option").allInnerTexts()).map((t) => t.trim());
  }

  /** 件数を選ぶ（例 10件）。選ぶと画面が開き直る */
  async 件数を選ぶ(件数: number): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
      this.page.locator("#page_count_pulldown").selectOption({ label: `${件数}件` }, { timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** ページングの数字のリンクを押す */
  async ページを開く(番号: number): Promise<void> {
    const link = this.page.locator("ul.pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${番号}\\s*$`) }).first();
    await expect(link, `ページングの「${番号}」`).toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 商品コードの行の、CSVダウンロード対象のチェックを付ける */
  async 対象にする(商品コード: string): Promise<void> {
    const row = this.page.locator("#result_list_main tbody tr").filter({ has: this.page.getByRole("cell", { name: 商品コード, exact: true }) });
    await expect(row, `商品コード ${商品コード} の行`).toHaveCount(1, { timeout: OPEN });
    await row.locator('input[name="purchaseHistoryIds[]"]').check({ timeout: OPEN });
  }

  /** 「CSVダウンロード」を押し、メニューの項目を選んでダウンロードする */
  async CSVをダウンロードする(項目: "選択した商品履歴取得" | "検索結果全件取得"): Promise<Download> {
    await this.page.getByRole("button", { name: "CSVダウンロード", exact: true }).click({ timeout: OPEN });
    const item = this.page.getByRole("button", { name: 項目, exact: true });
    await expect(item, `CSVダウンロードのメニュー「${項目}」`).toBeVisible({ timeout: OPEN });
    const [file] = await Promise.all([this.page.waitForEvent("download", { timeout: 120_000 }), item.click({ timeout: OPEN })]);
    return file;
  }
}
