/**
 * M05-14 対応状況設定の連携ケース（IT-M05-14-001）。正本: cases/M05-14_test_cases.tsv
 * 実装したケースと解釈は記録 review/M05-14_progress_2026-11-21_dev.md。
 *
 * 正本の外の補い:
 * - 店舗Aは本店（店舗ID 1）、受注ステータスの「新規受付」は「注文受領」（seeds/m05-14.ts）。
 * - 手順1の操作日は、日本時間の今日の日付（年/月/日）。入金日の表示と、日付の部分で比べる（時刻は操作の時刻なので比べない）。
 * - 手順6の一覧の注文番号のリンクは新しいタブで開くので、手順7はそのタブで入金日を読む。
 * - 手順2は、受注番号の検索を経ずに、シードが控えた受注IDの受注情報編集画面を開く（ログインはケースの前提。この手順の前に行う）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin, adminUrl } from "../../lib/session";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import { 一覧から受注情報編集を開く, 入金日を読む, 店舗と注文番号で検索する } from "../../pages/admin/m05_14_order_status";
import { M0514_ACCOUNT } from "../../seeds/m05-14";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** 日本時間の今日の日付（yyyy/mm/dd） */
function 今日の日付(): string {
  const p = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}/${g("month")}/${g("day")}`;
}
/** 画面の日時の表示から日付の部分（yyyy/mm/dd）を取り出す */
const 日付の部分 = (s: string): string => {
  const m = /(\d{4})\D(\d{1,2})\D(\d{1,2})/.exec(s);
  return m ? `${m[1]}/${m[2].padStart(2, "0")}/${m[3].padStart(2, "0")}` : "";
};

caseTest("IT-M05-14-001", async ({ page, notes, step, expected }) => {
  const 受注番号 = notes.get("〔受注番号-M0514-001〕");
  const 受注ID = notes.get("〔受注ID-M0514-001〕");
  let 操作日 = ""; let 入金日 = "";
  let 編集画面 = page; // 手順6で開く受注情報編集画面（一覧のリンクは新しいタブで開く）
  await loginAdmin(page, M0514_ACCOUNT); // ケースの前提（管理画面にログイン済み）
  await step(1, async () => { 操作日 = 今日の日付(); note(`操作日（日本時間）: ${操作日}`); });
  await step(2, async () => {
    supplement("受注番号の検索を経ずに、シードが控えた受注IDの受注情報編集画面を開いた");
    await page.goto(adminUrl(`/order/${受注ID}/edit`));
    await page.waitForLoadState("load");
    await expect(page.locator("a.order-history-order-no-link").first(), "受注情報編集画面の注文番号").toHaveText(受注番号);
  });
  const edit = new OrderEditPage(page);
  await step(3, async () => { await edit.ステータスを選ぶ("入金済み"); });
  await step(4, async () => { await edit.ステータスを変更する((m) => note(`ステータス変更時の表示: ${m}`)); });
  await step(5, async () => {
    const n = await 店舗と注文番号で検索する(page, "1", 受注番号);
    note(`検索結果の注文番号の一致: ${n} 件`);
  });
  await step(6, async () => { 編集画面 = await 一覧から受注情報編集を開く(page, 受注番号); });
  await step(7, async () => { 入金日 = await 入金日を読む(編集画面); note(`入金日の表示: ${入金日}`); });
  await expected(async () => {
    expect.soft(日付の部分(入金日), `入金日に手順1で控えた操作日（${操作日}）が表示される（入金日の表示「${入金日}」）`).toBe(操作日);
  });
});
