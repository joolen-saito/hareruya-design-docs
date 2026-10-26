/**
 * M03-30 基準価格変更CSV登録・M03-31 セール用価格変更CSV登録の画面（メニュー「商品管理」→「CSV管理」）。
 * どちらも同じ作りの画面（取込ファイルの欄・「CSVファイルをアップロード」ボタン・ファイルフォーマットの表・
 * 「雛形ファイルダウンロード」ボタン・取込履歴の一覧）。
 * - 取込ファイルの欄は必須（ブラウザの入力チェック）。空のまま押すと、ブラウザが送信を止める。
 * - 取込の要求は、成功・失敗とも、それぞれのアップロード画面へ戻す（画面上部に完了・エラー・警告のメッセージ）。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type 価格CSVの画面 = "基準価格変更" | "セール用価格変更";

const SCREENS: Record<価格CSVの画面, { upload: string; importRequest: RegExp; 見出し: string }> = {
  基準価格変更: {
    upload: "/product/product_standard_price_csv_upload",
    importRequest: /\/product\/product_standard_price\/import$/,
    見出し: "基準価格変更CSVアップロード",
  },
  セール用価格変更: {
    upload: "/product/product_price/product_price_csv_upload",
    importRequest: /\/product\/product_price\/import$/,
    見出し: "セール用価格変更CSVアップロード",
  },
};

export const priceCsvUploadUrl = (kind: 価格CSVの画面) => adminUrl(SCREENS[kind].upload);
export const priceCsvUploadPath = (kind: 価格CSVの画面) => new URL(priceCsvUploadUrl(kind)).pathname;
export const 画面の見出し = (kind: 価格CSVの画面) => SCREENS[kind].見出し;

/** 送信ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

export type 取込履歴の行 = { ファイル名: string; アップロード日時: string; 作業者: string };

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

/** 画面上部のメッセージ（成功・エラー・警告）。開発用の設定のときに常に出る帯は除く */
export async function 画面上部のメッセージ(page: Page): Promise<{ 成功: string[]; エラー: string[]; 警告: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.includes("デバッグモードが有効"));
  return {
    成功: await read(page.locator(".alert-success")),
    エラー: await read(page.locator(".alert-danger")),
    警告: await read(page.locator(".alert-warning")),
  };
}

export class PriceCsvUploadPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 雛形ダウンロード: Locator;
  readonly 見出し: Locator;
  readonly 取込履歴の行: Locator;

  constructor(readonly page: Page, readonly kind: 価格CSVの画面) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.雛形ダウンロード = page.locator("#download-template-button");
    this.見出し = page.locator(".c-pageTitle__subTitle");
    this.取込履歴の行 = page.locator("#csv_import_history_table tbody tr");
  }

  /** 画面の読み込み（画面のスクリプトを含む）を待ち、取込ファイルの欄があることを確かめる */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.取込ファイル, `${画面の見出し(this.kind)}画面の取込ファイルの欄`).toHaveCount(1);
  }

  async open(): Promise<void> {
    const res = await this.page.goto(priceCsvUploadUrl(this.kind));
    expect(res?.status() ?? 0, `${画面の見出し(this.kind)}画面の応答`).toBe(200);
    await this.ready();
  }

  /** 取込ファイルの欄でファイルを選ぶ（「ファイルを選択」でファイルを指定するのと同じ） */
  async choose(filePath: string): Promise<void> {
    await this.取込ファイル.setInputFiles(filePath);
    expect(await this.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(1);
  }

  async chosenCount(): Promise<number> {
    return this.取込ファイル.evaluate((e) => (e as HTMLInputElement).files?.length ?? 0);
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
    const re = SCREENS[this.kind].importRequest;
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && re.test(r.url()), { timeout: 600_000 });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 600_000 }), this.アップロードボタン.click()]);
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

  /** 取込履歴の一覧の行（上から順）。該当なしの1行は除く */
  async historyRows(): Promise<取込履歴の行[]> {
    await expect(this.page.locator("#csv_import_history_table"), "取込履歴の一覧").toHaveCount(1);
    return this.取込履歴の行.evaluateAll((trs) => trs
      .filter((tr) => tr.querySelectorAll("td").length >= 3)
      .map((tr) => {
        const td = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").replace(/\s+/g, " ").trim();
        const cells = tr.querySelectorAll("td");
        return { ファイル名: td(1), アップロード日時: td(2), 作業者: (cells[cells.length - 1]?.textContent ?? "").replace(/\s+/g, " ").trim() };
      }));
  }

  /** 取込履歴の件数欄で表示件数を選ぶ（選ぶと画面を開き直す） */
  async showHistoryCount(count: string): Promise<void> {
    const pulldown = this.page.locator("#page_count_pulldown");
    const target = await pulldown.locator("option").evaluateAll((os, c) => os
      .map((o) => (o as HTMLOptionElement))
      .find((o) => (o.textContent ?? "").replace(/\s+/g, "") === `${c}件`)?.value ?? "", count);
    if (!target) throw new Error(`取込履歴の件数欄に「${count}件」が無い`);
    if ((await pulldown.inputValue()) === target) return;
    await Promise.all([this.page.waitForURL((u) => u.searchParams.get("page_count") === count), pulldown.selectOption(target)]);
    await this.ready();
  }
}
