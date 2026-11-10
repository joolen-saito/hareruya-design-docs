/**
 * A17-05 商品名検索API（商品名から商品詳細の情報を取得する）を、ブラウザで開いて応答を読む。HTTP のパスはここだけに書く。
 * ケースの「開発者ツールの Network で応答を確かめる」の代わりに、開いたページの応答（状態・本文の JSON・送った要求の見出し）をそのまま読む。
 */
import { Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 規格 = {
  product_class_id: unknown; product_code: unknown; card_condition_code: unknown; price: unknown; stock: unknown; product_class_images: unknown;
};
export type 商品 = {
  product_id: unknown; product_name: unknown; language_code: unknown; high_price_code: unknown; categories: unknown; region_restriction: unknown;
  product_classes: 規格[];
};
export type 応答 = {
  状態: number;
  種類: string;
  /** 本文を JSON として読めたか */
  JSONか: boolean;
  本文: Record<string, unknown> | null;
  文字: string;
  /** 送った要求の見出し（名前は小文字） */
  送った見出し: Record<string, string>;
  /** 本文の商品の一覧（無ければ空） */
  商品: 商品[];
};

/** 商品名（null なら商品名のクエリを付けない）で開き、応答を読む */
export async function 商品名で開く(page: Page, 商品名: string | null): Promise<応答> {
  const url = `${BASE_URL}/product/search.json${商品名 === null ? "" : `?product=${encodeURIComponent(商品名)}`}`;
  const res = await page.goto(url, { timeout: 120_000 });
  if (!res) throw new Error("商品名検索APIの応答が無い");
  const 文字 = await res.text();
  let 本文: Record<string, unknown> | null = null;
  try { 本文 = JSON.parse(文字) as Record<string, unknown>; } catch { 本文 = null; }
  const products = 本文 && Array.isArray(本文.products) ? (本文.products as 商品[]) : [];
  return {
    状態: res.status(), 種類: res.headers()["content-type"] ?? "", JSONか: 本文 !== null, 本文, 文字,
    送った見出し: await res.request().allHeaders(), 商品: products,
  };
}

/** 商品IDの商品（無ければ undefined） */
export const 商品IDの = (r: 応答, id: string): 商品 | undefined => r.商品.find((p) => p.product_id === Number(id));
/** 商品の規格IDの並び */
export const 規格IDの並び = (p: 商品 | undefined): unknown[] => (p?.product_classes ?? []).map((c) => c.product_class_id);
/** 商品の中の規格IDの規格 */
export const 規格IDの = (p: 商品 | undefined, id: string): 規格 | undefined => (p?.product_classes ?? []).find((c) => c.product_class_id === Number(id));
/** 応答の本文の項目の名前（並びは問わない） */
export const 項目の名前 = (r: 応答): string[] => Object.keys(r.本文 ?? {}).sort();
/** 応答の処理結果コード・メッセージ・件数 */
export const 処理結果 = (r: 応答): { コード: unknown; メッセージ: unknown; 件数: unknown } => ({ コード: r.本文?.code, メッセージ: r.本文?.message, 件数: r.本文?.count });
/** 応答に商品の一覧の項目があるか */
export const 商品の一覧があるか = (r: 応答): boolean => !!r.本文 && Object.prototype.hasOwnProperty.call(r.本文, "products");
/** 値の型の名前（整数・数値・文字列・null・配列・ほか） */
export function 型(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "配列";
  if (typeof v === "number") return Number.isInteger(v) ? "整数" : "数値";
  if (typeof v === "string") return "文字列";
  return typeof v;
}
