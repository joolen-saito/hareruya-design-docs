/** カスタムCSV出力定義のDB確認（参照だけ）。物理名はSQLの中にだけ書く */
import { query } from "../lib/db";

export type 定義の状態 = { 定義の行数: number; 削除済みの行数: number; 出力項目の関連数: number };

/** 名称で定義を探し、削除されていない行・削除済みの行・出力項目の関連の数を返す（名称は実行の印つきで一意） */
export function 定義の状態を読む(名称: string): 定義の状態 {
  const r = query(`select count(*) filter (where e.deleted_at is null) as "生", count(*) filter (where e.deleted_at is not null) as "削除済み",
    coalesce(sum((select count(*) from dtb_csv_csv_extension x where x.csv_extension_id = e.id)), 0) as "関連"
    from dtb_csv_extension e where e.name = $1`, [名称]);
  return { 定義の行数: Number(r[0].生), 削除済みの行数: Number(r[0].削除済み), 出力項目の関連数: Number(r[0].関連) };
}
