/** M12（分析・集計管理）の試験管理者の作り方。メンバー管理で登録する。権限は、分析・集計管理を操作できる「システム管理者」。所属店舗は本店（店舗ID 1）の店名。 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Account, withAdminSession } from "../lib/session";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { ensureMember } from "../pages/admin/member";

export async function ensureAnalysisAdmin(browser: Browser, v: { 名前: string; account: Account; メール: string }): Promise<void> {
  const shop = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMember(page, {
      名前: v.名前, 所属店舗: shop, ログインID: v.account.loginId, メールアドレス: v.メール,
      パスワード: v.account.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
}
