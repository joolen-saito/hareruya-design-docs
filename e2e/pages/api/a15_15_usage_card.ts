/**
 * A15-15 採用枚数情報参照（デッキビルダーの API）の要求の送り方。
 * 「ブラウザの開発者ツールから GET で要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * 要求を送り、HTTP ステータス・本文の種類（Content-Type）・応答本文を読む。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 *
 * 送り先の経路: 設計（機能一覧の経路）は GET /deck/usage_card/{フォーマット識別子}。新アプリはデッキビルダーの API を /api/ の下に置く
 * （デッキ情報参照は /api/deck/{id}・アーキタイプ検索は /api/archetypes/{id}）ので、同じ置き方の /api/deck/usage_card/{…} へ送る。
 * 条件の名前と応答の項目名は、現行（デッキの API の採用枚数）の名前に合わせる（A15-15 は現行踏襲）。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export const 新アプリの経路 = (フォーマットID: string) => `/api/deck/usage_card/${フォーマットID}`;
export const 設計の経路 = (フォーマットID: string) => `/deck/usage_card/${フォーマットID}`;

export type 条件 = { 種別?: "土地" | "土地以外"; アーキタイプ?: string; ボード?: string; 件数?: string };
export type 応答 = { 経路: string; ステータス: number; 種類: string; 本文: string; json: Record<string, unknown> | null };
export type カード別集計 = { id?: unknown; name_jp?: unknown; name_en?: unknown; image_jp?: unknown; image_en?: unknown; totalCount?: unknown };

const 読む = (t: string): Record<string, unknown> | null => { try { const v = JSON.parse(t) as unknown; return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null; } catch { return null; } };

/** 条件を要求の項目に直す。種別の「土地以外」は、現行が「土地」以外の値をすべて土地以外として扱うので、land でない値を送る */
function 項目(v: 条件): Record<string, string> {
  const q: Record<string, string> = {};
  if (v.種別) q.type = v.種別 === "土地" ? "land" : "nonland";
  if (v.アーキタイプ) q.archetype_id = v.アーキタイプ;
  if (v.ボード) q.board_id = v.ボード;
  if (v.件数) q.count = v.件数;
  return q;
}

/** 採用枚数情報参照へ GET で送る。認証 は Authorization ヘッダの値（指定があるときだけ付ける） */
export async function 採用枚数を参照する(page: Page, フォーマットID: string, v: 条件 = {}, 認証?: string, 経路 = 新アプリの経路(フォーマットID)): Promise<応答> {
  const headers: Record<string, string> = 認証 !== undefined ? { Authorization: 認証 } : {};
  const res = await page.request.get(`${API_BASE_URL}${経路}`, { params: 項目(v), headers, failOnStatusCode: false, timeout: 60_000 });
  const 本文 = await res.text();
  return { 経路, ステータス: res.status(), 種類: res.headers()["content-type"] ?? "", 本文, json: 読む(本文) };
}

/** 送り先の経路がアプリに無い応答か（404 で、本文が JSON でない）。設計は、フォーマットが無いときも 404 だが、本文は JSON（「format not found」） */
export const 経路が無い = (r: 応答): boolean => r.ステータス === 404 && r.json === null;

export const カード別集計の並び = (r: 応答): カード別集計[] | null => (Array.isArray(r.json?.cards) ? (r.json?.cards as カード別集計[]) : null);
