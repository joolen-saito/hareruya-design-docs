/**
 * M07-06 買取商品一覧CSV出力。正本: cases/M07-06_test_cases.tsv
 *
 * 実装したケース: 001・003・004・007・008・009・012・013・014・015・016・017・018・019。
 * 実装していないケース:
 * - 002: 買取明細の状態SP。フロントの買取カートは状態NMの規格だけを入れられる（アプリの作り）ので、画面から状態SPの買取明細を作れない。
 * - 005・010: 個別入力商品を買取に登録する画面が無い（買取情報編集は表示だけ）。買取番号・商品IDを決め打ちで登録するにはDBへの書き込みが要る。
 * - 006: 買取明細の状態を「未設定」にする画面が無い。
 * - 011: 更新日時を2026/09/01 10:00:00にする・商品規格の在庫数を20にする画面操作が無い（DBへの書き込みが要る）。
 * 決め打ちの商品コード・商品名・注文者名は実行ごとの印つきの値で作ってあり、ケースの文の同じ値も印つきの値として確かめる（lib/run_marker.ts）。
 * 略称タグ「TAGA」は、略称タグの一覧の先頭にある既存の略称タグ、言語ID・「M」などは共有のマスタを読んだ値（seeds/m07-06.ts）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BuyListPage, CSVを読む, 買取番号の表示 } from "../../pages/admin/m07_buy";
import { 一覧の買取詳細, 編集画面からCSVを出す, 詳細の行 } from "../../pages/admin/m07_06";
import { 基準価格 } from "../../db/m07_06";
import { M0706_ADMIN, 品コード, 品名, 注文者名, 読んだ前提 } from "../../seeds/m07-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type CSV = Awaited<ReturnType<typeof CSVを読む>> & { ファイル名: string };

const 見出し9 = ["商品コード", "在庫増減数", "商品名", "販売価格", "買取価格", "言語ID", "略称タグ", "レアリティ", "状態"];

/** ダウンロードしたファイルを読む */
async function 読む(file: import("@playwright/test").Download | null): Promise<CSV> {
  expect(file, "CSVのダウンロード").not.toBeNull();
  const csv = await CSVを読む(file!);
  return { ...csv, ファイル名: file!.suggestedFilename() };
}

type 検索 = { 買取番号: string } | { 注文者名: string };

/**
 * 手順1〜5（開く・検索・対象にチェック・ダウンロードの項目を押す・CSVを開く）。
 * 対象は呼び名の買取番号（チェックを付ける）。ダウンロードの項目は 買取商品一覧CSV か 買取商品（キャンセル）CSV。
 */
async function 標準手順(ctx: CaseCtx, 検索: 検索, 対象: string[], 項目: "買取商品一覧CSV" | "買取商品（キャンセル）CSV" = "買取商品一覧CSV", 数量を見る?: (l: BuyListPage) => Promise<void>, 読んだ後?: () => Promise<void>): Promise<CSV> {
  const { page, notes, step } = ctx;
  await loginAdmin(page, M0706_ADMIN);
  const l = new BuyListPage(page);
  let file: import("@playwright/test").Download | null = null;
  let csv: CSV | null = null;
  let n = 1;
  await step(n++, async () => { await l.open(); });
  await step(n++, async () => {
    if ("買取番号" in 検索) await l.買取番号を入れる(notes.get(検索.買取番号)); else await l.注文者名を入れる(検索.注文者名);
    await l.検索する();
  });
  await step(n++, async () => { for (const k of 対象) await l.対象にする(notes.get(k)); });
  if (数量を見る) await step(n++, async () => { await 数量を見る(l); });
  await step(n++, async () => { file = (await l.ダウンロードを押す(項目)).file; });
  await step(n++, async () => { csv = await 読む(file); if (読んだ後) await 読んだ後(); });
  return csv!;
}

const 行 = (csv: CSV, コード: string) => csv.行.filter((r) => r["商品コード"] === コード);

