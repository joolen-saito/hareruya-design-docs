/**
 * M14-10 フォーマット詳細(登録・編集・削除) のシードの作り方（画面操作）。正本: cases/M14-10_seed_data.tsv
 * 作るシード: 試験管理者・参照用基本フォーマット（BASE-READ）。ほかのシードは作らない（このファイルのケースが使わない）。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { findFormat } from "../pages/admin/m14_card";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1410_ADMIN: Account = { loginId: "m1410_admin", password: "Passw0rd!M1410" };

defineSeed("S-M14-10-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M14-10試験管理者", account: M1410_ADMIN, メール: "m1410_admin@example.test" });
});

defineSeed("S-M14-10-BASE-READ", async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    let id = await findFormat(page, "編集前フォーマット");
    if (!id) {
      await page.goto(adminUrl("/format/new"));
      await page.waitForLoadState("load");
      const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
      await f("nameJp").fill("編集前フォーマット");
      await f("nameEn").fill("Before Format");
      await f("code").fill("BEFORE_1");
      await f("rank").fill("50");
      await f("mainMaxCardCount").fill("60");
      await f("mainMinCardCount").fill("40");
      await f("sideMaxCardCount").fill("15");
      await f("sideMinCardCount").fill("0");
      await f("MetaRange").fill("14");
      await f("RuleJp").fill("編集前ルール");
      await f("RuleEn").fill("Before rule");
      await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録)\s*$/ }).first().click();
      await expectSaved(page, "参照用基本フォーマットの登録");
      id = /\/format\/(\d+)\/edit/.exec(page.url())?.[1] ?? null;
      if (!id) throw new Error("参照用基本フォーマットの登録後のアドレスから番号を読めない");
    }
    notes.set("〔フォーマットID-M1410-共有A〕", id);
  });
});

/** 統率の設定を持つフォーマットを登録する（統率使用・統率メイン算入を選び、上限2・下限1）。登録後のフォーマットIDを返す */
async function 統率フォーマットを登録する(page: import("@playwright/test").Page, 名日: string, 名英: string): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(名日);
  await f("nameEn").fill(名英);
  await f("rank").fill("60");
  await f("MetaRange").fill("14");
  await f("useCommandFlg").check();
  await f("commanderInMain").check();
  await f("commandMaxCardCount").fill("2");
  await f("commandMinCardCount").fill("1");
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録)\s*$/ }).first().click();
  await expectSaved(page, `統率フォーマット「${名日}」の登録`);
  const id = /\/format\/(\d+)\/edit/.exec(page.url())?.[1];
  if (!id) throw new Error("統率フォーマットの登録後のアドレスから番号を読めない");
  return id;
}

defineSeed("S-M14-10-COMMANDER-READ", async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const found = await findFormat(page, "統率設定形式");
    notes.set("〔フォーマットID-M1410-共有B〕", found ?? await 統率フォーマットを登録する(page, "統率設定形式", "Commander Format"));
  });
});

defineSeed("S-M14-10-COMMANDER-042", async ({ browser, notes }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔フォーマットID-M1410-042〕", await 統率フォーマットを登録する(page, rc("統率設定形式-042"), "Commander Format 042"));
  });
});
