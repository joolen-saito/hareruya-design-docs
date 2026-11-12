/**
 * M10-16 追加システム設定 のシード（IT-M10-16-002 が使うもの）。正本: cases/M10-16_seed_data.tsv
 * - 試験管理者A（S-M10-16-ADM-A）: メンバー管理で登録（権限はシステム管理者。追加システム設定を操作できる）。
 *   管理者識別子（M1016-A）は画面で指定できないためDBでの準備にあたり、作らない（IT-M10-16-002 は確かめない）。
 * 作らないシード: BASE・LEGACY・DEFAULT-MISSING・MISSING-KEY など追加システム設定の設定行を揃えるもの
 *   （全店共通の設定を書き換えるので判断待ち）。
 */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1016_ADMIN_A: Account = { loginId: "m1016_admin_a", password: "M1016ReadOnly!" };

defineSeed("S-M10-16-ADM-A", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-16共通試験管理者A", account: M1016_ADMIN_A, メール: "m1016_admin_a@example.test" });
});
