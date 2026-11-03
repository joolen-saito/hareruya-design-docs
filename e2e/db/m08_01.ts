/** M08-01 会員検索一覧のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。会員一覧の検索パターンは、画面の種類「会員」として保存される。 */
import { query, Row } from "../lib/db";

/** 会員一覧用の検索パターンのうち、名前が一致するもの。保存の中身は、アプリが保存した形の文字列のまま返す */
export function 会員一覧の検索パターン(名前: string): Row[] {
  return query(
    `select sp.id as "検索パターンID", sp.name as 名前, convert_from(sp.pattern, 'UTF8') as 保存の中身
       from dtb_search_pattern sp
      where sp.display_key = 'customer' and sp.name = $1
      order by sp.id`, [名前]);
}

/** 検索パターンIDの会員一覧用の検索パターン（あれば1行） */
export function 検索パターンID(検索パターンID: string): Row[] {
  return query(
    `select sp.id as "検索パターンID", sp.name as 名前, convert_from(sp.pattern, 'UTF8') as 保存の中身
       from dtb_search_pattern sp
      where sp.display_key = 'customer' and sp.id = $1::int`, [検索パターンID]);
}

export function 会員一覧用の検索パターンの件数(): number {
  return Number(query(`select count(*) as n from dtb_search_pattern where display_key = 'customer'`)[0].n);
}

/** 保存の中身の、文字列の項目の値（保存の形: s:長さ:"項目名";s:長さ:"値";）。無ければ null */
export function 保存の中身の値(保存の中身: string | null, 項目: string): string | null {
  const m = new RegExp(`s:\\d+:"${項目}";s:\\d+:"([\\s\\S]*?)";`).exec(保存の中身 ?? "");
  return m ? m[1] : null;
}

/** 会員の削除フラグ（1＝削除済み）。会員がいなければ null */
export function 会員の削除フラグ(会員ID: string): string | null {
  return query(`select del_flg as v from dtb_customer where id = $1::int`, [会員ID])[0]?.v ?? null;
}

/** 会員一覧用の検索パターンのうち、名前が指定の文字だけの繰り返しのものの名前の長さ（文字数） */
export function 会員一覧の検索パターンの名前の長さ(文字: string): number[] {
  return query(`select length(name) as n from dtb_search_pattern where display_key = 'customer' and name ~ ('^(' || $1 || ')+$') order by id`, [文字]).map((r) => Number(r.n));
}
