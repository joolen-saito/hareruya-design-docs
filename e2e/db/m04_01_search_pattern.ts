/**
 * M04-01 在庫検索一覧の検索パターン（検索条件保存）の照会（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 検索パターンは、保存した管理者の所属店舗ごとに、画面の種類「在庫一覧」として保存される。
 */
import { query, Row } from "../lib/db";

/**
 * ログインIDの管理者の所属店舗で保存された、在庫一覧の検索パターンのうち、名前が一致するもの。
 * 検索条件（保存の中身）は、アプリが保存した形の文字列のまま返す（読み分けは呼ぶ側）。
 */
export function 在庫一覧の検索パターン(ログインID: string, 名前: string): Row[] {
  return query(
    `select sp.id as "検索パターンID", char_length(sp.name) as 名前の文字数, sp.base_info_id as "店舗ID",
            convert_from(sp.pattern, 'UTF8') as 保存の中身
       from dtb_search_pattern sp
       join dtb_member m on m.base_info_id = sp.base_info_id
      where m.login_id = $1 and sp.display_key = '在庫一覧' and sp.name = $2
      order by sp.id`, [ログインID, 名前]);
}

/** 検索パターンIDの、在庫一覧の検索パターン（あれば1行） */
export function 検索パターン(検索パターンID: string): Row[] {
  return query(
    `select sp.id as "検索パターンID", sp.name as 名前 from dtb_search_pattern sp where sp.id = $1::int and sp.display_key = '在庫一覧'`,
    [検索パターンID]);
}

/** 名前の文字数が一致する、在庫一覧の検索パターンのうち、名前が1種類の文字の繰り返しのもの（全店舗） */
export function 同じ文字の繰り返しの名前の検索パターン(文字: string, 文字数: number): Row[] {
  return query(
    `select sp.id as "検索パターンID", sp.base_info_id as "店舗ID"
       from dtb_search_pattern sp
      where sp.display_key = '在庫一覧' and sp.name = repeat($1, $2::int)
      order by sp.id`, [文字, 文字数]);
}
