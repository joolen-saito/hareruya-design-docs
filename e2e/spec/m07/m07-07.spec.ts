/**
 * M07-07 買取商品一覧（キャンセル）CSV出力。正本: cases/M07-07_test_cases.tsv
 *
 * 実装したケース: 001・002・005・006・007・009・010・011・012・014（正本の10件すべて）。
 * 買取情報はすべて画面で作った実行の印つきのもの（seeds/m07-07.ts）。画面で指定できない買取明細の買取価格・状態、商品規格の状態は、
 * 印つきの買取・商品にだけ DB へ書いてある（シードの注記に残る）。
 * 決め打ちの商品コード・商品名・略称タグ・注文者名は実行ごとの印つきの値で作ってあり、ケースの文の同じ値も印つきの値として確かめる（lib/run_marker.ts）。
 * CSVの項目は左から数えた位置（識別ID順）で読む。キャンセル用のCSVは見出し行のあとに商品データ行が並ぶ。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVの全行, CSVの内容を画面の枠に出す, CSVの枠のセル, CSVの枠のデータ行, CSVの枠の列 } from "../../lib/evidence_other";
import { BuyListPage, CSVを読む } from "../../pages/admin/m07_buy";
import { 入庫待ちの番号, 記録を読む } from "../../db/m07_07";
import { M0707_ADMIN, 品コード, 品名, 注文者名, 略称タグ名 } from "../../seeds/m07-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type CSV = Awaited<ReturnType<typeof CSVを読む>>;
type 検索 = { 買取番号: string } | { 注文者名: string };
type 対象 = string[] | "全件";

/** CSVの項目（左から i 番目、0始まり）。行は見出し→値の組なので、見出しの順で読む */
const 項目 = (csv: CSV, r: Record<string, string> | undefined, i: number): string | undefined => (r ? r[csv.見出し[i]] : undefined);
const 商品名の行 = (csv: CSV, 商品名: string) => csv.行.filter((r) => 項目(csv, r, 2) === 商品名);

/** CSVの枠の、商品名の行の、左から i 番目（0始まり）の項目のセル。行が無ければ、無い行を指して確かめが落ちる */
const 枠の項目 = (page: import("@playwright/test").Page, csv: CSV, 商品名: string, i: number) =>
  CSVの枠のセル(page, 0, csv.行.findIndex((r) => 項目(csv, r, 2) === 商品名), csv.見出し[i]);
/** CSVの枠の、商品名の項目（第3項目）の列のうち、その商品名のセル（行の数を確かめる） */
const 枠の商品名 = (page: import("@playwright/test").Page, csv: CSV, 商品名: string) =>
  CSVの枠の列(page, 0, csv.見出し[2]).filter({ hasText: new RegExp(`^${商品名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) });
/** 金額・数の値（CSVは「1200」でも「1200.00」でも同じ） */
const 数値 = (n: number) => new RegExp(`^${n}(\\.0+)?$`);

/** 手順1〜5（ログイン・開く・検索・対象にチェック・ダウンロードの項目を押す・CSVを開く） */
async function 標準手順(ctx: CaseCtx, 検索: 検索, 対象: 対象, 押す前?: () => Promise<void>): Promise<CSV> {
  const { page, notes, step } = ctx;
  const l = new BuyListPage(page);
  let file: Awaited<ReturnType<BuyListPage["ダウンロードを押す"]>>["file"] = null;
  let csv: CSV | null = null;
  await step(1, async () => { await loginAdmin(page, M0707_ADMIN); });
  await step(2, async () => {
    await l.open();
    if ("買取番号" in 検索) await l.買取番号を入れる(notes.get(検索.買取番号)); else await l.注文者名を入れる(検索.注文者名);
    await l.検索する();
  });
  await step(3, async () => {
    if (対象 === "全件") await l.全選択のチェック().check();
    else for (const k of 対象) await l.対象にする(notes.get(k));
  });
  await step(4, async () => {
    if (押す前) await 押す前();
    file = (await l.ダウンロードを押す("買取商品（キャンセル）CSV")).file;
  });
  await step(5, async () => {
    expect(file, "CSVのダウンロード").not.toBeNull();
    csv = await CSVを読む(file!);
    await l.ダウンロードの選択肢を閉じる();
    await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${file!.suggestedFilename()}`, 行: CSVの全行(csv) }]);
  });
  return csv!;
}

