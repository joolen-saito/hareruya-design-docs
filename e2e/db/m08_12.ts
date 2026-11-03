/** M08-12 顧客グループ管理のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** 顧客グループIDの顧客グループの件数（0または1。削除済みのレコードとして残る作りなら、残った行も数える） */
export function 顧客グループの件数(顧客グループID: string): number {
  return Number(query(`select count(*) as n from dtb_customer_group where id = $1::int`, [顧客グループID])[0].n);
}

/** 名称が一致する顧客グループの件数 */
export function 名称の顧客グループの件数(名称: string): number {
  return Number(query(`select count(*) as n from dtb_customer_group where name = $1`, [名称])[0].n);
}

/** 会員のプレイヤーID（画面に表示されないので、DBの参照で控える） */
export function 会員のプレイヤーID(会員ID: string): string | null {
  return query(`select id as v from dtb_player where customer_id = $1::int`, [会員ID])[0]?.v ?? null;
}
