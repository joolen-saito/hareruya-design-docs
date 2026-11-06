/** M14-08 の残りのケース用DB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export function カードセットの件数(名日: string): number {
  return Number(query(`select count(*) as n from mtb_cardset where name_jp = $1`, [名日])[0].n);
}

export function カードセットIDの件数(id: string | number): number {
  return Number(query(`select count(*) as n from mtb_cardset where id = $1`, [id])[0].n);
}
