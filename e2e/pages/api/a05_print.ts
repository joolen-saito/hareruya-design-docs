/**
 * A05-01・A05-02・A05-03（注文印刷・店頭注文番号取得の API）を呼んで応答を読む。HTTP のパスはケースの文のものをそのまま使う。
 * ケースの「ブラウザで開く／開発者ツールの Network で確かめる」は、ページで開いた応答（状態・本文・種類）をそのまま読む。
 * 「開発者ツールから POST する」は、同じブラウザ（同じ Cookie）の要求の機能（page.request）で送る。
 */
import { Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 応答 = { 状態: number; 種類: string; 本文: string; URL: string };

/** パス（先頭の「/」から）をブラウザで開き、応答を読む */
export async function 開く(page: Page, パス: string): Promise<応答> {
  const res = await page.goto(`${BASE_URL}${パス}`, { timeout: 120_000 });
  if (!res) throw new Error(`「${パス}」の応答が無い`);
  return { 状態: res.status(), 種類: res.headers()["content-type"] ?? "", 本文: await res.text(), URL: res.url() };
}

/**
 * パスへ POST する。form は本文（application/x-www-form-urlencoded）、query は URL の問い合わせに付ける値。
 * どちらも省いた値は送らない（「ResponseFile を付けない」「ConnectionType を付けない」）。
 */
export async function 送る(page: Page, パス: string, v: { form?: Record<string, string>; query?: Record<string, string> } = {}): Promise<応答> {
  const q = v.query && Object.keys(v.query).length ? `?${new URLSearchParams(v.query).toString()}` : "";
  const res = await page.request.post(`${BASE_URL}${パス}${q}`, { form: v.form ?? {}, timeout: 120_000, maxRedirects: 0, failOnStatusCode: false });
  return { 状態: res.status(), 種類: res.headers()["content-type"] ?? "", 本文: await res.text(), URL: res.url() };
}

export type 印刷結果 = { printjobid: string; success: boolean; code?: string };

/** 設計書の PrintResponseInfo の形（リクエストパラメータサンプル）の印刷結果の XML を組み立てる */
export function 印刷結果のXML(結果: 印刷結果[], 全体の成功 = true): string {
  const eposs = 結果.map((r) => [
    "<ePOSPrint>",
    "<Parameter>", "<devid>local_printer</devid>", `<printjobid>${r.printjobid}</printjobid>`, "</Parameter>",
    "<PrintResponse>",
    `<response xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print" success="${r.success ? "true" : "false"}" code="${r.code ?? ""}" status="${r.success ? "251854870" : "1"}" battery="0"/>`,
    "</PrintResponse>",
    "</ePOSPrint>",
  ].join("")).join("");
  return `<?xml version="1.0" encoding="utf-8"?><PrintResponseInfo Version="3.00"><ServerDirectPrint><Response Success="${全体の成功 ? "true" : "false"}"/></ServerDirectPrint>${eposs}</PrintResponseInfo>`;
}

/** 応答の本文が JSON の配列なら、その要素（そうでなければ null） */
export function JSONの配列(r: 応答): unknown[] | null {
  try {
    const v = JSON.parse(r.本文) as unknown;
    return Array.isArray(v) ? v : null;
  } catch { return null; }
}
