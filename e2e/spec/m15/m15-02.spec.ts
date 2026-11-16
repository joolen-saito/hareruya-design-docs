/**
 * M15-02 デッキCSV出力。ケースの正本: integration_test/casegen/cases/M15-02_test_cases.tsv
 * 実装しないケース（理由は記録 e2e/review/M15-02_progress_*.md）: DB での準備が要るシード（共有のフォーマット・アーキタイプ、存在しない番号、文字コード設定の反映など）を使う 009 010 014 015 016 022 023 024 007 008。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { topErrorAlerts, withoutEnvBanners } from "../../pages/admin/common";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { CSVの内容を画面の枠に出す, CSVの枠のデータ行, CSVの枠の題 } from "../../lib/evidence_other";
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
async function 出力する(page: Page, l: デッキ一覧, 枠に出す = false, 応答の頭書きも出す = false): Promise<{ 本文: string; ファイル名: string; 応答: { disposition: string; type: string } }> {
  const [dl, res] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), page.waitForResponse((r) => r.url().includes("/deck/csv_export"), { timeout: 60_000 }), l.CSV出力.click()]);
  const h = res.headers();
  const 中 = await 本文(dl);
  // 読んだCSV（ファイル名・見出し・全データ行）を画面の枠に書き出して残す。続く期待結果の確かめはこの枠の要素で行い、赤枠がCSVの値に付く
  const 頭書き = 応答の頭書きも出す ? `　応答の Content-Disposition：${h["content-disposition"] ?? "なし"}　Content-Type：${h["content-type"] ?? "なし"}` : "";
  if (枠に出す) await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${dl.suggestedFilename()}${頭書き}`, 行: parseCsv(中) }]);
  return { 本文: 中, ファイル名: dl.suggestedFilename(), 応答: { disposition: h["content-disposition"] ?? "", type: h["content-type"] ?? "" } };
}
/** CSVの枠の、データ行（見出し行を除く）のうち、そのデッキIDを値に持つセルのある行 */
const 枠の行 = (page: Page, id: string) => CSVの枠のデータ行(page, 0).filter({ has: page.locator("td", { hasText: new RegExp(`^${id}$`) }) });
/** 画面上部の帯の文（開発用の設定の帯は除く） */
const 画面の文言 = async (page: Page) => withoutEnvBanners(await page.locator(".alert").allInnerTexts()).join(" ").replace(/\s+/g, " ");

caseTest("IT-M15-02-001", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-001〕");
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索(page, [id]); });
  await step(2, async () => { await l!.選択(id).check(); });
  let r = { 本文: "", ファイル名: "", 応答: { disposition: "", type: "" } };
  await step(3, async () => { r = await 出力する(page, l!, true); });
  await expected(async () => {
    await expect.soft(CSVの枠の題(page, 0), "ダウンロードされたCSVのファイル名").toHaveText(/^ファイル名：.*\.csv（/);
    await expect.soft(枠の行(page, id), "ダウンロードしたCSVに選択したデッキの行がある").toHaveCount(1);
    await expect.soft(CSVの枠のデータ行(page, 0), "データ行の数（選択した1件）").toHaveCount(1);
  });
});

