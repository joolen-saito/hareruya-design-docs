/**
 * F06-06 購入履歴一覧の続き。正本: cases/F06-06_test_cases.tsv
 * 実装するのは、再購入のケース 019〜022（商品2種・在庫・注文を画面で作る）。
 * 実装しないケース: 007・008（注文を51件作るシード。1ケース約2時間）、スマレジ取引・店頭受取・ネット買取などの購入履歴を DB で用意するシード、外部の試験環境を要るもの。
 * 020〜022 の「開発者ツールの Network で要求を取得して再送する」は、再購入を押して送られた要求を読み、注文IDを差し替えて再送する操作で置き換える（同じ結果になる操作）。
 * 既存の spec/f06/f06-06.spec.ts は変えない。記録 review/F06-06_progress_2026-11-09.md
 */
import { APIResponse, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { 取得した要求, RepurchasePage } from "../../pages/front/f06_06_repurchase";
import { LoginPage } from "../../pages/front/f06_03_login";
import { mailOf } from "../../seeds/f06-06-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 置き換えの注記 = "開発者ツールの Network の代わりに、再購入を押して送られた要求を読み、注文IDを差し替えて再送した";

async function ログインして履歴を開く(page: CaseCtx["page"], 前半: string, パスワード: string): Promise<RepurchasePage> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf(前半), パスワード);
  const h = new RepurchasePage(page);
  await h.開く();
  return h;
}

caseTest("IT-F06-06-019", async ({ page, notes, step, expected }) => {
  const l = new LoginPage(page);
  const h = new RepurchasePage(page);
  let 明細: { 文: string; 数量: number }[] = [];
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("repurchase-f0606-019"), "Pw-F0606-019!"); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => {
    const 注文番号 = notes.get("〔注文番号-F0606-019〕");
    await expect(h.再購入(注文番号), `注文番号 ${注文番号} の「この注文内容で再度購入する」`).toHaveCount(1, { timeout: 15_000 });
    await h.再購入を押す(注文番号);
  });
  await step(4, async () => { 明細 = await h.カートの明細(); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（買い物かご）").toMatch(/\/cart\/?$/);
    expect.soft(明細.find((m) => m.文.includes("REP-A-019")), "商品REP-A-019の行").toBeTruthy();
    expect.soft(明細.find((m) => m.文.includes("REP-A-019"))?.数量, "商品REP-A-019の数量").toBe(2);
    expect.soft(明細.find((m) => m.文.includes("REP-B-019"))?.数量, "商品REP-B-019の数量").toBe(1);
  });
});

async function 要求を取得する(h: RepurchasePage, 注文番号: string): Promise<取得した要求> {
  await expect(h.再購入(注文番号), `注文番号 ${注文番号} の「この注文内容で再度購入する」`).toHaveCount(1, { timeout: 15_000 });
  return h.再購入の要求を取得する(注文番号);
}

caseTest("IT-F06-06-020", async ({ page, notes, step, expected }) => {
  const h = new RepurchasePage(page);
  let 要求: 取得した要求 | undefined;
  let 応答: APIResponse | undefined;
  let status = -1;
  await step(1, async () => { const l = new LoginPage(page); await l.ログイン画面を開く(); await l.ログインする(mailOf("repurchase-f0606-020"), "Pw-F0606-020!"); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { 要求 = await 要求を取得する(h, notes.get("〔注文番号-F0606-020〕")); });
  await step(4, async () => { note(置き換えの注記); 応答 = await h.注文IDを差し替えて再送する(要求!, notes.get("〔注文ID-F0606-020〕"), null); });
  await step(5, async () => { status = 応答!.status(); });
  await expected(async () => { expect.soft(status, "注文IDを含まない再購入要求の応答のHTTPステータス").toBe(404); });
});

caseTest("IT-F06-06-021", async ({ page, notes, step, expected }) => {
  const h = new RepurchasePage(page);
  let 要求: 取得した要求 | undefined;
  let 応答: APIResponse | undefined;
  let status = -1;
  await step(1, async () => { const l = new LoginPage(page); await l.ログイン画面を開く(); await l.ログインする(mailOf("repurchase-f0606-021"), "Pw-F0606-021!"); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { 要求 = await 要求を取得する(h, notes.get("〔注文番号-F0606-021〕")); });
  await step(4, async () => { note(置き換えの注記); 応答 = await h.注文IDを差し替えて再送する(要求!, notes.get("〔注文ID-F0606-021〕"), "999999"); });
  await step(5, async () => { status = 応答!.status(); });
  await expected(async () => { expect.soft(status, "ログイン会員の注文として特定できない注文ID 999999 の再購入要求の応答のHTTPステータス").toBe(404); });
});

caseTest("IT-F06-06-022", async ({ page, notes, step, expected }) => {
  const h = new RepurchasePage(page);
  let 要求: 取得した要求 | undefined;
  let 応答: APIResponse | undefined;
  let status = -1;
  await step(1, async () => { const l = new LoginPage(page); await l.ログイン画面を開く(); await l.ログインする(mailOf("repurchase-f0606-022"), "Pw-F0606-022!"); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { 要求 = await 要求を取得する(h, notes.get("〔注文番号-F0606-022A〕")); });
  await step(4, async () => { note(置き換えの注記); 応答 = await h.注文IDを差し替えて再送する(要求!, notes.get("〔注文ID-F0606-022A〕"), notes.get("〔注文ID-F0606-022B〕")); });
  await step(5, async () => { status = 応答!.status(); });
  await expected(async () => { expect.soft(status, "他会員の注文IDの再購入要求の応答のHTTPステータス").toBe(404); });
});
