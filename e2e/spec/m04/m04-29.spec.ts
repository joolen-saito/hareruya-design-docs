/**
 * M04-29 在庫移動実績 インポート。正本: cases/M04-29_test_cases.tsv
 * 実装したのは流せる見込みの 001・002・003・007。店舗は、正本の「M0429RD店舗A／B」「FGM0429店舗A／B」を本店（出庫元）・試験支店（入庫先）に読み替える
 * （依頼者決定 2026-11-13 店舗は作らない。seeds/m04-29.ts）。ログインIDは、正本の値でなく決まった印を付けた作業者のもの。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { MoveInstructionSearchPage, topMessages } from "../../pages/admin/m04_24_move_instruction";
import { MoveTransferListPage } from "../../pages/admin/m04_24_stock_move";
import { 試験支店ID } from "../../pages/admin/test_store";
import { M0429_OP, m0429FilePath } from "../../seeds/m04-29";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 店読み替え = () => supplement("正本の店舗A・店舗Bは、出庫元＝本店（店舗ID 1）・入庫先＝試験支店（店舗ID 1574）に読み替えた（店舗は作らない。依頼者決定 2026-11-13）。作業者は決まった印を付けた名前のメンバー");
const 出庫元 = "1";

/** 在庫移動指示検索画面を開き、在庫移動実績CSV登録モーダルでファイルを選んで「登録」を押す */
async function CSVを登録する(page: Page, search: MoveInstructionSearchPage, file: string): Promise<void> {
  await search.openCsvRegistration();
  await search.chooseCsvFile(file);
  const r = await search.submitCsv();
  note(`在庫移動実績CSV登録の応答: ${r.status}・移った先: ${new URL(page.url()).pathname}`);
}

/** 在庫移動指示検索で、出庫元・入庫先の店舗と在庫移動指示IDを入れて検索し、その行を返す */
async function 指示の行(page: Page, 指示ID: string) {
  const search = new MoveInstructionSearchPage(page);
  await search.open();
  await search.searchById(指示ID, { 出庫元店舗ID: 出庫元, 入庫先店舗ID: 試験支店ID });
  const rows = (await search.listedRows()).filter((r) => r.移動指示ID === 指示ID);
  expect(rows.length, `在庫移動指示検索に移動指示ID ${指示ID} の行が1件`).toBe(1);
  return rows[0];
}

// ---- 001: 出庫承認済みの在庫移動が、送り状No.の取込で「移動中」になる ----
caseTest("IT-M04-29-001", async ({ page, notes, step, expected }) => {
  const moveId = notes.get("〔在庫移動ID-M0429-RD001〕");
  const 指示ID = notes.get("〔在庫移動指示ID-M0429-RD001〕");
  let before = { ステータス: "", 移動指示リストID: "" };
  let after = { ステータス: "", 移動指示リストID: "" };
  const moves = () => new MoveTransferListPage(page);
  await step(1, async () => { await loginAdmin(page, M0429_OP.account); });
  await step(2, async () => {
    await moves().searchById(moveId);
    before = await moves().rowState(moveId);
    note(`取込の前の行: ステータス「${before.ステータス}」・移動指示リストID「${before.移動指示リストID}」`);
  });
  const search = new MoveInstructionSearchPage(page);
  await step(3, async () => { await search.open(); await search.openCsvRegistration(); });
  await step(4, async () => {
    await search.chooseCsvFile(m0429FilePath("001", "rd-result-001.csv"));
    const r = await search.submitCsv();
    note(`在庫移動実績CSV登録の応答: ${r.status}・上部のメッセージ: ${JSON.stringify(await topMessages(page))}`);
  });
  await step(5, async () => { await moves().searchById(moveId); });
  await step(6, async () => {
    after = await moves().rowState(moveId);
    note(`取込のあとの行: ステータス「${after.ステータス}」・移動指示リストID「${after.移動指示リストID}」`);
  });
  await expected(async () => {
    店読み替え();
    expect.soft(before.ステータス, "手順2: 行のステータス").toBe("出庫承認済み");
    expect.soft(after.ステータス, "手順6: 同じ行のステータス").toBe("移動中");
    expect.soft(after.移動指示リストID, "手順6: 同じ行の移動指示リストID").toBe(指示ID);
  });
});

