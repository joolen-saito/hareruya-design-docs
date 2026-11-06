/**
 * M15-02 デッキCSV出力。ケースの正本: integration_test/casegen/cases/M15-02_test_cases.tsv
 * 実装しないケース（理由は記録 e2e/review/M15-02_progress_*.md）: DB での準備が要るシード（共有のフォーマット・アーキタイプ、存在しない番号、文字コード設定の反映など）を使う 009 010 014 015 016 022 023 024 007 008。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1502_ADMIN } from "../../seeds/m15-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const path = (page: Page) => new URL(page.url()).pathname;
const 一覧のパス = new URL(adminUrl("/deck")).pathname;
const 一覧の画面 = (page: Page) => path(page) === 一覧のパス || /\/deck\/search(\/\d+)?$/.test(path(page));

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1502_ADMIN);
}
/** 手順: デッキIDで検索する */
async function 検索(page: Page, ids: string[]): Promise<デッキ一覧> {
  const l = new デッキ一覧(page);
  await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(ids.join(",")); await l.検索する();
  return l;
}
async function 本文(dl: import("@playwright/test").Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of await dl.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return decodeCsvBytes(Buffer.concat(chunks));
}
/** 選択したデッキのCSVを出力してダウンロードする */
async function 出力する(page: Page, l: デッキ一覧): Promise<{ 本文: string; ファイル名: string; 応答: { disposition: string; type: string } }> {
  const [dl, res] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), page.waitForResponse((r) => r.url().includes("/deck/csv_export"), { timeout: 60_000 }), l.CSV出力.click()]);
  const h = res.headers();
  return { 本文: await 本文(dl), ファイル名: dl.suggestedFilename(), 応答: { disposition: h["content-disposition"] ?? "", type: h["content-type"] ?? "" } };
}
const 列を含む = (rows: string[][], id: string) => rows.slice(1).some((r) => r.includes(id));
const 画面の文言 = async (page: Page) => (await page.locator(".alert").allInnerTexts()).join(" ").replace(/\s+/g, " ");

caseTest("IT-M15-02-001", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-001〕");
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索(page, [id]); });
  await step(2, async () => { await l!.選択(id).check(); });
  let r = { 本文: "", ファイル名: "", 応答: { disposition: "", type: "" } };
  await step(3, async () => { r = await 出力する(page, l!); });
  await expected(async () => {
    const rows = parseCsv(r.本文);
    expect.soft(r.ファイル名, "ダウンロードされたCSVのファイル名").toMatch(/\.csv$/);
    expect.soft(列を含む(rows, id), "ダウンロードしたCSVに選択したデッキの行がある").toBe(true);
    expect.soft(rows.length - 1, "データ行の数（選択した1件）").toBe(1);
  });
});

