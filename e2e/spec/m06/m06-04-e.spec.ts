/**
 * M06-04 買取ステータス変更（追加分）。正本: cases/M06-04_test_cases.tsv（2026-11-21 に足した 025）
 *
 * シードは seeds/m06-04-e.ts。買取金額・販売金額は画面で指定できないので、実行の印つきの買取にだけ DB で足した（シードの報告に残る）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 買取の金額 } from "../../db/m06_04_e";
import { OtcStatusChangePage } from "../../pages/admin/m06_04_status";
import { M0604_IT_A } from "../../seeds/m06-04-status";
import "../../seeds/m06-04-e";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M06-04-025", async ({ page, notes, step, expected }) => {
  const 受注ID = notes.get("〔店頭買取受注ID-M0604-025〕");
  const 査定ID = notes.get("〔査定ID-M0604-025〕");
  const before = 買取の金額(受注ID);
  await loginAdmin(page, M0604_IT_A);
  const s = new OtcStatusChangePage(page);
  let after = before;
  await step(1, async () => {
    const st = await s.open(受注ID);
    expect(st, `査定ID ${査定ID} のステータス変更画面の応答`).toBeLessThan(400);
  });
  await step(2, async () => { await s.選ぶ("買取キャンセル"); });
  await step(3, async () => {
    const r = await s.保存を押す();
    note(`保存の結果: 送信 ${r.sent ? "あり" : "なし"}・応答 ${r.応答の状態 ?? "なし"}${r.止めた理由 ? `・${r.止めた理由}` : ""}`);
    expect(r.sent, "保存の送信が行われた（操作をせずに金額が変わらないだけで合格にしない）").toBe(true);
  });
  await step(4, async () => { after = 買取の金額(受注ID); });
  await expected(async () => {
    expect.soft(before.買取金額, "変更の前の買取金額（シードで入れた値）").toBe(1000);
    expect.soft(before.販売金額, "変更の前の販売金額（シードで入れた値）").toBe(1500);
    expect.soft(after.買取金額, `査定ID ${査定ID} の買取金額（変更前の 1000 円のまま）`).toBe(1000);
    expect.soft(after.販売金額, `査定ID ${査定ID} の販売金額（変更前の 1500 円のまま）`).toBe(1500);
    expect.soft(after.明細の件数, "買取明細の件数（変わらない）").toBe(before.明細の件数);
  });
  note("税額100円は、新しいアプリの店頭買取に税額を持つ項目が無いので、設定も確かめもしていない（買取金額・販売金額だけ確かめた）");
  note("買取金額は査定合計金額、販売金額は買取明細の販売金額の合計として読んだ。ステータス変更のあとにステータスが買取キャンセルになったことは、このケースの期待結果ではないので見ていない");
});
