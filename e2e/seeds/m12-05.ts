/**
 * M12-05 入荷通知依頼 一覧表示(検索項目) のシード（IT-M12-05-002・003 が使うもの）。正本: cases/M12-05_seed_data.tsv
 * - 試験管理者: メンバー管理で登録（権限はシステム管理者）。
 * - 共有マスター: 売上分析タグ「タグT1」（並び順10）。一覧にあれば使い、無ければ売上分析タグ画面で登録して、一覧のID欄の番号を控える。
 *   言語（日本語・英語・その他言語）と表示件数10は初期データ。入荷通知依頼 一覧表示(検索項目)画面の選択肢にあることを確かめる。
 */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { SalesAnalysisTagPage } from "../pages/admin/m03_17_sales_analysis_tag";
import { ProductRequestPage } from "../pages/admin/m12_analysis";
import { ensureAnalysisAdmin } from "./m12-common";

export const M1205_ADMIN: Account = { loginId: "m1205_admin", password: "Passw0rd!M1205" };

defineSeed("S-M12-05-ADM", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "M12-05試験管理者", account: M1205_ADMIN, メール: "m1205_admin@example.test" });
});

defineSeed("S-M12-05-MASTER", { needs: ["S-M12-05-ADM"] }, async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const tag = new SalesAnalysisTagPage(page);
    await tag.showFirstPageWith("12000");
    await tag.openNew();
    await tag.showAllRows();
    let rows = tag.rowsByNameAndRank("タグT1", "10");
    if ((await rows.count()) === 0) {
      await tag.register({ 名称: "タグT1", 並び順: "10" }, `${seed.シードID}: 名称「タグT1」・並び順10の登録`);
      await tag.showAllRows();
      rows = tag.rowsByNameAndRank("タグT1", "10");
    }
    const n = await rows.count();
    if (n > 1) reportSeedIssue(seed.シードID, `名称「タグT1」・並び順10の売上分析タグが${n}件ある。一覧の先頭の行のIDを控えた`);
    notes.set("〔売上分析タグID-M1205-共有〕", (await tag.readRow(rows.first())).ID);
  });
  await withAdminSession(browser, M1205_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new ProductRequestPage(page);
    await p.open();
    const langs = (await page.locator('input[name^="admin_analysis_product_request[language]"]').evaluateAll((ns) =>
      ns.map((n) => ((n as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim()))).filter(Boolean);
    for (const want of ["日本語", "英語"]) if (!langs.includes(want)) reportSeedIssue(seed.シードID, `言語の選択肢に「${want}」が無い（ある選択肢: ${langs.join("、")}）`);
    const counts = (await p.表示件数.locator("option").allInnerTexts()).map((t) => t.trim());
    if (!counts.some((t) => /^10(件)?$/.test(t))) reportSeedIssue(seed.シードID, `表示件数の選択肢に10が無い（${counts.join("、")}）`);
    const tags = (await p.売上分析タグ.locator("option").allInnerTexts()).map((t) => t.trim());
    expect(tags.includes("タグT1"), "売上分析タグの選択肢に「タグT1」がある").toBe(true);
  });
});
