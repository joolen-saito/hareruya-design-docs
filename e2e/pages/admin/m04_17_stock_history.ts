/**
 * M04-17 在庫履歴検索一覧（検索入力・検索結果）の画面操作。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのソースで確かめたこと）:
 * - メニューから開く初期表示は検索をせず、一覧を出さない。前回の検索条件も戻さない。
 * - 検索欄のうち「商品名(日/英)・カード名・商品コード」「店舗」「在庫区分」はアコーディオンの外にあり、
 *   「検索条件をクリア」はアコーディオンの中（登録日〜在庫変動理由・欠品理由）だけを空にする。店舗はログイン中のメンバーの
 *   デフォルト検索表示店舗が入ったまま残る。
 * - 「検索条件をクリア」と欠品検索の切り替えは画面のスクリプトで動くので、読み込みを待ってから操作する。
 * - 検索の件数は検索ボタンの横に「検索結果：N件が該当しました」と出る。一覧は件数が1件以上のときだけ出る。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** 一覧の1行。見出しの文言 → 表示の文字列 */
export type HistoryRow = Record<string, string>;

/** 検索欄の初期値として確かめる項目 */
export type HistorySearchValues = {
  キーワード: string;
  店舗: string[];
  登録日From: string;
  公開種別: string[];
  状態: string[];
};

