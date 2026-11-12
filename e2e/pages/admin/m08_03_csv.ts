/**
 * M08-03 会員のCSV出力。セレクタはここにだけ書く。
 * - 会員検索一覧(検索結果)の「CSV出力」チェック（行の左端。見出しのチェックで、いまのページの行を全部選ぶ）→「その他」ではなく「CSVダウンロード」のプルダウン → 「CSVダウンロード」。
 * - CSV出力項目設定（会員）は店舗に1つの共有の設定。書き換える前の「出力する項目」の並びを控えのファイルに残し、ケースが終わるたびに戻す。
 */
import { expect, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const T = 30_000;
const 控え = path.resolve(__dirname, "../../.runs/m0803_csv_original.json");

type 項目 = { value: string; label: string };
const options = (page: Page, id: string): Promise<項目[]> => page.locator(`#${id} option`).evaluateAll((os) => os.map((o) => ({ value: (o as HTMLOptionElement).value, label: (o.textContent ?? "").trim() })));

export async function 設定画面を開く(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  const res = await page.goto(adminUrl("/setting/shop/csv/2"));
  await page.waitForLoadState("load");
  expect(res?.status() ?? 0, "CSV出力項目設定（会員）の応答").toBeLessThan(400);
  await expect(page.locator("#csv-form"), "CSV出力項目設定の画面").toBeVisible({ timeout: T });
}

/** 「CSV出力する項目」「CSV出力しない項目」の今の並び（項目の番号と名前） */
export async function 出力項目を読む(page: Page): Promise<{ 出力: 項目[]; 出力しない: 項目[] }> {
  await 設定画面を開く(page);
  return { 出力: await options(page, "csv-output"), 出力しない: await options(page, "csv-not-output") };
}

/** 「CSV出力する項目」を、項目の番号の並びのとおりにして登録する（いまの出力項目は、いったん全部外す） */
export async function 出力項目を設定する(page: Page, 番号: string[], 何: string): Promise<void> {
  await 設定画面を開く(page);
  const outs = await options(page, "csv-output");
  if (outs.length) {
    await page.locator("#csv-output").selectOption(outs.map((o) => o.value));
    await page.locator("#remove").click();
  }
  for (const v of 番号) {
    await page.locator("#csv-not-output").selectOption(v);
    await page.locator("#add").click();
  }
  const got = (await options(page, "csv-output")).map((o) => o.value);
  if (JSON.stringify(got) !== JSON.stringify(番号)) throw new Error(`${何}: 「CSV出力する項目」の並びが指定と違う（画面: ${got.join(",")}）`);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('#csv-form button[type="submit"]').click()]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${何}: CSV出力項目設定（会員）の登録`);
}

/**
 * 設計書 0207 顧客情報CSV出力項目設定（顧客CSV出力項目設定。1486行以降の対応表）の、識別ID 1〜39 の項目名の並び。
 * 正本の「識別ID 1〜39の全39項目を識別ID順に出力」は、この並びで出力項目を設定することをいう。
 */
const 設計の項目名 = [
  "会員ID", "お名前(姓)", "お名前(名)", "お名前(セイ)", "お名前(メイ)", "登録日", "スマレジID", "メールアドレス", "保有ポイント", "最終購入日",
  "初回購入日", "職業(ID)", "都道府県(名称)", "郵便番号1", "郵便番号2", "性別(名称)", "購入金額", "購入回数", "誕生日", "会員ステータス(名称)",
  "更新日", "会社名", "FAX1", "FAX2", "FAX3", "職業(名称)", "ショップ用メモ欄", "住所1", "住所2", "住所3",
  "TEL1", "TEL2", "TEL3", "本人確認ステータス(ID)", "本人確認ステータス(名称)", "都道府県(ID)", "性別(ID)", "会員ステータス(ID)", "退会区分",
];

/**
 * 全項目を、設計書の識別ID 1〜39 の順（項目名の並び）に出力する設定にする。選択肢は表示名で拾って並べる（内部番号の順ではない）。
 * 同じ表示名の選択肢が複数あるとき（「購入金額」が2つ）は、設定を書き換える前から出力していた（既定で出力する）ほうを使い、なければ内部番号の小さいほうを使う。
 * 書き換える前の並びは控えのファイルに残す（既にあれば残さない）。出力した項目の名前を返す
 */
export async function 全項目を識別ID順に出力する(page: Page): Promise<string[]> {
  const before = await 出力項目を読む(page);
  if (!fs.existsSync(控え)) fs.writeFileSync(控え, JSON.stringify({ 控えた日時: new Date().toISOString(), 出力: before.出力 }));
  const saved = JSON.parse(fs.readFileSync(控え, "utf-8")) as { 出力: 項目[] };
  const wasOutput = new Set(saved.出力.map((o) => o.value));
  const all = [...before.出力, ...before.出力しない].sort((a, b) => Number(a.value) - Number(b.value));
  const picked: 項目[] = [];
  const missing: string[] = [];
  for (const name of 設計の項目名) {
    const hits = all.filter((o) => o.label === name);
    const hit = hits.find((o) => wasOutput.has(o.value)) ?? hits[0];
    if (!hit) missing.push(name); else picked.push(hit);
  }
  if (missing.length) throw new Error(`CSV出力項目設定（会員）の選択肢に、設計書の項目名が無い: ${missing.join("、")}`);
  await 出力項目を設定する(page, picked.map((o) => o.value), "全項目の出力");
  return picked.map((o) => o.label);
}

export function 控えがあるか(): boolean { return fs.existsSync(控え); }

/** 控えた並びへ戻す。戻したあとの出力項目の番号の並びを返す（控えが無ければ null） */
export async function 控えへ戻す(page: Page): Promise<{ 控え: string[]; 戻した後: string[] } | null> {
  if (!fs.existsSync(控え)) return null;
  const saved = JSON.parse(fs.readFileSync(控え, "utf-8")) as { 出力: 項目[] };
  await 出力項目を設定する(page, saved.出力.map((o) => o.value), "出力項目の復元");
  const after = (await options(page, "csv-output")).map((o) => o.value);
  return { 控え: saved.出力.map((o) => o.value), 戻した後: after };
}
export function 控えを捨てる(): void { fs.rmSync(控え, { force: true }); }

// ---- 会員検索一覧からのCSV出力 ----
export class 会員CSVPage {
  constructor(private readonly page: Page) { page.setDefaultTimeout(T); }

  行のチェック(id: string) { return this.page.locator(`#check-${id}`); }
  get 見出しのチェック() { return this.page.locator("#check-all"); }

  async チェックする(ids: string[]): Promise<void> {
    for (const id of ids) {
      await expect(this.行のチェック(id), `検索結果に会員ID ${id} のCSV出力チェックがある`).toHaveCount(1, { timeout: T });
      await this.行のチェック(id).check({ timeout: T });
    }
  }
  async 全部のチェック状態(): Promise<Record<string, boolean>> {
    const out: Record<string, boolean> = {};
    for (const b of await this.page.locator('input[name="ids[]"]').all()) out[(await b.getAttribute("value")) ?? ""] = await b.isChecked();
    return out;
  }

  /** 「CSVダウンロード」のプルダウンから「CSVダウンロード」を選ぶ。ダウンロードされたCSVの行列、またはダウンロードされなかった場合の画面の文を返す */
  async CSVダウンロードを選ぶ(): Promise<{ 行?: string[][]; ファイル名?: string; ダウンロードなし?: { 画面の文: string[] } }> {
    const dlP = this.page.waitForEvent("download", { timeout: 20_000 }).then((d) => d, () => null);
    let ダイアログ: string | null = null;
    const h = (d: import("@playwright/test").Dialog) => { ダイアログ = d.message(); void d.accept(); };
    this.page.on("dialog", h);
    await this.page.locator("button.dropdown-toggle", { hasText: "CSVダウンロード" }).first().click({ timeout: T });
    await this.page.locator("a.target-action", { hasText: "CSVダウンロード" }).click({ timeout: T });
    const dl = await dlP;
    this.page.off("dialog", h);
    if (!dl) {
      await this.page.waitForLoadState("load").catch(() => undefined);
      const 文 = (await this.page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !/デバッグモード/.test(t));
      if (ダイアログ) 文.push(`確認ダイアログ: ${ダイアログ}`);
      return { ダウンロードなし: { 画面の文: 文 } };
    }
    const p = await dl.path();
    const 行 = parseCsv(decodeCsvBytes(fs.readFileSync(p)));
    fs.writeFileSync(path.resolve(__dirname, "../../.runs/m0803_last_csv.txt"), 行.slice(0, 3).map((r) => `${r.length}列: ${r.join(" | ")}`).join("\n"));
    return { ファイル名: dl.suggestedFilename(), 行 };
  }
}
