// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M15-02 デッキCSV出力（管理画面）。ケースの正本: integration_test/casegen/cases/M15-02_test_cases.tsv
 *
 * - 「開発者ツールのNetwork」「ブラウザのダウンロード履歴」は、CSV出力の要求・応答とダウンロードを Playwright で見張って読む（記録・消去の手順は見張りを始めること）。
 * - アーキタイプ「青白コントロール」「バーン」は実行の印を付けて作っている（seeds/m15-02.ts）。期待結果の同じ名前も、同じ印を付けた値として読む。
 * - 実装しないケース: 009・022（イベント開催日の秒を DB で設定する）、010・022（フォーマット・アーキタイプ・代表カード画像の未設定は DB でだけ作れる）、
 *   015・024（CSV出力文字コード設定を SJIS-win へ変える必要があり、アプリの設定ファイルとコンテナの起こし直しが要る）。
 */
import fs from "node:fs";
import path from "node:path";
import { test, Page } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { アプリの時刻帯, サーバーの時刻 } from "../../lib/app_config";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { デッキ一括編集 } from "../../pages/admin/m15_04_bulk_edit";
import {
  BOMがある, CSVを読む, CSV出力の見張り, CSV出力のトークンを書き換える, CSV出力を押す, UTF8で読む, デッキIDを入れて検索する, デッキ一覧のパスの形,
  一括編集でフォーマットを選ぶ, 上部のメッセージ, 未選択で送る文, 選ぶ, 選択の値を書き換える, 選択済みの数,
} from "../../pages/admin/m15_02_deck_csv_export";
import { M1502_ADMIN, ダウンロード先, 参照, 青白コントロール, バーン } from "../../seeds/m15-02-k";
import { 保存済みのフォーマットとアーキタイプ } from "../../db/m15_02_deck_csv";
import "../../seeds/m15-02"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const path_ = (page: Page) => new URL(page.url()).pathname;
const 見張りの注記 = "開発者ツールの Network とブラウザのダウンロード履歴は、Playwright でCSV出力の要求・応答とダウンロードを見張って読んだ";

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await loginAdmin(page, M1502_ADMIN);
}

/** CSV の行のうち、デッキIDの列の値の並び */
const デッキIDの列 = (rows: Record<string, string>[]) => rows.map((r) => r["デッキID"] ?? "");

type 読んだCSV = ReturnType<typeof CSVを読む>;

/**
 * 「検索 → 選ぶ → CSV出力 → 中身を読む」の形（001・002・012）。手順の分け方はケースごとに違う:
 * 001 = 検索 / 選ぶ / 押す（ダウンロードを読むのは期待結果）、002 = 検索 / 選ぶ / 押す / 表形式で開く、012 = 検索 / 選んで押す / レコードとして読む
 */
function 選んで出力する(控え: string[], 選ぶ控え: string[], 形: "001" | "002" | "012", 確かめ: (ids: Record<string, string>, csv: 読んだCSV, w: CSV出力の見張り) => void): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await login(page);
    const ids = Object.fromEntries(控え.map((k) => [k, notes.get(`〔デッキID-M1502-${k}〕`)]));
    let l!: デッキ一覧;
    let w!: CSV出力の見張り;
    let csv: 読んだCSV = { 全行: [], 行: [] };
    const 読む = async () => {
      expect(w.ダウンロード.length, "ダウンロードしたCSVの数").toBeGreaterThan(0);
      csv = CSVを読む(await w.中身());
    };
    await step(1, async () => { l = await デッキIDを入れて検索する(page, 控え.map((k) => ids[k])); });
    if (形 === "012") {
      await step(2, async () => { await 選ぶ(l, 選ぶ控え.map((k) => ids[k])); w = await CSV出力を押す(l); w.止める(); });
      await step(3, async () => { await 読む(); });
    } else {
      await step(2, async () => { await 選ぶ(l, 選ぶ控え.map((k) => ids[k])); });
      await step(3, async () => { w = await CSV出力を押す(l); w.止める(); });
      if (形 === "002") await step(4, async () => { await 読む(); });
    }
    await expected(async () => {
      if (形 === "001" && w.ダウンロード.length) csv = CSVを読む(await w.中身());
      expect.soft(w.ダウンロード.length, "ダウンロードされたCSVファイルの数").toBe(1);
      確かめ(ids, csv, w);
    });
  };
}

