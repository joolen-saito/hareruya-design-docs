/** M04-29 在庫移動実績 インポートの DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** 指定の範囲の番号の在庫移動指示のうち、存在するもの（存在しないことの確かめ） */
export function 範囲内に存在する在庫移動指示(最小: number, 最大: number): string[] {
  return query(`select id::text as i from dtb_stock_move_instruction where id between $1::int and $2::int order by id`, [最小, 最大]).map((r) => r.i ?? "");
}
