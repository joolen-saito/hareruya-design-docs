/**
 * F06-06 購入履歴一覧。正本: cases/F06-06_test_cases.tsv
 * 実装しないケース: 007・008（注文を51件作るシード。工数が過大）、019〜022（商品・在庫を作る再購入のシード。020〜022は開発者ツールのNetworkで要求を再送する）。
 * 記録 review/F06-06_progress_2026-11-04.md
 * 注文は手元の環境の共通の注文の部品で作る（支払方法は銀行振込でなく代金引換など。正本の外の補い。seeds/f06-06.ts の冒頭）。
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { HistoryListPage } from "../../pages/front/f06_06_history";
import { LoginPage } from "../../pages/front/f06_03_login";
import { mailOf } from "../../seeds/f06-06";

const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 注文の補い = "シード表は支払方法「銀行振込」で注文すると定めるが、手元の環境の共通の注文の部品は外部の決済画面へ移らない支払方法（代金引換など）で注文する。購入履歴一覧に出る注文番号・件数・並びはこの違いに依らない";

async function ログインして履歴を開く(page: CaseCtx["page"], 前半: string, パスワード: string): Promise<HistoryListPage> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf(前半), パスワード);
  const h = new HistoryListPage(page);
  await h.開く();
  return h;
}

caseTest("IT-F06-06-001", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.URLを開く("/ja/mypage/shopping_history"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});

caseTest("IT-F06-06-003", async ({ page, notes, step, expected }) => {
  supplement(注文の補い);
  const l = new LoginPage(page);
  const h = new HistoryListPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("sort-f0606-003"), "Pw-F0606-003!"); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { 並び = await h.注文番号を上から(); });
  await expected(async () => {
    expect.soft(並び, "注文番号の並び（注文IDの降順）").toEqual([notes.get("〔注文番号-F0606-003C〕"), notes.get("〔注文番号-F0606-003B〕"), notes.get("〔注文番号-F0606-003A〕")]);
  });
});

caseTest("IT-F06-06-004", async ({ page, notes, step, expected }) => {
  supplement(注文の補い);
  const l = new LoginPage(page);
  const h = new HistoryListPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("page11-f0606-004"), "Pw-F0606-004!"); });
  await step(2, async () => { await h.開く(); });
  await expected(async () => {
    const 表示 = await h.件数の表示();
    expect.soft(await h.注文番号を上から(), "1ページ目の注文の数").toHaveLength(10);
    expect.soft(表示, "全件数 11件 の表示").toMatch(/11\s*件/);
    expect.soft(表示, "現在の表示範囲（1件目から10件目まで）の表示").toMatch(/1\s*件目.*10\s*件目|1\s*[〜~-]\s*10\s*件/);
    expect.soft(notes.has("〔注文番号-F0606-004-11〕"), "11件目の注文を控えてある").toBe(true);
  });
});

function 二ページ目(番号: string, 場所: "上" | "下") {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    supplement(注文の補い);
    const l = new LoginPage(page);
    const h = new HistoryListPage(page);
    await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf(`page11-f0606-${番号}`), `Pw-F0606-${番号}!`); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => { await h.ページを押す(場所 === "上" ? h.上のページング : h.下のページング, 2); });
    await expected(async () => {
      expect.soft(await h.現在のページ(), "現在のページ").toBe("2");
      expect.soft(h.path, "購入履歴一覧の画面のまま").toBe("/ja/mypage/shopping_history");
      expect.soft(await h.注文番号を上から(), "2ページ目に11件目の注文が表示される").toContain(notes.get(`〔注文番号-F0606-${番号}-01〕`));
    });
  };
}
caseTest("IT-F06-06-005", 二ページ目("005", "上"));
caseTest("IT-F06-06-006", 二ページ目("006", "下"));

caseTest("IT-F06-06-018", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  const h = new HistoryListPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("none-f0606-018"), "Pw-F0606-018!"); });
  await step(2, async () => { await h.開く(); });
  await expected(async () => {
    expect.soft(h.path, "購入履歴一覧の画面に留まる").toBe("/ja/mypage/shopping_history");
    expect.soft(await h.履歴一覧画面である(), "購入履歴一覧画面が表示される").toBe(true);
    expect.soft(await h.注文の枠.count(), "購入履歴（注文）が表示されない").toBe(0);
  });
});

caseTest("IT-F06-06-023", async ({ page, step, expected }) => {
  supplement(注文の補い);
  const l = new LoginPage(page);
  const h = new HistoryListPage(page);
  await step(1, async () => { await l.ログイン画面を開く(); await l.ログインする(mailOf("sort-f0606-023"), "Pw-F0606-023!"); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { await h.押して遷移する(h.マイページボタン); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（マイページトップ）").toMatch(/^\/ja\/mypage\/?$/);
  });
});
