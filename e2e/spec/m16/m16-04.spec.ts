/** M16-04 MTGマスターデータ編集。正本: cases/M16-04_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { MtgMasterEditPage, マスターデータ管理の選択肢 } from "../../pages/admin/m16_04_master";
import { M1604_ADMIN } from "../../seeds/m16-04";

caseTest("IT-M16-04-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await expected(async () => {
    expect.soft(await m.選ばれている表示名(), "MTGマスターデータ選択の初期値").toBe("カードタイプ");
  });
});

caseTest("IT-M16-04-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await expect(m.選択欄).toBeVisible(); });
  await expected(async () => {
    expect.soft(await m.一覧の領域.count(), "一覧の領域の数").toBe(0);
    expect.soft(await m.登録ボタン.count(), "登録ボタンの数").toBe(0);
  });
});

caseTest("IT-M16-04-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  await step(2, async () => { await m.送信値を書き換える("invalid-master"); });
  await step(3, async () => { await m.選択を押す(); });
  await expected(async () => {
    expect.soft(await m.一覧の領域.count(), "一覧の領域の数").toBe(0);
    expect.soft(await m.登録ボタン.count(), "登録ボタンの数").toBe(0);
  });
});

caseTest("IT-M16-04-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  let 選択肢: string[] = [];
  await step(2, async () => { 選択肢 = await m.選択肢の表示名(); });
  await expected(async () => {
    expect.soft(選択肢.length, "選択肢の数（確かめる前に選択肢が出ている）").toBeGreaterThan(0);
    expect.soft(選択肢.includes("店舗"), "「店舗」が選択肢に含まれる").toBe(false);
    expect.soft(選択肢.includes("場所"), "「場所」が選択肢に含まれる").toBe(false);
  });
});

caseTest("IT-M16-04-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  let 編集側: string[] = [], 管理側: string[] = [];
  await step(1, async () => { await m.open(); 編集側 = await m.選択肢の表示名(); });
  await step(2, async () => { 管理側 = await マスターデータ管理の選択肢(page); });
  await expected(async () => {
    expect.soft(編集側.includes("お問い合わせ件名"), "MTGマスターデータ編集画面の選択肢に「お問い合わせ件名」がある").toBe(true);
    expect.soft(管理側.length, "マスターデータ管理画面の選択肢の数（確かめる前に選択肢が出ている）").toBeGreaterThan(0);
    expect.soft(管理側.includes("お問い合わせ件名"), "マスターデータ管理画面の選択肢に「お問い合わせ件名」がある").toBe(false);
  });
});

caseTest("IT-M16-04-035", async ({ page, step, expected }) => {
  await loginAdmin(page, M1604_ADMIN);
  const m = new MtgMasterEditPage(page);
  await step(1, async () => { await m.open(); });
  // 説明文の中のリンクは、マスターデータを選ぶと出る（一覧の領域の中）。選ばずに出ていなければ、カードタイプを選んで出す
  await step(2, async () => {
    if ((await m.カード名リスト作成リンク.count()) === 0) {
      test.info().annotations.push({ type: "手順の注記", description: "「カード名リスト作成」のリンクは、マスターデータを選ぶ（選択を押す）まで画面に出ない。正本の手順に無い「選択を押す」操作で補った" });
      await m.選択を押す();
    }
    await Promise.all([m.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), m.カード名リスト作成リンク.click({ timeout: 20_000 })]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先の画面（カード一覧）").toMatch(/\/card\/?$/);
  });
});
