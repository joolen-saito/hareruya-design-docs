/**
 * 売上分析タグ登録/編集画面（メニュー「商品管理」）。入力欄と、売上分析タグの一覧が同じ画面にある。
 * - 編集対象を指定しない画面が新規登録の入力欄（見出し「新規追加」）、一覧の編集ボタン・ID・名称のリンクで開く画面が編集の入力欄（見出し「編集」）。
 * - 一覧は並び順の昇順。表示件数（既定10件）とページ番号は、ログイン中のセッションが覚える。
 * - 削除ボタンは、ブラウザの確認ダイアログで承認すると、画面の中に作ったフォームで削除の要求を送る（画面のスクリプトの読み込み後に押す）。
 *   削除の要求そのものは一覧への転送を返すことがあるので、要求の応答と、転送のあとに移った画面の応答を分けて返す。
 * - 登録ボタンは入力欄のフォームの外にあり、フォームを指して送る。名称・並び順は必須で、空のときはブラウザの入力チェックが送信を止める。
 */
import { Dialog, expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type SalesAnalysisTagInput = { 名称: string; 並び順: string };
export type SalesAnalysisTagRow = { ID: string; 名称: string; 並び順: string };

export const salesAnalysisTagNewUrl = () => adminUrl("/product/tag_sales_analysis");
export const salesAnalysisTagEditUrl = (id: string) => adminUrl(`/product/tag_sales_analysis/${id}`);
/** 保存の要求の送り先（新規登録の入力欄のフォーム） */
export const salesAnalysisTagStoreUrl = () => adminUrl("/product/tag_sales_analysis/store");
/** 削除の要求の送り先（削除ボタンのリンク先） */
export const salesAnalysisTagDeletePath = (id: string) => `/product/tag_sales_analysis/${id}/delete`;

const pathOf = (url: string) => new URL(url).pathname;
const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 登録ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

/** 削除の確認ダイアログで承認したときの応答の状態 */
export type DeleteResponses = {
  /** 削除の要求そのもの（削除ボタンのリンク先への送信）への応答。一覧へ転送するときは転送の状態（3xx） */
  要求: number;
  /** 承認のあとに移った画面の応答（転送のあとに開いた画面。転送しないときは削除の要求と同じ応答）。分からないときは null */
  移った画面: number | null;
};

/** 削除ボタンを押して確認ダイアログが出ている状態。承認か取り消しで閉じる */
export type PendingDelete = {
  /** 確認ダイアログの文 */
  message: string;
  /** 承認する。削除の要求そのものの応答と、移った画面の応答を返す */
  accept: () => Promise<DeleteResponses>;
  /** 取り消す */
  dismiss: () => Promise<void>;
};

export class SalesAnalysisTagPage {
  readonly form: Locator;
  readonly 名称: Locator;
  readonly 並び順: Locator;
  readonly 登録ボタン: Locator;
  readonly 新規登録へ戻る: Locator;
  readonly 件数: Locator;
  readonly 入力欄の見出し: Locator;
  readonly 一覧: Locator;
  readonly 一覧の見出し: Locator;
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form_tag_sales_analysis");
    this.名称 = this.form.locator('[name="tag_sales_analysis[name]"]');
    this.並び順 = this.form.locator('[name="tag_sales_analysis[rank]"]');
    this.登録ボタン = page.locator('button[type="submit"][form="form_tag_sales_analysis"]');
    this.新規登録へ戻る = page.getByRole("link", { name: "新規登録へ戻る", exact: true });
    this.件数 = page.locator("select.js-page-count");
    this.入力欄の見出し = this.form.locator(".card-header .card-title");
    this.一覧 = page.locator("table.table");
    this.一覧の見出し = this.一覧.locator("thead th");
    this.rows = this.一覧.locator("tbody tr");
  }

  /** 画面の読み込みを終え、入力欄が出るまで待つ（削除ボタン・件数欄はスクリプトの読み込み後でないと動かない） */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.名称, "売上分析タグ登録/編集画面の名称の欄").toBeVisible();
  }

  /** 編集対象を指定せずに開く（新規登録の入力欄） */
  async openNew(): Promise<Response | null> {
    const res = await this.page.goto(salesAnalysisTagNewUrl());
    await this.ready();
    return res;
  }

  /** 一覧の表示ページを1にし、件数欄で表示件数を選ぶ（セッションが覚える） */
  async showFirstPageWith(count: string): Promise<void> {
    await this.page.goto(adminUrl("/product/tag_sales_analysis/page/1"));
    await this.ready();
    if ((await this.件数.inputValue()) !== count) await this.chooseCount(count);
    await expect(this.件数, "一覧の表示件数").toHaveValue(count);
    expect(await this.currentPage(), "一覧の表示ページ").toBe("1");
  }

  /** 件数欄で表示件数を選ぶ（選ぶと画面を開き直す） */
  async chooseCount(count: string): Promise<void> {
    await Promise.all([
      this.page.waitForURL((u) => u.searchParams.get("page_count") === count),
      this.件数.selectOption(count),
    ]);
    await this.ready();
  }

  /** ページングで、いま表示しているページの番号（ページングが出ない1ページだけの一覧は "1"） */
  async currentPage(): Promise<string> {
    const active = this.page.locator(".pagination .page-item.active");
    if ((await this.page.locator(".pagination").count()) === 0) return "1";
    await expect(active, "ページングのいまのページ").toHaveCount(1);
    return ((await active.textContent()) ?? "").trim();
  }

  /**
   * 一覧の全件を1ページに出す（件数欄で12000件を選ぶ）。並び順が同じ行の並びはページを移るたびに変わりうるので、
   * ページングでは行を探さない。全件が1ページに収まったこと（ページングの「次へ」が無いこと）を確かめる。件数を選び直したときは真を返す
   */
  async showAllRows(): Promise<boolean> {
    const changed = (await this.件数.inputValue()) !== "12000";
    if (changed) await this.chooseCount("12000");
    await expect(this.件数, "一覧の表示件数").toHaveValue("12000");
    await expect(this.page.locator(".pagination a.page-link", { hasText: /^\s*次へ\s*$/ }), "一覧の全件が1ページに出ている（ページングの「次へ」が無い）").toHaveCount(0);
    return changed;
  }

  rowById(id: string): Locator {
    return this.rows.filter({ has: this.page.locator("td:nth-child(1)", { hasText: exact(id) }) });
  }

  rowsByName(名称: string): Locator {
    return this.rows.filter({ has: this.page.locator("td:nth-child(2)", { hasText: exact(名称) }) });
  }

  rowsByNameAndRank(名称: string, 並び順: string): Locator {
    return this.rowsByName(名称).filter({ has: this.page.locator("td:nth-child(3)", { hasText: exact(並び順) }) });
  }

  async readRow(row: Locator): Promise<SalesAnalysisTagRow> {
    const cell = async (n: number) => ((await row.locator(`td:nth-child(${n})`).textContent()) ?? "").trim();
    return { ID: await cell(1), 名称: await cell(2), 並び順: await cell(3) };
  }

  /** 一覧の表示中のページの行（上から順） */
  async allRows(): Promise<SalesAnalysisTagRow[]> {
    return this.rows.evaluateAll((trs) => trs.map((tr) => {
      const td = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").trim();
      return { ID: td(1), 名称: td(2), 並び順: td(3) };
    }));
  }

  /** 一覧の見出しの文（ID・名称・並び順など） */
  async listHeadings(): Promise<string[]> {
    return (await this.一覧の見出し.allInnerTexts()).map((t) => t.trim());
  }

  /** 入力欄のフォームの送り先（パス） */
  async formActionPath(): Promise<string> {
    const action = (await this.form.getAttribute("action")) ?? "";
    return new URL(action, this.page.url()).pathname;
  }

  /** 名称と並び順がちょうど1行ある、その行のID列の値 */
  async idOfNameAndRank(名称: string, 並び順: string): Promise<string> {
    const row = this.rowsByNameAndRank(名称, 並び順);
    await expect(row, `一覧に名称「${名称}」・並び順${並び順}の行が1件`).toHaveCount(1);
    return (await this.readRow(row)).ID;
  }

  /** 一覧の行の編集ボタンを押し、その売上分析タグの編集の入力欄の画面へ移る */
  async pressEdit(id: string): Promise<void> {
    const row = this.rowById(id);
    await expect(row, `一覧にID ${id} の行が1件`).toHaveCount(1);
    const link = row.getByRole("link", { name: "編集", exact: true });
    await expect(link, `ID ${id} の行の編集ボタン`).toHaveCount(1);
    await Promise.all([this.page.waitForURL((u) => u.pathname === pathOf(salesAnalysisTagEditUrl(id))), link.click()]);
    await this.ready();
  }

  /** 「新規登録へ戻る」を押す */
  async pressBackToNew(): Promise<void> {
    await expect(this.新規登録へ戻る, "新規登録へ戻るボタン").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname === pathOf(salesAnalysisTagNewUrl())), this.新規登録へ戻る.click()]);
    await this.ready();
  }

  /** 入力欄に読み込まれている値 */
  async inputValues(): Promise<SalesAnalysisTagInput> {
    return { 名称: await this.名称.inputValue(), 並び順: await this.並び順.inputValue() };
  }

  async fill(v: Partial<SalesAnalysisTagInput>): Promise<void> {
    if (v.名称 !== undefined) await this.名称.fill(v.名称);
    if (v.並び順 !== undefined) await this.並び順.fill(v.並び順);
  }

  /** 開発者ツールで名称の欄に値を設定する（画面の最大文字数の制限を通さない）。設定後の欄の値を返す */
  async setNameByDevtools(value: string): Promise<string> {
    await this.名称.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, value);
    return this.名称.inputValue();
  }

  /**
   * 登録ボタンを押す。入力欄が必須なのに空のとき・範囲外のときは、ブラウザが送信を止める（要求を送らない）。
   * そのときは止めた項目（項目名と、ブラウザの案内の文）を返す。
   */
  async pressRegister(): Promise<SubmitResult> {
    const blocked = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => {
        const label = e.closest(".form-group")?.querySelector("label")?.textContent?.trim() ?? "（項目名なし）";
        return `${label}: ${(e as HTMLInputElement).validationMessage}`;
      }));
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.登録ボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/product\/tag_sales_analysis\/store/.test(r.url()));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.登録ボタン.click()]);
    return { sent: true, status: (await response).status() };
  }

  /** 入力して登録し、成功の表示を確かめる。登録後の画面（その売上分析タグの編集の入力欄）のURLからIDを読む */
  async register(v: SalesAnalysisTagInput, what: string): Promise<string> {
    await this.fill(v);
    const r = await this.pressRegister();
    if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
    await expectSaved(this.page, what);
    const m = new URL(this.page.url()).pathname.match(/\/product\/tag_sales_analysis\/(\d+)$/);
    if (!m) throw new Error(`${what}: 登録後に、売上分析タグの編集の入力欄の画面へ移らない（${this.page.url()}）`);
    await this.ready();
    return m[1];
  }

  /**
   * 行の削除ボタンを押し、確認ダイアログが出るまで待つ。ダイアログは開いたまま返す（承認・取り消しは呼び出し側が選ぶ）。
   * ダイアログが開いている間は画面のスクリプトが止まるので、そのあいだに画面の操作はしない。
   */
  async startDelete(row: Locator): Promise<PendingDelete> {
    await expect(row, "削除する行が1件").toHaveCount(1);
    const button = row.getByRole("link", { name: "削除", exact: true });
    await expect(button, "行の削除ボタン").toHaveCount(1);
    const href = await button.getAttribute("href");
    if (!href) throw new Error("行の削除ボタンにリンク先が無い");
    // 削除の要求は、承認のあとに画面のスクリプトがリンク先へ送る。その要求そのものの応答を、移った画面の応答と分けて見る
    const deletePath = new URL(href, this.page.url()).pathname;
    const shown = this.page.waitForEvent("dialog", { timeout: 10_000 });
    const clicked = button.click();
    const dialog: Dialog = await shown.catch(() => { throw new Error("削除ボタンを押したが、確認ダイアログが出ない"); });
    return {
      message: dialog.message(),
      accept: async () => {
        const requested = this.page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === deletePath);
        const nav = this.page.waitForNavigation({ waitUntil: "load" });
        await dialog.accept();
        await clicked;
        const [res, moved]: [Response, Response | null] = await Promise.all([requested, nav]);
        return { 要求: res.status(), 移った画面: moved?.status() ?? null };
      },
      dismiss: async () => {
        await dialog.dismiss();
        await clicked;
      },
    };
  }

  /** 行の削除ボタンを押し、確認ダイアログを承認する。削除の要求そのものの応答と、移った画面の応答を返す */
  async pressDeleteAndAccept(row: Locator): Promise<{ dialog: string; 応答: DeleteResponses }> {
    const pending = await this.startDelete(row);
    return { dialog: pending.message, 応答: await pending.accept() };
  }

  /** 削除して、成功の表示を確かめる */
  async deleteRow(row: Locator, what: string): Promise<void> {
    await this.pressDeleteAndAccept(row);
    await expectSaved(this.page, what);
    await this.ready();
  }
}
