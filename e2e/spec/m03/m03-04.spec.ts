/** M03-04 グッズ商品CSV出力。正本: cases/M03-04_test_cases.tsv（画面だけで準備できる 011・016） */
import { expect, test } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import {
  checkedProductCount, expectProductListScreen, goodsCsvExportButton, postIdsWithoutReferer, productListPath,
  readExportForm, searchWithInitialConditions, topErrors,
} from "../../pages/admin/m03_04_goods_csv_export";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0304_ADMIN } from "../../seeds/m03-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/**
 * 商品一覧画面の初期表示（検索前）には一覧が無く、「グッズ商品CSV出力」ボタンも無い（アプリは初期表示で商品を検索しない）。
 * ボタンを押せるように、既定の検索条件のまま「検索する >」を押して一覧を出す（正本の手順に無い操作。条件付きの合格の理由として注記に残す）。
 */
async function showListForExport(page: import("@playwright/test").Page): Promise<void> {
  const before = await goodsCsvExportButton(page).count();
  note(`商品一覧画面を開いた直後の「グッズ商品CSV出力」ボタンの数: ${before}`);
  if (before > 0) return;
  await searchWithInitialConditions(page);
  note("正本の手順に無い操作: ボタンが無いので、既定の検索条件のまま「検索する >」を押して一覧を出した");
  await expect(goodsCsvExportButton(page), "一覧を出したあとの「グッズ商品CSV出力」ボタン").toHaveCount(1);
}

caseTest("IT-M03-04-011", async ({ page, step, expected }) => {
  // 事前準備②: 新しいブラウザの状態（このケースのページ）で、商品一覧画面を開く前にログインする
  await loginAdmin(page, M0304_ADMIN);
  await step(1, async () => {
    await new ProductSearchPage(page).open();
  });
  await step(2, async () => {
    await showListForExport(page);
    expect(await checkedProductCount(page), "商品を1件も選んでいない").toBe(0);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), goodsCsvExportButton(page).click()]);
    note(`押したあとの画面: ${page.url()}・上部のエラー: ${(await topErrors(page)).join(" / ") || "なし"}`);
  });
  await expected(async () => {
    await expect.soft(page, "商品一覧画面の1ページ目へ移った").toHaveURL(productListPath(1));
    await expectProductListScreen(page, "押したあとの画面");
  });
});

caseTest("IT-M03-04-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M0304_ADMIN);
  let form: { 送信先: string; 方式: string; 送信項目: string[] } | null = null;
  let sent: { referer: string | undefined; 応答: number } | null = null;
  await step(1, async () => {
    await new ProductSearchPage(page).open();
  });
  await step(2, async () => {
    await showListForExport(page);
    form = await readExportForm(page);
    note(`グッズ商品CSV出力の送信先: ${form.送信先}・方式: ${form.方式}・送信項目: ${form.送信項目.join("、")}`);
    expect(form.送信項目, "送信項目に商品IDの並び（ids[]）がある").toContain("ids[]");
  });
  await step(3, async () => {
    sent = await postIdsWithoutReferer(page, form!.送信先, ["999999016"]);
    note(`送った要求の Referer: ${sent.referer ?? "なし"}・応答: ${sent.応答}・移った画面: ${page.url()}`);
    expect(sent.referer, "送った要求に Referer ヘッダが付いていない").toBeUndefined();
  });
  await expected(async () => {
    // 商品一覧画面のアドレス（/product、/product/page、/product/page/番号。問い合わせ部分は問わない）
    const path = new URL(page.url()).pathname;
    const list = new URL(productListPath()).pathname;
    expect.soft(path === list || (path.startsWith(list) && /^\/page(\/\d+)?$/.test(path.slice(list.length))), `商品一覧画面のアドレスへ移った（${page.url()}）`).toBe(true);
    await expectProductListScreen(page, "要求のあとの画面");
  });
});
