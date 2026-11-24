/**
 * M07-06 買取商品一覧CSV出力 のうち、あとから足したケース（002・005・006・011）。正本: cases/M07-06_test_cases.tsv
 * 既存の spec/m07/m07-06.spec.ts は変えず、同じ部品で書き足した（シードは seeds/m07-06-e.ts）。
 *
 * 画面で作れない状態（状態SP・状態未設定・個別入力商品・更新日時・在庫数）は、シードが、実行の印つきの買取・商品規格にだけDBで書いて作った。
 * 買取番号は画面が振った番号を控えて使う（シード表の固定の買取番号は画面で決められない）。
 * 実装していないケース（010）: 同じ商品に、商品コードありの規格（状態NM・SP）と商品コードなしの規格（状態NM）を並べ、商品IDの大小も指定する作りで、
 * 規格の重複（同じ商品・言語・状態の規格を2件）を画面で作れないため、書かなかった（記録 review/M07_unwritten_2026-11-24_dev.md）。
 * 決め打ちの商品コード・商品名・注文者名は実行ごとの印つきの値（lib/run_marker.ts）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVの内容を画面の枠に出す, CSVの枠のセル } from "../../lib/evidence_other";
import { BuyListPage, CSVを読む } from "../../pages/admin/m07_buy";
import { M0706_ADMIN } from "../../seeds/m07-06";
import { 個別カード名005, 控え005, 品コードE, 品名E, 読んだ前提E } from "../../seeds/m07-06-e";
import { 買取の状態を読む } from "../../db/m07_w";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type CSV = Awaited<ReturnType<typeof CSVを読む>> & { ファイル名: string };

async function 読む(file: import("@playwright/test").Download | null): Promise<CSV> {
  expect(file, "CSVのダウンロード").not.toBeNull();
  const csv = await CSVを読む(file!);
  return { ...csv, ファイル名: file!.suggestedFilename() };
}

/** 読んだCSV（ファイル名・見出し・データ行）を画面の枠に書き出して残す。ダウンロードの選択肢は先に閉じる。続く確かめはこの枠の要素で行う */
async function CSVを枠に出す(page: Page, csv: CSV, l: BuyListPage): Promise<void> {
  await l.ダウンロードの選択肢を閉じる();
  await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${csv.ファイル名}`, 行: [csv.見出し, ...csv.行.map((r) => csv.見出し.map((k) => r[k] ?? ""))] }]);
}

/** CSVの枠の、列が「商品名」の値の行のセル */
function 名前の行のセル(page: Page, csv: CSV, 商品名: string, 列: string) {
  return CSVの枠のセル(page, 0, csv.行.findIndex((r) => r["商品名"] === 商品名), 列);
}

/** 手順1〜5（一覧を開く・買取番号で検索・チェック・買取商品一覧CSV・CSVを開く） */
async function 手順1から5(ctx: CaseCtx, 呼び名: string, 番号を直接?: () => string): Promise<CSV> {
  const { page, notes, step } = ctx;
  const 番号 = (): string => (番号を直接 ? 番号を直接() : notes.get(呼び名));
  await loginAdmin(page, M0706_ADMIN);
  const l = new BuyListPage(page);
  let file: import("@playwright/test").Download | null = null;
  let csv: CSV | null = null;
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(番号()); await l.検索する(); });
  await step(3, async () => { await l.対象にする(番号()); });
  await step(4, async () => { file = (await l.ダウンロードを押す("買取商品一覧CSV")).file; });
  await step(5, async () => { csv = await 読む(file); await CSVを枠に出す(page, csv, l); });
  return csv!;
}

caseTest("IT-M07-06-002", async (ctx) => {
  const csv = await 手順1から5(ctx, "〔買取番号-M0706-002〕");
  const p = 読んだ前提E();
  const A = 品名E("002", "A"), B = 品名E("002", "B");
  await ctx.expected(async () => {
    const a = csv.行.filter((r) => r["商品コード"] === 品コードE("002", "A")), b = csv.行.filter((r) => r["商品コード"] === 品コードE("002", "B"));
    expect.soft(a.length, "商品コードM0706-002-Aの行の数").toBe(1);
    expect.soft(b.length, "商品コードM0706-002-Bの行の数").toBe(1);
    await expect.soft(名前の行のセル(ctx.page, csv, A, "商品名"), "商品コードM0706-002-Aの行の商品名").toHaveText(A);
    await expect.soft(名前の行のセル(ctx.page, csv, A, "略称タグ"), "商品コードM0706-002-Aの行の略称タグ（TAGA）").toHaveText(p.略称タグ[0]);
    await expect.soft(名前の行のセル(ctx.page, csv, A, "レアリティ"), "商品コードM0706-002-Aの行のレアリティ").toHaveText("M");
    await expect.soft(名前の行のセル(ctx.page, csv, A, "状態"), "商品コードM0706-002-Aの行の状態").toHaveText("NM");
    await expect.soft(名前の行のセル(ctx.page, csv, B, "商品名"), "商品コードM0706-002-Bの行の商品名").toHaveText(B);
    await expect.soft(名前の行のセル(ctx.page, csv, B, "略称タグ"), "商品コードM0706-002-Bの行の略称タグ（TAGB）").toHaveText(p.略称タグ[1]);
    await expect.soft(名前の行のセル(ctx.page, csv, B, "レアリティ"), "商品コードM0706-002-Bの行のレアリティ").toHaveText("C");
    await expect.soft(名前の行のセル(ctx.page, csv, B, "状態"), "商品コードM0706-002-Bの行の状態").toHaveText("SP");
  });
  note(`略称タグ「TAGA」「TAGB」は新しく作らず、略称タグの一覧の先頭の既存「${p.略称タグ[0]}」・2番目の既存「${p.略称タグ[1]}」で代えた。状態SPの明細は、申込のあと実行の印つきの買取・商品規格にDBで作った（シードの報告参照）`);
});

caseTest("IT-M07-06-005", async (ctx) => {
  const csv = await 手順1から5(ctx, "", () => 控え005.get("買取番号") ?? "");
  const 名 = 個別カード名005();
  await ctx.expected(async () => {
    expect.soft(csv.行.filter((r) => r["商品名"] === 名).length, "商品名「M0706-005-個別カード」の行の数").toBe(1);
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "商品コード"), "商品コードが空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "販売価格"), "販売価格が空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "略称タグ"), "略称タグが空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "レアリティ"), "レアリティが空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "状態"), "状態が空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "言語ID"), "言語ID（1）").toHaveText("1");
  });
  note("個別入力商品は画面で作れないので、シードが、実行の印つきの買取にDBで足した（査定金額はシード表に無いので1000円。CSVの確かめ項目には出ない）。買取番号706005001は画面で決められないので、画面が振った番号を使った");
});

caseTest("IT-M07-06-006", async (ctx) => {
  const csv = await 手順1から5(ctx, "〔買取番号-M0706-006〕");
  const 名 = 品名E("006", "A");
  await ctx.expected(async () => {
    expect.soft(csv.行.filter((r) => r["商品名"] === 名).length, "商品名「M0706-006-カードA」の行の数").toBe(1);
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "商品コード"), "商品コードが空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "販売価格"), "販売価格が空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "略称タグ"), "略称タグが空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "レアリティ"), "レアリティが空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "状態"), "状態が空").toHaveText("");
    await expect.soft(名前の行のセル(ctx.page, csv, 名, "言語ID"), "言語ID（日本語の1）").toHaveText("1");
  });
  note("買取明細の状態を未設定にする画面は無いので、シードが、実行の印つきの買取の明細にDBで作った。略称タグTAGB・レアリティCは、シード表の定めどおり商品に付けてある");
});

caseTest("IT-M07-06-011", async (ctx) => {
  const { page, notes, step } = ctx;
  const コード = 品コードE("011", "A");
  const 番号 = () => notes.get("〔買取番号-M0706-011〕");
  await loginAdmin(page, M0706_ADMIN);
  const l = new BuyListPage(page);
  let 前!: ReturnType<typeof 買取の状態を読む>;
  let 後!: ReturnType<typeof 買取の状態を読む>;
  let file: import("@playwright/test").Download | null = null;
  await step(1, async () => { 前 = 買取の状態を読む(番号(), コード); });
  await step(2, async () => { await l.open(); });
  await step(3, async () => { await l.買取番号を入れる(番号()); await l.検索する(); });
  await step(4, async () => { await l.対象にする(番号()); });
  await step(5, async () => { file = (await l.ダウンロードを押す("買取商品一覧CSV")).file; });
  await step(6, async () => { 後 = 買取の状態を読む(番号(), コード); });
  await ctx.expected(async () => {
    expect.soft(file !== null, "買取商品一覧CSVがダウンロードされた（出力した）").toBe(true);
    expect.soft(前.買取状況, "出力前のDBの買取状況（注文）").toBe("1");
    expect.soft(後.買取状況, "出力後のDBの買取状況（注文のまま）").toBe("1");
    expect.soft(前.更新日時, "出力前のDBの更新日時").toBe("2026/09/01 10:00:00");
    expect.soft(後.更新日時, "出力後のDBの更新日時（変わらない）").toBe("2026/09/01 10:00:00");
    expect.soft(前.明細の個数, "出力前のDBの買取明細の個数").toBe(4);
    expect.soft(後.明細の個数, "出力後のDBの買取明細の個数（変わらない）").toBe(4);
    expect.soft(前.在庫数, "出力前のDBの商品規格の在庫数").toBe(20);
    expect.soft(後.在庫数, "出力後のDBの商品規格の在庫数（変わらない）").toBe(20);
  });
  note("更新日時・在庫数は画面で指定できないので、シードが、画面の操作がすべて済んだあと、実行の印つきの買取・商品規格にDBで設定した。買取状況は番号（1＝注文）で確かめた");
});
