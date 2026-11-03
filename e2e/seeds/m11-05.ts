/**
 * M11-05 マスタデータ管理 のうち、職業マスタと会員登録画面の連携（IT-M11-05-001・002）が使うシード。正本: cases/M11-05_seed_data.tsv
 * - 試験管理者: メンバー管理で登録（権限はシステム管理者。システム設定と在庫管理を操作できる）。
 * - 共有の環境（L-FENV）: 本店の公開・開店の設定は書き換えず、新しいブラウザの状態で会員登録画面が開けることだけを確かめる（F03-06 と同じ解釈）。
 * - 職業マスタの行: 001 は ID 9101・名称「連携職業001」の行が無い状態、002 は ID 9102・名称「連携職業002」の行がある状態。
 *   名称に実行の印は付けない（ケースが名称そのものを選択肢で確かめるため）。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 会員登録の職業の選択肢, 職業マスタを開く, 職業の行を読む, 行に入れる, 保存する } from "../pages/admin/m11_05_master";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1105_ADMIN: Account = { loginId: "m1105l_admin", password: "Passw0rd!L1105" };

defineSeed("S-M11-05-L-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M11-05連携試験管理者", account: M1105_ADMIN, メール: "m1105l_admin@example.test" });
});

defineSeed("S-M11-05-L-FENV", async ({ browser, seed }) => {
  const ctx = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    const page = await ctx.newPage();
    const opts = await 会員登録の職業の選択肢(page);
    if (opts.length === 0) throw new Error("会員登録画面の職業の選択肢が読めない");
  } finally { await ctx.close(); }
  reportSeedIssue(seed.シードID, "本店の公開・開店の設定は書き換えず、新しいブラウザの状態で会員登録画面が開けることだけを確かめた");
});

/** 指定のIDまたは名称の行を空にして保存する（無ければ何もしない） */
async function 行を空にする(page: import("@playwright/test").Page, id: string, name: string, what: string): Promise<void> {
  await 職業マスタを開く(page);
  const hit = (await 職業の行を読む(page)).filter((r) => r.id === id || r.name === name);
  if (hit.length === 0) return;
  for (const r of hit) await 行に入れる(page, r.index, "", "");
  await 保存する(page, what);
}

defineSeed("S-M11-05-L-JOB-001", { needs: ["S-M11-05-L-ADM"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 行を空にする(page, "9101", "連携職業001", `${seed.シードID}: 残っていた職業の行を空にする`);
  });
});

defineSeed("S-M11-05-L-JOB-002", { needs: ["S-M11-05-L-ADM"] }, async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 職業マスタを開く(page);
    const rows = await 職業の行を読む(page);
    const hit = rows.find((r) => r.id === "9102");
    if (hit) {
      if (hit.name !== "連携職業002") { await 行に入れる(page, hit.index, "9102", "連携職業002"); await 保存する(page, `${seed.シードID}: 名称の書き換え`); }
      return;
    }
    const blank = rows.find((r) => r.id === "" && r.name === "");
    if (!blank) throw new Error("職業マスタに空の入力行が無い");
    await 行に入れる(page, blank.index, "9102", "連携職業002");
    await 保存する(page, `${seed.シードID}: ID 9102の登録`);
  });
});
