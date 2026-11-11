/**
 * M08-14 のシードが、画面で作った「実行の印つき」の会員を整えるための DB 書き込み（db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通す）。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲。書き換える会員は、メールアドレスに実行の印を含む会員だけ。
 * 書く理由: 退会は、フロントの退会の操作（スマレジの会員削除を伴う）が開発環境で完了しないときだけ、同じ結果（退会ステータス・削除フラグ）をDBで作る。
 */
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

/** 印つきの会員を退会済み（会員ステータス「退会」・削除フラグ有効）にする */
export function 会員を退会済みにする(会員ID: string): void {
  writeTestData({
    理由: "退会済みの会員を作る（フロントの退会の操作が完了しなかったとき）",
    sql: `update dtb_customer set customer_status_id = 3, del_flg = 1 where id = $1::int`,
    params: [会員ID],
    対象の確かめ: `select c.id as 会員ID, c.email as メール from dtb_customer c where c.id = $1::int and c.email like $2`,
    確かめのparams: [会員ID, `%${RUN_MARK}%`],
    印: RUN_MARK,
    最大行数: 1,
  });
}
