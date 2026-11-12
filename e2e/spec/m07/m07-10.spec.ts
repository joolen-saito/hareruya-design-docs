/**
 * M07-10 買取商品履歴(検索入力・検索結果)。正本: cases/M07-10_test_cases.tsv
 *
 * 決め打ちの商品コードは実行の印つきの値で作ってあり、ケースの文の同じ値も印つきの値として確かめる（lib/run_marker.ts）。
 * 買取番号・会員IDは、シードが画面で振られた番号を控えたものを使う。
 * 検索の絞り込みは共有の環境のほかの買取履歴も出うるので、「この商品の行だけ」「この商品の行は出ない」は、このケースの商品コードの行について確かめる。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVを読む } from "../../pages/admin/m07_buy";
import { HistoryPage, 金額の数, 状況の名前, 履歴の行 } from "../../pages/admin/m07_10_history";
import { M0710_ADMIN } from "../../seeds/m07-10";
import { 買取の中身を読む } from "../../db/m07_10";
import { rc } from "../../lib/run_marker";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 品 = (n: string, 枝: string): string => rc(`M0710-${n}-${枝}`);
const 番号 = (s: string): number => Number(s.replace(/\D/g, ""));
const 番号の呼び名 = (n: string): string => `〔買取番号-M0710-${n}〕`;
const 会員の呼び名 = (n: string): string => `〔会員ID-M0710-${n}〕`;

/** 結果の行のうち、与えた商品コードの行 */
const コードの行 = (rows: 履歴の行[], コード: string[]): 履歴の行[] => rows.filter((r) => コード.includes(r.商品コード));

caseTest("IT-M07-10-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let 値: Record<string, string> = {};
  let ステータス = { 選択肢: 0, 付いた: -1 }, 言語 = { 選択肢: 0, 付いた: -1 }, 状態 = { 選択肢: 0, 付いた: -1 };
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    値 = await h.入力欄の値();
    ステータス = { 選択肢: (await h.ステータスの選択肢()).length, 付いた: await h.ステータスの付いた数() };
    言語 = { 選択肢: (await h.言語の選択肢()).length, 付いた: await h.言語の付いた数() };
    状態 = { 選択肢: (await h.状態の選択肢()).length, 付いた: await h.状態の付いた数() };
  });
  await expected(async () => {
    for (const k of h.入力欄の項目) expect.soft(値[k], `入力欄 ${k} の値（空欄）`).toBe("");
    expect.soft(ステータス.選択肢, "ステータスのチェックボックスの数").toBeGreaterThan(0);
    expect.soft(ステータス.付いた, "ステータスのチェックが付いている数").toBe(0);
    expect.soft(言語.選択肢, "言語のチェックボックスの数").toBeGreaterThan(0);
    expect.soft(言語.付いた, "言語のチェックが付いている数").toBe(0);
    expect.soft(状態.選択肢, "状態のチェックボックスの数").toBeGreaterThan(0);
    expect.soft(状態.付いた, "状態のチェックが付いている数").toBe(0);
  });
});

caseTest("IT-M07-10-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 選択肢 = await h.ステータスの選択肢(); });
  await expected(async () => {
    note("買取状況マスタの名前は「入庫済み」（正本は「入庫済み（仕入れ完了）」）。（…）の補足を除いた名前で同じ状況として比べた");
    expect.soft(選択肢.map(状況の名前).sort(), "ステータスのチェックボックスの選択肢").toEqual(["振込完了", "未登録在庫あり", "入庫待ち", "入庫済み"].sort());
    expect.soft(選択肢.length, "ステータスの選択肢の数").toBe(4);
  });
});

caseTest("IT-M07-10-010", async ({ page, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { 選択肢 = await h.ステータスの選択肢(); });
  await expected(async () => {
    const 出ないはず = ["注文", "商品到着", "査定中", "査定中断", "査定再開", "MTGBuyer査定完了", "査定内容連絡済み", "査定内容承諾", "簡易書留送付済み", "振込依頼済み", "振込失敗", "キャンセル済み"];
    expect.soft(選択肢.length, "ステータスの選択肢が表示されている（0件ではない）").toBeGreaterThan(0);
    const 名前 = 選択肢.map(状況の名前);
    for (const n of 出ないはず) expect.soft(名前.includes(n), `ステータスの選択肢に「${n}」が表示される`).toBe(false);
  });
});

