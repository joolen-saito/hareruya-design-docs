/**
 * M05-26 出荷実績インポート登録。正本: cases/M05-26_test_cases.tsv
 * 実装したのは、管理者だけを使う 001。ほかは使用シードの投入方法にDBでの準備・メールの受信・スマレジ連携の値が含まれるので実装しない
 * （記録 e2e/review/M05-26_progress_2026-10-31.md）。
 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ShippingResultImportPage } from "../../pages/admin/m05_26_import";
import { M0526_ADMIN } from "../../seeds/m05-26";

caseTest("IT-M05-26-001", async ({ page, step, expected, capture }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0526_ADMIN); // 事前準備: 管理者 m0526_admin でログインしている
  const imp = new ShippingResultImportPage(page);
  let 結果 = { 開いた: false, 複数選択: null as boolean | null, 受け付ける形式: null as string | null };
  await step(1, async () => { await imp.open(); });
  await step(2, async () => { 結果 = await imp.ファイルを選択を押す(); await capture("「ファイルを選択」を押した直後の画面"); });
  await expected(async () => {
    expect.soft(結果.開いた, "インポートファイル選択ダイアログが開く").toBe(true);
  });
});
