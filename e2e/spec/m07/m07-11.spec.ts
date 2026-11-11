/**
 * M07-11 買取商品履歴CSV出力。正本: cases/M07-11_test_cases.tsv
 *
 * 決め打ちの商品コード・商品名・査定担当者は実行の印つきの値で作ってあり、ケースの文の同じ値も印つきの値として確かめる（lib/run_marker.ts）。
 * 買取番号・会員IDは、シードが画面で振られた番号を控えたものを使う（シード表の固定の値は画面で決められない）。
 * 実装していないケース: IT-M07-11-011（会員ID 20711011 と 207110110 は画面で振る会員IDなので、前方一致の取り違えを確かめる固定の値を作れない）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVを読む } from "../../pages/admin/m07_buy";
import { HistoryPage, 金額の数, 履歴の行 } from "../../pages/admin/m07_10_history";
import { 買取の中身を読む } from "../../db/m07_10";
import { 会員の呼び名, M0711_ADMIN, 買取番号の呼び名, 品コード, 品名, 担当名 } from "../../seeds/m07-11";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 番号 = (s: string): number => Number(s.replace(/\D/g, ""));
/** 日付（2026-08-04・2026/08/04・日時つきなど）の年月日を YYYY-MM-DD にそろえる。読めなければ元の文字 */
const 日付 = (s: string): string => {
  const m = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(s);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : s;
};
type CSVの行 = Record<string, string>;
const コードの行 = (rows: CSVの行[], コード: string): CSVの行 | undefined => rows.find((r) => r["商品コード"] === コード);

