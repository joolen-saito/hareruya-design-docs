/**
 * M04-01 在庫検索/一覧の続き（-x）の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。呼ぶ側には業務の言葉の関数名で見せる。
 * - 店舗別在庫: 商品規格を登録すると、開いている全店舗×在庫区分（EC-CUBE・スマレジ）の在庫が在庫0で自動で作られ、画面からは消せない。
 *   シード表が「対象以外の店舗別在庫は DB で削除する」と定めるものを、E2E の商品（実行の印つきの商品コード）の行に限って消す。
 * - 棚番号: 名前の入力チェック（英大文字-数字3桁）を通らない「A-01」は画面で入れられないので、画面で作った E2E の棚番号の名前だけを書き換える。
 */
import { query } from "../lib/db";
import { deleteOwnRows, Owner, updateOwnRows } from "../lib/db_write";

/** 在庫区分（店舗別在庫の在庫区分の番号） */
export const 在庫区分の番号 = { "EC-CUBE": 1, スマレジ: 2 } as const;
export type 在庫区分 = keyof typeof 在庫区分の番号;

/** 商品コード（実行の印つき）が当たる店舗別在庫 */
function 店舗別在庫の持ち主(商品コード: string[]): Owner {
  return {
    sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code = any(string_to_array($1, ','))`,
    params: [商品コード.join(",")],
  };
}

/** 商品コードの店舗別在庫の行（店舗ID・在庫区分の番号・在庫） */
export function 店舗別在庫の行(商品コード: string[]): { id: string; 商品コード: string; 店舗ID: string; 在庫区分: number; 在庫: number }[] {
  return query(
    `select ps.id, pc.product_code, ps.base_info_id, ps.stock_location_id, coalesce(ps.stock, 0) as stock
       from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = any(string_to_array($1, ',')) order by ps.id`,
    [商品コード.join(",")],
  ).map((r) => ({ id: String(r.id), 商品コード: String(r.product_code), 店舗ID: String(r.base_info_id), 在庫区分: Number(r.stock_location_id), 在庫: Number(r.stock) }));
}

/**
 * 商品コード（実行の印つき）の店舗別在庫のうち、残す組（商品コード・店舗ID・在庫区分）以外を消す。消した件数を返す。
 * 画面で作った E2E の商品の、自動で作られた行だけに当たる（持ち主の確かめ）。
 */
export function 対象以外の店舗別在庫を消す(what: string, 商品コード: string[], 残す: { 商品コード: string; 店舗ID: string; 在庫区分: 在庫区分 }[]): number {
  const keep = new Set(残す.map((k) => `${k.商品コード}|${k.店舗ID}|${在庫区分の番号[k.在庫区分]}`));
  const ids = 店舗別在庫の行(商品コード).filter((r) => !keep.has(`${r.商品コード}|${r.店舗ID}|${r.在庫区分}`)).map((r) => r.id);
  if (ids.length === 0) return 0;
  // 1回の命令が大きくなりすぎないよう、200件ずつ消す
  for (let i = 0; i < ids.length; i += 200) {
    deleteOwnRows(what, { table: "dtb_product_stock", key: "id", ids: ids.slice(i, i + 200), owner: 店舗別在庫の持ち主(商品コード) });
  }
  return ids.length;
}

/** 棚番号の名前を書き換える（画面で作ったときの名前と番号の両方が当たる行だけ） */
export function 棚番号の名前を書き換える(what: string, 棚番号ID: string, 作ったときの名前: string, 新しい名前: string): void {
  updateOwnRows(what, {
    table: "dtb_shelf_number", key: "id", ids: [棚番号ID], set: { name: 新しい名前 },
    owner: { sql: `select id from dtb_shelf_number where id = $1::int and name in ($2, $3)`, params: [棚番号ID, 作ったときの名前, 新しい名前] },
  });
}

/** 棚番号の名前が使われているか */
export function 棚番号の名前がある(名前: string): boolean {
  return query(`select id from dtb_shelf_number where name = $1`, [名前]).length > 0;
}

/** 部門コードが使われているか */
export function 部門コードがある(部門コード: string): boolean {
  return query(`select id from mtb_section where code = $1`, [部門コード]).length > 0;
}

/** 表示件数の選択肢（マスタデータ管理の最大ページ表示）の名前。並び順 */
export function 表示件数の選択肢(): string[] {
  return query(`select name from mtb_page_max order by sort_no, id`).map((r) => String(r.name));
}

/** 店舗IDの店名 */
export function 店名(店舗ID: string): string {
  return String(query(`select shop_name from dtb_base_info where id = $1::int`, [店舗ID])[0]?.shop_name ?? "");
}

/** 店名略称（3文字）が使われているか */
export function 店名略称がある(略称: string): boolean {
  return query(`select id from dtb_base_info where shop_digit = $1`, [略称]).length > 0;
}
