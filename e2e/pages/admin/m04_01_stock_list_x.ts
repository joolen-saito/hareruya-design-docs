/**
 * M04-01 在庫検索/一覧の続き（-x）の画面操作。検索欄（基本・詳細）・検索の結果（件数・行）・行のチェックと操作のボタン（在庫一括編集・
 * 在庫移動登録・在庫振替登録・在庫分割登録・在庫結合登録）・CSV出力・表示件数・ページング・行の3点メニュー。セレクタはここだけに書く。
 * - 店舗・カテゴリ・エキスパンション・タグ・部門・棚番号・略称タグ・売上分析タグは複数選択のサジェスト欄（select2）。
 * - 操作のボタンは、行を1件以上チェックすると活性になり、押したときに条件（同じ店舗・同じ在庫区分・権限・在庫0）を画面のスクリプトが確かめ、
 *   外れればアラートを出して移らない。
 * 正本: cases/M04-01_test_cases.tsv
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";

export type 行の値 = { 商品ID: string; 商品名: string; 商品コード: string; 店舗: string; 在庫区分: string; 在庫: string; 基準価格: string; 販売価格: string };
export type 押した結果 = { アラート: string[]; 移った先: string; 移った: boolean };

const ID = (name: string) => `#admin_search_stock_list_${name}`;

export class StockListX {
  readonly form: Locator;
  readonly rows: Locator;
  readonly alerts: string[] = [];

  constructor(readonly page: Page) {
    this.form = page.locator("form#searchStockListForm");
    this.rows = page.locator("table tbody tr").filter({ has: page.locator("input.row-check") });
    page.on("dialog", (d) => { this.alerts.push(d.message()); d.accept().catch(() => {}); });
  }

  /** 在庫検索一覧を開く（検索条件の指定の無いアドレス） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/product/stock"));
    expect(res?.status(), "在庫検索一覧画面の応答").toBe(200);
    await expect(this.form, "在庫検索一覧の検索欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  field(name: string): Locator { return this.page.locator(ID(name)); }
  async 入れる(name: "product_name" | "card_name" | "product_id" | "product_code" | "pattern_name" | "base_price_from" | "sell_price_from", v: string): Promise<void> {
    await this.field(name).fill(v);
  }

  /** 詳細検索の欄が折りたたまれていれば開く */
  async 詳細検索を開く(): Promise<void> {
    const area = this.page.locator("#searchDetailArea");
    if (await area.evaluate((el) => el.classList.contains("show")).catch(() => false)) return;
    await this.page.locator('[data-bs-toggle="collapse"][href="#searchDetailArea"]').click();
    await expect(area, "詳細検索の欄").toHaveClass(/show/, { timeout: 10_000 });
    await this.page.waitForTimeout(400);
  }

  /** 複数選択の欄（select2）の選択を、選択肢の表示名でそろえる（画面に打ち込む手順ではない設定用） */
  async 選ぶ(name: string, labels: string[]): Promise<void> {
    const sel = this.field(name);
    await expect(sel, `検索欄 ${name}`).toHaveCount(1);
    const missing = await sel.evaluate((el, ls) => {
      const s = el as HTMLSelectElement;
      const opts = Array.from(s.options);
      const miss = ls.filter((l) => !opts.some((o) => (o.textContent ?? "").trim() === l));
      for (const o of opts) o.selected = ls.includes((o.textContent ?? "").trim());
      s.dispatchEvent(new Event("change", { bubbles: true }));
      return miss;
    }, labels);
    if (missing.length) throw new Error(`検索欄 ${name} の選択肢に ${missing.join("・")} が無い`);
  }

  /** 選ばれている選択肢の表示名 */
  async 選ばれている(name: string): Promise<string[]> {
    return this.field(name).evaluate((el) => Array.from((el as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  }
  async 選択肢(name: string): Promise<string[]> {
    return this.field(name).evaluate((el) => Array.from((el as HTMLSelectElement).options).map((o) => (o.textContent ?? "").trim()).filter(Boolean));
  }

  /**
   * サジェスト欄に文字を打ち、出た候補のうち labels を順に選ぶ。打つたびに出た候補の表示名を返す。
   * 選ぶと候補の一覧が閉じるので、2件目は打ち直して選ぶ。
   */
  async 打って選ぶ(name: string, term: string, labels: string[]): Promise<string[][]> {
    const seen: string[][] = [];
    for (const label of labels) {
      await this.page.locator(`${ID(name)} + .select2 .select2-selection`).click();
      const input = this.page.locator(`${ID(name)} + .select2 .select2-search__field, .select2-container--open .select2-search__field`).first();
      await input.fill(term);
      const options = this.page.locator(".select2-container--open .select2-results__option");
      await expect(options.first(), `「${term}」の候補`).toBeVisible({ timeout: 15_000 });
      await this.page.waitForTimeout(500);
      const texts = (await options.allInnerTexts()).map((t) => t.trim());
      seen.push(texts);
      const i = texts.indexOf(label);
      if (i < 0) throw new Error(`「${term}」の候補に「${label}」が無い（候補: ${texts.join("、")}）`);
      await options.nth(i).click();
      await this.page.keyboard.press("Escape");
    }
    return seen;
  }

  /** 在庫区分のチェック欄（表示名「EC-CUBE」「スマレジ」） */
  在庫区分(label: string): Locator {
    return this.form.locator('input[name="admin_search_stock_list[stock_zone][]"]').and(this.page.getByLabel(label, { exact: true }));
  }

  /** 検索ボタンを押し、結果の画面の読み込みまで待つ */
  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.form.locator("button.btn-ec-conversion[type=submit]", { hasText: "検索" }).first().click()]);
    await expect(this.page.locator("table tbody tr").first(), "検索の結果の表").toBeAttached({ timeout: 30_000 });
  }

  /** 「検索結果：N件が該当しました」の件数（出ていなければ null） */
  async 検索結果件数(): Promise<number | null> {
    const p = this.page.locator("p", { hasText: /検索結果：[\d,]+件/ }).first();
    if (!(await p.count())) return null;
    const m = /検索結果：([\d,]+)件/.exec((await p.innerText()).replace(/\s+/g, ""));
    return m ? Number(m[1].replace(/,/g, "")) : null;
  }

  /** 一覧の行の値（上から） */
  async 行(): Promise<行の値[]> {
    return this.rows.evaluateAll((trs) => trs.map((tr) => {
      const t = (sel: string) => ((tr.querySelector(sel)?.textContent) ?? "").replace(/\s+/g, " ").trim();
      const prices = Array.from(tr.querySelectorAll("td.col-price")).map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim());
      return {
        商品ID: t("td.col-id"), 商品名: t("td.col-name a"), 商品コード: t("td.col-name .text-muted"),
        店舗: t("td.col-shop > div:first-child"), 在庫区分: t("td.col-shop > div.text-muted"), 在庫: t("td.col-stock"),
        基準価格: prices[0] ?? "", 販売価格: prices[1] ?? "",
      };
    }));
  }

  /** 商品コード・店舗・在庫区分の行 */
  行の(code: string, 店舗?: string, 在庫区分?: string): Locator {
    let r = this.rows.filter({ has: this.page.locator("td.col-name .text-muted", { hasText: new RegExp(`^\\s*${esc(code)}\\s*$`) }) });
    if (店舗) r = r.filter({ has: this.page.locator("td.col-shop > div:first-child", { hasText: new RegExp(`^\\s*${esc(店舗)}\\s*$`) }) });
    if (在庫区分) r = r.filter({ has: this.page.locator("td.col-shop > div.text-muted", { hasText: new RegExp(`^\\s*${esc(在庫区分)}\\s*$`) }) });
    return r;
  }
  async チェックする(row: Locator, what: string): Promise<void> {
    await expect(row, `${what}の行は1件`).toHaveCount(1);
    await row.locator("input.row-check").check();
  }

  ボタン(名前: "在庫一括編集" | "在庫移動登録" | "在庫振替登録" | "在庫分割登録" | "在庫結合登録"): Locator {
    const id = { 在庫一括編集: "bulkEditBtn", 在庫移動登録: "stockMoveBtn", 在庫振替登録: "stockTransferBtn", 在庫分割登録: "stockSplitBtn", 在庫結合登録: "stockJoinBtn" }[名前];
    return this.page.locator(`#${id}`);
  }

  /** ボタンを押し、移るかアラートが出るのを待つ（最大15秒） */
  async 押す(ボタン: Locator): Promise<押した結果> {
    const before = this.page.url();
    const n = this.alerts.length;
    await ボタン.click();
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (this.page.url() !== before || this.alerts.length > n) break;
      await this.page.waitForTimeout(250);
    }
    await this.page.waitForLoadState("load").catch(() => {});
    if (this.alerts.length > n && this.page.url() === before) await this.page.waitForTimeout(1500);
    return { アラート: this.alerts.slice(n), 移った先: this.page.url(), 移った: this.page.url() !== before };
  }

  /** 検索条件クリアのボタン */
  get クリアボタン(): Locator { return this.page.locator("#clearSearchBtn"); }

  // ---- CSV・表示件数・ページング・3点メニュー ----
  get 在庫リコメンドCSV出力(): Locator { return this.page.locator('a.btn[href*="recommend"]', { hasText: "在庫リコメンドCSV出力" }); }
  get 在庫情報CSV出力(): Locator { return this.page.locator("a.btn", { hasText: /^\s*在庫情報CSV出力\s*$/ }); }

  /** CSV のリンクを押してダウンロードし、行（見出しを含む）を返す */
  async CSVを落とす(link: Locator): Promise<{ ファイル名: string; 行: string[][] }> {
    const [dl] = await Promise.all([this.page.waitForEvent("download", { timeout: 60_000 }), link.click()]);
    const buf = await downloadBytes(dl);
    return { ファイル名: dl.suggestedFilename(), 行: parseCsv(decodeCsvBytes(buf)).filter((r) => r.some((c) => c !== "")) };
  }

  get 表示件数(): Locator { return this.page.locator("#page_count_pulldown"); }
  async 表示件数の選択肢(): Promise<{ 表示: string[]; 選ばれている: string }> {
    return this.表示件数.evaluate((el) => {
      const s = el as HTMLSelectElement;
      return { 表示: Array.from(s.options).map((o) => (o.textContent ?? "").trim()), 選ばれている: (s.selectedOptions[0]?.textContent ?? "").trim() };
    });
  }

  /** ページングの番号を押す */
  async ページへ(n: number): Promise<void> {
    const link = this.page.locator(".pagination a, ul.pagination a").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) }).first();
    await expect(link, `ページングの ${n}`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  }

  /** 行の3点メニューを開く */
  async 行のメニューを開く(row: Locator): Promise<void> {
    await expect(row, "3点メニューを押す行は1件").toHaveCount(1);
    await row.locator(".js-stock-row-menu-btn").click();
    await expect(this.page.locator(".js-stock-row-menu:visible"), "3点メニュー").toHaveCount(1);
  }
  /** 開いている3点メニューの項目（表示名）を押して移る */
  async 開いたメニューの項目を押す(項目: string): Promise<void> {
    const item = this.page.locator(".js-stock-row-menu:visible a.dropdown-item", { hasText: 項目 }).first();
    await expect(item, `3点メニューの「${項目}」`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), item.click()]);
  }

  /** 行の3点メニューを開き、項目（表示名）を押して移る */
  async 行のメニューから(row: Locator, 項目: string): Promise<void> {
    await expect(row, "3点メニューを押す行は1件").toHaveCount(1);
    await row.locator(".js-stock-row-menu-btn").click();
    const item = this.page.locator(".js-stock-row-menu:visible a.dropdown-item", { hasText: 項目 }).first();
    await expect(item, `3点メニューの「${項目}」`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), item.click()]);
  }
}

function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

async function downloadBytes(dl: Download): Promise<Buffer> {
  const stream = await dl.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}
