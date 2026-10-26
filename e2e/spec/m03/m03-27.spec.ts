/**
 * M03-27 グッズ商品CSV登録。正本: cases/M03-27_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる2件（005・039）。ほかのケースは、マスタ・取込履歴などをDBで用意するシード
 * （S-M03-27-MASTER など）を使うので実装しない（seeds/m03-27.ts の冒頭）。
 *
 * 正本の「グッズ商品CSV登録画面」は、画面の見出しが「グッズ商品CSVアップロード」の画面（メニュー「商品管理」→「CSV管理」）。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page, test } from "@playwright/test";
import { CASEGEN_DIR } from "../../config/env";
import { caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { downloadedBytes, pathOf, topMessages } from "../../pages/admin/m03_21_shelf_number";
import { CsvUploadPage, SubmitResult } from "../../pages/admin/m03_26_card_csv_upload";
import { M0327_ADMIN } from "../../seeds/m03-27";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(page: Page): Promise<CsvUploadPage> {
  await loginAdmin(page, M0327_ADMIN);
  return new CsvUploadPage(page, "グッズ商品");
}

/**
 * 設計書の写し（datapattern/units/M03-27/design.txt）の「グッズ商品CSVフォーマット」の表の項目名（識別IDの順）。
 * 表の行は「L…<TAB>識別ID<TAB>項目名<TAB>…」。表の後ろの「カスタマイズ説明」の手前まで読む。
 */
function designFormatItems(): { 識別ID: number; 項目名: string; 行: string }[] {
  const lines = fs.readFileSync(path.join(CASEGEN_DIR, "datapattern", "units", "M03-27", "design.txt"), "utf-8").split("\n");
  const start = lines.findIndex((l) => /^#####.*グッズ商品CSVフォーマット/.test(l));
  if (start < 0) throw new Error("設計書の写しに「グッズ商品CSVフォーマット」の節が無い");
  const out: { 識別ID: number; 項目名: string; 行: string }[] = [];
  for (const l of lines.slice(start + 1)) {
    if (/^L\d{4}\tカスタマイズ説明/.test(l) || l.startsWith("#####")) break;
    const m = l.match(/^(L\d{4})\t(\d+)\t([^\t]+)\t/);
    if (m) out.push({ 識別ID: Number(m[2]), 項目名: m[3].trim(), 行: m[1] });
  }
  return out;
}

caseTest("IT-M03-27-005", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let bytes: Buffer = Buffer.alloc(0);
  let name = "";
  let text = "";
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    const download = await up.downloadTemplate();
    name = download.suggestedFilename();
    bytes = await downloadedBytes(download);
  });
  let rows: string[][] = [];
  let lines: string[] = [];
  await step(3, async () => {
    text = decodeCsvBytes(bytes);
    lines = text.replace(/(\r\n|\n|\r)$/, "").split(/\r\n|\n|\r/);
    rows = parseCsv(text);
    note(`ダウンロードしたファイル「${name}」（${bytes.length} バイト。先頭の3バイト「${bytes.subarray(0, 3).toString("hex")}」）の見出し: ${(rows[0] ?? []).join(",")}（${(rows[0] ?? []).length}列）`);
  });
  await expected(async () => {
    // 有効な32項目＝設計書のグッズ商品CSVフォーマット（L0194〜L0238）の識別ID1〜33から、CSV項目から削除された
    // 識別ID15「商品削除フラグ」（L0213〜L0215「商品公開ステータスに踏襲の為、CSV項目から削除」）を除いたもの
    const format = designFormatItems();
    expect(format.map((f) => f.識別ID), "設計書のグッズ商品CSVフォーマットの識別ID（比べる相手）").toEqual(Array.from({ length: 33 }, (_, i) => i + 1));
    const valid = format.filter((f) => f.項目名 !== "商品削除フラグ");
    expect(valid.length, "設計書の有効な項目の数（比べる相手）").toBe(32);
    expect.soft(lines.length, "雛形ファイルの行数（列見出しだけの1行）").toBe(1);
    expect.soft(rows.length, "雛形ファイルのCSVとしての行数").toBe(1);
    const header = rows[0] ?? [];
    expect.soft(header, "商品削除フラグを含まない").not.toContain("商品削除フラグ");
    expect.soft(header.length, "見出しの列数").toBe(32);
    expect.soft(header, "見出し（商品IDからフリーエリアまでの有効な32項目を識別ID順）").toEqual(valid.map((f) => f.項目名));
    // 各項目の説明文（画面のCSVの形式の表の説明の欄）を含まないこと
    const descriptions = (await up.formatRows()).map((r) => r.説明).filter(Boolean);
    expect.soft(descriptions.length, "画面のCSVの形式の表の説明の欄（比べる相手）").toBeGreaterThan(0);
    for (const d of descriptions) expect.soft(text.includes(d), `ファイルに画面の説明文「${d}」が含まれない`).toBe(false);
  });
});

caseTest("IT-M03-27-039", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let pressed: SubmitResult | null = null;
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    expect(await up.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(0);
    pressed = await up.pressUpload();
    const p = pressed as SubmitResult | null;
    if (p && !p.sent) note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（要求は送られていない）: ${p.止めた項目.join(" / ")}`);
    else if (p && p.sent) note(`「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${p.status}`);
  });
  await step(3, async () => {
    // 確認モーダルは画面に無い（設計書 L0092「押下後、確認モーダルを表示」と違う。依頼者の判断待ちの件）
    const opened = await page.locator(".modal.show").isVisible();
    note(`確認モーダル: ${opened ? "開いた" : "開いていない（確定の操作はできない）"}`);
    const m = await topMessages(page);
    note(`画面上部のメッセージ: ${[...m.成功, ...m.エラー].join(" / ") || "なし"}`);
  });
  await expected(async () => {
    // 送信の結果として画面へ戻ること。ブラウザの入力チェックで止まったときは、元の画面にいても合格にしない
    const p = pressed as SubmitResult | null;
    expect.soft(p !== null && p.sent, "取込の要求が送られた").toBe(true);
    if (p && p.sent) expect.soft(p.status, "取込の要求の応答（この画面へ戻す転送）").toBe(302);
    expect.soft(pathOf(page.url()), "送信のあとの画面").toBe(up.path());
  });
});