caseTest("IT-M07-10-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.ステータスを選ぶ(["振込完了", "入庫待ち"]); await h.検索する(); });
  await step(3, async () => { rows = await h.全ページの行(); });
  await expected(async () => {
    const 番 = rows.map((r) => 番号(r.買取番号));
    note("共有の環境のほかの買取履歴も出て複数ページになりうるので、ページングをたどって全ページの買取番号の列を確かめた");
    expect.soft(番.includes(番号(notes.get("〔買取番号-M0710-011A〕"))), "振込完了の買取番号 A が表示される").toBe(true);
    expect.soft(番.includes(番号(notes.get("〔買取番号-M0710-011B〕"))), "入庫待ちの買取番号 B が表示される").toBe(true);
    expect.soft(番.includes(番号(notes.get("〔買取番号-M0710-011C〕"))), "未登録在庫ありの買取番号 C が表示される").toBe(false);
    expect.soft(番.includes(番号(notes.get("〔買取番号-M0710-011D〕"))), "入庫済みの買取番号 D が表示される").toBe(false);
  });
});

type Ctx = import("../../lib/case").CaseCtx;
type 商品の指定 = { 枝: string; 呼び名: string };

/** 範囲検索の手順1〜3（開く・範囲を入れて検索・結果の行を見る）。全ページの行を返す */
async function 範囲を検索する(ctx: Ctx, 種類: "基準価格" | "買取価格", from: string, to: string): Promise<履歴の行[]> {
  const { page, step } = ctx;
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    if (種類 === "基準価格") await h.基準価格を入れる(from, to); else await h.買取価格を入れる(from, to);
    await h.検索する();
  });
  await step(3, async () => { rows = await h.全ページの行(); });
  return rows;
}

/** 範囲検索の期待結果: 出る商品の行だけが、このケースの商品の行として表示され、出ない商品の行は表示されない */
function 範囲の確かめ(ctx: Ctx, rows: 履歴の行[], n: string, 出る: 商品の指定, 出ない: 商品の指定): void {
  const 対象 = コードの行(rows, [品(n, 出る.枝), 品(n, 出ない.枝)]);
  note(`ほかの買取履歴も出うるので、この ${n} の商品（${品(n, 出る.枝)}・${品(n, 出ない.枝)}）の行について確かめた`);
  expect.soft(対象.map((r) => r.商品コード), "表示された、このケースの商品の行").toEqual([品(n, 出る.枝)]);
  expect.soft(対象.map((r) => 番号(r.買取番号)), "表示された行の買取番号").toEqual([番号(ctx.notes.get(出る.呼び名))]);
  expect.soft(rows.some((r) => r.商品コード === 品(n, 出ない.枝)), `範囲外の商品 ${品(n, 出ない.枝)} の行が表示される`).toBe(false);
}

caseTest("IT-M07-10-016", async (ctx) => {
  const rows = await 範囲を検索する(ctx, "基準価格", "4710", "4720");
  await ctx.expected(async () => {
    範囲の確かめ(ctx, rows, "016", { 枝: "A", 呼び名: "〔買取番号-M0710-016A〕" }, { 枝: "B", 呼び名: "〔買取番号-M0710-016B〕" });
    expect.soft(rows.some((r) => 番号(r.買取番号) === 番号(ctx.notes.get("〔買取番号-M0710-016B〕"))), "範囲外の買取番号 B の行が表示される").toBe(false);
  });
});

caseTest("IT-M07-10-017", async (ctx) => {
  const rows = await 範囲を検索する(ctx, "買取価格", "3710", "3720");
  await ctx.expected(async () => {
    範囲の確かめ(ctx, rows, "017", { 枝: "A", 呼び名: "〔買取番号-M0710-017A〕" }, { 枝: "B", 呼び名: "〔買取番号-M0710-017B〕" });
    expect.soft(rows.some((r) => 番号(r.買取番号) === 番号(ctx.notes.get("〔買取番号-M0710-017B〕"))), "範囲外の買取番号 B の行が表示される").toBe(false);
  });
});

caseTest("IT-M07-10-018", async (ctx) => {
  const rows = await 範囲を検索する(ctx, "買取価格", "2810", "2820");
  await ctx.expected(async () => {
    // 同じ買取番号の、範囲内の明細 A の行だけが表示され、範囲外の明細 B の行は表示されない
    範囲の確かめ(ctx, rows, "018", { 枝: "A", 呼び名: "〔買取番号-M0710-018〕" }, { 枝: "B", 呼び名: "〔買取番号-M0710-018〕" });
    expect.soft(rows.some((r) => r.商品コード === 品("018", "A") && 番号(r.買取番号) === 番号(ctx.notes.get("〔買取番号-M0710-018〕"))), "範囲内の明細 A が買取番号 018 の行として表示される").toBe(true);
  });
});

caseTest("IT-M07-10-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.買取番号を入れる(String(番号(notes.get(番号の呼び名("019"))))); await h.検索する(); rows = await h.行(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "買取商品履歴の画面").toMatch(/\/purchase\/history/);
    expect.soft(rows.map((r) => 番号(r.買取番号)), "表示された行の買取番号").toContain(番号(notes.get(番号の呼び名("019"))));
    expect.soft(await h.該当件数(), "検索結果の該当件数").toBeGreaterThan(0);
  });
});

