/** F06-11 買取履歴一覧のDB確認・参照の照会。物理名はここの SQL にだけ書く（参照だけ） */
import { query } from "../lib/db";

/** 表示件数のマスタの名称（並び順どおり） */
export function 表示件数の選択肢(): string[] {
  return query("select name from mtb_page_max order by sort_no, id").map((r) => String(r.name));
}
