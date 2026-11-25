/**
 * A17-02 関連記事取得API（記事IDに関連する記事情報を取得）を、ブラウザで開いて応答を読む。HTTP のパスはここだけに書く。
 * 送り先は API サーバー（config/env.ts の API_BASE_URL）。パスは正本のとおり。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 関連記事 = { wpPostId: unknown; hasSameDeck: unknown; hasSameArchetype: unknown; hasSameCard: unknown; hasSameEventDetail: unknown };
export type 応答 = { 状態: number; 種類: string; 文字: string; 本文: unknown; 配列: 関連記事[] | null };

/** 記事IDの関連記事を開く。limit が null ならクエリを付けない */
export async function 関連記事を開く(page: Page, 記事ID: number, limit: number | null): Promise<応答> {
  const url = `${API_BASE_URL}/article/related/${記事ID}${limit === null ? "" : `?limit=${limit}`}`;
  const res = await page.goto(url, { timeout: 120_000 });
  if (!res) throw new Error("関連記事取得APIの応答が無い");
  const 文字 = await res.text();
  let 本文: unknown = null;
  try { 本文 = JSON.parse(文字); } catch { 本文 = null; }
  return { 状態: res.status(), 種類: res.headers()["content-type"] ?? "", 文字, 本文, 配列: Array.isArray(本文) ? (本文 as 関連記事[]) : null };
}

/** 値の型の名前 */
export const 型 = (v: unknown): string => (v === null ? "null" : Array.isArray(v) ? "配列" : typeof v === "number" ? "数値" : typeof v === "string" ? "文字列" : typeof v);
