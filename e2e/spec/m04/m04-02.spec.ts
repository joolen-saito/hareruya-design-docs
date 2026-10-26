/**
 * M04-02 在庫編集。正本: cases/M04-02_test_cases.tsv
 *
 * 画面だけで準備できるケースのうち、在庫編集の結果がほかの画面へ届くことを見る 073（在庫履歴検索一覧）・074（商品規格一覧）を実装した
 * （記録 review/M04-02_progress_2026-10-21.md）。
 * - 001〜061・069〜072・075 は、使用シード（S-M04-02-MASTER など）が「DBへ直接設定する／DBで直接削除する」を含むので実装しない。
 * - 062〜068 は、公開側のブラウザの環境 S-M04-02-QE-ENV（ユニサーチ試験環境へ接続できること）が要るので実装しない（外部サービス）。
 *
 * 「本店」は手元の環境の店舗ID 1（親店舗）。店名は環境で違う（手元は「Hareruya」）ので、在庫検索一覧の検索欄「店舗」の選択肢から読む。
 * 「承認者で管理画面にログインし直す」は、管理画面のログアウトを開いてから承認者でログインする。
 */
import { expect, Page, test } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { HistoryRow, numberOf, StockHistoryPage } from "../../pages/admin/m04_17_stock_history";
import {
  checkAndOpenBulkApprove, chooseHistoryShopAndZone, classStock, confirmBulkApprove, fillStockEdit, openClassListByName,
  searchApprovals, searchStockByCode, submitStockEdit,
} from "../../pages/admin/m04_02_rc_stock";
import { mainShopName, RC073, RC073_BRANCH_NAME, RC074 } from "../../seeds/m04-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const issue = (m: string) => note(`画面の警告: ${m}`);

/** 管理画面からログアウトし、別の管理者でログインし直す */
async function relogin(page: Page, account: { loginId: string; password: string }): Promise<void> {
  await page.goto(adminUrl("/logout"));
  await loginAdmin(page, account);
}

// ---- 073: 在庫編集の廃棄（承認待ち）が在庫履歴検索一覧に出る ----

const CODE073 = "RC0402001CODE";
const BRANCH073 = RC073_BRANCH_NAME;

/** 在庫履歴検索一覧で、検索条件をクリアしてから、キーワード（商品名・カード名・商品コード）・店舗・在庫区分で検索した一覧の行 */
async function searchHistory(page: Page): Promise<HistoryRow[]> {
  const h = new StockHistoryPage(page);
  await h.open();
  await h.clearConditions();
  await h.fillKeyword(CODE073);
  await chooseHistoryShopAndZone(page, { 店舗: BRANCH073, 在庫区分: "EC-CUBE" });
  expect(await h.submit(), "在庫履歴検索一覧の検索の応答").toBe(200);
  const count = await h.resultCount();
  expect(count, "検索が実行された（検索結果の件数の表示が出ている）").not.toBeNull();
  const rows = await h.rows();
  note(`在庫履歴検索一覧: 件数の表示 ${count}・行 ${JSON.stringify(rows.map((r) => ({
    商品コード: r["商品コード"], 店舗: r["店舗"], 在庫場所: r["在庫場所"], 登録元: r["登録元"], 在庫変動数: r["在庫変動数"],
    在庫変動理由: r["在庫変動理由"], 登録者: r["登録者"], 承認日: r["承認日"], 承認者: r["承認者"],
  })))}`);
  return rows;
}

