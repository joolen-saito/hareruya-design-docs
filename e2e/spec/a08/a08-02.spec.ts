/**
 * A08-02 指定言語の設定済みトップバナー一覧を取得（GET /topBanners/{言語コード}.json）。正本: cases/A08-02_test_cases.tsv
 * 実装したケースと解釈は記録 review/A08-02_progress_2026-11-21_dev.md。
 *
 * 「ブラウザで開き、開発者ツールの Network で HTTP ステータスと応答 JSON を見る」の代わりに、試験ブラウザから GET を送り、応答を読む。
 * 全員が見るトップページに影響するため、トップバナー・言語は書き換えない（seeds/a08-02.ts）。
 * 書いたケース: 002（紐づくバナーが0件の言語）・003（存在しない言語コード）。
 * 書かないケース: 001・004（日本語・英語に紐づく全員が見るバナーの紐づけを外して置き換える必要がある）・
 * 007（共有マスタの言語に固定の番号のバナーを足す DB の書き込みが要る。基盤の持ち主の確かめに合わない）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 取得する, 応答 } from "../../pages/api/a08_02_top_banners";
import "../../seeds/a08-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "ブラウザで開いて開発者ツールの Network で見る代わりに、試験ブラウザから GET を送り、応答の HTTP ステータスと本文（JSON）を読む";
const 大文字の補い = "言語コードは、新しいアプリのマスタの表記（大文字）の言語を指すものとして読んだ（シード表は小文字。新しいアプリの経路は大文字小文字を区別せず言語を探す）";

caseTest("IT-A08-02-002", async (ctx) => {
  let r: 応答 | null = null;
  await ctx.step(1, async () => {
    r = await 取得する(ctx.page, "fr");
    note(`GET /topBanners/fr.json・応答 HTTP ${r.ステータス}・本文の先頭 ${r.本文.slice(0, 200)}`);
    supplement(大文字の補い);
  });
  await ctx.step(2, async () => { note(開発者ツールの代わり); });
  await ctx.expected(async () => {
    expect.soft(r?.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r?.json, "応答 JSON が、ラップオブジェクトを持たない空配列").toEqual([]);
  });
});

caseTest("IT-A08-02-003", async (ctx) => {
  let r: 応答 | null = null;
  await ctx.step(1, async () => {
    r = await 取得する(ctx.page, "zz");
    note(`GET /topBanners/zz.json・応答 HTTP ${r.ステータス}・本文の先頭 ${r.本文.slice(0, 200)}`);
    supplement(大文字の補い);
  });
  await ctx.step(2, async () => { note(開発者ツールの代わり); });
  await ctx.expected(async () => {
    const j = r?.json as Record<string, unknown> | null;
    expect.soft(r?.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(j?.code, "応答 JSON の処理結果コード").toBe(404);
    expect.soft(j?.message, "応答 JSON のメッセージ").toBe("Language code is not found");
  });
});
