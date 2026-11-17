/**
 * A06-12 固定価格部門取得（MTGBuyer の API）。正本: cases/A06-12_test_cases.tsv。記録 review/A06-12_progress_2026-11-17_dev.md。
 * - 要求の送り方は pages/admin/a06_mtgbuyer_api.ts（A06-01 と同じ）。認証は、手順1の前に管理者のログイン API で受け取ったトークンを付ける。
 * - ケースの文のパス `/api/fixedPriceSection.json`（入口を /api/v1 に読み替え）は 404 になる（2026-11-17 に確かめた）。アプリの経路
 *   （管理者の API の固定価格部門取得）で送り、ケースの文のパスで 404 になることも手順の中で送って注記に残す。
 * - 共有の追加システム設定を書き換えて戻すので、夜の回で1本だけで流す。003・004 は書いていない（シードの記録）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { トークンを受け取る, 固定価格部門を取る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0612_ADM } from "../../seeds/a06-12";
import "../../seeds/a06-12";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 送る(ctx: CaseCtx): Promise<応答> {
  supplement("管理者は決まった印（-E2E）を付けた値。認証は手順1の前に管理者のログイン API で受け取ったトークンを付けた（値は記録しない）。ケースの文のパスは 404 なので、アプリの経路（/api/v1/admin/fixedPriceSection.json）で送った");
  const token = await トークンを受け取る(ctx.page, A0612_ADM.loginId, A0612_ADM.password);
  let r!: 応答;
  await ctx.step(1, async () => {
    const 文のパス = await 固定価格部門を取る(ctx.page, "固定価格部門取得（ケースの文のパス）", "文のとおり", token);
    note(`ケースの文のパス（入口を /api/v1 に読み替え）は HTTP ${文のパス.ステータス}`);
    r = await 固定価格部門を取る(ctx.page, "固定価格部門取得（アプリの経路）", "アプリの経路", token);
  });
  await ctx.step(2, async () => { note(`要求の方式 GET・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 200) || "（空）"}`); });
  return r;
}

caseTest("IT-A06-12-001", async (ctx) => {
  const r = await 送る(ctx);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "GET 要求の HTTP ステータス").toBe(200);
    expect.soft(r.json !== null || r.本文.trim() !== "", "JSON 形式の応答").toBe(true);
  });
});

caseTest("IT-A06-12-002", async (ctx) => {
  const r = await 送る(ctx);
  await ctx.expected(async () => {
    const o = r.json as Record<string, unknown> | null;
    const 部門ID = ctx.notes.get("〔部門ID-A0612-共有〕");
    expect.soft(o !== null && typeof o === "object" && !Array.isArray(o), `応答の JSON がオブジェクト（実際: ${r.本文.slice(0, 80)}）`).toBe(true);
    expect.soft(o && typeof o === "object" ? (o as Record<string, unknown>).code : undefined, "処理結果コード（文字列の 200）").toBe("200");
    expect.soft(o && typeof o === "object" ? (o as Record<string, unknown>).section_id : undefined, "部門ID（追加システム設定と同じ文字列）").toBe(部門ID);
  });
});
