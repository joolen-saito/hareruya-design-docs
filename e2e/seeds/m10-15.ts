/**
 * M10-15 店舗登録 のシード（IT-M10-15-001・002・077 が使うもの）。正本: cases/M10-15_seed_data.tsv
 * 試験管理者はシステム管理者の権限（店舗の登録・編集ができる）。
 * 作らないシード: BASE 系（ケースごとに店舗を登録し、店名略称「OLD」の重複を避けるため既存店舗の略称を書き換える手順を含む。判断待ち）、DB 系。
 */
import { defineSeed } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1015_ADMIN: Account = { loginId: "m1015_admin", password: "Passw0rd!M1015Admin" };

defineSeed("S-M10-15-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M10-15試験管理者", account: M1015_ADMIN, メール: "m1015_admin@example.test" });
});
// 店舗を選ばずに店舗登録画面を開いた直後の状態（投入不要。ケースが画面を開く）
defineSeed("S-M10-15-GFINIT-077", async () => {});
