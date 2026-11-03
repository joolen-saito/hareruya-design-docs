/**
 * M16-04 MTGマスターデータ編集 のシード（画面操作）。正本: cases/M16-04_seed_data.tsv
 * 作るシード: S-M16-04-ADM（管理者）。権限は、データ管理・マスターデータ管理・カード一覧・カードセット管理・デッキ管理を操作できる「システム管理者」にした
 * （正本は「記載した画面の操作権限を付与する」。権限を絞った専用の権限は作らない）。
 * ほかのシード（カードタイプなどの登録・DB での準備・デッキ・連携のシード）は作らない。
 */
import { Account } from "../lib/session";
import { defineSeed } from "../lib/seeds";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M1604_ADMIN: Account = { loginId: "m1604_admin", password: "Passw0rd!M1604" };

defineSeed("S-M16-04-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M16-04試験管理者", account: M1604_ADMIN, メール: "m1604_admin@example.test" });
});
