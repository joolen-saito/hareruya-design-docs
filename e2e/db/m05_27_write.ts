/**
 * M05-27 店頭注文番号札の、DB の書き込み（シードの準備。実行の印つきの店舗の番号札だけ）。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 画面の登録は番号札を半角英字だけに限る（シード表の「ALPHA-001」「TAG-M0527-027-A1」のようなハイフン・数字つきの値は画面で指定できない）ので、
 * 画面で英字だけの値で登録した番号札の値を、シード表の値に書き換える。
 * 書き換え・削除するのは、使い回す E2E の店舗（店舗IDの表。lib/store_create_ban.ts）の番号札だけ（E2E の店舗でなければ対象の確かめが空になり止まる。依頼者 2026-11-15「店舗は作らず使い回す」）。
 * 物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { E2Eの店舗 } from "../lib/store_create_ban";
import { writeTestData } from "./write_adapter";

/** M05-27 専用の試験用店舗の店名に付く固定の印（seeds/m05-27.ts） */
const 印 = "E2Eの店舗";
/** 書き換え・削除してよい店舗: 使い回す E2E の店舗（lib/store_create_ban.ts の E2Eの店舗）だけ。元からある店舗の番号札は触らない */
const E2E店舗ID = E2Eの店舗.map((s) => s.id).join(",");

/** 番号札（番号札ID）の値を書き換える（この実行の印つきの店舗の番号札だけ） */
export function 番号札の値を書き換える(番号札ID: string, 値: string): void {
  writeTestData({
    理由: "番号札をシード表の値（ハイフン・数字を含む）にする（画面の登録は半角英字しか受け付けないため画面で指定できない）",
    sql: `update dtb_waiting_tag set waiting_tag = $1 where id = $2::int`,
    params: [値, 番号札ID],
    対象の確かめ: `select t.id as 番号札ID, $3::text as 店舗の区分 from dtb_waiting_tag t where t.id = $1::int and t.base_info_id = any(string_to_array($2, ',')::int[])`,
    確かめのparams: [番号札ID, E2E店舗ID, 印],
    印,
    最大行数: 1,
  });
}

/** 試験用店舗（店舗ID）の番号札を全件消す。消した件数を返す（0件なら何もしない。印を含まない店舗なら止まる） */
export function 店舗の番号札を全件消す(店舗ID: string): number {
  if (query(`select 1 from dtb_waiting_tag where base_info_id = $1::int`, [店舗ID]).length === 0) return 0;
  return writeTestData({
    理由: "試験用店舗の前の実行の番号札を消す（ケースは「その店舗の番号札がこれだけ」を前提にし、番号札の値は10文字までで実行の印を付けられないため）",
    sql: `delete from dtb_waiting_tag where base_info_id = $1::int`,
    params: [店舗ID],
    対象の確かめ: `select t.id as 番号札ID, $3::text as 店舗の区分 from dtb_waiting_tag t where t.base_info_id = $1::int and t.base_info_id = any(string_to_array($2, ',')::int[])`,
    確かめのparams: [店舗ID, E2E店舗ID, 印],
    印,
    最大行数: 100,
  });
}
