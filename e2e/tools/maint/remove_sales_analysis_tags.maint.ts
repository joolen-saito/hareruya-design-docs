/**
 * 前回の実行で残った売上分析タグを、管理画面の売上分析タグ登録/編集画面から削除する（依頼者決定 2026-10-27。DB は書き換えない）。
 * 消すのは、一覧の名称がちょうどその名称の行だけ（全件を1ページに出して探す）。
 * 共有の環境では流さない。
 */
import { test } from "@playwright/test";
import { SETUP_ADMIN, SHARED_ENV } from "../../config/env";
import { withAdminSession } from "../../lib/session";
import { SalesAnalysisTagPage } from "../../pages/admin/m03_17_sales_analysis_tag";

const names = (process.env.E2E_REMOVE_SALES_TAG_NAMES ?? "").split(",").map((s) => s.trim()).filter(Boolean);

test("残った売上分析タグを画面から消す", async ({ browser }) => {
  if (SHARED_ENV) throw new Error("共有の環境では残りの売上分析タグを消さない");
  if (!names.length) throw new Error("E2E_REMOVE_SALES_TAG_NAMES に名称を , 区切りで与える");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const tags = new SalesAnalysisTagPage(page);
    for (const name of names) {
      const removed: string[] = [];
      for (let i = 0; i < 20; i++) {
        await tags.openNew();
        await tags.showAllRows();
        const rows = tags.rowsByName(name);
        if ((await rows.count()) === 0) break;
        const row = rows.first();
        const { ID, 並び順 } = await tags.readRow(row);
        await tags.deleteRow(tags.rowById(ID), `売上分析タグ「${name}」（ID ${ID}）の削除`);
        removed.push(`${ID}（並び順${並び順}）`);
      }
      console.log(`消した\t${name}\t${removed.length ? removed.join(" ") : "（残っていなかった）"}`);
    }
  });
});