caseTest("IT-M07-07-001", async (ctx) => {
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0707-001〕" }, ["〔買取番号-M0707-001〕"]);
  await ctx.expected(async () => {
    const n = 品名("001"), g = (i: number) => 枠の項目(ctx.page, csv, n, i);
    await expect.soft(枠の商品名(ctx.page, csv, n), "商品名M0707-001-Pの行の数").toHaveCount(1);
    await expect.soft(ctx.page.locator('#e2e-csv-note [data-csv-table="0"] th[data-csv-head]'), "CSVの項目数（識別ID1〜9）").toHaveCount(9);
    await expect.soft(g(0), "第1項目 商品コード").toHaveText(品コード("001"));
    await expect.soft(g(2), "第3項目 商品名").toHaveText(n);
    await expect.soft(g(3), "第4項目 基準価格（販売価格）").toHaveText(数値(1200));
    await expect.soft(g(4), "第5項目 買取価格").toHaveText(数値(450));
    await expect.soft(g(5), "第6項目 言語ID").toHaveText("2");
    await expect.soft(g(6), "第7項目 略称タグ").toHaveText(略称タグ名("001"));
    await expect.soft(g(7), "第8項目 レアリティ").toHaveText("M");
    await expect.soft(g(8), "第9項目 状態").toHaveText("NM");
  });
  note("金額は数値として比べた（CSVは「1200」でも「1200.00」でも同じ）。ケースの文の識別ID1〜9の順は、CSVの左から1〜9番目の項目として読んだ（第2項目のキャンセル数は014で確かめる）");
});

caseTest("IT-M07-07-002", async (ctx) => {
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0707-002〕" }, ["〔買取番号-M0707-002〕"]);
  await ctx.expected(async () => {
    const n = 品名("002"), g = (i: number) => 枠の項目(ctx.page, csv, n, i);
    await expect.soft(枠の商品名(ctx.page, csv, n), "商品名M0707-002-Pの行の数").toHaveCount(1);
    await expect.soft(g(0), "商品コード").toHaveText(品コード("002"));
    await expect.soft(g(3), "販売価格").toHaveText(数値(300));
    await expect.soft(g(4), "買取価格").toHaveText(数値(100));
    await expect.soft(g(5), "言語ID").toHaveText("1");
    await expect.soft(g(6), "略称タグ").toHaveText(略称タグ名("002"));
    await expect.soft(g(7), "レアリティ").toHaveText("C");
    await expect.soft(g(8), "状態").toHaveText("SP");
  });
  note("状態SPの買取明細はフロントから申し込めない（買取カートは状態NMだけ）ので、NMで申し込んだあと、商品規格の状態と買取明細の状態・買取価格をDBで SP・100 にした（印つきの商品・買取だけ）");
});

caseTest("IT-M07-07-005", async (ctx) => {
  const csv = await 標準手順(ctx, { 注文者名: 注文者名("005") }, ["〔買取番号-M0707-005A〕"]);
  await ctx.expected(async () => {
    await expect.soft(CSVの枠のデータ行(ctx.page, 0), "CSVの商品データ行の数").toHaveCount(1);
    await expect.soft(CSVの枠のセル(ctx.page, 0, 0, csv.見出し[2]), "商品データ行の商品名").toHaveText(品名("005", "1"));
  });
});

caseTest("IT-M07-07-006", async (ctx) => {
  const csv = await 標準手順(ctx, { 注文者名: 注文者名("006") }, ["〔買取番号-M0707-006A〕", "〔買取番号-M0707-006B〕"]);
  await ctx.expected(async () => {
    await expect.soft(CSVの枠のデータ行(ctx.page, 0), "CSVの商品データ行の数").toHaveCount(1);
    await expect.soft(CSVの枠のセル(ctx.page, 0, 0, csv.見出し[2]), "商品データ行の商品名").toHaveText(品名("006", "1"));
    await expect.soft(枠の商品名(ctx.page, csv, 品名("006", "2")), "キャンセル済みの買取の商品M0707-006-P2の行の数").toHaveCount(0);
  });
});

caseTest("IT-M07-07-007", async (ctx) => {
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0707-007〕" }, ["〔買取番号-M0707-007〕"]);
  await ctx.expected(async () => {
    await expect.soft(CSVの枠のデータ行(ctx.page, 0), "CSVの商品データ行の数").toHaveCount(1);
    await expect.soft(CSVの枠のセル(ctx.page, 0, 0, csv.見出し[2]), "商品データ行の商品名").toHaveText(品名("007", "1"));
  });
  note("P3の売却は空欄（未定）のまま、査定確定・保存した");
});

caseTest("IT-M07-07-009", async (ctx) => {
  const csv = await 標準手順(ctx, { 注文者名: 注文者名("009") }, "全件");
  await ctx.expected(async () => {
    await expect.soft(CSVの枠のデータ行(ctx.page, 0), "CSVの商品データ行の数").toHaveCount(2);
    await expect.soft(枠の商品名(ctx.page, csv, 品名("009", "1")), "商品名M0707-009-P1の行の数").toHaveCount(1);
    await expect.soft(枠の商品名(ctx.page, csv, 品名("009", "2")), "商品名M0707-009-P2の行の数").toHaveCount(1);
  });
});

