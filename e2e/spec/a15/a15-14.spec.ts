/**
 * A15-14 メタゲーム情報参照（デッキビルダーの API の GET /api/metagame）。正本: cases/A15-14_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-14_progress_2026-11-20_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、ブラウザでメタゲーム情報参照 API のアドレス（条件はクエリ）を
 * 開き、画面に出た応答本体（JSON）と HTTP ステータスを読む（A15-04・A15-08 と同じ）。エビデンスには応答本体が写る。
 * 送り先は API サーバー（config/env.ts の API_BASE_URL）。配列の format_id は「format_id[]=値」を並べて送る。
 */
import { Page, test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 日付 } from "../../seeds/a15-14";
import "../../seeds/a15-14";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、ブラウザでメタゲーム情報参照 API（GET /api/metagame）のアドレスを開いて要求を送り、画面に出た応答本体（JSON）と HTTP ステータスを読む（エビデンスに応答本体が写る）";

type 型 = { id?: unknown; name_jp?: unknown; name_en?: unknown; from_date?: unknown; archetypes?: { id?: unknown; name_jp?: unknown; name_en?: unknown; deck_count?: unknown; rate?: unknown }[] };
type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null; formats: 型[] };

/** メタゲーム情報参照 API へ、条件をクエリで送る（トークンのヘッダは付けない） */
async function 送る(page: Page, q: [string, string][]): Promise<応答> {
  await page.setExtraHTTPHeaders({});
  const qs = q.map(([k, v]) => `${encodeURIComponent(k).replace(/%5B%5D$/, "[]")}=${encodeURIComponent(v)}`).join("&");
  const url = `${API_BASE_URL}/api/metagame${qs ? `?${qs}` : ""}`;
  const res = await page.goto(url, { timeout: 60_000 });
  if (!res) throw new Error("メタゲーム情報参照 API の応答が無い");
  const 本文 = await res.text();
  let json: Record<string, unknown> | null = null;
  try { json = JSON.parse(本文) as Record<string, unknown>; } catch { /* JSON でない応答は本文で見る */ }
  const formats = Array.isArray(json?.formats) ? (json!.formats as 型[]) : [];
  note(`GET /api/metagame${qs ? `?${decodeURIComponent(qs)}` : ""}（jwt-token なし）・応答 HTTP ${res.status()}・formats ${formats.length}件`);
  return { ステータス: res.status(), 本文, json, formats };
}

/** 手順1〜3（開発者ツールを開く・要求を送る・Network で応答を確認する）を行い、応答を返す */
async function 送って見る(ctx: CaseCtx, q: [string, string][]): Promise<応答> {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { r = await 送る(ctx.page, q); });
  await ctx.step(3, async () => { note(`応答本体: ${r.本文.slice(0, 1500)}`); });
  return r;
}

const 番号 = (ctx: CaseCtx, 呼び名: string): number => Number(ctx.notes.get(呼び名));
const 型の番号 = (ctx: CaseCtx, 記号: string) => 番号(ctx, `〔フォーマット識別子-A1514-${記号}〕`);
const 種の番号 = (ctx: CaseCtx, 記号: string) => 番号(ctx, `〔アーキタイプ識別子-A1514-${記号}〕`);
const 型を探す = (r: 応答, id: number): 型 | undefined => r.formats.find((f) => Number(f.id) === id);
/** アーキタイプの並び（識別子・件数・割合） */
const 並び = (f: 型 | undefined) => (f?.archetypes ?? []).map((a) => ({ id: Number(a.id), deck_count: Number(a.deck_count), rate: Number(a.rate) }));

/** 応答本文が code と message を持つ JSON か */
const code_と_message = (r: 応答): boolean => r.json !== null && "code" in r.json && "message" in r.json;

caseTest("IT-A15-14-009", async (ctx) => {
  const r = await 送って見る(ctx, []);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(400);
    expect.soft(code_と_message(r), "応答本文が code と message を持つ JSON").toBe(true);
    expect.soft(r.json?.message, "message").toBe("invalid request parameter");
  });
});

caseTest("IT-A15-14-010", async (ctx) => {
  const r = await 送って見る(ctx, [["format_id", "15999"]]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(code_と_message(r), "応答本文が code と message を持つ JSON").toBe(true);
    expect.soft(r.json?.message, "message").toBe("format not found");
  });
});

caseTest("IT-A15-14-021", async (ctx) => {
  const r = await 送って見る(ctx, [["format_id[]", "15140211"], ["format_id[]", "15140212"]]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(code_と_message(r), "応答本文が code と message を持つ JSON").toBe(true);
    expect.soft(r.json?.message, "message").toBe("format not found");
  });
});

