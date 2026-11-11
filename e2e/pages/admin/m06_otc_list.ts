/**
 * 店頭買取管理の買取一覧(検索入力・検索結果)、買取詳細、ステータス変更（メニュー「店頭買取管理」→「買取一覧」）。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 検索入力画面を開いた直後は、一覧・該当件数・表示件数・ダウンロード・ページングは出ない。検索すると出る。
 * - 査定申込日時の初めの値は「先月1日」が入っている。ケースが「空にして」と書くときは消す。
 * - ダウンロードの項目は、結果にチェックを付けた買取だけを対象にする。戻しリストPDFは別ウィンドウに開く。
 * - ステータス変更は、買取詳細の「ステータス変更」から。選択肢は現在のステータスを除いたもの。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const OPEN = 30_000;
const SEARCH = "/otcbuyorder";

export type 一覧の行 = { 査定ID: string; 申込者: string; 買取金額: string; 買取店舗: string; 査定担当者: string; 最終更新者: string; ステータス: string };

export class OtcListPage {
  constructor(readonly page: Page) {}

  readonly 検索フォーム = () => this.page.locator("form#search_form");
  readonly 結果の表 = () => this.page.locator("#result_list_main table tbody tr");
  readonly 該当件数の表示 = () => this.page.locator("#search_form .fw-bold");
  readonly ダウンロードのボタン = () => this.page.locator("#result_list__custom_csv_menu button.dropdown-toggle");
  readonly 表示件数の選択 = () => this.page.locator("#page_count_pulldown");
  readonly ページング = () => this.page.locator("#result_list ul.pagination");
  readonly 上部のエラー = () => this.page.locator(".alert-danger");

  /** 買取一覧(検索入力)画面を開く（メニューから開いたときの初期表示） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl(SEARCH), { timeout: 60_000 });
    expect(res?.status() ?? 0, "買取一覧(検索入力)画面の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
    await expect(this.検索フォーム(), "買取一覧(検索入力)画面の検索欄").toBeVisible({ timeout: OPEN });
  }

  private box(id: string): Locator {
    return this.page.locator(`#search_box__${id}`);
  }

  /** 申込者名を入れる */
  async 申込者名を入れる(名前: string): Promise<void> {
    await this.box("name_multi").locator("input").fill(名前, { timeout: OPEN });
  }

  async 査定IDを入れる(査定ID: string): Promise<void> {
    await this.box("assessment_id").locator("input").fill(査定ID, { timeout: OPEN });
  }

  /** 査定申込日時（初めは先月1日が入っている）と買取日時を空にする */
  async 日時を空にする(): Promise<void> {
    for (const id of ["application_date_from", "application_date_to", "complete_date_from", "complete_date_to"]) {
      await this.page.locator(`#otc_buy_order_${id}`).fill("", { timeout: OPEN });
    }
  }

  async 戻し未完了のみ表示(on: boolean): Promise<void> {
    await this.box("restock_incomplete_only").locator('input[type="checkbox"]').setChecked(on, { timeout: OPEN });
  }

  /** 買取店舗の選択（選択肢の表示名）。"" で未選択（全店） */
  async 買取店舗を選ぶ(店名: string): Promise<void> {
    const sel = this.box("shop").locator("select");
    if (店名 === "") await sel.selectOption({ index: 0 }, { timeout: OPEN });
    else await sel.selectOption({ label: 店名 }, { timeout: OPEN });
  }

  /** ステータスの選択（選択肢の表示名）。"" で未選択 */
  async ステータスを選ぶ(名: string): Promise<void> {
    const sel = this.box("otc_buy_order_status").locator("select");
    if (名 === "") await sel.selectOption({ index: 0 }, { timeout: OPEN });
    else await sel.selectOption({ label: 名 }, { timeout: OPEN });
  }

  /** 検索欄で選ばれている買取店舗の表示名（未選択は空） */
  async 買取店舗の選択を読む(): Promise<string> {
    return this.box("shop").locator("select").evaluate((s) => ((s as HTMLSelectElement).selectedOptions[0]?.textContent ?? "").trim());
  }

  /** 検索欄の申込者名の入力値 */
  async 申込者名の入力を読む(): Promise<string> {
    return this.box("name_multi").locator("input").inputValue({ timeout: OPEN });
  }

  /** 検索欄の査定IDの入力値 */
  async 査定IDの入力を読む(): Promise<string> {
    return this.box("assessment_id").locator("input").inputValue({ timeout: OPEN });
  }

  /** 表示件数の選択で選ばれている表示名（例「10件」） */
  async 表示件数の選択を読む(): Promise<string> {
    return this.表示件数の選択().evaluate((s) => ((s as HTMLSelectElement).selectedOptions[0]?.textContent ?? "").trim());
  }

  /** アドレス欄から、一覧の指定ページを開く（検索条件・表示件数はセッションが覚えている） */
  async ページを開く(ページ: number): Promise<void> {
    const res = await this.page.goto(adminUrl(`${SEARCH}/page/${ページ}`), { timeout: 60_000 });
    expect(res?.status() ?? 0, `買取一覧 ${ページ}ページ目の応答`).toBeLessThan(400);
    await this.page.waitForLoadState("load");
  }

  /**
   * 結果の1ページ目から順に、最大 最大ページ数 ページ分の行を読む（先頭に検索結果がある状態で呼ぶ）。
   * 探している査定IDがすべて見つかったら、そこで止める（共有の環境には、ほかの買取が多数ある）。
   */
  async 行を順に読む(最大ページ数: number, 探す?: string[]): Promise<一覧の行[]> {
    const all: 一覧の行[] = [];
    const total = await this.該当件数();
    for (let n = 1; n <= 最大ページ数; n++) {
      if (n > 1) await this.ページを開く(n);
      const rows = await this.行();
      all.push(...rows);
      if (all.length >= total || rows.length === 0) break;
      if (探す && 探す.every((id) => all.some((r) => r.査定ID === id))) break;
    }
    return all;
  }

  /** ダウンロードのメニューを開き、並んでいる項目の表示名を返す */
  async ダウンロードの項目を読む(): Promise<string[]> {
    await this.ダウンロードのボタン().click({ timeout: OPEN });
    const items = this.page.locator("#result_list__custom_csv_menu .dropdown-menu button.export-link");
    await expect(items.first(), "ダウンロードの項目").toBeVisible({ timeout: OPEN });
    return (await items.allInnerTexts()).map((t) => t.trim());
  }

  /** 査定IDの行のダウンロード対象のチェックボックスの値を差し替える（開発者ツールでの値の変更と同じ） */
  async 対象の値を差し替える(査定ID: string, 値: string): Promise<void> {
    const row = this.結果の表().filter({ has: this.page.getByRole("link", { name: 査定ID, exact: true }) });
    await expect(row, `一覧の査定ID「${査定ID}」の行`).toHaveCount(1, { timeout: OPEN });
    await row.locator('input[type="checkbox"]').evaluate((el, v) => { (el as HTMLInputElement).value = v; }, 値);
  }

  private pdfRoute = /\/otcbuyorder\/restock-list\/pdf$/;

  /** 戻しリストPDFのデータ取得の要求を遮断する（開発者ツールでの要求のブロックと同じ） */
  async 戻しリストPDFの要求を遮断する(): Promise<void> {
    await this.page.route(this.pdfRoute, (r) => r.abort());
  }

  /**
   * 「戻しリストPDF」を押し、開いたウィンドウが閉じるまで待つ。
   * ウィンドウが開いたか・閉じたか、ダイアログの文、いまの画面のアドレスを返す。
   */
  async 戻しリストPDFを押して閉じるのを待つ(): Promise<{ 開いた: boolean; 閉じた: boolean; ダイアログ: string[]; アドレス: string }> {
    const dialogs: string[] = [];
    const onDialog = (d: import("@playwright/test").Dialog) => { dialogs.push(d.message()); void d.accept(); };
    this.page.on("dialog", onDialog);
    try {
      await this.ダウンロードのボタン().click({ timeout: OPEN });
      const item = this.page.locator("#result_list__custom_csv_menu .dropdown-menu button.export-link", { hasText: "戻しリストPDF" });
      await expect(item, "ダウンロードの項目「戻しリストPDF」").toBeVisible({ timeout: OPEN });
      const popup = this.page.context().waitForEvent("page", { timeout: 15_000 }).catch(() => null);
      await item.click({ timeout: OPEN });
      const win = await popup;
      let closed = false;
      if (win) {
        closed = win.isClosed() || await win.waitForEvent("close", { timeout: 15_000 }).then(() => true).catch(() => win.isClosed());
      }
      await this.page.waitForTimeout(500);
      return { 開いた: win !== null, 閉じた: closed, ダイアログ: dialogs, アドレス: this.page.url() };
    } finally {
      this.page.off("dialog", onDialog);
    }
  }

  /** 検索するボタンを押し、結果の画面が出るまで待つ */
  async 検索する(件数の表示を待つ = true): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("load"),
      this.検索フォーム().getByRole("button", { name: /検索する/ }).click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
    if (件数の表示を待つ) await expect(this.該当件数の表示().first(), "検索結果の該当件数の表示").toBeVisible({ timeout: 60_000 });
    else await expect(this.page.locator("#result_list_main"), "検索結果の欄（該当なしの表示を含む）").toBeVisible({ timeout: 60_000 });
  }

  /** 表示件数を、選べる最大の件数にする（結果が複数ページになるときに、全部を1ページで読む） */
  async 表示件数を最大にする(): Promise<void> {
    const sel = this.表示件数の選択();
    if ((await sel.count()) === 0) return;
    const labels = (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
    const nums = labels.map((l) => Number(l.replace(/\D/g, ""))).filter((n) => n > 0);
    const target = [100, 50].find((n) => nums.includes(n));
    if (!target) return;
    await Promise.all([this.page.waitForLoadState("load"), sel.selectOption({ label: `${target}件` }, { timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** アドレス欄から、一覧の指定ページを並び順つきで開く（検索条件はセッションが覚えている） */
  async 並び順を指定して開く(ページ: number, 並び: "asc" | "desc"): Promise<void> {
    const res = await this.page.goto(adminUrl(`${SEARCH}/page/${ページ}?sort=default&order=${並び}`), { timeout: 60_000 });
    expect(res?.status() ?? 0, "並び順を指定した買取一覧の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
  }

  /** アドレス欄から、並び順のキーと並びを指定して開く。応答の状態を返す（キーが不正なときの動きを見るため、状態は確かめない） */
  async 並び順のキーを指定して開く(ページ: number, キー: string, 並び: "asc" | "desc"): Promise<number> {
    const res = await this.page.goto(adminUrl(`${SEARCH}/page/${ページ}?sort=${キー}&order=${並び}`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** ページングの番号を押す */
  async ページを押す(番号: number): Promise<void> {
    const link = this.ページング().getByRole("link", { name: String(番号), exact: true });
    await expect(link, `ページングの「${番号}」`).toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 表示件数を指定の件数にする */
  async 表示件数を変える(件数: number): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.表示件数の選択().selectOption({ label: `${件数}件` }, { timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 該当件数（「N件が該当しました」の数） */
  async 該当件数(): Promise<number> {
    const t = (await this.該当件数の表示().first().innerText({ timeout: OPEN })).replace(/[,\s]/g, "");
    const m = /(\d+)/.exec(t);
    if (!m) throw new Error(`該当件数が読めない（${t}）`);
    return Number(m[1]);
  }

  /** 結果の表の行（上から順） */
  async 行(): Promise<一覧の行[]> {
    await expect(this.page.locator("#result_list_main"), "検索結果の一覧欄").toBeVisible({ timeout: 60_000 });
    return this.結果の表().evaluateAll((trs) => trs.map((tr) => {
      const td = (key: string) => (tr.querySelector(`[id^="result_list_main__${key}--"]`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { 査定ID: td("id"), 申込者: td("name"), 買取金額: td("price"), 買取店舗: td("shop"), 査定担当者: td("member1"), 最終更新者: td("member2"), ステータス: td("otc_buy_order_status") };
    }));
  }

  /** 査定IDの行のダウンロード対象にチェックを付ける */
  async 対象にする(査定ID: string): Promise<void> {
    const row = this.結果の表().filter({ has: this.page.getByRole("link", { name: 査定ID, exact: true }) });
    await expect(row, `一覧の査定ID「${査定ID}」の行`).toHaveCount(1, { timeout: OPEN });
    await row.locator('input[type="checkbox"]').check({ timeout: OPEN });
  }

  /** 査定IDのリンクを押して買取詳細画面を開く */
  async 詳細を開く(査定ID: string): Promise<void> {
    const link = this.page.getByRole("link", { name: 査定ID, exact: true }).first();
    await expect(link, `一覧の査定ID「${査定ID}」のリンク`).toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /**
   * ダウンロードの項目を押す。ファイルが落ちてきたらそれを、戻しリストPDFで別ウィンドウが開いたらそれを返す。
   * どちらも無く画面が一覧へ戻ったときは file も popup も null（応答の状態は status に返す）。
   */
  async ダウンロードを押す(項目: "古物台帳入力用CSV" | "買取商品一覧CSV" | "戻しリストCSV" | "戻しリストPDF"): Promise<{ file: Download | null; popup: Page | null; ダイアログ: string[]; status: number }> {
    const dialogs: string[] = [];
    const onDialog = (d: import("@playwright/test").Dialog) => { dialogs.push(d.message()); void d.accept(); };
    this.page.on("dialog", onDialog);
    try {
      await this.ダウンロードのボタン().click({ timeout: OPEN });
      const item = this.page.locator("#result_list__custom_csv_menu .dropdown-menu button.export-link", { hasText: 項目 });
      await expect(item, `ダウンロードの項目「${項目}」`).toBeVisible({ timeout: OPEN });
      const pdf = 項目 === "戻しリストPDF";
      const route = pdf ? /\/otcbuyorder\/restock-list\/pdf$/ : /\/otcbuyorder\/export$/;
      const response = this.page.waitForResponse((r) => r.request().method() === "POST" && route.test(new URL(r.url()).pathname), { timeout: 60_000 });
      const download = this.page.waitForEvent("download", { timeout: 30_000 }).catch(() => null);
      const popup = pdf ? this.page.context().waitForEvent("page", { timeout: 15_000 }).catch(() => null) : Promise.resolve(null);
      await item.click({ timeout: OPEN });
      const res = await response;
      const status = res.status();
      let file: Download | null = null;
      let win: Page | null = null;
      if (!pdf && status === 200) file = await download;
      if (pdf) {
        let ok = false;
        try { ok = ((await res.json()) as { ok?: boolean }).ok === true; } catch { ok = false; }
        if (ok) win = await popup;
        else await this.page.waitForURL(/\/otcbuyorder(\/page\/\d+)?(\?|$)/, { timeout: 15_000 }).catch(() => undefined);
      }
      await this.page.waitForLoadState("load").catch(() => undefined);
      return { file, popup: win, ダイアログ: dialogs, status };
    } finally {
      this.page.off("dialog", onDialog);
    }
  }
}

/** 買取詳細とステータス変更 */
export class OtcDetailPage {
  constructor(readonly page: Page) {}

  /** 買取詳細の「ステータス変更」を押し、変更後のステータスを選んで保存する */
  async ステータスを変える(変更後: string): Promise<void> {
    await this.page.getByRole("link", { name: "ステータス変更", exact: true }).click({ timeout: OPEN });
    await this.page.waitForLoadState("load");
    const sel = this.page.locator("form#form select").first();
    await expect(sel, "ステータス変更画面の変更後のステータス").toBeVisible({ timeout: OPEN });
    const have = (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
    if (!have.includes(変更後)) throw new Error(`変更後のステータスに「${変更後}」が無い（ある選択肢: ${have.filter(Boolean).join("、")}）`);
    await sel.selectOption({ label: 変更後 }, { timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), this.page.getByRole("button", { name: "保存", exact: true }).click({ timeout: OPEN })]);
    await expectSaved(this.page, `ステータスを「${変更後}」に変える`);
  }
}