caseTest("IT-M04-02-073", async ({ page, step, expected }) => {
  let before: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  await step(1, () => loginAdmin(page, RC073.申請者.account));
  await step(2, async () => {
    before = await searchHistory(page);
    // 在庫増減数は、一覧の見出しでは「在庫変動数」、在庫区分は「在庫場所」
    note("期待結果の「在庫増減数」は一覧の見出し「在庫変動数」、「在庫区分」は見出し「在庫場所」の列で見た");
  });
  let list: Awaited<ReturnType<typeof searchStockByCode>>;
  await step(3, async () => { list = await searchStockByCode(page, { 商品コード: CODE073, 店舗: BRANCH073, 在庫区分: "EC-CUBE" }); });
  await step(4, () => list.openEdit(list.row(CODE073, BRANCH073, "EC-CUBE")));
  await step(5, async () => {
    // 正本は仕入単価を書かない（廃棄）ので、仕入単価の欄には触れない
    await fillStockEdit(page, { 在庫変動区分: "廃棄/廃棄(破損)", 在庫変動理由: "RC0402-001-廃棄", 在庫増減数: "-3", 承認通知先: RC073.承認者.名前 });
    await submitStockEdit(page, "在庫編集（廃棄 -3）の登録", issue);
  });
  await step(6, async () => { after = await searchHistory(page); });
  await expected(async () => {
    const minus3 = (rows: HistoryRow[]) => rows.filter((r) => numberOf(r["在庫変動数"] ?? "") === -3);
    expect.soft(minus3(before), "手順2では在庫増減数-3の行が表示されない").toEqual([]);
    const rows = minus3(after).filter((r) => r["商品コード"] === CODE073);
    expect(rows, "手順6では商品コード RC0402001CODE の在庫増減数-3の行が1件表示される").toHaveLength(1);
    const r = rows[0];
    expect.soft(r["店舗"], "店舗").toBe(BRANCH073);
    expect.soft(r["在庫場所"], "在庫区分").toBe("EC-CUBE");
    expect.soft(r["登録元"], "登録元").toBe("在庫編集");
    expect.soft(r["在庫変動理由"], "在庫変動理由").toBe("RC0402-001-廃棄");
    expect.soft(r["登録者"], "登録者").toBe(RC073.申請者.名前);
    expect.soft(r["承認日"], "承認日").toBe("-");
    expect.soft(r["承認者"], "承認者").toBe("承認待ち");
  });
});

// ---- 074: 在庫編集の入庫の承認が商品規格一覧の在庫数に出る ----

const CODE074 = "RC0402002CODE";
const NAME074 = "RC0402-002-NAME";

caseTest("IT-M04-02-074", async ({ page, step, expected }) => {
  let before = NaN;
  let after = NaN;
  let main = "";
  await step(1, async () => {
    await loginAdmin(page, RC074.申請者.account);
    main = await mainShopName(page);
    note(`本店（店舗ID 1）の店名は「${main}」`);
  });
  await step(2, async () => {
    await openClassListByName(page, NAME074);
    before = await classStock(page, CODE074);
    note(`登録・承認の前の商品規格一覧の ${CODE074} の在庫数: ${before}`);
  });
  let list: Awaited<ReturnType<typeof searchStockByCode>>;
  await step(3, async () => { list = await searchStockByCode(page, { 商品コード: CODE074, 店舗: main, 在庫区分: "EC-CUBE" }); });
  await step(4, () => list.openEdit(list.row(CODE074, main, "EC-CUBE")));
  await step(5, async () => {
    await fillStockEdit(page, { 在庫変動区分: "入庫/問屋仕入", 在庫変動理由: "RC0402-002-入庫", 在庫増減数: "3", 仕入単価: "300", 承認通知先: RC074.承認者.名前 });
    await submitStockEdit(page, "在庫編集（入庫 3）の登録", issue);
  });
  await step(6, () => relogin(page, RC074.承認者.account));
  await step(7, () => searchApprovals(page, { 店舗: main, 登録者: RC074.申請者.名前 }));
  await step(8, async () => {
    const row = await checkAndOpenBulkApprove(page, "在庫編集", "在庫編集の承認");
    note(`承認した行: ${JSON.stringify(row)}`);
  });
  await step(9, async () => {
    const text = await confirmBulkApprove(page, "在庫編集の一括承認", issue);
    note(`確認の文: 「${text}」`);
  });
  await step(10, async () => {
    await openClassListByName(page, NAME074);
    after = await classStock(page, CODE074);
    note(`承認のあとの商品規格一覧の ${CODE074} の在庫数: ${after}`);
  });
  await expected(async () => {
    expect.soft(before, "手順2（登録・承認前）の在庫数は10").toBe(10);
    expect.soft(after, "手順10（承認後）の在庫数は13").toBe(13);
  });
});
