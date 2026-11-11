/**
 * M07-02 古物台帳入力用CSV出力。買取検索一覧（pages/admin/m07_buy.ts の BuyListPage）に、このケース群だけが使う操作と読み取りを足したもの。
 * 「開発者ツール」の操作は、正本の手順どおり画面のスクリプトを実行して行う。
 */
import { Download, expect, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { BuyListPage } from "./m07_buy";

/** 正本の手順にある、開発者ツールのConsoleで実行するスクリプト（そのまま実行する） */
export const 開発者ツールのスクリプト = "const f=document.getElementById('bulk_csv_export');f.action=document.getElementById('csvexport').formAction;f.submit();";

/** 検索条件をクリアした状態（画面を開き直した状態）から、買取番号か注文者名で検索し、結果の件数を確かめる */
export async function 検索して件数を確かめる(l: BuyListPage, 条件: { 買取番号?: string; 注文者名?: string }, 件数: number): Promise<void> {
  await l.open();
  if (条件.買取番号 !== undefined) await l.買取番号を入れる(String(Number(条件.買取番号)));
  if (条件.注文者名 !== undefined) await l.注文者名を入れる(条件.注文者名);
  await l.検索する();
  expect((await l.行()).length, `検索結果の件数（${JSON.stringify(条件)}）`).toBe(件数);
}

/** 検索結果にある買取番号（数字）を、表示の順に */
export async function 結果の番号(l: BuyListPage): Promise<string[]> {
  return (await l.行()).map((r) => r.番号);
}

/** 選択済み（チェックを付けた）行のチェックボックスの値を、開発者ツールで書き換えるのと同じに変える */
export async function チェックの値を変える(l: BuyListPage, 番号: string, 値: string): Promise<void> {
  const box = l.行の(番号).locator('input[type="checkbox"]');
  await expect(box, `買取番号 ${番号} のチェックボックス`).toBeChecked();
  await box.evaluate((el, v) => { (el as HTMLInputElement).value = v; }, 値);
}

/** 開発者ツールのConsoleで、正本のスクリプトを実行する。ダウンロードが起きた数と、出力の送信の応答を返す */
export async function コンソールで送る(page: Page): Promise<{ ダウンロード数: number; 応答: number | null }> {
  let n = 0;
  const on = () => { n++; };
  page.on("download", on);
  try {
    const resp = page.waitForResponse((r) => r.request().method() === "POST" && /\/purchase\/csv_export$/.test(new URL(r.url()).pathname), { timeout: 20_000 }).catch(() => null);
    await page.evaluate(開発者ツールのスクリプト);
    const res = await resp;
    await page.waitForLoadState("load").catch(() => undefined);
    await page.waitForTimeout(3_000);
    return { ダウンロード数: n, 応答: res ? res.status() : null };
  } finally {
    page.off("download", on);
  }
}

export type 読んだCSV = { バイト: Buffer; 文字: string; 先頭がBOM: boolean; 見出し: string[]; 行: Record<string, string>[]; 全行: string[][] };

/** ダウンロードしたCSVを読む（UTF-8でなければ Shift_JIS）。先頭バイトも見る */
export async function CSVを読む(file: Download): Promise<読んだCSV> {
  const path = await file.path();
  const バイト = readFileSync(path);
  const 文字 = decodeCsvBytes(バイト);
  const 全行 = parseCsv(文字);
  const 見出し = 全行[0] ?? [];
  return {
    バイト, 文字, 先頭がBOM: バイト.length >= 3 && バイト[0] === 0xef && バイト[1] === 0xbb && バイト[2] === 0xbf,
    見出し, 全行, 行: 全行.slice(1).map((r) => Object.fromEntries(見出し.map((h, i) => [h, r[i] ?? ""]))),
  };
}

/** CSVの行のうち、受注番号が買取番号の行 */
export function 買取番号の行(csv: 読んだCSV, 番号: string): Record<string, string> | undefined {
  return csv.行.find((r) => r["受注番号"] === String(Number(番号)));
}
