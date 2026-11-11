/**
 * F05-03 ネット買取商品一覧（フロント）。正本: cases/F05-03_test_cases.tsv
 *
 * 実装したのは、商品を外部の商品検索サービスの索引へ反映しなくても成り立つケース:
 * 001（条件なしで開く）・010（詳細検索の2つの入口）・011（パンくず）・012（パンくずの🏠）・014（ネット買取・店頭買取のリンク）・040（カテゴリ一覧の比較）。
 * 残りは、検索結果にその商品が出ること（索引・ユニサーチフィードの更新）、共有の設定・レイアウトの書き換え、まとめて買取商品の設定（013）を要するので実装しない。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { F0503買取一覧 } from "../../pages/front/f05_03_purchase_list";
import { 入口 } from "../../pages/front/f03_04_category_list";
import { PurchaseTopPage, ツリーの項目 } from "../../pages/front/f05_01_purchase_top";
import { F0503_011 } from "../../seeds/f05-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 一覧のパス = "/ja/purchase/search";

async function 一覧を開く(s: F0503買取一覧, path = 一覧のパス): Promise<number> {
  const status = await s.検索.開く(path);
  expect(status, "ネット買取商品一覧の応答").toBeLessThan(400);
  await expect(s.検索.一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
  return status;
}

caseTest("IT-F05-03-001", async ({ page, step, expected }) => {
  const s = new F0503買取一覧(page);
  note("検索条件・表示順・ページ番号・1ページの表示件数を指定しないアドレス（/ja/purchase/search）で開いた");
  await step(1, async () => { await 一覧を開く(s); await s.落ち着くのを待つ(); });
  await expected(async () => {
    await expect.soft(s.検索フォーム, "検索フォームが表示されている").toBeVisible();
    expect.soft(await s.検索.一覧の商品数(), "商品一覧に表示された商品の数").toBe(0);
    await expect.soft(s.検索.商品数, "商品数の表示（「商品数: N点」）が表示されない").toBeHidden();
    expect.soft(await s.ページ送りの項目.count(), "ページ送りの項目の数（上部・下部）").toBe(0);
  });
});

caseTest("IT-F05-03-010", async ({ page, step, expected }) => {
  const s = new F0503買取一覧(page);
  const 開いた: Record<string, boolean> = {};
  note("手順の「買取詳細検索」は、ネット買取商品一覧の「詳細検索」ボタン（ネット買取商品検索モーダルを開くボタン）と読んだ。「ネット買取商品検索画面」はそのモーダル");
  await step(1, async () => { await 一覧を開く(s); expect(await s.検索.モーダルが開いている(), "開始時にモーダルが閉じている").toBe(false); });
  await step(2, async () => {
    const 押したもの = await s.検索.詳細検索を押す();
    if (押したもの !== "一覧左の欄の詳細検索ボタン") note(`一覧左の欄の「詳細検索」ボタンを押せなかったため、${押したもの}を押した`);
    await expect(s.検索.モーダル, "ネット買取商品検索モーダル（開いた状態）").toHaveClass(/is-visible/);
    開いた["買取詳細検索を押したあと"] = await s.検索.モーダルが開いている();
  });
  await step(3, async () => {
    await s.検索.閉じるボタン.click({ timeout: 30_000 });
    expect(await s.検索.開閉後のモーダル(), "閉じるボタンを押したあと、モーダルが閉じた").toBe(false);
  });
  await step(4, async () => {
    const 押したもの = await s.絞り込み領域の詳細検索を押す();
    if (押したもの !== "絞り込み領域の詳細検索ボタン") note(`絞り込み領域の「詳細検索」ボタンを押せなかったため、${押したもの}を押した`);
    await expect(s.検索.モーダル, "ネット買取商品検索モーダル（開いた状態）").toHaveClass(/is-visible/);
    開いた["絞り込み領域の詳細検索を押したあと"] = await s.検索.モーダルが開いている();
  });
  await expected(async () => {
    expect.soft(開いた["買取詳細検索を押したあと"], "買取詳細検索を押したあと、ネット買取商品検索画面がモーダルで表示された").toBe(true);
    expect.soft(開いた["絞り込み領域の詳細検索を押したあと"], "絞り込み領域の詳細検索を押したあと、ネット買取商品検索画面がモーダルで表示された").toBe(true);
    await expect.soft(s.検索.モーダル, "ネット買取商品検索モーダルが表示されている").toBeVisible();
  });
});

caseTest("IT-F05-03-011", async ({ page, notes, step, expected }) => {
  const s = new F0503買取一覧(page);
  const C = notes.get("〔カテゴリレコードID-F0503-011C〕");
  const タグ = notes.get("〔タグレコードID-F0503-011〕");
  const 商品名 = "BREAD-001-011";
  let 条件あり: string[] = [];
  let タグのみ: string[] = [];
  note("手順の「カテゴリに〜を指定」は、最下層のカテゴリ（階層「スタンダード-011＞タルキール：龍嵐録-011＞タルキール：龍嵐録-011」の最下層）のIDをアドレスのカテゴリに指定して開いた。商品名は引数 product、レアリティは引数 rarity[0] に、控えた番号を指定した");
  note("パンくずの項目は、🏠・詳細検索・カテゴリ階層・現在地（商品名とレアリティを「・」でつないだ項目）の順に並べて比べた。名称の末尾の「-実行の印」は実行ごとに付けた印");
  await step(1, async () => {
    await 一覧を開く(s, `${一覧のパス}/cate/${C}?product=${encodeURIComponent(商品名)}&rarity%5B0%5D=${F0503_011.レアリティID}`);
    await s.落ち着くのを待つ();
    条件あり = await s.パンくずの項目();
    note(`商品名パラメータありのパンくず: ${条件あり.join(" > ")}`);
  });
  await step(2, async () => {
    await 一覧を開く(s, `${一覧のパス}/tag/${タグ}`);
    await s.落ち着くのを待つ();
    タグのみ = await s.パンくずの項目();
    note(`商品名パラメータなしのパンくず: ${タグのみ.join(" > ")}`);
  });
  await expected(async () => {
    expect.soft(条件あり, "商品名パラメータがあるときのパンくず（🏠、詳細検索、カテゴリ階層、レアリティ・言語等の順）").toEqual([
      "🏠", "詳細検索", F0503_011.名称.最上位, F0503_011.名称.カテゴリ, F0503_011.名称.カテゴリ, `${商品名}・${F0503_011.名称.レア}`,
    ]);
    expect.soft(タグのみ, "商品名パラメータがないときのパンくず（🏠とタグ名）").toEqual(["🏠", F0503_011.名称.タグ]);
  });
});

caseTest("IT-F05-03-012", async ({ page, step, expected }) => {
  const s = new F0503買取一覧(page);
  const top = new PurchaseTopPage(page);
  await step(1, async () => { await 一覧を開く(s); });
  await step(2, async () => { await s.パンくずのホームを押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.replace(/\/$/, ""), "遷移先のアドレスのパス（買取TOP）").toBe("/ja/purchase");
    await expect.soft(top.画面の印, "買取TOP画面（ネット買取商品一覧ではない）").toHaveCount(1);
  });
});

caseTest("IT-F05-03-014", async ({ page, step, expected }) => {
  const s = new F0503買取一覧(page);
  const 遷移先: Record<string, string> = {};
  note("手順の「ネット買取リンク」「店頭買取リンク」は、一覧の下にある買取スタイルのバナー（ネット買取・店頭買取の2枚）のリンクと読んだ");
  await step(1, async () => { await 一覧を開く(s); });
  await step(2, async () => { await s.買取スタイルを押す("purchase_net"); 遷移先["ネット買取"] = new URL(page.url()).pathname; note(`ネット買取リンクの遷移先: ${page.url()}`); });
  await step(3, async () => { await 一覧を開く(s); });
  await step(4, async () => { await s.買取スタイルを押す("purchase_store"); 遷移先["店頭買取"] = new URL(page.url()).pathname; note(`店頭買取リンクの遷移先: ${page.url()}`); });
  await expected(async () => {
    expect.soft(遷移先["ネット買取"], "ネット買取リンクの遷移先のパス").toMatch(/\/user_data\/purchase_net\/?$/);
    expect.soft(遷移先["店頭買取"], "店頭買取リンクの遷移先のパス").toMatch(/\/user_data\/purchase_store\/?$/);
  });
});

caseTest("IT-F05-03-040", async ({ page, step, expected }) => {
  const s = new F0503買取一覧(page);
  const 道具 = new PurchaseTopPage(page);
  let 販売側: Record<string, ツリーの項目[]> = {};
  let 買取側: Record<string, ツリーの項目[]> = {};
  note("ツリーの構成と表示項目は、3つの枠（最新セット・フォーマット別・その他）ごとの第一階層の名称と画像の有無、展開した子の名称と画像の有無で比べた（リンク先は販売側と買取側で違う作りなので比べない）。販促バナーはカテゴリの項目ではないので、比べる対象に入らない");
  await step(1, async () => {
    expect(await 道具.カテゴリ.パスを開く(`${入口.本店}/products/search`), "販売側の商品一覧の応答").toBeLessThan(400);
    販売側 = await 道具.ツリーの構成();
  });
  await step(2, async () => {
    expect(await 道具.カテゴリ.パスを開く(一覧のパス), "ネット買取商品一覧の応答").toBeLessThan(400);
    await expect(s.検索.一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
    買取側 = await 道具.ツリーの構成();
  });
  await expected(async () => {
    for (const [枠, 名] of [["latest-set", "最新セット"], ["formats", "フォーマット別"], ["others", "その他"]] as const) {
      expect.soft(販売側[枠]?.length ?? 0, `販売側の「${名}」の枠の第一階層の数（比べる対象がある）`).toBeGreaterThan(0);
      expect.soft(買取側[枠], `ネット買取商品一覧の「${名}」の枠のツリーの構成と表示項目が、販売側と同じ`).toEqual(販売側[枠]);
    }
  });
});
