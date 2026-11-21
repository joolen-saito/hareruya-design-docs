/**
 * A02-02（カードIDからポップアップ用の商品情報を1件取得）の API を、ブラウザで開いて応答を読む。HTTP のパスはここだけに書く。
 * 応答の型と読み取りの関数は A02-01 の部品（pages/api/a02_popup.ts）と同じものを使い、カードID用の開き方だけを足す。
 * ケースの「APIベースURL」は開発環境の EC-CUBE の /api、「EC-CUBEベースURL」は同じ開発環境のアドレス。
 */
import { Page, Request, Response } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import type { 応答 } from "./a02_popup";

export { 値, 項目の名前, 型, 要約 } from "./a02_popup";
export type { 応答 } from "./a02_popup";

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

/** /api/popup/card/{lang}/{カードID}{絞り込み} を開く。絞り込みは「?foil_flg=1&price=high」のように、つなぐ文字ごと渡す（空なら付けない） */
export async function カードIDで開く(page: Page, lang: string, カードID: string, 絞り込み = ""): Promise<応答> {
  return 読む(await page.goto(`${BASE_URL}/api/popup/card/${lang}/${カードID}${絞り込み}`, { timeout: 120_000 }), "カードIDのポップアップ用商品情報API");
}

/** EC-CUBE側の /{ロケール}/goods_api/get_goods?card_id=…&lang=… を開く（ケースの文のとおりの問い合わせ文字列を渡す） */
export async function EC_CUBE側で開く(page: Page, ロケール: string, 問い合わせ: string): Promise<応答> {
  return 読む(await page.goto(`${BASE_URL}/${ロケール}/goods_api/get_goods?${問い合わせ}`, { timeout: 120_000 }), "EC-CUBE側の商品情報API");
}
