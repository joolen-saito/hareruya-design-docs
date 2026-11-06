/** M15-06 デッキ登録CSV のシードの作り方（画面操作）。正本: cases/M15-06_seed_data.tsv。試験管理者はメンバー管理で登録する（権限は「システム管理者」）。画面を確かめるだけのシードは、作るものが無い */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M1506_ADMIN: Account = { loginId: "m1506_admin", password: "Passw0rd!M1506" };

defineSeed("S-M15-06-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-06試験管理者", account: M1506_ADMIN, メール: "m1506_admin@example.test" });
});
defineSeed("S-M15-06-SCREEN-048", { needs: ["S-M15-06-ADM"] }, async () => { /* 追加のデータ投入は不要（画面の確認だけ） */ });
