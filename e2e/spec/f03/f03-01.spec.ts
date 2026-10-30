/**
 * F03-01 商品一覧。正本: cases/F03-01_test_cases.tsv
 *
 * 実装したのは、商品を作らず検索サービスの索引へ反映しなくても成り立つケース（003・008・012・018・019）だけ。
 * 商品を作って索引へ反映するシードを使うケースと、投入方法がDBでの準備のシードを使うケースは実装しない
 * （記録 e2e/review/F03-01_progress_2026-10-30.md）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { FrontDetailSearch } from "../../pages/front/f03_03_detail_search";
import { FrontProductList, 店舗の入口 } from "../../pages/front/f03_01_product_list";
import "../../seeds/f03-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const pathOf = (url: string) => new URL(url).pathname;

caseTest("IT-F03-01-003", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const 遷移先: Record<string, string> = {};
  await step(1, async () => {
    expect(await list.open(店舗の入口.本店), "本店の商品一覧の応答").toBeLessThan(400);
    await list.パンくずのホームを押す();
    遷移先["本店"] = pathOf(page.url());
  });
  await step(2, async () => {
    expect(await list.open(店舗の入口.TC大阪支店), "TC大阪支店の商品一覧の応答").toBeLessThan(400);
    await list.パンくずのホームを押す();
    遷移先["TC大阪支店"] = pathOf(page.url());
  });
  await expected(async () => {
    expect.soft(遷移先["本店"], "本店でパンくずの🏠を押したあとの画面（本店TOP）").toBe("/ja/");
    expect.soft(遷移先["TC大阪支店"], "TC大阪支店でパンくずの🏠を押したあとの画面（TC大阪支店TOP）").toBe("/ja/osaka/");
  });
});

caseTest("IT-F03-01-008", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const search = new FrontDetailSearch(page);
  const 開いた: Record<string, boolean> = {};
  await step(1, async () => { expect(await list.open(店舗の入口.本店), "商品一覧の応答").toBeLessThan(400); });
  await step(2, async () => {
    await list.画面上部の商品詳細検索().click({ timeout: 30_000 });
    await expect(search.モーダル, "画面上部の商品詳細検索を押したあとのモーダル").toHaveClass(/is-visible/);
    開いた["画面上部の商品詳細検索ボタン"] = await search.モーダルが開いている();
  });
  await step(3, async () => {
    await search.閉じるボタン.click({ timeout: 30_000 });
    expect(await search.開閉後のモーダル(), "商品詳細検索を閉じたあと").toBe(false);
  });
  await step(4, async () => {
    const 押したもの = await list.絞り込み領域の詳細検索を押す();
    if (押したもの !== "絞り込み領域の詳細検索ボタン") note("固定のヘッダーが絞り込み領域の「詳細検索」ボタンを覆って押せなかったため、画面上部の「詳細検索」ボタンを押した");
    await expect(search.モーダル, "絞り込み領域の詳細検索を押したあとのモーダル").toHaveClass(/is-visible/);
    開いた["絞り込み領域の詳細検索ボタン"] = await search.モーダルが開いている();
  });
  await expected(async () => {
    expect.soft(開いた["画面上部の商品詳細検索ボタン"], "画面上部の商品詳細検索ボタンで、商品詳細検索がモーダルで表示された").toBe(true);
    expect.soft(開いた["絞り込み領域の詳細検索ボタン"], "絞り込み領域の詳細検索ボタンで、商品詳細検索がモーダルで表示された").toBe(true);
  });
});

caseTest("IT-F03-01-012", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const 指定: Record<string, string[]> = {};
  await step(1, async () => {
    expect(await list.open(店舗の入口.本店), "本店の商品一覧の応答").toBeLessThan(400);
    await list.描画を待つ();
    指定["本店"] = await list.ロボット向け指定();
  });
  await step(2, async () => {
    expect(await list.open(店舗の入口.TC大阪支店), "TC大阪支店の商品一覧の応答").toBeLessThan(400);
    await list.描画を待つ();
    指定["TC大阪支店"] = await list.ロボット向け指定();
  });
  await expected(async () => {
    note(`headのロボット向け指定: 本店=[${指定["本店"].join(",")}]、TC大阪支店=[${指定["TC大阪支店"].join(",")}]`);
    expect.soft(指定["TC大阪支店"].some((c) => /noindex/i.test(c)), "TC大阪支店の商品一覧にnoindexの指定がある").toBe(true);
    expect.soft(指定["本店"].some((c) => /noindex/i.test(c)), "本店の商品一覧にnoindexの指定がある（無いはず）").toBe(false);
  });
});

caseTest("IT-F03-01-018", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  await step(1, async () => {
    expect(await list.open(店舗の入口.本店), "商品一覧の応答").toBeLessThan(400);
    await list.描画を待つ();
  });
  await expected(async () => {
    await expect.soft(list.検索フォーム, "検索フォーム").toBeVisible();
    expect.soft(await list.ログイン用フォーム.count(), "ログイン用フォームの数").toBeGreaterThan(0);
    expect.soft(await list.商品カード.count(), "表示されている商品（商品カードの数）").toBe(0);
    await expect.soft(list.商品の一覧, "商品の一覧").toHaveCount(0);
    await expect.soft(list.商品数, "商品数の表示").toHaveCount(0);
    await expect.soft(list.ページ送り, "ページ送り").toHaveCount(0);
  });
});

caseTest("IT-F03-01-019", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  let 応答 = 0;
  await step(1, async () => {
    応答 = await list.open(店舗の入口.本店, "/products/search/cate/999");
    await list.描画を待つ();
  });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "表示している画面（商品一覧画面に留まる）").toMatch(/^\/ja\/products\/search/);
    expect.soft(応答, "画面の応答（エラー画面でなく商品一覧画面が開く）").toBeLessThan(400);
    expect.soft(await list.商品カード.count(), "表示されている商品（商品カードの数）").toBe(0);
    await expect.soft(list.商品の一覧, "商品の一覧").toHaveCount(0);
  });
});
