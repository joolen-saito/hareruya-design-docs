/** 支払方法のDB確認（参照だけ）。物理名はSQLの中にだけ書く */
import { query } from "../lib/db";

export type 保存された支払方法 = { 手数料: string | null; 下限: string | null; 上限: string | null; 表示順: string | null };

export function 支払方法を読む(名称: string): 保存された支払方法 {
  const r = query(`select charge as "手数料", rule_min as "下限", rule_max as "上限", sort_no as "表示順"
    from dtb_payment where payment_method = $1 order by id desc limit 1`, [名称]);
  if (r.length !== 1) throw new Error(`支払方法「${名称}」が見つからない`);
  return r[0] as 保存された支払方法;
}
