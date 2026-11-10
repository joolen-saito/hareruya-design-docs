/**
 * E2E が作った試験用メンバーの権限が、シードの求める権限と違っているとき、メンバー編集画面で権限だけを直す（DB は書き換えない）。
 * E2E_FIX_MEMBER_ID に管理者ID、E2E_FIX_MEMBER_NAME_PREFIX に名前の先頭（取り違え防止）、E2E_FIX_MEMBER_AUTHORITY に権限名を与える。
 */
import { expect, test } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { adminUrl, withAdminSession } from "../../lib/session";
import { chooseByLabel, expectSaved } from "../../pages/admin/common";

const id = process.env.E2E_FIX_MEMBER_ID ?? "";
const prefix = process.env.E2E_FIX_MEMBER_NAME_PREFIX ?? "";
const authority = process.env.E2E_FIX_MEMBER_AUTHORITY ?? "";

test("試験用メンバーの権限を直す", async ({ browser }) => {
  if (!id || !prefix || !authority) throw new Error("E2E_FIX_MEMBER_ID・E2E_FIX_MEMBER_NAME_PREFIX・E2E_FIX_MEMBER_AUTHORITY を与える");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl(`/setting/system/member/${id}/edit`));
    const name = await page.locator('[name="admin_member[name]"]').inputValue();
    expect(name.startsWith(prefix), `管理者ID ${id} の名前「${name}」が「${prefix}」で始まらない（取り違え）`).toBe(true);
    await chooseByLabel(page.locator('[name="admin_member[Authority]"]'), authority);
    await page.getByRole("button", { name: "登録", exact: true }).click();
    await expectSaved(page, `メンバー「${name}」の権限の修正`);
    console.log(`直した\t${id}\t${name}\t${authority}`);
  });
});