/** 買取番号で検索して「検索結果全件取得」までを行う共通の手順1〜（検索結果の画面の行も返す） */
async function 買取番号で検索する(ctx: { page: import("@playwright/test").Page; notes: { get(k: string): string }; step: (n: number, f: () => Promise<void>) => Promise<void> }, n: string): Promise<HistoryPage> {
  const { page, notes, step } = ctx;
  const h = new HistoryPage(page);
  await step(1, async () => { await loginAdmin(page, M0711_ADMIN); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { await h.買取番号を入れる(String(番号(notes.get(買取番号の呼び名(n))))); await h.検索する(); });
  return h;
}

caseTest("IT-M07-11-002", async (ctx) => {
  const { notes, step, expected } = ctx;
  const h = await 買取番号で検索する(ctx, "002");
  let csv: CSVの行[] = [];
  await step(4, async () => { expect((await h.行()).length, "検索結果画面に行が表示される").toBeGreaterThan(0); });
  await step(5, async () => { csv = (await CSVを読む(await h.CSVをダウンロードする("検索結果全件取得"))).行; });
  let 行: CSVの行 | undefined;
  await step(6, async () => { 行 = コードの行(csv, 品コード("002", "P")); });
  await expected(async () => {
    note("買取番号・会員IDはシードが画面で振られた値を控えて使った（シード表の買取番号 10711002 は画面で決められない）。商品コード・商品名・査定担当者は実行の印つきの値");
    expect.soft(行 !== undefined, `商品コード ${品コード("002", "P")} の行がCSVにある`).toBe(true);
    expect.soft(番号(行?.["買取番号"] ?? ""), "買取番号").toBe(番号(notes.get(買取番号の呼び名("002"))));
    expect.soft(行?.["会員ID"], "会員ID").toBe(notes.get(会員の呼び名("002")));
    expect.soft(行?.["商品名"], "商品名").toBe(品名("002", ""));
    expect.soft(行?.["査定担当者"], "査定担当者").toBe(担当名("002"));
  });
});

caseTest("IT-M07-11-003", async (ctx) => {
  const { step, expected } = ctx;
  const h = await 買取番号で検索する(ctx, "003");
  const コード = 品コード("003", "P");
  let 画面: 履歴の行 | undefined;
  let csv: CSVの行[] = [];
  await step(4, async () => { expect((await h.行()).length, "検索結果画面に行が表示される").toBeGreaterThan(0); });
  await step(5, async () => { 画面 = (await h.行()).find((r) => r.商品コード === コード); });
  await step(6, async () => { csv = (await CSVを読む(await h.CSVをダウンロードする("検索結果全件取得"))).行; });
  let 行: CSVの行 | undefined;
  await step(7, async () => { 行 = コードの行(csv, コード); });
  await expected(async () => {
    note("金額は「4,300」のように桁区切りで表示されることがあるので、数字だけを取り出して比べた");
    expect.soft(画面 !== undefined && 行 !== undefined, "検索結果画面とCSVの両方に商品コードの行がある").toBe(true);
    expect.soft(金額の数(行?.["基準価格"] ?? ""), "CSVの基準価格").toBe(4300);
    expect.soft(金額の数(画面?.基準価格 ?? ""), "検索結果画面の基準価格").toBe(4300);
    expect.soft(金額の数(行?.["基準価格"] ?? ""), "CSVの基準価格が検索結果画面の表示と同じ").toBe(金額の数(画面?.基準価格 ?? ""));
  });
});

caseTest("IT-M07-11-004", async (ctx) => {
  const { step, expected } = ctx;
  const h = await 買取番号で検索する(ctx, "004");
  const コード = 品コード("004", "P");
  let 画面: 履歴の行 | undefined;
  let csv: CSVの行[] = [];
  await step(4, async () => { expect((await h.行()).length, "検索結果画面に行が表示される").toBeGreaterThan(0); });
  await step(5, async () => { 画面 = (await h.行()).find((r) => r.商品コード === コード); });
  await step(6, async () => { csv = (await CSVを読む(await h.CSVをダウンロードする("検索結果全件取得"))).行; });
  let 行: CSVの行 | undefined;
  await step(7, async () => { 行 = コードの行(csv, コード); });
  await expected(async () => {
    note("金額は「1,650」のように桁区切りで表示されることがあるので、数字だけを取り出して比べた");
    expect.soft(画面 !== undefined && 行 !== undefined, "検索結果画面とCSVの両方に商品コードの行がある").toBe(true);
    expect.soft(金額の数(行?.["買取価格"] ?? ""), "CSVの買取価格").toBe(1650);
    expect.soft(金額の数(画面?.買取価格 ?? ""), "検索結果画面の買取価格").toBe(1650);
    expect.soft(金額の数(行?.["買取価格"] ?? ""), "CSVの買取価格が検索結果画面の表示と同じ").toBe(金額の数(画面?.買取価格 ?? ""));
  });
});

caseTest("IT-M07-11-005", async (ctx) => {
  const { step, expected } = ctx;
  const h = await 買取番号で検索する(ctx, "005");
  const コード = 品コード("005", "P");
  let 画面: 履歴の行 | undefined;
  let csv: CSVの行[] = [];
  await step(4, async () => { expect((await h.行()).length, "検索結果画面に行が表示される").toBeGreaterThan(0); });
  await step(5, async () => { 画面 = (await h.行()).find((r) => r.商品コード === コード); });
  await step(6, async () => { csv = (await CSVを読む(await h.CSVをダウンロードする("検索結果全件取得"))).行; });
  let 行: CSVの行 | undefined;
  await step(7, async () => { 行 = コードの行(csv, コード); });
  await expected(async () => {
    note("買取数は「買取情報に紐づく明細の数」（買取明細3件で3）。数量（2・4・1）の合計ではない");
    expect.soft(画面 !== undefined && 行 !== undefined, "検索結果画面とCSVの両方に商品コードの行がある").toBe(true);
    expect.soft(画面?.買取数, "検索結果画面の買取数").toBe("3");
    expect.soft(行?.["買取数"], "CSVの買取数").toBe("3");
    expect.soft(行?.["買取数"], "CSVの買取数が検索結果画面の表示と同じ").toBe(画面?.買取数);
  });
});

caseTest("IT-M07-11-008", async (ctx) => {
  const { step, expected } = ctx;
  const h = await 買取番号で検索する(ctx, "008");
  const コード = 品コード("008", "P");
  let 画面: 履歴の行 | undefined;
  let csv: CSVの行[] = [];
  await step(4, async () => { expect((await h.行()).length, "検索結果画面に行が表示される").toBeGreaterThan(0); });
  await step(5, async () => { 画面 = (await h.行()).find((r) => r.商品コード === コード); });
  await step(6, async () => { csv = (await CSVを読む(await h.CSVをダウンロードする("検索結果全件取得"))).行; });
  let 行: CSVの行 | undefined;
  await step(7, async () => { 行 = コードの行(csv, コード); });
  await expected(async () => {
    note("振込完了日は日付の値として比べた（表示の区切りや時刻の有無は問わず、年月日を YYYY-MM-DD にそろえた）");
    expect.soft(画面 !== undefined && 行 !== undefined, "検索結果画面とCSVの両方に商品コードの行がある").toBe(true);
    expect.soft(日付(画面?.振込完了日 ?? ""), "検索結果画面の振込完了日").toBe("2026-08-04");
    expect.soft(日付(行?.["振込完了日"] ?? ""), "CSVの振込完了日").toBe("2026-08-04");
    expect.soft(日付(行?.["振込完了日"] ?? ""), "CSVの振込完了日が検索結果画面の表示と同じ日付").toBe(日付(画面?.振込完了日 ?? ""));
  });
});

caseTest("IT-M07-11-009", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const h = new HistoryPage(page);
  const 会員ID = () => notes.get(会員の呼び名("009"));
  let csv: CSVの行[] = [];
  await step(1, async () => { await loginAdmin(page, M0711_ADMIN); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { await h.会員IDを入れる(会員ID()); await h.検索する(); });
  await step(4, async () => { await h.件数を選ぶ(10); });
  await step(5, async () => { csv = (await CSVを読む(await h.CSVをダウンロードする("検索結果全件取得"))).行; });
  let 対象: CSVの行[] = [];
  await step(6, async () => { 対象 = csv.filter((r) => r["会員ID"] === 会員ID()); });
  await expected(async () => {
    note("画面の件数は10件でも、CSVは検索結果全件（11件）が出力される。会員IDで行を数えた");
    expect.soft(対象.length, "会員IDの行の数").toBe(11);
    const 期待 = Array.from({ length: 11 }, (_, i) => 品コード("009", `P${String(i + 1).padStart(2, "0")}`)).sort();
    expect.soft(対象.map((r) => r["商品コード"]).sort(), "商品コード（P01〜P11の11件）").toEqual(期待);
  });
});

caseTest("IT-M07-11-010", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const h = new HistoryPage(page);
  const 会員ID = () => notes.get(会員の呼び名("010"));
  let csv: CSVの行[] = [];
  await step(1, async () => { await loginAdmin(page, M0711_ADMIN); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { await h.会員IDを入れる(会員ID()); await h.検索する(); });
  await step(4, async () => { await h.対象にする(品コード("010", "P1")); await h.対象にする(品コード("010", "P2")); });
  await step(5, async () => { csv = (await CSVを読む(await h.CSVをダウンロードする("検索結果全件取得"))).行; });
  let 対象: CSVの行[] = [];
  await step(6, async () => { 対象 = csv.filter((r) => r["会員ID"] === 会員ID()); });
  await expected(async () => {
    note("対象のチェックを付けても、「検索結果全件取得」は検索結果全件（5件）が出力される");
    expect.soft(対象.length, "会員IDの行の数").toBe(5);
    const 期待 = [1, 2, 3, 4, 5].map((i) => 品コード("010", `P${i}`)).sort();
    expect.soft(対象.map((r) => r["商品コード"]).sort(), "商品コード（P1〜P5の5件）").toEqual(期待);
  });
});

caseTest("IT-M07-11-013", async (ctx) => {
  const { page, notes, db, step, expected } = ctx;
  const h = new HistoryPage(page);
  const 番 = () => notes.get(買取番号の呼び名("013"));
  let 前: ReturnType<typeof 買取の中身を読む> | null = null, 後: ReturnType<typeof 買取の中身を読む> | null = null;
  let csv: CSVの行[] = [];
  await step(1, async () => { await loginAdmin(page, M0711_ADMIN); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { 前 = 買取の中身を読む(db.query, 番()); await h.買取番号を入れる(String(番号(番()))); await h.検索する(); });
  await step(4, async () => { expect((await h.行()).length, "検索結果画面に行が表示される").toBeGreaterThan(0); });
  await step(5, async () => { csv = (await CSVを読む(await h.CSVをダウンロードする("検索結果全件取得"))).行; });
  await step(6, async () => { expect(コードの行(csv, 品コード("013", "P")) !== undefined, "CSVに商品コードの行がある").toBe(true); });
  await step(7, async () => { 後 = 買取の中身を読む(db.query, 番()); });
  await expected(async () => {
    note("「商品の在庫数量」は、買取の実在庫の数量（シード表の変更後数量15）として確かめた。出力の前後で変わらないことも確かめた");
    expect.soft(後?.実在庫履歴の件数, "実在庫履歴の件数").toBe(1);
    expect.soft(後?.買取明細の件数, "買取明細の件数").toBe(1);
    expect.soft(後?.実在庫の数量, "実在庫の数量（15のまま）").toBe(15);
    expect.soft(後, "CSV出力の前後で変わらない").toEqual(前);
  });
});

caseTest("IT-M07-11-014", async (ctx) => {
  const { step, expected } = ctx;
  const h = await 買取番号で検索する(ctx, "014");
  const コード = 品コード("014", "P");
  let csv: CSVの行[] = [];
  await step(4, async () => { expect((await h.行()).length, "検索結果画面に行が表示される").toBeGreaterThan(0); });
  await step(5, async () => { csv = (await CSVを読む(await h.CSVをダウンロードする("検索結果全件取得"))).行; });
  let 行: CSVの行 | undefined;
  await step(6, async () => { 行 = コードの行(csv, コード); });
  await expected(async () => {
    note("金額は桁区切りがあっても数字だけを取り出して比べた");
    expect.soft(行 !== undefined, `商品コード ${コード} の行がCSVにある`).toBe(true);
    expect.soft(金額の数(行?.["買取価格"] ?? ""), "買取価格（実際の買取単価）").toBe(1500);
    expect.soft(金額の数(行?.["買取価格"] ?? "") === 1800, "買取価格が商品設定の買取価格 1800 になっている").toBe(false);
  });
});
