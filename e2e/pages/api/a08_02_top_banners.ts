/**
 * A08-02 指定言語の設定済みトップバナー一覧の取得（GET /topBanners/{言語コード}.json）の要求の送り方。
 * 「ブラウザで開き、開発者ツールの Network で HTTP ステータスと応答 JSON を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * GET を送り、HTTP ステータスと応答本文（JSON）を読む。送り先は API サーバー（config/env.ts の API_BASE_URL）。
 * パスは正本の「/topBanners/{言語コード}.json」に API の接頭辞 /api を付けたもの（アプリの経路は /api/topBanners/{言語コード}.json。接頭辞が無いと HTML の 404 になる。A14-01 の /api/cards と同じ）。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 応答 = { ステータス: number; 本文: string; json: unknown };

const 読む = (t: string): unknown => { try { return JSON.parse(t) as unknown; } catch { return null; } };

export async function 取得する(page: Page, 言語コード: string): Promise<応答> {
  const res = await page.request.get(`${API_BASE_URL}/api/topBanners/${言語コード}.json`, { failOnStatusCode: false, timeout: 60_000, headers: { Accept: "application/json" } });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}
