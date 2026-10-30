/** F03-07 入荷時通知のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 会員IDに対応するプレイヤーID（無ければ null） */
export function プレイヤーID(会員ID: string): string | null {
  return query(`select id from dtb_player where customer_id = $1 and deleted_at is null order by id limit 1`, [会員ID])[0]?.id ?? null;
}

/** 会員の有効な入荷通知依頼（削除日時が空のもの）の件数 */
export function 有効な依頼件数(会員ID: string): number {
  return Number(query(
    `select count(*) as n from dtb_product_request r join dtb_player p on p.id = r.player_id
      where p.customer_id = $1 and r.deleted_at is null`, [会員ID])[0].n);
}

/** 会員と商品規格を対応付けた入荷通知依頼の件数。有効（削除日時が空）と、削除日時が設定されたものを分けて返す */
export function 規格の依頼件数(会員ID: string, 商品規格ID: string): { 有効: number; 削除済み: number } {
  const r = query(
    `select count(*) filter (where r.deleted_at is null) as active, count(*) filter (where r.deleted_at is not null) as removed
       from dtb_product_request r join dtb_player p on p.id = r.player_id
      where p.customer_id = $1 and r.product_class_id = $2`, [会員ID, 商品規格ID])[0];
  return { 有効: Number(r.active), 削除済み: Number(r.removed) };
}

/** 会員と商品（商品・言語単位）を対応付けた入荷通知依頼の件数（規格を指さない依頼） */
export function 商品単位の依頼件数(会員ID: string, 商品ID: string): { 有効: number; 削除済み: number } {
  const r = query(
    `select count(*) filter (where r.deleted_at is null) as active, count(*) filter (where r.deleted_at is not null) as removed
       from dtb_product_request r join dtb_player p on p.id = r.player_id
      where p.customer_id = $1 and r.product_id = $2 and r.product_class_id is null`, [会員ID, 商品ID])[0];
  return { 有効: Number(r.active), 削除済み: Number(r.removed) };
}

/** 会員と商品に結びつく入荷通知依頼（規格単位・商品単位とも）の有効な件数。商品IDは商品、規格IDは規格が属する商品の判定に使う */
export function 商品に属する有効な依頼件数(会員ID: string, 商品ID: string): number {
  return Number(query(
    `select count(*) as n from dtb_product_request r join dtb_player p on p.id = r.player_id
      left join dtb_product_class pc on pc.id = r.product_class_id
      where p.customer_id = $1 and r.deleted_at is null and coalesce(pc.product_id, r.product_id) = $2`, [会員ID, 商品ID])[0].n);
}

/** 会員と商品規格の有効な依頼のID（最新の1件）。無ければ null */
export function 規格の依頼ID(会員ID: string, 商品規格ID: string): string | null {
  return query(
    `select r.id from dtb_product_request r join dtb_player p on p.id = r.player_id
      where p.customer_id = $1 and r.product_class_id = $2 and r.deleted_at is null order by r.id desc limit 1`, [会員ID, 商品規格ID])[0]?.id ?? null;
}

/** 会員と商品（商品・言語単位）の有効な依頼のID（最新の1件）。無ければ null */
export function 商品単位の依頼ID(会員ID: string, 商品ID: string): string | null {
  return query(
    `select r.id from dtb_product_request r join dtb_player p on p.id = r.player_id
      where p.customer_id = $1 and r.product_id = $2 and r.product_class_id is null and r.deleted_at is null order by r.id desc limit 1`, [会員ID, 商品ID])[0]?.id ?? null;
}
