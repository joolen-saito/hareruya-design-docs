/**
 * M05-08 スタック用紙印刷。正本: cases/M05-08_test_cases.tsv
 * 実装したのは、管理者だけを使う 010。ほかは使用シードの投入方法にDBでの準備が含まれるので実装しない
 * （記録 e2e/review/M05-08_progress_2026-10-31.md）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OrderListStackPrint } from "../../pages/admin/m05_08_stack_print";
import { M0508_ADMIN } from "../../seeds/m05-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M05-08-010", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0508_ADMIN); // 事前準備: 本店を操作対象にして M05-08試験管理者でログインしている（通信の遮断・応答遅延は設けていない）
  const list = new OrderListStackPrint(page);
  await step(1, async () => { await list.openList(); });
  await step(2, async () => { await list.スタック用紙印刷を押す(); });
  await expected(async () => {
    expect.soft(list.dialogs.length, "エラーのダイアログが表示される（件数）").toBeGreaterThan(0);
    expect.soft(list.いま開いているほかのウィンドウ(), "スタック用紙印刷のウィンドウが開いたままになっていない").toBe(0);
  });
  note(`ダイアログの文: ${list.dialogs.join(" / ") || "なし"}／押したあとに開いたウィンドウの数: ${list.開いたウィンドウ}`);
});
