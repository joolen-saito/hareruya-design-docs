/**
 * M03-04 グッズ商品CSV出力の続き（-x）。仕分け直しで流せる見込みになったケースのうち、開発環境で作れるもの。正本: cases/M03-04_test_cases.tsv
 * 実装しないケースと理由は記録 review/M03-04_progress_2026-11-11_dev.md。
 * 商品コード・商品名(日)には実行の印を付けて作り、正本の「商品名=M0304CASE009」などは印つきの言葉で検索する（seeds/m03-04-x.ts）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { 商品公開ステータスのID, 商品があるか, 廃止のID } from "../../db/m03_04_x";
import { expectProductListScreen, productListPath, readExportForm } from "../../pages/admin/m03_04_goods_csv_export";
import {
  この画面から送る, ページを開く, 一覧の商品ID, 出力の結果, 出力を押す, 商品を選ぶ, 商品名で検索する, 該当件数, 選択済みの商品IDを変える, 選択済みの商品IDを足す,
} from "../../pages/admin/m03_04_x";
import { M0304_ADMIN } from "../../seeds/m03-04";
import { 検索語 } from "../../seeds/m03-04-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 印の読み替え = (正本: string) => supplement(`正本の商品名「${正本}」は、実行の印を付けた「${検索語(正本)}」で作り、検索した`);

const 結果の文 = (r: 出力の結果): string => `ダウンロード: ${r.ファイル ? `${r.ファイル.名前}（${r.ファイル.中身.length} バイト）` : "なし"}・応答 ${r.状態} ${r.型}・移った先 ${r.移った先}・誤り ${r.誤り.join(" / ") || "なし"}`;

/** ダウンロードした CSV を読む（見出しと、見出しの名前で引ける行） */
function CSVを読む(r: 出力の結果): { 見出し: string[]; 行: Record<string, string>[] } {
  if (!r.ファイル) throw new Error("CSVファイルがダウンロードされていない");
  const [見出し, ...rows] = parseCsv(decodeCsvBytes(r.ファイル.中身)).filter((x) => x.some((c) => c !== ""));
  return { 見出し, 行: rows.map((x) => Object.fromEntries(見出し.map((h, i) => [h, x[i] ?? ""]))) };
}
const 商品の行 = (csv: ReturnType<typeof CSVを読む>, 商品ID: string) => csv.行.filter((x) => x["商品ID"] === 商品ID);

/** 1件の商品を選んで出力し、その商品のデータ行の列を確かめる（020〜023・030） */
function 列を確かめる(検索の正本: string, 呼び名: string, want: Record<string, string>): (ctx: CaseCtx) => Promise<void> {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(呼び名);
    let r: 出力の結果 | null = null;
    await loginAdmin(page, M0304_ADMIN);
    await step(1, async () => {
      await 商品名で検索する(page, 検索語(検索の正本));
      expect(await 一覧の商品ID(page), "検索結果がこの商品だけ").toEqual([id]);
    });
    await step(2, async () => { await 商品を選ぶ(page, id); });
    await step(3, async () => { r = await 出力を押す(page); note(結果の文(r)); });
    await step(4, async () => { expect(r!.ファイル, "CSVファイルがダウンロードされた").not.toBeNull(); });
    await expected(async () => {
      印の読み替え(検索の正本);
      const rows = 商品の行(CSVを読む(r!), id);
      expect.soft(rows.length, `商品ID ${id} のデータ行がある`).toBeGreaterThan(0);
      for (const row of rows) for (const [k, v] of Object.entries(want)) expect.soft(row[k], `「${k}」が「${v}」`).toBe(v);
    });
  };
}

// ---- ダウンロードされない ----
caseTest("IT-M03-04-008", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-M0304-008〕");
  let r: 出力の結果 | null = null;
  await loginAdmin(page, M0304_ADMIN);
  await step(1, async () => {
    await 商品名で検索する(page, 検索語("M0304CASE008"), { 状態: ["スライトリープレイド", "モデレトリープレイド"] });
    expect(await 一覧の商品ID(page), "検索結果がこの商品だけ").toEqual([id]);
  });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { r = await 出力を押す(page); note(結果の文(r)); });
  await expected(async () => {
    印の読み替え("M0304CASE008");
    expect.soft(r!.ファイル, "CSVファイルがダウンロードされない").toBeNull();
  });
});

