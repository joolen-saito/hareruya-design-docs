/**
 * F05-02 ネット買取商品検索（フロント）の続き。正本: cases/F05-02_test_cases.tsv（最初の7件は f05-02.spec.ts）
 *
 * 2026-11-11 に足した6件: 004・005・019・022・024・030。検索結果の商品の表示を確かめない
 * （アドレスの形・タグの説明文の表示・応答のHTTPステータス）ので、商品は画面で作るが外部の商品検索サービスの索引へは反映しない（seeds/f05-02-more.ts）。
 * 実装しないケースは PM への報告に理由を書いた（検索結果にその商品が出ることを確かめる・DB での準備・大量のデータ）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { PurchaseSearchPage } from "../../pages/front/f05_02_purchase_search";
import { F0502マスタ } from "../../seeds/f05-02";
import { F0502_タグ説明 } from "../../seeds/f05-02-more";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

async function 一覧を開く(s: PurchaseSearchPage): Promise<void> {
  expect(await s.開く(), "ネット買取商品一覧の応答").toBeLessThan(400);
  await expect(s.一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
  expect(await s.モーダルが開いている(), "開始時にネット買取商品検索モーダルが閉じている").toBe(false);
}

async function 詳細検索を押す(s: PurchaseSearchPage): Promise<void> {
  const 押したもの = await s.詳細検索を押す();
  if (押したもの !== "一覧左の欄の詳細検索ボタン") note(`一覧左の欄の「詳細検索」ボタンを押せなかったため、${押したもの}を押した`);
  await expect(s.モーダル, "ネット買取商品検索モーダル（開いた状態）").toHaveClass(/is-visible/);
}

const 買取詳細検索の注記 = "手順の「買取詳細検索」は、ネット買取商品一覧の「詳細検索」ボタン（ネット買取商品検索モーダルを開くボタン）と読んだ";
const 共有タグの注記 = "共有のタグ「最新入荷アイテム」・カテゴリ「シングルカード」は書き換えず、商品を所属させていない（ケースはアドレスの形だけを確かめる）";
const タグで開く注記 = "手順の「タグ「最新入荷アイテム(New Items)」を指定した画面」は、タグのIDで指定する一覧のアドレス（/ja/purchase/search/tag/タグID）で開いた。パスは、ロケールの接頭辞「/ja」を除いた符号化のままで比べた";

type アドレスの形 = { パス: string; 引数: [string, string][] };

caseTest("IT-F05-02-004", async ({ page, notes, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  note(買取詳細検索の注記);
  note(共有タグの注記);
  note(タグで開く注記);
  let 結果: アドレスの形 = { パス: "", 引数: [] };
  await step(1, async () => {
    expect(await s.開く(`/ja/purchase/search/tag/${notes.get("〔タグID-F0502-共有〕")}`), "タグを指定したネット買取商品一覧の応答").toBeLessThan(400);
    await expect(s.一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
  });
  await step(2, async () => { await 詳細検索を押す(s); });
  await step(3, async () => { await s.カテゴリを選ぶ(F0502マスタ.カテゴリA); await s.検索する(); });
  await step(4, async () => { 結果 = s.アドレス(); note(`検索後のアドレスのパス: ${結果.パス}、引数: ${JSON.stringify(結果.引数)}`); });
  await expected(async () => {
    expect.soft(結果.パス, "アドレスのパス（タグ・カテゴリの名称を符号化して並べた形）").toBe("/purchase/search/New%20Items/Single%20Cards");
    expect.soft(結果.パス, "パスに含まれるスペースの表し方（「%20」）").toContain("%20");
  });
});

caseTest("IT-F05-02-005", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  note(買取詳細検索の注記);
  let 結果: アドレスの形 = { パス: "", 引数: [] };
  let 検索後のアドレス = "";
  await 一覧を開く(s);
  await step(1, async () => { await 詳細検索を押す(s); });
  await step(2, async () => {
    await s.商品名欄.fill("F0502-FOIL-005");
    await s.チェックを選ぶ("foil", "特殊");
    await s.検索する();
  });
  await step(3, async () => { 結果 = s.アドレス(); 検索後のアドレス = page.url(); note(`検索後のアドレス: ${検索後のアドレス}`); });
  await expected(async () => {
    expect.soft(検索後のアドレス, "アドレスに「?」より後ろの検索条件がある").toContain("?");
    const foil = 結果.引数.filter(([k]) => /foil/i.test(k));
    expect.soft(foil.length, "Foilの検索条件（条件名=値）の数").toBeGreaterThanOrEqual(1);
    expect.soft(foil.every(([k, v]) => k !== "" && v !== ""), "Foilの検索条件が「条件名=値」の形（名前も値も空でない）").toBe(true);
  });
});

caseTest("IT-F05-02-019", async ({ page, notes, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  note("タグ「T-F0502-019」は固定の試験用の名称で、説明文は管理画面のタグ管理のフリーエリア(日)に入れた値。手順の「タグを検索条件に指定して開く」は、タグのIDで指定する一覧のアドレス（/ja/purchase/search/tag/タグID）で開いた");
  await step(1, async () => {
    expect(await s.開く(`/ja/purchase/search/tag/${notes.get("〔タグID-F0502-019〕")}`), "タグを指定したネット買取商品一覧の応答").toBeLessThan(400);
    await expect(s.一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
  });
  await expected(async () => {
    await expect.soft(s.説明の欄, "一覧の上の説明の欄に、タグの説明文が表示されている").toContainText(F0502_タグ説明);
  });
});

caseTest("IT-F05-02-022", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  note(買取詳細検索の注記);
  note("手順3の「ブラウザの開発者ツールで応答のHTTPステータスを確認」は、検索の送信で移った画面（メインの文書）の応答のステータスを、ブラウザの応答の記録から読んだ");
  let 応答 = 0;
  await 一覧を開く(s);
  await step(1, async () => { await 詳細検索を押す(s); });
  await step(2, async () => { await s.商品名欄.fill("F0502-NOHIT"); 応答 = (await s.検索する()).応答; await s.一覧の読み込みを待つ(); });
  await step(3, async () => { note(`検索結果画面の応答のHTTPステータス: ${応答}`); });
  await expected(async () => {
    await expect.soft(s.一覧本文, "一覧本文の該当なしの案内").toContainText("お探しの商品は見つかりませんでした");
    expect.soft(応答, "検索結果画面の応答のHTTPステータス").toBe(404);
  });
});

caseTest("IT-F05-02-024", async ({ page, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  let 応答 = 0;
  await step(1, async () => { 応答 = await s.開く("/ja/purchase/search?stock=0"); });
  await step(2, async () => { note(`検索結果画面の応答のHTTPステータス（開いたときの応答の記録から読んだ）: ${応答}`); });
  await expected(async () => {
    expect.soft(応答, "検索結果画面の応答のHTTPステータス").toBe(404);
  });
});

caseTest("IT-F05-02-030", async ({ page, notes, step, expected }) => {
  const s = new PurchaseSearchPage(page);
  note(買取詳細検索の注記);
  note(共有タグの注記);
  note(タグで開く注記);
  let 結果: アドレスの形 = { パス: "", 引数: [] };
  await step(1, async () => {
    expect(await s.開く(`/ja/purchase/search/tag/${notes.get("〔タグID-F0502-共有〕")}`), "タグを指定したネット買取商品一覧の応答").toBeLessThan(400);
    await expect(s.一覧の印, "ネット買取商品一覧の画面").toHaveCount(1);
  });
  await step(2, async () => { await 詳細検索を押す(s); });
  await step(3, async () => { await s.カテゴリを選ぶ(F0502マスタ.カテゴリA); await s.商品名欄.fill("F0502-MIX-030"); await s.検索する(); });
  await step(4, async () => { 結果 = s.アドレス(); note(`検索後のアドレスのパス: ${結果.パス}、引数: ${JSON.stringify(結果.引数)}`); });
  await expected(async () => {
    expect.soft(結果.パス, "アドレスのパス").toBe("/purchase/search/New%20Items/Single%20Cards");
    expect.soft(結果.パス, "商品名「F0502-MIX-030」がパスに含まれない").not.toContain("F0502-MIX-030");
    expect.soft(結果.引数.some(([k, v]) => k !== "" && v === "F0502-MIX-030"), "商品名「F0502-MIX-030」が「?」より後ろに「条件名=値」の形で含まれる").toBe(true);
  });
});
