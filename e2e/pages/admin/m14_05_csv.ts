/** M14-05 カード登録CSVアップロード画面の操作（ファイル選択・押下・結果の読み取り）。画面の部品は card_csv.ts を流用する */
import { expect, Page } from "@playwright/test";
import { csvLine } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { downloadCardCsvTemplate } from "./card_csv";

export type CSV行 = Record<string, string>;
export type 送信の結果 = { 送信した: boolean; 成功: string[]; エラー: string[]; 警告: string[]; url: string };

let 雛形キャッシュ: string[] | null = null;
/** 雛形（画面の「テンプレートをダウンロード」）の見出し。1回の起動で1度だけ読む */
export async function 雛形の見出し(page: Page): Promise<string[]> {
  if (!雛形キャッシュ) 雛形キャッシュ = await downloadCardCsvTemplate(page);
  return [...雛形キャッシュ];
}

/** 見出しと行から本文を作る。区切り・改行・先頭のBOMを選べる（既定は , と LF、BOMなし） */
export function CSV本文(見出し: string[], 行: CSV行[], opt: { 区切り?: string; 改行?: string; bom?: boolean; 列数不足の行?: Record<number, number> } = {}): Buffer {
  const sep = opt.区切り ?? ",";
  const nl = opt.改行 ?? "\n";
  const line = (values: string[]) => (sep === "," ? csvLine(values) : values.join(sep));
  const lines = [line(見出し), ...行.map((r, i) => {
    const cells = 見出し.map((h) => r[h] ?? "");
    const keep = opt.列数不足の行?.[i];
    return line(keep === undefined ? cells : cells.slice(0, keep));
  })];
  return Buffer.from(`${opt.bom ? "﻿" : ""}${lines.join(nl)}${nl}`, "utf8");
}

export class CardCsvUploadPage {
  constructor(readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(adminUrl("/card/csv_upload"));
    await expect(this.page.locator("#upload-form"), "カード登録CSVアップロードの入力欄").toBeVisible();
  }

  private async 押す(): Promise<送信の結果> {
    const page = this.page;
    let posted = false;
    const onRequest = (req: import("@playwright/test").Request) => { if (req.method() === "POST" && /\/card\/import/.test(req.url())) posted = true; };
    page.on("request", onRequest);
    try {
      const alert = page.locator(".alert-success, .alert-danger, .alert-warning").filter({ hasNotText: "デバッグモードが有効" }).first();
      await page.locator("#upload-button").click({ timeout: 30_000 });
      await alert.waitFor({ state: "visible", timeout: 60_000 }).catch(() => undefined);
      await page.waitForLoadState("load");
    } finally {
      page.off("request", onRequest);
    }
    const texts = async (sel: string) => (await page.locator(sel).allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !t.includes("デバッグモードが有効"));
    return { 送信した: posted, 成功: await texts(".alert-success"), エラー: await texts(".alert-danger"), 警告: await texts(".alert-warning"), url: page.url() };
  }

  /** ファイルを選ばずに「CSVファイルのアップロード」を押す */
  async 選ばずに押す(): Promise<送信の結果> { return this.押す(); }

  /** ファイルを選んで「CSVファイルのアップロード」を押す */
  async 選んで押す(file: { name: string; buffer: Buffer; mimeType?: string }): Promise<送信の結果> {
    await this.page.locator("#upload-form input[type=file]").setInputFiles({ name: file.name, mimeType: file.mimeType ?? "text/csv", buffer: file.buffer });
    return this.押す();
  }
}
