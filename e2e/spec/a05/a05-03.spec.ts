/**
 * A05-03 店頭注文番号取得。正本: cases/A05-03_test_cases.tsv
 * 実装したのは 003・005・009。ほかのケースは作れない（記録 review/A05-03_progress_2026-11-11_dev.md・review/recheck_not_buildable_A05-03.tsv）:
 * 店舗ID（503002 など）を指定して店舗を作れない、ケースごとの店舗・本店の店舗を作れない、画面表示最大件数（全員が使うアプリの設定）。
 * 手順のパス「/waiting_api/get_waiting/…」は正本のまま開く（新アプリの経路は /waiting_api/get_waiting_number/{店舗ID}）。
 * 試験店舗は決まった名前で1度だけ登録して使い回す（seeds/a05.ts）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { WaitingTagPage } from "../../pages/admin/a05_03_waiting_tag";
import { JSONの配列, 開く, 応答 } from "../../pages/api/a05_print";
import { A0503_ADMIN, 連鎖試験店 } from "../../seeds/a05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、開いたページの応答（状態・本文）をそのまま読む";
const 見る = (r: 応答) => note(`応答: 状態 ${r.状態}・本文 ${r.本文.length > 300 ? `${r.本文.slice(0, 300)}…（${r.本文.length}文字）` : `「${r.本文}」`}`);

// ---- 003: 店頭注文番号札管理で登録した番号札が返る ----
caseTest("IT-A05-03-003", async ({ page, notes, step, expected }) => {
  const 店舗ID = notes.get("〔店舗ID-A0503-003〕");
  const w = new WaitingTagPage(page);
  let r!: 応答;
  await step(1, async () => { await loginAdmin(page, A0503_ADMIN); await w.開く(); });
  await step(2, async () => { await w.店舗を選ぶ(連鎖試験店.店名); });
  await step(3, async () => { await w.番号札を登録する("CHAINA"); note(`登録のあとの一覧: ${(await w.一覧の番号札()).join("・") || "なし"}`); });
  await step(4, async () => { r = await 開く(page, `/waiting_api/get_waiting/${店舗ID}`); });
  await step(5, async () => { 見る(r); });
  await expected(async () => { expect.soft(JSONの配列(r), "応答の JSON 配列").toEqual(["CHAINA"]); });
});

// ---- 005: 受注・番号札が0件の店舗は空の配列 ----
caseTest("IT-A05-03-005", async ({ page, notes, step, expected }) => {
  const 店舗ID = notes.get("〔店舗ID-A0503-005〕");
  let r!: 応答;
  await step(1, async () => { r = await 開く(page, `/waiting_api/get_waiting/${店舗ID}`); });
  await step(2, async () => { note(NETWORK); 見る(r); });
  await expected(async () => {
    expect.soft(r.状態, "HTTP ステータス").toBe(200);
    expect.soft(JSONの配列(r), "応答の JSON 配列（空）").toEqual([]);
  });
});

// ---- 009: 店舗IDなしの要求に注文番号の配列が無い ----
caseTest("IT-A05-03-009", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 開く(page, "/waiting_api/get_waiting/"); });
  await step(2, async () => { note(NETWORK); 見る(r); });
  await expected(async () => { expect.soft(JSONの配列(r), "応答本文の注文番号の配列（無い）").toBeNull(); });
});
