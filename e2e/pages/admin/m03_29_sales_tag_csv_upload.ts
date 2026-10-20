/**
 * 売上分析タグ更新CSVアップロード画面（メニュー「商品管理」→「CSV管理」→「売上分析タグ更新CSV」）。
 * 設計書の画面名は「売上分析タグ更新CSV登録」。画面の見出しは「売上分析タグ更新CSVアップロード」。
 * - 取込ファイルの欄・「CSVファイルをアップロード」ボタン・「雛形ファイルダウンロード」ボタン・取込履歴の一覧が1つの画面にある。
 * - 取込ファイルの欄は必須で、空のままだとブラウザの入力チェックが送信を止める（棚番号登録CSVアップロード画面と同じ作り）。
 * - 取込の要求は、成功・失敗とも、この画面へ戻す（画面上部に完了またはエラーのメッセージ）。
 * - なりすまし対策トークンは、アップロードのフォームの中の隠し項目にある。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { tamperToken } from "./devtools";
import { pathOf } from "./m03_21_shelf_number";

export const salesTagCsvUploadUrl = () => adminUrl("/product/tag_sales_analysis/csv_upload");
export const salesTagCsvUploadPath = () => pathOf(salesTagCsvUploadUrl());
/** 取込の要求の送り先（アップロードのフォームの送り先） */
const IMPORT_REQUEST = /\/product\/tag_sales_analysis\/import$/;

/** 送信ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

/** フォームの中で、ブラウザの入力チェックに通らない項目（項目名と、ブラウザの案内の文） */
async function invalidFields(form: Locator): Promise<string[]> {
  return form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
    .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
    .map((e) => {
      const input = e as HTMLInputElement;
      const label = input.type === "file" ? "取込ファイル" : (e.closest(".form-group")?.querySelector("label")?.textContent?.trim() ?? "（項目名なし）");
      return `${label}: ${input.validationMessage}`;
    }));
}

export class SalesTagCsvUploadPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 雛形ダウンロード: Locator;
  readonly トークン: Locator;
  readonly 見出し: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.雛形ダウンロード = page.locator("#download-template-button");
    this.トークン = this.form.locator('input[name$="[_token]"]');
    this.見出し = page.locator(".c-pageTitle__subTitle");
  }

  /** 画面の読み込み（画面のスクリプトを含む）を待ち、取込ファイルの欄があることを確かめる */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.取込ファイル, "売上分析タグ更新CSVアップロード画面の取込ファイルの欄").toHaveCount(1);
  }

  /** 画面を開く */
  async open(): Promise<void> {
    const res = await this.page.goto(salesTagCsvUploadUrl());
    expect(res?.status() ?? 0, "売上分析タグ更新CSVアップロード画面の応答").toBe(200);
    await this.ready();
  }

  /** 取込ファイルの欄でファイルを選ぶ（「ファイルを選択」でファイルを指定するのと同じ） */
  async choose(filePath: string): Promise<void> {
    await this.取込ファイル.setInputFiles(filePath);
  }

  /** 取込ファイルの欄で選ばれているファイルの数 */
  async chosenCount(): Promise<number> {
    return this.取込ファイル.evaluate((e) => (e as HTMLInputElement).files?.length ?? 0);
  }

  /** フォームの中のなりすまし対策トークンを、別の値に変える（開発者ツールで書き換えるのと同じ） */
  async changeToken(value: string): Promise<void> {
    await tamperToken(this.form, value);
  }

  /** フォームの中のなりすまし対策トークンの値 */
  async tokenValue(): Promise<string> {
    await expect(this.トークン, "フォームの中のなりすまし対策トークン").toHaveCount(1);
    return this.トークン.inputValue();
  }

  /**
   * 「CSVファイルをアップロード」ボタンを押す。ブラウザの入力チェックに通らない項目があれば、
   * 送信が止まったこと（要求が出ないこと）を確かめて、止めた項目を返す。通るときは、取込の要求の応答と、移った画面の読み込みを待つ。
   */
  async submit(): Promise<SubmitResult> {
    await expect(this.アップロードボタン, "「CSVファイルをアップロード」ボタン").toHaveText(/^\s*CSVファイルをアップロード\s*$/);
    const blocked = await invalidFields(this.form);
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && IMPORT_REQUEST.test(r.url()));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.アップロードボタン.click()]);
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
}
