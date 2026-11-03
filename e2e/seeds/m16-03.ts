/**
 * M16-03 祝日追加・削除 のシード（画面操作）。正本: cases/M16-03_seed_data.tsv
 * 作るシード: S-M16-03-ADM（管理者）だけ。権限は、データ管理を操作できる「システム管理者」にした。
 * ほかのシードは、始めの手順が「手元のDBにある祝日・イベントの日程を削除する」ものか、DB での準備なので作らない（判断待ち）。
 */
import { Account } from "../lib/session";
import { defineSeed } from "../lib/seeds";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M1603_ADMIN: Account = { loginId: "m1603_admin", password: "Passw0rd!M1603" };

defineSeed("S-M16-03-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M16-03試験管理者", account: M1603_ADMIN, メール: "m1603_admin@example.test" });
});
