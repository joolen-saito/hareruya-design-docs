/**
 * F03-07 のシードが、画面で作った「実行の印つき」のデータに足す DB 書き込み。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *  - 書き換えるのは、この実行の印を含むメールアドレスの会員の入荷通知依頼だけ。
 *  - 物理名はこのファイルの SQL の中にだけ書く。
 * 理由: 入荷通知依頼の削除日時は、画面から指定できない（取消の操作は、そのときの日時になる）。
 */
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK.toUpperCase();

/** 入荷通知依頼に、削除日時（日本時間）を設定する。対象は印つきの会員の、削除日時がまだ無い依頼1件 */
export function 依頼に削除日時を設定する(依頼ID: string, 日時: string): void {
  const n = writeTestData({
    理由: `入荷通知依頼 ${依頼ID} に削除日時 ${日時} を設定する（画面では日時を指定できない）`,
    sql: `update dtb_product_request set deleted_at = ($1::text || '+09')::timestamptz where id = $2::int and deleted_at is null`,
    params: [日時, 依頼ID],
    対象の確かめ: `select r.id as 依頼ID, upper(c.email) as メール
        from dtb_product_request r join dtb_player p on p.id = r.player_id join dtb_customer c on c.id = p.customer_id
       where r.id = $1::int and r.deleted_at is null and upper(c.email) like $2`,
    確かめのparams: [依頼ID, `%${印}%`],
    印, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`入荷通知依頼 ${依頼ID} の削除日時を設定するはずが ${n} 行だった`);
}
