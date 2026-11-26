/**
 * A15-07 アーキタイプ検索（デッキビルダーの API の GET /api/archetypes/{フォーマットID}）の 006（アーキタイプが0件のフォーマット）。
 * 正本: cases/A15-07_test_cases.tsv。既存の spec/a15/a15-07.spec.ts は変えない（判定済みのケースの指紋を変えないため、別のファイルにした）。
 * 「開発者ツールから GET で要求を送り、Network で応答を見る」の代わりに、試験ブラウザから要求を送り、HTTP ステータスと応答本文（JSON）を読む。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { アーキタイプの並び, 応答, 検索する } from "../../pages/api/a15_07_archetypes";
import "../../seeds/a15-07-d";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-A15-07-006", async (ctx) => {
  const f = ctx.notes.get("〔フォーマットID-A1507-共有C〕");
  let r: 応答 | null = null;
  await ctx.step(1, async () => {
    supplement("開発者ツールの代わりに、試験ブラウザからアーキタイプ検索 API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む。フォーマットの識別子は、シードが登録して控えた番号を使った");
    r = await 検索する(ctx.page, f);
    note(`GET /api/archetypes/${f}・応答 HTTP ${r.ステータス}・本文の先頭 ${r.本文.slice(0, 300)}`);
  });
  await ctx.step(2, async () => { note("HTTP ステータスと応答 JSON を確認する"); });
  await ctx.expected(async () => {
    expect.soft(r?.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r?.json?.code, "処理結果コード").toBe(200);
    expect.soft(Array.isArray(r?.json?.archetypes), "archetypes が配列").toBe(true);
    expect.soft(r ? アーキタイプの並び(r).length : -1, "archetypes の件数（空の配列）").toBe(0);
  });
});
