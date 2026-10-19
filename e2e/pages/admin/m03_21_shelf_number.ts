/**
 * 棚番号登録/編集画面（メニュー「商品管理」）と、棚番号登録CSVアップロード画面。
 * - 新規入力欄・編集欄と、棚番号の一覧が同じ画面にある。編集対象を指定しない画面が新規入力欄、
 *   一覧のID・名称・並び順のリンクと編集ボタンで開く画面が編集欄。
 * - 一覧は並び順の昇順。表示件数とページは、ログイン中のセッションが覚える。
 * - 削除ボタンは、ブラウザの確認ダイアログで承認すると、画面の中に作ったフォームで削除の要求を送る
 *   （画面のスクリプトの読み込み前に押すと素通りするので、読み込みを待ってから押す）。
 * - 名称・並び順の欄と、CSVアップロードの取込ファイルの欄は必須で、空のままだとブラウザの入力チェックが送信を止める。
 */
import { Dialog, Download, expect, Locator, Page, Response } from "@playwright/test";
import { decodeCsvBytes } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type ShelfInput = { 名称: string; 並び順: string };
export type ShelfRow = { ID: string; 名称: string; 並び順: string };

export const shelfNewUrl = () => adminUrl("/product/shelf_number");
export const shelfEditUrl = (id: string) => adminUrl(`/product/shelf_number/${id}`);
export const shelfCsvUploadUrl = () => adminUrl("/product/shelf_number/master_csv_upload");
/** 削除の要求の送り先（削除ボタンのリンク先） */
export const shelfDeletePath = (id: string) => `/product/shelf_number/${id}/delete`;

export const pathOf = (url: string) => new URL(url).pathname;
export const shelfNewPath = () => pathOf(shelfNewUrl());
export const shelfEditPath = (id: string) => pathOf(shelfEditUrl(id));
export const shelfCsvUploadPath = () => pathOf(shelfCsvUploadUrl());

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 削除ボタンを押して出た、まだ応じていない確認ダイアログ */
export type PendingDelete = { dialog: Dialog; message: string; clicked: Promise<void>; deletePath: string };

/** 送信ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

/** ダウンロードしたファイルのバイト列 */
export async function downloadedBytes(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/** 画面上部のメッセージ（成功・エラー）。開発用の設定のときに常に出る帯は除く */
export async function topMessages(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.includes("デバッグモードが有効"));
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")) };
}

/** フォームの中で、ブラウザの入力チェックに通らない項目（項目名と、ブラウザの案内の文） */
async function invalidFields(form: Locator): Promise<string[]> {
  return form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
    .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
    .map((e) => {
      const label = e.closest(".form-group")?.querySelector("label")?.textContent?.trim() ?? "（項目名なし）";
      return `${label}: ${(e as HTMLInputElement).validationMessage}`;
    }));
}

/**
 * 送信ボタンを押す。ブラウザの入力チェックに通らない項目があれば、送信が止まったこと（要求が出ないこと）を確かめて、止めた項目を返す。
 * 通るときは、送信の応答と移った画面の読み込みを待つ。
 */
async function submitForm(page: Page, form: Locator, button: Locator, request: RegExp): Promise<SubmitResult> {
  const blocked = await invalidFields(form);
  if (blocked.length) {
    const sent = page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
    await button.click();
    if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
    return { sent: false, 止めた項目: blocked };
  }
  const response = page.waitForResponse((r) => r.request().method() === "POST" && request.test(r.url()));
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  return { sent: true, status: (await response).status() };
}

