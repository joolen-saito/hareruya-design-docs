/**
 * 部門登録CSVアップロード画面（部門登録/編集画面の「CSV入力」で開く画面。画面の小見出しは「部門登録CSVアップロード」）。
 * - 取込ファイルの欄は必須の指定がある。ファイルを選ばずにアップロードボタンを押すと、ブラウザの入力チェックが送信を止める。
 * - アップロードボタンを押すと取込の要求を送り、結果にかかわらずこの画面へ戻る。戻った画面の上部に、成功は緑の帯、誤りは赤の帯で出る。
 * - 部門登録/編集画面の部品（一覧の読み取り・削除・CSV出力）は pages/admin/m03_18_department.ts のものを使う。
 *   そちらのアップロード画面の部品は、送る形式種別が CSV に決め打ちなので、テキスト・タブ区切り・表計算の形式種別で送るここ用の部品を作った。
 */
import { expect, Locator, Page } from "@playwright/test";
import { tamperToken } from "./devtools";
import { departmentCsvUploadPath, departmentCsvUploadUrl } from "./m03_18_department";

/** 画面で選ぶファイル（名前・送るときの形式種別・中身） */
export type 取込ファイル = { name: string; mimeType: string; buffer: Buffer };

/** アップロードボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type UploadResult =
  | { sent: true; status: number; path: string }
  | { sent: false; 止めた項目: string[] };

/** 取込の要求の送り先 */
const IMPORT_PATH = /\/product\/section\/master_import$/;
/** 画面の小見出し（部門登録CSVアップロード画面であることの見分け） */
export const 画面の小見出し = /^\s*部門登録CSVアップロード\s*$/;
export { departmentCsvUploadPath };

/** 画面上部のメッセージ（成功・エラー）。開発用の設定のときに常に出る帯は除く */
export async function topMessages(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.includes("デバッグモードが有効"));
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")) };
}

export class DepartmentCsvImportPage {
  readonly form: Locator;
  readonly ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 小見出し: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#upload-form");
    this.ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.小見出し = page.locator(".c-pageTitle__subTitle");
  }

  /** 画面の読み込みを終え、取込ファイルの欄とアップロードボタンが出るまで待つ */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.ファイル, "部門登録CSVアップロード画面の取込ファイルの欄").toHaveCount(1);
    await expect(this.アップロードボタン, "部門登録CSVアップロード画面のアップロードボタン").toBeVisible();
  }

  /** 画面を開く（表示だけの画面なので、アドレスで開く） */
  async open(): Promise<void> {
    const res = await this.page.goto(departmentCsvUploadUrl());
    expect(res?.status() ?? 0, "部門登録CSVアップロード画面の応答").toBeLessThan(400);
    await this.ready();
  }

  /** いま開いている画面のパス */
  path(): string {
    return new URL(this.page.url()).pathname;
  }

  /** 取込ファイルの欄でファイルを選ぶ */
  async choose(file: 取込ファイル): Promise<void> {
    await this.ファイル.setInputFiles({ name: file.name, mimeType: file.mimeType, buffer: file.buffer });
  }

  /** 開発者ツールで、フォームの中のなりすまし対策トークンの入力要素を消す */
  async removeToken(): Promise<void> {
    await tamperToken(this.form, "なし");
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
    return { sent: true, status: (await response).status(), path: this.path() };
  }

  async messages(): Promise<{ 成功: string[]; エラー: string[] }> {
    return topMessages(this.page);
  }
}

/** 登録完了のメッセージ（アプリの文言） */
export const 登録完了 = "登録が完了しました。";

/**
 * 部門登録CSVアップロード画面を開き、ファイルを選んでアップロードボタンを押し、登録完了のメッセージが表示されることを確かめる
 * （シードの準備用のファイルの取込）。誤りの帯が出たら、その文を添えて落とす。
 */
export async function importAndExpectComplete(page: Page, file: 取込ファイル, what: string): Promise<void> {
  const u = new DepartmentCsvImportPage(page);
  await u.open();
  await u.choose(file);
  const r = await u.pressUpload();
  if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
  if (new URL(page.url()).pathname !== departmentCsvUploadPath()) throw new Error(`${what}: アップロードのあと部門登録CSVアップロード画面へ戻らない（応答 ${r.status}・${page.url()}）`);
  const m = await u.messages();
  if (m.エラー.length || !m.成功.some((t) => t.includes(登録完了))) {
    throw new Error(`${what}: 登録完了のメッセージが表示されない（成功の帯: ${m.成功.join(" / ") || "なし"}、誤りの帯: ${m.エラー.join(" / ") || "なし"}）`);
  }
}
