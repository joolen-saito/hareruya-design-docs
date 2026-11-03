/** F06-02 本会員登録のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 秘密鍵を持つ会員の数（削除されたものを含めて数える） */
export function 秘密鍵を持つ会員数(秘密鍵: string): number {
  return Number(query(`select count(*) as n from dtb_customer where secret_key = $1`, [秘密鍵])[0].n);
}
