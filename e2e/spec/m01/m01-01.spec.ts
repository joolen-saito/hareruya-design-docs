/**
 * M01-01 パスワード認証（管理画面のログイン）の連携ケース（IT-M01-01-001・002）。正本: cases/M01-01_test_cases.tsv
 * 実装したケースと解釈は記録 review/M01-01_progress_2026-11-21_dev.md。
 *
 * 正本の外の補い:
 * - ログインID・名前は、使い回す管理者に付けた決まった印つきの値（シードで1度だけ登録。seeds/m01-01.ts）。
 * - 「ログイン履歴は0件」の前提は、使い回す管理者では2回目の実行から成り立たない（履歴を消す画面も権限も無い）。
 *   そこで、ログインの前に、そのログインIDの最新の履歴の番号を画面で控え（全権限の管理者がログイン履歴画面で読むだけ）、
 *   期待結果の行が「そのあとに増えた行」であることで確かめる。
 * - 手順1の成功は、ホーム画面（ダッシュボード）の表示を待たず、ログインの送信の応答が管理ログイン画面以外への転送であることで確かめる
 *   （ダッシュボードは売上の集計で重く、共有の開発環境では返らないことがある）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { SETUP_ADMIN } from "../../config/env";
import { withAdminSession } from "../../lib/session";
import { ログインを試みる, ログイン履歴を開く, 履歴の行を読む, 最新の履歴の番号を読む, 詳細検索でログインIDを検索する, 履歴の行 } from "../../pages/admin/m01_01_login_history";
import { M0101_L_ADM } from "../../seeds/m01-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 履歴の補い = "使い回す管理者の履歴は2回目の実行から0件でないため、ログインの前に最新の履歴の番号を画面で控え、期待結果の行がそのあとに増えた行であることで確かめた";

/** ログインの前の、このログインIDの最新の履歴の番号（全権限の管理者が画面で読む） */
async function 前の番号(ctx: { browser: import("@playwright/test").Browser }, ログインID: string): Promise<number> {
  return withAdminSession(ctx.browser, SETUP_ADMIN, (p) => 最新の履歴の番号を読む(p, ログインID));
}

caseTest("IT-M01-01-001", async ({ page, browser, step, expected }) => {
  const a = M0101_L_ADM["001"];
  let 前 = 0; let 行: 履歴の行[] = [];
  await step(1, async () => {
    supplement(履歴の補い);
    前 = await 前の番号({ browser }, a.loginId);
    note(`ログインの前の最新の履歴の番号: ${前}`);
    const r = await ログインを試みる(page, a.loginId, a.password);
    note(`ログインの送信後: 転送先 ${r.アドレス || "なし"}`);
    expect(r.ログイン画面に留まった, "ログイン後にホーム画面へ遷移した（管理ログイン画面に留まっていない）").toBe(false);
  });
  await step(2, async () => { await ログイン履歴を開く(page); });
  await step(3, async () => {
    await 詳細検索でログインIDを検索する(page, a.loginId);
    行 = (await 履歴の行を読む(page)).filter((r) => r.ログインID === a.loginId);
  });
  await expected(async () => {
    const 新しい成功 = 行.filter((r) => r.番号 > 前 && r.ステータス.includes("成功"));
    expect.soft(新しい成功.length, `ログインID ${a.loginId} で、ステータスが成功の行が検索結果に表示される（ログインの前の最新番号 ${前}より新しい行）`).toBeGreaterThanOrEqual(1);
  });
});

caseTest("IT-M01-01-002", async ({ page, browser, step, expected }) => {
  const a = M0101_L_ADM["002"];
  let 前 = 0; let 行: 履歴の行[] = [];
  await step(1, async () => {
    supplement(履歴の補い);
    前 = await 前の番号({ browser }, a.loginId);
    note(`ログインの前の最新の履歴の番号: ${前}`);
    const r = await ログインを試みる(page, a.loginId, "Passw0rd!M0101ERR");
    note(`誤ったパスワードでのログインの送信後: ${r.ログイン画面に留まった ? "管理ログイン画面に留まった" : `転送先 ${r.アドレス}`}${r.エラー文 ? `・表示 ${r.エラー文}` : ""}`);
    expect(r.ログイン画面に留まった, "誤ったパスワードでは、ログインが拒否され管理ログイン画面に留まる").toBe(true);
  });
  await step(2, async () => {
    const r = await ログインを試みる(page, a.loginId, a.password);
    note(`正しいパスワードでのログインの送信後: 転送先 ${r.アドレス || "なし"}`);
    expect(r.ログイン画面に留まった, "正しいパスワードでは、ホーム画面へ遷移する（管理ログイン画面に留まっていない）").toBe(false);
  });
  await step(3, async () => { await ログイン履歴を開く(page); });
  await step(4, async () => {
    await 詳細検索でログインIDを検索する(page, a.loginId);
    行 = (await 履歴の行を読む(page)).filter((r) => r.ログインID === a.loginId);
  });
  await expected(async () => {
    const 新しい失敗 = 行.filter((r) => r.番号 > 前 && r.ステータス.includes("失敗"));
    expect.soft(新しい失敗.length, `ログインID ${a.loginId} で、ステータスが失敗の行が検索結果に表示される（ログインの前の最新番号 ${前}より新しい行）`).toBeGreaterThanOrEqual(1);
  });
});
