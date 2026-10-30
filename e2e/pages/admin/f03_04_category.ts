/**
 * F03-04 カテゴリ一覧の試験で使う管理画面の操作（カテゴリ登録CSVで作るシードの整え）。
 * カテゴリ登録/編集画面とカテゴリ登録CSV画面の基本の操作は pages/admin/category.ts を使う。
 */
import { expect, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { adminUrl } from "../../lib/session";
import { CategoryCsvRow, CategoryPage, uploadCategoryRows } from "./category";
import { expectSaved } from "./common";

/** 管理画面のキャッシュ管理で「キャッシュ削除」を押し、公開側が開けるようになるのを待つ（カテゴリ表示用キャッシュを削除する） */
export async function キャッシュを削除する(page: Page, what: string, onWarning: (w: string) => void): Promise<void> {
  await page.goto(adminUrl("/content/cache"));
  await page.waitForLoadState("load");
  const button = page.locator("form button[type=submit]").filter({ hasText: /^\s*キャッシュ削除\s*$/ });
  await expect(button, `${what}: キャッシュ管理の「キャッシュ削除」ボタン`).toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  for (const w of await expectSaved(page, `${what}: キャッシュ削除`)) onWarning(w);
  // 応答のあとで削除が走る。公開側（本店TOP）が開けるまで待つ
  const deadline = Date.now() + 180_000;
  let status = 0;
  while (Date.now() < deadline) {
    const res = await page.request.get(`${BASE_URL}/ja`, { timeout: 60_000 }).catch(() => null);
    status = res?.status() ?? 0;
    if (status > 0 && status < 400) return;
    await page.waitForTimeout(2000);
  }
  throw new Error(`${what}: キャッシュ削除のあと、公開側のTOPが開けない（応答 ${status}）`);
}

/** カテゴリ登録CSV画面で行を取り込み（新規登録・更新）、取り込んだあとの最上位の一覧を開く */
export async function 最上位に取り込む(page: Page, rows: CategoryCsvRow[], fileName: string, what: string, onWarning: (w: string) => void): Promise<CategoryPage> {
  await uploadCategoryRows(page, rows, fileName, what, onWarning);
  const category = new CategoryPage(page);
  await category.openTop();
  return category;
}