caseTest("IT-M07-06-001", async (ctx) => {
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0706-001〕" }, ["〔買取番号-M0706-001〕"]);
  const p = 読んだ前提();
  await ctx.expected(async () => {
    const r = 行(csv, 品コード("001", "A"));
    expect.soft(csv.見出し, "見出し行の9項目（識別ID順）").toEqual(見出し9);
    expect.soft(r.length, "商品コードM0706-001-Aの行の数").toBe(1);
    expect.soft(r[0]?.["商品コード"], "第1項目 商品コード").toBe(品コード("001", "A"));
    expect.soft(Number(r[0]?.["在庫増減数"]), "第2項目 在庫増減数").toBe(1);
    expect.soft(r[0]?.["商品名"], "第3項目 商品名").toBe(品名("001", "A"));
    expect.soft(Number(r[0]?.["販売価格"]), "第4項目 販売価格").toBe(1500);
    expect.soft(r[0]?.["言語ID"], "第6項目 言語ID（日本語）").toBe(p.言語ID.JP);
    expect.soft(r[0]?.["略称タグ"], "第7項目 略称タグ").toBe(p.略称タグ);
    expect.soft(r[0]?.["レアリティ"], "第8項目 レアリティ").toBe("M");
    expect.soft(r[0]?.["状態"], "第9項目 状態").toBe("NM");
  });
  note(`略称タグ「TAGA」は略称タグの一覧の先頭の既存の略称タグ「${p.略称タグ}」で代えた。販売価格は金額として比べた（CSVは「1500」でも「1500.00」でも同じ）。言語「日本語」の言語IDはマスタを読んだ値（${p.言語ID.JP}）`);
});

caseTest("IT-M07-06-003", async (ctx) => {
  let 表示: 詳細の行[] = [];
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0706-003〕" }, ["〔買取番号-M0706-003〕"], "買取商品一覧CSV",
    async () => { 表示 = await 一覧の買取詳細(ctx.page, ctx.notes.get("〔買取番号-M0706-003〕")); });
  await ctx.expected(async () => {
    const a = 行(csv, 品コード("003", "A")), b = 行(csv, 品コード("003", "B"));
    expect.soft(Number(a[0]?.["在庫増減数"]), "M0706-003-Aの在庫増減数").toBe(3);
    expect.soft(Number(b[0]?.["在庫増減数"]), "M0706-003-Bの在庫増減数").toBe(5);
    const 数量 = (名: string) => 表示.find((x) => x.商品名 === 名)?.数量;
    expect.soft(数量(品名("003", "A")), "一覧の買取詳細 数量（M0706-003-カードA）がCSVの在庫増減数と一致").toBe(String(Number(a[0]?.["在庫増減数"])));
    expect.soft(数量(品名("003", "B")), "一覧の買取詳細 数量（M0706-003-カードB）がCSVの在庫増減数と一致").toBe(String(Number(b[0]?.["在庫増減数"])));
  });
});

caseTest("IT-M07-06-004", async (ctx) => {
  let dbA: number | null = null, dbB: number | null = null;
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0706-004〕" }, ["〔買取番号-M0706-004〕"], "買取商品一覧CSV", undefined,
    async () => { dbA = 基準価格(品コード("004", "A")); dbB = 基準価格(品コード("004", "B")); });
  await ctx.expected(async () => {
    const a = 行(csv, 品コード("004", "A")), b = 行(csv, 品コード("004", "B"));
    expect.soft(Number(a[0]?.["販売価格"]), "M0706-004-Aの販売価格").toBe(2000);
    expect.soft(Number(b[0]?.["販売価格"]), "M0706-004-Bの販売価格").toBe(800);
    expect.soft(dbA, "DBの商品規格の基準価格（M0706-004-A）と一致").toBe(Number(a[0]?.["販売価格"]));
    expect.soft(dbB, "DBの商品規格の基準価格（M0706-004-B）と一致").toBe(Number(b[0]?.["販売価格"]));
  });
  note("金額は数値として比べた（CSVは「2000」でも「2000.00」でも同じ）");
});

caseTest("IT-M07-06-007", async (ctx) => {
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0706-007〕" }, ["〔買取番号-M0706-007〕"]);
  const p = 読んだ前提();
  await ctx.expected(async () => {
    const r = 行(csv, 品コード("007", "A"));
    expect.soft(r.length, "商品コードM0706-007-Aの行の数").toBe(1);
    expect.soft(r[0]?.["言語ID"], "言語ID（英語の言語ID）").toBe(p.言語ID.EN);
  });
  note(`英語の言語IDはマスタを読んだ値（${p.言語ID.EN}）`);
});

