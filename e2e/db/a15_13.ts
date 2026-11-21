/**
 * A15-13 デッキ情報検索（デッキビルダーの API）の DB の参照。参照だけ（lib/db.ts は読み取り専用）。
 * 物理名はこのファイルの SQL の中にだけ書き、呼び出す側には業務の言葉の関数名で見せる。
 */
import { query } from "../lib/db";

/** フォーマットIDのフォーマットの登録件数（削除済みも数える） */
export function フォーマットの登録件数(フォーマットID: string): number {
  return Number(query(`select count(*)::text as n from mtb_format where id = $1::int`, [フォーマットID])[0]?.n ?? "0");
}