// ---------------------------------------------------------------- 007・008 選択の値を無いデッキIDへ書き換える

caseTest("IT-M15-02-007", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-007〕");
  let l!: デッキ一覧;
  let w!: CSV出力の見張り;
  await step(1, async () => { l = await デッキIDを入れて検索する(page, [id]); });
  await step(2, async () => { await 選ぶ(l, [id]); });
  await step(3, async () => { await 選択の値を書き換える(l, id, "159999007"); });
  await step(4, async () => { w = new CSV出力の見張り(page); note(見張りの注記); });
  await step(5, async () => { await l.CSV出力.click(); await w.終わりを待つ(); });
  let 件 = 0;
  await step(6, async () => { 件 = w.ダウンロード.length; w.止める(); note(`CSV出力の要求 ${w.要求.length}件・応答 ${w.応答[0]?.status() ?? "なし"}、ダウンロード ${件}件`); });
  await expected(async () => {
    expect(件, "新しくダウンロードされたファイルの数").toBe(0);
  });
});

caseTest("IT-M15-02-008", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-008〕");
  let l!: デッキ一覧;
  await step(1, async () => { l = await デッキIDを入れて検索する(page, [id]); });
  await step(2, async () => { await 選ぶ(l, [id]); });
  await step(3, async () => { await 選択の値を書き換える(l, id, "159999008"); });
  await step(4, async () => { const w = await CSV出力を押す(l); w.止める(); note(`CSV出力の応答 ${w.応答[0]?.status() ?? "なし"}、ダウンロード ${w.ダウンロード.length}件`); });
  await expected(async () => {
    const m = await 上部のメッセージ(page);
    expect.soft(m.エラー.length, `管理画面上部のエラーの表示（${m.エラー.join(" / ")}）`).toBeGreaterThan(0);
    expect.soft(path_(page), "戻った画面（デッキ検索・一覧）").toMatch(デッキ一覧のパスの形());
  });
});

// ---------------------------------------------------------------- 014 UTF-8 の応答と本文

caseTest("IT-M15-02-014", async ({ page, notes, step, expected }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-014〕");
  let l!: デッキ一覧;
  let w!: CSV出力の見張り;
  await step(1, async () => { l = await デッキIDを入れて検索する(page, [id]); });
  await step(2, async () => { w = new CSV出力の見張り(page); note(見張りの注記); });
  await step(3, async () => { await 選ぶ(l, [id]); await l.CSV出力.click(); await w.終わりを待つ(); });
  let 型 = "";
  let 中身: Buffer = Buffer.alloc(0);
  await step(4, async () => {
    型 = w.頭書き("Content-Type");
    if (w.ダウンロード.length) 中身 = await w.中身();
    w.止める();
    note(`応答の Content-Type「${型}」、ファイルの先頭3バイト ${[...中身.subarray(0, 3)].map((b) => b.toString(16).padStart(2, "0")).join(" ")}`);
  });
  await expected(async () => {
    expect.soft(型, "CSV出力の応答の Content-Type").toBe("text/csv;charset=UTF-8");
    expect.soft(BOMがある(中身), "ファイルの先頭が UTF-8 の BOM").toBe(true);
    const t = UTF8で読む(中身);
    expect.soft(t !== null, "BOM に続く本文を UTF-8 で読める").toBe(true);
    expect.soft((t ?? "").includes("M15-02日本語デッキ-014"), "UTF-8 で読んだ本文に日本語のデッキ名がある").toBe(true);
    expect.soft((t ?? "").includes(青白コントロール()), "UTF-8 で読んだ本文に日本語のアーキタイプ名がある").toBe(true);
  });
});

// ---------------------------------------------------------------- 016 一括編集の未保存の値は使われない

