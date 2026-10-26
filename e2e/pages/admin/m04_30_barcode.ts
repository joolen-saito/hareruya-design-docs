/**
 * M04-30 バーコード貼替リストCSV出力（メニュー「在庫管理」→「バーコード貼替リストCSV出力」）。
 * 画面の作り（アプリのテンプレート barcode_replacement_list.twig とフォームの型 BarcodeReplacementListType で確かめたこと）:
 * - 出力対象店舗は1つだけ選べる選択欄。初期値はログイン中の管理者のデフォルト検索表示店舗。選択肢は店舗の表の全店舗。
 * - 価格調整発生期間は日付の欄が2つ（From・To）。初期値は From が前日、To が当日（アプリのサーバーの日付）。
 * あわせて、店舗一覧から店名で店舗を探す部品（シードが「店舗A」「店舗B」を探すのに使う）を置く。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class BarcodeReplacementListPage {
  readonly form: Locator;
  readonly 出力対象店舗: Locator;
  readonly 価格調整発生期間From: Locator;
  readonly 価格調整発生期間To: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#barcode_replacement_list_form");
    this.出力対象店舗 = page.locator('[name="admin_barcode_replacement_list[base_info]"]');
    this.価格調整発生期間From = page.locator('[name="admin_barcode_replacement_list[price_change_period_from]"]');
    this.価格調整発生期間To = page.locator('[name="admin_barcode_replacement_list[price_change_period_to]"]');
  }

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/product/stock/barcode_replacement_list"));
    if (!res || !res.ok()) throw new Error(`バーコード貼替リストCSV出力画面を開けない（応答 ${res?.status() ?? "なし"}）`);
    await this.page.waitForLoadState("load");
    await expect(this.form, "バーコード貼替リストCSV出力画面の入力欄").toBeVisible();
  }

  /** 出力対象店舗で選ばれている選択肢（表示と値。複数選べる欄なら全部） */
  async selectedStores(): Promise<{ 表示: string; 値: string }[]> {
    return this.出力対象店舗.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions)
      .map((o) => ({ 表示: (o.textContent ?? "").trim(), 値: o.value })));
  }

  /** 出力対象店舗の選択肢のうち、表示が店名と一致するものの数 */
  async optionCount(店名: string): Promise<number> {
    const labels = await this.出力対象店舗.locator("option").allTextContents();
    return labels.filter((l) => l.trim() === 店名).length;
  }

  /** 出力対象店舗で、表示が店名と一致する選択肢を選ぶ（利用者が選択欄で選ぶのと同じく、選択欄の値を切り替える） */
  async chooseStore(店名: string): Promise<void> {
    await expect(this.出力対象店舗, "出力対象店舗の選択欄").toBeEnabled();
    expect(await this.optionCount(店名), `出力対象店舗の選択肢「${店名}」の数`).toBe(1);
    await this.出力対象店舗.selectOption({ label: 店名 });
  }
}

export type ListedStore = { id: string; 店名: string; 会社名: string; 開店: string };

/** 店舗一覧の全行（ID・店名・会社名・開店/閉店）。店舗一覧は親店舗（店舗ID 1）を出さない */
export async function listedStores(page: Page): Promise<ListedStore[]> {
  const res = await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"));
  if (!res || !res.ok()) throw new Error(`店舗一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  return page.locator('table.table tbody tr[id^="ex-tenant-"]').evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { id: td(1), 店名: td(2), 会社名: td(3), 開店: td(5) };
  }));
}
