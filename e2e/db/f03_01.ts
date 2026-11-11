/** F03-01 商品一覧のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 会員（メールアドレスで特定）と商品と言語（JP・EN）を対応付けたお気に入りの件数 */
export function お気に入りの件数(メール: string, 商品ID: string, 言語: string): number {
  return Number(query(
    `select count(*) as n from dtb_favorite_product f
       join dtb_player p on p.id = f.player_id
       join dtb_customer c on c.id = p.customer_id
       join mtb_language l on l.id = f.language_id
      where c.email = $1 and f.product_id = $2 and l.code = $3`, [メール, 商品ID, 言語])[0].n);
}

/** 会員（メールアドレスで特定）と商品規格の、有効な（削除日時が空の）入荷通知依頼の件数 */
export function 有効な入荷通知依頼の件数(メール: string, 商品規格ID: string): number {
  return Number(query(
    `select count(*) as n from dtb_product_request r
       join dtb_player p on p.id = r.player_id
       join dtb_customer c on c.id = p.customer_id
      where c.email = $1 and r.product_class_id = $2 and r.deleted_at is null`, [メール, 商品規格ID])[0].n);
}
