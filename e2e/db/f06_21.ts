/** F06-21 退会のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 会員の状態 = { id: string; メール: string; 削除済み: string };

/** メールアドレスの会員（削除済みを含む）の削除フラグ */
export function 退会試験の会員(メール: string): 会員の状態[] {
  return query(`select id, email, del_flg from dtb_customer where email = $1 order by id`, [メール]).map((r) => ({ id: r.id!, メール: r.email ?? "", 削除済み: r.del_flg ?? "" }));
}
