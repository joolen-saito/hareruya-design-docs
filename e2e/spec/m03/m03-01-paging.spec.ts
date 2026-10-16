/** M03-01-035〜039・042: 商品マスター(検索結果)の表示件数・ページ送りと、検索条件の保持・破棄。 */
import { expect, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { caseTest } from "../../lib/case";
import { adminUrl, hideDebugToolbar, loginAdmin } from "../../lib/session";
import { ProductPageCountPage } from "../../pages/admin/m03_01_page_count";
import {
  DELETE_DONE_MESSAGE, ProductBulkDelete, documentWasReloaded, markCurrentDocument,
} from "../../pages/admin/product_bulk_delete";
import { ProductResultPaging } from "../../pages/admin/product_result_paging";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-page-config";
import "../../seeds/m03-01-paging";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 新しいセッションで検索入力画面を開き、検索条件・ページ番号・表示件数が保持されていないことを確かめる（事前準備①） */
async function openFresh(search: ProductSearchPage): Promise<void> {
  await search.open();
  await search.expectNoRetainedSearchConditions();
  await search.expectNoRetainedPageState();
}

caseTest("IT-M03-01-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.field("product_name").fill("終端商品");
  });
  await step(3, () => search.submitAndWaitForResult());
  await step(4, () => paging.chooseCount(10));
  await step(5, () => paging.goToPage(2));
  await expected(async () => {
    const lastId = notes.get("〔商品ID-M0301-035K〕");
    await expect.soft(search.field("product_name"), "商品名「終端商品」が保持される").toHaveValue("終端商品");
    expect.soft(await paging.selectedCountLabel(), "表示件数10件が保持される").toBe("10件");
    expect.soft(await paging.currentPage(), "2ページ目を表示している").toBe("2");
    await expect.soft(page.locator(`#ex-product-${lastId}`), "2ページ目に終端商品11が表示される").toBeVisible();
    expect.soft(await paging.productNames(), "2ページ目の商品名").toContain("終端商品11");
  });
});

caseTest("IT-M03-01-036", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.field("product_name").fill("保持商品-036");
  });
  await step(3, () => search.submitAndWaitForResult());
  await step(4, async () => {
    expect(await paging.selectedCountLabel(), "変更前の件数は10件").toBe("10件");
    await paging.chooseCount(50);
  });
  await expected(async () => {
    await expect.soft(search.field("product_name"), "商品名「保持商品-036」が保持される").toHaveValue("保持商品-036");
    expect.soft(await paging.totalCount(), "該当件数は51件").toBe(51);
    await expect.soft(paging.rows, "1ページ目に50件が表示される").toHaveCount(50);
    expect.soft(await paging.currentPage(), "1ページ目を表示している").toBe("1");
    expect.soft(await paging.selectedCountLabel(), "表示件数は50件").toBe("50件");
  });
});

caseTest("IT-M03-01-037", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.field("product_name").fill("保持商品-037");
  });
  await step(3, () => search.submitAndWaitForResult());
  await step(4, async () => {
    await paging.chooseCount(50);
    await paging.goToPage(2);
    expect(await paging.currentPage(), "2ページ目へ移動した").toBe("2");
  });
  await step(5, () => search.open());
  await expected(async () => {
    await expect.soft(search.field("product_name"), "商品名は空").toHaveValue("");
    await expect.soft(page, "ページ番号・表示件数の指定が無い検索入力画面").toHaveURL(adminUrl("/product"));
    // 表示件数は、件数欄に選択中の値として出る。検索入力画面に件数欄が無ければ、既定値10件は画面で確かめられない
    await expect.soft(paging.countSelect, "検索入力画面に表示件数の欄があり、既定値10件を確かめられる").toHaveCount(1);
    if (await paging.countSelect.count() === 1)
      expect.soft(await paging.selectedCountLabel(), "表示件数は既定値10件").toBe("10件");
    await search.ensureDetailVisible();
    expect.soft(await search.checkedChoices("status"), "公開状態は公開").toEqual([{ value: "1", label: "公開" }]);
    expect.soft(await search.checkedChoices("card_condition"), "状態はNM").toEqual([{ value: "1", label: "NM" }]);
    expect.soft(await search.checkedChoices("expensive"), "高額商品を除外するはチェック済み").toEqual([{ value: "2", label: "高額商品を除外する" }]);
  });
});

