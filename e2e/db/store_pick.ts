/** 使い回す店舗の表（lib/store_create_ban.ts）の店舗の、いまの店名のDB確認（参照だけ）。物理名はSQLの中にだけ書く */
import { query } from "../lib/db";

/** 店舗ID → いまの店名（表にある店舗IDだけ） */
export function いまの店名の一覧(ids: string[]): Map<string, string> {
  const r = query(`select id, shop_name from dtb_base_info where id = any(string_to_array($1, ',')::int[])`, [ids.join(",")]);
  return new Map(r.map((x) => [String(x.id), String(x.shop_name ?? "")]));
}

export type 店舗の表示の値 = { id: string; 店名: string; 略称: string; 表示順: number };
/** 店舗IDの、店名・ショップ名略称・表示順（お問い合わせ画面の店舗選択に出る名前と並び順） */
export function 表示の値の一覧(ids: string[]): 店舗の表示の値[] {
  const r = query(`select id, shop_name, short_name_jp, "rank" from dtb_base_info where id = any(string_to_array($1, ',')::int[])`, [ids.join(",")]);
  return r.map((x) => ({ id: String(x.id), 店名: String(x.shop_name ?? ""), 略称: String(x.short_name_jp ?? ""), 表示順: Number(x.rank ?? 0) }));
}
