/**
 * M15-05 デッキ編集 のシードの作り方（画面操作）。正本: cases/M15-05_seed_data.tsv
 * 実装済みのシード: 試験管理者（システム管理者の権限）と、ケースごとの新しいブラウザの状態（作るものは無い）。
 */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M1505_ADMIN: Account = { loginId: "m1505_admin", password: "Passw0rd!M1505" };

defineSeed("S-M15-05-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-05試験管理者", account: M1505_ADMIN, メール: "m1505_admin@example.test" });
});

for (const n of ["001", "002", "003", "004", "014", "019", "020", "021"]) {
  defineSeed(`S-M15-05-SESS-${n}`, async () => { /* ケースごとの新しいブラウザの状態で成り立つ */ });
}
