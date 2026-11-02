/**
 * M05-19 出荷指示リスト検索。正本: cases/M05-19_test_cases.tsv
 * 実装したのは、管理者だけを使う 013・016・024。ほかは使用シードの投入方法にDBでの準備が含まれるので実装しない
 * （記録 e2e/review/M05-19_progress_2026-10-31.md）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { StandbySearchPage } from "../../pages/admin/m05_19_standby_search";
import { M0519_ADMIN } from "../../seeds/m05-19";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M05-19-013", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => {
    const types = await s.出荷指示番号と注文番号と日付を入れる({ 出荷指示番号: "519001", 注文番号: "519101", 登録日: "2026/08/20", 更新日: "2026/08/21" });
    note(`日付の欄の入力の型: ${types[0] || "text"}`);
  });
  await step(3, async () => { await s.注文区分を選ぶ(["通常", "予約"]); });
  await step(4, async () => { await s.検索条件をクリアする(); });
  await expected(async () => {
    const v = await s.欄の値();
    expect.soft(v.出荷指示番号, "出荷指示番号が空になる").toBe("");
    expect.soft(v.注文番号, "注文番号が空になる").toBe("");
    expect.soft(v.登録日From, "登録日(From)が空になる").toBe("");
    expect.soft(v.登録日To, "登録日(To)が空になる").toBe("");
    expect.soft(v.更新日From, "更新日(From)が空になる").toBe("");
    expect.soft(v.更新日To, "更新日(To)が空になる").toBe("");
    expect.soft(v.選択中の注文区分, "注文区分がすべて未選択になる（選択中の件数）").toBe(0);
  });
});

caseTest("IT-M05-19-016", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  let status = 0;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await page.locator('#search_form [name="admin_shipping_standby[standby_id]"]').fill("519001"); });
  await step(3, async () => {
    status = await s.並び順をinvalidにして検索する();
    note("並び順の項目は検索欄に無いので、開発者ツールで検索欄に「並び順(order)」の項目を足し、値を invalid にして送信した（アプリが読む送信項目名）");
  });
  await expected(async () => {
    page.setDefaultTimeout(10_000);
    await page.waitForLoadState("load", { timeout: 30_000 }).catch(() => undefined);
    const r = await s.結果まわりの表示();
    const v = await s.欄の値().catch(() => ({ 出荷指示番号: "（読めない）", 注文番号: "", 登録日From: "", 登録日To: "", 更新日From: "", 更新日To: "", 選択中の注文区分: 0 }));
    expect.soft(status, "検索要求に応答が返り、異常な応答（500番台）でない（0は90秒待っても応答なし）").toBeGreaterThan(0);
    expect.soft(status, "検索要求の応答が異常な応答（500番台）でない").toBeLessThan(500);
    expect.soft(r.エラー表示.length, "エラーが表示される（件数）").toBeGreaterThan(0);
    expect.soft(await s.検索フォームがある(), "検索フォームが表示される（システムエラーの画面ではない）").toBe(true);
    expect.soft(v.出荷指示番号, "検索フォームが空の初期表示になる（出荷指示番号が空）").toBe("");
    expect.soft(r.件数見出し, "検索結果の件数見出しが表示されない").toBe(0);
    expect.soft(r.一覧, "一覧が表示されない").toBe(0);
    expect.soft(r.表示件数, "表示件数が表示されない").toBe(0);
    expect.soft(r.ページング, "ページングが表示されない").toBe(0);
    expect.soft(r.結果なしの案内, "検索結果がない旨の案内が表示されない").toBe(0);
  });
});

caseTest("IT-M05-19-024", async ({ page, step, expected, capture }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  let 初期で表示: boolean | null = null;
  let 押した後で表示: boolean | null = null;
  await step(1, async () => { await s.open(); });
  await step(2, async () => {
    await expect(s.作成条件の見出し, "出荷指示リスト作成条件の見出し").toBeVisible();
    初期で表示 = await s.注文番号の範囲の欄.first().isVisible();
  });
  await step(3, async () => {
    await s.作成条件の見出し.click();
    await page.waitForTimeout(800);
    押した後で表示 = (await s.注文番号の範囲の欄.first().isVisible()) && (await s.注文日の範囲の欄.first().isVisible());
    await capture("見出しを押したあとの作成条件");
  });
  await expected(async () => {
    expect.soft(初期で表示, "初期状態では作成条件が折りたたまれている（入力欄が見えるか）").toBe(false);
    expect.soft(押した後で表示, "見出しを押した後は注文番号の範囲と注文日の範囲の入力欄が表示される").toBe(true);
  });
});
