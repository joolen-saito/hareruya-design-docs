/**
 * A16-02 言語コードに紐づいたトップバナーの情報一覧を取得（GET /api/topBanners/{言語コード}.json）。正本: cases/A16-02_test_cases.tsv
 * 実装したケースと解釈は記録 review/A16-02_progress_2026-11-21_dev.md。
 *
 * 「ブラウザで開く・開発者ツールの Network で見る」の代わりに、試験ブラウザから認証情報なしで GET を送り、HTTP ステータスと応答本文（JSON）を読む。
 * 開発環境のトップページには全員に見えるバナーが載っているため、トップバナー・言語は書き換えない（seeds/a16-02.ts）。
 * 書いたケース: 001・006（期待結果が個々のバナーの内容に依存しない）。
 * 書かないケース: 002・003・004・005・011（バナーID 2・3・5・6・7・20 の内容と日本語への紐づけを正本のとおりに書き換える必要があり、
 * 全員が見るトップページの表示が変わる。011 は記事サイトのトップページそのものを見る）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 一覧のパス, 取得する, 応答 } from "../../pages/api/a16_02_top_banners";
import "../../seeds/a16-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールのネットワークパネルの代わりに、試験ブラウザから認証情報を付けずに GET を送り、応答の HTTP ステータスと本文（JSON）を読む";
const バナー未設定の補い = "シード表のバナー（ID 2・3・5・6・7・20 の内容と日本語への紐づけ）は、全員が見るトップページの表示が変わるため書き換えていない。この確かめは個々のバナーの内容に依存しない";

caseTest("IT-A16-02-001", async (ctx) => {
  let r: 応答 | null = null;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    r = await 取得する(ctx.page, 一覧のパス("JP"));
    note(`GET ${一覧のパス("JP")}（認証情報なし）・応答 HTTP ${r.ステータス}・本文の先頭 ${r.本文.slice(0, 200)}`);
  });
  await ctx.step(3, async () => { supplement(バナー未設定の補い); });
  await ctx.expected(async () => {
    expect.soft(r?.ステータス, "認証情報を付けない GET への HTTP ステータス").toBe(200);
  });
});

caseTest("IT-A16-02-006", async (ctx) => {
  let 拡張子あり: 応答 | null = null;
  let 拡張子なし: 応答 | null = null;
  await ctx.step(1, async () => {
    拡張子あり = await 取得する(ctx.page, 一覧のパス("JP"));
    note(`GET ${一覧のパス("JP")}・応答 HTTP ${拡張子あり.ステータス}・本文の長さ ${拡張子あり.本文.length}`);
    supplement(バナー未設定の補い);
  });
  await ctx.step(2, async () => {
    拡張子なし = await 取得する(ctx.page, 一覧のパス("JP", false));
    note(`GET ${一覧のパス("JP", false)}・応答 HTTP ${拡張子なし.ステータス}・本文の長さ ${拡張子なし.本文.length}`);
  });
  await ctx.step(3, async () => { note("2つの応答の JSON を、値として比べる"); });
  await ctx.expected(async () => {
    expect.soft(拡張子あり?.ステータス, "拡張子ありのパスの HTTP ステータス").toBe(200);
    expect.soft(拡張子なし?.ステータス, "拡張子なしのパスの HTTP ステータス").toBe(200);
    expect.soft(拡張子なし?.json, "拡張子なしのパスの一覧が、拡張子ありのパスの一覧と同じ").toEqual(拡張子あり?.json);
  });
});
