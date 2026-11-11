/**
 * A05-01 注文印刷_印刷情報をプリンタへ送信。正本: cases/A05-01_test_cases.tsv
 * 実装したのは 007 だけ（店舗IDがない・整数でない・存在しない要求の 404）。ほかのケースは作れない（記録 review/A05-01_progress_2026-11-11_dev.md・
 * review/recheck_not_buildable_A05-01.tsv）: 本店は店舗ID 1 に決め打ちで、ほかの方の印刷対象の受注があるため「その店舗にほかの印刷対象受注なし」を作れない、
 * ケースごとに本店の店舗を登録できない、APIサーバのファイル（var/log/print_logs/）を見られない。
 * ケースの「ブラウザで開いて HTTP ステータスを記録する」は、ページで開いた応答の状態をそのまま読む（pages/api/a05_print.ts）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { 開く, 応答 } from "../../pages/api/a05_print";
import "../../seeds/a05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-A05-01-007", async ({ page, step, expected }) => {
  const r: 応答[] = [];
  const 開いて記録 = async (パス: string) => { const x = await 開く(page, パス); r.push(x); note(`「${パス}」: HTTP ステータス ${x.状態}`); };
  await step(1, async () => { await 開いて記録("/order/prints"); });
  await step(2, async () => { await 開いて記録("/order/prints/abc"); });
  await step(3, async () => { await 開いて記録("/order/prints/519999007"); });
  await expected(async () => {
    expect.soft(r[0]?.状態, "店舗IDがない要求の HTTP ステータス").toBe(404);
    expect.soft(r[1]?.状態, "整数以外の店舗IDを指定した要求の HTTP ステータス").toBe(404);
    expect.soft(r[2]?.状態, "存在しない店舗IDを指定した要求の HTTP ステータス").toBe(404);
  });
});
