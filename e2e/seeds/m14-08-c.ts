/**
 * M14-08 カードセット詳細(登録・編集・削除) のシードの作り方（画面操作）その3。正本: cases/M14-08_seed_data.tsv
 * 公開側のECTOPのカードセット選択メニューの確認用。名称・英語名・略称には実行ごとの印を付ける。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { カードセットを登録する } from "../pages/admin/m14_08_cardset";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1408L_ADMIN: Account = { loginId: "m1408l_admin", password: "Passw0rd!M1408L" };
defineSeed("S-M14-08-L-ADM", async ({ browser }) => { await ensureAnalysisAdmin(browser, { 名前: "M14-08連携確認管理者", account: M1408L_ADMIN, メール: "m1408l_admin@example.test" }); });
defineSeed("S-M14-08-L-ENV", async () => { /* 本店の日本語版は公開済み（環境の前提。画面で開けることはケースで確かめる） */ });
defineSeed("S-M14-08-L-NEW-046", async () => { /* 同じ名称のカードセットは0件（印つきの名称で登録する） */ });

defineSeed("S-M14-08-L-DEL-047", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔カードセットID-M1408-047〕", await カードセットを登録する(page, { 名日: rc("LinkDelSet002"), 名英: rc("LinkDelSet002"), 略称: rc("LNKDEL002"), リリース日: "2026-10-01" }, seed.シードID));
  });
});
