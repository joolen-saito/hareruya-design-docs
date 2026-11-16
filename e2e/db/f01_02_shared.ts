/**
 * F01-02（支店ECTOP）の、共有の設定を書き換えて戻すケースのシードが、画面で作れない部分を DB で整える書き込み。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口）を通す。
 *
 * 書く先は E2E が画面で作った行だけ（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）:
 * - 決まった印の試験支店のタイルの行（支店トップページ管理は常に4行を登録し、行を消す操作が無い。047 の「タイル未割当区画」）。
 * - 実行の印つきのカードセットの表示用HTML（カードセット登録・編集に入力欄が無い。071）。
 */
import { writeTestData } from "./write_adapter";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}

/** 支店（店名に 印 を含む E2E の支店）のタイルのうち、区画の番号の行を消す。消した行数を返す */
export function 支店のタイルの行を消す(支店ID: string, 区画: number, 印: string): number {
  return writeTestData({
    理由: `試験支店（店舗ID ${支店ID}）の支店トップページのタイルのうち、区画 ${区画} の行を消す（タイル未割当区画を作る）`,
    sql: "delete from dtb_tile t where t.base_info_id = $1::int and t.section = $2::int",
    params: [数字(支店ID), 区画],
    対象の確かめ: "select t.id, b.shop_name from dtb_tile t join dtb_base_info b on b.id = t.base_info_id where t.base_info_id = $1::int and t.section = $2::int",
    確かめのparams: [数字(支店ID), 区画],
    印, 最大行数: 1,
  });
}

/** カードセット（名称に実行の印を含む E2E のカードセット）の表示用HTML（フリーエリア(日)）を設定する */
export function カードセットの表示用HTMLを設定する(カードセットID: string, html: string, 印: string): number {
  return writeTestData({
    理由: `カードセットID ${カードセットID} の表示用HTMLを設定する（カードセット登録・編集に入力欄が無い）`,
    sql: "update mtb_cardset c set free_area_jp = $2 where c.id = $1::int",
    params: [数字(カードセットID), html],
    対象の確かめ: "select c.id, c.name_jp from mtb_cardset c where c.id = $1::int",
    確かめのparams: [数字(カードセットID)],
    印, 最大行数: 1,
  });
}
