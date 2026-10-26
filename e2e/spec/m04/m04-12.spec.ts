/**
 * M04-12 在庫分割結合検索/一覧。正本: cases/M04-12_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる 001・002・003。
 * ほかの25件は、使用シード（BASE・STATUS・PAGING・JOINCHK-041・SPLITDST-042・MIXED-043）が登録日・承認日・在庫数をDBへ直接設定し、
 * ほかの在庫分割結合データをDBで退避するので実装しない（記録 e2e/review/M04-12_progress_2026-10-21.md）。
 */
import { expect, test } from "@playwright/test";
import { CaseCtx, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { SplitJoinListPage } from "../../pages/admin/m04_13_split_join";
import { CsvKind, SplitJoinCsvButtons } from "../../pages/admin/m04_12_split_join_list";
import { M0412_ADMIN } from "../../seeds/m04-12";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M04-12-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0412_ADMIN);
  const list = new SplitJoinListPage(page);
  let checked: string[] = [];
  await step(1, async () => { await list.open(); });
  await step(2, async () => {
    checked = await list.checkedTargets();
    note(`商品名・商品コード検索対象でチェックが入っている選択肢: ${checked.join("、") || "なし"}`);
  });
  await expected(async () => {
    expect(checked, "商品名・商品コード検索対象の初期値").toEqual(["分割元・結合先"]);
  });
});

/** 一覧画面を開き、CSV登録のボタンを押して、そのモーダルが開くこと */
function opensCsvModal(kind: CsvKind) {
  return async ({ page, step, expected }: CaseCtx) => {
    await loginAdmin(page, M0412_ADMIN);
    const list = new SplitJoinListPage(page);
    const csv = new SplitJoinCsvButtons(page);
    await step(1, async () => { await list.open(); });
    await step(2, async () => {
      await expect(csv.modal(kind), `${kind}のモーダルは、押す前は閉じている`).toBeHidden();
      await csv.press(kind);
    });
    await expected(async () => {
      await expect(csv.modal(kind), `${kind}のモーダル`).toBeVisible();
      await expect.soft(csv.modalTitle(kind), "モーダルの見出し").toHaveText(new RegExp(`^\\s*${kind}\\s*$`));
      await expect.soft(csv.modalUploadForm(kind), `モーダルの中の${kind}の登録欄（在庫分割結合CSV登録 M04-23 の部品）`).toBeVisible();
    });
  };
}

caseTest("IT-M04-12-002", opensCsvModal("在庫分割CSV登録"));
caseTest("IT-M04-12-003", opensCsvModal("在庫結合CSV登録"));
