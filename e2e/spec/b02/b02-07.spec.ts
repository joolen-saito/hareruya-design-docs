/**
 * B02-07 ヘッダの商品検索（キーワード）。正本: cases/B02-07_test_cases.tsv
 * 実装したのは、検索サービスの索引に載せた商品で、キーワードが商品の1項目だけに当たる 011（タグ）・012（カードセット名 日）・013（カードセット名 英）・016（商品コード）・023（商品名）。
 * シード: seeds/b02-07.ts（商品を作り、フィードを1回送って反映を待つ）。正本の値（キーワード・商品名・商品コード）には実行の印が付く。検索に入れるキーワードも印つきの値。
 * 商品名がAとBで違う（011〜016）ので結果は商品IDで確かめる（商品コードは画面に出ない）。商品一覧に出た商品の商品IDが、商品Aの商品IDだけであること。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { BranchNavPage } from "../../pages/front/f02_03_nav";
import { FrontProductList } from "../../pages/front/f03_01_product_list";
import { B0207の商品ID } from "../../seeds/b02-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 本店 /ja/ を開く（事前準備: 本店を日本語の /ja/ で公開） */
async function 本店を開く(page: Page): Promise<BranchNavPage> {
  const nav = new BranchNavPage(page);
  const res = await page.goto(`${BASE_URL}/ja/`, { waitUntil: "load", timeout: 60_000 });
  expect(res?.status() ?? 0, "本店 /ja/ の応答").toBeLessThan(400);
  return nav;
}

caseTest("IT-B02-07-011", async ({ page, step, expected }) => {
  const nav = await 本店を開く(page);
  const list = new FrontProductList(page);
  const keyword = rc("B0207-011-TAGKW");
  const idA = B0207の商品ID("S-B02-07-KW-011", "B0207-011-A");
  const idB = B0207の商品ID("S-B02-07-KW-011", "B0207-011-B");
  let shown: string[] = [];
  await step(1, async () => {
    await nav.商品検索に入れる(keyword);
    await nav.検索ボタン().click();
    await page.waitForURL(/\/products\/search/, { timeout: 60_000 });
    await list.結果を待つ();
    note(`ヘッダの商品検索の入力欄に「${keyword}」を入れて検索を押した`);
  });
  await step(2, async () => {
    shown = (await list.カードを読む()).map((c) => c.商品ID);
    note(`商品一覧に出た商品の商品ID: ${shown.join("・") || "なし"}（商品A=${idA}・商品B=${idB}）`);
  });
  await expected(async () => {
    expect.soft(shown, "商品一覧に商品Aだけが表示される（商品Aの商品ID）").toEqual([idA]);
    expect.soft(shown.includes(idB), "商品Bは表示されない").toBe(false);
  });
});

caseTest("IT-B02-07-012", async ({ page, step, expected }) => {
  const nav = await 本店を開く(page);
  const list = new FrontProductList(page);
  const keyword = rc("B0207-012-SETJPKW");
  const idA = B0207の商品ID("S-B02-07-KW-012", "B0207-012-A");
  const idB = B0207の商品ID("S-B02-07-KW-012", "B0207-012-B");
  let shown: string[] = [];
  await step(1, async () => {
    await nav.商品検索に入れる(keyword);
    await nav.検索ボタン().click();
    await page.waitForURL(/\/products\/search/, { timeout: 60_000 });
    await list.結果を待つ();
    note(`ヘッダの商品検索の入力欄に「${keyword}」を入れて検索を押した`);
  });
  await step(2, async () => {
    shown = (await list.カードを読む()).map((c) => c.商品ID);
    note(`商品一覧に出た商品の商品ID: ${shown.join("・") || "なし"}（商品A=${idA}・商品B=${idB}）`);
  });
  await expected(async () => {
    expect.soft(shown, "商品一覧に商品Aだけが表示される（商品Aの商品ID）").toEqual([idA]);
    expect.soft(shown.includes(idB), "商品Bは表示されない").toBe(false);
  });
});

