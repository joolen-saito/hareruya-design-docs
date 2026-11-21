/**
 * A16-02 言語コードに紐づいたトップバナーの情報一覧の取得（GET /api/topBanners/{言語コード}.json）の要求の送り方。
 * 「ブラウザの開発者ツールで開き、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * 認証情報を付けずに GET を送り、HTTP ステータスと応答本文（JSON）を読む。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 応答 = { ステータス: number; 本文: string; json: unknown };

const 読む = (t: string): unknown => { try { return JSON.parse(t) as unknown; } catch { return null; } };

/** 指定のパス（例: /api/topBanners/JP.json）へ、認証情報なしで GET を送る */
export async function 取得する(page: Page, パス: string): Promise<応答> {
  const res = await page.request.get(`${API_BASE_URL}${パス}`, { failOnStatusCode: false, timeout: 60_000, headers: { Accept: "application/json" } });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}

export const 一覧のパス = (コード: string, 拡張子あり = true): string => `/api/topBanners/${コード}${拡張子あり ? ".json" : ""}`;

/** 応答がJSON配列なら、各要素のバナーID（整数でなければ NaN）を並びのまま返す。配列でなければ null */
export function バナーIDの並び(r: 応答): number[] | null {
  if (!Array.isArray(r.json)) return null;
  return r.json.map((x) => (x && typeof x === "object" && typeof (x as Record<string, unknown>).id === "number" ? ((x as Record<string, unknown>).id as number) : NaN));
}
