/**
 * A06-10 買取用カード一覧取得（商品IDリストが空）。正本: cases/A06-10_test_cases.tsv
 * 実装の解釈は記録 review/A06-10_progress_2026-11-17_dev.md。要求の送り方は pages/admin/a06_mtgbuyer_api.ts（A06-01 と同じ）。
 * 事前準備の「ブラウザでログイン済みで API 認証が成立する」は、手順1の前に管理者のログイン API で認証トークンを受け取り、要求に付ける形にした。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { トークンを受け取る, 商品IDで買取カードを取る, 応答に商品がある, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0610_ADM } from "../../seeds/a06-10";
import "../../seeds/a06-10";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-A06-10-001", async ({ page, notes, step, expected }) => {
  supplement("管理者は決まった印（-E2E）を付けた値。API 認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付けた（値は記録しない）");
  const token = await トークンを受け取る(page, A0610_ADM.loginId, A0610_ADM.password);
  let r!: 応答;
  await step(1, async () => { r = await 商品IDで買取カードを取る(page, "買取用カード一覧取得（商品IDリストが空）", "", "クエリ", token); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 200) || "（空）"}`); });
  await expected(async () => {
    const id = notes.get("〔商品ID-A0610-001〕");
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(Array.isArray(r.json) && (r.json as unknown[]).length === 0, `応答の JSON が空配列（実際: ${r.本文.slice(0, 100)}）`).toBe(true);
    expect.soft(応答に商品がある(r, id), `登録済みの商品ID ${id} が応答に含まれる`).toBe(false);
  });
});
