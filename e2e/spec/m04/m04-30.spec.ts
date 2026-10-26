/**
 * M04-30 バーコード貼替リストCSV出力。正本: cases/M04-30_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる 001・002。
 * ほかの23件は、使用シード（STOCK-003 など）がスマレジの在庫数・価格変更履歴・スマレジ商品IDなどをDBへ直接設定するので実装しない
 * （記録 e2e/review/M04-30_progress_2026-10-21.md）。
 * 「実行日」は、手元の環境の日付（日本時間。アプリの設定のタイムゾーンと同じ）で数える。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BarcodeReplacementListPage } from "../../pages/admin/m04_30_barcode";
import { M0430_ADMIN } from "../../seeds/m04-30";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 日本時間の日付（YYYY-MM-DD）。days 日ずらす */
function jstDate(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

caseTest("IT-M04-30-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0430_ADMIN);
  const screen = new BarcodeReplacementListPage(page);
  let stores: { 表示: string; 値: string }[] = [];
  let from = "";
  let to = "";
  const today = jstDate(0);
  const yesterday = jstDate(-1);
  await step(1, async () => { await screen.open(); });
  await step(2, async () => {
    stores = await screen.selectedStores();
    from = await screen.価格調整発生期間From.inputValue();
    to = await screen.価格調整発生期間To.inputValue();
    note(`出力対象店舗: ${stores.map((s) => `「${s.表示}」（店舗ID ${s.値}）`).join("、") || "選択なし"}・価格調整発生期間 From「${from}」To「${to}」（実行日 ${today}）`);
  });
  await expected(async () => {
    // 実行日をまたいで流れたときは、確かめの前後で日付が変わる。そのときは落として流し直す
    expect(jstDate(0), "確かめの間に日付が変わっていない").toBe(today);
    expect.soft(stores, "出力対象店舗（ログイン者のデフォルト検索店舗「店舗A」）").toEqual([{ 表示: "店舗A", 値: notes.get("〔店舗ID-M0430-共有A〕") }]);
    expect.soft(from, "価格調整発生期間の From（実行日の前日）").toBe(yesterday);
    expect.soft(to, "価格調整発生期間の To（実行日）").toBe(today);
  });
});

caseTest("IT-M04-30-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0430_ADMIN);
  const screen = new BarcodeReplacementListPage(page);
  await step(1, async () => { await screen.open(); });
  await step(2, async () => {
    await screen.chooseStore("店舗A");
    note(`「店舗A」を選んだあとの選択: ${(await screen.selectedStores()).map((s) => s.表示).join("、") || "なし"}`);
  });
  await step(3, async () => {
    await screen.chooseStore("店舗B");
  });
  await expected(async () => {
    const multiple = await screen.出力対象店舗.evaluate((n) => (n as HTMLSelectElement).multiple);
    note(`出力対象店舗の選択欄は${multiple ? "複数選べる" : "1つだけ選べる"}作り`);
    expect.soft(await screen.selectedStores(), "出力対象店舗で選ばれているのは「店舗B」だけ").toEqual([{ 表示: "店舗B", 値: notes.get("〔店舗ID-M0430-共有B〕") }]);
  });
});
