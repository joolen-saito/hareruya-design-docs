/**
 * M14-06 カードセット管理(一覧) / M14-07 カードセット管理(画像ダウンロード) のシードの作り方（画面操作）。
 * カードセット名・略称・セット名(英)は、実行ごとの印を付ける（略称は欄の上限があるので短い印にならない場合は名称側だけに付ける）。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, withAdminSession } from "../lib/session";
import { ensureCardset } from "../pages/admin/product_masters";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1406_ADMIN: Account = { loginId: "m1406_admin", password: "Passw0rd!M1406" };
export const M1407_ADMIN: Account = { loginId: "m1407_admin", password: "Passw0rd!M1407" };

defineSeed("S-M14-06-ADM", async ({ browser }) => { await ensureAnalysisAdmin(browser, { 名前: "M14-06試験管理者", account: M1406_ADMIN, メール: "m1406_admin@example.test" }); });
defineSeed("S-M14-06-SESSION", async () => { /* 新しいブラウザセッションでログインする（ケースがログインから始める） */ });
defineSeed("S-M14-07-ADM", async ({ browser }) => { await ensureAnalysisAdmin(browser, { 名前: "M14-07試験管理者", account: M1407_ADMIN, メール: "m1407_admin@example.test" }); });
defineSeed("S-M14-07-SESSION", async () => { /* 新しいブラウザセッションでログインする（ケースがログインから始める） */ });

/** カードセットを画面で登録する（名称は印つき。リリース日は既定＝今日。特殊セット・シンボル画像は付けない） */
async function セットを作る(browser: import("@playwright/test").Browser, seedId: string, 日: string, 英: string, 略称: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureCardset(page, rc(日), rc(英), 略称, (m) => reportSeedIssue(seedId, m));
  });
}

defineSeed("S-M14-06-LIST-001", async ({ browser, notes, seed }) => {
  const ids: string[] = [];
  for (const [i, [略, 英]] of ([["ALP-001", "Alpha-001"], ["BET-001", "Bravo-001"], ["GAM-001", "Charlie-001"], ["DEL-M1406-001", "Delta-001"]] as const).entries()) {
    ids.push(await セットを作る(browser, seed.シードID, `M1406一覧セット${i + 1}`, 英, 略));
  }
  ["A", "B", "C", "D"].forEach((s, i) => notes.set(`〔カードセットID-M1406-001${s}〕`, ids[i]));
  reportSeedIssue(seed.シードID, "特殊セットフラグ・シンボル画像・リリース日は設定せず、名称・略称だけで登録した（一覧の列を確かめるケースで、その値は確かめない）");
});
defineSeed("S-M14-06-NAV-006", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1406-006〕", await セットを作る(browser, seed.シードID, "遷移確認セット006", "Navigation006", "NAV-006")); });
defineSeed("S-M14-06-NAV-007", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1406-007〕", await セットを作る(browser, seed.シードID, "遷移確認セット007", "Navigation007", "NAV-007")); });
defineSeed("S-M14-06-LIST-030", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1406-030〕", await セットを作る(browser, seed.シードID, "確認ダイアログ用セット030", "Dialog030", "CONFIRM-030")); });
defineSeed("S-M14-07-DIALOG-003", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1407-003〕", await セットを作る(browser, seed.シードID, "M1407セット003", "M1407 Set 003", "M14-07-DIALOG-003")); });
defineSeed("S-M14-07-DIALOG-004", async ({ browser, notes, seed }) => { notes.set("〔カードセットID-M1407-004〕", await セットを作る(browser, seed.シードID, "M1407セット004", "M1407 Set 004", "M14-07-DIALOG-004")); });