caseTest("IT-M15-02-002", async ({ page, notes, step, expected }) => {
  await login(page);
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔デッキID-M1502-002${x}〕`));
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索(page, [A, B, C]); });
  await step(2, async () => { await l!.選択(A).check(); await l!.選択(B).check(); });
  let r = { 本文: "", ファイル名: "", 応答: { disposition: "", type: "" } };
  await step(3, async () => { r = await 出力する(page, l!, true); });
  let rows: string[][] = [];
  await step(4, async () => { rows = parseCsv(r.本文); });
  await expected(async () => {
    await expect.soft(CSVの枠のデータ行(page, 0), "データ行の数").toHaveCount(2);
    await expect.soft(枠の行(page, A), "選択したデッキAの行がある").toHaveCount(1);
    await expect.soft(枠の行(page, B), "選択したデッキBの行がある").toHaveCount(1);
    await expect.soft(page.locator("#e2e-csv-note td, #e2e-csv-note th").filter({ hasText: new RegExp(`^${C}$`) }), "選択しなかったデッキ（C）が含まれる").toHaveCount(0);
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
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.evaluate(画面からの強制送信)]); await page.waitForTimeout(2_000); });
  await step(4, async () => { await page.waitForLoadState("load"); });
  await expected(async () => { expect.soft(取得.length, "新しくダウンロードされたCSVの数").toBe(0); });
});

caseTest("IT-M15-02-006", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-006〕");
  await step(1, async () => { await 検索(page, [id]); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.evaluate(画面からの強制送信)]); });
  await expected(async () => {
    expect.soft((await 画面の文言(page)).length > 0, "管理画面上部のエラー表示").toBe(true);
    expect.soft(await topErrorAlerts(page).count(), "エラー（赤い帯）の数").toBeGreaterThan(0);
    expect.soft(一覧の画面(page), "デッキ検索・一覧画面へ戻った").toBe(true);
  });
});

caseTest("IT-M15-02-012", async ({ page, notes, step, expected }) => {
  await login(page);
  const ids = ["A", "B", "C"].map((x) => notes.get(`〔デッキID-M1502-012${x}〕`));
  let l: デッキ一覧 | null = null;
  await step(1, async () => { l = await 検索(page, ids); });
  let r = { 本文: "", ファイル名: "", 応答: { disposition: "", type: "" } };
  await step(2, async () => { for (const i of ids) await l!.選択(i).check(); r = await 出力する(page, l!, true); });
  let rows: string[][] = [];
  await step(3, async () => { rows = parseCsv(r.本文); });
  await expected(async () => {
    await expect.soft(CSVの枠のデータ行(page, 0), "レコード数（見出し1件＋データ3件）のうちデータ行の数").toHaveCount(3);
    for (const [i, id] of ids.entries()) await expect.soft(CSVの枠のデータ行(page, 0).nth(i).locator("td", { hasText: new RegExp(`^${id}$`) }), `データレコード${i + 1}件目に対応するデッキ（${["A", "B", "C"][i]}）`).toHaveCount(1);
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
  await step(4, async () => { await l!.選択(id).check(); r = await 出力する(page, l!, true, true); });
  await step(5, async () => { 後 = 日時(new Date()); note(`出力完了時の日時（日本時間）: ${後}`); });
  await step(6, async () => { note(`応答の Content-Disposition: ${r.応答.disposition} ／ ダウンロードしたファイル名: ${r.ファイル名}`); });
  await expected(async () => {
    const m = /^deck_(\d{14})\.csv$/.exec(r.ファイル名);
    await expect.soft(CSVの枠の題(page, 0), `Content-Disposition が attachment（応答の見出しの値：${r.応答.disposition}）`).toContainText(/応答の Content-Disposition：attachment/);
    await expect.soft(CSVの枠の題(page, 0), `ダウンロードしたファイル名「${r.ファイル名}」が deck_YYYYMMDDHHmmss.csv の形`).toHaveText(/^ファイル名：deck_\d{14}\.csv　応答の/);
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
  await step(4, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), l!.CSV出力.click({ noWaitAfter: true })]); });
  await expected(async () => {
    expect.soft(await topErrorAlerts(page).count(), "管理画面上部のエラー（赤い帯）の数").toBeGreaterThan(0);
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
  let r = { 本文: "", ファイル名: "", 応答: { disposition: "", type: "" } };
  await step(3, async () => { await l!.選択(id).check(); r = await 出力する(page, l!, true, true); });
  let 後 = "";
  await step(4, async () => { await page.waitForTimeout(1_500); 後 = await 画面の文言(page); });
  await expected(async () => {
    // 正本の「CSVファイルだけが返され」: CSVがダウンロードされ（ファイル名・応答の種類）、画面は移らずメッセージが加わらない
    await expect.soft(CSVの枠の題(page, 0), `CSVファイルがダウンロードされた（ファイル名：${r.ファイル名}。Content-Disposition：${r.応答.disposition}。Content-Type：${r.応答.type}）`).toHaveText(/^ファイル名：.+\.csv　応答の Content-Disposition：attachment/);
    expect.soft(r.応答.type, `返されたのはCSVファイル（Content-Type：${r.応答.type}）`).toMatch(/csv/i);
    expect.soft(await page.locator(".alert-success").count(), "成功メッセージ（緑の帯）の数").toBe(0);
    expect.soft(後, "管理画面上部のメッセージ（操作前から変わらない）").toBe(前);
  });
});