caseTest("IT-A15-14-017", async (ctx) => {
  const r = await 送って見る(ctx, [["format_id", String(型の番号(ctx, "017"))]]);
  await ctx.expected(async () => {
    const f = 型を探す(r, 型の番号(ctx, "017"));
    expect.soft(f?.name_jp, "フォーマットの name_jp").toBe("結合試験A1514-017フォーマット");
    expect.soft(f?.name_en, "フォーマットの name_en").toBe("Integration A1514-017 Format");
    const a = (記号: string) => (f?.archetypes ?? []).find((x) => Number(x.id) === 種の番号(ctx, 記号));
    expect.soft(a("017A")?.name_jp, "アーキタイプ 017A の name_jp").toBe("結合試験A1514-017アグロ");
    expect.soft(a("017A")?.name_en, "アーキタイプ 017A の name_en").toBe("Integration A1514-017 Aggro");
    expect.soft(a("017B")?.name_jp, "アーキタイプ 017B の name_jp").toBe("結合試験A1514-017コントロール");
    expect.soft(a("017B")?.name_en, "アーキタイプ 017B の name_en").toBe("Integration A1514-017 Control");
  });
});

caseTest("IT-A15-14-019", async (ctx) => {
  const r = await 送って見る(ctx, [["format_id[]", String(型の番号(ctx, "019"))], ["format_id[]", "15140199"]]);
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス（404 でなく 200）").toBe(200); });
});

caseTest("IT-A15-14-020", async (ctx) => {
  const r = await 送って見る(ctx, [["format_id[]", String(型の番号(ctx, "020"))], ["format_id[]", "15140209"]]);
  await ctx.expected(async () => {
    expect.soft(r.formats.map((f) => Number(f.id)), "formats のフォーマット識別子（020 だけ）").toEqual([型の番号(ctx, "020")]);
    expect.soft(並び(型を探す(r, 型の番号(ctx, "020"))).map((a) => [a.id, a.deck_count]), "020 の archetypes（識別子・deck_count）")
      .toEqual([[種の番号(ctx, "020A"), 3], [種の番号(ctx, "020B"), 1]]);
    expect.soft(r.formats.some((f) => Number(f.id) === 15140209), "フォーマット識別子 15140209 の集計結果が含まれる").toBe(false);
  });
});

caseTest("IT-A15-14-022", async (ctx) => {
  const r = await 送って見る(ctx, [["format_id[]", String(型の番号(ctx, "022A"))], ["format_id[]", String(型の番号(ctx, "022B"))]]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    const fa = 型を探す(r, 型の番号(ctx, "022A"));
    const fb = 型を探す(r, 型の番号(ctx, "022B"));
    expect.soft(並び(fa), "022A の archetypes（識別子・deck_count・rate の順）")
      .toEqual([{ id: 種の番号(ctx, "022A"), deck_count: 3, rate: 75 }, { id: 種の番号(ctx, "022B"), deck_count: 1, rate: 25 }]);
    expect.soft(String(fa?.from_date ?? "").slice(0, 10), "022A の from_date の日付部分（実行日の7日前）").toBe(日付(7));
    expect.soft(並び(fb), "022B の archetypes（識別子・deck_count・rate の順）")
      .toEqual([{ id: 種の番号(ctx, "022C"), deck_count: 5, rate: 83.33 }, { id: 種の番号(ctx, "022D"), deck_count: 1, rate: 16.67 }]);
    expect.soft(String(fb?.from_date ?? "").slice(0, 10), "022B の from_date の日付部分（実行日の14日前）").toBe(日付(14));
  });
});

caseTest("IT-A15-14-023", async (ctx) => {
  const r = await 送って見る(ctx, [["format_id", String(型の番号(ctx, "CB023"))], ["count", "2"]]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(並び(型を探す(r, 型の番号(ctx, "CB023"))), "CB023 の archetypes（上位2件・識別子・deck_count・rate の順）")
      .toEqual([{ id: 種の番号(ctx, "CB023A"), deck_count: 5, rate: 55.56 }, { id: 種の番号(ctx, "CB023B"), deck_count: 3, rate: 33.33 }]);
  });
});

caseTest("IT-A15-14-024", async (ctx) => {
  const r = await 送って見る(ctx, [["format_id", String(型の番号(ctx, "CB024"))]]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(並び(型を探す(r, 型の番号(ctx, "CB024"))), "CB024 の archetypes（公開の3件だけ）")
      .toEqual([{ id: 種の番号(ctx, "CB024A"), deck_count: 3, rate: 100 }]);
  });
});

caseTest("IT-A15-14-025", async (ctx) => {
  const r = await 送って見る(ctx, [["format_id", String(型の番号(ctx, "CB025"))]]);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(並び(型を探す(r, 型の番号(ctx, "CB025"))), "CB025 の archetypes（範囲内の大会デッキ3件だけ）")
      .toEqual([{ id: 種の番号(ctx, "CB025A"), deck_count: 3, rate: 100 }]);
  });
});
