/** F06-03 ログインのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 本店（店舗ID 1）のログイン状態の保持の設定 */
export function ログイン状態の保持が有効か(): boolean {
  return query(`select option_remember_me as v from dtb_base_info where id = 1`)[0]?.v === "true";
}
