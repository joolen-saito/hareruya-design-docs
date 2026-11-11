/** F08-03 の確認で使う、管理画面の買取詳細の「操作履歴」欄の項目の読み取り（買取一覧から査定IDのリンクで開いた画面） */
import { expect, Page } from "@playwright/test";

const OPEN = 30_000;

/** 買取詳細の項目（査定番号・査定申込者氏名・会員ID・ステータスなど）の値。空白は1つにそろえる */
export async function 買取詳細の項目(page: Page, 項目名: string): Promise<string> {
  const row = page.locator("#detail_wrap .row").filter({ has: page.locator("strong", { hasText: new RegExp(`^\\s*${項目名}\\s*$`) }) }).first();
  await expect(row, `買取詳細の「${項目名}」の項目`).toBeVisible({ timeout: OPEN });
  return (await row.locator(".col-9").first().innerText({ timeout: OPEN })).replace(/\s+/g, " ").trim();
}
