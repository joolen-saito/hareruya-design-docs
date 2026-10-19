/**
 * 部門登録/編集画面（メニュー「商品管理」）。登録・編集の入力欄と部門の一覧が同じ画面にある。
 * - 編集対象を指定しない画面が新規登録の入力欄、一覧の編集ボタン・ID・部門名のリンクで開く画面が編集の入力欄。
 *   一覧の部門コードの列は、画面ではリンクになっていない。
 * - 一覧は部門コードの順で、ページ送りは無い。
 * - 登録・編集が保存されると、画面は編集対象を指定しない画面（新規登録の入力欄と一覧）へ移る。
 *   入力の誤り・重複で保存されないときは、送信先の画面のまま入力欄と一覧を出し直す。
 * - 削除ボタンは、ブラウザの確認ダイアログで承諾すると、画面の中に作ったフォームで削除の要求を送る。
 *   画面のスクリプトの読み込み前に押すと確認ダイアログが出ずに素通りするので、読み込みを待ってから押す。
 * - 部門の登録・更新・削除のたびに、アプリはスマレジへ部門を連携する。手元の環境（local）では、スマレジの接続先が
 *   設定されていないとき、アプリに組み込みの模擬の応答が返る。
 * - 「CSV入力」は部門登録CSVアップロード画面へ移る。
 */
import { Dialog, Download, expect, Locator, Page, Response } from "@playwright/test";
import { csvLine, decodeCsvBytes } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type 免税区分 = "対象外" | "一般品" | "消耗品";
export type DepartmentInput = { 部門名: string; 部門コード: string; 免税区分: 免税区分; MTGBuyer表示フラグ: boolean };
/** 入力欄に読み込まれている値。免税区分は選ばれている選択肢の名前（選ばれていなければ空） */
export type DepartmentFormValues = { 部門名: string; 部門コード: string; 免税区分: string; MTGBuyer表示フラグ: boolean };
/** 一覧の1行（画面の表示のまま） */
export type DepartmentRow = { ID: string; 部門名: string; 部門コード: string; 免税区分: string; MTGBuyer表示フラグ: string };

export const departmentNewUrl = () => adminUrl("/product/section");
export const departmentEditUrl = (id: string) => adminUrl(`/product/section/${id}`);
export const departmentCsvUploadUrl = () => adminUrl("/product/section/master_csv_upload");
export const departmentNewPath = () => new URL(departmentNewUrl()).pathname;
export const departmentEditPath = (id: string) => new URL(departmentEditUrl(id)).pathname;
export const departmentCsvUploadPath = () => new URL(departmentCsvUploadUrl()).pathname;
/** 登録・編集の送信先（入力の誤り・重複のときは、この画面のまま出し直す） */
export const departmentStorePath = /\/product\/section\/store(\/\d+)?$/;

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 登録・編集ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

async function downloadedText(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return decodeCsvBytes(Buffer.concat(chunks));
}

const COLUMN = { ID: 1, 部門名: 2, 部門コード: 3, 免税区分: 4, MTGBuyer表示フラグ: 5 } as const;

