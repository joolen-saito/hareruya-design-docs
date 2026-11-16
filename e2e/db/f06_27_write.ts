/**
 * F06-27 のシードの、画面で作れない部分（ポリシー違反のパスワード）を DB で整える書き込み（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口）を通す。書く先は、E2E が画面で作った実行の印つきの会員だけ。
 * 物理名はこのファイルの SQL の中にだけ書く。
 *
 * 保存値の作り方: シード表「標準のパスワード生成処理で作った保存値に置き換える」。アプリの会員のパスワードは自動選択の方式で照合し、
 * bcrypt の保存値を照合できるので、bcrypt（lib/bcrypt.ts。既知の試験値で計算を確かめてから使う）で作る。アプリの秘密の値は使わない。
 */
import { bcryptHash } from "../lib/bcrypt";
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

/** 画面の入力規則（12文字以上）に合わないパスワードを、印つきの会員の保存パスワードに設定する。設定後に保存値が書いた値になったことを読んで確かめる */
export function ポリシー違反のパスワードを設定する(メール: string, パスワード: string): void {
  const 保存値 = bcryptHash(パスワード);
  const n = writeTestData({
    理由: `会員 ${メール} の保存パスワードを、画面で指定できない値（12文字未満）の保存値に置き換える`,
    sql: "update dtb_customer set password = $2 where email = $1",
    params: [メール, 保存値],
    対象の確かめ: "select id, email from dtb_customer where email = $1 and email like $2",
    確かめのparams: [メール, `%${RUN_MARK}%`],
    印: RUN_MARK,
    最大行数: 1,
  });
  if (n !== 1) throw new Error(`保存パスワードの置き換え: 書き換えた行が ${n} 行（1行のはず）`);
  const r = query("select password from dtb_customer where email = $1", [メール]);
  if (r.length !== 1 || r[0].password !== 保存値) throw new Error(`会員 ${メール} の保存パスワードが、書いた値になっていない`);
}
