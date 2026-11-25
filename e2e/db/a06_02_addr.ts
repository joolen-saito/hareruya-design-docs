/**
 * A06-02 の013用。E2E の店頭買取（申込者の姓に実行の印がある行）の住所・国だけを書く（画面の申込は国が日本・住所が固定のため）。
 * 書き込みは db/write_adapter.ts → lib/db_write.ts の窓口（依頼者決定 2026-11-10）。
 */
import { writeTestData } from "./write_adapter";

export function 住所を書く(受注ID: string, 印つきの姓: string, v: { 国名: string; 都道府県名: string | null; 住所1: string; 住所2: string }): void {
  if (!/^\d+$/.test(受注ID)) throw new Error(`番号が数字でない（${受注ID}）`);
  const n = writeTestData({
    理由: `A06-02: 店頭買取 ${受注ID} の国・住所を書く（画面の申込は国が日本・住所が固定）`,
    sql: "update dtb_otc_buy_order set country_id = (select m.id from mtb_country m where m.name = $2::text limit 1), " +
      "pref_id = (select p.id from mtb_pref p where p.name = $3::text limit 1), addr01 = $4::text, addr02 = $5::text, addr03 = null where id = $1::int",
    params: [受注ID, v.国名, v.都道府県名 ?? "", v.住所1, v.住所2], 対象の確かめ: "select o.id, o.last_name from dtb_otc_buy_order o where o.id = $1::int", 確かめのparams: [受注ID], 印: 印つきの姓, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`店頭買取 ${受注ID} に書いた行が ${n} 行`);
}