caseTest("IT-M07-07-010", async ({ page, notes, step, expected }) => {
  const l = new BuyListPage(page);
  let r: Awaited<ReturnType<BuyListPage["ダウンロードを押す"]>> | null = null;
  let チェック数 = -1;
  await step(1, async () => { await loginAdmin(page, M0707_ADMIN); });
  await step(2, async () => { await l.open(); await l.買取番号を入れる(notes.get("〔買取番号-M0707-010〕")); await l.検索する(); });
  await step(3, async () => {
    // どのチェックボックスもチェックしない（検索結果の行のチェックが付いていないことを確かめる）
    await expect(l.行の(notes.get("〔買取番号-M0707-010〕")), "検索結果の買取番号M0707-010の行").toHaveCount(1);
    チェック数 = await page.locator('input[type="checkbox"]:checked').count();
  });
  await step(4, async () => { r = await l.ダウンロードを押す("買取商品（キャンセル）CSV"); });
  await expected(async () => {
    expect.soft(チェック数, "チェックを付けた「買取情報の選択」の数").toBe(0);
    expect.soft(r!.ダイアログ.length, "警告が表示された数").toBeGreaterThan(0);
    expect.soft(r!.file, "ダウンロードされたCSV").toBeNull();
  });
  note(`警告の文: ${r!.ダイアログ.join(" / ")}`);
});

caseTest("IT-M07-07-012", async (ctx) => {
  const 番号 = () => ctx.notes.get("〔買取番号-M0707-012〕");
  const 前: { v?: ReturnType<typeof 記録を読む> } = {};
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0707-012〕" }, ["〔買取番号-M0707-012〕"], async () => { 前.v = 記録を読む(番号(), 品コード("012")); });
  const 後 = 記録を読む(番号(), 品コード("012"));
  await ctx.expected(async () => {
    await expect.soft(枠の商品名(ctx.page, csv, 品名("012")), "CSVの商品名M0707-012-Pの行の数").toHaveCount(1);
    for (const [時点, v] of [["CSV出力の前", 前.v], ["CSV出力の後", 後]] as const) {
      expect.soft(v?.買取状況, `${時点}の買取状況（入庫待ち）`).toBe(入庫待ちの番号);
      expect.soft(v?.数量, `${時点}の買取明細の数量`).toBe(2);
      expect.soft(v?.買取価格, `${時点}の買取明細の買取価格`).toBe(450);
      expect.soft(v?.売却, `${時点}の買取明細の売却状態（しない）`).toBe(false);
      expect.soft(v?.基準価格, `${時点}の商品規格の基準価格`).toBe(1200);
      expect.soft(v?.在庫数, `${時点}の商品規格の在庫数`).toBe(10);
      expect.soft(v?.買取情報の件数, `${時点}の買取情報の件数`).toBe(1);
      expect.soft(v?.明細の件数, `${時点}の買取明細の件数`).toBe(1);
    }
    expect.soft(後, "CSV出力の前後で、買取情報・買取明細・商品規格・在庫が変わらない").toEqual(前.v);
  });
  note("CSV出力の前の値は、手順4でダウンロードの項目を押す直前にDBから読んだ。在庫数は商品規格の全店舗の在庫の合計（入庫は本店のEC-CUBE在庫に10）");
});

caseTest("IT-M07-07-014", async (ctx) => {
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0707-014〕" }, ["〔買取番号-M0707-014〕"]);
  await ctx.expected(async () => {
    await expect.soft(枠の商品名(ctx.page, csv, 品名("014")), "商品名M0707-014-Pの行の数").toHaveCount(1);
    await expect.soft(枠の項目(ctx.page, csv, 品名("014"), 1), "第2項目 キャンセル数（買取明細の数量と同じ）").toHaveText(数値(1));
  });
});

caseTest("IT-M07-07-011", async ({ page, step, expected }) => {
  const l = new BuyListPage(page);
  await step(1, async () => { await loginAdmin(page, M0707_ADMIN); });
  await step(2, async () => { await l.open(); await l.買取番号を入れる("7077111"); await l.検索する(); });
  await step(3, async () => { await expect(l.検索フォーム(), "検索結果の画面").toBeVisible(); });
  await expected(async () => {
    expect.soft((await l.行()).length, "買取番号7077111の検索結果の行数").toBe(0);
    await expect.soft(l.ダウンロードのボタン(), "「ダウンロード▼」が表示されない").toHaveCount(0);
    await expect.soft(page.getByRole("button", { name: "買取商品（キャンセル）CSV" }), "「買取商品（キャンセル）CSV」が表示されない").toHaveCount(0);
  });
});
