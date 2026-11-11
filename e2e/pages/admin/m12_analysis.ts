/** 分析・集計管理の画面（フォーマット売上分析 M12-07・M12-08、入荷通知依頼 一覧表示 M12-05）の操作。セレクタはここだけに書く。 */
import { expect, Locator, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";

/** フォーマット売上分析 集計一覧表示 */
export class FormatSalesPage {
  readonly 通販: Locator;
  readonly 店舗: Locator;
  readonly 集計結果: Locator;
  readonly CSVリンク: Locator;
  readonly エラー: Locator;
  readonly 集計月: Locator;
  readonly 検索ボタン: Locator;

  constructor(readonly page: Page) {
    this.集計月 = page.locator('input[name$="[month]"]');
    this.検索ボタン = page.locator('form[action$="/analysis/format-sales/search"] button[type="submit"]');
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

  /** 集計月（YYYY-MM）を入れる（日付の選択枠は開いたままにしない） */
  async 月を入れる(月: string): Promise<void> {
    await this.集計月.fill(月, { timeout: 20_000 });
    await this.集計月.press("Escape");
    await this.集計月.evaluate((n) => (n as HTMLInputElement).blur());
    expect(await this.集計月.inputValue(), "集計月の入力欄の値").toBe(月);
  }

  /** 検索ボタンを押し、日別の売上表（集計結果）が出るのを待つ */
  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.検索ボタン.click({ timeout: 20_000 })]);
    await expect(this.集計結果, "集計結果（日別の売上表）").toBeVisible({ timeout: 30_000 });
  }

  /** 日別の売上表（画面）。見出しの行と、日ごとの行（数字だけに直した値）。「¥1,000」の「¥」と桁区切りは外す */
  async 日別の売上表(): Promise<{ 見出し: string[]; 行: string[][] }> {
    const table = this.集計結果.locator("table").first();
    const 見出し = (await table.locator("thead th").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    const 行 = await Promise.all((await table.locator("tbody tr").all()).map(async (tr) =>
      (await tr.locator("td").allInnerTexts()).map((t) => t.replace(/[¥￥,\s]/g, ""))));
    return { 見出し, 行 };
  }

  /** 折れ線グラフ */
  get グラフ(): Locator { return this.page.locator("#formatSalesChart"); }

  /** フォーマットごとの合計表・平均表（結果の2つ目・3つ目の表）。見出し → 値（数字だけ） */
  private async 集計表(番号: number): Promise<Record<string, string>> {
    const table = this.集計結果.locator("table").nth(番号);
    const 見出し = (await table.locator("thead th").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    const 値 = (await table.locator("tbody tr").first().locator("td").allInnerTexts()).map((t) => t.replace(/[¥￥,\s]/g, ""));
    return Object.fromEntries(見出し.map((h, i) => [h, 値[i] ?? ""]));
  }
  async 合計表(): Promise<Record<string, string>> { return this.集計表(1); }
  async 平均表(): Promise<Record<string, string>> { return this.集計表(2); }

  /** CSVダウンロードの操作（画面のリンク）を押し、ダウンロードされたCSVを行と列にして返す。ダウンロードされなければ null */
  async CSVを取得する(): Promise<{ rows: string[][]; fileName: string } | null> {
    const download = this.page.waitForEvent("download", { timeout: 60_000 }).catch(() => null);
    await this.CSVリンク.first().click({ timeout: 20_000 });
    const d = await download;
    if (!d) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of await d.createReadStream()) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return { rows: parseCsv(decodeCsvBytes(Buffer.concat(chunks))), fileName: d.suggestedFilename() };
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

  get 検索ボタン(): Locator { return this.page.locator('form#search_form button[type="submit"]'); }
  get 結果の一覧(): Locator { return this.page.locator("#result_list_main__list"); }
  get CSVリンク(): Locator { return this.page.locator('a[href*="/analysis/product-request/export"]'); }
  get 該当なしの表示(): Locator { return this.page.locator("#result_list_main .box-title").filter({ hasText: "検索条件に該当するデータがありませんでした" }); }

  /** 入荷通知一覧CSV出力リンクを押し、ダウンロードされたCSVを行と列にして返す（見出しの行を含む。空の行は除く） */
  async CSVを出力する(): Promise<string[][]> {
    const [dl] = await Promise.all([this.page.waitForEvent("download", { timeout: 60_000 }), this.CSVリンク.first().click({ timeout: 20_000 })]);
    const chunks: Buffer[] = [];
    for await (const c of await dl.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    return parseCsv(decodeCsvBytes(Buffer.concat(chunks))).filter((r) => r.some((c) => c.trim() !== ""));
  }

  /** 表示件数の選択肢のうち、表示名（またはその値）が n のものを選ぶ */
  async 表示件数を選ぶ(n: string): Promise<void> {
    await this.表示件数.selectOption({ label: n }, { timeout: 20_000 }).catch(async () => { await this.表示件数.selectOption(n, { timeout: 20_000 }); });
  }

  /** 検索ボタンを押し、結果の画面（同じ画面）が出るのを待つ */
  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.検索ボタン.click({ timeout: 20_000 })]);
  }

  /** 依頼日(From)・(To)を空にし、キーワード検索を入れる（検索ボタンは押さない） */
  async 日付を空にしてキーワードを入れる(キーワード: string): Promise<void> {
    await this.依頼日From.fill("", { timeout: 20_000 });
    await this.依頼日To.fill("", { timeout: 20_000 });
    await this.キーワード.fill(キーワード, { timeout: 20_000 });
  }

  /** 言語の選択肢（日本語・英語・その他言語）のうち、指定の表示名だけを選んだ状態にする。空配列なら全部外す */
  async 言語を選ぶ(表示名: string[]): Promise<void> {
    await this.言語.evaluateAll((ns) => ns.forEach((n) => { (n as HTMLInputElement).checked = false; }));
    for (const n of 表示名) await this.page.getByLabel(n, { exact: true }).check({ timeout: 20_000 });
  }

  /** 販売金額・言語・並び替え(項目)・売上分析タグを未指定（空・選ばない）にする */
  async 金額と言語と並び替えとタグを未指定にする(): Promise<void> {
    await this.金額From.fill("", { timeout: 20_000 });
    await this.金額To.fill("", { timeout: 20_000 });
    await this.言語を選ぶ([]);
    if ((await this.並び替え項目.locator('option[value=""]').count()) > 0) await this.並び替え項目.selectOption("", { timeout: 20_000 });
    await this.売上分析タグ.evaluateAll((ns) => ns.forEach((n) => {
      if (n instanceof HTMLSelectElement) Array.from(n.options).forEach((o) => { o.selected = false; });
      else (n as HTMLInputElement).checked = false;
    }));
  }

  /** 検索結果の表の行（商品ID・言語・商品名・通知待ち・削除） */
  async 結果の行(): Promise<{ 商品ID: string; 言語: string; 商品名: string; 通知待ち: string; 削除: string }[]> {
    const rows = await this.page.locator("#result_list_main__list tbody tr").all();
    return Promise.all(rows.map(async (tr) => {
      const c = async (i: number) => ((await tr.locator(`td:nth-child(${i})`).textContent()) ?? "").replace(/\s+/g, " ").trim();
      return { 商品ID: await c(1), 言語: await c(2), 商品名: await c(3), 通知待ち: await c(4), 削除: await c(5) };
    }));
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
