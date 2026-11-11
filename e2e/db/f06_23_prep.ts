/**
 * F06-23 お問い合わせ履歴のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す。書く先は、メールアドレスに実行の印が入っている、E2E が画面で送ったお問い合わせだけ。
 * 物理名はここの SQL の中にだけ書く。
 */
import { writeTestData } from "./write_adapter";

/** 印つきのお問い合わせの送信日時（日本時間。例 "2026-08-01 09:05"）を設定する。送信日時は画面で指定できない */
export function 送信日時を設定する(番号: string, メール: string, 日時: string): void {
  if (!/^\d+$/.test(番号)) throw new Error(`お問い合わせ番号が数字でない（${番号}）`);
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(日時)) throw new Error(`日時の形が違う（${日時}）`);
  const n = writeTestData({
    理由: `お問い合わせ ${番号}（${メール}）の送信日時を ${日時} にする`,
    sql: "update dtb_contact set create_date = ($1)::timestamptz where id = ($2)::int",
    params: [`${日時}:00+09`, 番号],
    対象の確かめ: "select c.id, c.email from dtb_contact c where c.id = $1::int",
    確かめのparams: [番号], 印: メール, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`お問い合わせ ${番号} の送信日時を書いた行が ${n} 行（1行のはず）`);
}
