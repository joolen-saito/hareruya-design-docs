/**
 * F06-20 お届け先（配送先）。正本: cases/F06-20_test_cases.tsv
 * 実装するのは 029（シード無し）だけ。ほかは会員・配送先を用意するシードや共有の設定・管理者を要するため実装しない。
 * 記録 review/F06-20_progress_2026-11-04.md
 */
import { caseTest, expect } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";

caseTest("IT-F06-20-029", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const 結果: string[] = [];
  const 開く = async (p: string): Promise<void> => { await l.URLを開く(p); 結果.push(`${p} → ${l.path()}（ログイン画面 ${await l.ログイン画面である()}）`); };
  await step(1, async () => { await 開く("/ja/mypage/delivery"); });
  await step(2, async () => { await 開く("/ja/mypage/delivery/new/edit"); });
  await step(3, async () => { await 開く("/ja/mypage/delivery/new/edit"); });
  await expected(async () => {
    expect.soft(結果.length, "開いた画面の数").toBe(3);
    for (const r of 結果) expect.soft(r.endsWith("（ログイン画面 true）") && r.includes("→ /ja/mypage/login"), `会員ログイン画面へ誘導される: ${r}`).toBe(true);
  });
});
