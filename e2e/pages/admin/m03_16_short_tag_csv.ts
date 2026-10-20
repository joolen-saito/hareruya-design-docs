/**
 * 略称タグCSVアップロード画面（メニュー「商品管理」。略称タグ登録/編集画面の「CSV入力」から開く画面）。
 * - 取込ファイルの欄（ファイルを選択）・「CSVファイルをアップロード」ボタン・略称タグ登録CSVファイルフォーマットの表・
 *   「雛形ファイルダウンロード」ボタンがある（設計書の画面項目定義 識別ID 1〜4）。
 * - アップロードを送ると、取り込みが終わったときも止めたときも、この画面へ転送で戻り、結果は画面上部に出る。
 * - 取込ファイルの欄は必須で、空のままだとブラウザの入力チェックが送信を止める。
 */
import { Download, expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export const shortTagCsvUploadUrl = () => adminUrl("/product/storage_code/csv");
export const shortTagCsvUploadPath = () => new URL(shortTagCsvUploadUrl()).pathname;
/** 略称タグCSVアップロード画面の見出し（画面の中の見出し） */
export const SHORT_TAG_CSV_UPLOAD_TITLE = "略称タグ登録CSVアップロード";

/** アップロードボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type UploadResult =
  | { sent: true; 応答: number; 戻った画面: string }
  | { sent: false; 止めた項目: string[] };

/** 画面上部のメッセージ（成功・エラー）。開発用の設定のときに常に出る帯は除く */
export async function topMessagesOf(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.includes("デバッグモードが有効"));
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")) };
}

async function downloadedBytes(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export class ShortTagCsvUploadPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 見出し: Locator;
  readonly 雛形ファイルダウンロード: Locator;
  /** 略称タグ登録CSVファイルフォーマットの表の見出しの列 */
  readonly フォーマットの項目: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.見出し = page.locator("h3.c-primaryCol__title");
    this.雛形ファイルダウンロード = page.locator("#download-template-button");
    this.フォーマットの項目 = page.locator(".card", { hasText: "略称タグ登録CSVファイルフォーマット" }).locator("table thead th");
  }

  /** 画面の読み込みを終え、取込ファイルの欄が出るまで待つ */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.取込ファイル, "略称タグCSVアップロード画面の取込ファイルの欄").toHaveCount(1);
  }

  /** 画面を開く */
  async open(): Promise<Response | null> {
    const res = await this.page.goto(shortTagCsvUploadUrl());
    await this.ready();
    return res;
  }

  /** 取込ファイルにファイルを指定し、指定できたこと（選んだファイルの名前）を確かめる */
  async choose(filePath: string): Promise<void> {
    await this.取込ファイル.setInputFiles(filePath);
    const names = await this.取込ファイル.evaluate((e) => Array.from((e as HTMLInputElement).files ?? []).map((f) => f.name));
    expect(names, "取込ファイルに指定したファイル").toEqual([filePath.split(/[\\/]/).pop()]);
  }

  /** フォームの中で、ブラウザの入力チェックに通らない項目（項目名と、ブラウザの案内の文） */
  private async invalidFields(): Promise<string[]> {
    return this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => {
        const label = e.closest(".form-group")?.querySelector("label")?.textContent?.trim() ?? "取込ファイル";
        return `${label}: ${(e as HTMLInputElement).validationMessage}`;
      }));
  }

  /**
   * 「CSVファイルをアップロード」を押す。ブラウザの入力チェックに通らない項目があれば、送信が止まったこと（要求が出ないこと）を確かめて返す。
   * 通るときは、アップロードの要求の応答と、転送で移った画面の読み込みを待ち、移った画面のアドレスのパスを返す。
   */
  async submit(): Promise<UploadResult> {
    const blocked = await this.invalidFields();
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/product\/storage_code\/import$/.test(new URL(r.url()).pathname));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.アップロードボタン.click()]);
    const status = (await response).status();
    return { sent: true, 応答: status, 戻った画面: new URL(this.page.url()).pathname };
  }

  /** 「雛形ファイルダウンロード」を押し、ダウンロードしたファイルの名前とバイト列を返す */
  async downloadTemplate(): Promise<{ fileName: string; bytes: Buffer }> {
    await expect(this.雛形ファイルダウンロード, "雛形ファイルダウンロードボタン").toBeVisible();
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.雛形ファイルダウンロード.click()]);
    return { fileName: download.suggestedFilename(), bytes: await downloadedBytes(download) };
  }

  /** 略称タグ登録CSVファイルフォーマットの表の項目名（左から順） */
  async formatItems(): Promise<string[]> {
    return (await this.フォーマットの項目.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
}
