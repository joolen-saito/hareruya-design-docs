/**
 * M03-26 カード商品CSV登録。正本: cases/M03-26_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる4件（005・030・031・035）。ほかのケースは、マスタ・取込履歴・カード詳細をDBで用意するシード
 * （S-M03-26-MASTER など）を使うか、取込ファイルの値が正本で決まらない（036・037）ので実装しない（seeds/m03-26.ts の冒頭）。
 *
 * 正本の「カード商品CSV登録画面」は、画面の見出しが「カード商品CSVアップロード」の画面（メニュー「商品管理」→「CSV管理」）。
 * 正本の「CSVファイルのアップロード」は、画面の「CSVファイルをアップロード」ボタン。押すと確認モーダルが開き、モーダルの「確認」で送る
 * （設計書 L0094「押下後、確認モーダルを表示」）。
 */
import fs from "node:fs";
import path from "node:path";
import { Page, test } from "@playwright/test";
import { CASEGEN_DIR } from "../../config/env";
import { 商品データの状態 } from "../../db/m03_26_card_csv";
import { expect, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { downloadedBytes, pathOf, topMessages } from "../../pages/admin/m03_21_shelf_number";
import { CsvUploadPage, SubmitResult } from "../../pages/admin/m03_26_card_csv_upload";
import { M0326_ADMIN, m0326CsvPath } from "../../seeds/m03-26";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function signIn(page: Page): Promise<CsvUploadPage> {
  await loginAdmin(page, M0326_ADMIN);
  return new CsvUploadPage(page, "カード商品");
}

/**
 * 設計書の写し（datapattern/units/M03-26/design.txt）の「カード商品CSVフォーマット」の表の項目名（識別IDの順）。
 * 表の行は「L…<TAB>識別ID<TAB>項目名<TAB>…」。表の後ろの「カスタマイズ説明」の手前まで読む。
 */
function designFormatItems(): { 識別ID: number; 項目名: string; 行: string }[] {
  const lines = fs.readFileSync(path.join(CASEGEN_DIR, "datapattern", "units", "M03-26", "design.txt"), "utf-8").split("\n");
  const start = lines.findIndex((l) => /^#####.*カード商品CSVフォーマット/.test(l));
  if (start < 0) throw new Error("設計書の写しに「カード商品CSVフォーマット」の節が無い");
  const out: { 識別ID: number; 項目名: string; 行: string }[] = [];
  for (const l of lines.slice(start + 1)) {
    if (/^L\d{4}\tカスタマイズ説明/.test(l) || l.startsWith("#####")) break;
    const m = l.match(/^(L\d{4})\t(\d+)\t([^\t]+)\t/);
    if (m) out.push({ 識別ID: Number(m[2]), 項目名: m[3].trim(), 行: m[1] });
  }
  return out;
}

/** 「CSVファイルをアップロード」を押した結果を注記に残す */
async function noteAfterPress(up: CsvUploadPage, r: SubmitResult | null): Promise<void> {
  if (r === null) note(`「CSVファイルをアップロード」を押すと確認モーダルが開いた（${await up.modalText()}）`);
  else if (r.sent) note(`「CSVファイルをアップロード」を押したあとの取込の要求の応答: ${r.status}`);
  else note(`「CSVファイルをアップロード」を押すと、ブラウザの入力チェックが送信を止めた（要求は送られず、確認モーダルも開かない: ${await up.modalOpened() ? "開いた" : "開いていない"}）: ${r.止めた項目.join(" / ")}`);
}

/** 画面上部に出たメッセージを注記に残す */
async function noteMessages(page: Page, when: string): Promise<void> {
  const m = await topMessages(page);
  const all = [...m.成功.map((t) => `成功「${t}」`), ...m.エラー.map((t) => `エラー「${t}」`)];
  note(`${when}の画面上部のメッセージ: ${all.length ? all.join(" / ") : "なし"}`);
}

/**
 * 「確認モーダルの確定ボタンを押す」「アップロードを確定する」: 確認モーダルが開いていれば「確認」を押して送る。
 * 開いていない（ブラウザの入力チェックで止まった）ときは押せないので、注記に残して null を返す。
 */
async function confirmIfOpened(page: Page, up: CsvUploadPage, pressed: SubmitResult | null): Promise<SubmitResult | null> {
  if (pressed !== null) {
    note("確認モーダルが開いていないので、確定ボタンを押せない（手順を実行できない）");
    return null;
  }
  const r = await up.confirm();
  note(`確認モーダルの「確認」を押したあとの取込の要求の応答: ${r.sent ? r.status : "送られていない"}`);
  await noteMessages(page, "確定のあと");
  return r;
}

// ---- 雛形 ----

caseTest("IT-M03-26-005", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let bytes: Buffer = Buffer.alloc(0);
  let name = "";
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    const download = await up.downloadTemplate();
    name = download.suggestedFilename();
    bytes = await downloadedBytes(download);
  });
  let rows: string[][] = [];
  let lines: string[] = [];
  await step(3, async () => {
    const text = decodeCsvBytes(bytes);
    lines = text.replace(/(\r\n|\n|\r)$/, "").split(/\r\n|\n|\r/);
    rows = parseCsv(text);
    note(`ダウンロードしたファイル「${name}」（${bytes.length} バイト。先頭の3バイト「${bytes.subarray(0, 3).toString("hex")}」）の見出し: ${(rows[0] ?? []).join(",")}（${(rows[0] ?? []).length}列）`);
  });
  await expected(async () => {
    // 事前準備②: 比較に使うカード商品CSVフォーマットは識別ID1から31の31項目（設計書 L0209〜L0240）
    const format = designFormatItems();
    expect(format.map((f) => f.識別ID), "設計書のカード商品CSVフォーマットの識別ID（比べる相手）").toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    expect.soft(lines.length, "雛形ファイルの行数（列見出しだけの1行）").toBe(1);
    expect.soft(rows.length, "雛形ファイルのCSVとしての行数").toBe(1);
    expect.soft((rows[0] ?? []).length, "雛形ファイルの見出しの列数").toBe(31);
    expect.soft(rows[0] ?? [], "雛形ファイルの見出し（カード商品CSVフォーマットの識別ID1から31の順）").toEqual(format.map((f) => f.項目名));
  });
});

