/** 分析・集計管理の画面（フォーマット売上分析 M12-07・M12-08、入荷通知依頼 一覧表示 M12-05）の操作。セレクタはここだけに書く。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** フォーマット売上分析 集計一覧表示 */
export class FormatSalesPage {
  readonly 通販: Locator;
  readonly 店舗: Locator;
  readonly 集計結果: Locator;
  readonly CSVリンク: Locator;
  readonly エラー: Locator;

  constructor(readonly page: Page) {
    this.通販 = page.locator('input[name$="[mail_order_enabled]"]');
    this.店舗 = page.locator('input[name$="[store_enabled]"]');
    this.集計結果 = page.locator("#result_list");
    this.CSVリンク = page.locator('a[href*="/analysis/format-sales/export"]');
    this.エラー = page.locator(".alert-danger");
  }

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/analysis/format-sales"));
    expect(res?.status() ?? 0, "フォーマット売上分析 集計一覧表示画面の応答").toBeLessThan(400);
    await expect(this.通販, "集計対象(通販)のチェック欄").toBeVisible({ timeout: 30_000 });
  }

  /** CSVダウンロードのアドレスを直接開く */
  async openCsvUrl(): Promise<void> {
    await this.page.goto(adminUrl("/analysis/format-sales/export"), { waitUntil: "domcontentloaded" }).catch(() => undefined);
  }
}

/** 入荷通知依頼 一覧表示(検索項目) */
export class ProductRequestPage {
  readonly キーワード: Locator;
  readonly 検索枠: Locator;
  readonly 検索枠ボタン: Locator;
  readonly 依頼日From: Locator;
  readonly 依頼日To: Locator;
  readonly 金額From: Locator;
  readonly 金額To: Locator;
  readonly 言語: Locator;
  readonly 並び替え項目: Locator;
  readonly 並び順: Locator;
  readonly 売上分析タグ: Locator;
  readonly 表示件数: Locator;
  readonly クリア: Locator;

  constructor(readonly page: Page) {
    const f = (n: string) => page.locator(`[name="admin_analysis_product_request[${n}]"]`);
    this.キーワード = f("multi");
    this.検索枠 = page.locator("#searchDetail");
    this.検索枠ボタン = page.locator('[data-bs-toggle="collapse"][href="#searchDetail"]');
    this.依頼日From = f("create_date_from");
    this.依頼日To = f("create_date_to");
    this.金額From = f("price_from");
    this.金額To = f("price_to");
    this.言語 = page.locator('input[name^="admin_analysis_product_request[language]"]');
    this.並び替え項目 = f("sort_key");
    this.並び順 = page.locator('input[name="admin_analysis_product_request[asc_desc]"]');
    this.売上分析タグ = page.locator('[name^="admin_analysis_product_request[tag_sales_analysis]"]');
    this.表示件数 = f("page_count");
    this.クリア = page.locator("#search_form a.search-clear");
  }

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/analysis/product-request"));
    expect(res?.status() ?? 0, "入荷通知依頼 一覧表示(検索項目)画面の応答").toBeLessThan(400);
    await expect(this.キーワード, "キーワード検索の欄").toBeVisible({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }

  /** 識別ID 1〜12 のうち、クリアで戻る項目の現在の値を読む（2は検索枠のボタンなので含めない） */
  async 値を読む(): Promise<Record<string, string>> {
    const checked = async (l: Locator) => (await l.evaluateAll((ns) => ns.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).value))).join(",");
    const tags = await this.売上分析タグ.evaluateAll((ns) => ns.map((n) => {
      const e = n as HTMLSelectElement | HTMLInputElement;
      return e instanceof HTMLSelectElement ? Array.from(e.selectedOptions).map((o) => o.value).join(",") : (e as HTMLInputElement).checked ? e.value : "";
    }).filter(Boolean).join(","));
    return {
      キーワード: await this.キーワード.inputValue(), 依頼日From: await this.依頼日From.inputValue(), 依頼日To: await this.依頼日To.inputValue(),
      金額From: await this.金額From.inputValue(), 金額To: await this.金額To.inputValue(), 言語: await checked(this.言語),
      並び替え項目: await this.並び替え項目.inputValue(), 並び順: await checked(this.並び順), 売上分析タグ: tags, 表示件数: await this.表示件数.inputValue(),
    };
  }
}