caseTest("IT-M07-06-008", async (ctx) => {
  const csv = await 標準手順(ctx, { 注文者名: 注文者名("008") }, ["〔買取番号-M0706-008A〕"]);
  await ctx.expected(async () => {
    expect.soft(csv.行.length, "CSVのデータ行の数").toBe(1);
    expect.soft(行(csv, 品コード("008", "A")).length, "商品コードM0706-008-Aの行の数").toBe(1);
    expect.soft(行(csv, 品コード("008", "B")).length, "商品コードM0706-008-Bの行の数").toBe(0);
  });
});

caseTest("IT-M07-06-009", async (ctx) => {
  const csv = await 標準手順(ctx, { 買取番号: "〔買取番号-M0706-009〕" }, ["〔買取番号-M0706-009〕"]);
  await ctx.expected(async () => {
    expect.soft(csv.行.length, "CSVのデータ行の数").toBe(1);
    expect.soft(行(csv, 品コード("009", "A")).length, "商品コードM0706-009-Aの行の数").toBe(1);
    expect.soft(行(csv, 品コード("009", "B")).length, "売却しないM0706-009-Bの行の数").toBe(0);
  });
});

caseTest("IT-M07-06-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0706_ADMIN);
  const l = new BuyListPage(page);
  let r: Awaited<ReturnType<BuyListPage["ダウンロードを押す"]>> | null = null;
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(notes.get("〔買取番号-M0706-012〕")); await l.検索する(); });
  await step(3, async () => { r = await l.ダウンロードを押す("買取商品一覧CSV"); });
  let 履歴の追加 = 0;
  await step(4, async () => { /* ブラウザのダウンロード履歴は、手順3で起きたダウンロードのイベントの数で見る */ 履歴の追加 = r!.file ? 1 : 0; });
  await expected(async () => {
    expect.soft(r!.ダイアログ.length, "警告が表示された数").toBeGreaterThan(0);
    expect.soft(履歴の追加, "ダウンロード履歴に追加されたCSVファイルの数").toBe(0);
  });
  note(`ブラウザのダウンロード履歴は、ダウンロードのイベントが起きたかで見た。警告の文: ${r!.ダイアログ.join(" / ")}`);
});

caseTest("IT-M07-06-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M0706_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる("706013001"); await l.検索する(); });
  await step(3, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    await expect.soft(page.getByText("検索条件に該当するデータがありませんでした。"), "該当データなしのメッセージ").toBeVisible();
    await expect.soft(l.ダウンロードのボタン(), "「ダウンロード▼」の表示").toHaveCount(0);
    await expect.soft(l.ダウンロードの項目(), "買取商品一覧CSVなどの出力操作の表示").toHaveCount(0);
  });
});

caseTest("IT-M07-06-014", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  await loginAdmin(page, M0706_ADMIN);
  const l = new BuyListPage(page);
  const A = () => notes.get("〔買取番号-M0706-014A〕");
  let file: import("@playwright/test").Download | null = null;
  let csv: CSV | null = null;
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.買取番号を入れる(A()); await l.検索する(); });
  await step(3, async () => { await l.編集画面を開く(A()); });
  await step(4, async () => { file = await 編集画面からCSVを出す(page); });
  await step(5, async () => { csv = await 読む(file); });
  await expected(async () => {
    expect.soft(csv!.ファイル名, "ファイル名（当該買取の買取番号を含む）").toContain(買取番号の表示(A()));
    expect.soft(行(csv!, 品コード("014", "A")).length, "商品コードM0706-014-Aの行の数").toBe(1);
    expect.soft(行(csv!, 品コード("014", "B")).length, "商品コードM0706-014-Bの行の数").toBe(0);
  });
});