caseTest("IT-M07-10-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let 件数: number | null = null, rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.買取番号を入れる("67100209"); await h.検索する(); });
  await step(3, async () => { 件数 = await h.該当件数(); rows = await h.行(); });
  await expected(async () => {
    expect.soft(件数, "該当件数").toBe(0);
    expect.soft(rows.length, "表示された買取商品履歴の行の数").toBe(0);
  });
});

caseTest("IT-M07-10-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let 件数: number | null = null, rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.査定担当者名を入れる("M0710-021担当"); await h.検索する(); });
  await step(3, async () => { 件数 = await h.該当件数(); rows = await h.行(); });
  await expected(async () => {
    const 番 = rows.map((r) => 番号(r.買取番号));
    expect.soft(件数, "該当件数").toBe(3);
    for (const x of ["A", "B", "C"]) expect.soft(番.includes(番号(notes.get(`〔買取番号-M0710-021${x}〕`))), `買取番号 021${x} の行が表示される`).toBe(true);
    expect.soft(番.includes(番号(notes.get("〔買取番号-M0710-021D〕"))), "買取番号 021D の行が表示される").toBe(false);
  });
});

caseTest("IT-M07-10-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.買取番号を入れる(String(番号(notes.get(番号の呼び名("022"))))); await h.検索する(); });
  await step(3, async () => { 選択肢 = await h.件数の選択肢(); });
  await expected(async () => {
    expect.soft(選択肢, "件数の選択肢").toEqual(["10件", "50件", "100件", "300件", "500件", "1000件", "2000件", "10000件", "12000件"]);
    expect.soft(選択肢.length, "件数の選択肢の数").toBe(9);
  });
});

caseTest("IT-M07-10-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.買取番号を入れる(String(番号(notes.get(番号の呼び名("023"))))); await h.検索する(); });
  await step(3, async () => { await h.件数を選ぶ(10); });
  await step(4, async () => { rows = await h.行(); });
  await expected(async () => {
    expect.soft(rows.length, "1ページ目に表示された履歴の行の数").toBe(10);
    expect.soft(rows.length > 10, "11行目が1ページ目に表示される").toBe(false);
  });
});

caseTest("IT-M07-10-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let 一ページ目: string[] = [], 二ページ目: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.買取番号を入れる(String(番号(notes.get(番号の呼び名("024"))))); await h.検索する(); });
  await step(3, async () => { await h.件数を選ぶ(10); 一ページ目 = (await h.行()).map((r) => r.商品コード); });
  await step(4, async () => { await h.ページを開く(2); 二ページ目 = (await h.行()).map((r) => r.商品コード); });
  await expected(async () => {
    const 全部 = Array.from({ length: 11 }, (_, i) => 品("024", `P${String(i + 1).padStart(2, "0")}`));
    expect.soft(一ページ目.length, "1ページ目の行の数").toBe(10);
    expect.soft(二ページ目.length, "2ページ目の行の数").toBe(1);
    expect.soft([...一ページ目, ...二ページ目].sort(), "1ページ目と2ページ目を合わせた商品コード（重複も欠落もない）").toEqual([...全部].sort());
  });
});

caseTest("IT-M07-10-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.買取番号を入れる(String(番号(notes.get(番号の呼び名("026"))))); await h.検索する(); });
  await step(3, async () => { rows = await h.行(); });
  await expected(async () => {
    expect.soft(rows.length, "検索結果の行の数").toBe(1);
    const r = rows[0];
    note("金額は「2,200」のように桁区切りで表示されるので、数字だけを取り出して比べた");
    expect.soft(r ? 金額の数(r.基準価格) : NaN, "基準価格の列（現在の基準価格）").toBe(2200);
    expect.soft(r ? 金額の数(r.買取価格) : NaN, "買取価格の列（実際に買い取った価格）").toBe(1000);
    const 全文 = r ? Object.values(r).join(" ") : "";
    expect.soft(/3,?000/.test(全文), "商品設定の買取価格 3000 が行に表示される").toBe(false);
    expect.soft(/2,?500/.test(全文), "販売価格 2500 が行に表示される").toBe(false);
  });
});

caseTest("IT-M07-10-027", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.商品コードを入れる(品("027", "A")); await h.検索する(); });
  await step(3, async () => { rows = await h.行(); });
  await expected(async () => {
    note(`シード表は買取明細3行（各数量2）の買取。期待結果は「買取番号〔買取番号-M0710-027〕（${notes.get(番号の呼び名("027"))}）に紐づく買取明細の数である3」`);
    expect.soft(rows.length, "検索結果の行の数").toBe(1);
    expect.soft(rows[0]?.買取数 ?? "（行が無い）", "買取数の列").toBe("3");
  });
});

