/**
 * A15-06 マスタ検索（デッキビルダーの API の GET /api/master/{name}）の 010・011。正本: cases/A15-06_test_cases.tsv
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、ブラウザで API のアドレスを開いて要求を送り、画面に出た応答本体（JSON）と
 * HTTP ステータスを読む（A15-08 と同じ）。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 * 書いていないケース: 004・009・020（ほかのフォーマットの「デッキビルダーで利用」を全部外す／絞る作りが要る。全員が使うマスタの書き換えになる）、
 * 019（親のカテゴリを新しく作る。最上位カテゴリは判断待ち）。
 */
import { Page, test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、ブラウザでマスタ検索 API（GET /api/master/{name}）のアドレスを開いて要求を送り、画面に出た応答本体（JSON）と HTTP ステータスを読んだ。送り先は API サーバー";

type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };

async function マスタを検索する(page: Page, 名前: string): Promise<応答> {
  await page.setExtraHTTPHeaders({});
  const res = await page.goto(`${API_BASE_URL}/api/master/${encodeURIComponent(名前)}`, { timeout: 60_000 });
  if (!res) throw new Error(`マスタ検索 API（name=${名前}）の応答が無い`);
  const 本文 = await res.text();
  let json: Record<string, unknown> | null = null;
  try { json = JSON.parse(本文) as Record<string, unknown>; } catch { /* JSON でない応答は本文で見る */ }
  note(`GET /api/master/${名前}・応答 HTTP ${res.status()}・${本文.slice(0, 200)}`);
  return { ステータス: res.status(), 本文, json };
}

caseTest("IT-A15-06-010", async (ctx: CaseCtx) => {
  const 結果: Record<string, 応答> = {};
  await ctx.step(1, async () => { supplement(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    for (const n of ["authority", "card", "card_detail"]) 結果[n] = await マスタを検索する(ctx.page, n);
  });
  await ctx.step(3, async () => { note("3つの応答を確認した"); });
  await ctx.expected(async () => {
    for (const n of ["authority", "card", "card_detail"]) {
      expect.soft(結果[n]?.ステータス, `name=${n} の HTTP ステータス`).toBe(404);
      expect.soft(結果[n]?.json?.code, `name=${n} の code`).toBe(404);
      expect.soft(結果[n]?.json?.message, `name=${n} の message`).toBe("見つかりません");
    }
  });
});

caseTest("IT-A15-06-011", async (ctx: CaseCtx) => {
  let r!: 応答;
  await ctx.step(1, async () => { supplement(開発者ツールの代わり + "。マスタ識別名「not_exist_master」は存在しない名前（シードなし）"); });
  await ctx.step(2, async () => { r = await マスタを検索する(ctx.page, "not_exist_master"); });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(r.json?.code, "code").toBe(404);
    expect.soft(r.json?.message, "message").toBe("見つかりません");
  });
});
