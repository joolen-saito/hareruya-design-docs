/**
 * M03-04 グッズ商品CSV出力の続き（-x）の照会と、E2E が作った商品の行への書き足し（lib/db_write.ts を通す）。
 * 物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** E2E が作った商品（その商品の規格の商品コードに、この実行の印を含む） */
const 商品の持ち主 = { sql: `select distinct product_id from dtb_product_class where product_code like '%' || $1 || '%'`, params: [RUN_MARK] };

/** 商品公開ステータスのマスタの「廃止」のID */
export function 廃止のID(): string {
  const r = query(`select id::text as i from mtb_product_status where name = '廃止'`);
  if (r.length !== 1) throw new Error(`商品公開ステータスのマスタに「廃止」が ${r.length} 件`);
  return r[0].i ?? "";
}

/** 商品の商品公開ステータスのID */
export function 商品公開ステータスのID(商品ID: string): string {
  return query(`select coalesce(product_status_id::text, '') as s from dtb_product where id = $1::int`, [商品ID])[0]?.s ?? "";
}

/** E2E が作った商品の商品公開ステータスを「廃止」にする（画面では廃止を指定できない） */
export function 廃止にする(what: string, 商品ID: string): void {
  updateOwnRows(what, { table: "dtb_product", key: "id", ids: [商品ID], set: { product_status_id: 廃止のID() }, owner: 商品の持ち主 });
}

/** 商品IDの商品があるか（999999012 などが未登録であることの確かめ） */
export function 商品があるか(商品ID: string): boolean {
  return query(`select id::text as i from dtb_product where id = $1::int`, [商品ID]).length > 0;
}
