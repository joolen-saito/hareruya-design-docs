/**
 * M04-03 在庫一括編集。正本: cases/M04-03_test_cases.tsv
 *
 * 画面だけで準備できるケースのうち、在庫一括編集の入庫の承認が商品規格一覧の在庫数へ届くことを見る 063 を実装した
 * （記録 review/M04-03_progress_2026-10-21.md）。
 * - 001〜056・061・062 は、使用シード（S-M04-03-MASTER・S-M04-03-CASE-003 など）が「DBへ直接設定する／DBで…削除する」を含むので実装しない。
 * - 058〜060 は、公開側のブラウザの環境 S-M04-03-QE-ENV（ユニサーチ試験環境へ接続できること）が要るので実装しない（外部サービス）。
 *
 * 「本店」は手元の環境の店舗ID 1（親店舗）。店名は環境で違う（手元は「Hareruya」）ので、在庫検索一覧の検索欄「店舗」の選択肢から読む。
 * 「承認者で管理画面にログインし直す」は、管理画面のログアウトを開いてから承認者でログインする。
 */
import { expect, test } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import {
  checkAndOpenBulkApprove, classStock, confirmBulkApprove, fillBulkEdit, openBulkEdit, openClassListByName,
  searchApprovals, searchStockByCode, submitBulkEdit,
} from "../../pages/admin/m04_02_rc_stock";
import { mainShopName } from "../../seeds/m04-02";
import { RC063 } from "../../seeds/m04-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const issue = (m: string) => note(`画面の警告: ${m}`);

const CODE = "RC0403001CODE";
const NAME = "RC0403-001-NAME";

caseTest("IT-M04-03-063", async ({ page, step, expected }) => {
  let before = NaN;
  let after = NaN;
  let main = "";
  await step(1, async () => {
    await loginAdmin(page, RC063.申請者.account);
    main = await mainShopName(page);
    note(`本店（店舗ID 1）の店名は「${main}」`);
  });
  await step(2, async () => {
    await openClassListByName(page, NAME);
    before = await classStock(page, CODE);
    note(`登録・承認の前の商品規格一覧の ${CODE} の在庫数: ${before}`);
  });
  let list: Awaited<ReturnType<typeof searchStockByCode>>;
  await step(3, async () => { list = await searchStockByCode(page, { 商品コード: CODE, 店舗: main, 在庫区分: "EC-CUBE" }); });
  await step(4, () => openBulkEdit(page, list.row(CODE, main, "EC-CUBE")));
  await step(5, () => fillBulkEdit(page, {
    在庫変動区分: "入庫/問屋仕入", 承認通知先: RC063.承認者.名前, 行の商品コード: CODE, 在庫変動理由: "RC0403-001-入庫", 在庫増減数: "3", 仕入単価: "300",
  }));
  await step(6, () => submitBulkEdit(page, "在庫一括編集（入庫 3）の登録", issue));
  await step(7, async () => {
    await page.goto(adminUrl("/logout"));
    await loginAdmin(page, RC063.承認者.account);
  });
  await step(8, () => searchApprovals(page, { 店舗: main, 登録者: RC063.申請者.名前 }));
  await step(9, async () => {
    const row = await checkAndOpenBulkApprove(page, "在庫編集", "在庫一括編集の承認");
    note(`承認した行: ${JSON.stringify(row)}`);
  });
  await step(10, async () => {
    const text = await confirmBulkApprove(page, "在庫一括編集の一括承認", issue);
    note(`確認の文: 「${text}」`);
  });
  await step(11, async () => {
    await openClassListByName(page, NAME);
    after = await classStock(page, CODE);
    note(`承認のあとの商品規格一覧の ${CODE} の在庫数: ${after}`);
  });
  await expected(async () => {
    expect.soft(before, "手順2（登録・承認前）の在庫数は10").toBe(10);
    expect.soft(after, "手順11（承認後）の在庫数は13").toBe(13);
  });
});