caseTest("IT-M07-10-029", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.買取番号を入れる(String(番号(notes.get(番号の呼び名("029"))))); await h.検索する(); });
  await step(3, async () => { rows = await h.行(); });
  await expected(async () => {
    expect.soft(rows.length, "検索結果の行の数").toBe(1);
    expect.soft(rows[0]?.入庫数 ?? "（行が無い）", "入庫数の列（実在庫履歴の数量）").toBe("3");
    expect.soft(rows[0]?.入庫数 === "2", "入庫数の列が買取明細の数量 2 になっている").toBe(false);
  });
});

caseTest("IT-M07-10-030", async ({ page, notes, db, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  const 番 = notes.get(番号の呼び名("030"));
  let rows: 履歴の行[] = [];
  let 前: ReturnType<typeof 買取の中身を読む> | null = null, 後: ReturnType<typeof 買取の中身を読む> | null = null;
  await step(1, async () => { await h.開く(); });
  await step(2, async () => {
    前 = 買取の中身を読む(db.query, 番);
    await h.買取番号を入れる(String(番号(番))); await h.検索する(); rows = await h.行();
    expect(rows.length, "検索結果に行が表示される").toBeGreaterThan(0);
  });
  await step(3, async () => { 後 = 買取の中身を読む(db.query, 番); });
  await expected(async () => {
    note("DBの確認は、検索の前後で同じ値であること（実在庫の数量5・実在庫履歴の件数1・買取明細の件数1・買取状況は入庫済み）を確かめた");
    expect.soft(後?.実在庫の数量, "実在庫の数量").toBe(5);
    expect.soft(後?.実在庫履歴の件数, "実在庫履歴の件数").toBe(1);
    expect.soft(後?.買取明細の件数, "買取明細の件数").toBe(1);
    expect.soft(状況の名前(後?.買取状況 ?? ""), "買取状況（入庫済み（仕入れ完了））").toBe("入庫済み");
    expect.soft(後, "検索の前後で変わらない").toEqual(前);
  });
});

caseTest("IT-M07-10-033", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let rows: 履歴の行[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.商品コードを入れる(品("033", "A")); await h.検索する(); });
  await step(3, async () => { rows = await h.行(); });
  await expected(async () => {
    note(`シード表は買取明細1行（数量2）の買取（買取番号 ${notes.get(番号の呼び名("033"))}）。期待結果は「買取明細の数である1」`);
    expect.soft(rows.length, "検索結果の行の数").toBe(1);
    expect.soft(rows[0]?.買取数 ?? "（行が無い）", "買取数の列").toBe("1");
  });
});

/** CSVの選択取得の手順1〜5。CSVの商品コードの列を返す */
async function CSVを選択して取得する(ctx: Ctx, n: string, 付ける: string[]): Promise<string[]> {
  const { page, notes, step } = ctx;
  await loginAdmin(page, M0710_ADMIN);
  const h = new HistoryPage(page);
  let コード: string[] = [];
  await step(1, async () => { await h.開く(); });
  await step(2, async () => { await h.会員IDを入れる(notes.get(会員の呼び名(n))); await h.検索する(); });
  await step(3, async () => { for (const x of 付ける) await h.対象にする(品(n, x)); });
  await step(4, async () => {
    const file = await h.CSVをダウンロードする("選択した商品履歴取得");
    const csv = await CSVを読む(file);
    コード = csv.行.map((r) => r["商品コード"] ?? "");
  });
  await step(5, async () => { /* ダウンロードしたCSVの商品コードの列は、手順4で読んだ */ });
  return コード;
}

function CSVの確かめ(n: string, コード: string[], 付ける: string[], 出ない: string[]): void {
  const 探す = ["A", "B", "C", "D", "E"].map((x) => 品(n, x));
  expect.soft(コード.filter((c) => 探す.includes(c)).sort(), "CSVに出力された商品コード").toEqual(付ける.map((x) => 品(n, x)).sort());
  for (const x of 出ない) expect.soft(コード.includes(品(n, x)), `商品コード ${品(n, x)} の行が出力される`).toBe(false);
}

caseTest("IT-M07-10-034", async (ctx) => {
  const コード = await CSVを選択して取得する(ctx, "034", ["A", "C"]);
  await ctx.expected(async () => {
    CSVの確かめ("034", コード, ["A", "C"], ["B", "D", "E"]);
    expect.soft(コード.includes(品("034", "A")) && コード.includes(品("034", "C")), "A と C の行が出力される").toBe(true);
  });
});

caseTest("IT-M07-10-035", async (ctx) => {
  const コード = await CSVを選択して取得する(ctx, "035", ["B"]);
  await ctx.expected(async () => {
    CSVの確かめ("035", コード, ["B"], ["A", "C", "D", "E"]);
    expect.soft(コード.includes(品("035", "B")), "B の行が出力される").toBe(true);
  });
});
