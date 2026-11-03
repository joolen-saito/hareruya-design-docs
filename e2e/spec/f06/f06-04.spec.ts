/**
 * F06-04 パスワード再発行。正本: cases/F06-04_test_cases.tsv
 * 実装しないケース: リセットキーを画面で指定できずDBへ直接設定するシードを使うもの、メールの受信そのものを確かめる 005・007・010。
 * 記録 review/F06-04_progress_2026-11-04.md
 * 仮会員機能（共有の設定）を有効にして会員を作るシードを使うケースは、書き換えが起きれば元の値へ戻してDBの参照で確かめる。
 */
import { Browser, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { 関連データの件数 } from "../../db/f06_01";
import { リセットの状態 } from "../../db/f06_04";
import { available } from "../../lib/db";
import { mailIds } from "../../lib/mail";
import { ForgotPage } from "../../pages/front/f06_04_forgot";
import { mailOf, 仮会員機能を戻す } from "../../seeds/f06-04";

const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 削除の補い = "事前準備は「会員が存在しない状態にし、存在する場合は削除」と定めるが、DBへは書き込まない決まりのため、メールアドレスの前半に実行の印を付けた新しいメールアドレスを使い、会員が0件であることをDBの参照で確かめた";

const 時刻帯の補い = "有効期限はアプリの時刻（日本時間）の壁時計の値がそのまま保存されており、DBの時刻帯（協定世界時）で実時刻と比べると9時間先になる。発行時刻の24時間後は、保存値と現在の日本時間の壁時計との差で確かめた";
async function 戻す(browser: Browser): Promise<void> {
  expect(await 仮会員機能を戻す(browser), "共有の設定（仮会員機能）を元の値へ戻せた").toBe("");
}

caseTest("IT-F06-04-001", async ({ page, step, expected }) => {
  const f = new ForgotPage(page);
  await step(1, async () => { await f.再発行画面を開く(); });
  await expected(async () => {
    expect.soft(f.path, "パスワード再発行画面のアドレス").toBe("/ja/forgot");
    expect.soft(await f.再発行画面である, "メールアドレス入力画面が表示される").toBe(true);
    expect.soft(await f.次のページへ.isVisible(), "「次のページへ」ボタンが表示される").toBe(true);
  });
});
caseTest("IT-F06-04-002", async ({ page, step, expected }) => {
  const f = new ForgotPage(page);
  await step(1, async () => { await f.再発行画面を開く(); });
  await step(2, async () => { await expect(f.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => { expect.soft(await f.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
});
caseTest("IT-F06-04-003", async ({ page, step, expected }) => {
  const f = new ForgotPage(page);
  await step(1, async () => { await f.再発行画面を開く(); });
  await step(2, async () => { await f.押して遷移する(f.パンくずホーム); });
  await expected(async () => { expect.soft(f.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
});

caseTest("IT-F06-04-004", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-a-004");
    await step(1, async () => { await f.再発行画面を開く(); });
    await step(2, async () => { await f.申し込む(メール); });
    let r: ReturnType<typeof リセットの状態> = null;
    await step(3, async () => { supplement(時刻帯の補い); r = リセットの状態(メール); });
    await expected(async () => {
      expect.soft(r !== null, "会員がDBに1件ある").toBe(true);
      expect.soft(!!r?.リセットキー, "リセットキーが保存されている").toBe(true);
      const 時間 = r?.有効までの時間 ?? NaN;
      expect.soft(Math.round(時間 * 10) / 10, "有効期限までの時間（発行時刻の24時間後なら24時間の手前）").toBeLessThanOrEqual(24.1);
      expect.soft(Math.round(時間 * 10) / 10, "有効期限までの時間（24時間より短くない）").toBeGreaterThanOrEqual(23.9);
    });
  } finally { await 戻す(browser); }
});

function 送信完了へ(前半: string, 補い = "") {
  return async ({ page, browser, step, expected }: CaseCtx): Promise<void> => {
    try {
      if (補い) supplement(補い);
      const f = new ForgotPage(page);
      await step(1, async () => { await f.再発行画面を開く(); });
      await step(2, async () => { await f.申し込む(mailOf(前半)); });
      await expected(async () => {
        expect.soft(f.完了画面か, `パスワード再発行メール送信完了画面へ遷移する（実際 ${f.path}）`).toBe(true);
      });
    } finally { await 戻す(browser); }
  };
}
caseTest("IT-F06-04-006", 送信完了へ("f0604-a-006"));
caseTest("IT-F06-04-011", 送信完了へ("f0604-temp-011"));

caseTest("IT-F06-04-008", async ({ page, step, expected }) => {
  supplement(削除の補い);
  const メール = mailOf("f0604-none");
  if (available) expect(関連データの件数(メール).会員, "事前: このメールアドレスの会員が0件").toBe(0);
  const f = new ForgotPage(page);
  await step(1, async () => { await f.再発行画面を開く(); });
  await step(2, async () => { await f.申し込む(メール); });
  await expected(async () => {
    expect.soft(f.完了画面か, `会員が存在しなくてもメール送信完了画面へ遷移する（実際 ${f.path}）`).toBe(true);
  });
});

caseTest("IT-F06-04-009", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-temp-009");
    await step(1, async () => { await f.再発行画面を開く(); });
    await step(2, async () => { await f.申し込む(メール); });
    let r: ReturnType<typeof リセットの状態> = null;
    await step(3, async () => { r = リセットの状態(メール); });
    await expected(async () => {
      expect.soft(r !== null, "仮会員がDBに1件ある").toBe(true);
      expect.soft(r?.リセットキー ?? null, "リセットキー（発行されていない）").toBeNull();
    });
  } finally { await 戻す(browser); }
});

// ---- 送信完了画面の部品 ----
async function 送信完了まで(f: ForgotPage, 前半: string): Promise<void> {
  await f.再発行画面を開く();
  await f.申し込む(mailOf(前半));
}
caseTest("IT-F06-04-014", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    await step(1, async () => { await 送信完了まで(f, "f0604-a-014"); });
    await step(2, async () => { await expect(f.パンくず現在地, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: 30_000 }); });
    await expected(async () => { expect.soft(await f.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false); });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-04-015", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    await step(1, async () => { await 送信完了まで(f, "f0604-a-015"); });
    await step(2, async () => { await f.押して遷移する(f.パンくずホーム); });
    await expected(async () => { expect.soft(f.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-04-016", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    await step(1, async () => { await 送信完了まで(f, "f0604-a-016"); });
    await step(2, async () => { await expect(f.ホームへ戻る, "「ホームへ戻る」ボタン").toBeVisible({ timeout: 30_000 }); await f.押して遷移する(f.ホームへ戻る); });
    await expected(async () => { expect.soft(f.path, "遷移した画面（ECTOP）").toMatch(/^\/(ja\/?)?$/); });
  } finally { await 戻す(browser); }
});

// ---- メールのURL ----
caseTest("IT-F06-04-017", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-a-017");
    let before = new Set<number>();
    let url = "";
    await step(1, async () => { await f.再発行画面を開く(); before = await mailIds(); await f.申し込む(メール); });
    await step(2, async () => { url = await f.メールのURL(メール, before); });
    await step(3, async () => { await f.URLを開く(url); });
    await expected(async () => {
      expect.soft(f.path, "パスワード再設定画面のアドレス").toMatch(/^\/ja\/forgot\/reset\//);
      expect.soft(await f.再設定画面である, "パスワード再設定画面（パスワード入力欄）が表示される").toBe(true);
    });
  } finally { await 戻す(browser); }
});

caseTest("IT-F06-04-061", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-a-061");
    let before = new Set<number>();
    const urls: string[] = [];
    await step(1, async () => { await f.再発行画面を開く(); });
    await step(2, async () => { before = await mailIds(); await f.申し込む(メール); });
    await step(3, async () => { urls.push(await f.メールのURL(メール, before)); });
    await step(4, async () => { await f.再発行画面を開く(); before = await mailIds(); await f.申し込む(メール); });
    await step(5, async () => { urls.push(await f.メールのURL(メール, before)); });
    await step(6, async () => { await f.URLを開く(urls[0]); });
    await expected(async () => {
      expect.soft(urls[0] !== urls[1], "1回目と2回目のURLが異なる").toBe(true);
      expect.soft(await f.エラー画面.count(), "エラー画面が表示される").toBe(1);
      expect.soft(await f.エラーの見出し(), "ユーザー存在チェックエラー画面（E-2）の見出し").toBe("アクセスできません");
      expect.soft(await f.エラーの文(), "ユーザー存在チェックエラー画面（E-2）の文言（設計書の表示メッセージ）").toBe("有効期限が切れているか、無効なURLです。");
    });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-04-062", async ({ page, browser, step, expected }) => {
  try {
    const f = new ForgotPage(page);
    const メール = mailOf("f0604-a-062");
    let before = new Set<number>();
    const urls: string[] = [];
    await step(1, async () => { await f.再発行画面を開く(); });
    await step(2, async () => { before = await mailIds(); await f.申し込む(メール); });
    await step(3, async () => { urls.push(await f.メールのURL(メール, before)); });
    await step(4, async () => { await f.再発行画面を開く(); before = await mailIds(); await f.申し込む(メール); });
    await step(5, async () => { urls.push(await f.メールのURL(メール, before)); });
    await step(6, async () => { await f.URLを開く(urls[1]); });
    await expected(async () => {
      expect.soft(urls[0] !== urls[1], "1回目と2回目のURLが異なる").toBe(true);
      expect.soft(await f.再設定画面である, "パスワード再設定画面（パスワード入力欄）が表示される").toBe(true);
    });
  } finally { await 戻す(browser); }
});