// ---- ファイルを選ばずに送る ----

caseTest("IT-M03-26-030", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let pressed: SubmitResult | null = null;
  let r: SubmitResult | null = null;
  await step(1, async () => { await up.open(); });
  await step(2, async () => {
    expect(await up.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(0);
    pressed = await up.pressUpload();
    await noteAfterPress(up, pressed);
  });
  await step(3, async () => { r = await confirmIfOpened(page, up, pressed); });
  await expected(async () => {
    // 送信の結果として画面へ遷移すること。確定できず要求が送られていないときは、元の画面にいても合格にしない
    const sent = r !== null && (r as SubmitResult).sent;
    expect.soft(sent, "確認モーダルの確定で取込の要求が送られた").toBe(true);
    if (r !== null && (r as SubmitResult).sent) expect.soft((r as { status: number }).status, "取込の要求の応答（この画面へ戻す転送）").toBe(302);
    expect.soft(pathOf(page.url()), "送信のあとの画面").toBe(up.path());
  });
});

caseTest("IT-M03-26-031", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let before!: ReturnType<typeof 商品データの状態>;
  let after!: ReturnType<typeof 商品データの状態>;
  let pressed: SubmitResult | null = null;
  await step(1, async () => {
    before = 商品データの状態();
    note(`操作前: 商品 ${before.商品件数} 件・カード商品CSV取込履歴 ${before.カード商品CSV取込履歴件数} 件`);
  });
  await step(2, async () => { await up.open(); });
  await step(3, async () => {
    expect(await up.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(0);
    pressed = await up.pressUpload();
    await noteAfterPress(up, pressed);
    await confirmIfOpened(page, up, pressed);
  });
  await step(4, async () => {
    after = 商品データの状態();
    note(`操作後: 商品 ${after.商品件数} 件・カード商品CSV取込履歴 ${after.カード商品CSV取込履歴件数} 件`);
  });
  await expected(async () => {
    expect.soft(after.商品件数, "商品件数が操作前から増えない").toBeLessThanOrEqual(before.商品件数);
    expect.soft(after.カード商品CSV取込履歴件数, "カード商品CSV取込履歴件数が操作前から増えない").toBeLessThanOrEqual(before.カード商品CSV取込履歴件数);
  });
});

// ---- 見出し行だけのファイル ----

caseTest("IT-M03-26-035", async ({ page, step, expected }) => {
  const up = await signIn(page);
  let before!: ReturnType<typeof 商品データの状態>;
  let after!: ReturnType<typeof 商品データの状態>;
  let r: SubmitResult | null = null;
  await step(1, async () => {
    before = 商品データの状態();
    note(`操作前: 商品 ${before.商品件数} 件（最終更新 ${before.最終更新日時}）`);
  });
  await step(2, async () => { await up.open(); });
  await step(3, async () => {
    await up.choose(m0326CsvPath("header-only.csv"));
    expect(await up.chosenCount(), "取込ファイルの欄で選ばれているファイルの数").toBe(1);
    const pressed = await up.pressUpload();
    await noteAfterPress(up, pressed);
    r = await confirmIfOpened(page, up, pressed);
  });
  await step(4, async () => {
    after = 商品データの状態();
    note(`操作後: 商品 ${after.商品件数} 件（最終更新 ${after.最終更新日時}）`);
  });
  await expected(async () => {
    // アップロードを確定したこと（取込の要求が送られたこと）を確かめたうえで、商品データが変わっていないこと
    expect.soft(r !== null && (r as SubmitResult).sent, "確認モーダルの確定で取込の要求が送られた").toBe(true);
    expect.soft(after.商品件数, "商品件数が変わらない").toBe(before.商品件数);
    expect.soft(after.最終更新日時, "商品の最終更新日時が変わらない（既存の商品が更新されていない）").toBe(before.最終更新日時);
  });
});
