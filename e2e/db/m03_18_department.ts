/** 部門のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 免税区分は保存された値（0:対象外・1:一般品・2:消耗品） */
export type 保存された部門 = { 部門ID: string; 部門名: string; 部門コード: string; 免税区分: string; MTGBuyer表示フラグ: boolean };

const SELECT = `select id as "部門ID", name as "部門名", code as "部門コード", tax_free_division as "免税区分", visible as "表示" from mtb_section`;

function toDepartment(r: Record<string, string | null>): 保存された部門 {
  return { 部門ID: r.部門ID ?? "", 部門名: r.部門名 ?? "", 部門コード: r.部門コード ?? "", 免税区分: r.免税区分 ?? "", MTGBuyer表示フラグ: r.表示 === "true" };
}

/** 部門IDの部門。無ければ null */
export function 部門(部門ID: string): 保存された部門 | null {
  const rows = query(`${SELECT} where id = $1`, [部門ID]);
  return rows.length ? toDepartment(rows[0]) : null;
}

/** 部門コードが一致する部門（部門IDの順） */
export function 部門コードの部門(部門コード: string): 保存された部門[] {
  return query(`${SELECT} where code = $1 order by id`, [部門コード]).map(toDepartment);
}

/** 部門名が一致する部門（部門IDの順） */
export function 部門名の部門(部門名: string): 保存された部門[] {
  return query(`${SELECT} where name = $1 order by id`, [部門名]).map(toDepartment);
}

/** 部門コードが指定の文字で始まる部門（部門コードの順） */
export function 部門コードが前方一致する部門(先頭: string): 保存された部門[] {
  return query(`${SELECT} where left(code, length($1)) = $1 order by code`, [先頭]).map(toDepartment);
}
