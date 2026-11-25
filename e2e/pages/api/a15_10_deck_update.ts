/**
 * A15-10 デッキ情報更新（デッキビルダーの API の PUT /api/deck/{デッキID}）の要求の送り方。
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザから API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む。
 * 送り先は API サーバー（config/env.ts の API_BASE_URL）。アクセストークンはログインの API で受け取る（署名鍵は使わない）。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import type { 応答 } from "./a15_17_deck_import";

export type { 応答 } from "./a15_17_deck_import";

const 読む = (t: string): Record<string, unknown> | null => { try { return JSON.parse(t) as Record<string, unknown>; } catch { return null; } };

/** 更新の要求の中身（API の項目の名前のまま。undefined の項目は送らない） */
export type 更新要求 = {
  deck_name?: string;
  format_id?: number | string;
  archetype_id?: number | string;
  scope_id?: number | string;
  image_card_id?: number | string;
  campaign_tag_ids?: (number | string)[] | number | string;
  cards?: { card_id: number; board_id: number; count: number }[];
  instant_save_flag?: boolean;
};

/** デッキ情報更新の要求を送る（token が undefined ならヘッダを付けない） */
export async function デッキを更新する(page: Page, token: string | undefined, デッキID: string, 要求: 更新要求): Promise<応答> {
  const headers: Record<string, string> = token !== undefined ? { "jwt-token": token } : {};
  const res = await page.request.put(`${API_BASE_URL}/api/deck/${デッキID}`, { data: 要求, headers, failOnStatusCode: false, timeout: 120_000 });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}
