/** 棚番号のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { count, query } from "../lib/db";

export type 保存された棚番号 = { 棚番号ID: string; 名称: string; 並び順: string };

const SELECT = `select id as "棚番号ID", name as "名称", sort_no as "並び順" from dtb_shelf_number`;

function toShelf(r: Record<string, string | null>): 保存された棚番号 {
  return { 棚番号ID: r.棚番号ID ?? "", 名称: r.名称 ?? "", 並び順: r.並び順 ?? "" };
}

/** 棚番号IDの棚番号。無ければ null */
export function 棚番号(棚番号ID: string): 保存された棚番号 | null {
  const rows = query(`${SELECT} where id = $1`, [棚番号ID]);
  return rows.length ? toShelf(rows[0]) : null;
}

/** 名称が一致する棚番号（棚番号IDの順） */
export function 名称の棚番号(名称: string): 保存された棚番号[] {
  return query(`${SELECT} where name = $1 order by id`, [名称]).map(toShelf);
}

/** すべての棚番号（棚番号IDの順） */
export function すべての棚番号(): 保存された棚番号[] {
  return query(`${SELECT} order by id`).map(toShelf);
}

/** 棚番号の全件数 */
export function 棚番号の件数(): number {
  return count("select id from dtb_shelf_number");
}

/** 棚番号を使っている商品規格の件数 */
export function 棚番号を使う商品規格の件数(棚番号ID: string): number {
  return count("select id from dtb_product_class where shelf_number_id = $1", [棚番号ID]);
}
