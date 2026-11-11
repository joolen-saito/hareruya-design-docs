/**
 * M08-12 顧客グループ管理のシードが、画面で作った「実行の印つき」の顧客グループに行う DB 書き込み。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 * 書き換える顧客グループは、名称に実行の印を含むものだけ（含まなければ書かずに止まる）。マスタ・設定・ほかの人のデータには書かない。
 *
 * 書く理由: 更新日時は画面で指定できない（保存した現在日時になる）。更新日時の更新を確かめるケースの前提「更新日時 2026-01-01 00:00:00」に合わせる。
 */
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

export function 更新日時を設定する(顧客グループID: string, 日本時間: string): void {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(日本時間)) throw new Error(`日時の形が違う: ${日本時間}`);
  writeTestData({
    理由: "印つきの顧客グループの更新日時を設定する（更新日時は画面で指定できない）",
    sql: `update dtb_customer_group set update_date = $2::timestamptz where id = $1::int`,
    params: [顧客グループID, `${日本時間}+09:00`],
    対象の確かめ: `select id, name from dtb_customer_group where id = $1::int`,
    確かめのparams: [顧客グループID],
    印: RUN_MARK,
    最大行数: 1,
  });
}
