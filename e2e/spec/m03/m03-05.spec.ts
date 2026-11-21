/**
 * M03-05 セール用価格変更CSV出力。正本: cases/M03-05_test_cases.tsv
 * 実装したのは 005・006・007・011・014・017。書かなかったケース（015・016・018）と理由は記録 review/M03-05_progress_2026-11-21_dev.md。
 * 商品コード・商品名(日)には実行の印を付けて作り、正本の「商品名=M0305CASE005」などは印つきの言葉で検索する（seeds/m03-05.ts）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { 商品があるか } from "../../db/m03_04_x";
import { expectProductListScreen, productListPath } from "../../pages/admin/m03_04_goods_csv_export";
import {
  ページを開く, 一覧の商品ID, 商品を選ぶ, 商品名で検索する, 該当件数, 選択済みの商品IDを変える, 出力の結果,
} from "../../pages/admin/m03_04_x";
import { 価格CSV出力を押す } from "../../pages/admin/m03_05_price_csv_export";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0305_ADMIN, 検索語 } from "../../seeds/m03-05";

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

// ---- 005: 2ページ目で商品を選ばずに出力 ----
caseTest("IT-M03-05-005", async ({ page, step, expected }) => {
  let r: 出力の結果 | null = null;
  await loginAdmin(page, M0305_ADMIN);
  await 商品名で検索する(page, 検索語("M0305CASE005"), { 件数: "10" });
  expect(await 該当件数(page), "検索結果が11件").toBe(11);
  await step(1, async () => { await ページを開く(page, 2); expect(page.url(), "商品一覧画面の2ページ目").toContain("/product/page/2"); });
  await step(2, async () => {
    expect(await page.locator('#form_bulk input[name="ids[]"]:checked').count(), "商品は未選択").toBe(0);
    r = await 価格CSV出力を押す(page); note(結果の文(r));
  });
  await expected(async () => {
    印の読み替え("M0305CASE005");
    expect.soft(r!.ファイル, "CSVファイルはダウンロードされない").toBeNull();
    expect.soft(new URL(page.url()).pathname, "商品一覧画面の2ページ目へ遷移する").toBe(new URL(productListPath(2)).pathname);
    await expectProductListScreen(page, "押したあとの画面");
  });
});

// ---- 006: 選んだ商品IDを未登録の番号に変えて出力 ----
caseTest("IT-M03-05-006", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-M0305-006〕");
  let r: 出力の結果 | null = null;
  expect(商品があるか("999999006"), "商品ID 999999006 は未登録").toBe(false);
  await loginAdmin(page, M0305_ADMIN);
  await step(1, async () => { await 商品名で検索する(page, 検索語("M0305CASE006")); expect(await 一覧の商品ID(page), "検索結果がこの商品だけ").toEqual([id]); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { await 選択済みの商品IDを変える(page, id, "999999006"); note("開発者ツールの代わりに、選んだ商品の選択済み商品IDの値をスクリプトで 999999006 に変えた"); });
  await step(4, async () => { r = await 価格CSV出力を押す(page); note(結果の文(r)); });
  await expected(async () => {
    印の読み替え("M0305CASE006");
    expect.soft(r!.ファイル, "CSVファイルがダウンロードされない").toBeNull();
  });
});

// ---- 007: ファイルの形（ファイル名・BOM・文字コード・区切り文字） ----
caseTest("IT-M03-05-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-M0305-007〕");
  let r: 出力の結果 | null = null;
  let 読めた = true;
  let 行: string[][] = [];
  await loginAdmin(page, M0305_ADMIN);
  await step(1, async () => { await 商品名で検索する(page, 検索語("M0305CASE007")); expect(await 一覧の商品ID(page), "検索結果がこの商品だけ").toEqual([id]); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { r = await 価格CSV出力を押す(page); note(結果の文(r)); });
  await step(4, async () => {
    expect(r!.ファイル, "CSVファイルがダウンロードされた").not.toBeNull();
    try { 行 = parseCsv(new TextDecoder("utf-8", { fatal: true }).decode(r!.ファイル!.中身).replace(/^﻿/, "")); } catch { 読めた = false; }
    note(`ファイル名: ${r!.ファイル!.名前}・先頭のバイト: ${r!.ファイル!.中身.subarray(0, 3).toString("hex")}・読み取った行の数: ${行.length}`);
  });
  await expected(async () => {
    印の読み替え("M0305CASE007");
    const f = r!.ファイル!;
    expect.soft(f.名前, "ファイル名が「product_price_」で始まる").toMatch(/^product_price_/);
    expect.soft(f.名前, "ファイル名が「.csv」で終わる").toMatch(/\.csv$/);
    expect.soft(f.中身.subarray(0, 3).toString("hex"), "ファイル先頭に BOM がある").toBe("efbbbf");
    expect.soft(読めた, "UTF-8 で読み取れる").toBe(true);
    // 値がカンマで区切られる: 見出し行とデータ行が、どちらも9列に分かれる（商品ID・言語ID・基準価格・販売価格・買取価格・原価単価・セールフラグ・帯URL・タグ(ID)）
    expect.soft(行[0]?.length, "見出し行がカンマで9列に区切られる").toBe(9);
    expect.soft(行[1]?.length, "データ行がカンマで9列に区切られる").toBe(9);
    expect.soft(行[1]?.[0], "データ行の先頭の値が商品ID").toBe(id);
  });
});

// ---- 011: 2ページ目で選んだ商品IDを未登録の番号に変えて出力 ----
caseTest("IT-M03-05-011", async ({ page, step, expected }) => {
  let r: 出力の結果 | null = null;
  expect(商品があるか("999999011"), "商品ID 999999011 は未登録").toBe(false);
  await loginAdmin(page, M0305_ADMIN);
  await 商品名で検索する(page, 検索語("M0305CASE011"), { 件数: "10" });
  expect(await 該当件数(page), "検索結果が11件").toBe(11);
  await step(1, async () => { await ページを開く(page, 2); expect(page.url(), "商品一覧画面の2ページ目").toContain("/product/page/2"); });
  let 選んだ = "";
  await step(2, async () => { 選んだ = (await 一覧の商品ID(page))[0]; await 商品を選ぶ(page, 選んだ); });
  await step(3, async () => { await 選択済みの商品IDを変える(page, 選んだ, "999999011"); note("開発者ツールの代わりに、選んだ商品の選択済み商品IDの値をスクリプトで 999999011 に変えた"); });
  await step(4, async () => { r = await 価格CSV出力を押す(page); note(結果の文(r)); });
  await expected(async () => {
    印の読み替え("M0305CASE011");
    expect.soft(r!.ファイル, "CSVファイルがダウンロードされない").toBeNull();
    expect.soft(new URL(page.url()).pathname, "出力を要求した商品一覧画面の2ページ目へ戻る").toBe(new URL(productListPath(2)).pathname);
    await expectProductListScreen(page, "戻った画面");
    expect.soft(await new ProductSearchPage(page).field("product_name").inputValue(), "保持していた検索条件（商品名）").toBe(検索語("M0305CASE011"));
    const 件数の欄 = await page.locator("#page_count_pulldown option:checked").first().textContent();
    expect.soft((件数の欄 ?? "").trim(), "表示件数が10件").toBe("10件");
    expect.soft(await 該当件数(page), "該当件数が11件").toBe(11);
    expect.soft((await 一覧の商品ID(page)).length, "2ページ目の商品が1件").toBe(1);
  });
});

// ---- 014: タグの無い商品 ----
caseTest("IT-M03-05-014", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-M0305-014〕");
  let r: 出力の結果 | null = null;
  await loginAdmin(page, M0305_ADMIN);
  await step(1, async () => { await 商品名で検索する(page, 検索語("M0305CASE014")); expect(await 一覧の商品ID(page), "検索結果がこの商品だけ").toEqual([id]); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { r = await 価格CSV出力を押す(page); note(結果の文(r)); });
  await step(4, async () => { expect(r!.ファイル, "CSVファイルがダウンロードされた").not.toBeNull(); });
  await expected(async () => {
    印の読み替え("M0305CASE014");
    const csv = CSVを読む(r!);
    expect.soft(csv.行.map((x) => x["商品ID"]), `データ行が商品ID ${id} の1行だけ`).toEqual([id]);
    expect.soft(csv.見出し.includes("タグ(ID)"), "見出しに「タグ(ID)」の列がある").toBe(true);
    expect.soft(csv.行[0]?.["タグ(ID)"], "タグ(ID)の列が空").toBe("");
  });
});

// ---- 017: 状態NMの規格が無い商品 ----
caseTest("IT-M03-05-017", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-M0305-017〕");
  let r: 出力の結果 | null = null;
  await loginAdmin(page, M0305_ADMIN);
  await step(1, async () => {
    // 商品一覧の状態の初期の検索条件は NM だけ（M03-04 の 034 と同じ）。状態NMの規格を持たない商品を出すため、状態の条件に SP を足して検索する
    await 商品名で検索する(page, 検索語("M0305-CB017"), { 状態: ["ニアミント", "スライトリープレイド"] });
    supplement("商品一覧の状態の初期の検索条件は NM だけなので、状態SPの規格だけを持つこの商品を出すため、状態の条件に SP を足して検索した");
    expect(await 一覧の商品ID(page), "検索結果がこの1商品だけ").toEqual([id]);
  });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { r = await 価格CSV出力を押す(page); note(結果の文(r)); });
  await step(4, async () => { expect(r!.ファイル, "CSVファイルがダウンロードされた").not.toBeNull(); });
  await expected(async () => {
    印の読み替え("M0305-CB017");
    const csv = CSVを読む(r!);
    expect.soft(r!.ファイル!.中身.subarray(0, 3).toString("hex"), "ファイル先頭に BOM がある").toBe("efbbbf");
    expect.soft(csv.見出し.length, "CSVが9列のヘッダ行を持つ").toBe(9);
    expect.soft(csv.行.filter((x) => x["商品ID"] === id).length, `商品ID ${id} のデータ行を含まない`).toBe(0);
    expect.soft(csv.行.length, "ヘッダ行だけ（データ行が無い）").toBe(0);
  });
});
