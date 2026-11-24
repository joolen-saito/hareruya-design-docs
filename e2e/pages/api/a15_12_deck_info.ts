/**
 * A15-12 デッキ情報参照（デッキビルダーの API の GET /api/deck/{デッキID}）の要求の送り方。
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む（A15-17 と同じ作り）。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 * 下書き（一時保存）は、シードがデッキ更新の API（PUT /api/deck/{デッキID}）で作る。アクセストークンはログインの API で受け取る（署名鍵は使わない）。
 */
import { APIRequestContext, Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };

const 読む = (t: string): Record<string, unknown> | null => { try { return JSON.parse(t) as Record<string, unknown>; } catch { return null; } };

/** デッキ情報参照の要求（token が undefined ならヘッダを付けない。閲覧用トークンは限定公開デッキの照合用） */
export async function デッキ情報を参照する(page: Page, デッキID: string, opt: { token?: string; 閲覧用トークン?: string } = {}): Promise<応答> {
  const headers: Record<string, string> = opt.token !== undefined ? { "jwt-token": opt.token } : {};
  const q = opt.閲覧用トークン !== undefined ? `?display_token=${encodeURIComponent(opt.閲覧用トークン)}` : "";
  const res = await page.request.get(`${API_BASE_URL}/api/deck/${デッキID}${q}`, { headers, failOnStatusCode: false, timeout: 120_000 });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}

/** 下書きの中身（デッキ更新の API の本文。即時保存の指定は偽） */
export type 下書き = { デッキ名: string; 公開範囲: number; フォーマット: string; アーキタイプ?: string; 代表カード?: string };

/** デッキ更新の API（即時保存の指定を偽）で、下書き（一時保存）を作る。応答の HTTP ステータスと本文を返す */
export async function 下書きを保存する(request: APIRequestContext, token: string, デッキID: string, d: 下書き): Promise<応答> {
  const data: Record<string, unknown> = { instant_save_flag: false, deck_name: d.デッキ名, scope_id: d.公開範囲, format_id: Number(d.フォーマット) };
  if (d.アーキタイプ !== undefined) data.archetype_id = Number(d.アーキタイプ);
  if (d.代表カード !== undefined) data.image_card_id = Number(d.代表カード);
  const res = await request.put(`${API_BASE_URL}/api/deck/${デッキID}`, { data, headers: { "jwt-token": token }, failOnStatusCode: false, timeout: 120_000 });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}