caseTest("IT-M15-02-016", async ({ page, notes, step, expected, db }) => {
  await login(page);
  const id = notes.get("〔デッキID-M1502-016〕");
  await step(1, async () => {
    void db;
    const v = 保存済みのフォーマットとアーキタイプ(id);
    expect(v.フォーマット名英, "保存済みのフォーマット（名(英)）").toBe("Standard");
    expect(v.アーキタイプ名日, "保存済みのアーキタイプ（名(日)）").toBe(青白コントロール());
  });
  let l!: デッキ一覧;
  await step(2, async () => { l = await デッキIDを入れて検索する(page, [id]); });
  await step(3, async () => { await 選ぶ(l, [id]); });
  const b = new デッキ一括編集(page);
  await step(4, async () => {
    await b.開く();
    await b.チェック("format", true);
    const 表示 = await 一括編集でフォーマットを選ぶ(b, 参照.ModernのID);
    await b.チェック("archetype", true);
    await b.アーキタイプを選ぶ(バーン());
    note(`一括編集の入力欄は変更チェックを付けると表示されるため、フォーマット・アーキタイプの変更チェックを付けてから選んだ。フォーマットはフォーマットID 2（Modern。選択肢の表示「${表示}」）を選んだ`);
  });
  let csv: ReturnType<typeof CSVを読む> = { 全行: [], 行: [] };
  await step(5, async () => {
    const w = await CSV出力を押す(l);
    if (w.ダウンロード.length) csv = CSVを読む(await w.中身());
    w.止める();
  });
  let 行: Record<string, string> | undefined;
  await step(6, async () => { 行 = csv.行.find((r) => r["デッキID"] === id); expect(行, `CSVにデッキID ${id} の行がある`).toBeTruthy(); });
  await expected(async () => {
    expect.soft(行?.["フォーマット"] ?? "", "CSVのフォーマット").toBe("Standard");
    expect.soft(行?.["アーキタイプ"] ?? "", "CSVのアーキタイプ").toBe(青白コントロール());
  });
});

// ---------------------------------------------------------------- 023 存在するIDと存在しないIDの混在（UTF-8）

caseTest("IT-M15-02-023", async ({ page, notes, step, expected }) => {
  await login(page);
  const A = notes.get("〔デッキID-M1502-023A〕"), B = notes.get("〔デッキID-M1502-023B〕");
  let l!: デッキ一覧;
  let w!: CSV出力の見張り;
  await step(1, async () => { l = await デッキIDを入れて検索する(page, [A, B]); });
  await step(2, async () => { w = new CSV出力の見張り(page); note(見張りの注記); });
  await step(3, async () => { await 選ぶ(l, [A, B]); });
  await step(4, async () => { await 選択の値を書き換える(l, B, "159999023"); });
  await step(5, async () => { await l.CSV出力.click(); await w.終わりを待つ(); });
  let 型 = "";
  let 中身: Buffer = Buffer.alloc(0);
  let csv: ReturnType<typeof CSVを読む> = { 全行: [], 行: [] };
  await step(6, async () => {
    型 = w.頭書き("Content-Type");
    if (w.ダウンロード.length) { 中身 = await w.中身(); csv = CSVを読む(中身); }
    w.止める();
    note(`応答の Content-Type「${型}」、ファイルの先頭3バイト ${[...中身.subarray(0, 3)].map((b) => b.toString(16).padStart(2, "0")).join(" ")}、データ行 ${csv.行.length}行`);
  });
  await expected(async () => {
    expect.soft(型, "CSV出力の応答の Content-Type").toBe("text/csv;charset=UTF-8");
    expect.soft(BOMがある(中身), "ファイルの先頭が UTF-8 の BOM").toBe(true);
    expect.soft(UTF8で読む(中身) !== null, "BOM に続く本文を UTF-8 で読める").toBe(true);
    expect.soft(デッキIDの列(csv.行), "見出し行に続くデータ行のデッキID（存在するデッキの1行だけ）").toEqual([A]);
    const a = csv.行.find((r) => r["デッキID"] === A);
    expect.soft(a?.["フォーマット"] ?? "", "デッキの行のフォーマット").toBe("Standard");
    expect.soft(a?.["アーキタイプ"] ?? "", "デッキの行のアーキタイプ").toBe(青白コントロール());
    expect.soft(a?.["メインリスト"] ?? "", "デッキの行のメインリスト").toBe("4 Lightning Bolt");
    expect.soft(csv.行.some((r) => (r["メインリスト"] ?? "").includes("3 Sol Ring")), "メインリスト 3 Sol Ring の行を含む").toBe(false);
    expect.soft(デッキIDの列(csv.行).includes("159999023"), "ID 159999023 の行を含む").toBe(false);
    expect.soft(デッキIDの列(csv.行).includes(B), `デッキID ${B} の行を含む`).toBe(false);
  });
});
