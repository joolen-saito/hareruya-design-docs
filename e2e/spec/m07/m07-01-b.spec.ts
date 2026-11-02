/**
 * M07-01 買取検索一覧（ページング・削除系）。正本: cases/M07-01_test_cases.tsv
 * 共有シード PAGING（申込61回）と、削除系のシード（21回・11回の申込）を使うケースを実装した（記録 review/M07-01_progress_2026-11-02.md）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin, adminUrl } from "../../lib/session";
import { BuyListPage } from "../../pages/admin/m07_buy";
import { M0701_ADMIN } from "../../seeds/m07-01";
import "../../seeds/m07-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** ページング系の開始時の片付け: 共有シードの範囲の外の「ページ試験」の買取を削除する（シード表の手順(3)） */
const 現在のページ = (page: import("@playwright/test").Page) => new URL(page.url()).pathname.match(/\/page\/(\d+)/)?.[1] ?? "（ページ指定なし）";

caseTest("IT-M07-01-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる("ページ試験"); await l.検索する(); });
  await step(3, async () => { await l.件数を選ぶ(50); await l.並べかえる("買取依頼日", "昇順"); note("並べかえ項目の「注文日時」は、画面では「買取依頼日」"); });
  await step(4, async () => { await l.ページを開く(2); });
  await expected(async () => {
    expect.soft(await l.注文者名の欄().inputValue(), "復元された注文者名").toBe("ページ試験");
    expect.soft(await l.選ばれた件数(), "復元された表示件数").toBe(50);
    expect.soft(await l.並べかえの表示(), "復元された並べかえ").toMatch(/買取依頼日.*昇順/);
    expect.soft((await l.行()).length, "2ページ目の行数（残り11件）").toBe(11);
  });
});

caseTest("IT-M07-01-027", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる("ページ試験"); await l.検索する(); });
  await step(3, async () => { await l.件数を選ぶ(10); await l.ページを開く(2); });
  await step(4, async () => { await l.件数を選ぶ(50); });
  await expected(async () => {
    expect.soft(await l.選ばれた件数(), "表示件数").toBe(50);
    expect.soft(現在のページ(page), "表示しているページ（1ページ目）").toBe("1");
  });
});

caseTest("IT-M07-01-028", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる("ページ試験"); await l.検索する(); });
  await step(3, async () => { await l.件数を選ぶ(50); });
  await step(4, async () => {
    // 開発者ツールで、件数の選択肢の送信値（アドレスの page_count）を25に書き換えて送信する
    const url = await l.表示件数の選択().locator("option:checked").getAttribute("value");
    const changed = (url ?? "").replace(/page_count=\d+/, "page_count=25");
    await Promise.all([page.waitForLoadState("load"), page.goto(new URL(changed, page.url()).toString())]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(await l.選ばれた件数(), "表示件数（25は適用されず50のまま）").toBe(50);
  });
});

caseTest("IT-M07-01-032", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる("ページ試験"); await l.検索する(); });
  await step(3, async () => {
    // 開発者ツールで、ソート順の送信値を invalid に書き換えて送る（ソート順の指定つきのアドレスを開く）
    await page.goto(adminUrl("/purchase/page/1?sort=default&order=invalid"), { timeout: 60_000 });
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft((await page.locator(".alert-danger, .invalid-feedback").allInnerTexts()).filter((t) => !t.includes("デバッグモード")).length, "ソートエラーの表示の数").toBeGreaterThan(0);
    await expect.soft(l.結果の表の行(), "検索結果一覧の行").toHaveCount(0);
    await expect.soft(l.ページング(), "ページング").toHaveCount(0);
  });
});

caseTest("IT-M07-01-041", async ({ page, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  let 付けた = { 合計: 0, 付き: 0 }, 外した = { 合計: 0, 付き: 0 };
  const 数える = async () => ({ 合計: await page.locator("input.searched_buy_order_id").count(), 付き: await page.locator("input.searched_buy_order_id:checked").count() });
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる("ページ試験"); await l.検索する(); });
  await step(3, async () => { await l.全選択のチェック().check({ timeout: 30_000 }); 付けた = await 数える(); });
  await step(4, async () => { await l.全選択のチェック().uncheck({ timeout: 30_000 }); 外した = await 数える(); });
  await expected(async () => {
    expect.soft(付けた.付き, "チェックを付けたあとの、チェック済みの買取情報の数").toBe(付けた.合計);
    expect.soft(付けた.合計, "表示中の買取情報の数").toBeGreaterThan(0);
    expect.soft(外した.付き, "チェックを外したあとの、チェック済みの買取情報の数").toBe(0);
  });
});

caseTest("IT-M07-01-049", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const B = notes.get("〔買取番号-M0701-049B〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる("削除保持"); await l.検索する(); });
  await step(3, async () => { await l.ページを開く(2); });
  await step(4, async () => { await l.三点リーダーを押す(B); });
  await step(5, async () => { await l.削除する(B, "OK"); });
  await expected(async () => {
    await expect.soft(l.行の(B), "削除した買取の行").toHaveCount(0);
    expect.soft(現在のページ(page), "表示しているページ（保持された2ページ目）").toBe("2");
    expect.soft((await l.行()).length, "2ページ目の行数").toBeGreaterThan(0);
  });
});

caseTest("IT-M07-01-050", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0701_ADMIN);
  const l = new BuyListPage(page);
  const A = notes.get("〔買取番号-M0701-050A〕");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.注文者名を入れる("削除最終"); await l.検索する(); });
  await step(3, async () => { await l.ページを開く(2); });
  await step(4, async () => { await l.削除する(A, "OK"); });
  await expected(async () => {
    await expect.soft(l.行の(A), "削除した買取の行").toHaveCount(0);
    expect.soft(現在のページ(page), "表示しているページ（1ページ目へ戻る）").toBe("1");
    expect.soft((await l.行()).length, "検索結果の行数（1ページ目の10件）").toBe(10);
  });
});
