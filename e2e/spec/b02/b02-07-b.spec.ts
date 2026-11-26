/**
 * B02-07 ヘッダの商品検索（キーワード）の続き。正本: cases/B02-07_test_cases.tsv
 * 実装したのは、キーワードが商品の1項目だけに当たる 014（ルールテキスト(日)）・017（カテゴリID）。012 などと同じ作り（spec/b02/b02-07.spec.ts）。
 * シード: seeds/b02-07-b.ts。商品名がAとBで違うので、結果は商品IDで確かめる。017 のキーワードは、画面で登録して振られたカテゴリID（正本の 207901700 の読み替え）。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { BranchNavPage } from "../../pages/front/f02_03_nav";
import { FrontProductList } from "../../pages/front/f03_01_product_list";
import { B0207bの商品ID } from "../../seeds/b02-07-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function 本店を開く(page: Page): Promise<BranchNavPage> {
  const nav = new BranchNavPage(page);
  const res = await page.goto(`${BASE_URL}/ja/`, { waitUntil: "load", timeout: 60_000 });
  expect(res?.status() ?? 0, "本店 /ja/ の応答").toBeLessThan(400);
  return nav;
}

async function 検索する(ctx: CaseCtx, seedId: string, keyword: string, コードA: string, コードB: string): Promise<{ shown: string[]; idA: string; idB: string }> {
  const { page } = ctx;
  const nav = await 本店を開く(page);
  const list = new FrontProductList(page);
  const idA = B0207bの商品ID(seedId, コードA);
  const idB = B0207bの商品ID(seedId, コードB);
  let shown: string[] = [];
  await ctx.step(1, async () => {
    await nav.商品検索に入れる(keyword);
    await nav.検索ボタン().click();
    await page.waitForURL(/\/products\/search/, { timeout: 60_000 });
    await list.結果を待つ();
    note(`ヘッダの商品検索の入力欄に「${keyword}」を入れて検索を押した`);
  });
  await ctx.step(2, async () => {
    shown = (await list.カードを読む()).map((c) => c.商品ID);
    note(`商品一覧に出た商品の商品ID: ${shown.join("・") || "なし"}（商品A=${idA}・商品B=${idB}）`);
  });
  return { shown, idA, idB };
}

caseTest("IT-B02-07-014", async (ctx) => {
  const { shown, idA, idB } = await 検索する(ctx, "S-B02-07-KW-014", rc("B0207-014-RULEJPKW"), "B0207-014-A", "B0207-014-B");
  await ctx.expected(async () => {
    expect.soft(shown, "商品一覧に商品Aだけが表示される（商品Aの商品ID）").toEqual([idA]);
    expect.soft(shown.includes(idB), "商品Bは表示されない").toBe(false);
  });
});

caseTest("IT-B02-07-017", async (ctx) => {
  const 語 = ctx.notes.get("〔カテゴリID-B0207-017〕");
  test.info().annotations.push({ type: "正本の外の補い", description: `キーワードは、シード表の固定のカテゴリID 207901700 の代わりに、画面で登録して振られたカテゴリID ${語}` });
  const { shown, idA, idB } = await 検索する(ctx, "S-B02-07-KW-017", 語, "B0207-017-A", "B0207-017-B");
  await ctx.expected(async () => {
    expect.soft(shown, "商品一覧に商品Aだけが表示される（商品Aの商品ID）").toEqual([idA]);
    expect.soft(shown.includes(idB), "商品Bは表示されない").toBe(false);
  });
});