export class ShelfNumberPage {
  readonly form: Locator;
  readonly 名称: Locator;
  readonly 並び順: Locator;
  readonly 登録ボタン: Locator;
  readonly 新規登録へ戻る: Locator;
  readonly CSV出力: Locator;
  readonly CSV入力: Locator;
  readonly 件数: Locator;
  readonly 入力欄の見出し: Locator;
  readonly 一覧: Locator;
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form_storage_code");
    this.名称 = this.form.locator('[name="shelf_number[name]"]');
    this.並び順 = this.form.locator('[name="shelf_number[sortNo]"]');
    this.登録ボタン = page.locator('button[type="submit"][form="form_storage_code"]');
    this.新規登録へ戻る = page.getByRole("link", { name: "新規登録へ戻る", exact: true });
    this.CSV出力 = page.getByRole("link", { name: "CSV出力", exact: true });
    this.CSV入力 = page.getByRole("link", { name: "CSV入力", exact: true });
    this.件数 = page.locator("select.js-page-count");
    this.入力欄の見出し = this.form.locator(".card-header .card-title");
    this.一覧 = page.locator(".card").filter({ has: page.locator("select.js-page-count") });
    this.rows = this.一覧.locator("table tbody tr");
  }

  /** 画面の読み込みを終え、入力欄が出るまで待つ（削除ボタン・件数欄はスクリプトの読み込み後でないと動かない） */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.名称, "棚番号登録/編集画面の名称の欄").toBeVisible();
  }

  /** 編集対象を指定せずに開く（新規入力欄） */
  async openNew(): Promise<Response | null> {
    const res = await this.page.goto(shelfNewUrl());
    await this.ready();
    return res;
  }

  /** 1ページ目で開き、件数欄で表示件数を選ぶ（表示件数とページは、ログイン中のセッションが覚える） */
  async showFirstPageWith(count: string): Promise<void> {
    await this.page.goto(adminUrl("/product/shelf_number/page/1"));
    await this.ready();
    await this.chooseCount(count);
    await expect(this.件数, "一覧の表示件数").toHaveValue(count);
  }

  /** 件数欄で表示件数を選ぶ（選ぶと画面を開き直す） */
  async chooseCount(count: string): Promise<void> {
    await expect(this.件数.locator(`option[value="${count}"]`), `件数欄の選択肢 ${count}件`).toHaveCount(1);
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

  async readRow(row: Locator): Promise<ShelfRow> {
    const cell = async (n: number) => ((await row.locator(`td:nth-child(${n})`).textContent()) ?? "").trim();
    return { ID: await cell(1), 名称: await cell(2), 並び順: await cell(3) };
  }

  /** 一覧に表示された行（上から順） */
  async allRows(): Promise<ShelfRow[]> {
    return this.rows.evaluateAll((trs) => trs.map((tr) => {
      const td = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").trim();
      return { ID: td(1), 名称: td(2), 並び順: td(3) };
    }));
  }

  /** 名称がちょうど1行ある、その行のID列の値 */
  async idOfName(名称: string): Promise<string> {
    const row = this.rowsByName(名称);
    await expect(row, `一覧に名称「${名称}」の行が1件`).toHaveCount(1);
    return (await this.readRow(row)).ID;
  }

  /** 一覧の行の編集ボタンを押し、その棚番号の編集欄の画面へ移る */
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
    await Promise.all([this.page.waitForURL((u) => u.pathname === shelfEditPath(id)), link(row).click()]);
    await this.ready();
  }

  /** 「新規登録へ戻る」を押す */
  async pressBackToNew(): Promise<void> {
    await expect(this.新規登録へ戻る, "新規登録へ戻るボタン").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname === shelfNewPath()), this.新規登録へ戻る.click()]);
    await this.ready();
  }

  /** 「CSV出力」を押し、ダウンロードしたファイルの名前とバイト列・文字列を返す */
  async downloadCsv(): Promise<{ fileName: string; bytes: Buffer; text: string }> {
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.CSV出力.click()]);
    const bytes = await downloadedBytes(download);
    return { fileName: download.suggestedFilename(), bytes, text: decodeCsvBytes(bytes) };
  }

  /** 「CSV入力」を押し、棚番号登録CSVアップロード画面へ移る */
  async pressCsvInput(): Promise<ShelfCsvUploadPage> {
    await expect(this.CSV入力, "CSV入力ボタン").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname === shelfCsvUploadPath()), this.CSV入力.click()]);
    const upload = new ShelfCsvUploadPage(this.page);
    await upload.ready();
    return upload;
  }

  /** 入力欄に読み込まれている値 */
  async inputValues(): Promise<ShelfInput> {
    return { 名称: await this.名称.inputValue(), 並び順: await this.並び順.inputValue() };
  }

  async fill(v: Partial<ShelfInput>): Promise<void> {
    if (v.名称 !== undefined) await this.名称.fill(v.名称);
    if (v.並び順 !== undefined) await this.並び順.fill(v.並び順);
  }

  /** 並び順の入力欄を、数字以外も入力できる欄にする（開発者ツールで入力欄の種類を書き換えるのと同じ） */
  async allowTextInSortOrder(): Promise<void> {
    await this.並び順.evaluate((e) => e.setAttribute("type", "text"));
    await expect(this.並び順, "並び順の入力欄の種類").toHaveAttribute("type", "text");
  }

  /**
   * 登録ボタンを押す。入力欄が必須なのに空のときは、ブラウザが送信を止める（要求を送らない）。
   * そのときは止めた項目（項目名と、ブラウザの案内の文）を返す。
   */
  async pressRegister(): Promise<SubmitResult> {
    return submitForm(this.page, this.form, this.登録ボタン, /\/product\/shelf_number\/store(\/\d+)?$/);
  }

  /** 入力して登録し、成功の表示を確かめる。登録後の画面（その棚番号の編集欄）のURLからIDを読む */
  async register(v: ShelfInput, what: string): Promise<string> {
    await this.fill(v);
    const r = await this.pressRegister();
    if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
    await expectSaved(this.page, what);
    const m = pathOf(this.page.url()).match(/\/product\/shelf_number\/(\d+)$/);
    if (!m) throw new Error(`${what}: 登録後に、棚番号の編集欄の画面へ移らない（${this.page.url()}）`);
    await this.ready();
    return m[1];
  }

  /**
   * 行の削除ボタンを押し、確認ダイアログが出るまで待つ。ダイアログは開いたまま返す（answerDelete で応じる）。
   * 正本が「削除ボタンを押す」と「確認ダイアログで確定する（キャンセルする）」を別の手順にしているケースで、手順を分けて実行するため。
   */
  async pressDeleteButton(row: Locator): Promise<PendingDelete> {
    await expect(row, "削除する行が1件").toHaveCount(1);
    await this.page.waitForLoadState("load");
    const button = row.getByRole("link", { name: "削除", exact: true });
    await expect(button, "行の削除ボタン").toHaveCount(1);
    const href = await button.getAttribute("href");
    if (!href) throw new Error("行の削除ボタンにリンク先が無い");
    const deletePath = new URL(href, this.page.url()).pathname;
    const shown = this.page.waitForEvent("dialog", { timeout: 10_000 });
    const clicked = button.click();
    // ダイアログに応じるまで押す操作は終わらない。応じる前にケースが落ちたときに、未処理の失敗として残さない（応じるときは改めて待つ）
    clicked.catch(() => undefined);
    const dialog: Dialog = await shown.catch(() => { throw new Error("削除ボタンを押したが、確認ダイアログが出ない"); });
    return { dialog, message: dialog.message(), clicked, deletePath };
  }

  /**
   * 開いている削除の確認ダイアログに応じる。承認したときは、削除の要求そのもの（削除ボタンのリンク先への送信）の応答を返す。
   * 一覧へ転送するときは転送の状態（3xx）、転送しないとき（403・404）は移った画面の応答と同じになる。移った画面の読み込みも待つ。
   */
  async answerDelete(pending: PendingDelete, accept: boolean): Promise<Response | null> {
    if (!accept) {
      await pending.dialog.dismiss();
      await pending.clicked;
      return null;
    }
    const requested = this.page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === pending.deletePath);
    const nav = this.page.waitForNavigation({ waitUntil: "load" });
    await pending.dialog.accept();
    await pending.clicked;
    const [response] = await Promise.all([requested, nav]);
    return response;
  }

  /** 行の削除ボタンを押し、確認ダイアログに応じる。承認したときは、削除の要求そのものの応答を返す */
  async pressDelete(row: Locator, accept: boolean): Promise<{ dialog: string; response: Response | null }> {
    const pending = await this.pressDeleteButton(row);
    return { dialog: pending.message, response: await this.answerDelete(pending, accept) };
  }

  /** 行の削除ボタンの送り先（リンク先）を、別の棚番号IDのものに書き換える（開発者ツールで書き換えるのと同じ。トークンはそのまま） */
  async retargetDelete(row: Locator, toId: string): Promise<void> {
    const link = row.getByRole("link", { name: "削除", exact: true });
    await expect(link, "行の削除ボタン").toHaveCount(1);
    const href = (await link.getAttribute("href")) ?? "";
    const m = href.match(/\/product\/shelf_number\/(\d+)\/delete$/);
    if (!m) throw new Error(`削除ボタンの送り先が想定と違う: ${href}`);
    await link.evaluate((a, to) => a.setAttribute("href", to), href.replace(shelfDeletePath(m[1]), shelfDeletePath(toId)));
    await expect(link, "書き換えた削除ボタンの送り先").toHaveAttribute("href", new RegExp(`${shelfDeletePath(toId)}$`));
  }

  /** 行の削除ボタンが送るなりすまし対策トークンを、別の値に書き換える（開発者ツールで書き換えるのと同じ） */
  async replaceDeleteToken(row: Locator, token: string): Promise<void> {
    const link = row.getByRole("link", { name: "削除", exact: true });
    await expect(link, "行の削除ボタン").toHaveAttribute("token-for-anchor", /.+/);
    await link.evaluate((a, t) => a.setAttribute("token-for-anchor", t), token);
    await expect(link, "書き換えたなりすまし対策トークン").toHaveAttribute("token-for-anchor", token);
  }

  /**
   * 削除して、結果を返す。商品規格で使用中のため削除されなかったときは "使用中" を返す（画面上部のエラーで見分ける）。
   * それ以外のエラーやシステムエラーは落とす。
   */
  async deleteRow(row: Locator, what: string): Promise<"削除" | "使用中"> {
    await this.pressDelete(row, true);
    const { エラー } = await topMessages(this.page);
    if (エラー.some((t) => t.includes("商品で使用されているため"))) {
      await this.ready();
      return "使用中";
    }
    await expectSaved(this.page, what);
    await this.ready();
    return "削除";
  }
}

/** 棚番号登録CSVアップロード画面 */
export class ShelfCsvUploadPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 見出し: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.見出し = page.locator(".c-pageTitle__subTitle");
  }

  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.取込ファイル, "棚番号登録CSVアップロード画面の取込ファイルの欄").toHaveCount(1);
  }

  /** 画面を開く */
  async open(): Promise<void> {
    await this.page.goto(shelfCsvUploadUrl());
    await this.ready();
  }

  /** 取込ファイルにファイルを指定する */
  async choose(filePath: string): Promise<void> {
    await this.取込ファイル.setInputFiles(filePath);
  }

  /** 「CSVファイルをアップロード」を押す（CSV登録の送信）。取込ファイルが空のときは、ブラウザの入力チェックが送信を止めることがある */
  async submit(): Promise<SubmitResult> {
    const r = await submitForm(this.page, this.form, this.アップロードボタン, /\/product\/shelf_number\/(master_)?import$/);
    if (r.sent) await this.ready();
    return r;
  }

  /** 取込ファイルを指定して送信し、成功の表示を確かめる */
  async importFile(filePath: string, what: string): Promise<void> {
    await this.choose(filePath);
    const r = await this.submit();
    if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
    await expectSaved(this.page, what);
  }
}
