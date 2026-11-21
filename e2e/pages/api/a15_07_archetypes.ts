/**
 * A15-07 アーキタイプ検索（デッキビルダーの API の GET /api/archetypes/{フォーマットID}）の要求の送り方。
 * 「ブラウザの開発者ツールから GET で要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * 要求を送り、HTTP ステータスと応答本文（JSON）を読む。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };
export type アーキタイプ = { id?: unknown; name_jp?: unknown; name_en?: unknown };

const 読む = (t: string): Record<string, unknown> | null => { try { const v = JSON.parse(t) as unknown; return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null; } catch { return null; } };

/** アクセストークンのヘッダ（jwt-token）は、指定があるときだけ付ける */
export async function 検索する(page: Page, フォーマットID: string, jwtトークン?: string): Promise<応答> {
  const headers: Record<string, string> = jwtトークン !== undefined ? { "jwt-token": jwtトークン } : {};
  const res = await page.request.get(`${API_BASE_URL}/api/archetypes/${フォーマットID}`, { headers, failOnStatusCode: false, timeout: 60_000 });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}

export const アーキタイプの並び = (r: 応答): アーキタイプ[] => (Array.isArray(r.json?.archetypes) ? (r.json?.archetypes as アーキタイプ[]) : []);
