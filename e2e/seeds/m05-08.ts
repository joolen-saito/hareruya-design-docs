/**
 * M05-08 スタック用紙印刷の画面シード。正本: cases/M05-08_seed_data.tsv
 * 実装したのは、管理者（S-M05-08-ADM）だけを使う 010。ほかのケースは、使用シードの投入方法にDBでの準備が含まれるので実装しない
 * （記録 e2e/review/M05-08_progress_2026-10-31.md）。
 * 正本のメンバーID 5080は画面で指定できない。権限は受注管理を操作できる「システム管理者」、所属店舗・操作対象店舗は本店（店舗ID 1）にした。
 */
import { Account } from "../lib/session";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M0508_ADMIN: Account = { loginId: "m0508_admin", password: "Passw0rd!M0508" };

defineSeed("S-M05-08-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-08試験管理者", account: M0508_ADMIN, メール: "m0508_admin@example.test" });
  reportSeedIssue("S-M05-08-ADM", "正本のメンバーID 5080は画面で指定できないので、画面が振る番号のメンバーを使った。権限は「システム管理者」、所属店舗・操作対象店舗は本店（店舗ID 1）");
});
