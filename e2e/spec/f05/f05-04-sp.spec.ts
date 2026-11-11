/**
 * F05-04 ネット買取商品詳細（フロント）のSP版。正本: cases/F05-04_test_cases.tsv（002・003）
 * スマートフォン表示は、iPhone の利用者エージェント・画面の大きさ・タッチの設定のブラウザで代える（F02-02 の前例）。
 *
 * 画面の作り（アプリの breadcrumb_nav.twig で確かめた）:
 * - ネット買取商品詳細のパンくずは、ホームのアイコン、商品のカテゴリの階層（最上位から商品のカテゴリまで）、現在のページの項目（商品名）の順。
 * 正本の期待結果は「ホームアイコンとカテゴリ…からなる」と書くが、画面は最上位のカテゴリと現在のページの項目も出す作りなので、
 * 並びは『ホーム・（最上位から商品のカテゴリまでの階層）・現在のページの項目』で確かめ、解釈として注記に残す。
 * カテゴリ「タルキール：龍嵐録」「サプライ・グッズ＞スリーブ＞KMC」は、共有のカテゴリを書き換えないため、実行の印つきのカテゴリに代えた（シードの注記）。
 */
import { devices, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { NetBuyDetailPage } from "../../pages/front/f05_04_net_detail";
import { F0504カテゴリ, F0504サプライの階層 } from "../../seeds/f05-04";

const { userAgent, viewport, deviceScaleFactor, isMobile, hasTouch } = devices["iPhone 13"];
test.use({ userAgent, viewport, deviceScaleFactor, isMobile, hasTouch });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function パンくずを読む(d: NetBuyDetailPage) {
  await expect(d.パンくず, "パンくずリスト（SP版）").toBeVisible();
  const items = await d.パンくずの項目();
  return {
    先頭はホーム: items[0]?.ホーム === true,
    ホームの数: items.filter((i) => i.ホーム).length,
    カテゴリ: items.filter((i) => !i.ホーム && !i.現在).map((i) => i.名称),
    現在: items.filter((i) => i.現在).map((i) => i.名称),
    全体: items.map((i) => (i.ホーム ? "（ホーム）" : i.名称)),
  };
}

caseTest("IT-F05-04-002", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => {
    d = new NetBuyDetailPage(page);
    expect(await d.開く(notes.get("〔商品ID-F0504-002〕")), "ネット買取商品詳細（SP版）の応答").toBeLessThan(400);
    await expect(d.商品名, "ネット買取商品詳細の商品名の見出し").toBeVisible();
  });
  await expected(async () => {
    const b = await パンくずを読む(d);
    note(`パンくずの並び: ${b.全体.join(" ＞ ")}。カテゴリ「タルキール：龍嵐録」は、シングルカード配下の実行の印つきのカテゴリに代えた。画面は最上位のカテゴリ（シングルカード）と、現在のページの項目（商品名）も出す`);
    expect.soft(b.先頭はホーム, "パンくずの先頭がホームアイコン").toBe(true);
    expect.soft(b.ホームの数, "ホームアイコンの数").toBe(1);
    expect.soft(b.カテゴリ, "ホームと現在のページの項目の間のカテゴリ（最上位から商品のカテゴリまで）").toEqual(["シングルカード", rc(F0504カテゴリ.単体)]);
    expect.soft(b.現在, "現在のページの項目").toEqual([rc("F0504-CARD-001-002")]);
  });
});

caseTest("IT-F05-04-003", async ({ page, notes, step, expected }) => {
  let d!: NetBuyDetailPage;
  await step(1, async () => {
    d = new NetBuyDetailPage(page);
    expect(await d.開く(notes.get("〔商品ID-F0504-003〕")), "ネット買取商品詳細（SP版）の応答").toBeLessThan(400);
    await expect(d.商品名, "ネット買取商品詳細の商品名の見出し").toBeVisible();
  });
  await expected(async () => {
    const b = await パンくずを読む(d);
    note(`パンくずの並び: ${b.全体.join(" ＞ ")}。「スリーブ」「KMC」は、サプライ・グッズの下の実行の印つきのカテゴリに代えた。画面は現在のページの項目（商品名）も出す`);
    expect.soft(b.先頭はホーム, "パンくずの先頭がホームアイコン").toBe(true);
    expect.soft(b.ホームの数, "ホームアイコンの数").toBe(1);
    expect.soft(b.カテゴリ, "ホームの次からの順（サプライ・グッズ、スリーブ、KMC）").toEqual(["サプライ・グッズ", rc(F0504サプライの階層.スリーブ), rc(F0504サプライの階層.KMC)]);
    expect.soft(b.現在, "現在のページの項目").toEqual([rc("F0504-SUPPLY-003")]);
  });
});
