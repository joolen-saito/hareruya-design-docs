/**
 * M04-21 在庫変更CSV登録。正本: cases/M04-21_test_cases.tsv
 *
 * 画面だけで準備できるケース 044（雛形のダウンロード）・057（在庫変更CSV登録の廃棄が在庫履歴検索一覧に出る）・
 * 058（在庫変更CSV登録の入庫の承認が商品規格一覧の在庫数に出る）を実装した（記録 review/M04-21_progress_2026-10-21.md）。
 * - 005〜043・047・048・053〜056・059〜063 は、使用シード S-M04-21-MASTER（店舗・所属関係・在庫区分・在庫変動区分を
 *   「DBへ直接設定する」）などを使うので実装しない。
 * - 051・052 は、公開側のブラウザ環境 S-M04-21-QE-ENV（ユニサーチ試験環境へ接続できること）が要るので実装しない（M04-02 と同じ扱い）。
 *
 * 「本店」は手元の環境の店舗ID 1（親店舗）。店名は環境で違う（手元は「Hareruya」）ので、在庫検索一覧の検索欄「店舗」の選択肢から読む。
 * 「承認者で管理画面にログインし直す」は、管理画面のログアウトを開いてから承認者でログインする。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page, test } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl, loginAdmin } from "../../lib/session";
import { HistoryRow, numberOf, StockHistoryPage } from "../../pages/admin/m04_17_stock_history";
import {
  checkAndOpenBulkApprove, chooseHistoryShopAndZone, classStock, confirmBulkApprove, openClassListByName, searchApprovals,
} from "../../pages/admin/m04_02_rc_stock";
import {
  chooseFileAndRegister, downloadStockChangeTemplate, fillStockChangeCsvForm, openStockChangeCsv,
} from "../../pages/admin/m04_21_stock_change_csv";
import { StockListPage } from "../../pages/admin/stock_edit";
import { caseCsvPath, M0421_ADMIN, RC057, RC057_BRANCH, RC058, templateDownloadDir } from "../../seeds/m04-21";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 管理画面からログアウトし、別の管理者でログインし直す */
async function relogin(page: Page, account: { loginId: string; password: string }): Promise<void> {
  await page.goto(adminUrl("/logout"));
  await loginAdmin(page, account);
}

// ---- 044: 雛形のダウンロード ----

caseTest("IT-M04-21-044", async ({ page, step, expected }) => {
  const dir = templateDownloadDir();
  await loginAdmin(page, M0421_ADMIN);
  await step(1, () => openStockChangeCsv(page));
  await step(2, async () => {
    const download = await downloadStockChangeTemplate(page);
    // ブラウザのダウンロード保存先（フォルダ M0421-044-DL）へ、ブラウザが付けた名前で保存する
    await download.saveAs(path.join(dir, download.suggestedFilename()));
    note(`ダウンロードしたファイル名: ${download.suggestedFilename()}`);
  });
  let files: string[] = [];
  let header: string[] = [];
  let rows: string[][] = [];
  await step(3, async () => {
    files = fs.readdirSync(dir);
    expect(files, "フォルダ M0421-044-DL にファイルがある").not.toHaveLength(0);
    rows = parseCsv(decodeCsvBytes(fs.readFileSync(path.join(dir, files[0]))));
    header = rows[0] ?? [];
    note(`フォルダの中身: ${files.join("、")}／CSVの行: ${JSON.stringify(rows)}`);
  });
  await expected(async () => {
    expect.soft(files.length, "フォルダ M0421-044-DL にダウンロードされたファイルは1件").toBe(1);
    expect.soft(files.filter((f) => /\.csv$/i.test(f)), "ダウンロードされたファイルはCSV").toHaveLength(1);
    expect.soft(header, "カラムは商品コード、在庫増減数、仕入単価の3つだけでこの順").toEqual(["商品コード", "在庫増減数", "仕入単価"]);
  });
});

// ---- 057: 在庫変更CSV登録の廃棄（承認待ち）が在庫履歴検索一覧に出る ----

const CODE057 = "RC0421001CODE";
const BRANCH057 = RC057_BRANCH.店名;

