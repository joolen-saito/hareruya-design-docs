/**
 * M13-13 イベント一括登録（メニュー「イベント管理」→「イベント一括登録」。画面の見出しは「イベント一括登録CSVアップロード」）。
 * 正本の「イベント申込一括CSV登録画面」はこの画面。セレクタはここだけに書く。
 */
import fs from "node:fs";
import { Download, Locator, Page, expect } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";

const PATH = "/event/entry/bulk_csv_import";

export class EventBulkCsvPage {
  constructor(readonly page: Page) {}

  /** 「CSVファイル選択」の「ファイルを選択」ボタン（押すとファイルを選ぶ窓が開く） */
  get ファイル選択ボタン(): Locator { return this.page.locator("#file-select"); }
  /** 選んだファイルの名前が出る欄 */
  get 選んだファイル名(): Locator { return this.page.locator("#admin_csv_import_import_file_name"); }
  /** 「CSVファイルのアップロード」ボタン（表示名「一括登録を実行」） */
  get アップロードボタン(): Locator { return this.page.locator("#upload-button"); }
  /** 「雛形ファイルダウンロード」ボタン */
  get 雛形ダウンロードボタン(): Locator { return this.page.locator("#download-button"); }
  get エラーの帯(): Locator { return this.page.locator(".c-primaryCol .alert-danger"); }
  get 成功の帯(): Locator { return this.page.locator(".alert-success"); }

  /** アドレスを直接開く */
  async 開く(): Promise<void> {
    await this.page.goto(adminUrl(PATH));
    await this.読み込みを待つ();
  }

  /** メニューの「イベント管理」を開き、「イベント一括登録」を押す */
  async メニューから開く(): Promise<void> {
    const group = this.page.locator('.c-mainNavArea a.c-mainNavArea__navItemTitle[href="#nav-event"]');
    await expect(group, "メニューの「イベント管理」").toBeVisible();
    if ((await group.getAttribute("aria-expanded")) !== "true") await group.click();
    const link = this.page.locator("#nav-event").getByRole("link", { name: "イベント一括登録", exact: true });
    await expect(link, "メニューの「イベント管理」の下の「イベント一括登録」").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname.endsWith(PATH), { waitUntil: "load" }), link.click()]);
    await this.読み込みを待つ();
  }

  /** 画面の仕掛け（ファイルを選ぶとアップロードボタンが押せるようになる）が動くまで待つ */
  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.ファイル選択ボタン, "イベント一括登録画面の「ファイルを選択」ボタン").toBeVisible();
  }

  /** いま開いているのが、この画面か */
  この画面か(): boolean {
    return new URL(this.page.url()).pathname.endsWith(PATH);
  }

  /** 「雛形ファイルダウンロード」を押して、ダウンロードを受け取る */
  async 雛形をダウンロードする(): Promise<Download> {
    // ダウンロードの代わりに画面（システムエラーなど）が出たときは、60秒待たずにその画面の見出しを添えて止める
    const 画面が出た = this.page
      .waitForResponse((r) => r.url().includes("/event/entry/bulk_csv_template") && (r.headers()["content-type"] || "").includes("text/html"), { timeout: 60_000 })
      .then(async (r) => {
        await this.page.waitForLoadState("load").catch(() => {});
        const 見出し = ((await this.page.locator("h1, h2, h3").first().innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
        throw new Error(`雛形ファイルダウンロードを押すとダウンロードでなく画面が出た（応答 ${r.status()}、見出し「${見出し || "（読めない）"}」）`);
      });
    画面が出た.catch(() => {});
    const [download] = await Promise.all([Promise.race([this.page.waitForEvent("download", { timeout: 60_000 }), 画面が出た]), this.雛形ダウンロードボタン.click()]);
    return download;
  }

  /** 「ファイルを選択」を押し、開いた窓でファイルを選ぶ */
  async ファイルを選ぶ(file: string): Promise<void> {
    if (!fs.existsSync(file)) throw new Error(`選ぶファイルが無い: ${file}`);
    const [chooser] = await Promise.all([this.page.waitForEvent("filechooser"), this.ファイル選択ボタン.click()]);
    await chooser.setFiles(file);
  }

  /** 「CSVファイルのアップロード」を押し、送信の結果の画面が出るまで待つ（取込が長いことがあるので長めに待つ） */
  async アップロードする(): Promise<void> {
    await expect(this.アップロードボタン, "CSVファイルのアップロードボタンが押せる").toBeEnabled();
    await Promise.all([
      this.page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes(PATH), { timeout: 600_000 }),
      this.アップロードボタン.click(),
    ]);
    await this.page.waitForLoadState("load", { timeout: 600_000 });
  }

  /** 赤の帯に出たエラーの文（1件1行） */
  async エラーの文(): Promise<string[]> {
    return (await this.エラーの帯.locator("p").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  async 成功の文(): Promise<string[]> {
    return (await this.成功の帯.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
}

/** メンバー登録画面（メンバー管理の「新規登録」）の「所属店舗」の選択肢。登録済みの店舗の名前を、画面に出る数だけ返す（同名があれば重ねて返す） */
export async function 所属店舗の選択肢(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/setting/system/member"));
  await page.getByRole("link", { name: "新規登録" }).click();
  await page.waitForLoadState("load");
  const sel = page.locator('[name="admin_member[baseInfo]"]');
  await expect(sel, "メンバー登録画面の所属店舗の欄").toBeVisible();
  return (await sel.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
}

/** ダウンロードしたファイルの中身（文字）。UTF-8 で読めなければ Shift_JIS として読む */
export async function ダウンロードした文字(download: Download): Promise<string> {
  const p = await download.path();
  if (!p) throw new Error("ダウンロードしたファイルを読めない");
  return decodeCsvBytes(fs.readFileSync(p));
}

/** 雛形ファイルの1行目（見出しの並び）。カンマ区切りとして読む */
export function 雛形の見出し(text: string): string[] {
  const [head] = parseCsv(text);
  if (!head || head.length < 2) throw new Error(`雛形ファイルの1行目を見出しの並びとして読めない（${JSON.stringify(text.slice(0, 200))}）`);
  return head;
}
