/**
 * M13-09 CSVダウンロード（イベント申込一覧の「CSVダウンロード」）の画面操作。セレクタはここだけに書く。
 * イベント申込一覧の検索の部品は pages/admin/m13_06_entry_list.ts をそのまま使う。
 */
import { Download, expect, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";

export type 取得したCSV = { ファイル名: string; 行: string[][] };

async function 中身(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return decodeCsvBytes(Buffer.concat(chunks));
}

/** イベント申込一覧（検索結果）の「CSVダウンロード」の一覧を開き、その中の「CSVダウンロード」を選んでダウンロードしたCSVを返す */
export async function CSVダウンロードを選ぶ(page: Page): Promise<取得したCSV> {
  const menu = page.locator("#result_list_main__csv_menu");
  await menu.locator("#entryCsvDownloadDropDown").click({ timeout: 30_000 });
  const item = menu.locator(".dropdown-menu").getByRole("link", { name: "CSVダウンロード", exact: true });
  await expect(item, "「CSVダウンロード」の一覧の「CSVダウンロード」").toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), item.click()]);
  return { ファイル名: download.suggestedFilename(), 行: parseCsv(await 中身(download)) };
}

/** 画面上部の利用者のメニューを開き、「ログアウト」を押してログイン画面に移るまで待つ */
export async function ログアウトする(page: Page): Promise<void> {
  await page.locator(".c-headerBar__userMenu").click();
  const link = page.locator(".popover").getByRole("link", { name: "ログアウト", exact: true });
  await expect(link, "利用者のメニューの「ログアウト」").toBeVisible();
  await Promise.all([page.waitForURL(/\/login/, { waitUntil: "load", timeout: 60_000 }), link.click()]);
}

export const CSVダウンロードのパス = "/event/entry/csv";

/**
 * アドレス欄にCSVダウンロードのアドレスを入れて開き、そのあと数秒のうちにダウンロードされたファイルの名前を返す。
 * 開いた画面のアドレスも返す（ログイン画面へ移ったかなど）。
 */
export async function アドレスで開いてダウンロードを見る(page: Page, 待つミリ秒 = 5_000): Promise<{ ファイル名: string[]; 開いた画面: string }> {
  const names: string[] = [];
  const on = (d: Download) => { names.push(d.suggestedFilename()); };
  page.on("download", on);
  try {
    await page.goto(adminUrl(CSVダウンロードのパス), { waitUntil: "load" }).catch((e: Error) => {
      // ダウンロードが始まると、画面の移動は「ダウンロードが始まった」で終わる。ほかの失敗は投げる
      if (!/Download is starting/i.test(e.message)) throw e;
    });
    await page.waitForTimeout(待つミリ秒);
  } finally {
    page.off("download", on);
  }
  return { ファイル名: names, 開いた画面: page.url() };
}

/** CSV出力項目設定で、CSV種別を選んで「出力する項目」の並びを読む（変えない） */
export async function 出力する項目を読む(page: Page, CSV種別: string): Promise<string[]> {
  await page.goto(adminUrl("/setting/shop/csv"));
  await page.waitForLoadState("load");
  const type = page.locator("#csv-type");
  await expect(type, "CSV出力項目設定のCSV種別").toBeVisible({ timeout: 30_000 });
  const now = await type.evaluate((n) => ((n as HTMLSelectElement).selectedOptions[0]?.textContent ?? "").trim());
  if (now !== CSV種別) {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), type.selectOption({ label: CSV種別 })]);
  }
  return (await page.locator("#csv-output option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
}