caseTest("IT-M15-02-002", async ({ page, notes, step, expected }) => {
  await login(page);
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔デッキID-M1502-002${x}〕`));
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索(page, [A, B, C]); });
  await step(2, async () => { await l!.選択(A).check(); await l!.選択(B).check(); });
  let r = { 本文: "", ファイル名: "", 応答: { disposition: "", type: "" } };
  await step(3, async () => { r = await 出力する(page, l!); });
  let rows: string[][] = [];
  await step(4, async () => { rows = parseCsv(r.本文); });
  await expected(async () => {
    expect.soft(rows.length - 1, "データ行の数").toBe(2);
    expect.soft(列を含む(rows, A) && 列を含む(rows, B), "選択したデッキ（A・B）の行がある").toBe(true);
    expect.soft(rows.flat().includes(C), "選択しなかったデッキ（C）が含まれる").toBe(false);
  });
});

/** 004〜006: 何も選ばずにCSV出力の要求を送る */
caseTest("IT-M15-02-004", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-004〕");
  let l: デッキ一覧 | null = null;
  const 要求: string[] = []; const 取得: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/deck/csv_export")) 要求.push(r.method()); });
  page.on("download", (d) => 取得.push(d.suggestedFilename()));
  await step(1, async () => { l = await 検索(page, [id]); });
  await step(2, async () => { note("開発者ツールの代わりに、画面が送る要求とダウンロードの発生を記録した"); });
  await step(3, async () => { await Promise.all([page.waitForLoadState("load").catch(() => null), l!.CSV出力.click()]); await page.waitForTimeout(3_000); });
  await step(4, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(要求.length, "CSV出力の要求の数").toBe(0);
    expect.soft(取得.length, "新しくダウンロードされたCSVの数").toBe(0);
  });
});

const 画面からの強制送信 = "const f=document.getElementById('bulk_form');document.getElementById('bulk_form_token').value=document.getElementById('csv_export_token_value').value;f.action=document.getElementById('csv_export').formAction;f.submit();";

caseTest("IT-M15-02-005", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-005〕");
  const 取得: string[] = [];
  page.on("download", (d) => 取得.push(d.suggestedFilename()));
  await step(1, async () => { await 検索(page, [id]); });
  await step(2, async () => { note("ダウンロードの発生を記録した"); });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.evaluate(画面からの強制送信)]); await page.waitForTimeout(2_000); });
  await step(4, async () => { await page.waitForLoadState("load"); });
  await expected(async () => { expect.soft(取得.length, "新しくダウンロードされたCSVの数").toBe(0); });
});

caseTest("IT-M15-02-006", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-006〕");
  await step(1, async () => { await 検索(page, [id]); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.evaluate(画面からの強制送信)]); });
  await expected(async () => {
    expect.soft((await 画面の文言(page)).length > 0, "管理画面上部のエラー表示").toBe(true);
    expect.soft(await page.locator(".alert-danger").count(), "エラー（赤い帯）の数").toBeGreaterThan(0);
    expect.soft(一覧の画面(page), "デッキ検索・一覧画面へ戻った").toBe(true);
  });
});

caseTest("IT-M15-02-012", async ({ page, notes, step, expected }) => {
  await login(page);
  const ids = ["A", "B", "C"].map((x) => notes.get(`〔デッキID-M1502-012${x}〕`));
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索(page, ids); });
  let r = { 本文: "", ファイル名: "", 応答: { disposition: "", type: "" } };
  await step(2, async () => { for (const i of ids) await l!.選択(i).check(); r = await 出力する(page, l!); });
  let rows: string[][] = [];
  await step(3, async () => { rows = parseCsv(r.本文); });
  await expected(async () => {
    expect.soft(rows.length, "レコード数（見出し1件＋データ3件）").toBe(4);
    for (const [i, id] of ids.entries()) expect.soft(rows[i + 1]?.includes(id) ?? false, `データレコード${i + 1}件目に対応するデッキ（${["A", "B", "C"][i]}）`).toBe(true);
  });
});

const 日時 = (d: Date) => {
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d);
  return p.replace(/[-: ]/g, "");
};
caseTest("IT-M15-02-013", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-013〕");
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索(page, [id]); });
  await step(2, async () => { note("開発者ツールの代わりに、CSV出力の応答の見出しを記録した"); });
  let 前 = "", 後 = "";
  let r = { 本文: "", ファイル名: "", 応答: { disposition: "", type: "" } };
  await step(3, async () => { 前 = 日時(new Date()); note(`出力直前の日時（この環境の時計・日本時間）: ${前}`); });
  await step(4, async () => { await l!.選択(id).check(); r = await 出力する(page, l!); });
  await step(5, async () => { 後 = 日時(new Date()); note(`出力完了時の日時（日本時間）: ${後}`); });
  await step(6, async () => { note(`応答の Content-Disposition: ${r.応答.disposition} ／ ダウンロードしたファイル名: ${r.ファイル名}`); });
  await expected(async () => {
    expect.soft(r.応答.disposition, "Content-Disposition").toContain("attachment");
    const m = /^deck_(\d{14})\.csv$/.exec(r.ファイル名);
    expect.soft(m !== null, `ダウンロードしたファイル名「${r.ファイル名}」が deck_YYYYMMDDHHmmss.csv の形`).toBe(true);
    expect.soft(!!m && m[1] >= 前 && m[1] <= 後, `ファイル名の日時が手順3（${前}）から手順5（${後}）の間`).toBe(true);
  });
});

caseTest("IT-M15-02-017", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-017〕");
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索(page, [id]); });
  await step(2, async () => { await l!.選択(id).check(); });
  await step(3, async () => { await page.locator("#csv_export_token_value").evaluate((e) => { (e as HTMLInputElement).value = "invalid-token"; }); });
  await step(4, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l!.CSV出力.click()]); });
  await expected(async () => {
    expect.soft(await page.locator(".alert-danger").count(), "管理画面上部のエラー（赤い帯）の数").toBeGreaterThan(0);
    expect.soft(一覧の画面(page), "デッキ検索・一覧画面へ遷移した").toBe(true);
  });
});

caseTest("IT-M15-02-018", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-018〕");
  let l: デッキ一覧 | null = null;
  let 前 = "";
  await step(1, async () => { l = await 検索(page, [id]); });
  await step(2, async () => { 前 = await 画面の文言(page); });
  await step(3, async () => { await l!.選択(id).check(); await 出力する(page, l!); });
  let 後 = "";
  await step(4, async () => { await page.waitForTimeout(1_500); 後 = await 画面の文言(page); });
  await expected(async () => {
    expect.soft(await page.locator(".alert-success").count(), "成功メッセージ（緑の帯）の数").toBe(0);
    expect.soft(後, "管理画面上部のメッセージ（操作前から変わらない）").toBe(前);
  });
});
