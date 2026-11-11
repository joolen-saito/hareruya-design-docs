/**
 * M04-23 在庫分割結合CSV登録の DB確認（参照だけ）。物理名はここの SQL の中にだけ書く。
 * 店舗は店名でなく店舗ID で引く（開発環境には同じ店名の店舗がありうる）。数量は数（Number）にして返す。
 */
import { query } from "../lib/db";

export type 分割結合の行 = {
  ID: string; 処理タイプ: string; ステータス: string; 商品コード: string; 商品名: string; 店舗ID: string; 在庫区分番号: number;
  分割結合数: number;
};

const HEAD = `
  select sj.id::text as id,
         case sj.split_join_type when 1 then '在庫分割' when 2 then '在庫結合' else sj.split_join_type::text end as kind,
         st.name as status, pc.product_code as code, p.name as pname, ps.base_info_id::text as store,
         ps.stock_location_id::text as loc, sj.split_join_quantity::text as qty
    from dtb_stock_split_join sj
    join mtb_stock_split_join_status st on st.id = sj.stock_split_join_status_id
    join dtb_product_stock ps on ps.id = sj.product_stock_id
    join dtb_product_class pc on pc.id = ps.product_class_id
    join dtb_product p on p.id = pc.product_id`;

const toRow = (r: Record<string, string | null>): 分割結合の行 => ({
  ID: r.id ?? "", 処理タイプ: r.kind ?? "", ステータス: r.status ?? "", 商品コード: r.code ?? "", 商品名: r.pname ?? "",
  店舗ID: r.store ?? "", 在庫区分番号: Number(r.loc), 分割結合数: Number(r.qty),
});

/** 分割元・結合先が、店舗ID の店舗の商品コードの在庫である在庫分割結合（ID の順） */
export function 店舗の在庫分割結合(商品コード: string, 店舗ID: string, kind: "在庫分割" | "在庫結合"): 分割結合の行[] {
  return query(`${HEAD} where pc.product_code = $1 and ps.base_info_id = $2::int and sj.split_join_type = $3::int order by sj.id`,
    [商品コード, 店舗ID, kind === "在庫分割" ? 1 : 2]).map(toRow);
}

/** 店舗ID の店舗で、分割元・結合先または分割先・結合元に商品コードが出てくる在庫分割結合の件数（店舗を問わないときは 店舗ID を空にする） */
export function 商品コードが出てくる在庫分割結合の件数(商品コード: string, kind: "在庫分割" | "在庫結合", 店舗ID = ""): number {
  const rows = query(`
    select count(distinct sj.id)::text as n
      from dtb_stock_split_join sj
      join dtb_product_stock hs on hs.id = sj.product_stock_id
      join dtb_product_class hpc on hpc.id = hs.product_class_id
      left join dtb_stock_split_join_detail d on d.stock_split_join_id = sj.id
      left join dtb_product_stock ds on ds.id = d.subject_product_stock_id
      left join dtb_product_class dpc on dpc.id = ds.product_class_id
     where sj.split_join_type = $2::int
       and ($1 = hpc.product_code or $1 = dpc.product_code)
       and ($3 = '' or hs.base_info_id = nullif($3, '')::int)`, [商品コード, kind === "在庫分割" ? 1 : 2, 店舗ID]);
  return Number(rows[0]?.n ?? 0);
}

export type 明細の行 = { 商品コード: string; 店舗ID: string; 在庫区分番号: number; 数量: number };

/** 在庫分割結合の明細（分割先・結合元）。明細IDの順。数量は分割先在庫数・結合元在庫数 */
export function 在庫分割結合の明細(id: string): 明細の行[] {
  return query(`
    select pc.product_code as code, ps.base_info_id::text as store, ps.stock_location_id::text as loc, d.split_join_quantity::text as qty
      from dtb_stock_split_join_detail d
      join dtb_product_stock ps on ps.id = d.subject_product_stock_id
      join dtb_product_class pc on pc.id = ps.product_class_id
     where d.stock_split_join_id = $1::int
     order by d.id`, [id]).map((r) => ({ 商品コード: r.code ?? "", 店舗ID: r.store ?? "", 在庫区分番号: Number(r.loc), 数量: Number(r.qty) }));
}

/** 店舗ID・在庫区分（1=EC-CUBE、2=スマレジ）の、商品コードの在庫数（在庫の行が無ければ null。複数あれば落とす） */
export function 店舗の在庫数(商品コード: string, 店舗ID: string, 在庫区分番号: 1 | 2): number | null {
  const rows = query(`
    select coalesce(ps.stock, 0)::text as stock
      from dtb_product_stock ps
      join dtb_product_class pc on pc.id = ps.product_class_id
     where pc.product_code = $1 and ps.base_info_id = $2::int and ps.stock_location_id = $3::int`, [商品コード, 店舗ID, 在庫区分番号]);
  if (rows.length > 1) throw new Error(`商品コード ${商品コード}・店舗ID ${店舗ID}・在庫区分 ${在庫区分番号} の在庫が ${rows.length} 件ある`);
  return rows.length ? Number(rows[0].stock) : null;
}

/** 商品コードの商品規格の件数（「その商品コードの商品は存在しない」を確かめる） */
export function 商品コードの規格の件数(商品コード: string): number {
  return Number(query(`select count(*)::text as n from dtb_product_class pc where pc.product_code = $1`, [商品コード])[0]?.n ?? 0);
}

/** 店舗ID の店舗があるか（「店舗ID 999999 は存在しない」を確かめる） */
export function 店舗がある(店舗ID: string): boolean {
  return Number(query(`select count(*)::text as n from dtb_base_info b where b.id = $1::int`, [店舗ID])[0]?.n ?? 0) > 0;
}

/** いまの在庫分割結合IDの最大（操作の前に読み、操作で増えた行を見分ける） */
export function 在庫分割結合の最大ID(): number {
  return Number(query(`select coalesce(max(sj.id), 0)::text as n from dtb_stock_split_join sj`)[0]?.n ?? 0);
}
