/**
 * 部門更新CSV登録画面（設計書 M03-35。商品の商品規格の部門を、商品コードと部門コードのCSVで更新する画面）。
 * - アプリでは、メニュー「商品管理」→「商品CSV管理」の「部門登録CSVアップロード」の項目で開く画面（画面の小見出しも「部門登録CSVアップロード」）。
 *   部門登録/編集画面の「CSV入力」で開く画面（M03-20。小見出しは同じ「部門登録CSVアップロード」）とは別の画面で、
 *   見分けはアドレスと、CSVファイルフォーマットの表の項目（商品コード・部門コード）で行う。
 * - 取込ファイルの欄（ファイルを選択）・アップロードボタン・CSVファイルフォーマットの表・「雛形ファイルダウンロード」ボタン・
 *   取込履歴（件数・ファイル名・アップロード日時・作業者・ページング）がある（設計書の画面項目定義 識別ID 1〜9）。
 * - アップロードを送ると、取込が終わったときも止めたときも、この画面へ転送で戻り、結果は画面上部に出る。
 * - 取込ファイルの欄は必須の指定があり、空のままだとブラウザの入力チェックが送信を止める。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { tamperToken } from "./devtools";
import { classRowsFromProductEdit } from "./m03_23_seed_products";

export const sectionUpdateCsvUrl = () => adminUrl("/product/section/csv_upload");
export const sectionUpdateCsvPath = () => new URL(sectionUpdateCsvUrl()).pathname;
/** 取込の要求の送り先 */
const IMPORT_PATH = /\/product\/section\/import$/;

/** 画面で選ぶファイル（名前・送るときの形式種別・中身） */
export type 取込ファイル = { name: string; mimeType: string; buffer: Buffer };

/** アップロードボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type UploadResult =
  | { sent: true; 応答: number; 戻った画面: string }
  | { sent: false; 止めた項目: string[] };

/** 取込履歴の1行（画面の表示のまま） */
export type 取込履歴の行 = { ファイル名: string; アップロード日時: string; 作業者: string };

