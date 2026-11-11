/**
 * F06-21 退会のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す。書く先は、メールアドレスに実行の印が入っている会員の選手情報だけ。物理名はここの SQL の中にだけ書く。
 */
import { writeTestData } from "./write_adapter";

/** 印つきの会員の選手情報から、スマレジの会員番号と「スマレジ会員が存在する」の印を外す（外部のスマレジへ通信せずに退会できる状態にする） */
export function スマレジ連携を外す(メール: string): number {
  return writeTestData({
    理由: `会員 ${メール} の選手情報のスマレジ会員番号を未設定にする（退会でスマレジへ通信させない）`,
    sql: "update dtb_player set smaregi_id = null, exists_smaregi_flg = false where customer_id = (select id from dtb_customer where email = $1)",
    params: [メール],
    対象の確かめ: "select c.id, c.email from dtb_customer c join dtb_player p on p.customer_id = c.id where c.email = $1",
    確かめのparams: [メール], 印: メール, 最大行数: 1,
  });
}
