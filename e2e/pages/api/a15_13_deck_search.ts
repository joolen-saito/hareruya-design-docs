/**
 * A15-13 デッキ情報検索（デッキビルダーの API の GET /api/decks）の要求の送り方。
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む（A15-17 と同じ作り）。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 検索の応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };

const 読む = (t: string): Record<string, unknown> | null => { try { return JSON.parse(t) as Record<string, unknown>; } catch { return null; } };

/** 検索条件。フォーマットは配列で送る（API は format[] の形だけを条件として受け取る） */
export type 検索条件 = { フォーマット?: string[]; モード?: string; 大会デッキ?: string; ユーザーデッキ?: string; 追加?: [string, string][] };

export async function デッキを検索する(page: Page, 条件: 検索条件, token?: string): Promise<検索の応答> {
  const params = new URLSearchParams();
  if (条件.モード !== undefined) params.set("mode", 条件.モード);
  if (条件.大会デッキ !== undefined) params.set("event_deck_flag", 条件.大会デッキ);
  if (条件.ユーザーデッキ !== undefined) params.set("user_deck_flag", 条件.ユーザーデッキ);
  for (const [k, v] of 条件.追加 ?? []) params.append(k, v);
  for (const f of 条件.フォーマット ?? []) params.append("format[]", f);
  const headers: Record<string, string> = token !== undefined ? { "jwt-token": token } : {};
  const res = await page.request.get(`${API_BASE_URL}/api/decks?${params.toString()}`, { headers, failOnStatusCode: false, timeout: 120_000 });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}
