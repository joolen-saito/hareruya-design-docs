/**
 * F05-02 ネット買取商品検索（フロント）。正本: cases/F05-02_test_cases.tsv
 *
 * 実装したのは、商品を外部の商品検索サービスの試験用索引へ反映しなくても成り立つケース
 * （モーダルの開閉・クリア・選択肢・論理演算子の初期値・条件なしの一覧）: 001・002・003・010・016・020・025。
 * ほかのケースは、使用シードが商品を作ってユニサーチフィード作成で試験用索引へ反映し、索引で確かめるまでを定める
 * （手元に試験用索引が無い）。014・015・018・021 は、加えて投入方法に DB での準備を含む。
 */
import { Locator, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { PurchaseSearchPage } from "../../pages/front/f05_02_purchase_search";
import { F0502マスタ } from "../../seeds/f05-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** ネット買取商品一覧のアドレス（/ja/purchase/search。末尾の / は問わない） */
const 一覧のパス = /^\/ja\/purchase\/search\/?$/;

/** 事前準備: 本店の日本語のネット買取商品一覧を、ログインなし・保存済み検索条件なし・モーダルが閉じた状態で開く（ケースの page は新しいセッション） */
async function 一覧を開く(s: PurchaseSearchPage): Promise<void> {
  expect(await s.開く(), "ネット買取商品一覧の応答").toBeLessThan(400);
  await expect(s.一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
  expect(await s.モーダルが開いている(), "開始時にネット買取商品検索モーダルが閉じている").toBe(false);
}

/** 「詳細検索」を押して、モーダルが開くのを待つ */
async function 詳細検索を押す(s: PurchaseSearchPage): Promise<void> {
  const 押したもの = await s.詳細検索を押す();
  if (押したもの !== "一覧左の欄の詳細検索ボタン") note(`一覧左の欄の「詳細検索」ボタンを押せなかったため、${押したもの}を押した`);
  await expect(s.モーダル, "ネット買取商品検索モーダル（開いた状態）").toHaveClass(/is-visible/);
}

const 買取詳細検索の注記 = "手順の「買取詳細検索」は、ネット買取商品一覧の「詳細検索」ボタン（ネット買取商品検索モーダルを開くボタン）と読んだ";

caseTest("IT-F05-02-001", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  note(買取詳細検索の注記);
  let 押す前のアドレス = "";
  await step(1, async () => { await 一覧を開く(s); 押す前のアドレス = page.url(); });
  await step(2, async () => { await 詳細検索を押す(s); });
  await expected(async () => {
    expect.soft(page.url(), "押したあとのアドレス（別の画面へ移っていない）").toBe(押す前のアドレス);
    expect.soft(new URL(page.url()).pathname, "表示している画面のアドレス（ネット買取商品一覧）").toMatch(一覧のパス);
    await expect.soft(s.一覧の印, "ネット買取商品一覧の画面のまま").toHaveCount(1);
    await expect.soft(s.モーダル, "ネット買取商品検索モーダルが表示されている").toBeVisible();
    await expect.soft(s.モーダル, "ネット買取商品検索モーダル（開いた状態の印）").toHaveClass(/is-visible/);
  });
});

caseTest("IT-F05-02-002", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  note(買取詳細検索の注記);
  const 閉じた: Record<string, boolean> = {};
  await 一覧を開く(s);
  await step(1, async () => { await 詳細検索を押す(s); });
  await step(2, async () => { await s.モーダル外を押す(); 閉じた["モーダル外を押したあと"] = !(await s.開閉後のモーダル()); });
  await step(3, async () => { await 詳細検索を押す(s); });
  await step(4, async () => { await s.閉じるボタン.click({ timeout: 30_000 }); 閉じた["閉じるボタンを押したあと"] = !(await s.開閉後のモーダル()); });
  await expected(async () => {
    expect.soft(閉じた["モーダル外を押したあと"], "モーダル外を押したあと、ネット買取商品検索モーダルが閉じた").toBe(true);
    expect.soft(閉じた["閉じるボタンを押したあと"], "閉じるボタンを押したあと、ネット買取商品検索モーダルが閉じた").toBe(true);
    expect.soft(await s.モーダルが開いている(), "いまネット買取商品検索モーダルが閉じている").toBe(false);
  });
});

