/**
 * F06-02 本会員登録（アクティベート用URL）。正本: cases/F06-02_test_cases.tsv
 * 実装しないケース: 005・006（スマレジIDを持つ仮会員をDBへ直接設定するシード）。記録 review/F06-02_progress_2026-11-04.md
 * 004は仮会員機能（共有の設定）を有効にするので基盤が1本だけで流し、終わったら元の値へ戻してDBの参照で確かめる。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { ActivatePage } from "../../pages/front/f06_02_activate";
import { 仮会員機能を戻す } from "../../seeds/f06-02";

const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 削除の補い = "シード表は「DBで0件を確認し、存在すれば試験データを削除」と定めるが、DBへは書き込まない決まりのため、DBの参照で0件であることを確かめるだけにした（シードの作り方の中。秘密鍵は書式を確かめる値なので実行の印を付けていない）";

const E1 = "アクセスできません";
const E2 = "完了済みです。";

function 書式エラー(開く: (a: ActivatePage) => Promise<number>) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const a = new ActivatePage(page);
    let status = 0;
    await step(1, async () => { status = await 開く(a); });
    await expected(async () => {
      expect.soft(status, "応答の状態").toBeLessThan(400);
      expect.soft(await a.エラー画面.count(), "エラー画面が表示される").toBe(1);
      expect.soft(await a.見出し(), "秘密鍵書式エラー画面（E-1）の見出し").toBe(E1);
    });
  };
}
caseTest("IT-F06-02-001", 書式エラー((a) => a.open()));
caseTest("IT-F06-02-002", 書式エラー((a) => a.open("F0602_BAD")));

caseTest("IT-F06-02-003", async ({ page, step, expected }) => {
  supplement(削除の補い);
  const a = new ActivatePage(page);
  let status = 0;
  await step(1, async () => { status = await a.open("F0602NOUSER003"); });
  await expected(async () => {
    expect.soft(status, "応答の状態").toBeLessThan(400);
    expect.soft(await a.エラー画面.count(), "エラー画面が表示される").toBe(1);
    expect.soft(await a.見出し(), "ユーザー存在チェックエラー画面（E-2）の見出し").toBe(E2);
  });
});

caseTest("IT-F06-02-004", async ({ page, browser, notes, step, expected }) => {
  try {
    const a = new ActivatePage(page);
    let status = 0;
    await step(1, async () => { status = await a.open(notes.get("〔秘密鍵-F0602-004〕")); });
    await expected(async () => {
      expect.soft(status, "応答の状態").toBeLessThan(400);
      expect.soft(await a.エラー画面.count(), "エラー画面が表示される").toBe(1);
      expect.soft(await a.見出し(), "ユーザー存在チェックエラー画面（E-2）の見出し").toBe(E2);
    });
  } finally {
    expect(await 仮会員機能を戻す(browser), "共有の設定（仮会員機能）を元の値へ戻せた").toBe("");
  }
});

function トップへ(開く: (a: ActivatePage) => Promise<number>, 補い = "") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    if (補い) supplement(補い);
    const a = new ActivatePage(page);
    await step(1, async () => { await 開く(a); });
    await step(2, async () => { await a.トップページへを押す(); });
    await expected(async () => {
      expect.soft(a.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/);
    });
  };
}
caseTest("IT-F06-02-021", トップへ((a) => a.open()));
caseTest("IT-F06-02-022", トップへ((a) => a.open("F0602NOUSER022"), 削除の補い));
