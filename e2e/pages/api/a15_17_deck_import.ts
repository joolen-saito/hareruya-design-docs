/**
 * A15-17 デッキ登録インポート（デッキビルダーの API の POST /api/deck/import）の要求の送り方。
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む（A15-02 と同じ作り）。
 * 送り先は API サーバー（config/env.ts の API_BASE_URL）。アクセストークンはログインの API で受け取る（署名鍵は使わない）。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 応答 = { ステータス: number; 本文: string; json: Record<string, unknown> | null };

/** デッキ登録インポートの要求の中身（識別子・名前はシードで控えたもの） */
export type インポート要求 = {
  フォーマット?: string;
  /** カードリストの各行（空行は空文字）。undefined なら項目ごと送らない */
  カードリスト?: string[] | string;
  デッキ名?: string;
  公開区分?: string;
  アーキタイプ?: string;
  画像用カード?: string;
  キャンペーンタグ?: string[] | string;
};

const 読む = (t: string): Record<string, unknown> | null => { try { return JSON.parse(t) as Record<string, unknown>; } catch { return null; } };

/** 要求の本文（項目の名前は API のもの） */
export function 要求の本文(v: インポート要求): Record<string, unknown> {
  const b: Record<string, unknown> = {};
  if (v.フォーマット !== undefined) b.format_id = v.フォーマット;
  if (v.カードリスト !== undefined) b.card_list = Array.isArray(v.カードリスト) ? v.カードリスト.join("\n") : v.カードリスト;
  if (v.デッキ名 !== undefined) b.deck_name = v.デッキ名;
  if (v.公開区分 !== undefined) b.scope_id = v.公開区分;
  if (v.アーキタイプ !== undefined) b.archetype_id = v.アーキタイプ;
  if (v.画像用カード !== undefined) b.image_card_id = v.画像用カード;
  if (v.キャンペーンタグ !== undefined) b.campaign_tag_ids = v.キャンペーンタグ;
  return b;
}

/** ログインの API でアクセストークンを受け取る（値は記録しない）。受け取れなければ null と応答 */
export async function ログインする(page: Page, メール: string, パスワード: string): Promise<{ token: string | null; 応答: 応答 }> {
  const res = await page.request.post(`${API_BASE_URL}/api/user/login`, { data: { id: メール, password: パスワード }, failOnStatusCode: false, timeout: 60_000 });
  const 本文 = await res.text();
  const json = 読む(本文);
  const t = json?.access_token;
  return { token: typeof t === "string" && t ? t : null, 応答: { ステータス: res.status(), 本文: json ? JSON.stringify({ ...json, access_token: "（記録しない）" }) : 本文.slice(0, 200), json } };
}

/** 署名の部分（末尾）の1文字を変える。署名鍵は使わない */
export function 署名を1文字変える(token: string): string {
  const i = token.lastIndexOf(".");
  const 署名 = token.slice(i + 1);
  const 変えた = 署名.slice(0, -1) + (署名.endsWith("A") ? "B" : "A");
  return `${token.slice(0, i + 1)}${変えた}`;
}

/** デッキ登録インポートの要求を送る（token が undefined ならヘッダを付けない） */
export async function インポートする(page: Page, token: string | undefined, 要求: インポート要求): Promise<応答> {
  const headers: Record<string, string> = token !== undefined ? { "jwt-token": token } : {};
  const res = await page.request.post(`${API_BASE_URL}/api/deck/import`, { data: 要求の本文(要求), headers, failOnStatusCode: false, timeout: 120_000 });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}
