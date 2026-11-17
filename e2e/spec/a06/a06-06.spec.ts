/**
 * A06-06 買取用カード一覧取得（カード詳細ID指定。GET …/buying/{カード詳細ID}.json）。正本: cases/A06-06_test_cases.tsv
 * 実装の解釈は記録 review/A06-06_progress_2026-11-17_dev.md。要求の送り方は pages/admin/a06_mtgbuyer_api.ts（A06-01 と同じ）。
 * 管理者の認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付ける形にした。書いたのは 001・008・011。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { カード詳細IDで買取カードを取る, トークンを受け取る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0606_ADM_A } from "../../seeds/a06-06";
import "../../seeds/a06-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 送る(ctx: CaseCtx, カード詳細ID: string, 何: string): Promise<応答> {
  supplement("管理者は決まった印（-E2E）を付けた値。認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付けた（値は記録しない）。店舗A は本店に読み替えた");
  const token = await トークンを受け取る(ctx.page, A0606_ADM_A.loginId, A0606_ADM_A.password);
  let r!: 応答;
  await ctx.step(1, async () => { r = await カード詳細IDで買取カードを取る(ctx.page, 何, カード詳細ID, token); });
  await ctx.step(2, async () => { note(`要求の方式 GET・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 300) || "（空）"}`); });
  return r;
}

caseTest("IT-A06-06-001", async (ctx) => {
  const r = await 送る(ctx, ctx.notes.get("〔カード詳細ID-A0606-001〕"), "買取用カード一覧取得");
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "GET 要求の HTTP ステータス").toBe(200);
    expect.soft(r.json !== null && typeof r.json === "object", "応答が JSON 形式").toBe(true);
  });
});

caseTest("IT-A06-06-008", async (ctx) => {
  const r = await 送る(ctx, ctx.notes.get("〔カード詳細ID-A0606-008〕"), "買取用カード一覧取得（販売価格3456・基準価格2345）");
  await ctx.expected(async () => {
    const 規格ID = ctx.notes.get("〔商品規格ID-A0606-008〕");
    let 価格: string | null = null;
    const 探す = (v: unknown): void => {
      if (価格 !== null || !v || typeof v !== "object") return;
      const o = v as Record<string, unknown>;
      if (String(o.productClassId ?? "") === 規格ID && o.price !== undefined) { 価格 = String(o.price); return; }
      Object.values(o).forEach(探す);
    };
    探す(r.json);
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(価格, `商品規格ID ${規格ID} の価格（基準価格 2345）`).toBe("2345");
  });
});

caseTest("IT-A06-06-011", async (ctx) => {
  const r = await 送る(ctx, "699999011", "買取用カード一覧取得（無いカード詳細ID）");
  await ctx.expected(async () => {
    const errors = ((r.json ?? {}) as Record<string, unknown>).errors;
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(Array.isArray(errors) ? (errors as unknown[]).map(String) : [], "エラーの一覧（英訳されていない文）").toContain("カードが見つかりません");
  });
});
