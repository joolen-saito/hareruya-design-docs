/**
 * A15-07 アーキタイプ検索（デッキビルダーの API の GET /api/archetypes/{フォーマットID}）。正本: cases/A15-07_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-07_progress_2026-11-21_dev.md。
 *
 * 「ブラウザの開発者ツールから GET で要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * 要求を送り、HTTP ステータスと応答本文（JSON）を読む（A15-17 と同じ）。書いたケース: 001・002・003・009。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { アーキタイプの並び, 応答, 検索する } from "../../pages/api/a15_07_archetypes";
import "../../seeds/a15-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザからアーキタイプ検索 API（GET /api/archetypes/{フォーマットの識別子}）へ要求を送り、応答の HTTP ステータスと本文（JSON）を読む";
const 識別子の補い = "フォーマット・アーキタイプの識別子は、シードが登録して控えた番号を使った（シード表のとおり、登録時に振られた番号）";

const 番号 = (ctx: CaseCtx, 呼び名: string): string => ctx.notes.get(呼び名);
const 要点 = (r: 応答): string => `応答 HTTP ${r.ステータス}・本文の先頭 ${r.本文.slice(0, 300)}`;
const 識別子の並び = (r: 応答): string[] => アーキタイプの並び(r).map((x) => String(x.id)).sort();

caseTest("IT-A15-07-001", async (ctx) => {
  const 甲 = 番号(ctx, "〔フォーマットID-A1507-共有A〕");
  const 乙 = 番号(ctx, "〔フォーマットID-A1507-共有B〕");
  const A = 番号(ctx, "〔アーキタイプID-A1507-共有A〕"), B = 番号(ctx, "〔アーキタイプID-A1507-共有B〕"), C = 番号(ctx, "〔アーキタイプID-A1507-共有C〕");
  let r甲: 応答 | null = null;
  let r乙: 応答 | null = null;
  await ctx.step(1, async () => {
    note(開発者ツールの代わり);
    supplement(識別子の補い);
    r甲 = await 検索する(ctx.page, 甲);
    note(`GET /api/archetypes/${甲}・${要点(r甲)}`);
    r乙 = await 検索する(ctx.page, 乙);
    note(`GET /api/archetypes/${乙}（対照のフォーマット）・${要点(r乙)}`);
  });
  await ctx.step(2, async () => { note("応答 JSON のアーキタイプの配列を読む"); });
  await ctx.expected(async () => {
    const 一覧 = アーキタイプの並び(r甲!);
    expect.soft(識別子の並び(r甲!), "取得対象のフォーマットのアーキタイプの識別子").toEqual([A, B].sort());
    expect.soft(一覧.map((x) => `${x.name_jp}/${x.name_en}`).sort(), "日本語名・英語名").toEqual(["白単アグロ/Mono White Aggro", "青黒コントロール/Dimir Control"].sort());
    expect.soft(識別子の並び(r甲!).includes(C), "別のフォーマットのアーキタイプが含まれない").toBe(false);
    expect.soft(識別子の並び(r乙!), "別のフォーマットの応答には、そのフォーマットのアーキタイプだけがある").toEqual([C]);
  });
});

caseTest("IT-A15-07-002", async (ctx) => {
  const 甲 = 番号(ctx, "〔フォーマットID-A1507-共有A〕");
  let r: 応答 | null = null;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(識別子の補い); });
  await ctx.step(2, async () => {
    r = await 検索する(ctx.page, 甲);
    note(`GET /api/archetypes/${甲}・${要点(r)}`);
  });
  await ctx.expected(async () => {
    expect.soft(r?.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(Array.isArray(r?.json), "応答のルートがラッパオブジェクト（配列でない）").toBe(false);
    expect.soft(r?.json?.code, "処理結果コード（整数）").toBe(200);
    expect.soft(Array.isArray(r?.json?.archetypes), "アーキタイプが配列").toBe(true);
    for (const x of アーキタイプの並び(r!)) {
      expect.soft(Object.keys(x).sort(), "各要素のキー").toEqual(["id", "name_en", "name_jp"]);
      expect.soft(Number.isInteger(x.id), `識別子が整数型（${JSON.stringify(x.id)}）`).toBe(true);
      expect.soft(typeof x.name_jp, "日本語名が文字列").toBe("string");
      expect.soft(typeof x.name_en, "英語名が文字列").toBe("string");
    }
  });
});

caseTest("IT-A15-07-003", async (ctx) => {
  const 甲 = 番号(ctx, "〔フォーマットID-A1507-共有A〕");
  const A = 番号(ctx, "〔アーキタイプID-A1507-共有A〕"), B = 番号(ctx, "〔アーキタイプID-A1507-共有B〕");
  let r1: 応答 | null = null;
  let r2: 応答 | null = null;
  await ctx.step(1, async () => { note(開発者ツールの代わり); supplement(識別子の補い); });
  await ctx.step(2, async () => {
    r1 = await 検索する(ctx.page, 甲);
    note(`ヘッダなし: GET /api/archetypes/${甲}・${要点(r1)}`);
  });
  await ctx.step(3, async () => {
    r2 = await 検索する(ctx.page, 甲, "invalid-token");
    note(`jwt-token「invalid-token」: GET /api/archetypes/${甲}・${要点(r2)}`);
  });
  await ctx.step(4, async () => { note("2回の応答を読む"); });
  await ctx.expected(async () => {
    for (const [名, r] of [["ヘッダなし", r1], ["不正なトークン", r2]] as const) {
      expect.soft(r?.ステータス, `${名}の HTTP ステータス（認証起因の 401 でない）`).toBe(200);
      expect.soft(r?.json?.code, `${名}の処理結果コード`).toBe(200);
      expect.soft(識別子の並び(r!), `${名}で返るアーキタイプ`).toEqual([A, B].sort());
    }
  });
});

caseTest("IT-A15-07-009", async (ctx) => {
  const f = 番号(ctx, "〔フォーマットID-A1507-009〕");
  const a = 番号(ctx, "〔アーキタイプID-A1507-009〕");
  let r: 応答 | null = null;
  await ctx.step(1, async () => {
    note(開発者ツールの代わり);
    supplement(識別子の補い);
    r = await 検索する(ctx.page, f);
    note(`GET /api/archetypes/${f}・${要点(r)}`);
  });
  await ctx.step(2, async () => { note("応答 JSON のアーキタイプの配列を読む"); });
  await ctx.expected(async () => {
    expect.soft(r?.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r?.json?.code, "処理結果コード").toBe(200);
    const 一覧 = アーキタイプの並び(r!);
    expect.soft(一覧.length, "アーキタイプの件数").toBe(1);
    expect.soft(String(一覧[0]?.id), "識別子").toBe(a);
    expect.soft(一覧[0]?.name_jp, "日本語名").toBe("単一アーキタイプ-A1507-009");
    expect.soft(一覧[0]?.name_en, "英語名").toBe("dpa1507-009-arch");
  });
});
