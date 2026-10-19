/**
 * 略称タグ登録/編集画面（メニュー「商品管理」）。新規入力欄・編集欄と、略称タグの一覧が同じ画面にある。
 * - 編集対象を指定しない画面が新規入力欄、一覧の編集ボタン・ID・名称・並び順のリンクで開く画面が編集欄。
 * - 一覧は並び順の昇順。表示件数とページは、ログイン中のセッションが覚える。
 * - 削除ボタンは、ブラウザの確認ダイアログで承認すると、画面の中に作ったフォームで削除の要求を送る。
 */
import { Dialog, Download, expect, Locator, Page, Response } from "@playwright/test";
import { decodeCsvBytes } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type ShortTagInput = { 名称: string; 並び順: string; アルファベット順: boolean };
export type ShortTagRow = { ID: string; 名称: string; 並び順: string; ソート: string };

export const shortTagNewUrl = () => adminUrl("/product/storage");
export const shortTagEditUrl = (id: string) => adminUrl(`/product/storage/${id}`);
/** 削除の要求の送り先（削除ボタンのリンク先） */
export const shortTagDeletePath = (id: string) => `/product/storage_code/${id}/delete`;

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 登録ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

async function downloadedText(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return decodeCsvBytes(Buffer.concat(chunks));
}

export class ShortTagPage {
  readonly form: Locator;
  readonly 名称: Locator;
  readonly 並び順: Locator;
  readonly アルファベット順: Locator;
  readonly 登録ボタン: Locator;
  readonly 新規登録へ戻る: Locator;
  readonly CSV出力: Locator;
  readonly CSV入力: Locator;
  readonly 件数: Locator;
  readonly 入力欄の見出し: Locator;
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form_storage_code");
    this.名称 = this.form.locator('[name="storage_code[name]"]');
    this.並び順 = this.form.locator('[name="storage_code[rank]"]');
    this.アルファベット順 = this.form.locator('input[type="checkbox"][name="storage_code[alphabetSortFlg]"]');
    this.登録ボタン = page.locator('button[type="submit"][form="form_storage_code"]');
    this.新規登録へ戻る = page.getByRole("link", { name: "新規登録へ戻る", exact: true });
    this.CSV出力 = page.getByRole("link", { name: "CSV出力", exact: true });
    this.CSV入力 = page.getByRole("link", { name: "CSV入力", exact: true });
    this.件数 = page.locator("select.js-page-count");
    this.入力欄の見出し = this.form.locator(".card-header .card-title");
    this.rows = page.locator("table tbody tr");
  }

  /** 画面の読み込みを終え、入力欄が出るまで待つ（削除ボタン・件数欄はスクリプトの読み込み後でないと動かない） */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.名称, "略称タグ登録/編集画面の名称の欄").toBeVisible();
  }

  /** 編集対象を指定せずに開く（新規入力欄） */
  async openNew(): Promise<Response | null> {
    const res = await this.page.goto(shortTagNewUrl());
    await this.ready();
    return res;
  }

  /** 一覧の表示ページを1にし、件数欄で表示件数を選ぶ（セッションが覚える） */
  async showFirstPageWith(count: string): Promise<void> {
    await this.page.goto(adminUrl("/product/storage/page/1"));
    await this.ready();
    if ((await this.件数.inputValue()) !== count) await this.chooseCount(count);
    await expect(this.件数, "一覧の表示件数").toHaveValue(count);
    expect(new URL(this.page.url()).pathname, "一覧の表示ページ").toMatch(/\/product\/storage(\/page\/1)?$/);
  }

  /** 件数欄で表示件数を選ぶ（選ぶと画面を開き直す） */
  async chooseCount(count: string): Promise<void> {
    await Promise.all([
      this.page.waitForURL((u) => u.searchParams.get("page_count") === count),
      this.件数.selectOption(count),
    ]);
    await this.ready();
  }

  /** ページングのページ番号のリンクを押す */
  async choosePage(n: number): Promise<void> {
    const link = this.page.locator(".pagination a.page-link", { hasText: exact(String(n)) });
    await expect(link, `ページングの ${n} のリンク`).toHaveCount(1);
    await Promise.all([this.page.waitForURL(new RegExp(`/page/${n}(\\?|$)`)), link.click()]);
    await this.ready();
  }

  /** ページングで、いま表示しているページの番号 */
  async currentPage(): Promise<string> {
    const active = this.page.locator(".pagination .page-item.active");
    await expect(active, "ページングのいまのページ").toHaveCount(1);
    return ((await active.textContent()) ?? "").trim();
  }

  rowById(id: string): Locator {
    return this.rows.filter({ has: this.page.locator("td:nth-child(1)", { hasText: exact(id) }) });
  }

  rowsByName(名称: string): Locator {
    return this.rows.filter({ has: this.page.locator("td:nth-child(2)", { hasText: exact(名称) }) });
  }

  async readRow(row: Locator): Promise<ShortTagRow> {
    const cell = async (n: number) => ((await row.locator(`td:nth-child(${n})`).textContent()) ?? "").trim();
    return { ID: await cell(1), 名称: await cell(2), 並び順: await cell(3), ソート: await cell(4) };
  }

  /** 一覧に表示された行（上から順） */
  async allRows(): Promise<ShortTagRow[]> {
    return this.rows.evaluateAll((trs) => trs.map((tr) => {
      const td = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").trim();
      return { ID: td(1), 名称: td(2), 並び順: td(3), ソート: td(4) };
    }));
  }

  /** 名称がちょうど1行ある、その行のID列の値 */
  async idOfName(名称: string): Promise<string> {
    const row = this.rowsByName(名称);
    await expect(row, `一覧に名称「${名称}」の行が1件`).toHaveCount(1);
    return (await this.readRow(row)).ID;
  }

  /** 一覧の行の編集ボタンを押し、その略称タグの編集欄の画面へ移る */
  async pressEdit(id: string): Promise<void> {
    await this.pressRowLink(id, (row) => row.getByRole("link", { name: "編集", exact: true }), "編集ボタン");
  }

  /** 一覧の行の、ID・名称・並び順の列のリンクを押す */
  async pressColumnLink(id: string, 列: "ID" | "名称" | "並び順"): Promise<void> {
    const n = { ID: 1, 名称: 2, 並び順: 3 }[列];
    await this.pressRowLink(id, (row) => row.locator(`td:nth-child(${n}) a`), `${列}のリンク`);
  }

  private async pressRowLink(id: string, link: (row: Locator) => Locator, what: string): Promise<void> {
    const row = this.rowById(id);
    await expect(row, `一覧にID ${id} の行が1件`).toHaveCount(1);
    await expect(link(row), `ID ${id} の行の${what}`).toHaveCount(1);
    await Promise.all([this.page.waitForURL((u) => u.pathname.endsWith(`/product/storage/${id}`)), link(row).click()]);
    await this.ready();
  }

  /** 「新規登録へ戻る」を押す */
  async pressBackToNew(): Promise<void> {
    await expect(this.新規登録へ戻る, "新規登録へ戻るボタン").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname.endsWith("/product/storage")), this.新規登録へ戻る.click()]);
    await this.ready();
  }

  /** 「CSV出力」を押し、ダウンロードしたファイルの名前と中身を返す */
  async downloadCsv(): Promise<{ fileName: string; text: string }> {
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.CSV出力.click()]);
    return { fileName: download.suggestedFilename(), text: await downloadedText(download) };
  }

  /** 入力欄に読み込まれている値 */
  async inputValues(): Promise<ShortTagInput> {
    return {
      名称: await this.名称.inputValue(),
      並び順: await this.並び順.inputValue(),
      アルファベット順: await this.アルファベット順.isChecked(),
    };
  }

  async fill(v: Partial<ShortTagInput>): Promise<void> {
    if (v.名称 !== undefined) await this.名称.fill(v.名称);
    if (v.並び順 !== undefined) await this.並び順.fill(v.並び順);
    if (v.アルファベット順 !== undefined) {
      await expect(this.アルファベット順, "アルファベット順ソートフラグ").toBeEnabled();
      await this.アルファベット順.setChecked(v.アルファベット順);
    }
  }

  /**
   * 登録ボタンを押す。入力欄が必須なのに空のときは、ブラウザが送信を止める（要求を送らない）。
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
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/product\/storage_code\/store/.test(r.url()));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.登録ボタン.click()]);
    return { sent: true, status: (await response).status() };
  }

  /** 入力して登録し、成功の表示を確かめる。登録後の画面（その略称タグの編集欄）のURLからIDを読む */
  async register(v: ShortTagInput, what: string): Promise<string> {
    await this.fill(v);
    const r = await this.pressRegister();
    if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
    await expectSaved(this.page, what);
    const m = new URL(this.page.url()).pathname.match(/\/product\/storage\/(\d+)$/);
    if (!m) throw new Error(`${what}: 登録後に、略称タグの編集欄の画面へ移らない（${this.page.url()}）`);
    await this.ready();
    return m[1];
  }

  /**
   * 行の削除ボタンを押し、確認ダイアログに応じる。
   * 承認したときは、削除の要求そのもの（削除ボタンのリンク先への送信）の応答と、移った画面の応答を返す。
   * 削除の要求は、一覧へ転送するときは転送の状態（3xx）を返し、転送しないとき（403・404）は移った画面の応答と同じになる。
   */
  async pressDelete(row: Locator, accept: boolean): Promise<{ dialog: string; response: Response | null; landed: Response | null }> {
    await expect(row, "削除する行が1件").toHaveCount(1);
    const button = row.getByRole("link", { name: "削除", exact: true });
    const href = await button.getAttribute("href");
    if (!href) throw new Error("行の削除ボタンにリンク先が無い");
    const deletePath = new URL(href, this.page.url()).pathname;
    const shown = this.page.waitForEvent("dialog", { timeout: 10_000 });
    const clicked = button.click();
    const dialog: Dialog = await shown.catch(() => { throw new Error("削除ボタンを押したが、確認ダイアログが出ない"); });
    const message = dialog.message();
    if (!accept) {
      await dialog.dismiss();
      await clicked;
      return { dialog: message, response: null, landed: null };
    }
    const requested = this.page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === deletePath);
    const nav = this.page.waitForNavigation({ waitUntil: "load" });
    await dialog.accept();
    await clicked;
    const [response, landed] = await Promise.all([requested, nav]);
    return { dialog: message, response, landed };
  }

  /** 削除して、成功の表示を確かめる */
  async deleteRow(row: Locator, what: string): Promise<void> {
    await this.pressDelete(row, true);
    await expectSaved(this.page, what);
    await this.ready();
  }

  /** 名称の行が残っていれば、すべて削除する（シードの作り直し） */
  async deleteAllNamed(名称: string): Promise<void> {
    while ((await this.rowsByName(名称).count()) > 0) {
      await this.deleteRow(this.rowsByName(名称).first(), `残っていた名称「${名称}」の略称タグの削除`);
    }
  }
}
