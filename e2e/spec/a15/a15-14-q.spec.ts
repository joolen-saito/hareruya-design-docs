/**
 * A15-14 メタゲーム情報参照（GET /api/metagame）の認証の有無による応答の比較（016）。正本: cases/A15-14_test_cases.tsv
 * 「開発者ツールで要求を送り、Network で応答を比べる」の代わりに、試験ブラウザから API へ要求を送り、応答の HTTP ステータスと本文（JSON）を読む。
 */
import { test } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { caseTest, expect } from "../../lib/case";
import { ログインする } from "../../pages/api/a15_18_deck_update_import";
import "../../seeds/a15-14";
import { 会員016, 会員016のメール } from "../../seeds/a15-14-q";
import "../../seeds/a15-14-q";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
type 行 = { id?: unknown; deck_count?: unknown; rate?: unknown };

caseTest("IT-A15-14-016", async ({ page, notes, step, expected }) => {
  supplement("事前準備②の会員（顧客ID 71514016・DBシード・テスト用認証データ作成機構のトークン）は、フロントの新規会員登録で作った会員と、ログインのAPIで受け取った有効なトークンで読み替えた（値は記録しない）");
  const fid = notes.get("〔フォーマット識別子-A1514-016〕");
  const A = notes.get("〔アーキタイプ識別子-A1514-016A〕"), B = notes.get("〔アーキタイプ識別子-A1514-016B〕");
  const url = `${API_BASE_URL}/api/metagame?format_id=${encodeURIComponent(fid)}`;
  type 応答 = { ステータス: number; アーキタイプ: { id: number; deck_count: number; rate: number }[]; 本文: string };
  const 読む = async (headers: Record<string, string>): Promise<応答> => {
    const res = await page.request.get(url, { headers, failOnStatusCode: false, timeout: 60_000 });
    const 本文 = await res.text();
    let json: { formats?: { id?: unknown; archetypes?: 行[] }[] } | null = null;
    try { json = JSON.parse(本文); } catch { /* 本文で見る */ }
    const f = (json?.formats ?? []).find((x) => String(x.id) === fid);
    return { ステータス: res.status(), 本文, アーキタイプ: (f?.archetypes ?? []).map((a) => ({ id: Number(a.id), deck_count: Number(a.deck_count), rate: Number(a.rate) })) };
  };
  let 無: 応答, 有: 応答;
  await step(1, async () => { note("開発者ツールの代わりに、試験ブラウザから要求を送り、応答の HTTP ステータスと本文を読む"); });
  await step(2, async () => { 無 = await 読む({}); note(`jwt-token なし: HTTP ${無.ステータス}・本文 ${無.本文.slice(0, 600)}`); });
  await step(3, async () => {
    const { token, 応答: ログイン } = await ログインする(page, 会員016のメール(), 会員016.パスワード);
    if (!token) throw new Error(`ログインのAPIがトークンを返さない（HTTP ${ログイン.ステータス}）`);
    有 = await 読む({ "jwt-token": token });
    note(`有効な jwt-token 付き: HTTP ${有.ステータス}・本文 ${有.本文.slice(0, 600)}`);
  });
  await step(4, async () => { note(`2回の archetypes: なし ${JSON.stringify(無.アーキタイプ)} ／ あり ${JSON.stringify(有.アーキタイプ)}`); });
  await expected(async () => {
    expect.soft(無.ステータス, "認証用トークンなしの HTTP ステータス").toBe(200);
    expect.soft(有.ステータス, "認証用トークンありの HTTP ステータス").toBe(200);
    const want = [{ id: Number(A), deck_count: 3, rate: 60 }, { id: Number(B), deck_count: 2, rate: 40 }];
    expect.soft(無.アーキタイプ, "トークンなしの archetypes（識別子・deck_count・rate）").toEqual(want);
    expect.soft(有.アーキタイプ, "トークンありの archetypes（識別子・deck_count・rate）").toEqual(want);
    expect.soft(JSON.stringify(有.アーキタイプ), "2回の archetypes が同一内容").toBe(JSON.stringify(無.アーキタイプ));
  });
});