caseTest("IT-M03-01-038", async ({ page, browser, notes, step, expected }) => {
  const lastId = notes.get("〔商品ID-M0301-038K〕");
  // ブラウザA は caseTest のページ、ブラウザB は独立した別のコンテキスト（事前準備①）
  await loginAdmin(page, M0301_ADMIN);
  const contextB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(contextB);
    const pageB = await contextB.newPage();
    await loginAdmin(pageB, M0301_ADMIN);
    const searchA = new ProductSearchPage(page);
    const pagingA = new ProductResultPaging(page);
    const searchB = new ProductSearchPage(pageB);
    const bulkB = new ProductBulkDelete(pageB);
    await step(1, async () => {
      await openFresh(searchA);
      await searchA.field("product_name").fill("終端商品-038");
      await searchA.submitAndWaitForResult();
    });
    await step(2, async () => {
      await pagingA.chooseCount(10);
      await pagingA.goToPage(2);
      expect(await pagingA.currentPage(), "ブラウザAは2ページ目").toBe("2");
      await expect(pagingA.rows.first(), "ブラウザAの2ページ目に行がある").toBeVisible();
    });
    await step(3, async () => {
      await openFresh(searchB);
      await searchB.ensureDetailVisible();
      await searchB.field("product_id").fill(lastId);
      await searchB.submitAndWaitForResult();
      await expect(bulkB.row(lastId), "ブラウザBに終端商品-038-11の行").toBeVisible();
    });
    await step(4, async () => {
      await bulkB.select(lastId);
      const label = await bulkB.open();
      if (label !== "完全に削除") note(`正本の「完全に削除」は、画面では一括操作のボタンの「${label}」`);
      await markCurrentDocument(pageB);
      await bulkB.confirmButton.click();
      await expect.poll(async () => {
        if (await documentWasReloaded(pageB)) return "再読み込み";
        return (await bulkB.modalMessage()) === DELETE_DONE_MESSAGE ? "完了の文言" : "処理中";
      }, { message: "削除処理が完了しない", timeout: 60_000 }).not.toBe("処理中");
      const errors = await bulkB.errors();
      if (errors.length) throw new Error(`ブラウザBで削除できなかった: ${errors.join(" / ")}`);
      if (!(await documentWasReloaded(pageB)))
        note("ブラウザBの削除処理は完了したが、結果画面は自動では再読み込みされず「完了」ボタンが出た（040と同じ。正本の手順に無いので押さない）。期待結果はブラウザA側なので続ける");
    });
    await step(5, async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
    });
    await expected(async () => {
      expect.soft(await pagingA.totalCount(), "該当件数は10件").toBe(10);
      await expect.soft(pagingA.rows, "1ページ目の10件が表示される").toHaveCount(10);
      // 10件・1ページだけのときはページ送り自体が出ない（null）。出ているなら1ページ目
      expect.soft(["1", null], "ブラウザAには1つ前の1ページ目が表示される").toContain(await pagingA.currentPage());
    });
  } finally {
    await contextB.close();
  }
});

caseTest("IT-M03-01-039", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.field("product_name").fill("上限商品-039");
  });
  await step(3, () => search.submitAndWaitForResult());
  // 12000件の表示は手元で90秒前後かかる（既存の3,135件で23秒）
  await step(4, () => paging.chooseCount(12000, 600_000));
  await expected(async () => {
    expect.soft(await paging.totalCount(), "該当件数は12001件").toBe(12001);
    expect.soft(await paging.selectedCountLabel(), "表示件数は12000件").toBe("12000件");
    expect.soft(await paging.currentPage(), "1ページ目を表示している").toBe("1");
    const names = await paging.productNames();
    expect.soft(names.length, "1ページ目に12000件の商品が表示される").toBe(12000);
    expect.soft(names.filter((n) => !/^上限商品-039-\d{5}$/.test(n)), "表示された商品はすべて「上限商品-039」の商品").toEqual([]);
    expect.soft(new Set(names).size, "1ページ目の商品に重複が無い").toBe(names.length);
  });
});

caseTest("IT-M03-01-042", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const paging = new ProductResultPaging(page);
  const pageCount = new ProductPageCountPage(page);
  await step(1, () => openFresh(search));
  await step(2, async () => {
    await search.field("product_name").fill("保持商品-042");
    await search.submitAndWaitForResult();
  });
  await step(3, () => paging.chooseCount(50));
  await step(4, () => pageCount.selectInjectedCount777());
  await expected(async () => {
    expect.soft(await pageCount.selectedCountAfterInvalidSelection(), "777件は保持されず、直前の50件")
      .toEqual({ label: "50件", pageCount: "50" });
    await expect.soft(paging.rows, "50件で表示される").toHaveCount(50);
  });
});
