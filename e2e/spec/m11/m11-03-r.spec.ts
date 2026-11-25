/**
 * M11-03 権限管理（追加分: 021・022。左ナビの第2・第3階層）。正本: cases/M11-03_test_cases.tsv
 * E2E が足した試験用の権限グループ（拒否URLだけを DB で足したもの。seeds/m11-03-r.ts）で作った管理者でログインして確かめる。
 * 左ナビの「商品管理閲覧」「商品登録・編集」はアプリの左ナビに無い（記録 review/M11-03_progress_2026-11-11_dev.md・034・035 と同じ条件）ので、
 * 拒否で消えたのか元から無いのかは、この結果だけでは分からない。正本のとおり「表示されないこと」を確かめる。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 第1階層を開いて第2階層を読む } from "../../pages/m11_03_r_nav";
import { M1103のアカウント } from "../../seeds/m11-03";
import "../../seeds/m11-03-r";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

function 左ナビに出ない(seedId: string, 階層: "第2階層" | "第3階層", 項目: string): (c: Parameters<Parameters<typeof caseTest>[1]>[0]) => Promise<void> {
  return async ({ page, step, expected }) => {
    let r: Awaited<ReturnType<typeof 第1階層を開いて第2階層を読む>> | null = null;
    await step(1, async () => { await loginAdmin(page, M1103のアカウント(seedId)); });
    await step(2, async () => { r = await 第1階層を開いて第2階層を読む(page, "商品管理"); });
    await step(3, async () => {
      note(`「商品管理」の下の第2階層: ${r!.第2階層.join("、")}・第3階層: ${r!.第3階層.join("、")}。「${項目}」はアプリの左ナビに元から無い項目で、拒否によるのか元から無いのかは、この結果だけでは分からない`);
    });
    await expected(async () => {
      expect.soft(r!.見出しがある, "左ナビに「商品管理」の見出しが表示されている（拒否URLが完全一致なので消えない）").toBe(true);
      const 対象 = 階層 === "第2階層" ? r!.第2階層 : r!.第3階層;
      expect.soft(対象.includes(項目), `拒否URLに完全一致する${階層}「${項目}」が左ナビゲーションに表示されない（表示されている＝true）`).toBe(false);
    });
  };
}
caseTest("IT-M11-03-021", 左ナビに出ない("S-M11-03-NAV-021", "第2階層", "商品管理閲覧"));
caseTest("IT-M11-03-022", 左ナビに出ない("S-M11-03-NAV-022", "第3階層", "商品登録・編集"));
