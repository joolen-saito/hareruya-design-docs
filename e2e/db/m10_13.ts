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

export type 定義の内容 = { 件数: number; 名称: string | null; 種別: string | null; 更新者: string | null };

/** 定義IDまたは名称で、削除されていない定義を読む（IDを渡したら名称は問わない）。無ければ件数0 */
export function 定義を読む(キー: { id: string } | { 名称: string }): 定義の内容 {
  const where = "id" in キー ? "e.id = $1::int" : "e.name = $1";
  const v = "id" in キー ? キー.id : キー.名称;
  const rows = query(`select e.name as "名称", t.name as "種別", m.name as "更新者"
    from dtb_csv_extension e left join mtb_csv_type t on t.id = e.csv_type_id left join dtb_member m on m.id = e.member_id
    where ${where} and e.deleted_at is null`, [v]);
  if (rows.length === 0) return { 件数: 0, 名称: null, 種別: null, 更新者: null };
  return { 件数: rows.length, 名称: rows[0].名称, 種別: rows[0].種別, 更新者: rows[0].更新者 };
}

/** 定義の出力項目の関連を、並び順どおりに画面の項目名で返す（定義IDまたは名称で指定） */
export function 定義の出力項目(キー: { id: string } | { 名称: string }): string[] {
  const where = "id" in キー ? "x.csv_extension_id = $1::int" : "e.name = $1 and e.deleted_at is null";
  const v = "id" in キー ? キー.id : キー.名称;
  return query(`select c.disp_name as "項目" from dtb_csv_csv_extension x join dtb_csv c on c.id = x.csv_id
    join dtb_csv_extension e on e.id = x.csv_extension_id where ${where} order by x."rank"`, [v]).map((r) => r.項目 ?? "");
}

/** CSV種別の出力項目そのものの状態（ID・表示名・有効・並び順）を、項目ごとの1行の文字列で返す。関連の変更で変わらないことの確認用 */
export function 出力項目の属性(csvTypeId: string): string[] {
  return query(`select c.id::text || ':' || c.disp_name || ':' || c.enabled::text || ':' || c.sort_no::text as "行"
    from dtb_csv c where c.csv_type_id = $1::int order by c.id`, [csvTypeId]).map((r) => r.行 ?? "");
}

/** CSV種別の出力項目のうち、無効（出力の対象外）の項目名 */
export function 無効な出力項目名(csvTypeId: string): string[] {
  return query(`select distinct c.disp_name as "項目" from dtb_csv c where c.csv_type_id = $1::int and c.enabled = false`, [csvTypeId]).map((r) => r.項目 ?? "");
}

/** 商品コードの商品の商品ID（シードが画面で作った商品の番号を控えるための参照） */
export function 商品IDを読む(商品コード: string): string {
  const rows = query(`select distinct pc.product_id::text as "id" from dtb_product_class pc where pc.product_code = $1`, [商品コード]);
  if (rows.length !== 1) throw new Error(`商品コード ${商品コード} の商品が ${rows.length} 件（1件のはず）`);
  return rows[0].id ?? "";
}
