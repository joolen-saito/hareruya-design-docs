/**
 * A08-01 トップバナーIDのトップバナー情報を取得（GET /topBanner/{トップバナーID}）の要求の送り方（-r。2026-11-25）。
 * 「ブラウザで開き、開発者ツールの Network で HTTP ステータスと応答 JSON を見る」の代わりに、試験ブラウザから GET を送り、応答を読む。
 * 送り先は API サーバー（config/env.ts の API_BASE_URL）。パスは正本のとおり。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";

export type 応答 = { ステータス: number; 本文: string; json: unknown };
const 読む = (t: string): unknown => { try { return JSON.parse(t) as unknown; } catch { return null; } };

export async function トップバナーを取得する(page: Page, トップバナーID: string): Promise<応答> {
  const res = await page.request.get(`${API_BASE_URL}/topBanner/${トップバナーID}`, { failOnStatusCode: false, timeout: 60_000, headers: { Accept: "application/json" } });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}
