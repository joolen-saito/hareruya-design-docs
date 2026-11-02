/**
 * M05-01 受注情報検索 一覧の検索パターン（検索条件保存）の照会（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 受注一覧の検索パターンは、画面の種類「受注一覧」として保存される。
 */
import { query, Row } from "../lib/db";

/** 受注一覧の検索パターンのうち、名前が一致するもの。保存の中身は、アプリが保存した形の文字列のまま返す */
export function 受注一覧の検索パターン(名前: string): Row[] {
  return query(
    `select sp.id as "検索パターンID", sp.name as 名前, convert_from(sp.pattern, 'UTF8') as 保存の中身,
            (sp.display_key = 'order') as 受注一覧用
       from dtb_search_pattern sp
      where sp.display_key = 'order' and sp.name = $1
      order by sp.id`, [名前]);
}

/** 検索パターンIDの検索パターン（画面の種類を問わない。あれば1行） */
export function 検索パターンの有無(検索パターンID: string): number {
  return query(`select sp.id from dtb_search_pattern sp where sp.id = $1::int`, [検索パターンID]).length;
}

/** 保存の中身に、店舗の選択（検索条件の店舗）が含まれるか */
export function 店舗の選択を含むか(保存の中身: string | null): boolean {
  return /s:7:"tenants"/.test(保存の中身 ?? "");
}

/** 保存の中身に、文字列の値が含まれるか */
export function 値を含むか(保存の中身: string | null, 値: string): boolean {
  return (保存の中身 ?? "").includes(`"${値}"`);
}

/** 受注一覧の検索パターンのうち、保存の中身に文字列の値を含むもの */
export function 条件に値を含む検索パターン(値: string): Row[] {
  return query(
    `select sp.id as "検索パターンID", sp.name as 名前
       from dtb_search_pattern sp
      where sp.display_key = 'order' and position($1 in convert_from(sp.pattern, 'UTF8')) > 0
      order by sp.id`, [値]);
}
