/** M08（会員管理）のシードが共通で使う管理者の用意。メンバー管理の画面で登録し、権限は会員管理などを操作できる「システム管理者」にする（シード表に権限の指定は無い）。 */
import { Browser } from "@playwright/test";
import { Account } from "../../lib/session";
import { ensureM05Admin } from "./m05_admin_member";

export async function ensureM08Admin(browser: Browser, 名前: string, account: Account): Promise<void> {
  await ensureM05Admin(browser, { 名前, account, メール: `${account.loginId.replace(/_/g, "-")}@example.test` });
}
