/**
 * M12-08 フォーマット売上分析 CSVダウンロード のシード（IT-M12-08-002・003 が使うもの）。正本: cases/M12-08_seed_data.tsv
 * - 試験管理者: メンバー管理で登録（権限はシステム管理者・所属店舗は本店＝店舗ID 1）。
 * - ブラウザセッション: 専用ブラウザプロファイルは、ケースごとの新しいブラウザの状態（検索条件なし・検索未実行）で成り立つ。作るものは無い。
 */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1208_ADMIN: Account = { loginId: "m1208_admin", password: "Passw0rd!M1208" };

defineSeed("S-M12-08-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M12-08試験管理者", account: M1208_ADMIN, メール: "m1208_admin@example.test" });
});
defineSeed("S-M12-08-SESSION-002", async () => { /* ケースごとの新しいブラウザの状態（検索未実行）で成り立つ */ });
defineSeed("S-M12-08-SESSION-003", async () => { /* ケースごとの新しいブラウザの状態（検索条件がセッションに無い）で成り立つ */ });
