/**
 * F06-15 買取履歴詳細。正本: cases/F06-15_test_cases.tsv
 * 実装するのは 001〜004（遷移・404の確認）。ほかは買取の状況・店頭買取・スマレジなどをDBや管理画面で整えるシードを使うため実装しない。
 * 買取の申込みは、グッズ商品CSVで作る商品でなく手元の環境の買取できる商品で行い、管理画面の状況変更はしていない（正本の外の補い）。
 * 記録 review/F06-15_progress_2026-11-04.md
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { 買取依頼の件数 } from "../../db/f06_15";
import { available } from "../../lib/db";
import { LoginPage } from "../../pages/front/f06_03_login";
import { NetDetailPage } from "../../pages/front/f06_15_net_detail";
import { mailOf, PW, 詳細の番号 } from "../../seeds/f06-15";

const supplement = () => test.info().annotations.push({ type: "正本の外の補い", description: "シード表の商品(グッズ商品CSV)・会員の管理画面での登録・買取状況「査定中」への変更の代わりに、画面の会員登録と、手元の環境の買取できる商品の申込みで準備した" });

caseTest("IT-F06-15-001", async ({ page, step, expected }) => {
  supplement();
  const d = new NetDetailPage(page);
  const l = new LoginPage(page);
  await step(1, async () => { await d.開く(詳細の番号.get("〔買取番号-F0615-001〕")); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await d.ログイン画面である(), "会員ログイン画面が表示される（買取履歴詳細は表示されない）").toBe(true);
  });
});

function 開いて404(会員の前半: string, 番号: () => string | undefined, 補足 = "") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    supplement();
    if (補足) test.info().annotations.push({ type: "手順の注記", description: 補足 });
    const d = new NetDetailPage(page);
    const l = new LoginPage(page);
    let status = 0;
    await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf(会員の前半), PW); });
    await step(2, async () => { status = await d.開く(番号()); });
    await expected(async () => {
      expect.soft(status, "応答の状態").toBe(404);
      expect.soft(await d.詳細画面である(), "買取履歴詳細は表示されない").toBe(false);
    });
  };
}
caseTest("IT-F06-15-002", 開いて404("f0615-002-a", () => 詳細の番号.get("〔買取番号-F0615-002〕")));
caseTest("IT-F06-15-003", async ({ page, step, expected }) => {
  supplement();
  if (available) expect(買取依頼の件数("6150039"), "事前: 番号6150039の買取が存在しない").toBe(0);
  const d = new NetDetailPage(page);
  const l = new LoginPage(page);
  let status = 0;
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("f0615-003"), PW); });
  await step(2, async () => { status = await d.開く("6150039"); });
  await expected(async () => { expect.soft(status, "応答の状態").toBe(404); });
});
caseTest("IT-F06-15-004", 開いて404("f0615-004", () => undefined));
