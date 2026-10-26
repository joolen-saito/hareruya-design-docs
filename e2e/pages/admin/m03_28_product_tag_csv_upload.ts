/**
 * 商品タグ更新CSVアップロード画面（メニュー「商品管理」→「CSV管理」→「商品タグ更新CSV」）。
 * 設計書の画面名は「商品タグ更新CSV登録」。
 * - 取込ファイルの欄・「CSVファイルをアップロード」ボタン・「雛形ファイルダウンロード」ボタン・取込履歴の一覧（件数欄・ページング）が1つの画面にある。
 * - 取込ファイルの欄は必須で、空のままだとブラウザの入力チェックが送信を止める（売上分析タグ更新CSVアップロード画面と同じ作り）。
 * - 「CSVファイルをアップロード」を押しても確認モーダルは出ない（画面のスクリプトは読み込み中の表示を出すだけ）。
 * - 取込の要求は、成功・失敗とも、この画面へ戻す（画面上部に完了またはエラーのメッセージ）。
 * - 取込履歴の件数とページは、ログイン中のセッションが覚える（件数欄を選ぶと、ページ1と件数を付けたアドレスで開き直す）。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { pathOf } from "./m03_21_shelf_number";

export const productTagCsvUploadUrl = () => adminUrl("/product/product_tag_csv_upload");
export const productTagCsvUploadPath = () => pathOf(productTagCsvUploadUrl());
/** 取込の要求の送り先（アップロードのフォームの送り先） */
const IMPORT_REQUEST = /\/product\/product_tag\/import$/;

/** 送信ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

/** 取込履歴の一覧の行（画面の表示のまま） */
export type HistoryRow = { ファイル名: string; アップロード日時: string; 作業者: string };

/** フォームの中で、ブラウザの入力チェックに通らない項目（項目名と、ブラウザの案内の文） */
async function invalidFields(form: Locator): Promise<string[]> {
  return form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
    .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
    .map((e) => {
      const input = e as HTMLInputElement;
      const label = input.type === "file" ? "取込ファイル" : "（項目名なし）";
      return `${label}: ${input.validationMessage}`;
    }));
}

export class ProductTagCsvUploadPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 雛形ダウンロード: Locator;
  readonly 件数: Locator;
  readonly 履歴の行: Locator;
  readonly 見出し: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.雛形ダウンロード = page.locator("#download-template-button");
    this.件数 = page.locator("#page_count_pulldown");
    // 該当なしの行（1つの欄が3列分）を除いた、3つの欄を持つ行
    this.履歴の行 = page.locator("#csv_import_history_table tbody tr").filter({ has: page.locator("td:nth-child(3)") });
    this.見出し = page.locator(".c-pageTitle__subTitle");
  }

  /** 画面の読み込み（画面のスクリプトを含む）を待ち、取込ファイルの欄があることを確かめる */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.取込ファイル, "商品タグ更新CSVアップロード画面の取込ファイルの欄").toHaveCount(1);
  }

  /** 画面を開く（アドレスに問い合わせの文字列を付けない） */
  async open(): Promise<void> {
    const res = await this.page.goto(productTagCsvUploadUrl());
    expect(res?.status() ?? 0, "商品タグ更新CSVアップロード画面の応答").toBe(200);
    await this.ready();
  }

  /** 件数欄で選ばれている件数（画面の表示「50件」などの数の部分） */
  async selectedCount(): Promise<string> {
    const text = (await this.件数.locator("option:checked").innerText()).trim();
    const m = text.match(/^(\d+)/);
    if (!m) throw new Error(`件数欄の選択の表示を読めない: ${text}`);
    return m[1];
  }

  /** 件数欄で件数を選ぶ（選ぶと画面のスクリプトがページ1と件数を付けたアドレスで開き直す） */
  async chooseCount(count: string): Promise<void> {
    const option = this.件数.locator("option").filter({ hasText: new RegExp(`^\\s*${count}\\s*件\\s*$`) });
    await expect(option, `件数欄の選択肢「${count}件」`).toHaveCount(1);
    const value = await option.getAttribute("value");
    if (!value) throw new Error(`件数欄の選択肢「${count}件」の値が無い`);
    await Promise.all([
      this.page.waitForURL((u) => u.searchParams.get("page_count") === count),
      this.件数.selectOption(value),
    ]);
    await this.ready();
    expect(await this.selectedCount(), "件数欄で選ばれている件数").toBe(count);
  }

  /** 取込履歴の一覧のページングで、ページ番号のリンクを押す */
  async goToPage(n: number): Promise<void> {
    const link = this.page.locator("ul.pagination a").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
    await expect(link.first(), `ページングの「${n}」`).toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.searchParams.get("page_no") === String(n)), link.first().click()]);
    await this.ready();
  }

  /** 取込履歴の一覧に表示された行（上から順） */
  async historyRows(): Promise<HistoryRow[]> {
    return this.履歴の行.evaluateAll((trs) => trs.map((tr) => {
      const td = (n: number) => (tr.querySelector(`td:nth-child(${n})`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { ファイル名: td(1), アップロード日時: td(2), 作業者: td(3) };
    }));
  }

  /**
   * 取込履歴の全件（件数欄で最大の12000件を選んで1ページに出す）。12000件以上あるときは全件を見られないので止める。
   * 件数欄の選択はセッションが覚えるので、ケースのセッションでは使わない（シードの確かめ用）。
   */
  async allHistoryRows(): Promise<HistoryRow[]> {
    await this.open();
    await this.chooseCount("12000");
    const rows = await this.historyRows();
    if (rows.length >= 12000) throw new Error("取込履歴が12000件以上あり、1ページで全件を見られない");
    return rows;
  }

  /** 取込ファイルの欄でファイルを選ぶ（「ファイルを選択」でファイルを指定するのと同じ） */
  async choose(filePath: string): Promise<void> {
    await this.取込ファイル.setInputFiles(filePath);
  }

  /** 取込ファイルの欄で選ばれているファイルの数 */
  async chosenCount(): Promise<number> {
    return this.取込ファイル.evaluate((e) => (e as HTMLInputElement).files?.length ?? 0);
  }

  /**
   * 「CSVファイルをアップロード」ボタンを押す。ブラウザの入力チェックに通らない項目があれば、
   * 送信が止まったこと（要求が出ないこと）を確かめて、止めた項目を返す。通るときは、取込の要求の応答と、移った画面の読み込みを待つ。
   */
  async submit(waitMs = 600_000): Promise<SubmitResult> {
    await expect(this.アップロードボタン, "「CSVファイルをアップロード」ボタン").toHaveText(/^\s*CSVファイルをアップロード\s*$/);
    const blocked = await invalidFields(this.form);
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && IMPORT_REQUEST.test(new URL(r.url()).pathname), { timeout: waitMs });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: waitMs }), this.アップロードボタン.click()]);
    const status = (await response).status();
    await this.page.waitForLoadState("load");
    return { sent: true, status };
  }

  /** 確認モーダル（画面の中のダイアログ）が開いているか */
  async confirmModalVisible(): Promise<boolean> {
    return this.page.locator(".modal.show").isVisible();
  }

  /** 「雛形ファイルダウンロード」ボタンを押し、始まったダウンロードを返す */
  async downloadTemplate(): Promise<Download> {
    await expect(this.雛形ダウンロード, "「雛形ファイルダウンロード」ボタン").toHaveText(/^\s*雛形ファイルダウンロード\s*$/);
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.雛形ダウンロード.click()]);
    return download;
  }
}
