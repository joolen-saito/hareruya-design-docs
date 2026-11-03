/** M12-07 フォーマット売上分析 集計一覧表示 のシード（IT-M12-07-001・002 が使う試験管理者）。正本: cases/M12-07_seed_data.tsv */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1207_ADMIN: Account = { loginId: "m1207_admin", password: "Passw0rd!M1207" };

defineSeed("S-M12-07-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M12-07試験管理者", account: M1207_ADMIN, メール: "m1207_admin@example.test" });
});
