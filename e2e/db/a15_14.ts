/**
 * A15-14 メタゲーム情報参照（デッキビルダーの API）の DB の参照（読むだけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

/** フォーマットの番号の行の件数（削除済みの行も数える。シード表の「登録件数0件」の確かめ） */
export function フォーマットの行の件数(番号: number): number {
  return Number(query("select count(*)::text as c from mtb_format where id = $1", [番号])[0]?.c ?? "0");
}

/** フォーマットに紐付く、削除されていない大会デッキの件数（シード表の「ほかの公開・大会デッキは0件」の確かめ） */
export function フォーマットのデッキの件数(フォーマット番号: string): number {
  return Number(query("select count(*)::text as c from dtb_deck where format_id = $1", [Number(フォーマット番号)])[0]?.c ?? "0");
}
