/**
 * A15-18 デッキ更新インポート（デッキビルダーの API の PUT /api/deck/import/{デッキID}）の要求の送り方。
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む（A15-17 と同じ）。
 * 更新の対象デッキを作る・一時保存（下書き）を作る・読む操作もここに置く（画面が送る要求と同じ API。シード表の「DB で入れ直す」の代わり）。
 * A15-17 の部品（ログイン・要求の本文）は読み替えて使う（A15-17 のファイルは変えない）。
 */
import { Page } from "@playwright/test";
import { API_BASE_URL } from "../../config/env";
import { 応答, インポート要求, 要求の本文 } from "./a15_17_deck_import";

export { ログインする, 署名を1文字変える } from "./a15_17_deck_import";
export type { 応答, インポート要求 } from "./a15_17_deck_import";

const 読む = (t: string): Record<string, unknown> | null => { try { return JSON.parse(t) as Record<string, unknown>; } catch { return null; } };

/** デッキ更新インポートの要求を送る（token が undefined ならヘッダを付けない） */
export async function 更新インポートする(page: Page, token: string | undefined, デッキID: string, 要求: インポート要求): Promise<応答> {
  const headers: Record<string, string> = token !== undefined ? { "jwt-token": token } : {};
  const res = await page.request.put(`${API_BASE_URL}/api/deck/import/${デッキID}`, { data: 要求の本文(要求), headers, failOnStatusCode: false, timeout: 120_000 });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}

/** デッキの識別子を付けない要求は、更新ではなく登録の API（POST /api/deck/import）へ送る */
export async function 登録インポートする(page: Page, token: string | undefined, 要求: インポート要求): Promise<応答> {
  const headers: Record<string, string> = token !== undefined ? { "jwt-token": token } : {};
  const res = await page.request.post(`${API_BASE_URL}/api/deck/import`, { data: 要求の本文(要求), headers, failOnStatusCode: false, timeout: 120_000 });
  const 本文 = await res.text();
  return { ステータス: res.status(), 本文, json: 読む(本文) };
}

/** 更新の対象デッキの作り方（番号はシードで控えたもの） */
export type 対象デッキ = {
  デッキ名?: string;
  フォーマット: string;
  公開区分: string;
  アーキタイプ?: string;
  画像カード?: string;
  キャンペーンタグ?: string[];
  /** 区分ごとのカード（カードの番号と枚数） */
  デッキカード?: [string, number][];
  メイビー?: [string, number][];
  アトラクション?: [string, number][];
  ステッカー?: [string, number][];
};

/** 更新の対象デッキを、デッキビルダーの登録の API（POST /api/deck）で作る。デッキの番号を返す（作れなければ応答を投げる） */
export async function 対象デッキを作る(page: Page, token: string, d: 対象デッキ): Promise<string> {
  const cards: { card_id: number; board_id: number; count: number }[] = [];
  const 足す = (xs: [string, number][] | undefined, board: number) => { for (const [c, n] of xs ?? []) cards.push({ card_id: Number(c), board_id: board, count: n }); };
  足す(d.デッキカード, 1); 足す(d.メイビー, 4); 足す(d.アトラクション, 5); 足す(d.ステッカー, 6);
  const body: Record<string, unknown> = { format_id: Number(d.フォーマット), scope_id: Number(d.公開区分), cards };
  if (d.デッキ名 !== undefined) body.deck_name = d.デッキ名;
  if (d.アーキタイプ !== undefined) body.archetype_id = Number(d.アーキタイプ);
  if (d.画像カード !== undefined) body.image_card_id = Number(d.画像カード);
  if (d.キャンペーンタグ !== undefined) body.campaign_tag_ids = d.キャンペーンタグ.map(Number);
  const res = await page.request.post(`${API_BASE_URL}/api/deck`, { data: body, headers: { "jwt-token": token }, failOnStatusCode: false, timeout: 120_000 });
  const 本文 = await res.text();
  const json = 読む(本文);
  const id = json?.deck_id;
  if (res.status() !== 200 || (typeof id !== "number" && typeof id !== "string")) throw new Error(`更新の対象デッキを登録できない（HTTP ${res.status()} ${本文.slice(0, 300)}）`);
  return String(id);
}

/** デッキの一時保存（下書き）を、デッキビルダーの更新の API（PUT /api/deck/{id}）を「即時保存」なしで呼んで作る */
export async function 下書きを作る(page: Page, token: string, デッキID: string, d: { フォーマット: string; 公開区分: string; デッキ名: string }): Promise<void> {
  const body = { format_id: Number(d.フォーマット), scope_id: Number(d.公開区分), deck_name: d.デッキ名, cards: [] };
  const res = await page.request.put(`${API_BASE_URL}/api/deck/${デッキID}`, { data: body, headers: { "jwt-token": token }, failOnStatusCode: false, timeout: 120_000 });
  if (res.status() !== 200) throw new Error(`デッキ ${デッキID} の一時保存（下書き）を作れない（HTTP ${res.status()} ${(await res.text()).slice(0, 300)}）`);
}

/** デッキの取得の API（GET /api/deck/{id}）の応答のデッキ名。一時保存があればその名前が返る（無ければ保存済みのデッキの名前） */
export async function 取得したデッキ名(page: Page, token: string, デッキID: string): Promise<{ ステータス: number; デッキ名: string }> {
  const res = await page.request.get(`${API_BASE_URL}/api/deck/${デッキID}`, { headers: { "jwt-token": token }, failOnStatusCode: false, timeout: 60_000 });
  const j = 読む(await res.text());
  return { ステータス: res.status(), デッキ名: typeof j?.deck_name === "string" ? j.deck_name : "" };
}
