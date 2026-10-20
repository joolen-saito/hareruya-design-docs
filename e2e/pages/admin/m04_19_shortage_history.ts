/**
 * M04-19 欠品履歴検索一覧の画面操作。
 *
 * 欠品履歴検索一覧は独立した画面ではなく、在庫履歴検索一覧（メニュー「在庫管理」→「在庫履歴一覧」）の検索欄で
 * 「欠品検索」の「欠品履歴一覧を表示」にチェックを付けて検索したときの結果の表示である（設計書 0202「欠品履歴検索一覧(検索結果)」★2-1）。
 * 結果の一覧の列は、設計書の識別ID 2-1〜2-16 の順（商品コード・商品名・言語・状態・Foil・店舗・在庫区分・登録元・登録元ID・
 * 欠品点数・欠品時販売価格・欠品理由・登録日・登録者・最終更新日・最終更新者）に並ぶ。
 * 画面の作りはアプリの在庫履歴の画面のテンプレートと、検索欄のフォームの型で確かめた。
 */
import { BrowserContext, Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { setChecked } from "./common";

/** 一覧の1行（欠品履歴の表示）。値は画面の表示の文字（前後の空白を詰めたもの） */
export type 欠品履歴の行 = {
  履歴ID: string;
  商品コード: string; 商品名: string; 言語: string; 状態: string; Foil: string; 店舗: string; 在庫区分: string;
  登録元: string; 登録元ID: string; 欠品点数: string; 欠品時販売価格: string; 欠品理由: string;
  登録日: string; 登録者: string; 最終更新日: string; 最終更新者: string;
};

/** 欠品履歴の一覧の列（設計書の識別ID 2-1〜2-16 の順） */
const 列 = [
  "商品コード", "商品名", "言語", "状態", "Foil", "店舗", "在庫区分", "登録元", "登録元ID",
  "欠品点数", "欠品時販売価格", "欠品理由", "登録日", "登録者", "最終更新日", "最終更新者",
] as const;

export type 表示件数の選択肢 = { 表示: string; 件数: string; 選択中: boolean };

/** 管理画面の画面上部の見出し（例「在庫編集」「受注登録」） */
export async function adminPageTitle(page: Page): Promise<string> {
  const title = page.locator("h2.c-pageTitle__title");
  if ((await title.count()) === 0) return "";
  return ((await title.first().textContent()) ?? "").trim();
}

/** 画面に表示された文字の全体 */
export async function 画面の文字(page: Page): Promise<string> {
  return (await page.locator("body").innerText()).replace(/\s+/g, " ");
}

/** 「￥1,980」のような金額の表示から数字だけを取り出す */
export const 数字だけ = (text: string): string => text.replace(/[^\d-]/g, "");

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class ShortageHistoryPage {
  readonly form: Locator;
  readonly list: Locator;
  readonly rows: Locator;
  readonly 件数の表示: Locator;
  readonly 該当なしの表示: Locator;
  readonly 表示件数: Locator;
  readonly 欠品検索: Locator;
  readonly 商品名などの欄: Locator;
  readonly 登録日の開始: Locator;
  readonly 登録日の終了: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#search_form");
    this.list = page.locator("#stockHistoryList");
    this.rows = this.list.locator("table tbody tr");
    this.件数の表示 = this.form.getByText(/^\s*検索結果：\d+件が該当しました\s*$/);
    this.該当なしの表示 = page.getByText("検索条件に合致するデータが見つかりませんでした", { exact: true });
    this.表示件数 = page.locator("#page_count_pulldown");
    this.欠品検索 = this.form.locator('input[name="admin_stock_history[disposal_search][]"]');
    this.商品名などの欄 = this.form.locator("#admin_stock_history_product_name");
    this.登録日の開始 = this.form.locator("#admin_stock_history_create_date_from");
    this.登録日の終了 = this.form.locator("#admin_stock_history_create_date_to");
  }

  /** 画面上部の見出し（在庫履歴の画面は「在庫履歴一覧」） */
  async 見出し(): Promise<string> {
    return ((await this.page.locator("h2.c-pageTitle__title").first().textContent()) ?? "").trim();
  }

  /** 検索欄が出て、画面のスクリプトが読み込まれるまで待つ（「検索条件をクリア」・欠品検索のチェックはスクリプトで動く） */
  async ready(): Promise<void> {
    await expect(this.form, "在庫履歴検索一覧の検索欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /**
   * 管理メニューの「在庫管理」→「在庫履歴一覧」を押して、在庫履歴検索一覧(検索入力)画面を初期表示する。
   * 管理画面の中にいなければ、管理画面のトップを開いてからメニューを使う。
   */
  async openFromMenu(): Promise<void> {
    if (!this.page.url().startsWith(adminUrl("/"))) await this.page.goto(adminUrl("/"));
    await this.page.waitForLoadState("load");
    const link = this.page.locator('#nav-product_stock a[href$="/product/stock/history"]');
    await expect(link, "管理メニューの「在庫管理」の中の「在庫履歴一覧」").toHaveCount(1);
    if (!(await link.isVisible())) {
      await this.page.locator('a.c-mainNavArea__navItemTitle[href="#nav-product_stock"]').click();
      await expect(link, "管理メニューの「在庫管理」を開くと「在庫履歴一覧」が見える").toBeVisible();
    }
    await expect(link, "メニューの項目名").toHaveText(/^\s*在庫履歴一覧\s*$/);
    // 同じアドレス（検索の送信のあと）から押すこともあるので、アドレスの一致ではなく画面の移動を待つ
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click()]);
    await expect(this.page, "在庫履歴検索一覧(検索入力)画面のアドレス").toHaveURL(/\/product\/stock\/history(\?.*)?$/);
    await this.ready();
  }

  /** 検索欄の下の「検索条件をクリア」を押す（詳細検索の欄が空になる） */
  async clearConditions(): Promise<void> {
    const clear = this.page.locator("#search_box_main__clear .js-stock-history-search-clear");
    await expect(clear, "「検索条件をクリア」").toHaveText(/^\s*検索条件をクリア\s*$/);
    await clear.click();
  }

  /** 欠品検索の「欠品履歴一覧を表示」にチェックを付ける */
  async checkShortageList(): Promise<void> {
    await expect(this.欠品検索, "欠品検索のチェック欄は1つ").toHaveCount(1);
    const label = await this.欠品検索.evaluate((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "");
    expect(label, "欠品検索のチェック欄の名前").toBe("欠品履歴一覧を表示");
    await setChecked(this.欠品検索, true);
  }

  /** 欠品検索の「欠品履歴一覧を表示」にチェックが付いているか */
  async 欠品検索にチェックがある(): Promise<boolean> {
    await expect(this.欠品検索, "欠品検索のチェック欄は1つ").toHaveCount(1);
    return this.欠品検索.isChecked();
  }

  /**
   * 他の画面から在庫履歴一覧へ戻ったときの表示を開く（欠品理由を保存したあとの戻り先と同じアドレス）。
   * アプリはこの表示で、保持している検索条件とページ番号を元に戻して一覧を出す（在庫履歴の画面のコントローラの「他画面から遷移した場合」）。
   * 保持値が残っているかどうかを、画面で確かめるために開く。データは変えない（表示の要求だけ）。
   * 「開けた」は、応答が200で、アドレスが戻りの表示のままで、検索欄が出たときだけ true。
   * 上限の時間を過ぎた・応答が異常・検索欄が無いときは false を返す（例外にしない。前の画面のまま「開けた」と見なさない）。
   */
  async 戻りの表示を開く(上限ミリ秒 = 300_000): Promise<{ 開けた: boolean; 応答: string; 秒: number }> {
    const t0 = Date.now();
    const 秒 = () => Math.round((Date.now() - t0) / 100) / 10;
    let status = 0;
    try {
      const res = await this.page.goto(adminUrl("/product/stock/history?resume=1"), { waitUntil: "domcontentloaded", timeout: 上限ミリ秒 });
      status = res?.status() ?? 0;
    } catch (e) {
      return { 開けた: false, 応答: `${上限ミリ秒 / 1000}秒以内に開けなかった（${((e as Error).message ?? "").split("\n")[0]}）`, 秒: 秒() };
    }
    if (status !== 200) return { 開けた: false, 応答: `応答 ${status || "なし"}`, 秒: 秒() };
    if (!/\/product\/stock\/history\?resume=1$/.test(this.page.url())) return { 開けた: false, 応答: `応答 200・別のアドレスへ移った（${this.page.url()}）`, 秒: 秒() };
    if ((await this.form.count()) !== 1) return { 開けた: false, 応答: "応答 200・検索欄が無い", 秒: 秒() };
    await this.ready();
    return { 開けた: true, 応答: "応答 200", 秒: 秒() };
  }

  /** 商品名(日/英)・カード名・商品コードの欄に入れる */
  async fillKeyword(text: string): Promise<void> {
    await this.商品名などの欄.fill(text);
  }

  /** 登録日の開始・終了の欄に入れる（年-月-日。空文字は空にする） */
  async fillCreateDate(開始: string, 終了: string): Promise<void> {
    await this.登録日の開始.fill(開始);
    await this.登録日の終了.fill(終了);
  }

  /** 「検索」ボタンを押し、結果の画面が読み込まれるまで待つ */
  async search(): Promise<void> {
    const button = this.form.locator('button[type="submit"]');
    await expect(button, "検索ボタン").toHaveText(/^\s*検索\s*$/);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), button.click()]);
    await this.ready();
  }

  /** 在庫履歴検索一覧(検索入力)画面を開き（メニューから）、条件をクリアし、欠品検索にチェックを付け、語を入れて検索する */
  async searchShortage(keyword: string, clear = true): Promise<void> {
    await this.openFromMenu();
    if (clear) await this.clearConditions();
    await this.checkShortageList();
    await this.fillKeyword(keyword);
    await this.search();
  }

  /** 「検索結果：N件が該当しました」の N。表示が無ければ null */
  async 件数(): Promise<number | null> {
    if ((await this.件数の表示.count()) === 0) return null;
    const m = /(\d+)件/.exec((await this.件数の表示.first().textContent()) ?? "");
    return m ? Number(m[1]) : null;
  }

  /** 一覧の場所に出た案内の文（該当なし・検索条件の誤りなど） */
  async 一覧の場所の案内(): Promise<string[]> {
    return (await this.page.locator(".c-primaryCol .card-body .text-muted").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  /** 一覧の見出しの列名 */
  async 見出しの列(): Promise<string[]> {
    return (await this.list.locator("table thead th").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** 一覧の行を読む（欠品履歴の表示の列の順で読む） */
  async readRows(): Promise<欠品履歴の行[]> {
    const raw = await this.rows.evaluateAll((trs) => trs.map((tr) => ({
      cells: Array.from(tr.querySelectorAll(":scope > td")).map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim()),
      id: (tr.querySelector('input[name="admin_stock_history[stock_history_id]"]') as HTMLInputElement | null)?.value ?? "",
    })));
    return raw.map(({ cells, id }) => {
      if (cells.length !== 列.length) throw new Error(`欠品履歴の一覧の行の列の数が ${cells.length}（欠品履歴の表示は ${列.length} 列）。欠品履歴の表示になっていない`);
      return { 履歴ID: id, ...Object.fromEntries(列.map((k, i) => [k, cells[i]])) } as 欠品履歴の行;
    });
  }

  /** 商品コードの列が一致する行 */
  rowByCode(code: string): Locator {
    return this.rows.filter({ has: this.page.locator("td:nth-child(1)", { hasText: new RegExp(`^\\s*${escapeRe(code)}\\s*$`) }) });
  }

  /** 一覧の商品コードの列（上から順） */
  async codes(): Promise<string[]> {
    return (await this.rows.locator("td:nth-child(1)").allTextContents()).map((t) => t.trim());
  }

  /** 行の欠品理由の編集フォームに埋め込まれた履歴の番号（履歴ID） */
  async historyIdOf(row: Locator): Promise<string> {
    await expect(row, "対象の行は1件").toHaveCount(1);
    const input = row.locator('input[name="admin_stock_history[stock_history_id]"]');
    await expect(input, "欠品理由の編集フォームの履歴の番号").toHaveCount(1);
    const id = await input.inputValue();
    if (!/^\d+$/.test(id)) throw new Error(`欠品理由の編集フォームの履歴の番号が数でない: ${id}`);
    return id;
  }

  /** 行の商品名のリンクを押し、別タブで開いた画面を返す */
  async openProductNameLink(row: Locator): Promise<Page> {
    return this.openPopup(row.locator("td:nth-child(2) a"), "商品名のリンク");
  }

  /** 行の登録元IDのリンクを押し、別タブで開いた画面を返す */
  async openSourceIdLink(row: Locator): Promise<Page> {
    return this.openPopup(row.locator("td:nth-child(9) a"), "登録元IDのリンク");
  }

  private async openPopup(link: Locator, what: string): Promise<Page> {
    await expect(link, what).toHaveCount(1);
    const target = await link.getAttribute("target");
    if (target !== "_blank") throw new Error(`${what}は別タブで開く作りになっていない（target=${target ?? "なし"}）`);
    const context: BrowserContext = this.page.context();
    const [popup] = await Promise.all([context.waitForEvent("page"), link.click()]);
    await popup.waitForLoadState("load");
    return popup;
  }

  /**
   * 表示件数の選択欄の選択肢。選択中は、画面が選択済みの印を付けて出した選択肢で読む
   * （どれにも印が無いとき、ブラウザは先頭の選択肢を選んだように見せるので、見た目の選択では判断しない）。
   */
  async 表示件数の選択肢(): Promise<表示件数の選択肢[]> {
    await expect(this.表示件数, "表示件数の選択欄").toHaveCount(1);
    return this.表示件数.locator("option").evaluateAll((nodes) => nodes.map((n) => {
      const o = n as HTMLOptionElement;
      const m = /\/count\/(\d+)/.exec(o.value);
      return { 表示: (o.textContent ?? "").trim(), 件数: m ? m[1] : "", 選択中: o.defaultSelected };
    }));
  }

  /** 表示件数で画面が選択済みとして出した選択肢の表示（例「50件」）。無ければ「（選択なし）」、2つ以上ならつなげて返す */
  async 選択中の表示件数(): Promise<string> {
    const chosen = (await this.表示件数の選択肢()).filter((o) => o.選択中);
    return chosen.length ? chosen.map((o) => o.表示).join("・") : "（選択なし）";
  }

  /** 表示件数を選ぶ（選ぶと画面のスクリプトがその件数の1ページ目へ移る） */
  async choosePageCount(表示: string): Promise<void> {
    const options = await this.表示件数の選択肢();
    const hit = options.find((o) => o.表示 === 表示);
    if (!hit) throw new Error(`表示件数に「${表示}」が無い（ある選択肢: ${options.map((o) => o.表示).join("、")}）`);
    await Promise.all([
      this.page.waitForURL(new RegExp(`/product/stock/history/page/1/count/${hit.件数}$`)),
      this.表示件数.selectOption({ label: 表示 }),
    ]);
    await this.ready();
  }

  /**
   * ブラウザの開発者ツールで、次の表示件数の変更の要求の値を変えて送るのと同じ操作。
   * 表示件数の選択肢の送り先（…/count/N）の N を値に変えた選択肢を足して選ぶ（選ぶと画面のスクリプトがその送り先へ移る）。
   */
  async sendPageCountRequest(値: string): Promise<string> {
    await expect(this.表示件数, "表示件数の選択欄").toHaveCount(1);
    const url = await this.表示件数.evaluate((node, v) => {
      const select = node as HTMLSelectElement;
      if (!select.options.length) throw new Error("表示件数の選択肢が無い");
      const base = select.options[0].value;
      if (!/\/count\/\d+/.test(base)) throw new Error(`表示件数の選択肢の送り先に件数が無い: ${base}`);
      const option = new Option(`${v}件`, base.replace(/\/count\/\d+/, `/count/${v}`));
      select.add(option);
      return option.value;
    }, 値);
    await Promise.all([
      this.page.waitForURL(new RegExp(`/count/${値}$`)),
      this.表示件数.selectOption({ value: url }),
    ]);
    await this.ready();
    return url;
  }

  /** 一覧の下のページ送りで、ページ番号のリンクを押す */
  async gotoPage(n: number): Promise<void> {
    const link = this.page.locator("ul.pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
    await expect(link, `ページ送りの「${n}」`).toHaveCount(1);
    await Promise.all([this.page.waitForURL(new RegExp(`/product/stock/history/page/${n}(\\?.*)?$`)), link.click()]);
    await this.ready();
  }

  /** ページ送りで今いるページの番号。ページ送りが無ければ null */
  async 今のページ(): Promise<string | null> {
    const current = this.page.locator("ul.pagination li.active .page-link");
    if ((await current.count()) === 0) return null;
    return ((await current.first().textContent()) ?? "").trim();
  }

  /** 「CSVダウンロード」ボタンを押し、ダウンロードされたファイルを返す */
  async downloadCsv(): Promise<Download> {
    const button = this.page.locator("#form_bulk button[type=submit]");
    await expect(button, "CSVダウンロードのボタン").toHaveText(/^\s*CSVダウンロード\s*$/);
    const [download] = await Promise.all([this.page.waitForEvent("download"), button.click()]);
    return download;
  }

  /** 検索欄の中の、並び順を送る欄（名前に並び順を表す語を含む入力欄）。画面に無ければ0件 */
  sortFields(): Locator {
    return this.form.locator('[name*="sort" i], [name*="orderby" i], [name*="direction" i]');
  }

  /** ブラウザの開発者ツールで、並び順を送る欄の値を書き換えるのと同じ操作（選択欄なら、その値の選択肢を足して選ぶ） */
  async setSortValue(値: string): Promise<void> {
    const field = this.sortFields().first();
    await expect(field, "並び順を送る欄").toHaveCount(1);
    await field.evaluate((node, v) => {
      if (node instanceof HTMLSelectElement) {
        const option = new Option(v, v);
        node.add(option);
        node.value = v;
      } else {
        (node as HTMLInputElement).value = v;
      }
    }, 値);
  }

  /** 検索欄の選択肢（在庫区分・在庫変動理由区分・言語・状態・Foil）の表示名 */
  async 検索欄の選択肢(): Promise<{ 在庫区分: string[]; 在庫変動区分: { 親: string; 子: string }[]; 言語: string[]; 状態: string[]; Foil: string[] }> {
    const labels = (name: string) => this.form.locator(`input[name^="admin_stock_history[${name}]"]`).evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "").filter(Boolean));
    const types = await this.form.locator("#admin_stock_history_stock_change_type_detail option").evaluateAll((nodes) => nodes
      .filter((n) => (n as HTMLOptionElement).value !== "")
      .map((n) => (n.textContent ?? "").trim()));
    return {
      在庫区分: await labels("stock_location_id"),
      在庫変動区分: types.map((t) => {
        const [親, ...rest] = t.split(" / ");
        return { 親: 親.trim(), 子: rest.join(" / ").trim() };
      }),
      言語: await labels("language"),
      状態: await labels("card_condition"),
      Foil: await labels("foil"),
    };
  }

  /** 画面上部のメッセージ（成功・エラー・警告） */
  async 上部のメッセージ(): Promise<{ 成功: string[]; エラー: string[]; 警告: string[] }> {
    const read = async (sel: string) => (await this.page.locator(sel).allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return { 成功: await read(".alert-success"), エラー: await read(".alert-danger"), 警告: await read(".alert-warning") };
  }
}
