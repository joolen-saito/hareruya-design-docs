/** 受注売上分析 集計一覧のCSVダウンロード（M12-04）の画面の操作。セレクタはここだけに書く。 */
import { Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";

/** 画面のCSVダウンロードのリンクを押し、ダウンロードされたCSVを行と列にして返す。ダウンロードされなければ null */
export async function CSVを取得する(page: Page): Promise<{ rows: string[][]; fileName: string; ファイル数: number } | null> {
  const files: string[] = [];
  const onDownload = (d: { suggestedFilename(): string }) => { files.push(d.suggestedFilename()); };
  page.on("download", onDownload);
  try {
    const download = page.waitForEvent("download", { timeout: 60_000 }).catch(() => null);
    await page.locator('a[href*="/analysis/sales/export"]').first().click({ timeout: 20_000 });
    const d = await download;
    if (!d) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of await d.createReadStream()) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return { rows: parseCsv(decodeCsvBytes(Buffer.concat(chunks))), fileName: d.suggestedFilename(), ファイル数: files.length };
  } finally {
    page.off("download", onDownload);
  }
}