// ---- 002: 複数の移動指示の送り状No.を1ファイルで取り込む ----
caseTest("IT-M04-29-002", async ({ page, notes, step, expected }) => {
  const p = notes.get("〔在庫移動指示ID-M0429-002P〕");
  const q = notes.get("〔在庫移動指示ID-M0429-002Q〕");
  let a: Awaited<ReturnType<typeof 指示の行>> | null = null;
  let b: Awaited<ReturnType<typeof 指示の行>> | null = null;
  const search = new MoveInstructionSearchPage(page);
  await step(1, async () => { await loginAdmin(page, M0429_OP.account); });
  await step(2, async () => { await search.open(); await search.openCsvRegistration(); });
  await step(3, async () => {
    await search.chooseCsvFile(m0429FilePath("002", "fg002-result.csv"));
    const r = await search.submitCsv();
    note(`在庫移動実績CSV登録の応答: ${r.status}・上部のメッセージ: ${JSON.stringify(await topMessages(page))}`);
  });
  await step(4, async () => { a = await 指示の行(page, p); note(`${p} の行: 送り状No.「${a.送り状No}」・発送状況「${a.発送状況}」`); });
  await step(5, async () => { b = await 指示の行(page, q); note(`${q} の行: 送り状No.「${b.送り状No}」・発送状況「${b.発送状況}」`); });
  await expected(async () => {
    店読み替え();
    expect.soft(a!.送り状No, `手順4: ${p} の行の送り状No.欄`).toBe("M0429FG002-TRK-A");
    expect.soft(a!.発送状況, `手順4: ${p} の行の発送状況`).toBe("済");
    expect.soft(b!.送り状No, `手順5: ${q} の行の送り状No.欄`).toBe("M0429FG002-TRK-B");
    expect.soft(b!.発送状況, `手順5: ${q} の行の発送状況`).toBe("済");
  });
});

// ---- 003: エラーは20件まで表示される ----
caseTest("IT-M04-29-003", async ({ page, step, expected }) => {
  let errors: string[] = [];
  const search = new MoveInstructionSearchPage(page);
  await step(1, async () => { await loginAdmin(page, M0429_OP.account); });
  await step(2, async () => { await search.open(); await search.openCsvRegistration(); });
  await step(3, async () => {
    await search.chooseCsvFile(m0429FilePath("003", "fg003-cap.csv"));
    const r = await search.submitCsv();
    note(`在庫移動実績CSV登録の応答: ${r.status}`);
  });
  await step(4, async () => {
    errors = (await topMessages(page)).エラー;
    note(`画面上部のエラーの表示（${errors.length}個）: ${errors.join(" / ")}`);
  });
  await expected(async () => {
    店読み替え();
    const 組 = errors.map((e) => e.match(/(\d+)行目（移動指示ID: (\d+)）/)).filter((m): m is RegExpMatchArray => m !== null).map((m) => ({ 行: m[1], ID: m[2] }));
    const 案内 = errors.findIndex((e) => e.includes("エラーは20件まで表示されます"));
    const 先頭の組 = errors.findIndex((e) => /行目（移動指示ID: \d+）/.test(e));
    expect.soft(案内, "「エラーは20件まで表示されます」が表示される").toBeGreaterThanOrEqual(0);
    expect.soft(案内 < 先頭の組, "「エラーは20件まで表示されます」が、行番号と移動指示IDの組の上にある").toBe(true);
    expect.soft(組.length, "行番号と移動指示IDの組が20件表示される").toBe(20);
    expect.soft(組.some((x) => x.ID === "42900321"), "21件目（移動指示ID 42900321）は表示されない").toBe(false);
  });
});

// ---- 007: 二重引用符で囲んだカンマを含む送り状No. ----
caseTest("IT-M04-29-007", async ({ page, notes, step, expected }) => {
  const p = notes.get("〔在庫移動指示ID-M0429-007P〕");
  let a: Awaited<ReturnType<typeof 指示の行>> | null = null;
  const search = new MoveInstructionSearchPage(page);
  await step(1, async () => { await loginAdmin(page, M0429_OP.account); });
  await step(2, async () => { await search.open(); await search.openCsvRegistration(); });
  await step(3, async () => {
    await search.chooseCsvFile(m0429FilePath("007", "fg007-multi-trk.csv"));
    const r = await search.submitCsv();
    note(`在庫移動実績CSV登録の応答: ${r.status}・上部のメッセージ: ${JSON.stringify(await topMessages(page))}`);
  });
  await step(4, async () => { a = await 指示の行(page, p); note(`${p} の行: 送り状No.「${a.送り状No}」・発送状況「${a.発送状況}」`); });
  await expected(async () => {
    店読み替え();
    expect.soft(a!.送り状No, `手順4: ${p} の行の送り状No.欄`).toBe("M0429FG007-TRK-A,M0429FG007-TRK-B");
    expect.soft(a!.発送状況, `手順4: ${p} の行の発送状況`).toBe("済");
  });
});