caseTest("IT-M03-04-010", async ({ page, step, expected }) => {
  let r: 出力の結果 | null = null;
  await loginAdmin(page, M0304_ADMIN);
  await step(1, async () => {
    await 商品名で検索する(page, 検索語("M0304CASE010"));
    expect(await 該当件数(page), "検索結果がこの商品だけ").toBe(1);
  });
  await step(2, async () => {
    expect(await page.locator('#form_bulk input[name="ids[]"]:checked').count(), "商品は未選択").toBe(0);
    r = await 出力を押す(page); note(結果の文(r));
  });
  await expected(async () => {
    印の読み替え("M0304CASE010");
    expect.soft(r!.ファイル, "CSVファイルがダウンロードされない").toBeNull();
  });
});

caseTest("IT-M03-04-014", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-M0304-014〕");
  let r: 出力の結果 | null = null;
  expect(商品があるか("999999014"), "商品ID 999999014 は未登録").toBe(false);
  await loginAdmin(page, M0304_ADMIN);
  await step(1, async () => { await 商品名で検索する(page, 検索語("M0304CASE014")); expect(await 一覧の商品ID(page), "検索結果がこの商品だけ").toEqual([id]); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { await 選択済みの商品IDを変える(page, id, "999999014"); note("開発者ツールの代わりに、選んだ商品の選択済み商品IDの値をスクリプトで 999999014 に変えた"); });
  await step(4, async () => { r = await 出力を押す(page); note(結果の文(r)); });
  await expected(async () => {
    印の読み替え("M0304CASE014");
    expect.soft(r!.ファイル, "CSVファイルがダウンロードされない").toBeNull();
  });
});

// ---- 2ページ目 ----
caseTest("IT-M03-04-009", async ({ page, step, expected }) => {
  let r: 出力の結果 | null = null;
  await loginAdmin(page, M0304_ADMIN);
  await 商品名で検索する(page, 検索語("M0304CASE009"), { 件数: "10" });
  expect(await 該当件数(page), "検索結果が11件").toBe(11);
  await step(1, async () => { await ページを開く(page, 2); expect(page.url(), "商品一覧画面の2ページ目").toContain("/product/page/2"); });
  await step(2, async () => { r = await 出力を押す(page); note(結果の文(r)); });
  await expected(async () => {
    印の読み替え("M0304CASE009");
    expect.soft(r!.ファイル, "CSVファイルはダウンロードされない").toBeNull();
    expect.soft(new URL(page.url()).pathname, "商品一覧画面の2ページ目へ遷移する").toBe(new URL(productListPath(2)).pathname);
    await expectProductListScreen(page, "押したあとの画面");
  });
});