export class StockHistoryPage {
  readonly form: Locator;
  readonly list: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#search_form");
    this.list = page.locator("#stockHistoryList");
  }

  private field(name: string): Locator {
    return this.form.locator(`#admin_stock_history_${name}`);
  }

  get キーワード欄(): Locator { return this.field("product_name"); }
  get 在庫変動理由欄(): Locator { return this.field("stock_change_reason"); }
  get 在庫変動理由区分欄(): Locator { return this.field("stock_change_type_detail"); }
  get 欠品検索(): Locator { return this.form.locator('input[name="admin_stock_history[disposal_search][]"]'); }

  /** メニューから開くのと同じ、条件を付けない初期表示 */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/product/stock/history"));
    expect(res?.status(), "在庫履歴検索一覧の応答").toBe(200);
    await expect(this.form, "在庫履歴検索一覧の検索欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /**
   * 「検索条件をクリア」を押す。登録日(from)には初期値（当月1日）が入っているので、押したあと空になったことで
   * 画面のスクリプトが動いたことを確かめる（読み込み前に押して素通りしていないこと）。
   */
  async clearConditions(): Promise<void> {
    const link = this.page.locator("#search_box_main__clear .js-stock-history-search-clear");
    await expect(link, "「検索条件をクリア」のリンク").toHaveText(/検索条件をクリア/);
    await link.click();
    await expect(this.field("create_date_from"), "「検索条件をクリア」を押すと登録日(from)が空になる").toHaveValue("");
  }

  async fillKeyword(value: string): Promise<void> {
    await this.キーワード欄.fill(value);
  }

  /** 「在庫変動理由・欠品理由」の欄（画面には在庫変動理由と欠品理由を分けた欄は無く、この1つの欄で両方を探す） */
  async fillReason(value: string): Promise<void> {
    await expect(this.在庫変動理由欄, "「在庫変動理由・欠品理由」の欄に入力できる").toBeEditable();
    await this.在庫変動理由欄.fill(value);
  }

  async fillSellPrice(from: string, to: string): Promise<void> {
    await this.field("sell_price_from").fill(from);
    await this.field("sell_price_to").fill(to);
  }

  /** 欠品検索の「欠品履歴一覧を表示」のチェックを付け外しする（画面のスクリプトが連動する項目を切り替える） */
  async setDisposalSearch(on: boolean): Promise<void> {
    const box = this.欠品検索;
    await expect(box, "欠品検索の選択肢は1つ").toHaveCount(1);
    const label = await box.evaluate((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "");
    expect(label, "欠品検索の選択肢の文言").toBe("欠品履歴一覧を表示");
    await expect(box, "欠品検索のチェック欄を操作できる").toBeEnabled();
    await box.setChecked(on);
  }

  /** 検索ボタンを押し、結果の画面の読み込みまで待つ。応答の状態を返す */
  async submit(): Promise<number> {
    const button = this.form.locator('button[type="submit"]');
    await expect(button, "検索ボタン").toHaveText(/検索/);
    const [res] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      button.click(),
    ]);
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 検索ボタンの横の件数の表示。出ていなければ null */
  async resultCount(): Promise<number | null> {
    const span = this.form.locator("span.fw-bold.ms-2");
    if ((await span.count()) === 0) return null;
    const text = (await span.innerText()).replace(/\s+/g, " ").trim();
    const m = /検索結果：\s*(\d+)\s*件が該当しました/.exec(text);
    if (!m) throw new Error(`検索結果の件数の表示を読めない: ${text}`);
    return Number(m[1]);
  }

  /** 一覧の見出し */
  async headers(): Promise<string[]> {
    return this.list.locator("thead th").evaluateAll((ths) => ths.map((th) => ((th as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim()));
  }

  /** 一覧の行。見出しの文言で引ける形にする（表示されている文字だけを読む） */
  async rows(): Promise<HistoryRow[]> {
    if ((await this.list.count()) === 0) return [];
    const heads = await this.headers();
    const cells = await this.list.locator('tbody tr[id^="ex-product-"]').evaluateAll((trs) => trs.map((tr) =>
      Array.from(tr.querySelectorAll(":scope > td")).map((td) => ((td as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim())));
    return cells.map((row) => {
      if (row.length !== heads.length) throw new Error(`一覧の行の列の数（${row.length}）が見出しの数（${heads.length}）と違う`);
      return Object.fromEntries(heads.map((h, i) => [h, row[i]]));
    });
  }

  /** 画面の上部・一覧の場所に出ているメッセージ（注記用） */
  async messages(): Promise<string[]> {
    const texts = await this.page.locator(".alert, .c-contentsArea__primaryCol .card-body .text-muted").allInnerTexts();
    return [...new Set(texts.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean))];
  }

  /** 一覧の上の「CSVダウンロード」を押し、ダウンロードを待つ */
  async downloadCsv(): Promise<Download> {
    const button = this.page.locator("#form_bulk button[type=submit]").filter({ hasText: "CSVダウンロード" });
    await expect(button, "「CSVダウンロード」ボタン").toHaveCount(1);
    const [download] = await Promise.all([this.page.waitForEvent("download"), button.click()]);
    return download;
  }

  /** 在庫変動理由区分の選択内容（表示の文言） */
  async selectedChangeTypes(): Promise<string[]> {
    return this.在庫変動理由区分欄.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  }

  private async checkedLabels(name: string): Promise<string[]> {
    return this.form.locator(`input[name="admin_stock_history[${name}][]"]`).evaluateAll((inputs) => inputs
      .filter((i) => (i as HTMLInputElement).checked)
      .map((i) => (i as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
  }

  /** 店舗の選択内容（表示の文言） */
  async selectedShops(): Promise<string[]> {
    return this.field("base_info").evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.textContent?.trim() ?? ""));
  }

  /** 初期値として確かめる項目の、いまの値 */
  async searchValues(): Promise<HistorySearchValues> {
    return {
      キーワード: await this.キーワード欄.inputValue(),
      店舗: await this.selectedShops(),
      登録日From: await this.field("create_date_from").inputValue(),
      公開種別: await this.checkedLabels("status"),
      状態: await this.checkedLabels("card_condition"),
    };
  }

  /**
   * 検索の送信に含まれる「並び順」の項目。項目の名前に、並び順を表す英語の語を含む入力欄を探す。
   * 開発者ツールで送信値を書き換える手順は、この項目の値を書き換えることで行う。
   */
  sortOrderFields(): Locator {
    return this.form.locator('[name*="sort" i], [name*="order" i]');
  }

  /** 開発者ツールで送信値を書き換えるのと同じく、項目の値をその場で書き換える（選択欄なら、その値の選択肢を足して選ぶ） */
  async overwriteValue(field: Locator, value: string): Promise<void> {
    await field.evaluate((el, v) => {
      if (el instanceof HTMLSelectElement) {
        const option = document.createElement("option");
        option.value = v;
        option.textContent = v;
        el.appendChild(option);
        el.value = v;
      } else {
        (el as HTMLInputElement).value = v;
      }
    }, value);
  }
}

/** 「￥1,000」のような金額・数の表示を数にする。数でなければ null（「-」など） */
export function numberOf(text: string): number | null {
  const t = text.replace(/[￥¥,\s]/g, "");
  return /^-?\d+$/.test(t) ? Number(t) : null;
}

/** 今月の1日（登録日(from)の初期値。画面の入力欄の値の形 YYYY-MM-DD） */
export function firstDayOfThisMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * 在庫変動履歴CSVと欠品履歴CSVを見分ける見出し（CSVダウンロードで落ちてきたのが在庫変動履歴CSVであることを確かめる）。
 * 設計書の Excel 由来の部分「在庫変動履歴CSV出力」（出力項目 1〜27）と「欠品履歴CSV出力」（出力項目 1〜16）を比べ、
 * 片方にだけある項目を並べた。商品コード〜登録元ID・登録日・登録者・最終更新日・最終更新者は両方にあるので見分けに使えない。
 */
export const 在庫変動履歴CSVだけの見出し = [
  "変更前在庫", "変更後在庫", "在庫増減数", "在庫変動理由区分", "在庫変動理由", "変更時販売価格", "仕入単価",
  "変更前原価単価", "変更後原価単価", "総原価増減数", "変更前総原価", "変更後総原価", "承認日", "承認者",
];
export const 欠品履歴CSVだけの見出し = ["欠品点数", "欠品時販売価格", "欠品理由"];
