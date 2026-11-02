/**
 * M05-26 出荷実績インポート登録の画面シード。正本: cases/M05-26_seed_data.tsv
 * 実装したのは、管理者（S-M05-26-ADM）だけを使う 001。ほかのケースは、使用シードの投入方法にDBでの準備・メールの受信・
 * スマレジ連携の値が含まれるので実装しない（記録 e2e/review/M05-26_progress_2026-10-31.md）。
 * 権限は、受注管理を操作できる「システム管理者」にした（正本は権限の名前を定めない）。所属店舗は店舗ID 1。
 */
import { Account } from "../lib/session";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M0526_ADMIN: Account = { loginId: "m0526_admin", password: "Passw0rd!M0526" };

defineSeed("S-M05-26-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-26試験管理者", account: M0526_ADMIN, メール: "m0526_admin@example.test" });
  reportSeedIssue("S-M05-26-ADM", "権限は、受注管理を操作できる「システム管理者」にした（正本に権限の名前が無い）。所属店舗は店舗ID 1（無ければ先頭の店舗）");
});
