/** M15-07 デッキタグ一覧（メニュー）のシードの作り方（画面操作）。正本: cases/M15-07_seed_data.tsv。試験管理者はメンバー管理で登録する（権限は「システム管理者」。ほかの機能と同じ） */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M1507_ADMIN: Account = { loginId: "m1507_admin", password: "Passw0rd!M1507" };

defineSeed("S-M15-07-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-07試験管理者", account: M1507_ADMIN, メール: "m1507_admin@example.test" });
});
