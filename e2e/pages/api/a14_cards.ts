/**
 * A14-01 カードIDからカード情報を取得（GET /api/cards/{カードID}）・A14-02 カード詳細IDからカード詳細情報を取得（GET /api/cardDetails/{カード詳細ID}）の要求の送り方。
 * 「開発者ツールから GET で要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト。ログインしていない）から
 * 認証の見出しを付けずに要求を送り、要求メソッド・HTTP ステータス・応答本文（JSON）を読む。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 * ケースの「APIベースURL」は API サーバーの /api（ケースの「/cards/…」「/cardDetails/…」はアプリの経路 /api/cards/…・/api/cardDetails/…）。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 応答 = { 方法: string; ステータス: number; 種類: string; 本文: string; json: Record<string, unknown> | null; URL: string };

const 読む = (t: string): Record<string, unknown> | null => {
  try { const v = JSON.parse(t) as unknown; return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null; } catch { return null; }
};

async function GETする(page: Page, 経路: string): Promise<応答> {
  const url = `${API_BASE_URL}${経路}`;
  const res = await page.request.get(url, { failOnStatusCode: false, timeout: 120_000, maxRedirects: 0 });
  const 本文 = await res.text();
  return { 方法: "GET", ステータス: res.status(), 種類: res.headers()["content-type"] ?? "", 本文, json: 読む(本文), URL: url };
}

/** GET /api/cards/{カードID}（カードIDを空にすると /api/cards/） */
export const カード情報を取得 = (page: Page, カードID: string): Promise<応答> => GETする(page, `/api/cards/${カードID}`);
/** GET /api/cardDetails/{カード詳細ID}（カード詳細IDを空にすると /api/cardDetails/） */
export const カード詳細情報を取得 = (page: Page, カード詳細ID: string): Promise<応答> => GETする(page, `/api/cardDetails/${カード詳細ID}`);

/** 応答の要約（注記に残す） */
export const 要約 = (r: 応答): string => `${r.方法} ${r.URL.replace(API_BASE_URL, "（APIベースURL）")} → 状態 ${r.ステータス}・本文 ${r.本文.length > 1500 ? `${r.本文.slice(0, 1500)}…` : r.本文}`;
/** 本文の項目の値 */
export const 値 = (o: Record<string, unknown> | null | undefined, 名前: string): unknown => o?.[名前];
/** 本文の項目を持つか（値が無くても項目名があれば true） */
export const 項目がある = (o: Record<string, unknown> | null | undefined, 名前: string): boolean => !!o && Object.prototype.hasOwnProperty.call(o, 名前);
/** 一覧の項目（配列でなければ null） */
export const 一覧 = (o: Record<string, unknown> | null | undefined, 名前: string): Record<string, unknown>[] | null => {
  const v = o?.[名前];
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : null;
};
/** 値の型の名前（整数・数値・文字列・null・真偽・配列・ほか） */
export function 型(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "なし";
  if (Array.isArray(v)) return "配列";
  if (typeof v === "number") return Number.isInteger(v) ? "整数" : "数値";
  if (typeof v === "string") return "文字列";
  if (typeof v === "boolean") return "真偽";
  return typeof v;
}
/** 本文のオブジェクトの項目（オブジェクトでなければ null） */
export const 項目 = (o: Record<string, unknown> | null | undefined, 名前: string): Record<string, unknown> | null => {
  const v = o?.[名前];
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
};
