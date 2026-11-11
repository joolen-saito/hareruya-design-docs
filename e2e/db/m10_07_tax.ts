/** 税率設定のDB確認（参照だけ）。共通税率＝商品にも商品規格にも紐づかない税率。物理名はSQLの中にだけ書く */
import { query } from "../lib/db";

export type 税率 = { id: string; 税率: string; 規則: string; 日時: string };

const SEL = `select t.id::text as id, t.tax_rate::text as "税率", coalesce(m.name, '') as "規則",
  to_char(t.apply_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI') as "日時"
  from dtb_tax_rule t left join mtb_rounding_type m on m.id = t.rounding_type_id`;

export function 税率を読む(id: string): 税率 | null {
  const r = query(`${SEL} where t.id = $1::int`, [id]);
  return r.length ? (r[0] as unknown as 税率) : null;
}
/** 適用日時（日本時間「YYYY-MM-DD HH:MM」）の共通税率 */
export function 日時の共通税率(日時: string): 税率[] {
  return query(`${SEL} where t.product_id is null and t.product_class_id is null and to_char(t.apply_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI') = $1 order by t.id`, [日時]) as unknown as 税率[];
}
export function 共通税率の件数(): number {
  return Number(query(`select count(*) as n from dtb_tax_rule where product_id is null and product_class_id is null`)[0].n);
}