/** 在庫履歴検索一覧で、検索条件をクリアしてから、キーワード（商品名・カード名・商品コード）・店舗・在庫区分で検索した一覧の行 */
async function searchHistory057(page: Page): Promise<HistoryRow[]> {
  const h = new StockHistoryPage(page);
  await h.open();
  await h.clearConditions();
  await h.fillKeyword(CODE057);
  await chooseHistoryShopAndZone(page, { 店舗: BRANCH057, 在庫区分: "EC-CUBE" });
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

caseTest("IT-M04-21-057", async ({ page, step, expected }) => {
  let before: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  await step(1, () => loginAdmin(page, RC057.申請者.account));
  await step(2, async () => {
    before = await searchHistory057(page);
    note("期待結果の「在庫増減数」は一覧の見出し「在庫変動数」、「在庫区分」は見出し「在庫場所」の列で見た");
    expect.soft(before.filter((r) => numberOf(r["在庫変動数"] ?? "") === -3), "手順2: 在庫増減数が-3の行が無い").toEqual([]);
  });
  await step(3, async () => {
    await openStockChangeCsv(page);
    const storeId = await page.locator(`#admin_stock_change_csv_list_change_base_info option`).filter({ hasText: new RegExp(`^\\s*${BRANCH057}\\s*$`) })
      .getAttribute("value");
    if (!storeId) throw new Error(`在庫変更CSV登録画面の店舗の選択肢に「${BRANCH057}」が無い`);
    await fillStockChangeCsvForm(page, {
      店舗ID: storeId, 店名: BRANCH057, 在庫区分: "EC-CUBE", 在庫変動区分: "廃棄/廃棄(破損)", 在庫変動理由: "RC0421-001-廃棄",
      所属: RC057.所属, 承認者: RC057.承認者.名前,
    });
  });
  await step(4, async () => {
    const r = await chooseFileAndRegister(page, caseCsvPath("rc0421-001.csv"));
    note(`「一括登録を実行」の結果: ${JSON.stringify(r)}`);
    if (r.結果 !== "送信") throw new Error(`在庫変更CSV登録が送信されなかった: ${JSON.stringify(r)}`);
  });
  await step(5, async () => { after = await searchHistory057(page); });
  await expected(async () => {
    const minus3 = (rows: HistoryRow[]) => rows.filter((r) => numberOf(r["在庫変動数"] ?? "") === -3);
    expect.soft(minus3(before), "手順2では在庫増減数-3の行が表示されない").toEqual([]);
    const rows = minus3(after).filter((r) => r["商品コード"] === CODE057);
    expect(rows, "手順5では商品コード RC0421001CODE の在庫増減数-3の行が1件表示される").toHaveLength(1);
    const r = rows[0];
    expect.soft(r["店舗"], "店舗").toBe(BRANCH057);
    expect.soft(r["在庫場所"], "在庫区分").toBe("EC-CUBE");
    expect.soft(r["登録元"], "登録元").toBe("在庫変更CSV登録");
    expect.soft(r["在庫変動理由"], "在庫変動理由").toBe("RC0421-001-廃棄");
    expect.soft(r["登録者"], "登録者").toBe(RC057.申請者.名前);
    expect.soft(r["承認日"], "承認日").toBe("-");
    expect.soft(r["承認者"], "承認者").toBe("承認待ち");
  });
});

// ---- 058: 在庫変更CSV登録の入庫の承認が商品規格一覧の在庫数に出る ----

const CODE058 = "RC0421002CODE";
const NAME058 = "RC0421-002-NAME";

caseTest("IT-M04-21-058", async ({ page, step, expected }) => {
  let before = NaN;
  let after = NaN;
  let main = "";
  await step(1, async () => {
    await loginAdmin(page, RC058.申請者.account);
    main = await new StockListPage(page).shopNameById("1");
    note(`本店（店舗ID 1）の店名は「${main}」`);
  });
  await step(2, async () => {
    await openClassListByName(page, NAME058);
    before = await classStock(page, CODE058);
    note(`登録・承認の前の商品規格一覧の ${CODE058} の在庫数: ${before}`);
  });
  await step(3, async () => {
    await openStockChangeCsv(page);
    await fillStockChangeCsvForm(page, {
      店舗ID: "1", 店名: main, 在庫区分: "EC-CUBE", 在庫変動区分: "入庫/問屋仕入", 在庫変動理由: "RC0421-002-入庫",
      所属: RC058.所属, 承認者: RC058.承認者.名前,
    });
  });
  await step(4, async () => {
    const r = await chooseFileAndRegister(page, caseCsvPath("rc0421-002.csv"));
    note(`「一括登録を実行」の結果: ${JSON.stringify(r)}`);
    if (r.結果 !== "送信") throw new Error(`在庫変更CSV登録が送信されなかった: ${JSON.stringify(r)}`);
  });
  await step(5, () => relogin(page, RC058.承認者.account));
  await step(6, () => searchApprovals(page, { 店舗: main, 登録者: RC058.申請者.名前 }));
  await step(7, async () => {
    const row = await checkAndOpenBulkApprove(page, "在庫変更CSV登録", "在庫変更CSV登録の承認");
    note(`承認した行: ${JSON.stringify(row)}`);
  });
  await step(8, async () => {
    const text = await confirmBulkApprove(page, "在庫変更CSV登録の一括承認", (m) => note(`画面の警告: ${m}`));
    note(`確認の文: 「${text}」`);
  });
  await step(9, async () => {
    await openClassListByName(page, NAME058);
    after = await classStock(page, CODE058);
    note(`承認のあとの商品規格一覧の ${CODE058} の在庫数: ${after}`);
  });
  await expected(async () => {
    expect.soft(before, "手順2（登録・承認前）の在庫数は10").toBe(10);
    expect.soft(after, "手順9（承認後）の在庫数は13").toBe(13);
  });
});
