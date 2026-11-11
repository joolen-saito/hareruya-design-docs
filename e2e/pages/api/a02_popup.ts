/**
 * A02-01（商品IDからポップアップ用の商品情報を1件取得）・A02-03（旧商品IDから同じ）の API を、ブラウザで開いて応答を読む。HTTP のパスはここだけに書く。
 * ケースの「開発者ツールの Network で応答を確かめる」の代わりに、開いたページの応答（状態・本文の JSON・送った要求）をそのまま読む（A17-05 と同じ）。
 * ケースの「APIベースURL」は、開発環境の EC-CUBE の /api（アプリの経路 /api/popup/...）。
 */
import { Page, Request, Response } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 応答 = {
  状態: number;
  種類: string;
  方法: string;
  /** 本文を JSON として読めたか */
  JSONか: boolean;
  本文: Record<string, unknown> | null;
  文字: string;
  /** 送った要求の見出し（名前は小文字） */
  送った見出し: Record<string, string>;
  URL: string;
};

async function 読む(res: Response | null, what: string): Promise<応答> {
  if (!res) throw new Error(`${what}の応答が無い`);
  const 文字 = await res.text();
  let 本文: Record<string, unknown> | null = null;
  try {
    const v = JSON.parse(文字) as unknown;
    本文 = v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch { 本文 = null; }
  const req: Request = res.request();
  return {
    状態: res.status(), 種類: res.headers()["content-type"] ?? "", 方法: req.method(), JSONか: 本文 !== null, 本文, 文字,
    送った見出し: await req.allHeaders(), URL: res.url(),
  };
}

/** /api/popup/product/{lang}/{商品ID} を開く */
export async function 商品IDで開く(page: Page, lang: string, 商品ID: string): Promise<応答> {
  return 読む(await page.goto(`${BASE_URL}/api/popup/product/${lang}/${商品ID}`, { timeout: 120_000 }), "商品IDのポップアップ用商品情報API");
}

/** /api/popup/old/{lang}/{旧商品ID}（拡張子 .json の有無を選ぶ）を開く */
export async function 旧商品IDで開く(page: Page, lang: string, 旧商品ID: string, json = true): Promise<応答> {
  const url = `${BASE_URL}/api/popup/old/${lang}/${encodeURIComponent(旧商品ID)}${json ? ".json" : ""}`;
  return 読む(await page.goto(url, { timeout: 120_000 }), "旧商品IDのポップアップ用商品情報API");
}

/** 本文の項目の値 */
export const 値 = (r: 応答, 名前: string): unknown => r.本文?.[名前];
/** 本文の項目の名前（並びは問わない） */
export const 項目の名前 = (r: 応答): string[] => Object.keys(r.本文 ?? {}).sort();
/** 値の型の名前（整数・数値・文字列・null・真偽・配列・ほか） */
export function 型(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "配列";
  if (typeof v === "number") return Number.isInteger(v) ? "整数" : "数値";
  if (typeof v === "string") return "文字列";
  if (typeof v === "boolean") return "真偽";
  return typeof v;
}
/** 応答の要約（注記に残す） */
export const 要約 = (r: 応答): string => `状態 ${r.状態}・本文 ${r.文字.length > 1200 ? `${r.文字.slice(0, 1200)}…` : r.文字}`;
