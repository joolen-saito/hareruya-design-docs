/** M03-01-040・041: 商品マスター(検索結果)の「完全に削除」の完了と取消。 */
import { expect, test } from "@playwright/test";
import { 商品の件数 } from "../../db/product";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import {
  DELETE_DONE_MESSAGE, ProductBulkDelete, documentWasReloaded, markCurrentDocument,
} from "../../pages/admin/product_bulk_delete";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-040-041";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 正本は画面の削除操作を「完全に削除」と呼ぶ。画面の文言が違えば、操作は同じボタンで行い注記する */
function noteLabel(where: string, label: string): void {
  if (label !== "完全に削除") note(`正本の「完全に削除」は、画面では${where}の「${label}」`);
}

async function searchById(search: ProductSearchPage, id: string): Promise<void> {
  await search.ensureDetailVisible();
  await search.field("product_id").fill(id);
  await search.form.locator(".admin-product-search-submit").click();
  await expect(search.page.locator(`#ex-product-${id}`), `商品ID ${id} の結果行`).toBeVisible();
}

caseTest("IT-M03-01-040", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const bulk = new ProductBulkDelete(page);
  const id = notes.get("〔商品ID-M0301-040〕");
  let resultUrl = "";
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await searchById(search, id);
  });
  await step(3, async () => {
    await bulk.select(id);
    noteLabel("一括操作のボタン", await bulk.open());
  });
  await step(4, async () => {
    resultUrl = page.url();
    noteLabel("確認モーダルのボタン", (await bulk.confirmButton.innerText()).trim());
    await markCurrentDocument(page);
    await bulk.confirmButton.click();
    // 削除処理の完了を待つ。設計どおりなら画面が読み込み直され、そうでなければモーダルに完了の文言（M03-01-MSG-004）が出る
    await expect.poll(async () => {
      if (await documentWasReloaded(page)) return "再読み込み";
      return (await bulk.modalMessage()) === DELETE_DONE_MESSAGE ? "完了の文言" : "処理中";
    }, { message: "削除処理が完了しない", timeout: 60_000 }).not.toBe("処理中");
    if (!(await documentWasReloaded(page))) {
      const errors = await bulk.errors();
      if (errors.length) note(`削除の確認モーダルにエラーが出た: ${errors.join(" / ")}`);
      if (await bulk.doneButton.isVisible())
        note(`削除処理の完了後、モーダルは開いたままで「${(await bulk.doneButton.innerText()).trim()}」ボタンが出た（正本の手順に無いので押さない）`);
    }
  });
  await expected(async () => {
    await expect.soft(bulk.modal, "削除の確認モーダルが閉じる").toBeHidden();
    expect.soft(await documentWasReloaded(page), "商品マスター(検索結果)画面が再読み込みされる").toBe(true);
    expect.soft(page.url(), "再読み込み後も商品マスター(検索結果)画面").toBe(resultUrl);
  });
});

caseTest("IT-M03-01-041", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const bulk = new ProductBulkDelete(page);
  const id = notes.get("〔商品ID-M0301-041〕");
  let remaining = -1;
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await searchById(search, id);
  });
  await step(3, async () => {
    await bulk.select(id);
    noteLabel("一括操作のボタン", await bulk.open());
  });
  await step(4, async () => {
    await expect(bulk.cancelButton, "確認モーダルのキャンセル").toHaveText("キャンセル");
    await bulk.cancelButton.click();
    await expect(bulk.modal, "キャンセルでモーダルが閉じる").toBeHidden();
  });
  await step(5, async () => {
    remaining = 商品の件数(id);
  });
  await expected(async () => {
    expect(remaining, `商品ID ${id} の商品は削除されず1件残る`).toBe(1);
  });
});