export class DepartmentPage {
  readonly form: Locator;
  readonly 部門名: Locator;
  readonly 部門コード: Locator;
  readonly 免税区分: Locator;
  readonly MTGBuyer表示フラグ: Locator;
  readonly 登録ボタン: Locator;
  readonly 新規登録へ戻る: Locator;
  /** 画面項目定義の「新規登録はこちらボタン」と同じ名前のボタン */
  readonly 新規登録はこちら: Locator;
  readonly CSV出力: Locator;
  readonly CSV入力: Locator;
  readonly 入力欄の見出し: Locator;
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form_section");
    this.部門名 = this.form.locator('[name="product_department[name]"]');
    this.部門コード = this.form.locator('[name="product_department[code]"]');
    this.免税区分 = this.form.locator('select[name="product_department[tax_free_division]"]');
    this.MTGBuyer表示フラグ = this.form.locator('input[type="checkbox"][name="product_department[visible]"]');
    this.登録ボタン = page.locator('button[type="submit"][form="form_section"]');
    this.新規登録へ戻る = page.getByRole("link", { name: "新規登録へ戻る", exact: true });
    this.新規登録はこちら = page.locator("a, button").filter({ hasText: exact("新規登録はこちら") });
    this.CSV出力 = page.getByRole("link", { name: "CSV出力", exact: true });
    this.CSV入力 = page.getByRole("link", { name: "CSV入力", exact: true });
    this.入力欄の見出し = this.form.locator(".card-header .card-title");
    this.rows = page.locator("table tbody tr");
  }

  /** 画面の読み込みを終え、入力欄が出るまで待つ（削除ボタンはスクリプトの読み込み後でないと動かない） */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.部門名, "部門登録/編集画面の部門名の欄").toBeVisible();
  }

  /** 編集対象を指定せずに開く（新規登録の入力欄と一覧） */
  async openNew(): Promise<Response | null> {
    const res = await this.page.goto(departmentNewUrl());
    await this.ready();
    return res;
  }

  rowById(id: string): Locator {
    return this.rows.filter({ has: this.page.locator(`td:nth-child(${COLUMN.ID})`, { hasText: exact(id) }) });
  }

  rowsByName(部門名: string): Locator {
    return this.rows.filter({ has: this.page.locator(`td:nth-child(${COLUMN.部門名})`, { hasText: exact(部門名) }) });
  }

  rowsByCode(部門コード: string): Locator {
    return this.rows.filter({ has: this.page.locator(`td:nth-child(${COLUMN.部門コード})`, { hasText: exact(部門コード) }) });
  }

  async readRow(row: Locator): Promise<DepartmentRow> {
    const cell = async (n: number) => ((await row.locator(`td:nth-child(${n})`).textContent()) ?? "").trim();
    return {
      ID: await cell(COLUMN.ID), 部門名: await cell(COLUMN.部門名), 部門コード: await cell(COLUMN.部門コード),
      免税区分: await cell(COLUMN.免税区分), MTGBuyer表示フラグ: await cell(COLUMN.MTGBuyer表示フラグ),
    };
  }

  /** 一覧に表示された行（上から順） */
  async allRows(): Promise<DepartmentRow[]> {
    return this.rows.evaluateAll((trs, c) => trs.map((tr) => {
      const td = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").trim();
      return { ID: td(c.ID), 部門名: td(c.部門名), 部門コード: td(c.部門コード), 免税区分: td(c.免税区分), MTGBuyer表示フラグ: td(c.MTGBuyer表示フラグ) };
    }), COLUMN);
  }

  /** 部門名がちょうど1行ある、その行のID列の値 */
  async idOfName(部門名: string): Promise<string> {
    const row = this.rowsByName(部門名);
    await expect(row, `一覧に部門名「${部門名}」の行が1件`).toHaveCount(1);
    return (await this.readRow(row)).ID;
  }

  /** 一覧の行の、ID・部門名・部門コードの列のリンク（無ければ数は0） */
  columnLink(id: string, 列: "ID" | "部門名" | "部門コード"): Locator {
    return this.rowById(id).locator(`td:nth-child(${COLUMN[列]}) a`);
  }

  /** 一覧の行の編集ボタンを押し、その部門の編集の入力欄の画面へ移る */
  async pressEdit(id: string): Promise<void> {
    await this.pressRowLink(id, this.rowById(id).getByRole("link", { name: "編集", exact: true }), "編集ボタン");
  }

  /** 一覧の行の、ID・部門名・部門コードの列のリンクを押す */
  async pressColumnLink(id: string, 列: "ID" | "部門名" | "部門コード"): Promise<void> {
    await this.pressRowLink(id, this.columnLink(id, 列), `${列}のリンク`);
  }

  private async pressRowLink(id: string, link: Locator, what: string): Promise<void> {
    await expect(this.rowById(id), `一覧にID ${id} の行が1件`).toHaveCount(1);
    await expect(link, `ID ${id} の行の${what}`).toHaveCount(1);
    await Promise.all([this.page.waitForURL((u) => u.pathname === departmentEditPath(id)), link.click()]);
    await this.ready();
  }

  /** 「新規登録へ戻る」を押す */
  async pressBackToNew(): Promise<void> {
    await expect(this.新規登録へ戻る, "新規登録へ戻るボタン").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname === departmentNewPath()), this.新規登録へ戻る.click()]);
    await this.ready();
  }

  /** 入力欄の上と下（画面上部の帯・入力欄・画面下部の登録の帯）に表示されているボタンの名前 */
  async buttonsAroundForm(): Promise<string[]> {
    const items = this.page.locator(".c-primaryCol__header a, .c-primaryCol__header button, #form_section a, #form_section button, #ex-conversion-action a, #ex-conversion-action button");
    const out: string[] = [];
    for (const e of await items.all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return out.filter(Boolean);
  }

  /** 「CSV出力」を押し、ダウンロードしたファイルの名前と中身を返す */
  async downloadCsv(): Promise<{ fileName: string; text: string }> {
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.CSV出力.click()]);
    return { fileName: download.suggestedFilename(), text: await downloadedText(download) };
  }

  /** 「CSV入力」を押し、部門登録CSVアップロード画面へ移る */
  async pressCsvInput(): Promise<void> {
    await expect(this.CSV入力, "CSV入力ボタン").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname === departmentCsvUploadPath()), this.CSV入力.click()]);
    await this.page.waitForLoadState("load");
  }

  /** 入力欄に読み込まれている値 */
  async inputValues(): Promise<DepartmentFormValues> {
    const selected = await this.免税区分.locator("option:checked").allInnerTexts();
    return {
      部門名: await this.部門名.inputValue(),
      部門コード: await this.部門コード.inputValue(),
      免税区分: (selected[0] ?? "").trim(),
      MTGBuyer表示フラグ: await this.MTGBuyer表示フラグ.isChecked(),
    };
  }

  /** 免税区分の選択肢の名前（上から順） */
  async taxFreeChoices(): Promise<{ value: string; label: string }[]> {
    return this.免税区分.locator("option").evaluateAll((os) => os.map((o) => ({ value: (o as HTMLOptionElement).value, label: (o.textContent ?? "").trim() })));
  }

  async fill(v: Partial<DepartmentInput>): Promise<void> {
    if (v.部門名 !== undefined) await this.部門名.fill(v.部門名);
    if (v.部門コード !== undefined) await this.部門コード.fill(v.部門コード);
    if (v.免税区分 !== undefined) {
      await expect(this.免税区分, "免税区分の選択欄").toBeEnabled();
      await this.免税区分.selectOption({ label: v.免税区分 });
    }
    if (v.MTGBuyer表示フラグ !== undefined) {
      await expect(this.MTGBuyer表示フラグ, "MTGBuyer表示フラグ").toBeEnabled();
      await this.MTGBuyer表示フラグ.setChecked(v.MTGBuyer表示フラグ);
    }
  }

  /**
   * 免税区分を未選択にする。選択肢に未選択（値が空）のものがあればそれを選ぶ。
   * 無いときは選択欄を変えずに false を返す（利用者の操作では未選択にできない）。
   */
  async unselectTaxFree(): Promise<boolean> {
    const blank = (await this.taxFreeChoices()).find((c) => c.value === "");
    if (!blank) return false;
    await this.免税区分.selectOption({ value: "" });
    return true;
  }

  /** 開発者ツールで、免税区分の選択欄に値の選択肢を足して選ぶ */
  async addTaxFreeChoiceAndSelect(value: string): Promise<void> {
    await this.免税区分.evaluate((s, v) => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v;
      s.appendChild(o);
      (s as HTMLSelectElement).value = v;
      s.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await expect(this.免税区分, `免税区分の選択欄で値 ${value} が選ばれている`).toHaveValue(value);
  }

  /**
   * 登録・編集ボタンを押す。入力欄が必須なのに空のときは、ブラウザが送信を止める（要求を送らない）。
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
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && departmentStorePath.test(new URL(r.url()).pathname));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.登録ボタン.click()]);
    return { sent: true, status: (await response).status() };
  }

  /** 新規登録の入力欄で入力して登録し、成功の表示を確かめる。移った一覧の部門名の行のID列からIDを読む */
  async register(v: DepartmentInput, what: string): Promise<string> {
    if (new URL(this.page.url()).pathname !== departmentNewPath()) await this.openNew();
    await this.fill(v);
    const r = await this.pressRegister();
    if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
    await expectSaved(this.page, what);
    if (new URL(this.page.url()).pathname !== departmentNewPath()) throw new Error(`${what}: 登録後に部門の一覧の画面へ移らない（${this.page.url()}）`);
    await this.ready();
    return this.idOfName(v.部門名);
  }

  /** 入力欄の直下に出ているエラーの文（項目ごと） */
  async fieldErrors(): Promise<{ 部門名: string[]; 部門コード: string[]; 免税区分: string[] }> {
    // 入力欄の囲みの中から入力欄を探す（フォームから辿る部品を中に渡すと、囲みの中にフォームを探してしまい何も合わない）
    const of = async (selector: string) => {
      const group = this.form.locator(".form-group").filter({ has: this.page.locator(selector) });
      return (await group.locator(".form-error-message").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    };
    return {
      部門名: await of('[name="product_department[name]"]'),
      部門コード: await of('[name="product_department[code]"]'),
      免税区分: await of('select[name="product_department[tax_free_division]"]'),
    };
  }

  /** 行の削除ボタンを押し、確認ダイアログに応じる。承諾したときは、移った画面の応答を返す */
  async pressDelete(row: Locator, accept: boolean): Promise<{ dialog: string; response: Response | null }> {
    await expect(row, "削除する行が1件").toHaveCount(1);
    await this.page.waitForLoadState("load");
    const button = row.getByRole("link", { name: "削除", exact: true });
    const shown = this.page.waitForEvent("dialog", { timeout: 10_000 });
    const clicked = button.click();
    const dialog: Dialog = await shown.catch(() => { throw new Error("削除ボタンを押したが、確認ダイアログが出ない"); });
    const message = dialog.message();
    if (!accept) {
      await dialog.dismiss();
      await clicked;
      return { dialog: message, response: null };
    }
    const nav = this.page.waitForNavigation({ waitUntil: "load" });
    await dialog.accept();
    await clicked;
    return { dialog: message, response: await nav };
  }

  /** 削除して、成功の表示を確かめる */
  async deleteRow(row: Locator, what: string): Promise<void> {
    await this.pressDelete(row, true);
    await expectSaved(this.page, what);
    await this.ready();
  }
}

/** 部門登録CSVアップロード画面で、ファイルを選んでアップロードボタンを押す */
export class DepartmentCsvUploadPage {
  readonly ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 小見出し: Locator;

  constructor(readonly page: Page) {
    this.ファイル = page.locator("#upload-form input[type=file]");
    this.アップロードボタン = page.locator("#upload-button");
    this.小見出し = page.locator(".c-pageTitle__subTitle");
  }

  async choose(file: { name: string; buffer: Buffer }): Promise<void> {
    await expect(this.ファイル, "ファイルを選択の欄").toHaveCount(1);
    await this.ファイル.setInputFiles({ name: file.name, mimeType: "text/csv", buffer: file.buffer });
  }

  /** アップロードボタンを押し、取込の要求の応答の状態と、移った画面を返す */
  async upload(waitMs = 300_000): Promise<{ status: number; path: string }> {
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/product\/section\/master_import$/.test(new URL(r.url()).pathname), { timeout: waitMs });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: waitMs }), this.アップロードボタン.click()]);
    return { status: (await response).status(), path: new URL(this.page.url()).pathname };
  }
}

