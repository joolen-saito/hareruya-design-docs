/**
 * M06-07 買取商品履歴CSV出力（買取商品履歴(検索結果) の「CSVダウンロード」→「選択した商品履歴取得」）。
 * 画面の部品は pages/admin/m06_05_history.ts の HistoryPage を使い、ここでは「左から何番目」を見るための、見出しつきの生の行の取り出しだけを足す。
 *
 * 画面の作り（アプリのコントローラーで確かめた。OtcBuyOrderHistoryController::exportByChecked）:
 * - 選んだ行が無いときは、上部に「1つ以上の商品を選択してください」を出し、保持しているページ番号の検索結果へ戻す（ファイルは出さない）。
 */
import { Download, expect, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { HistoryPage } from "./m06_05_history";

const OPEN = 30_000;

export type 生のCSV = { 見出し: string[]; 行: string[][] };

/** 「選択した商品履歴取得」を選び、ダウンロードされたCSVを見出しと行（列の並びのまま）で返す。ダウンロードされなければ null */
export async function 選択した履歴のCSVを取る(page: Page, 待ち = 30_000): Promise<生のCSV | null> {
  const h = new HistoryPage(page);
  await h.CSVダウンロードのボタン().click({ timeout: OPEN });
  const item = page.locator("#result_list__custom_csv_menu .dropdown-menu button.export-link", { hasText: "選択した商品履歴取得" });
  await expect(item, "ダウンロードの項目「選択した商品履歴取得」").toBeVisible({ timeout: OPEN });
  const download = page.waitForEvent("download", { timeout: 待ち }).catch(() => null);
  await item.click({ timeout: OPEN });
  const file = await download;
  await page.waitForLoadState("load").catch(() => undefined);
  if (!file) return null;
  return 読む(file);
}

/**
 * 「選択した商品履歴取得」を選び、CSV出力の要求（POST …/otcbuyorder/history/export）が送られたかと、その応答の状態も返す。
 * 選んだ行が無いときに同じ一覧へ戻る作りなので、「戻った」を見るケースは、要求が送られたことを合わせて確かめる。
 */
export async function 選択した履歴のCSVを押して応答も見る(page: Page, 待ち = 30_000): Promise<{ csv: 生のCSV | null; 要求の応答: number | null }> {
  const res = page.waitForResponse((r) => r.request().method() === "POST" && /\/otcbuyorder\/history\/export$/.test(new URL(r.url()).pathname), { timeout: 60_000 }).catch(() => null);
  const csv = await 選択した履歴のCSVを取る(page, 待ち);
  const r = await res;
  return { csv, 要求の応答: r ? r.status() : null };
}

async function 読む(file: Download): Promise<生のCSV> {
  const chunks: Buffer[] = [];
  for await (const c of await file.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const [見出し, ...行] = parseCsv(decodeCsvBytes(Buffer.concat(chunks)));
  return { 見出し: 見出し ?? [], 行 };
}

/** 結果の行のうち、商品コードの行の CSVダウンロード対象にチェックを付ける（行が1つでなければ落ちる） */
export async function 商品コードの行にチェックを付ける(page: Page, 商品コード: string): Promise<void> {
  const h = new HistoryPage(page);
  const rows = (await h.行を読む()).filter((r) => r.商品コード === 商品コード);
  expect(rows.length, `検索結果の商品コード「${商品コード}」の行の数`).toBe(1);
  await h.行にチェックを付ける(rows[0].履歴ID);
}