/** 015〜019: 注文者名で検索して1件にチェックし、CSVの項目を押して見出し・行を確かめる */
async function 組合せの手順(ctx: CaseCtx, n: string, 項目: "買取商品一覧CSV" | "買取商品（キャンセル）CSV"): Promise<CSV> {
  return 標準手順(ctx, { 注文者名: 注文者名(n) }, [`〔買取番号-M0706-${n}〕`], 項目);
}
caseTest("IT-M07-06-015", async (ctx) => {
  const csv = await 組合せの手順(ctx, "CB015", "買取商品一覧CSV");
  await ctx.expected(async () => {
    expect.soft(csv.ファイル名.startsWith("purchase_product_list_"), `CSVのファイル名（${csv.ファイル名}）がpurchase_product_list_で始まる`).toBe(true);
    expect.soft(csv.見出し[1], "見出し行の第2項目").toBe("在庫増減数");
    expect.soft(csv.行.length, "データ行の数（見出し行だけ）").toBe(0);
    expect.soft(行(csv, 品コード("CB015", "A")).length, "商品コードM0706-CB015-Aの行の数").toBe(0);
  });
});
caseTest("IT-M07-06-016", async (ctx) => {
  const csv = await 組合せの手順(ctx, "CB016", "買取商品一覧CSV");
  await ctx.expected(async () => {
    expect.soft(csv.ファイル名.startsWith("purchase_product_list_"), `CSVのファイル名（${csv.ファイル名}）がpurchase_product_list_で始まる`).toBe(true);
    expect.soft(csv.見出し[1], "見出し行の第2項目").toBe("在庫増減数");
    expect.soft(csv.行.length, "データ行の数").toBe(1);
    expect.soft(csv.行[0]?.["商品コード"], "データ行の商品コード").toBe(品コード("CB016", "A"));
    expect.soft(Number(csv.行[0]?.["在庫増減数"]), "データ行の第2項目").toBe(2);
    expect.soft(csv.行[0]?.["商品名"], "データ行の第3項目 商品名").toBe(品名("CB016", "A"));
  });
});
caseTest("IT-M07-06-017", async (ctx) => {
  const csv = await 組合せの手順(ctx, "CB017", "買取商品一覧CSV");
  await ctx.expected(async () => {
    expect.soft(csv.ファイル名.startsWith("purchase_product_list_"), `CSVのファイル名（${csv.ファイル名}）がpurchase_product_list_で始まる`).toBe(true);
    expect.soft(csv.見出し[1], "見出し行の第2項目").toBe("在庫増減数");
    expect.soft(csv.行.length, "データ行の数").toBe(1);
    expect.soft(csv.行[0]?.["商品コード"], "データ行の商品コード").toBe(品コード("CB017", "A"));
    expect.soft(Number(csv.行[0]?.["在庫増減数"]), "データ行の第2項目").toBe(3);
    expect.soft(csv.行[0]?.["商品名"], "データ行の第3項目 商品名").toBe(品名("CB017", "A"));
  });
});
caseTest("IT-M07-06-018", async (ctx) => {
  const csv = await 組合せの手順(ctx, "CB018", "買取商品（キャンセル）CSV");
  await ctx.expected(async () => {
    expect.soft(csv.ファイル名.startsWith("purchase_product_cancel_list_"), `CSVのファイル名（${csv.ファイル名}）がpurchase_product_cancel_list_で始まる`).toBe(true);
    expect.soft(csv.見出し[1], "見出し行の第2項目").toBe("キャンセル数");
    expect.soft(csv.行.length, "データ行の数（見出し行だけ）").toBe(0);
    expect.soft(行(csv, 品コード("CB018", "A")).length, "商品コードM0706-CB018-Aの行の数").toBe(0);
  });
});
caseTest("IT-M07-06-019", async (ctx) => {
  const csv = await 組合せの手順(ctx, "CB019", "買取商品（キャンセル）CSV");
  await ctx.expected(async () => {
    expect.soft(csv.ファイル名.startsWith("purchase_product_cancel_list_"), `CSVのファイル名（${csv.ファイル名}）がpurchase_product_cancel_list_で始まる`).toBe(true);
    expect.soft(csv.見出し[1], "見出し行の第2項目").toBe("キャンセル数");
    expect.soft(csv.行.length, "データ行の数（見出し行だけ）").toBe(0);
    expect.soft(行(csv, 品コード("CB019", "A")).length, "商品コードM0706-CB019-Aの行の数").toBe(0);
  });
});
