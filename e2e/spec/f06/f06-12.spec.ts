/**
 * F06-12 ネット買取の一括買取確認。正本: cases/F06-12_test_cases.tsv
 * 実装するのは 006・007（買取依頼を使わない）。ほかはネット買取の依頼をDBで用意するシードを使うため実装しない。
 * 「開発者ツールのNetworkでHTTPステータスを確認する」は、ページを開いたときの応答の状態を読むことで行った（開発者ツールそのものは使わない）。
 * 記録 review/F06-12_progress_2026-11-04.md
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import { NetBulkPage } from "../../pages/front/f06_12_net_bulk";
import { mailOf } from "../../seeds/f06-12";

function ステータス404(番号: string, path: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    test.info().annotations.push({ type: "手順の注記", description: "開発者ツールのNetworkの代わりに、ページを開いたときの応答の状態を読んだ" });
    const l = new LoginPage(page);
    await l.ログイン画面を開く();
    await l.ログインする(mailOf(`f0612_member-${番号}`), `F0612Case${番号}Pwd!`);
    const n = new NetBulkPage(page);
    let status = 0;
    await step(1, async () => { status = await n.開く(path); });
    await step(2, async () => { /* 応答の状態は手順1で開いたときの値を読む */ expect(status, "応答の状態を取得できた").toBeGreaterThan(0); });
    await expected(async () => { expect.soft(status, "HTTPステータス").toBe(404); });
  };
}
caseTest("IT-F06-12-006", ステータス404("006", "/mypage/purchase_history/net/bulk"));
caseTest("IT-F06-12-007", ステータス404("007", "/mypage/purchase_history/net/999999/bulk"));
