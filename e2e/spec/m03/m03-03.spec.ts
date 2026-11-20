/**
 * M03-03 カード商品CSV出力。正本: cases/M03-03_test_cases.tsv
 * 実装した: 007・011・012・013・014・025・028
 * 実装しない（理由は review/M03-03_progress_2026-11-20_dev.md）:
 * - 015・016・020・024・030〜032: CSV出力の文字コード・区切り文字（全員が使う共有の設定）を書き換える前提
 * - 002〜006・027・029: 言語ID 11・12の規格・発送日目安・規格画像・売上分析タグとタグの付与・DB での未設定化など、画面の部品が無い作りの商品が要る
 * 補い:
 * - 商品コード・商品名・カード名には実行の印が付く。011・012 の商品名の検索語は、自分の11件だけが出るよう実行の印を含む。
 * - 「開発者ツールで…を追加する・置き換える・meta を足す」は、画面の要素をスクリプトで変えて表した。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import {
  カード商品CSV出力を押す, 商品を選ぶ, 商品一覧のパス, 表示件数を選ぶ, ページを開く, 選択済み商品IDを置き換える, 選択済み商品IDを足す, 選択中の商品ID,
} from "../../pages/admin/m03_03_card_csv";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0303_ADMIN, ページ送りの検索語 } from "../../seeds/m03-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 商品一覧を開き、商品IDで検索する（手順1） */
async function 商品IDで検索する(page: import("@playwright/test").Page, 商品ID: string): Promise<void> {
  const s = new ProductSearchPage(page);
  await s.open();
  await s.field("product_id").fill(商品ID);
  await s.submitAndWaitForResult();
}

/** 商品名で検索し、表示件数を10件にして2ページ目を開く（011・012 の手順1） */
async function 商品名の検索結果で2ページ目を開く(page: import("@playwright/test").Page, 検索語: string): Promise<void> {
  const s = new ProductSearchPage(page);
  await s.open();
  await s.field("product_name").fill(検索語);
  await s.submitAndWaitForResult();
  await 表示件数を選ぶ(page, 10);
  await ページを開く(page, 2);
  note(`2ページ目のアドレス: ${page.url()}（検索語 ${検索語}。シード表の「1ページ表示件数=10」は、結果の表示件数の選択欄で10件を選んで表した）`);
}

caseTest("IT-M03-03-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0303_ADMIN);
  const id = notes.get("〔商品ID-M0303-007〕");
  let r: Awaited<ReturnType<typeof カード商品CSV出力を押す>> | null = null;
  await step(1, async () => { await 商品IDで検索する(page, id); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { await 選択済み商品IDを足す(page, "999999007"); note(`送る商品ID: ${(await 選択中の商品ID(page)).join("、")} と、足した隠し項目 999999007`); });
  await step(4, async () => { r = await カード商品CSV出力を押す(page); });
  await step(5, async () => { note(`ダウンロード: ${r?.ダウンロード?.ファイル名 ?? "なし"}・行数 ${r?.ダウンロード?.行.length ?? 0}`); });
  await expected(async () => {
    const rows = r?.ダウンロード?.行 ?? [];
    expect(r?.ダウンロード, "CSVがダウンロードされた").not.toBeNull();
    expect.soft(rows.length, "データ行の数（状態NMの規格に対応する2行）").toBe(2);
    expect.soft(rows.every((x) => x["商品ID"] === id), `すべての行の商品ID が ${id}`).toBe(true);
    expect.soft(rows.some((x) => x["商品ID"] === "999999007"), "商品ID 999999007 のデータ行を含む").toBe(false);
  });
});

caseTest("IT-M03-03-011", async ({ page, step, expected }) => {
  await loginAdmin(page, M0303_ADMIN);
  let r: Awaited<ReturnType<typeof カード商品CSV出力を押す>> | null = null;
  await step(1, async () => { await 商品名の検索結果で2ページ目を開く(page, ページ送りの検索語("011")); });
  await step(2, async () => { r = await カード商品CSV出力を押す(page); note(`押したあとのアドレス: ${r.押したあとのアドレス}`); });
  await expected(async () => {
    expect(r?.ダウンロード, "CSVファイルがダウンロードされた（されないはず）").toBeNull();
  });
});

