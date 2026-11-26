/**
 * A16-01 トップバナー情報取得（GET /topBanner/{バナーID}）の 005。正本: cases/A16-01_test_cases.tsv
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザから認証情報なしで GET を送り、
 * HTTP ステータスと応答本文を読む（A16-02 と同じ）。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 取得する, 応答 } from "../../pages/api/a16_02_top_banners";
import "../../seeds/a16-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** 応答本文が、code=404 と message=「Not Found」の2項目だけを持つ該当なしの JSON か */
function 該当なしのJSONか(r: 応答): boolean {
  const j = r.json;
  if (!j || typeof j !== "object" || Array.isArray(j)) return false;
  const o = j as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  return keys.length === 2 && keys[0] === "code" && keys[1] === "message" && o.code === 404 && o.message === "Not Found";
}

caseTest("IT-A16-01-005", async (ctx) => {
  let r: 応答 | null = null;
  await ctx.step(1, async () => { supplement("開発者ツールのネットワークパネルの代わりに、試験ブラウザから認証情報を付けずに GET を送り、応答の HTTP ステータスと本文を読む"); });
  await ctx.step(2, async () => {
    r = await 取得する(ctx.page, "/topBanner/");
    note(`GET /topBanner/（バナーIDなし・認証情報なし）・応答 HTTP ${r.ステータス}・本文の先頭 ${r.本文.slice(0, 200)}`);
  });
  await ctx.step(3, async () => { note("HTTP ステータスと応答本文を確認する"); });
  await ctx.expected(async () => {
    expect.soft(r?.ステータス, "バナーIDを付けない要求の HTTP ステータス").toBe(404);
    expect.soft(r ? 該当なしのJSONか(r) : null, "応答本文が code=404・message=「Not Found」の2項目を持つ該当なしの JSON ではない").toBe(false);
  });
});
