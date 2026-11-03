/** M09-07 ブロック管理の保存結果の照会（参照だけ）。SQL はここにだけ書く */
import { query } from "../lib/db";

export type ブロック行 = { ブロックID: string; ブロック名: string | null; ファイル名: string; PC向け: boolean; 削除可: boolean };
const 変換 = (r: Record<string, string | null>): ブロック行 => ({ ブロックID: r.id!, ブロック名: r.name, ファイル名: r.file_name!, PC向け: r.device === "10", 削除可: r.deletable === "true" });
const 列 = "b.id as id, b.block_name as name, b.file_name as file_name, b.device_type_id as device, b.deletable as deletable";

export function ブロックIDで(id: string): ブロック行 | null {
  const r = query(`select ${列} from dtb_block b where b.id = $1`, [id]);
  return r.length ? 変換(r[0]) : null;
}
export function ブロック名で(name: string): ブロック行[] {
  return query(`select ${列} from dtb_block b where b.block_name = $1 order by b.id`, [name]).map(変換);
}
/** ファイル名が同じPC向けブロック */
export function ファイル名のPC向けブロック(file: string): ブロック行[] {
  return query(`select ${列} from dtb_block b where b.file_name = $1 and b.device_type_id = 10 order by b.id`, [file]).map(変換);
}