caseTest("IT-M03-03-012", async ({ page, step, expected }) => {
  await loginAdmin(page, M0303_ADMIN);
  let r: Awaited<ReturnType<typeof カード商品CSV出力を押す>> | null = null;
  await step(1, async () => { await 商品名の検索結果で2ページ目を開く(page, ページ送りの検索語("012")); });
  await step(2, async () => { r = await カード商品CSV出力を押す(page); note(`押したあとのアドレス: ${r.押したあとのアドレス}`); });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(u.pathname, "商品一覧画面のアドレス").toMatch(new RegExp(`^${商品一覧のパス()}(/page/2)?$`));
    expect.soft(u.pathname.endsWith("/page/2") || u.searchParams.get("pageno") === "2", `2ページ目のアドレス（${page.url()}）`).toBe(true);
  });
});

caseTest("IT-M03-03-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0303_ADMIN);
  const id = notes.get("〔商品ID-M0303-013〕");
  let r: Awaited<ReturnType<typeof カード商品CSV出力を押す>> | null = null;
  await step(1, async () => { await 商品IDで検索する(page, id); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { const n = await 選択済み商品IDを置き換える(page, "999999013"); note(`置き換えた欄の数: ${n}`); });
  await step(4, async () => { r = await カード商品CSV出力を押す(page); note(`押したあとのアドレス: ${r.押したあとのアドレス}`); });
  await expected(async () => {
    expect(r?.ダウンロード, "CSVファイルがダウンロードされた（されないはず）").toBeNull();
  });
});

caseTest("IT-M03-03-014", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0303_ADMIN);
  const id = notes.get("〔商品ID-M0303-014〕");
  let 操作元 = "";
  await step(1, async () => { await 商品IDで検索する(page, id); 操作元 = page.url(); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { const n = await 選択済み商品IDを置き換える(page, "999999014"); note(`置き換えた欄の数: ${n}`); });
  await step(4, async () => { await カード商品CSV出力を押す(page); note(`押したあとのアドレス: ${page.url()}・操作元: ${操作元}`); });
  await expected(async () => {
    expect(page.url(), "操作元の商品一覧画面へ戻った").toBe(操作元);
  });
});

caseTest("IT-M03-03-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0303_ADMIN);
  const id = notes.get("〔商品ID-M0303-025〕");
  await step(1, async () => { await 商品IDで検索する(page, id); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => {
    await page.evaluate(() => { const m = document.createElement("meta"); m.name = "referrer"; m.content = "no-referrer"; document.head.appendChild(m); });
  });
  await step(4, async () => { const n = await 選択済み商品IDを置き換える(page, "999999025"); note(`置き換えた欄の数: ${n}`); });
  await step(5, async () => { await カード商品CSV出力を押す(page); note(`押したあとのアドレス: ${page.url()}`); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "商品一覧画面へ遷移した").toMatch(new RegExp(`^${商品一覧のパス()}(/page(/\\d+)?)?$`)); // 商品一覧はページ番号なしの /product/page でも開く（2026-11-21）
  });
});

caseTest("IT-M03-03-028", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0303_ADMIN);
  const id = notes.get("〔商品ID-M0303-028〕");
  const A = notes.get("〔商品カテゴリID-M0303-共有A〕");
  let r: Awaited<ReturnType<typeof カード商品CSV出力を押す>> | null = null;
  await step(1, async () => { await 商品IDで検索する(page, id); });
  await step(2, async () => { await 商品を選ぶ(page, id); });
  await step(3, async () => { r = await カード商品CSV出力を押す(page); });
  await step(4, async () => { note(`データ行の商品カテゴリ(ID): ${(r?.ダウンロード?.行 ?? []).map((x) => x["商品カテゴリ(ID)"]).join(" / ")}`); });
  await expected(async () => {
    const rows = r?.ダウンロード?.行 ?? [];
    expect(r?.ダウンロード, "CSVがダウンロードされた").not.toBeNull();
    expect.soft(rows.length, "データ行がある").toBeGreaterThan(0);
    for (const x of rows) {
      expect.soft(x["商品ID"], "データ行の商品ID").toBe(id);
      expect.soft(x["商品カテゴリ(ID)"], `商品カテゴリ(ID)が共有Aの1件だけ（${A}）`).toBe(A);
      expect.soft(x["商品カテゴリ(ID)"], "商品カテゴリ(ID)にカンマを含まない").not.toContain(",");
    }
  });
});
