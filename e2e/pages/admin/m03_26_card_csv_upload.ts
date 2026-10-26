/**
 * カード商品CSVアップロード画面（メニュー「商品管理」→「CSV管理」→「カード商品CSV」）と、グッズ商品CSVアップロード画面。
 * 設計書の画面名は「カード商品CSV登録」「グッズ商品CSV登録」。
 * - 取込ファイルの欄・「CSVファイルをアップロード」ボタン・「雛形ファイルダウンロード」ボタン・CSVの形式の表・取込履歴の一覧が1つの画面にある。
 * - 取込ファイルの欄は必須で、空のままだとブラウザの入力チェックが送信を止める（送信の処理が始まらないので、確認モーダルも出ない）。
 * - カード商品CSVは、送信の処理の初めに確認モーダル（画面の中のダイアログ）を出し、モーダルの「確定」でフォームを送る。
 *   グッズ商品CSVは確認モーダルを出さずにそのまま送る（画面のスクリプトは読み込み中の表示を出すだけ）。
 * - 取込の要求は、成功・失敗とも、この画面へ戻す（画面上部に完了またはエラーのメッセージ）。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type CsvUploadKind = "カード商品" | "グッズ商品";

const URLS: Record<CsvUploadKind, string> = {
  カード商品: "/product/product_card_csv_upload",
  グッズ商品: "/product/product_goods_csv_upload",
};

/** 送信ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

/** CSVの形式の表の1行（項目名と説明） */
export type FormatRow = { 項目名: string; 説明: string };

export class CsvUploadPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 雛形ダウンロード: Locator;
  readonly 確認モーダル: Locator;
  readonly 確認モーダルの確定: Locator;

  constructor(readonly page: Page, readonly kind: CsvUploadKind) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.雛形ダウンロード = page.locator("#download-template-button");
    this.確認モーダル = page.locator("#cardProductCsvUploadConfirmModal");
    this.確認モーダルの確定 = page.locator("#card-product-csv-upload-confirm");
  }

  url(): string { return adminUrl(URLS[this.kind]); }
  path(): string { return new URL(this.url()).pathname; }

  /** 画面の読み込み（画面のスクリプトを含む）を待ち、取込ファイルの欄があることを確かめる */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.取込ファイル, `${this.kind}CSVアップロード画面の取込ファイルの欄`).toHaveCount(1);
  }

  async open(): Promise<void> {
    const res = await this.page.goto(this.url());
    expect(res?.status() ?? 0, `${this.kind}CSVアップロード画面の応答`).toBe(200);
    await this.ready();
  }

  async choose(filePath: string): Promise<void> {
    await this.取込ファイル.setInputFiles(filePath);
  }

  async chosenCount(): Promise<number> {
    return this.取込ファイル.evaluate((e) => (e as HTMLInputElement).files?.length ?? 0);
  }

  /** フォームの中で、ブラウザの入力チェックに通らない項目（項目名と、ブラウザの案内の文） */
  async invalidFields(): Promise<string[]> {
    return this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => {
        const input = e as HTMLInputElement;
        return `${input.type === "file" ? "取込ファイル" : "（項目名なし）"}: ${input.validationMessage}`;
      }));
  }

  /**
   * 「CSVファイルをアップロード」ボタンを押す。
   * - ブラウザの入力チェックに通らないときは、要求が出ないことを確かめて、止めた項目を返す（確認モーダルが開いたかは modalOpened で見る）。
   * - カード商品CSVで入力チェックを通るときは、確認モーダルが開くまで待って null を返す（送信は confirm で行う）。
   * - グッズ商品CSVで入力チェックを通るときは、取込の要求の応答と移った画面の読み込みを待つ。
   */
  async pressUpload(): Promise<SubmitResult | null> {
    await expect(this.アップロードボタン, "「CSVファイルをアップロード」ボタン").toHaveText(/^\s*CSVファイルをアップロード\s*$/);
    const blocked = await this.invalidFields();
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    if (this.kind === "カード商品") {
      await this.アップロードボタン.click();
      await expect(this.確認モーダル, "アップロードの確認モーダル").toBeVisible();
      return null;
    }
    return this.waitImport(() => this.アップロードボタン.click());
  }

  /** 確認モーダルが開いているか */
  async modalOpened(): Promise<boolean> {
    return this.確認モーダル.isVisible();
  }

  /** 確認モーダルの文（見出しと本文） */
  async modalText(): Promise<string> {
    return ((await this.確認モーダル.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /** 確認モーダルの「確定」を押し、取込の要求の応答と、移った画面の読み込みを待つ */
  async confirm(waitMs = 600_000): Promise<SubmitResult> {
    await expect(this.確認モーダルの確定, "確認モーダルの確定ボタン").toBeVisible();
    return this.waitImport(() => this.確認モーダルの確定.click(), waitMs);
  }

  private async waitImport(click: () => Promise<void>, waitMs = 600_000): Promise<SubmitResult> {
    const p = this.path();
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === p, { timeout: waitMs });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: waitMs }), click()]);
    const status = (await response).status();
    await this.page.waitForLoadState("load");
    return { sent: true, status };
  }

  /** 「雛形ファイルダウンロード」ボタンを押し、始まったダウンロードを返す */
  async downloadTemplate(): Promise<Download> {
    await expect(this.雛形ダウンロード, "「雛形ファイルダウンロード」ボタン").toHaveText(/^\s*雛形ファイルダウンロード\s*$/);
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.雛形ダウンロード.click()]);
    return download;
  }

  /** CSVの形式の表（項目名と説明）。項目名の欄の「必須」の印は除く */
  async formatRows(): Promise<FormatRow[]> {
    return this.page.locator("table.table-striped.table-bordered:not(#csv_import_history_table) tbody tr").evaluateAll((rows) => rows.map((row) => {
      const cells = row.querySelectorAll("td");
      const name = cells.length ? [...cells[0].childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join("").trim() : "";
      return { 項目名: name, 説明: cells.length > 1 ? (cells[1].textContent ?? "").replace(/\s+/g, " ").trim() : "" };
    }));
  }
}
