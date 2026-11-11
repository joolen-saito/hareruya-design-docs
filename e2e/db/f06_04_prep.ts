/**
 * F06-04 パスワード再発行のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文・印の確かめ・行数の上限・ログ）。
 * 書く先は、E2E が画面で作った「実行の印つき」の会員（メールアドレスに実行の印が入っている）だけ。
 */
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

function 確かめ(メール: string) {
  return {
    対象の確かめ: "select id, email from dtb_customer where email = $1 and email like $2",
    確かめのparams: [メール, `%${RUN_MARK}%`],
    印: RUN_MARK,
  };
}

function 一行(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き換えた行が ${n} 行（1行のはず）`);
}

/** リセットキーの有効期限を書き換える（画面では、発行時刻の24時間後より前にできない） */
export function 有効期限を設定する(メール: string, 日時: string): void {
  一行(writeTestData({
    理由: `会員 ${メール} のリセットキーの有効期限を ${日時} に設定する`,
    sql: "update dtb_customer set reset_expire = $2 where email = $1",
    params: [メール, 日時], ...確かめ(メール), 最大行数: 1,
  }), "有効期限の設定");
}

/** 会員を退会済みにする（画面の退会はメールアドレスをダミーに替えるので、元のメールアドレスのまま退会済みの会員は画面で作れない） */
export function 退会済みにする(メール: string): void {
  一行(writeTestData({
    理由: `会員 ${メール} を退会済みにする`,
    sql: "update dtb_customer set customer_status_id = 3, del_flg = 1 where email = $1",
    params: [メール], ...確かめ(メール), 最大行数: 1,
  }), "退会済みの設定");
}

/** 仮会員にリセットキーと有効期限を設定する（画面の再発行は、仮会員にはリセットキーを発行しない） */
export function リセットキーを設定する(メール: string, キー: string, 有効期限: string): void {
  一行(writeTestData({
    理由: `会員 ${メール} にリセットキーと有効期限 ${有効期限} を設定する`,
    sql: "update dtb_customer set reset_key = $2, reset_expire = $3 where email = $1",
    params: [メール, キー, 有効期限], ...確かめ(メール), 最大行数: 1,
  }), "リセットキーの設定");
}
