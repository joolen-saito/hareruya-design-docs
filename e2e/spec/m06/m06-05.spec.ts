/**
 * M06-05 買取商品履歴(検索入力・検索結果)。正本: cases/M06-05_test_cases.tsv
 *
 * 画面だけで準備できる5件（001・002・027・032・042）を実装した（記録 review/M06-05_progress_2026-11-01.md）。
 * MTGバイヤー（買取端末のアプリ）で査定・買取成立を行うシード（013・016・017・048・049・052）と、DBへ直接設定するシードを使うケースは実装しない。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { HistoryPage } from "../../pages/admin/m06_05_history";
import { M0605_ALL, M0605_TOKYO, prepareRestore0 } from "../../seeds/m06-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

// 買取店舗の選択肢とデフォルト検索表示店舗
caseTest("IT-M06-05-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_TOKYO);
  const h = new HistoryPage(page);
  await step(1, async () => { await h.open(); });
  let options: string[] = [];
  let selected = "";
  await step(2, async () => { options = await h.買取店舗の選択肢(); selected = await h.買取店舗の選択中(); });
  await expected(async () => {
    expect.soft(options, "買取店舗の選択肢（店舗マスタの東京店）").toContain("東京店");
    expect.soft(options, "買取店舗の選択肢（店舗マスタの大阪店）").toContain("大阪店");
    expect.soft(selected, "選択されている買取店舗（デフォルト検索表示店舗の東京店）").toBe("東京店");
  });
});

// 全店のメンバーは買取店舗が未選択
caseTest("IT-M06-05-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  await step(1, async () => { await h.open(); });
  let selected = "(未取得)";
  await step(2, async () => { selected = await h.買取店舗の選択中(); });
  await expected(async () => {
    expect.soft(selected, "選択されている買取店舗（未選択）").toBe("");
  });
});

// 検索を実行していないセッションで2ページ目を開く
caseTest("IT-M06-05-027", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  let status = 0;
  await step(1, async () => { status = await h.ページを開く(2); });
  await expected(async () => {
    expect.soft(status, "2ページ目を開いたときの応答").toBeLessThan(400);
    await expect.soft(h.結果の表の行(), "履歴一覧が表示されない").toHaveCount(0);
    await expect.soft(h.ページング(), "ページングが表示されない").toHaveCount(0);
    await expect.soft(page.locator("form#search_form"), "買取商品履歴(検索入力)画面の検索欄が表示される").toBeVisible();
  });
  note("既定表示件数を50件に設定する事前準備は、管理画面に設定の項目が無く行えていない（アプリの設定値は10件）。一覧が出ない画面には件数の表示が無く、件数が50件であることは確かめていない");
});

// CSVダウンロードの検索結果全件取得（検索結果が無い画面には、ダウンロードのボタンが出ない）
caseTest("IT-M06-05-032", async ({ page, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.CSVダウンロードで選ぶ("検索結果全件取得"); });
  await expected(async () => {
    await expect.soft(h.上部のエラー().first(), "管理画面上部にエラーが表示される").toBeVisible();
    expect.soft(new URL(page.url()).pathname, "移った先の画面（買取商品履歴）").toMatch(/\/otcbuyorder\/history(\/page\/\d+)?$/);
    await expect.soft(h.結果の表の行(), "一覧を伴わない").toHaveCount(0);
  });
});

// 保持済みの検索条件の結果が0件のとき、ページ切替で「該当データなし」
caseTest("IT-M06-05-042", async ({ page, capture, step, expected }) => {
  await loginAdmin(page, M0605_ALL);
  const h = new HistoryPage(page);
  await prepareRestore0(page);
  await capture("保持済みの検索条件（商品コードM0605-042-P・表示件数10件）を作ったあと");
  await step(1, async () => { await h.ページを開く(2); });
  await expected(async () => {
    expect.soft(await h.結果の欄の文(), "検索結果ボックスの見出し").toContain("検索条件に該当するデータがありませんでした。");
    await expect.soft(h.結果の表の行(), "履歴一覧が表示されない").toHaveCount(0);
    await expect.soft(h.ページング(), "ページ送りが表示されない").toHaveCount(0);
  });
});
