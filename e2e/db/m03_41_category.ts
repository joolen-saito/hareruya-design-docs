/**
 * M03-41 カテゴリCSV登録のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 *
 * カテゴリの表には「削除済みの印」の列が無い（2026-10-20 に手元のDBの表の定義を参照して確認）。
 * そのため、カテゴリが削除済みかどうかは、行が残っているかで見る（行が無い＝削除済み）。
 */
import { query } from "../lib/db";

/** カテゴリの行の全項目（業務の言葉の名前に置き換えたもの）。値は文字列（真偽は "true"/"false"、空は null） */
export type カテゴリの保存内容 = {
  カテゴリID: string;
  親カテゴリID: string | null;
  作成者: string | null;
  名称: string;
  階層: string;
  表示順: string;
  作成日時: string;
  更新日時: string;
  英名: string | null;
  一覧表示: string | null;
  優先表示商品: string | null;
  フロント非表示: string | null;
  支店非表示: string | null;
  バナー画像パス: string | null;
  アイコン画像パス: string | null;
  埋め込みHTML日: string | null;
  埋め込みHTML英: string | null;
  検索パラメータ: string | null;
  フリーエリア日: string | null;
  フリーエリア英: string | null;
};

const SELECT = `select id as "カテゴリID", parent_category_id as "親カテゴリID", creator_id as "作成者",
  category_name as "名称", hierarchy as "階層", sort_no as "表示順", create_date as "作成日時", update_date as "更新日時",
  category_name_en as "英名", display_flg as "一覧表示", priority_products as "優先表示商品",
  front_search_hide_flg as "フロント非表示", branch_hide_flg as "支店非表示",
  banner_image as "バナー画像パス", icon_image as "アイコン画像パス", html_ja as "埋め込みHTML日", html_en as "埋め込みHTML英",
  search_parameters as "検索パラメータ", free_area_jp as "フリーエリア日", free_area_en as "フリーエリア英"
  from dtb_category`;

const as = (r: Record<string, string | null>) => r as unknown as カテゴリの保存内容;

/** カテゴリIDのカテゴリ。行が無ければ null（削除済み） */
export function カテゴリの保存内容(カテゴリID: string): カテゴリの保存内容 | null {
  const rows = query(`${SELECT} where id = $1`, [カテゴリID]);
  return rows.length ? as(rows[0]) : null;
}

/** カテゴリ名(日)が一致するカテゴリ（カテゴリIDの順） */
export function 名称のカテゴリ(名称: string): カテゴリの保存内容[] {
  return query(`${SELECT} where category_name = $1 order by id`, [名称]).map(as);
}

/** カテゴリ名(英)が一致するカテゴリ（カテゴリIDの順） */
export function 英名のカテゴリ(英名: string): カテゴリの保存内容[] {
  return query(`${SELECT} where category_name_en = $1 order by id`, [英名]).map(as);
}

/** 親カテゴリの直下で、カテゴリ名(日)が一致するカテゴリ（カテゴリIDの順） */
export function 親の下の名称のカテゴリ(親カテゴリID: string, 名称: string): カテゴリの保存内容[] {
  return query(`${SELECT} where parent_category_id = $1 and category_name = $2 order by id`, [親カテゴリID, 名称]).map(as);
}

/** カテゴリ名(日)またはカテゴリ名(英)が一致するカテゴリ（カテゴリIDの順） */
export function 名称か英名が一致するカテゴリ(名前: string): カテゴリの保存内容[] {
  return query(`${SELECT} where category_name = $1 or category_name_en = $1 order by id`, [名前]).map(as);
}
