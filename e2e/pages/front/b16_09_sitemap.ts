/**
 * B16-09 サイトマップ生成処理（2026-11-21 に書いたケース）のフロントの読み取り。サイトマップの XML はブラウザでアドレスを開いて読む。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

export type サイトマップ = { パス: string; ステータス: number; 種類: string; 本文: string; 掲載: string[] };

/** サイトマップのアドレスをブラウザで開き、掲載の URL（loc）を上から順に読む */
export async function サイトマップを開く(page: Page, パス: string, 注記 = true): Promise<サイトマップ> {
  const url = パス.startsWith("http") ? パス : `${BASE_URL}${パス}`;
  const res = await page.goto(url, { timeout: 180_000 });
  if (!res) throw new Error(`${パス} の応答が無い`);
  const 本文 = await res.text();
  const 掲載 = [...本文.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const 種類 = res.headers()["content-type"] ?? "";
  const p = new URL(url).pathname;
  if (注記) note(`開いたアドレス: ${p}・応答: HTTP ${res.status()}・応答の種類: ${種類}・掲載 ${掲載.length}件`);
  return { パス: p, ステータス: res.status(), 種類, 本文, 掲載 };
}

/** サイトマップの XML で応答されたか（応答 200・種類が XML・本文が urlset か sitemapindex） */
export const XMLで応答 = (s: サイトマップ): boolean =>
  s.ステータス === 200 && /xml/i.test(s.種類) && /<(urlset|sitemapindex)\b/.test(s.本文);

export type 案内の種類 = "ページ" | "カテゴリ" | "商品" | "買取商品" | "デッキ一覧" | "デッキ詳細" | "そのほか";
/** 索引の案内の URL から種類を決める */
export function 案内の種類(loc: string): 案内の種類 {
  const f = new URL(loc).pathname.split("/").pop() ?? "";
  if (f === "sitemap_page.xml") return "ページ";
  if (f === "sitemap_category.xml") return "カテゴリ";
  if (/^sitemap_product_\d+\.xml$/.test(f)) return "商品";
  if (/^sitemap_purchase_\d+\.xml$/.test(f)) return "買取商品";
  if (f === "sitemap_deck.xml") return "デッキ一覧";
  if (/^sitemap_deck_show_\d+\.xml$/.test(f)) return "デッキ詳細";
  return "そのほか";
}

/** 索引の案内のうち、その種類のものを上から順に返す */
export const 案内 = (索引: サイトマップ, 種類: 案内の種類): string[] => 索引.掲載.filter((l) => 案内の種類(l) === 種類);

/** URL のパスの末尾の部分（末尾の / はならす） */
export const 末尾 = (loc: string): string => new URL(loc).pathname.replace(/\/+$/, "").split("/").pop() ?? "";

/** URL のパスの部分に、その値の部分があるか（/deck/123/ の 123 など） */
export const 部分を含む = (loc: string, 値: string): boolean => new URL(loc).pathname.split("/").includes(値);

/** 案内のサイトマップを上から順に開き、条件に合う掲載を集める。見つけたら止める（止める=true）か、全部開く */
export async function 案内を順に開いて探す(page: Page, 案内のURL: string[], 合う: (loc: string) => boolean, 止める: boolean): Promise<{ 掲載: string[]; 開いた数: number; 応答: number[] }> {
  const 掲載: string[] = []; const 応答: number[] = []; let 開いた数 = 0;
  for (const u of 案内のURL) {
    const s = await サイトマップを開く(page, u, false);
    開いた数++; 応答.push(s.ステータス);
    掲載.push(...s.掲載.filter(合う));
    if (止める && 掲載.length) break;
  }
  note(`案内のサイトマップ ${案内のURL.length}件のうち ${開いた数}件を案内の順に開いた（応答: ${[...new Set(応答)].map((c) => `HTTP ${c}`).join("・")}）。条件に合う掲載: ${掲載.length}件${掲載.length ? `（${掲載.slice(0, 3).map((l) => new URL(l).pathname).join("・")}）` : ""}`);
  return { 掲載, 開いた数, 応答 };
}