caseTest("IT-B02-07-013", async ({ page, step, expected }) => {
  const nav = await 本店を開く(page);
  const list = new FrontProductList(page);
  const keyword = rc("B0207-013-SETENKW");
  const idA = B0207の商品ID("S-B02-07-KW-013", "B0207-013-A");
  const idB = B0207の商品ID("S-B02-07-KW-013", "B0207-013-B");
  let shown: string[] = [];
  await step(1, async () => {
    await nav.商品検索に入れる(keyword);
    await nav.検索ボタン().click();
    await page.waitForURL(/\/products\/search/, { timeout: 60_000 });
    await list.結果を待つ();
    note(`ヘッダの商品検索の入力欄に「${keyword}」を入れて検索を押した`);
  });
  await step(2, async () => {
    shown = (await list.カードを読む()).map((c) => c.商品ID);
    note(`商品一覧に出た商品の商品ID: ${shown.join("・") || "なし"}（商品A=${idA}・商品B=${idB}）`);
  });
  await expected(async () => {
    expect.soft(shown, "商品一覧に商品Aだけが表示される（商品Aの商品ID）").toEqual([idA]);
    expect.soft(shown.includes(idB), "商品Bは表示されない").toBe(false);
  });
});

caseTest("IT-B02-07-016", async ({ page, step, expected }) => {
  const nav = await 本店を開く(page);
  const list = new FrontProductList(page);
  const keyword = rc("B0207-016-CODEKW");
  const idA = B0207の商品ID("S-B02-07-KW-016", "B0207-016-CODEKW");
  const idB = B0207の商品ID("S-B02-07-KW-016", "B0207-016-B");
  let shown: string[] = [];
  await step(1, async () => {
    await nav.商品検索に入れる(keyword);
    await nav.検索ボタン().click();
    await page.waitForURL(/\/products\/search/, { timeout: 60_000 });
    await list.結果を待つ();
    note(`ヘッダの商品検索の入力欄に「${keyword}」を入れて検索を押した`);
  });
  await step(2, async () => {
    shown = (await list.カードを読む()).map((c) => c.商品ID);
    note(`商品一覧に出た商品の商品ID: ${shown.join("・") || "なし"}（商品A=${idA}・商品B=${idB}）`);
  });
  await expected(async () => {
    expect.soft(shown, "商品一覧に商品Aだけが表示される（商品Aの商品ID）").toEqual([idA]);
    expect.soft(shown.includes(idB), "商品Bは表示されない").toBe(false);
  });
});

caseTest("IT-B02-07-023", async ({ page, step, expected }) => {
  const nav = await 本店を開く(page);
  const list = new FrontProductList(page);
  const keyword = rc("B0207-FG023-NAMEKW");
  const idA = B0207の商品ID("S-B02-07-FGNAME-023", "B0207-FG023-A");
  const idB = B0207の商品ID("S-B02-07-FGNAME-023", "B0207-FG023-B");
  let shown: string[] = [];
  await step(1, async () => {
    await nav.商品検索に入れる(keyword);
    await nav.検索ボタン().click();
    await page.waitForURL(/\/products\/search/, { timeout: 60_000 });
    await list.結果を待つ();
    note(`ヘッダの商品検索の入力欄に「${keyword}」を入れて検索を押した`);
  });
  await step(2, async () => {
    shown = (await list.カードを読む()).map((c) => c.商品ID);
    note(`商品一覧に出た商品の商品ID: ${shown.join("・") || "なし"}（商品A=${idA}・商品B=${idB}）`);
  });
  await expected(async () => {
    expect.soft(shown, "商品一覧に商品Aだけが表示される（商品Aの商品ID）").toEqual([idA]);
    expect.soft(shown.includes(idB), "商品Bは表示されない").toBe(false);
  });
});
