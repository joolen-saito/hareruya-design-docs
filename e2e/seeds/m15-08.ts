/**
 * M15-08 アーキタイプ検索・一覧 のシードの作り方（画面操作）。正本: cases/M15-08_seed_data.tsv
 * 試験管理者はメンバー管理で登録する（権限は「システム管理者」）。保持値なしは、ケースごとの新しいブラウザの状態で成り立つ。
 * 「不存在キーワード」のアーキタイプ（NONE-030）は、手元に無いことを DB で確かめる（あれば止める。消さない）。
 */
import { 名前に含む未削除アーキタイプの数 } from "../db/m15_08_archetype";
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

export const M1508_ADMIN: Account = { loginId: "m1508_admin", password: "Passw0rd!M1508" };

defineSeed("S-M15-08-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M15-08試験管理者", account: M1508_ADMIN, メール: "m1508_admin@example.test" });
});
defineSeed("S-M15-08-SESSION", async () => { /* ケースごとの新しいブラウザの状態で成り立つ */ });
defineSeed("S-M15-08-NONE-030", { needs: ["S-M15-08-ADM"] }, async () => {
  const n = 名前に含む未削除アーキタイプの数("不存在キーワード");
  if (n > 0) throw new Error(`名前に「不存在キーワード」を含む未削除のアーキタイプが ${n} 件ある（消さずに止める。判断待ち）`);
});
