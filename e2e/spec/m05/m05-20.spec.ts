/**
 * M05-20 出荷指示リスト編集。正本: cases/M05-20_test_cases.tsv
 * このファイル: 006・013・014・025・033（最初に実装した5件）。続きは m05-20-b.spec.ts（019 だけ実装しない。理由はそのファイルの先頭）。
 * 記録 e2e/review/M05-20_progress_*.md
 */
import { test } from "@playwright/test";
import { 出荷指示リストの件数 } from "../../db/m05_20";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { StandbyDetailPage } from "../../pages/admin/m05_20_standby";
import { M0520_ADMIN } from "../../seeds/m05-20";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M05-20-006", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0520_ADMIN);
  const d = new StandbyDetailPage(page);
  let 開けた = 0, 見つからない = 0;
  let 詳細を表示: number = -1;
  await step(1, async () => { 開けた = await d.open(notes.get("〔出荷指示リストID-M0520-006〕")); });
  await step(2, async () => {
    見つからない = await d.open("999999");
    詳細を表示 = await d.出荷指示番号の表示.count();
  });
  await expected(async () => {
    expect.soft(開けた, "登録済みの出荷指示リストの詳細画面は開ける（応答）").toBeLessThan(400);
    expect.soft(詳細を表示, "出荷指示リストID 999999の詳細画面が表示されない（詳細の表示の件数）").toBe(0);
    expect.soft(見つからない, "見つからない旨の応答（404）が返る").toBe(404);
  });
});

caseTest("IT-M05-20-013", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0520_ADMIN);
  const d = new StandbyDetailPage(page);
  let r = { 応答: 0, 画面の文: "" };
  await step(1, async () => { await d.open(notes.get("〔出荷指示リストID-M0520-013〕")); });
  await step(2, async () => { await d.登録フォームの送信先IDを書き換える("999999"); });
  await step(3, async () => { r = await d.登録を押す(); });
  await expected(async () => {
    expect.soft(r.応答, "見つからない旨の応答（404）が表示される").toBe(404);
  });
  note(`登録を押したあとの画面の文: ${r.画面の文}`);
});

caseTest("IT-M05-20-014", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0520_ADMIN);
  const d = new StandbyDetailPage(page);
  let 件数 = -1;
  await step(1, async () => { await d.open(notes.get("〔出荷指示リストID-M0520-014〕")); });
  await step(2, async () => { await d.備考欄.fill("未登録ID更新"); });
  await step(3, async () => { await d.登録フォームの送信先IDを書き換える("999999"); });
  await step(4, async () => { await d.登録を押す(); });
  await step(5, async () => { 件数 = 出荷指示リストの件数("999999"); });
  await expected(async () => {
    expect.soft(件数, "出荷指示リストID 999999が作成されない（登録されている件数）").toBe(0);
  });
});

caseTest("IT-M05-20-025", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0520_ADMIN);
  const d = new StandbyDetailPage(page);
  let 確認 = { 確認の文: null as string | null };
  let r = { 応答: null as number | null };
  await step(1, async () => { await d.open(notes.get("〔出荷指示リストID-M0520-025〕")); });
  await step(2, async () => { await d.削除要求の送信先IDを書き換える("999999"); });
  await step(3, async () => { 確認 = await d.リスト削除を押す(); });
  await step(4, async () => { r = await d.確認ダイアログでOKを押す(); });
  await expected(async () => {
    expect.soft(確認.確認の文 !== null, "削除の確認ダイアログが表示される").toBe(true);
    expect.soft(r.応答, "見つからない旨の応答（404）が表示される").toBe(404);
  });
});

caseTest("IT-M05-20-033", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0520_ADMIN);
  // タブB: 同じ管理者のログイン状態を持つ、もう1つのタブ
  const pageB = await page.context().newPage();
  const A = new StandbyDetailPage(page);
  const B = new StandbyDetailPage(pageB);
  const id = notes.get("〔出荷指示リストID-M0520-033〕");
  let aOk = { 応答: null as number | null };
  let bOk = { 応答: null as number | null };
  let bText = "";
  await step(1, async () => { await A.open(id); await B.open(id); });
  await step(2, async () => { await A.リスト削除を押す(); });
  await step(3, async () => {
    aOk = await A.確認ダイアログでOKを押す();
    expect.soft(page.url(), "削除完了後に出荷指示リスト検索画面へ遷移する").toMatch(/\/standby\/search/);
  });
  await step(4, async () => { await B.リスト削除を押す(); });
  await step(5, async () => { bOk = await B.確認ダイアログでOKを押す(); bText = await B.画面の文(); });
  await expected(async () => {
    expect.soft(aOk.応答 !== null && aOk.応答 < 400, "タブAの1回目の削除は成功する（応答が異常でない）").toBe(true);
    expect.soft(bOk.応答, "削除済みの出荷指示リストへの2回目の削除で、見つからない旨の応答（404）が表示される").toBe(404);
  });
  note(`タブBの削除後の画面の文: ${bText}`);
});
