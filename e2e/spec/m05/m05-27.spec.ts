/**
 * M05-27 店頭注文番号札管理。正本: cases/M05-27_test_cases.tsv
 * 実装したのは、画面だけで準備できる 015・025・026。ほかは使用シードの投入方法に「画面で指定できないためDBへ直接設定する」が
 * 含まれるので実装しない（記録 e2e/review/M05-27_progress_2026-10-31.md）。
 */
import { test } from "@playwright/test";
import { 店頭注文番号札の一覧, 店頭注文番号札の件数 } from "../../db/m05_27";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { WaitingTagPage } from "../../pages/admin/m05_27_waiting_tag";
import { M0527_LIMIT, 編集可能店舗を設定する } from "../../seeds/m05-27";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M05-27-015", async ({ page, browser, notes, step, expected }) => {
  const A = "試験本店M527A015", B = "試験支店M527B015";
  // 事前準備②: 既定の検索店舗を試験本店、編集可能店舗を試験本店と試験支店に設定して、その管理者でログインする
  await 編集可能店舗を設定する(browser, A, [A, B]);
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0527_LIMIT);
  const w = new WaitingTagPage(page);
  const 店舗B = notes.get("〔店舗ID-M0527-015B〕");
  await step(1, async () => { await w.open(); });
  await step(2, async () => { await w.検索店舗を選ぶ(rc(B)); });
  await step(3, async () => {
    const r = await w.登録する("DUPLICATE");
    if (!r.成功の表示) note(`登録の結果に成功の表示が無い。エラー: ${r.エラーの表示.join(" / ") || "なし"}`);
  });
  let 件数 = -1;
  await step(4, async () => { 件数 = 店頭注文番号札の件数(店舗B, "DUPLICATE"); });
  await expected(async () => {
    expect.soft(件数, "試験支店に同じ値「DUPLICATE」が登録されている件数").toBe(2);
  });
});

caseTest("IT-M05-27-025", async ({ page, browser, notes, step, expected, capture }) => {
  const A = "試験本店M0527-025-A";
  await 編集可能店舗を設定する(browser, A, [A]); // 事前準備②: 既定の検索店舗と編集可能店舗を試験本店だけにして、権限外店舗を外す
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0527_LIMIT);
  const w = new WaitingTagPage(page);
  const 店舗C = notes.get("〔店舗ID-M0527-025B〕");
  let 一覧: string[] = [];
  await step(1, async () => {
    await w.open();
    expect.soft(await w.検索店舗の店名(), "検索店舗が試験本店").toBe(rc(A));
    expect.soft(await w.登録ボタン.count(), "登録ボタンが表示されている（件数）").toBeGreaterThan(0);
  });
  await step(2, async () => { await w.検索店舗の選択値を書き換える(店舗C); await capture("検索店舗の選択値を権限外店舗の店舗IDに書き換えた画面"); });
  await step(3, async () => {
    const r = await w.登録する("DENYREG");
    note(`登録を押したあとの表示: 成功=${r.成功の表示}／エラー=${r.エラーの表示.join(" / ") || "なし"}`);
  });
  await step(4, async () => { 一覧 = 店頭注文番号札の一覧(店舗C); });
  await expected(async () => {
    expect.soft(一覧, "権限外店舗の店頭注文番号札が「CHARLIEZ」の1件のまま（「DENYREG」が追加されない）").toEqual(["CHARLIEZ"]);
  });
});

caseTest("IT-M05-27-026", async ({ page, browser, notes, step, expected, capture }) => {
  const A = "試験本店M0527-026-A", C = "試験権限外店舗M0527-026-C";
  await 編集可能店舗を設定する(browser, A, [A]); // 事前準備②
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0527_LIMIT);
  const w = new WaitingTagPage(page);
  const 店舗C = notes.get("〔店舗ID-M0527-026B〕");
  let 一覧: string[] = [];
  await step(1, async () => { await w.open(); });
  await step(2, async () => {
    await w.検索店舗を選ぶ(rc(C));
    expect.soft(await w.一覧の番号札(), "再検索された一覧に「CHARLIEZ」が表示されている").toContain("CHARLIEZ");
    await capture("権限外店舗で再検索した一覧");
  });
  await step(3, async () => {
    if ((await w.登録ボタン.count()) === 0) {
      note("権限外店舗を選ぶと登録ボタンが表示されない。入力欄で Enter を押してフォームを送信した（ボタンは押せない）");
      await page.locator("#waiting_tag_waiting_tag").fill("DENYREG");
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null), page.locator("#waiting_tag_waiting_tag").press("Enter")]);
      await page.waitForLoadState("load");
    } else {
      await w.登録する("DENYREG");
    }
  });
  await step(4, async () => { 一覧 = 店頭注文番号札の一覧(店舗C); });
  await expected(async () => {
    expect.soft(一覧, "権限外店舗の店頭注文番号札が「CHARLIEZ」の1件のまま（「DENYREG」が追加されない）").toEqual(["CHARLIEZ"]);
  });
});
