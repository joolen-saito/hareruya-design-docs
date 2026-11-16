/**
 * F06-03 ログインのシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文・印の確かめ・行数の上限・ログ）。
 * 書く先は、E2E が画面で作った「実行の印つき」の会員（メールアドレスに実行の印が入っている）だけ。
 *
 * 保存パスワードの作り方: bcrypt の保存値（下の パスワードを設定する）。
 */
import { bcryptHash } from "../lib/bcrypt";
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

function 確かめ(メール: string) {
  return {
    対象の確かめ: "select id, email from dtb_customer where email = $1 and email like $2",
    確かめのparams: [メール, `%${RUN_MARK}%`],
    印: RUN_MARK,
  };
}

/**
 * 画面の入力規則（12文字以上・50文字以下・半角・メールアドレスと同じは不可）に合わないパスワードを、保存パスワードとして直接設定する。
 * いまのアプリは会員のパスワードを自動選択の方式（app/config/eccube/packages/security.yaml の Customer: algorithm 'auto'）で照合し、
 * 新しく登録した会員は塩を持たない（bcrypt の保存値）。塩と認証用の鍵で作る旧方式は使えず「塩を読めない」で止まった（2026-11-13 の 034〜039）。
 * F06-27 と同じく bcrypt（lib/bcrypt.ts。既知の試験値で計算を確かめてから使う）で保存値を作る。アプリの秘密の値は使わない。
 */
export function パスワードを設定する(メール: string, パスワード: string): void {
  const 保存値 = bcryptHash(パスワード);
  const n = writeTestData({
    理由: `会員 ${メール} の保存パスワードを、画面で指定できない値（入力規則に合わないもの）の保存値に設定する`,
    sql: "update dtb_customer set password = $2 where email = $1",
    params: [メール, 保存値], ...確かめ(メール), 最大行数: 1,
  });
  if (n !== 1) throw new Error(`パスワードの設定: 書き換えた行が ${n} 行（1行のはず）`);
  const r = query("select password from dtb_customer where email = $1", [メール]);
  if (r.length !== 1 || r[0].password !== 保存値) throw new Error(`会員 ${メール} の保存パスワードが、書いた値になっていない`);
}
