/**
 * M04-03 のメンバー管理の操作（043・051）: ほかのブラウザで、メンバーの編集可能店舗を変える（在庫編集の権限を外す）。セレクタはここだけに書く。
 * 在庫編集の権限は、メンバーの「編集可能店舗」に店舗が入っているかで決まる（在庫一括編集の登録で isEditableShop を確かめる）。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

/** メンバー編集画面で編集可能店舗を店舗IDの組に置き換え、デフォルト検索表示店舗を選んで「登録」を押す */
export async function 編集可能店舗を変える(page: Page, 管理者ID: string, 店舗IDs: string[], 既定の店舗ID: string, what: string): Promise<void> {
  await page.goto(adminUrl(`/setting/system/member/${管理者ID}/edit`));
  await page.waitForLoadState("load");
  const editable = page.locator('[name="admin_member[editableBaseInfos][]"]');
  await expect(editable, `${what}: メンバー編集画面の編集可能店舗`).toBeVisible({ timeout: 60_000 });
  await editable.selectOption(店舗IDs);
  const def = page.locator('[name="admin_member[defaultSearchBaseInfo]"]');
  await expect(def.locator(`option[value="${既定の店舗ID}"]`), `${what}: デフォルト検索表示店舗の選択肢`).toHaveCount(1, { timeout: 30_000 });
  await def.selectOption(既定の店舗ID);
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `${what}: メンバーの保存`);
}