caseTest("IT-F05-02-003", async ({ page, step, expected, capture }) => {
  const s = new PurchaseSearchPage(page);
  const M = F0502マスタ;
  await 一覧を開く(s);
  await step(1, async () => { await 詳細検索を押す(s); });
  await step(2, async () => {
    const 失敗 = await s.入れる({
      商品名: "F0502-ALL", カテゴリ: M.カテゴリB, 色: "赤", 固有色: "白", マナコスト: "3", カードタイプ: M.カードタイプA, サブタイプ: M.サブタイプA,
      フォーマット: M.フォーマットA, 禁止カードも表示する: true, 言語: "JP", レアリティ: "神話レア", Foil: "特殊", フレーム: "特殊", イラストレーター: M.イラストレーターA,
    });
    note("言語の「日本語」は、モーダルの言語の選択肢「JP」と読んだ");
    if ((await s.カードセット欄.count()) === 0) note("モーダルにカードセットの入力欄が無く、カードセット「F0502セット」を設定できなかった（設計書の識別ID 3 は「カテゴリと同じ項目のため削除」）");
    for (const f of 失敗) note(`設定できなかった項目: ${f}`);
    await capture("各項目を設定したモーダル");
  });
  await step(3, async () => { await s.クリアボタン.click(); await page.waitForTimeout(500); });
  await expected(async () => {
    const 入力 = (l: string, loc: Locator) => expect.soft(loc, l).not.toBeChecked();
    expect.soft(await s.商品名欄.inputValue(), "商品名の値").toBe("");
    expect.soft(await s.選択欄の値(s.カテゴリの選択欄), "カテゴリの選択（最上位の選択欄）").toBe("");
    expect.soft(await s.カテゴリの送る値.inputValue(), "カテゴリの送る値").toBe("");
    expect.soft(await s.カードセット欄.count(), "モーダルにカードセットの入力欄がある（設定してクリアで空になるかを見る対象）").toBeGreaterThan(0);
    await 入力("色「赤」の選択", s.色の入力("色", "赤"));
    await 入力("固有色「白」の選択", s.色の入力("固有色", "白"));
    await 入力("マナ・コスト「3」の選択", s.チェックの入力("mana-cost", "3"));
    await 入力(`カードタイプ「${M.カードタイプA}」の選択`, s.チェックの入力("card-type", M.カードタイプA));
    expect.soft(await s.選択欄の値(s.サブタイプ欄), "サブタイプの選択").toBe("");
    await 入力(`フォーマット「${M.フォーマットA}」の選択`, s.フォーマットの入力(M.フォーマットA));
    await 入力("禁止カードも表示するの選択", s.チェックの入力("format", "禁止カードも表示する"));
    await 入力("言語「JP」の選択", s.チェックの入力("language", "JP"));
    await 入力("レアリティ「神話レア」の選択", s.チェックの入力("rarity", "神話レア"));
    await 入力("Foil「特殊」の選択", s.チェックの入力("foil", "特殊"));
    await 入力("フレーム「特殊」の選択", s.チェックの入力("frame", "特殊"));
    expect.soft(await s.選択欄の値(s.イラストレーター欄), "イラストレーターの選択").toBe("");
  });
});

caseTest("IT-F05-02-010", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  const M = F0502マスタ;
  let 選択肢: string[] = [];
  await 一覧を開く(s);
  await step(1, async () => { await 詳細検索を押す(s); });
  await step(2, async () => { 選択肢 = await s.フォーマットの選択肢(); });
  await expected(async () => {
    expect.soft(選択肢, `フォーマットの選択肢に「${M.フォーマットC}」がある`).toContain(M.フォーマットC);
    expect.soft(選択肢, `フォーマットの選択肢に「${M.フォーマットD}」が無い`).not.toContain(M.フォーマットD);
  });
});

caseTest("IT-F05-02-016", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  note("手順の「モーダルを開く」は、ネット買取商品一覧の「詳細検索」ボタンを押して開いた");
  await 一覧を開く(s);
  await step(1, async () => { await 詳細検索を押す(s); await s.一覧の読み込みを待つ(); });
  await expected(async () => {
    await expect.soft(s.モーダル, "ネット買取商品検索モーダルが表示されている").toBeVisible();
    await expect.soft(s.フォーム, "検索フォームが表示されている").toBeVisible();
    expect.soft(await s.商品名欄.inputValue(), "検索フォームの商品名が未入力").toBe("");
    expect.soft(await s.一覧の商品数(), "検索結果の商品一覧に表示された商品の数").toBe(0);
    expect.soft(await s.モーダル.locator("#purchase-list-unisearch-shelf, .p-hareruya-product-list__grid").count(), "モーダルの中の検索結果の一覧").toBe(0);
  });
});

caseTest("IT-F05-02-020", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  let 応答 = 0;
  await step(1, async () => { 応答 = await s.開く("/ja/purchase/search?stock=0"); });
  await step(2, async () => { await s.一覧の読み込みを待つ(); });
  await expected(async () => {
    note(`検索のアドレスの応答のHTTPステータスは ${応答}（期待結果はステータスを定めない）`);
    await expect.soft(s.商品数, "一覧上部の商品数").toHaveText(/商品数:\s*0点/);
    await expect.soft(s.一覧本文, "一覧本文の該当なしの案内").toContainText("お探しの商品は見つかりませんでした");
    expect.soft(await s.一覧の商品数(), "一覧本文に表示された商品の数").toBe(0);
  });
});

caseTest("IT-F05-02-025", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  let 色: string[] = [];
  let カードタイプ: string[] = [];
  await 一覧を開く(s);
  await step(1, async () => { await 詳細検索を押す(s); });
  await step(2, async () => { 色 = await s.論理演算子の選択("色"); カードタイプ = await s.論理演算子の選択("カードタイプ"); });
  await expected(async () => {
    expect.soft(色, "色の論理演算子で選ばれている選択肢").toEqual(["or"]);
    expect.soft(カードタイプ, "カードタイプの論理演算子で選ばれている選択肢").toEqual(["or"]);
  });
});
