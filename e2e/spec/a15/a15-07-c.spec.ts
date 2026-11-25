/**
 * A15-07 アーキタイプ検索（GET /api/archetypes/{フォーマットID}）の 004。正本: cases/A15-07_test_cases.tsv
 * 判定済みのケースのテストの指紋を変えないよう、ファイルを分けた。要求の送り方は spec/a15/a15-07.spec.ts と同じ
 * （開発者ツールの代わりに、試験ブラウザから要求を送り、応答の HTTP ステータスと本文を読む）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 応答, 検索する } from "../../pages/api/a15_07_archetypes";
import "../../seeds/a15-07";
import "../../seeds/a15-07-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-A15-07-004", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { r = await 検索する(ctx.page, "159999"); note(`GET /api/archetypes/159999・応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 300)}`); });
  await ctx.step(2, async () => { note("開発者ツールの Network の代わりに、試験ブラウザから送った要求の HTTP ステータスと応答本文をそのまま読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(404);
    expect.soft(r.json?.code, "応答のコード").toBe(404);
    expect.soft(r.json?.message, "応答のメッセージ").toBe("The format does not exist");
  });
});
