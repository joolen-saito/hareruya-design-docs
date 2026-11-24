/**
 * A15-14 メタゲーム情報参照（デッキビルダーの API の GET /api/metagame）の 018（アーキタイプの代表カード画像）。正本: cases/A15-14_test_cases.tsv
 * 判定済みのケースの指紋を守るため、spec/a15/a15-14.spec.ts と分けた。記録 review/A15-14_progress_2026-11-24_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、ブラウザでメタゲーム情報参照 API のアドレス（条件はクエリ）を
 * 開き、画面に出た応答本体（JSON）と HTTP ステータスを読む（a15-14.spec.ts と同じ）。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 */
import { test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, expect } from "../../lib/case";
import "../../seeds/a15-14-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
type アーキタイプ = { id?: unknown; card_image?: unknown };

caseTest("IT-A15-14-018", async (ctx) => {
  const fid = ctx.notes.get("〔フォーマット識別子-A1514-018〕");
  let ステータス = 0; let 本文 = ""; let archetypes: アーキタイプ[] = [];
  await ctx.step(1, async () => { note("開発者ツールの代わりに、ブラウザでメタゲーム情報参照 API（GET /api/metagame）のアドレスを開いて要求を送り、画面に出た応答本体と HTTP ステータスを読んだ"); });
  await ctx.step(2, async () => {
    await ctx.page.setExtraHTTPHeaders({});
    const res = await ctx.page.goto(`${API_BASE_URL}/api/metagame?format_id=${encodeURIComponent(fid)}`, { timeout: 60_000 });
    if (!res) throw new Error("メタゲーム情報参照 API の応答が無い");
    ステータス = res.status(); 本文 = await res.text();
    let json: Record<string, unknown> | null = null;
    try { json = JSON.parse(本文) as Record<string, unknown>; } catch { /* JSON でない */ }
    const f = Array.isArray(json?.formats) ? (json!.formats as { id?: unknown; archetypes?: アーキタイプ[] }[]) : [];
    archetypes = f.find((x) => String(x.id) === fid)?.archetypes ?? [];
    note(`GET /api/metagame?format_id=${fid}（count の指定なし・jwt-token なし）・応答 HTTP ${ステータス}・本文 ${本文.slice(0, 400)}`);
  });
  await ctx.step(3, async () => { note(`archetypes の card_image: ${archetypes.map((a) => `${String(a.id)}=${JSON.stringify(a.card_image)}`).join("・") || "なし"}`); });
  const 画像 = (呼び名: string) => archetypes.find((a) => String(a.id) === ctx.notes.get(呼び名))?.card_image;
  await ctx.expected(async () => {
    expect.soft(ステータス, "HTTP ステータス（確かめの前提）").toBe(200);
    expect.soft(画像("〔アーキタイプ識別子-A1514-018A〕"), "アーキタイプ018A の card_image").toBe("https://example.invalid/archetypes/A1514-018-1.jpg");
    expect.soft(画像("〔アーキタイプ識別子-A1514-018B〕"), "アーキタイプ018B の card_image").toBe("https://example.invalid/archetypes/A1514-018-2.jpg");
  });
});
