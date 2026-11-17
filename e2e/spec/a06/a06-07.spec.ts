/**
 * A06-07 買取用カード一覧取得（商品ID指定。POST …/buying/products）。正本: cases/A06-07_test_cases.tsv
 * 実装の解釈は記録 review/A06-07_progress_2026-11-17_dev.md。要求の送り方は pages/admin/a06_mtgbuyer_api.ts（A06-01 と同じ）。
 * - 商品IDは、ケースの文のとおり URL のクエリで送る。
 * - 事前準備の「API 認証に使用できる」管理者の認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付ける形にした。
 * - 書いたのは 001・002・008・011。ほかはシードを作る共通の部品がまだ無く、書いていない（記録に書く）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { トークンを受け取る, 商品IDで買取カードを取る, 応答に商品がある, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0607_ADM_A } from "../../seeds/a06-07";
import "../../seeds/a06-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

async function 送る(ctx: CaseCtx, ids: string, 何: string): Promise<応答> {
  supplement("管理者は決まった印（-E2E）を付けた値。API 認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付けた（値は記録しない）。店舗A は本店に読み替えた");
  const token = await トークンを受け取る(ctx.page, A0607_ADM_A.loginId, A0607_ADM_A.password);
  let r!: 応答;
  await ctx.step(1, async () => { r = await 商品IDで買取カードを取る(ctx.page, 何, ids, "クエリ", token); });
  await ctx.step(2, async () => { note(`要求の方式 POST・HTTP ステータス ${r.ステータス}・応答 ${r.本文.slice(0, 300) || "（空）"}`); });
  return r;
}

caseTest("IT-A06-07-001", async (ctx) => {
  const r = await 送る(ctx, `${ctx.notes.get("〔商品ID-A0607-共有A〕")},${ctx.notes.get("〔商品ID-A0607-共有B〕")}`, "買取用カード一覧取得（商品ID 2件）");
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "POST 要求の HTTP ステータス").toBe(200);
    expect.soft(r.json !== null && typeof r.json === "object", "応答が JSON 形式").toBe(true);
  });
});

caseTest("IT-A06-07-002", async (ctx) => {
  const [a, b, c] = ["A", "B", "C"].map((x) => ctx.notes.get(`〔商品ID-A0607-共有${x}〕`));
  const r = await 送る(ctx, `${a},${b}`, "買取用カード一覧取得（商品ID 2件）");
  await ctx.expected(async () => {
    expect.soft(応答に商品がある(r, a), `指定した商品ID ${a} が返る`).toBe(true);
    expect.soft(応答に商品がある(r, b), `指定した商品ID ${b} が返る`).toBe(true);
    expect.soft(応答に商品がある(r, c), `指定していない商品ID ${c} が返る`).toBe(false);
  });
});

caseTest("IT-A06-07-008", async (ctx) => {
  const id = ctx.notes.get("〔商品ID-A0607-008〕");
  const r = await 送る(ctx, id, "買取用カード一覧取得（販売価格3456・基準価格2345の商品）");
  await ctx.expected(async () => {
    const 価格 = 状態階層の価格(r, ctx.notes.get("〔商品規格ID-A0607-008〕"));
    expect.soft(応答に商品がある(r, id), `商品ID ${id} が返る`).toBe(true);
    expect.soft(価格, "状態階層の価格（基準価格 2345）").toBe("2345");
  });
});

caseTest("IT-A06-07-011", async (ctx) => {
  const r = await 送る(ctx, ctx.notes.get("〔商品ID-A0607-011〕"), "買取用カード一覧取得（カード商品でない商品ID）");
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(Array.isArray(r.json) && (r.json as unknown[]).length === 0, `応答の JSON が空配列（実際: ${r.本文.slice(0, 100)}）`).toBe(true);
  });
});

/** 応答の中で、その商品規格IDを持つ要素の価格の値（文字列。無ければ null） */
function 状態階層の価格(r: 応答, 規格ID: string): string | null {
  let found: string | null = null;
  const 探す = (v: unknown): void => {
    if (found !== null) return;
    if (Array.isArray(v)) { v.forEach(探す); return; }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (String(o.productClassId ?? "") === 規格ID && o.price !== undefined) { found = String(o.price); return; }
      Object.values(o).forEach(探す);
    }
  };
  探す(r.json);
  return found;
}
