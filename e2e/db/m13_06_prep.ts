/**
 * M13-06 イベント申込一覧のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す。書く先は、実行の印つきのイベント名のイベントの申込だけ。物理名はこのファイルの SQL の中にだけ書く。
 */
import { writeTestData } from "./write_adapter";

/** 印つきの申込の申込日時（日本時間。例 "2026-08-05 09:30"。null なら変えない）と支払番号を設定する。どちらも画面では決められない */
export function 申込日時と支払番号を設定する(申込ID: string, 申込日時: string | null, 支払番号: string, 印: string): void {
  if (!/^\d+$/.test(申込ID)) throw new Error(`申込IDが数字でない（${申込ID}）`);
  if (申込日時 !== null && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(申込日時)) throw new Error(`日時の形が違う（${申込日時}）`);
  const n = writeTestData({
    理由: `実行の印つきの申込 ${申込ID} の${申込日時 ? `申込日時を ${申込日時} に、` : ""}支払番号を ${支払番号} にする（画面には設定する操作が無い）`,
    sql: "update dtb_event_entry set payment_no = $1, create_date = coalesce(nullif($2, '')::timestamptz, create_date) where id = $3::int",
    params: [支払番号, 申込日時 ? `${申込日時}:00+09` : "", 申込ID],
    対象の確かめ: `select ev.name_jp as 印つきの名前 from dtb_event_entry ee join dtb_event_detail d on d.id = ee.event_detail_id join dtb_event ev on ev.id = d.event_id where ee.id = $1::int`,
    確かめのparams: [申込ID],
    印,
    最大行数: 1,
  });
  if (n !== 1) throw new Error(`申込 ${申込ID} の書き込みが ${n} 行（1行のはず）`);
}
