/**
 * M07-12 買取商品履歴選択CSV出力。正本: cases/M07-12_test_cases.tsv（011・012）
 * 買取商品履歴（検索結果）で、行のチェックを付けて「CSVダウンロード」の「選択した商品履歴取得」を押す。部品は M07-10・M07-11 と同じ（pages/admin/m07_10_history.ts）。
 * 買取番号・会員ID・管理者IDは、シードが画面で振られた番号を控えたものを使う（シード表の固定の値は画面で決められない）。
 * 実装していないケース: なし（正本のケースは2件とも書いた）。
 * 商品コード・商品名・査定担当者・姓・名は実行ごとの印つきの値（lib/run_marker.ts）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { CSVの全行, CSVの内容を画面の枠に出す, CSVの枠のセル } from "../../lib/evidence_other";
import { CSVを読む } from "../../pages/admin/m07_buy";
import { HistoryPage } from "../../pages/admin/m07_10_history";
import { M0712_ADMIN, 会員の呼び名, 品コード } from "../../seeds/m07-12";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
type CSVの行 = Record<string, string>;

/** 「選択した商品履歴取得」でダウンロードして読み、読んだCSV（ファイル名・見出し・全データ行）を画面の枠に出す（選択肢は先に閉じる） */
async function 選択CSVを取る(h: HistoryPage): Promise<CSVの行[]> {
  const file = await h.CSVをダウンロードする("選択した商品履歴取得");
  const csv = await CSVを読む(file);
  await h.CSVダウンロードの選択肢を閉じる();
  await CSVの内容を画面の枠に出す(h.page, [{ 題: `ファイル名：${file.suggestedFilename()}`, 行: CSVの全行(csv) }]);
  return csv.行;
}

caseTest("IT-M07-12-011", async ({ page, notes, step, expected }) => {
  const h = new HistoryPage(page);
  const PA = 品コード("011", "PA"), PB = 品コード("011", "PB"), PC = 品コード("011", "PC");
  let csv: CSVの行[] = [];
  await step(1, async () => { await loginAdmin(page, M0712_ADMIN); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { await h.会員IDを入れる(notes.get(会員の呼び名("011"))); await h.検索する(); });
  await step(4, async () => {
    expect((await h.行()).length, "検索結果画面に3件の行が表示される").toBe(3);
    await h.対象にする(PA);
    await h.対象にする(PC);
  });
  await step(5, async () => { csv = await 選択CSVを取る(h); });
  let 行PA = -1, 行PB = -1, 行PC = -1;
  await step(6, async () => {
    行PA = csv.findIndex((r) => r["商品コード"] === PA);
    行PB = csv.findIndex((r) => r["商品コード"] === PB);
    行PC = csv.findIndex((r) => r["商品コード"] === PC);
  });
  await expected(async () => {
    expect.soft(csv.filter((r) => r["商品コード"] === PA).length, "商品コード M0712-FG011-PA の行の数").toBe(1);
    expect.soft(csv.filter((r) => r["商品コード"] === PC).length, "商品コード M0712-FG011-PC の行の数").toBe(1);
    expect.soft(行PB, "商品コード M0712-FG011-PB の行が出力されない（見つからない）").toBe(-1);
    await expect.soft(CSVの枠のセル(h.page, 0, 行PA, "商品コード"), "CSVの商品コード（PA）の行").toHaveText(PA);
    await expect.soft(CSVの枠のセル(h.page, 0, 行PC, "商品コード"), "CSVの商品コード（PC）の行").toHaveText(PC);
  });
  note("買取番号407120111〜407120113・会員IDは画面が振った番号を使った。商品コードなどは実行の印つき。同じ会員の買取履歴はこの3件だけ（会員は実行ごとに新しく作る）");
});

caseTest("IT-M07-12-012", async ({ page, notes, step, expected }) => {
  const h = new HistoryPage(page);
  const PA = 品コード("012", "PA");
  let csv: CSVの行[] = [];
  await step(1, async () => { await loginAdmin(page, M0712_ADMIN); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { await h.会員IDを入れる(notes.get(会員の呼び名("012"))); await h.検索する(); });
  await step(4, async () => {
    expect((await h.行()).length, "検索結果画面に1件の行が表示される").toBe(1);
    await h.対象にする(PA);
  });
  await step(5, async () => { csv = await 選択CSVを取る(h); });
  let 行 = -1;
  await step(6, async () => { 行 = csv.findIndex((r) => r["商品コード"] === PA); });
  await expected(async () => {
    expect.soft(行, "商品コード M0712-FG012-PA の行がある").toBeGreaterThanOrEqual(0);
    await expect.soft(CSVの枠のセル(h.page, 0, 行, "入庫数"), "入庫数（12）").toHaveText(/^12(\.0+)?$/);
  });
  note("実在庫履歴の数量12は画面で指定できないので、シードが、実行の印つきの行にDBで設定した（実在庫の数量も12）。買取番号407120121・会員IDは画面が振った番号を使った");
});