function 二ページ目で足す(n: "012" | "013"): (ctx: CaseCtx) => Promise<void> {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔商品ID-M0304-${n}〕`);
    const 足す = `999999${n}`;
    let r: 出力の結果 | null = null;
    expect(商品があるか(足す), `商品ID ${足す} は未登録`).toBe(false);
    await loginAdmin(page, M0304_ADMIN);
    await 商品名で検索する(page, 検索語(`M0304CASE${n}`), { 件数: "10" });
    expect(await 該当件数(page), "検索結果が11件").toBe(11);
    await step(1, async () => { await ページを開く(page, 2); expect(await 一覧の商品ID(page), "2ページ目に対象の商品").toContain(id); });
    await step(2, async () => { await 商品を選ぶ(page, id); });
    await step(3, async () => { await 選択済みの商品IDを足す(page, 足す); note(`開発者ツールの代わりに、一覧のフォームへ選択済みの商品ID ${足す} をスクリプトで足した`); });
    await step(4, async () => { r = await 出力を押す(page); note(結果の文(r)); });
    await expected(async () => {
      印の読み替え(`M0304CASE${n}`);
      if (n === "012") {
        expect.soft(r!.ファイル, "CSVファイルがダウンロードされない").toBeNull();
      } else {
        expect.soft(r!.ファイル, "CSVファイルはダウンロードされない").toBeNull();
        expect.soft(new URL(page.url()).pathname, "リファラーである商品一覧画面の2ページ目が表示される").toBe(new URL(productListPath(2)).pathname);
        await expectProductListScreen(page, "押したあとの画面");
      }
    });
  };
}
caseTest("IT-M03-04-012", 二ページ目で足す("012"));
caseTest("IT-M03-04-013", 二ページ目で足す("013"));

// ---- 別の画面からの要求 ----
caseTest("IT-M03-04-015", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-M0304-015〕");
  let form: { 送信先: string; 方式: string; 送信項目: string[] } | null = null;
  let r: 出力の結果 | null = null;
  expect(商品があるか("999999015"), "商品ID 999999015 は未登録").toBe(false);
  await loginAdmin(page, M0304_ADMIN);
  await step(1, async () => { await 商品名で検索する(page, 検索語("M0304CASE015")); expect(await 一覧の商品ID(page), "検索結果がこの商品だけ").toEqual([id]); });
  await step(2, async () => {
    form = await readExportForm(page);
    note(`グッズ商品CSV出力の送信先: ${form.送信先}・方式: ${form.方式}・送信項目: ${form.送信項目.join("、")}`);
    expect(form.送信項目, "送信項目に商品IDの並び（ids[]）がある").toContain("ids[]");
  });
  await step(3, async () => {
    await page.goto(adminUrl(`/product/product/${id}/edit`));
    await page.waitForLoadState("load");
    expect(new URL(page.url()).pathname, "商品登録/編集画面").toMatch(new RegExp(`/product/product/${id}/edit$`));
  });
  await step(4, async () => { r = await この画面から送る(page, form!.送信先, ["999999015"]); note(結果の文(r)); });
  await expected(async () => {
    印の読み替え("M0304CASE015");
    expect.soft(r!.ファイル, "CSVファイルはダウンロードされない").toBeNull();
    expect.soft(new URL(page.url()).pathname, "リファラーである商品登録/編集画面が表示される").toMatch(new RegExp(`/product/product/${id}/edit$`));
  });
});

// ---- ファイルの形 ----
caseTest("IT-M03-04-017", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-M0304-017〕");
  let r: 出力の結果 | null = null;
  await loginAdmin(page, M0304_ADMIN);
  await step(1, async () => { await 商品名で検索する(page, 検索語("M0304CASE017")); expect(await 一覧の商品ID(page), "検索結果がこの商品だけ").toEqual([id]); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { note("ブラウザのネットワーク記録の代わりに、出力の要求への応答を Playwright で受け取る"); });
  await step(4, async () => { r = await 出力を押す(page); note(結果の文(r)); });
  let 読めた = true, 見出し: string[] = [];
  await step(5, async () => {
    expect(r!.ファイル, "CSVファイルがダウンロードされた").not.toBeNull();
    try { const t = new TextDecoder("utf-8", { fatal: true }).decode(r!.ファイル!.中身); 見出し = parseCsv(t.replace(/^﻿/, ""))[0] ?? []; } catch { 読めた = false; }
    note(`ファイル名: ${r!.ファイル!.名前}・先頭のバイト: ${r!.ファイル!.中身.subarray(0, 3).toString("hex")}・応答の型: ${r!.型}・見出しの項目の数: ${見出し.length}`);
  });
  await expected(async () => {
    const f = r!.ファイル!;
    expect.soft(f.名前, "ファイル名が「product_goods_」で始まる").toMatch(/^product_goods_/);
    expect.soft(f.名前, "ファイル名が「.csv」で終わる").toMatch(/\.csv$/);
    expect.soft(f.中身.subarray(0, 3).toString("hex"), "ファイル先頭に BOM がある").toBe("efbbbf");
    expect.soft(読めた, "UTF-8 で読み取れる").toBe(true);
    expect.soft(見出し.length, "値がカンマで区切られる（見出しが複数の項目に分かれる）").toBeGreaterThan(1);
    expect.soft(見出し[0], "先頭の項目").toBe("商品ID");
    expect.soft(r!.型.toLowerCase(), "応答に UTF-8 が指定されている").toContain("utf-8");
  });
});

// ---- 列の値 ----
caseTest("IT-M03-04-020", 列を確かめる("M0304CASE020", "〔商品ID-M0304-020〕", { "商品名(日)": `${rc("M0304CASE020")}-A`, "商品名(英)": "M0304-020-NAME-EN", "検索ワード": "M0304-020-KEYWORD" }));
caseTest("IT-M03-04-021", 列を確かめる("M0304CASE021", "〔商品ID-M0304-021〕", { "サイズ": "87", "重量": "210" }));
caseTest("IT-M03-04-022", 列を確かめる("M0304CASE022", "〔商品ID-M0304-022〕", { "商品説明(日)": "M0304-022-DESC-JA", "商品説明(英)": "M0304-022-DESC-EN", "買取商品説明(日)": "M0304-022-BUY-JA", "買取商品説明(英)": "M0304-022-BUY-EN" }));
caseTest("IT-M03-04-023", 列を確かめる("M0304CASE023", "〔商品ID-M0304-023〕", { "地域別販売制限": "1", "フリーエリア": "M0304-023-FREE-AREA" }));
caseTest("IT-M03-04-030", 列を確かめる("M0304-030-NAME", "〔商品ID-M0304-030〕", { "スマレジ連携フラグ": "0" }));

caseTest("IT-M03-04-027", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔商品ID-M0304-027A〕"), B = notes.get("〔商品ID-M0304-027B〕");
  let r: 出力の結果 | null = null;
  await loginAdmin(page, M0304_ADMIN);
  await step(1, async () => { await 商品名で検索する(page, 検索語("M0304-027-NAME")); expect(await 該当件数(page), "検索結果が2件").toBe(2); });
  await step(2, async () => { await 商品を選ぶ(page, A); await 商品を選ぶ(page, B); });
  await step(3, async () => { r = await 出力を押す(page); note(結果の文(r)); });
  await step(4, async () => { expect(r!.ファイル, "CSVファイルがダウンロードされた").not.toBeNull(); });
  await expected(async () => {
    印の読み替え("M0304-027-NAME");
    supplement("正本の商品コード「M0304-027-A」「M0304-027-B」も、実行の印を付けた値で作った");
    const csv = CSVを読む(r!);
    expect.soft(csv.行.length, "データ行が2行").toBe(2);
    const a = 商品の行(csv, A)[0] ?? {}, b = 商品の行(csv, B)[0] ?? {};
    expect.soft([a["商品コード"], a["商品名(日)"], a["基準価格"]], `商品ID ${A} の行の商品コード／商品名(日)／基準価格`).toEqual([rc("M0304-027-A"), `${rc("M0304-027-NAME")}-A`, "1000"]);
    expect.soft([b["商品コード"], b["商品名(日)"], b["基準価格"]], `商品ID ${B} の行の商品コード／商品名(日)／基準価格`).toEqual([rc("M0304-027-B"), `${rc("M0304-027-NAME")}-B`, "2000"]);
  });
});

caseTest("IT-M03-04-031", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-M0304-031〕");
  let 廃止 = "", r: 出力の結果 | null = null;
  await loginAdmin(page, M0304_ADMIN);
  await step(1, async () => { 廃止 = 廃止のID(); note(`商品公開ステータスのマスタの「廃止」のID: ${廃止}（この商品の DB の値: ${商品公開ステータスのID(id)}）`); });
  await step(2, async () => { await 商品名で検索する(page, 検索語("M0304-031-NAME")); expect(await 該当件数(page), "検索結果が1件").toBe(1); });
  await step(3, async () => { await 商品を選ぶ(page, id); });
  await step(4, async () => { r = await 出力を押す(page); note(結果の文(r)); });
  await step(5, async () => { expect(r!.ファイル, "CSVファイルがダウンロードされた").not.toBeNull(); });
  await expected(async () => {
    印の読み替え("M0304-031-NAME");
    const rows = 商品の行(CSVを読む(r!), id);
    expect.soft(rows.length, `商品ID ${id} のデータ行がある`).toBeGreaterThan(0);
    for (const row of rows) expect.soft(row["商品公開ステータス"], "商品公開ステータスが DB で記録した「廃止」のマスタID").toBe(廃止);
  });
});

caseTest("IT-M03-04-034", async ({ page, notes, step, expected }) => {
  const A = notes.get("〔商品ID-M0304-034A〕"), B = notes.get("〔商品ID-M0304-034B〕");
  let r: 出力の結果 | null = null;
  await loginAdmin(page, M0304_ADMIN);
  await step(1, async () => {
    await 商品名で検索する(page, 検索語("M0304-CB034"));
    expect((await 一覧の商品ID(page)).sort(), "検索結果が商品A・商品Bの2件だけ").toEqual([A, B].sort());
  });
  await step(2, async () => { await 商品を選ぶ(page, A); await 商品を選ぶ(page, B); });
  await step(3, async () => { r = await 出力を押す(page); note(結果の文(r)); });
  await step(4, async () => { expect(r!.ファイル, "CSVファイルがダウンロードされた").not.toBeNull(); });
  await expected(async () => {
    印の読み替え("M0304-CB034");
    const csv = CSVを読む(r!);
    expect.soft(r!.ファイル!.中身.subarray(0, 3).toString("hex"), "ファイル先頭に BOM がある").toBe("efbbbf");
    expect.soft(csv.行.map((x) => x["商品ID"]), `データ行が商品ID ${B} の1行だけ（${A} の行を含まない）`).toEqual([B]);
  });
});
