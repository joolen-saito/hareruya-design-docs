/**
 * M04-23 在庫分割結合CSV登録の DB確認（参照だけ）。物理名はここの SQL の中にだけ書く。
 * 基本情報・明細・在庫の読み方は M04-13 の DB確認（db/m04_13_split_join.ts）を使い、ここでは
 * 「店舗で、商品コードが分割元・結合先・分割先・結合元のどれかに出てくる在庫分割結合」を探す照会だけを足す。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { 在庫分割結合, 明細 } from "./m04_13_split_join";

export type 在庫分割結合と明細 = 在庫分割結合 & { 明細: 明細[] };

/**
 * 店舗ID の店舗で、商品コードが基本情報（分割元・結合先）か明細（分割先・結合元）に出てくる在庫分割結合（ID の順）。
 * 種別を渡せば、在庫分割か在庫結合だけにする。
 */
export function 商品コードに関わる在庫分割結合(code: string, storeId: string, kind: "在庫分割" | "在庫結合"): 在庫分割結合と明細[] {
  const ids = query(`
    select distinct sj.id as id
      from dtb_stock_split_join sj
      join dtb_product_stock ps on ps.id = sj.product_stock_id
      join dtb_product_class pc on pc.id = ps.product_class_id
      left join dtb_stock_split_join_detail d on d.stock_split_join_id = sj.id
      left join dtb_product_stock dps on dps.id = d.subject_product_stock_id
      left join dtb_product_class dpc on dpc.id = dps.product_class_id
     where ps.base_info_id = $2::int
       and sj.split_join_type = $3::int
       and (pc.product_code = $1 or dpc.product_code = $1)
     order by sj.id`, [code, storeId, kind === "在庫分割" ? 1 : 2]).map((r) => r.id ?? "");
  return ids.map((id) => {
    const head = 在庫分割結合(id);
    if (!head) throw new Error(`在庫分割結合 ${id} の基本情報を読めない`);
    return { ...head, 明細: 明細(id) };
  });
}

/** 店舗ID の店舗の、商品コード・在庫区分（1=EC-CUBE、2=スマレジ）の在庫数（在庫が無ければ null） */
export function 店舗の在庫数(code: string, storeId: string, location: number): number | null {
  const rows = query(`
    select coalesce(ps.stock, 0)::text as stock
      from dtb_product_stock ps
      join dtb_product_class pc on pc.id = ps.product_class_id
     where pc.product_code = $1 and ps.base_info_id = $2::int and ps.stock_location_id = $3::int`, [code, storeId, location]);
  if (rows.length > 1) throw new Error(`商品コード ${code}・店舗ID ${storeId}・在庫区分 ${location} の在庫が ${rows.length} 件ある`);
  return rows.length ? Number(rows[0].stock) : null;
}

/**
 * シードの準備（依頼者の承認 2026-11-10「印つきデータは何でも」）: E2E が作った実行の印つきの商品の、店舗ID の店舗・在庫区分の
 * 在庫数を書き換える（画面の在庫編集では指定できない値のため）。対象の行は、商品コードが印を含む1行だけ。
 */
export function 印つき商品の在庫数を書き換える(code: string, storeId: string, location: number, stock: number, mark: string, reason: string): number {
  return writeTestData({
    理由: reason,
    sql: `update dtb_product_stock ps set stock = $1::int
            from dtb_product_class pc
           where pc.id = ps.product_class_id and pc.product_code = $2 and ps.base_info_id = $3::int and ps.stock_location_id = $4::int`,
    params: [stock, code, storeId, location],
    対象の確かめ: `select pc.product_code as code
                     from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
                    where pc.product_code = $1 and ps.base_info_id = $2::int and ps.stock_location_id = $3::int`,
    確かめのparams: [code, storeId, location],
    印: mark,
    最大行数: 1,
  });
}