/**
 * 行数確認ファイル（シード S-M03-18-CSV-050・051）。見出し行（ID・部門名・部門コード・免税区分・MTGBuyer表示フラグ）と
 * データ行。ID列は空、部門名は「CSV行数部門M0318-<番号>-0001」から連番、部門コードは「M0318-<番号>-0001」から連番、
 * 免税区分0、MTGBuyer表示フラグ1。UTF-8・カンマ区切りで、各行（最後の行を含む）の終わりに改行を置く。
 */
export function 行数確認ファイル(番号: string, データ行数: number): { name: string; buffer: Buffer; 行数: number; 部門コード: string[] } {
  const seq = Array.from({ length: データ行数 }, (_, i) => String(i + 1).padStart(4, "0"));
  const codes = seq.map((n) => `M0318-${番号}-${n}`);
  const lines = [
    csvLine(["ID", "部門名", "部門コード", "免税区分", "MTGBuyer表示フラグ"]),
    ...seq.map((n, i) => csvLine(["", `CSV行数部門M0318-${番号}-${n}`, codes[i], "0", "1"])),
  ];
  return { name: `M0318-${番号}-rows.csv`, buffer: Buffer.from(lines.map((l) => `${l}\n`).join(""), "utf8"), 行数: lines.length, 部門コード: codes };
}