async function downloadedBytes(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export class SectionUpdateCsvPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 小見出し: Locator;
  readonly 雛形ファイルダウンロード: Locator;
  /** CSVファイルフォーマットの表の項目名の列 */
  readonly フォーマットの項目: Locator;
  readonly 履歴の行: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.小見出し = page.locator(".c-pageTitle__subTitle");
    this.雛形ファイルダウンロード = page.locator("#download-template-button");
    this.フォーマットの項目 = page.locator(".card", { has: page.locator("#download-template-button") }).locator("table tbody tr td:first-child");
    this.履歴の行 = page.locator("#csv_import_history_table tbody tr");
  }

  /** 画面の読み込みを終え、取込ファイルの欄・アップロードボタンが出るまで待つ。部門更新の画面であること（送り先とフォーマットの項目）も確かめる */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.取込ファイル, "部門更新CSV登録画面の取込ファイルの欄").toHaveCount(1);
    await expect(this.アップロードボタン, "部門更新CSV登録画面のアップロードボタン").toBeVisible();
    expect(IMPORT_PATH.test(new URL((await this.form.getAttribute("action")) ?? "", this.page.url()).pathname), "フォームの送り先が部門更新の取込").toBe(true);
  }

  /** 画面を開く（メニューの項目のリンク先と同じアドレス） */
  async open(query = ""): Promise<void> {
    const res = await this.page.goto(sectionUpdateCsvUrl() + query);
    expect(res?.status() ?? 0, "部門更新CSV登録画面の応答").toBeLessThan(400);
    await this.ready();
  }

  path(): string {
    return new URL(this.page.url()).pathname;
  }

  /** 取込ファイルの欄でファイルを選び、選べたこと（選んだファイルの名前）を確かめる */
  async choose(file: 取込ファイル): Promise<void> {
    await this.取込ファイル.setInputFiles({ name: file.name, mimeType: file.mimeType, buffer: file.buffer });
    const names = await this.取込ファイル.evaluate((e) => Array.from((e as HTMLInputElement).files ?? []).map((f) => f.name));
    expect(names, "取込ファイルに選んだファイル").toEqual([file.name]);
  }

  /** 開発者ツールで、フォームの中のなりすまし対策トークンの値を変える */
  async changeToken(value: string): Promise<void> {
    await tamperToken(this.form, value);
  }

  /**
   * アップロードボタンを押す。取込ファイルを選んでいないときは、ブラウザが送信を止める（要求を送らない）。
   * そのときは止めた項目（ブラウザの案内の文）を返す。送ったときは、取込の要求の応答の状態と、戻った画面のパスを返す。
   */
  async pressUpload(waitMs = 300_000): Promise<UploadResult> {
    await this.page.waitForLoadState("load");
    const blocked = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => `取込ファイル: ${(e as HTMLInputElement).validationMessage}`));
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse(
      (r) => r.request().method() === "POST" && IMPORT_PATH.test(new URL(r.url()).pathname), { timeout: waitMs });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: waitMs }), this.アップロードボタン.click()]);
    return { sent: true, 応答: (await response).status(), 戻った画面: this.path() };
  }

  /** 画面上部のメッセージ（成功・エラー）。開発用の設定のときに常に出る帯は除く */
  async messages(): Promise<{ 成功: string[]; エラー: string[] }> {
    const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
      .filter((t) => t && !t.includes("デバッグモードが有効"));
    return { 成功: await read(this.page.locator(".alert-success")), エラー: await read(this.page.locator(".alert-danger")) };
  }

  /** 「雛形ファイルダウンロード」を押し、ダウンロードしたファイルの名前とバイト列を返す */
  async downloadTemplate(): Promise<{ fileName: string; bytes: Buffer }> {
    await expect(this.雛形ファイルダウンロード, "雛形ファイルダウンロードボタン").toBeVisible();
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.雛形ファイルダウンロード.click()]);
    return { fileName: download.suggestedFilename(), bytes: await downloadedBytes(download) };
  }

  /** CSVファイルフォーマットの表の項目名（上から順。「必須」の印は除く） */
  async formatItems(): Promise<string[]> {
    return this.フォーマットの項目.evaluateAll((tds) => tds.map((td) => [...td.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim()));
  }

  /** いま表示している取込履歴の行（上から順。該当なしの行は除く） */
  async historyRows(): Promise<取込履歴の行[]> {
    return this.履歴の行.evaluateAll((trs) => trs
      .map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim()))
      .filter((cells) => cells.length > 1)
      .map((cells) => ({ ファイル名: cells[0], アップロード日時: cells[1], 作業者: cells[cells.length - 1] })));
  }

  /** 取込履歴を最大の件数（12000件）で開き直し、ファイル名がちょうど name の行の数を返す（総数が12000件を超えるときは止める） */
  async countHistoryNamed(name: string): Promise<number> {
    await this.open("?page_no=1&page_count=12000");
    if (await this.page.locator(".pagination").count()) throw new Error("部門更新CSVの取込履歴が12000件を超えていて、1ページで全件を確かめられない");
    return (await this.historyRows()).filter((r) => r.ファイル名 === name).length;
  }
}

/**
 * 正本「商品コードの商品の商品規格一覧から商品規格の編集画面を開き、表示された商品規格IDを控える」。
 * 商品登録編集画面（未変更）を開いた状態から、「規格設定」で商品規格一覧を開き、商品規格がちょうど1行（取り込みで作られたもの）で
 * 商品コードが code であることを確かめ、その行の「編集」で商品規格の編集画面を開いて、画面の「商品規格ID」の値を返す。
 */
export async function onlyProductClassIdOf(page: Page, productId: string, code: string): Promise<string> {
  const rows = await classRowsFromProductEdit(page, productId);
  if (rows.length !== 1) throw new Error(`商品ID ${productId} の商品規格一覧の行が ${rows.length} 件ある（取り込みで作られた1件のはず）: ${JSON.stringify(rows)}`);
  const r = rows[0];
  if (r.商品コード !== code) throw new Error(`商品ID ${productId} の商品規格の商品コードが ${r.商品コード}（${code} のはず）`);
  const edit = page.locator(`#ex-product_class-${r.商品規格ID}`).getByRole("link", { name: "編集", exact: true });
  await Promise.all([page.waitForURL(new RegExp(`/product/product/class/${productId}/edit/${r.商品規格ID}$`)), edit.click()]);
  await page.waitForLoadState("load");
  const row = page.locator("#productClass .row").filter({ has: page.locator("span", { hasText: /^\s*商品規格ID\s*$/ }) });
  await expect(row, "商品規格の編集画面の商品規格IDの行").toHaveCount(1);
  const shown = ((await row.locator(".col").first().textContent()) ?? "").trim();
  if (shown !== r.商品規格ID) throw new Error(`商品規格の編集画面の商品規格ID ${shown} が、一覧の行の ${r.商品規格ID} と違う`);
  return shown;
}
