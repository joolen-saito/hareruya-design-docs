/**
 * M15-10 アーキタイプ登録CSV の画面部品: アーキタイプの登録・削除、CSV取り込み画面、CSVの文面づくり。
 * セレクタはここだけに置く。シード（seeds/m15-10.ts）とテスト（spec/m15/m15-10.spec.ts）が使う。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

export const CSVヘッダ = "アーキタイプ名（日本語）,アーキタイプ名（英語）,代表カード名,色,フォーマット";

const 引用 = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
/** CSVの文面。BOM付き・改行の種類を選べる（既定はBOMなし・LF） */
export function csvの文面(行: string[][], opt: { bom?: boolean; crlf?: boolean; ヘッダ?: string } = {}): Buffer {
  const nl = opt.crlf ? "\r\n" : "\n";
  const text = [opt.ヘッダ ?? CSVヘッダ, ...行.map((r) => r.map(引用).join(","))].join(nl) + nl;
  return Buffer.concat([opt.bom ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(text, "utf-8")]);
}

export type アーキタイプ入力 = { 日: string; 英: string; フォーマット: string; 公開状態?: "公開" | "非公開"; カラー?: string[] };

/** アーキタイプ編集画面（新規）で登録し、振られたIDを返す */
export async function アーキタイプを登録する(page: Page, v: アーキタイプ入力): Promise<string> {
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(v.日);
  await f("nameEn").fill(v.英);
  await chooseByLabel(f("Format"), v.フォーマット);
  await chooseByLabel(f("Disp"), v.公開状態 ?? "非公開");
  for (const c of v.カラー ?? []) await page.locator(".archetype-colors .form-check", { hasText: c }).locator("input[type=checkbox]").check();
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  await expectSaved(page, `アーキタイプ「${v.日}」の登録`);
  const m = /\/archetype\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`アーキタイプを登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** アーキタイプ編集画面の「削除」を押して確認で OK する */
export async function アーキタイプを削除する(page: Page, id: string): Promise<void> {
  await page.goto(adminUrl(`/archetype/${id}/edit`));
  await page.waitForLoadState("load");
  page.once("dialog", (d) => { void d.accept(); });
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#btn_delete").click()]);
  await expectSaved(page, `アーキタイプ ID ${id} の削除`);
}

/** アーキタイプ登録CSVアップロード画面 */
export class アーキタイプCSV取込 {
  constructor(readonly page: Page) {}
  get ファイル選択ボタン() { return this.page.locator("#file-select"); }
  get アップロードボタン() { return this.page.locator("#upload-button"); }
  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/archetype/csv_import"));
    await this.page.waitForLoadState("load");
    await expect(this.ファイル選択ボタン, "アーキタイプ登録CSVアップロード画面").toBeVisible();
  }
  async ファイルを選ぶ(名前: string, 中身: Buffer): Promise<void> {
    await this.page.locator("#admin_csv_import_import_file").setInputFiles({ name: 名前, mimeType: "text/csv", buffer: 中身 });
    await expect(this.page.locator("#admin_csv_import_import_file_name"), "選んだファイル名の表示").toHaveText(名前);
    await expect(this.アップロードボタン, "アップロードボタンが押せる").toBeEnabled();
  }
  /** 「CSVファイルのアップロード」を押す。最初の応答のステータスを返す */
  async アップロードを押す(): Promise<number> {
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/archetype/csv_import"), { timeout: 120_000 });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }).catch(() => null), this.アップロードボタン.click()]);
    const r = await res;
    await this.page.waitForLoadState("load");
    return r.status();
  }
  async 文言(): Promise<string> { return (await this.page.locator(".alert").allInnerTexts()).join(" ").replace(/\s+/g, " "); }
  トークン欄() { return this.page.locator('#upload-form input[name$="[_token]"]'); }
}
