/**
 * M05-19 出荷指示リスト検索の画面シード。正本: cases/M05-19_seed_data.tsv
 * 実装したのは、管理者（S-M05-19-ADM）だけを使う 013・016・024。ほかのケースは、使用シードの投入方法にDBでの準備が含まれるので実装しない
 * （記録 e2e/review/M05-19_progress_2026-10-31.md）。
 * 権限は受注管理を操作できる権限（正本は「システム管理者」と定める）。所属は任意の所属、所属店舗は任意の店舗（本店）。
 */
import { Account } from "../lib/session";
import { defineSeed } from "../lib/seeds";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M0519_ADMIN: Account = { loginId: "m0519_admin", password: "Passw0rd!M0519" };

defineSeed("S-M05-19-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-19試験管理者", account: M0519_ADMIN, メール: "m0519_admin@example.test" });
});
